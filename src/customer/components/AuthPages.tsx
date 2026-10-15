import { useState } from 'react';
import { Eye, EyeOff, ArrowRight, ArrowLeft, User, Mail, Phone, Lock, CheckCircle } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useCustomer } from '../CustomerContext';
import { supabase } from '@/lib/supabase';
import { authReturnUrl, emailSendError, resendConfirmation } from '@/lib/authRedirect';
import { GoogleSignInButton } from '@/components/AuthExtras';
import type { AuthView } from '../types';

export default function AuthPages({ initialView = 'login', pendingLabel }: { initialView?: AuthView; pendingLabel?: string }) {
  const { lang, dir } = useApp();
  const { login, register } = useCustomer();
  const [view, setView] = useState<AuthView>(() => {
    try {
      const v = sessionStorage.getItem('sahab.authView');
      sessionStorage.removeItem('sahab.authView');
      if (v === 'forgot') return 'forgot';
    } catch {
      /* storage unavailable */
    }
    return initialView;
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSentTo, setConfirmSentTo] = useState<string | null>(null);
  const [notConfirmed, setNotConfirmed] = useState(false);
  const [resend, setResend] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  const [resendError, setResendError] = useState('');
  const onResend = async (to: string) => {
    setResend('sending');
    const err = await resendConfirmation(to, lang === 'ar');
    setResendError(err || '');
    setResend(err ? 'failed' : 'sent');
  };

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [remember, setRemember] = useState(false);

  // Register state
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Forgot state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotConfirmed(false);
    setResend('idle');
    const err = await login(loginEmail, loginPassword);
    if (err === 'EMAIL_NOT_CONFIRMED') {
      setNotConfirmed(true);
      setError(lang === 'ar' ? 'حسابك لم يُفعّل بعد. افتح رابط التفعيل الذي أرسلناه إلى بريدك، أو اطلب رابطاً جديداً.' : 'Your account is not activated yet. Open the activation link we emailed you, or request a new one.');
    } else if (err) setError(err);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('كلمات المرور غير متطابقة / Passwords do not match');
      return;
    }
    if (!agreeTerms) {
      setError('يجب الموافقة على الشروط والأحكام / You must accept terms and conditions');
      return;
    }
    const err = await register({ fullName, mobile, email, password });
    if (err === 'CONFIRM_EMAIL') {
      setConfirmSentTo(email);
      setView('login');
    } else if (err) {
      setError(err);
    }
  };

  const [forgotLoading, setForgotLoading] = useState(false);

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      setError('بريد إلكتروني غير صالح / Invalid email');
      return;
    }
    setForgotLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        forgotEmail.trim(),
        { redirectTo: authReturnUrl('recovery') }
      );
      if (resetError) throw resetError;
      setForgotSent(true);
    } catch (err: any) {
      console.error('Password reset failed', err);
      setError(emailSendError(err, lang === 'ar'));
    } finally {
      setForgotLoading(false);
    }
  };

  const inputClass = 'w-full ps-10 pe-4 py-3 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';
  const labelClass = 'block text-xs font-semibold text-base-muted mb-1.5';

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-4" dir={dir}>
      {/* Background pattern */}
      <div className="absolute inset-0 industrial-pattern opacity-30" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="#home" className="inline-flex items-center gap-2 mb-2">
            <img src="/logo.png" alt="" aria-hidden="true" className="w-12 h-12 object-contain shrink-0 rounded-lg" />
            <div className="text-start">
              <div className="text-2xl font-black text-base-primary">SAHAB</div>
              <div className="text-xs text-base-muted">{lang === 'ar' ? 'معدات ومقاولات' : 'EQUIPMENT & CONTRACTING'}</div>
            </div>
          </a>
        </div>

        <div className="card-industrial p-6 lg:p-8 animate-scale-in">
          {/* LOGIN */}
          {pendingLabel && view !== 'forgot' && (
            <div className="mb-5 p-3 rounded-lg border border-yellow-accent/30 bg-yellow-accent/5 text-sm text-base-primary">
              {lang === 'ar' ? 'لديك طلب محفوظ سيُرسل بعد تسجيل الدخول: ' : 'You have a saved request that will be sent after you sign in: '}
              <span className="font-bold text-yellow-accent">{pendingLabel}</span>
            </div>
          )}
          {confirmSentTo && (
            <div className="mb-5 p-3 rounded-lg border border-green-500/30 bg-green-500/10 text-sm text-base-primary leading-relaxed">
              {lang === 'ar'
                ? <>تم إنشاء حسابك. أرسلنا رابط التفعيل إلى <span dir="ltr" className="font-semibold">{confirmSentTo}</span> — افتحه ثم سجّل الدخول.</>
                : <>Account created. We sent a confirmation link to <span className="font-semibold">{confirmSentTo}</span> — open it, then sign in.</>}
              <button type="button" onClick={() => onResend(confirmSentTo)} disabled={resend === 'sending' || resend === 'sent'} className="block mt-2 text-xs font-bold text-yellow-accent hover:underline disabled:opacity-60">
                {resend === 'sent' ? (lang === 'ar' ? 'تم إرسال رابط جديد ✓' : 'New link sent ✓') : (lang === 'ar' ? 'لم يصلك البريد؟ أعد الإرسال' : "Didn't get it? Resend")}
              </button>
              {resend === 'failed' && !notConfirmed && <span role="alert" className="block mt-1 text-xs text-red-500">{resendError}</span>}
            </div>
          )}
          {view === 'login' && (
            <>
              <h1 className="text-2xl font-black text-base-primary mb-1">{lang === 'ar' ? 'تسجيل الدخول' : 'Login'}</h1>
              <p className="text-sm text-base-muted mb-6">{lang === 'ar' ? 'مرحباً بعودتك إلى حسابك' : 'Welcome back to your account'}</p>

              <div className="mb-4"><GoogleSignInButton onError={setError} /></div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className={labelClass}>{lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
                  <div className="relative">
                    <Mail size={16} className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-base-muted" />
                    <input type="email" className={inputClass} value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder={lang === 'ar' ? 'name@example.com' : 'name@example.com'} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>{lang === 'ar' ? 'كلمة المرور' : 'Password'}</label>
                  <div className="relative">
                    <Lock size={16} className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-base-muted" />
                    <input type={showPassword ? 'text' : 'password'} className={inputClass} value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-1/2 -translate-y-1/2 ltr:right-3 rtl:left-3 text-base-muted hover:text-yellow-accent">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="w-4 h-4 accent-yellow-accent" />
                    <span className="text-sm text-base-muted">{lang === 'ar' ? 'تذكرني' : 'Remember me'}</span>
                  </label>
                  <button type="button" onClick={() => setView('forgot')} className="text-sm text-yellow-accent hover:underline">
                    {lang === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                  </button>
                </div>

                {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm">{error}</div>}
                {notConfirmed && (
                  <div className="space-y-2">
                    <button type="button" onClick={() => onResend(loginEmail)} disabled={resend === 'sending' || resend === 'sent'} className="btn-secondary w-full justify-center text-sm disabled:opacity-60">
                      {lang === 'ar' ? 'إعادة إرسال رابط التفعيل' : 'Resend activation link'}
                    </button>
                    {resend === 'sent' && <p role="status" className="text-xs text-green-500 text-center">{lang === 'ar' ? 'أرسلنا رابط تفعيل جديداً. تحقق من بريدك (وملف الرسائل غير المرغوب فيها).' : 'We sent a new activation link. Check your inbox (and spam folder).'}</p>}
                    {resend === 'failed' && <p role="alert" className="text-xs text-red-500 text-center">{resendError}</p>}
                  </div>
                )}

                <button type="submit" className="btn-primary w-full justify-center">
                  {lang === 'ar' ? 'تسجيل الدخول' : 'Login'}
                  {dir === 'rtl' ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
                </button>
              </form>


              <div className="text-center mt-6">
                <p className="text-sm text-base-muted">{lang === 'ar' ? 'ليس لديك حساب؟' : "Don't have an account?"}</p>
                <button onClick={() => { setView('register'); setError(null); }} className="btn-secondary mt-3 w-full justify-center">
                  {lang === 'ar' ? 'إنشاء حساب' : 'Create Account'}
                </button>
              </div>
            </>
          )}

          {/* REGISTER */}
          {view === 'register' && (
            <>
              <h1 className="text-2xl font-black text-base-primary mb-1">{lang === 'ar' ? 'إنشاء حساب' : 'Create Account'}</h1>
              <p className="text-sm text-base-muted mb-6">{lang === 'ar' ? 'انضم إلى سحاب لتأجير المعدات والمقاولات' : 'Join SAHAB for equipment rental and contracting'}</p>

              <div className="mb-4"><GoogleSignInButton onError={setError} /></div>
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className={labelClass}>{lang === 'ar' ? 'الاسم الكامل' : 'Full Name'}</label>
                  <div className="relative">
                    <User size={16} className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-base-muted" />
                    <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={lang === 'ar' ? 'محمد عبدالله' : 'John Doe'} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>{lang === 'ar' ? 'رقم الجوال' : 'Mobile'}</label>
                  <div className="relative">
                    <Phone size={16} className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-base-muted" />
                    <input className={inputClass} value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="+966500000000" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>{lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
                  <div className="relative">
                    <Mail size={16} className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-base-muted" />
                    <input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>{lang === 'ar' ? 'كلمة المرور' : 'Password'}</label>
                  <div className="relative">
                    <Lock size={16} className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-base-muted" />
                    <input type={showPassword ? 'text' : 'password'} className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-1/2 -translate-y-1/2 ltr:right-3 rtl:left-3 text-base-muted hover:text-yellow-accent">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>{lang === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}</label>
                  <div className="relative">
                    <Lock size={16} className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-base-muted" />
                    <input type={showConfirm ? 'text' : 'password'} className={inputClass} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute top-1/2 -translate-y-1/2 ltr:right-3 rtl:left-3 text-base-muted hover:text-yellow-accent">
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="w-4 h-4 accent-yellow-accent mt-0.5" />
                  <span className="text-sm text-base-muted">
                    {lang === 'ar' ? 'أوافق على الشروط والأحكام وسياسة الخصوصية' : 'I agree to the Terms & Conditions and Privacy Policy'}
                  </span>
                </label>

                {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm">{error}</div>}

                <button type="submit" className="btn-primary w-full justify-center">
                  {lang === 'ar' ? 'إنشاء حساب' : 'Create Account'}
                  {dir === 'rtl' ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
                </button>
              </form>

              <div className="text-center mt-6 pt-6 border-t border-base">
                <p className="text-sm text-base-muted">{lang === 'ar' ? 'لديك حساب بالفعل؟' : 'Already have an account?'}</p>
                <button onClick={() => { setView('login'); setError(null); }} className="btn-secondary mt-3 w-full justify-center">
                  {lang === 'ar' ? 'تسجيل الدخول' : 'Login'}
                </button>
              </div>
            </>
          )}

          {/* FORGOT */}
          {view === 'forgot' && (
            <>
              <h1 className="text-2xl font-black text-base-primary mb-1">{lang === 'ar' ? 'نسيت كلمة المرور' : 'Forgot Password'}</h1>
              <p className="text-sm text-base-muted mb-6">{lang === 'ar' ? 'أدخل بريدك الإلكتروني لاستعادة كلمة المرور' : 'Enter your email to reset your password'}</p>

              {forgotSent ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle size={32} className="text-green-500" />
                  </div>
                  <p className="text-sm text-base-primary font-semibold">{lang === 'ar' ? 'تم إرسال تعليمات الاستعادة' : 'Reset instructions sent'}</p>
                  <p className="text-xs text-base-muted">{lang === 'ar' ? 'تحقق من بريدك الإلكتروني' : 'Check your email'}</p>
                  <button onClick={() => { setView('login'); setForgotSent(false); }} className="btn-secondary w-full justify-center">
                    {lang === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to Login'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgot} className="space-y-4">
                  <div>
                    <label className={labelClass}>{lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
                    <div className="relative">
                      <Mail size={16} className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-base-muted" />
                      <input type="email" className={inputClass} value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="name@example.com" />
                    </div>
                  </div>
                  {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm">{error}</div>}
                  <button type="submit" disabled={forgotLoading} className="btn-primary w-full justify-center">
                    {forgotLoading
                      ? (lang === 'ar' ? 'جاري الإرسال...' : 'Sending...')
                      : (lang === 'ar' ? 'إرسال' : 'Send')}
                  </button>
                  <button type="button" onClick={() => setView('login')} className="btn-secondary w-full justify-center">
                    {lang === 'ar' ? 'العودة' : 'Back'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        <div className="text-center mt-4">
          <a href="#home" className="text-sm text-base-muted hover:text-yellow-accent transition-colors">
            {lang === 'ar' ? 'العودة للموقع' : 'Back to site'}
          </a>
        </div>
      </div>
    </div>
  );
}
