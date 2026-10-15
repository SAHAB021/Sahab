import { useState } from 'react';
import { Mail, ArrowLeft, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';
import { authReturnUrl, emailSendError, takeAuthNotice } from '@/lib/authRedirect';
import { PasswordInput } from '@/components/AuthExtras';
import { useEmployee } from '../EmployeeContext';

const RESET_EXPIRED = {
  ar: 'رابط استعادة كلمة المرور منتهي أو استُخدم من قبل. اطلب رابطاً جديداً وافتح أحدث رسالة فقط.',
  en: 'The password reset link expired or was already used. Request a new one and open only the newest email.',
};

export default function AdminLogin() {
  const { lang, dir } = useApp();
  const { signIn } = useEmployee();
  const ar = lang === 'ar';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [notice] = useState(takeAuthNotice);
  const [forgot, setForgot] = useState(notice === 'reset-link-expired');
  const [error, setError] = useState<string | null>(notice === 'reset-link-expired' ? RESET_EXPIRED[ar ? 'ar' : 'en'] : null);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const inputClass = 'w-full px-4 py-3 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setError(/invalid login credentials/i.test(signInError)
        ? (ar ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Wrong email or password')
        : signInError);
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const target = email.trim();
    if (!target.includes('@')) {
      setError(ar ? 'أدخل بريداً إلكترونياً صحيحاً' : 'Enter a valid email address');
      return;
    }
    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(target, { redirectTo: authReturnUrl('recovery', 'admin') });
    setLoading(false);
    if (resetError) {
      console.error('Password reset failed', resetError);
      setError(emailSendError(resetError, ar));
      return;
    }
    setSentTo(target);
  };

  const backToLogin = () => {
    setForgot(false);
    setSentTo(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-4" dir={dir}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="" aria-hidden="true" className="w-16 h-16 mx-auto mb-4 object-contain shrink-0 rounded-lg" />
          <h1 className="text-2xl font-black text-base-primary">SAHAB Admin</h1>
          <p className="text-sm text-base-muted mt-1">{ar ? 'تسجيل الدخول للوحة التحكم' : 'Sign in to admin dashboard'}</p>
        </div>

        {/* Form */}
        <form onSubmit={forgot ? handleForgot : handleSubmit} className="card-industrial p-6 space-y-4">
          {forgot && (
            <div>
              <h2 className="font-black text-base-primary">{ar ? 'استعادة كلمة المرور' : 'Reset your password'}</h2>
              <p className="text-xs text-base-muted mt-1">{ar ? 'أدخل بريدك وسنرسل لك رابطاً لاختيار كلمة مرور جديدة.' : "Enter your email and we'll send you a link to choose a new password."}</p>
            </div>
          )}
          {sentTo && (
            <div role="status" className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 flex items-start gap-2 text-sm text-base-primary">
              <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
              <span>
                {ar ? 'إذا كان هذا البريد مسجلاً فستصلك رسالة على ' : 'If this email has an account, a reset link was sent to '}
                <bdi className="font-bold">{sentTo}</bdi>
                {ar ? '. افتح الرابط من نفس الجهاز، وتحقق من مجلد الرسائل غير المرغوب فيها.' : '. Open the link on this device, and check your spam folder.'}
              </span>
            </div>
          )}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-sm text-red-500">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-base-muted mb-1.5">{ar ? 'البريد الإلكتروني' : 'Email'}</label>
            <div className="relative">
              <Mail size={16} className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-base-muted" />
              <input
                type="email"
                required
                autoComplete="email"
                className={`${inputClass} ps-10`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@sahab.sa"
                dir="ltr"
              />
            </div>
          </div>

          {!forgot && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="admin-password" className="block text-xs font-semibold text-base-muted">{ar ? 'كلمة المرور' : 'Password'}</label>
                <button type="button" onClick={() => { setForgot(true); setError(null); }} className="text-xs text-base-muted hover:text-yellow-accent">
                  {ar ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                </button>
              </div>
              <PasswordInput id="admin-password" autoComplete="current-password" className={inputClass} value={password} onChange={setPassword} placeholder="••••••••" />
            </div>
          )}

          {forgot ? (
            <>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center disabled:opacity-60">
                <KeyRound size={16} />
                {loading ? (ar ? 'جاري الإرسال...' : 'Sending...') : sentTo ? (ar ? 'إرسال الرابط مرة أخرى' : 'Send the link again') : (ar ? 'إرسال رابط الاستعادة' : 'Send reset link')}
              </button>
              <button type="button" onClick={backToLogin} className="w-full text-sm text-base-muted hover:text-yellow-accent">
                {ar ? 'العودة لتسجيل الدخول' : 'Back to sign in'}
              </button>
            </>
          ) : (
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
              {loading ? (ar ? 'جاري التحقق...' : 'Signing in...') : (ar ? 'تسجيل الدخول' : 'Sign In')}
            </button>
          )}
        </form>

        {/* Back to site */}
        <div className="text-center mt-6">
          <a href="#home" className="text-sm text-base-muted hover:text-yellow-accent transition-colors inline-flex items-center gap-1.5">
            {dir === 'rtl' ? <ArrowLeft size={14} rotate={180} /> : <ArrowLeft size={14} />}
            {ar ? 'العودة للموقع' : 'Back to Site'}
          </a>
        </div>
      </div>
    </div>
  );
}
