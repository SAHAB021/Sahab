import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, X, AlertCircle } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useCustomer } from './CustomerContext';
import AuthPages from './components/AuthPages';
import CompanyOnboarding from './components/CompanyOnboarding';
import CustomerRouter from './CustomerRouter';
import { clearPendingRequest, loadPendingRequest } from '@/lib/pendingRequest';
import { submitPublicRequest } from '@/lib/publicRequests';
import { takeAuthNotice, type AuthNotice } from '@/lib/authRedirect';

const NOTICES: Record<AuthNotice, { ok: boolean; ar: [string, string]; en: [string, string] }> = {
  verified: { ok: true, ar: ['تم تفعيل حسابك بنجاح ✓', 'مرحباً بك في سحاب. يمكنك الآن إرسال طلباتك ومتابعتها من حسابك.'], en: ['Your account is verified ✓', 'Welcome to SAHAB. You can now send and track your requests from your account.'] },
  google: { ok: true, ar: ['تم تسجيل الدخول باستخدام Google', 'مرحباً بك في سحاب.'], en: ['Signed in with Google', 'Welcome to SAHAB.'] },
  'link-expired': { ok: false, ar: ['انتهت صلاحية الرابط', 'الرابط منتهي أو استُخدم من قبل. سجّل الدخول، وإن لم يكن حسابك مفعّلاً اطلب رابط تفعيل جديداً.'], en: ['This link has expired', 'The link expired or was already used. Sign in, and if your account is not active yet request a new activation link.'] },
  'link-error': { ok: false, ar: ['تعذر التحقق من الرابط', 'سجّل الدخول، وإن لم يكن حسابك مفعّلاً اطلب رابط تفعيل جديداً.'], en: ['We could not verify the link', 'Sign in, and if your account is not active yet request a new activation link.'] },
  'reset-link-expired': { ok: false, ar: ['رابط استعادة كلمة المرور منتهي', 'الرابط منتهي أو استُخدم من قبل. اضغط "نسيت كلمة المرور؟" واطلب رابطاً جديداً، ثم افتح أحدث رسالة فقط.'], en: ['This password reset link has expired', 'The link expired or was already used. Click "Forgot password?" to get a new one, then open only the newest email.'] },
  'oauth-error': { ok: false, ar: ['تعذر تسجيل الدخول عبر Google', 'حاول مرة أخرى أو سجّل الدخول بالبريد الإلكتروني.'], en: ['Google sign-in failed', 'Try again or sign in with your email.'] },
};

function AuthNoticeToast({ notice, onClose }: { notice: AuthNotice; onClose: () => void }) {
  const { lang } = useApp();
  const n = NOTICES[notice];
  const [title, body] = lang === 'ar' ? n.ar : n.en;
  useEffect(() => {
    if (!n.ok) return;
    const t = window.setTimeout(onClose, 9000);
    return () => window.clearTimeout(t);
  }, [n.ok, onClose]);
  return (
    <div role={n.ok ? 'status' : 'alert'} className="fixed top-4 inset-x-4 sm:inset-x-auto sm:end-4 z-[160] max-w-md mx-auto sm:mx-0 animate-fade-in-up">
      <div className={`flex items-start gap-3 p-4 rounded-xl border shadow-2xl bg-elevated ${n.ok ? 'border-green-500/40' : 'border-red-500/40'}`}>
        {n.ok ? <CheckCircle2 size={22} className="text-green-500 shrink-0" /> : <AlertCircle size={22} className="text-red-500 shrink-0" />}
        <div className="text-sm flex-1">
          <div className={`font-bold ${n.ok ? 'text-base-primary' : 'text-red-500'}`}>{title}</div>
          <div className="text-base-muted">{body}</div>
        </div>
        <button onClick={onClose} className="text-base-muted hover:text-yellow-accent" aria-label={lang === 'ar' ? 'إغلاق' : 'Close'}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

export default function CustomerApp() {
  const { lang } = useApp();
  const { isAuthenticated, authLoading, hasCompany, user, setView } = useCustomer();
  const [pending] = useState(loadPendingRequest);
  const [sentRef, setSentRef] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const sending = useRef(false);
  const [notice, setNotice] = useState<AuthNotice | null>(null);
  const closeNotice = useCallback(() => setNotice(null), []);

  useEffect(() => {
    const n = takeAuthNotice();
    if (!n) return;
    setNotice(n);
  }, []);

  // A request filled in before signing in (e.g. while confirming the email) is sent
  // once the customer is signed in with a company profile.
  useEffect(() => {
    const p = loadPendingRequest();
    if (!p || !user?.email || hasCompany !== true || sending.current) return;
    sending.current = true;
    submitPublicRequest(p.table, { ...p.row, email: user.email })
      .then((row) => {
        clearPendingRequest();
        setSentRef(row.request_reference || '—');
        setNotice(null);
        setView(p.table === 'rental_requests' ? 'rental-requests' : 'project-requests');
      })
      .catch((err) => {
        console.error('Sending saved request failed', err);
        setSendError(lang === 'ar' ? 'تعذر إرسال طلبك المحفوظ. أعد إرساله من صفحة المعدة أو الخدمة.' : 'Your saved request could not be sent. Please send it again from the equipment or service page.');
        clearPendingRequest();
      });
  }, [user?.email, hasCompany]); // eslint-disable-line react-hooks/exhaustive-deps

  if (authLoading || (isAuthenticated && hasCompany === null)) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-yellow-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const toast = (
    <>
      {notice && <AuthNoticeToast notice={notice} onClose={closeNotice} />}
    </>
  );

  if (!isAuthenticated) {
    return <>{toast}<AuthPages pendingLabel={pending?.label} /></>;
  }

  if (hasCompany === false) {
    return <>{toast}<CompanyOnboarding pendingLabel={pending?.label} /></>;
  }

  return (
    <>
      {toast}
      {(sentRef || sendError) && (
        <div className="fixed top-4 inset-x-4 sm:inset-x-auto sm:end-4 z-[150] max-w-md mx-auto sm:mx-0 animate-fade-in-up">
          <div className={`flex items-start gap-3 p-4 rounded-xl border shadow-2xl bg-elevated ${sentRef ? 'border-green-500/40' : 'border-red-500/40'}`}>
            {sentRef && <CheckCircle2 size={22} className="text-green-500 shrink-0" />}
            <div className="text-sm flex-1">
              {sentRef ? (
                <>
                  <div className="font-bold text-base-primary">{lang === 'ar' ? 'تم إرسال طلبك' : 'Your request was sent'}</div>
                  <div className="text-base-muted">{lang === 'ar' ? 'رقم الطلب: ' : 'Reference: '}<span className="font-mono text-yellow-accent">{sentRef}</span></div>
                </>
              ) : (
                <div className="text-red-500">{sendError}</div>
              )}
            </div>
            <button onClick={() => { setSentRef(null); setSendError(null); }} className="text-base-muted hover:text-yellow-accent" aria-label="close">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
      <CustomerRouter />
    </>
  );
}
