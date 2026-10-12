import { useEffect, useState } from 'react';
import { X, LogIn, UserPlus, Building2, MailCheck, Loader2, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/contexts/AppContext';
import { COMPANY_FIELDS, REQUIRED_COMPANY_FIELDS, emptyCompanyProfile, loadCompanyProfile, missingCompanyFields, saveCompanyProfile } from '@/lib/customerProfile';
import { clearPendingRequest, savePendingRequest, type PendingRequest } from '@/lib/pendingRequest';
import type { CompanyProfile } from '@/customer/types';
import { PasswordInput, GoogleSignInButton } from './AuthExtras';
import { authReturnUrl, isEmailNotConfirmed, resendConfirmation } from '@/lib/authRedirect';

type Step = 'login' | 'register' | 'company' | 'confirm-email';
type Pending = Omit<PendingRequest, 'savedAt'>;

interface OpenState {
  step: Step;
  pending: Pending;
  resolve: (email: string | null) => void;
}

let openGate: ((s: OpenState) => void) | null = null;

/**
 * Makes sure the visitor is a signed-in customer with a company profile before a
 * request is sent. Resolves with the account email to put on the request, or null
 * if the visitor closed the dialog (or must first confirm their email — the request
 * is then kept on the device and sent from the account page after they sign in).
 */
export async function requireCustomer(pending: Pending): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user?.email) {
    const profile = await loadCompanyProfile(session.user.id).catch(() => null);
    if (profile && missingCompanyFields(profile).length === 0) {
      clearPendingRequest();
      return session.user.email;
    }
  }
  if (!openGate) return null;
  return new Promise((resolve) => openGate!({ step: session ? 'company' : 'login', pending, resolve }));
}

export default function CustomerGate() {
  const { lang, dir } = useApp();
  const ar = lang === 'ar';
  const [state, setState] = useState<OpenState | null>(null);
  const [step, setStep] = useState<Step>('login');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [company, setCompany] = useState<CompanyProfile>(emptyCompanyProfile());
  const [invalid, setInvalid] = useState<(keyof CompanyProfile)[]>([]);
  const [notConfirmed, setNotConfirmed] = useState(false);
  const [resend, setResend] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  const [resendError, setResendError] = useState('');

  useEffect(() => {
    openGate = (s) => {
      setState(s);
      setStep(s.step);
      setError(null);
      setInvalid([]);
      setNotConfirmed(false);
      setResend('idle');
      if (s.step === 'company') {
        supabase.auth.getSession().then(async ({ data: { session } }) => {
          if (!session?.user) return;
          const existing = await loadCompanyProfile(session.user.id).catch(() => null);
          const meta = session.user.user_metadata || {};
          setCompany({
            ...emptyCompanyProfile(),
            ...(existing || {}),
            contactPerson: existing?.contactPerson || meta.full_name || '',
            companyPhone: existing?.companyPhone || meta.mobile || '',
            officialEmail: existing?.officialEmail || session.user.email || '',
          });
        });
      }
    };
    return () => {
      openGate = null;
    };
  }, []);

  useEffect(() => {
    if (!state) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [state]);

  if (!state) return null;

  const finish = (result: string | null) => {
    state.resolve(result);
    setState(null);
    setPassword('');
    setConfirmPassword('');
  };

  // After signing in: go straight on if a complete company profile exists, otherwise ask for it.
  const continueAfterAuth = async (userId: string, userEmail: string, meta: { full_name?: string; mobile?: string }) => {
    const existing = await loadCompanyProfile(userId).catch(() => null);
    if (existing && missingCompanyFields(existing).length === 0) {
      clearPendingRequest();
      finish(userEmail);
      return;
    }
    setCompany({
      ...emptyCompanyProfile(),
      ...(existing || {}),
      contactPerson: existing?.contactPerson || meta.full_name || '',
      companyPhone: existing?.companyPhone || meta.mobile || '',
      officialEmail: existing?.officialEmail || userEmail,
    });
    setStep('company');
  };

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotConfirmed(false);
    setResend('idle');
    if (!email.trim() || !password) {
      setError(ar ? 'أدخل البريد الإلكتروني وكلمة المرور' : 'Enter your email and password');
      return;
    }
    setBusy(true);
    const { data, error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (isEmailNotConfirmed(err)) {
      // Keep the request so it is sent once they confirm and sign in.
      savePendingRequest(state.pending);
      setNotConfirmed(true);
      setError(ar ? 'حسابك لم يُفعّل بعد. افتح رابط التفعيل الذي أرسلناه إلى بريدك، أو اطلب رابطاً جديداً.' : 'Your account is not activated yet. Open the activation link we emailed you, or request a new one.');
      return;
    }
    if (err || !data.user) {
      setError(ar ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Incorrect email or password');
      return;
    }
    await continueAfterAuth(data.user.id, data.user.email || email.trim(), data.user.user_metadata || {});
  };

  const onRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!fullName.trim() || !mobile.trim() || !email.includes('@')) {
      setError(ar ? 'أكمل الاسم ورقم الجوال والبريد الإلكتروني' : 'Fill in your name, mobile and email');
      return;
    }
    if (password.length < 6) {
      setError(ar ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError(ar ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }
    setBusy(true);
    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim(), mobile: mobile.trim() },
        emailRedirectTo: authReturnUrl('verified'),
      },
    });
    setBusy(false);
    if (err) {
      console.error('Registration failed', err);
      setError(ar ? 'تعذر إنشاء الحساب. تحقق من البيانات، أو سجّل الدخول إن كان لديك حساب.' : 'Could not create the account. Check your details, or sign in if you already have one.');
      return;
    }
    if (data.session && data.user) {
      await continueAfterAuth(data.user.id, data.user.email || email.trim(), { full_name: fullName, mobile });
    } else {
      // Email confirmation required: keep the request on this device and send it after sign-in.
      savePendingRequest(state.pending);
      setStep('confirm-email');
    }
  };

  const onSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const missing = missingCompanyFields(company);
    setInvalid(missing);
    if (missing.length) {
      setError(ar ? 'أكمل الحقول المطلوبة المعلّمة بـ *' : 'Fill in the required fields marked *');
      return;
    }
    setBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) {
        setStep('login');
        return;
      }
      await saveCompanyProfile(session.user.id, company);
      clearPendingRequest();
      finish(session.user.email);
    } catch (err) {
      console.error('Saving company profile failed', err);
      setError(ar ? 'تعذر حفظ بيانات الشركة، حاول مرة أخرى' : 'Could not save the company profile, please try again');
    } finally {
      setBusy(false);
    }
  };

  const onResend = async () => {
    setResend('sending');
    const err = await resendConfirmation(email, ar);
    setResendError(err || '');
    setResend(err ? 'failed' : 'sent');
  };

  const resendBlock = (
    <div className="space-y-2">
      <button type="button" onClick={onResend} disabled={resend === 'sending' || resend === 'sent' || !email.includes('@')} className="btn-secondary w-full justify-center text-sm disabled:opacity-60">
        {resend === 'sending' ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
        {ar ? 'إعادة إرسال رابط التفعيل' : 'Resend activation link'}
      </button>
      {resend === 'sent' && <p role="status" className="text-xs text-green-500 text-center">{ar ? 'أرسلنا رابط تفعيل جديداً. تحقق من بريدك (وملف الرسائل غير المرغوب فيها).' : 'We sent a new activation link. Check your inbox (and spam folder).'}</p>}
      {resend === 'failed' && <p role="alert" className="text-xs text-red-500 text-center">{resendError}</p>}
    </div>
  );

  const googleBlock = (
    <GoogleSignInButton beforeRedirect={() => savePendingRequest(state.pending)} onError={setError} />
  );

  const input = 'w-full px-4 py-3 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';
  const label = 'block text-xs font-semibold text-base-muted mb-1.5';

  const header = {
    login: { icon: LogIn, ar: 'سجّل الدخول لإرسال طلبك', en: 'Sign in to send your request' },
    register: { icon: UserPlus, ar: 'أنشئ حسابك لإرسال الطلب', en: 'Create your account to send the request' },
    company: { icon: Building2, ar: 'بيانات الشركة', en: 'Company profile' },
    'confirm-email': { icon: MailCheck, ar: 'فعّل حسابك من البريد', en: 'Confirm your email' },
  }[step];
  const HeaderIcon = header.icon;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4 animate-fade-in" dir={dir} onClick={() => finish(null)}>
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-elevated border border-base rounded-t-2xl sm:rounded-2xl shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-elevated border-b border-base p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-yellow-accent/10 border border-yellow-accent/30 flex items-center justify-center shrink-0">
              <HeaderIcon size={20} className="text-yellow-accent" />
            </div>
            <div className="min-w-0">
              <h2 className="font-black text-base-primary truncate">{ar ? header.ar : header.en}</h2>
              <p className="text-xs text-base-muted truncate">{state.pending.label}</p>
            </div>
          </div>
          <button type="button" onClick={() => finish(null)} aria-label={ar ? 'إغلاق' : 'Close'} className="p-2 rounded-lg border border-base text-base-muted hover:text-yellow-accent">
            <X size={18} />
          </button>
        </div>

        {/* Progress: account -> company -> sent */}
        {step !== 'confirm-email' && (
          <ol className="flex items-center gap-2 px-5 pt-4 text-xs font-semibold">
            {[
              { done: step === 'company', active: step === 'login' || step === 'register', ar: 'الحساب', en: 'Account' },
              { done: false, active: step === 'company', ar: 'بيانات الشركة', en: 'Company' },
              { done: false, active: false, ar: 'إرسال الطلب', en: 'Send' },
            ].map((s, i) => (
              <li key={i} className={`flex-1 flex items-center gap-1.5 ${s.active ? 'text-yellow-accent' : s.done ? 'text-green-500' : 'text-base-muted'}`}>
                <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${s.active ? 'border-yellow-accent bg-yellow-accent/10' : s.done ? 'border-green-500 bg-green-500/10' : 'border-base'}`}>{i + 1}</span>
                {ar ? s.ar : s.en}
              </li>
            ))}
          </ol>
        )}

        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2 text-sm text-red-500">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {step === 'login' && (
            <form onSubmit={onLogin} className="space-y-4">
              <p className="text-sm text-base-muted">{ar ? 'طلبك جاهز. سجّل الدخول ليُرسل باسم حسابك وتتابعه من لوحة العميل.' : 'Your request is ready. Sign in so it is sent from your account and you can follow it in your dashboard.'}</p>
              {notConfirmed && resendBlock}
              {googleBlock}
              <div><label className={label}>{ar ? 'البريد الإلكتروني' : 'Email'}</label><input type="email" dir="ltr" autoComplete="email" className={input} value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div><label className={label}>{ar ? 'كلمة المرور' : 'Password'}</label><PasswordInput autoComplete="current-password" className={input} value={password} onChange={setPassword} /></div>
              <button type="submit" disabled={busy} className="btn-primary w-full justify-center disabled:opacity-60">
                {busy ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
                {ar ? 'تسجيل الدخول' : 'Sign in'}
              </button>
              <div className="flex items-center justify-between text-sm">
                <a href="#/account" onClick={() => { try { sessionStorage.setItem('sahab.authView', 'forgot'); } catch { /* ignore */ } savePendingRequest(state.pending); finish(null); }} className="text-base-muted hover:text-yellow-accent">{ar ? 'نسيت كلمة المرور؟' : 'Forgot password?'}</a>
                <button type="button" onClick={() => { setStep('register'); setError(null); }} className="font-bold text-yellow-accent hover:underline">
                  {ar ? 'ليس لديك حساب؟ أنشئ حساباً' : "No account? Create one"}
                </button>
              </div>
            </form>
          )}

          {step === 'register' && (
            <form onSubmit={onRegister} className="space-y-4">
              {googleBlock}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className={label}>{ar ? 'الاسم الكامل' : 'Full name'} *</label><input className={input} autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
                <div><label className={label}>{ar ? 'رقم الجوال' : 'Mobile'} *</label><input type="tel" dir="ltr" autoComplete="tel" placeholder="05xxxxxxxx" className={input} value={mobile} onChange={(e) => setMobile(e.target.value)} /></div>
              </div>
              <div><label className={label}>{ar ? 'البريد الإلكتروني' : 'Email'} *</label><input type="email" dir="ltr" autoComplete="email" className={input} value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className={label}>{ar ? 'كلمة المرور' : 'Password'} *</label><PasswordInput autoComplete="new-password" className={input} value={password} onChange={setPassword} /></div>
                <div><label className={label}>{ar ? 'تأكيد كلمة المرور' : 'Confirm password'} *</label><PasswordInput autoComplete="new-password" className={input} value={confirmPassword} onChange={setConfirmPassword} /></div>
              </div>
              <button type="submit" disabled={busy} className="btn-primary w-full justify-center disabled:opacity-60">
                {busy ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                {ar ? 'إنشاء الحساب والمتابعة' : 'Create account & continue'}
              </button>
              <button type="button" onClick={() => { setStep('login'); setError(null); }} className="w-full text-sm text-base-muted hover:text-yellow-accent">
                {ar ? 'لديك حساب؟ سجّل الدخول' : 'Have an account? Sign in'}
              </button>
            </form>
          )}

          {step === 'company' && (
            <form onSubmit={onSaveCompany} className="space-y-4">
              <p className="text-sm text-base-muted">{ar ? 'خطوة واحدة لمرة واحدة: بيانات شركتك تُستخدم في عروض الأسعار والعقود.' : 'One-time step: your company details are used on quotations and contracts.'}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {COMPANY_FIELDS.map((f) => {
                  const required = REQUIRED_COMPANY_FIELDS.includes(f.key);
                  const bad = invalid.includes(f.key) && !company[f.key].trim();
                  return (
                    <div key={f.key} className={f.key === 'companyName' || f.key === 'address' ? 'sm:col-span-2' : ''}>
                      <label className={label}>{ar ? f.labelAr : f.labelEn}{required && ' *'}</label>
                      <input
                        className={`${input} ${bad ? 'border-red-500/70' : ''}`}
                        dir={f.ltr ? 'ltr' : undefined}
                        placeholder={f.placeholder}
                        value={company[f.key]}
                        onChange={(e) => setCompany((c) => ({ ...c, [f.key]: e.target.value }))}
                      />
                    </div>
                  );
                })}
              </div>
              <button type="submit" disabled={busy} className="btn-primary w-full justify-center disabled:opacity-60">
                {busy ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} className={dir === 'rtl' ? 'rotate-180' : ''} />}
                {ar ? 'حفظ وإرسال الطلب' : 'Save & send request'}
              </button>
            </form>
          )}

          {step === 'confirm-email' && (
            <div className="space-y-4 text-center py-2">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                <MailCheck size={30} className="text-green-500" />
              </div>
              <p className="text-base-primary font-bold">{ar ? 'تم إنشاء حسابك' : 'Your account was created'}</p>
              <p className="text-sm text-base-muted leading-relaxed">
                {ar
                  ? <>أرسلنا رابط التفعيل إلى <span dir="ltr" className="text-base-primary">{email}</span>. افتح الرابط ثم سجّل الدخول، وأكمل بيانات الشركة — <span className="text-yellow-accent font-semibold">طلبك محفوظ على هذا الجهاز وسيُرسل تلقائياً</span>.</>
                  : <>We sent a confirmation link to <span className="text-base-primary">{email}</span>. Open it, sign in and complete your company profile — <span className="text-yellow-accent font-semibold">your request is saved on this device and will be sent automatically</span>.</>}
              </p>
              <p className="text-xs text-base-muted">{ar ? 'لم يصلك البريد؟ تحقق من الرسائل غير المرغوب فيها، أو أعد الإرسال.' : "Didn't get it? Check your spam folder, or resend."}</p>
              {resendBlock}
              <button type="button" onClick={() => finish(null)} className="btn-primary w-full justify-center">{ar ? 'حسناً' : 'OK'}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
