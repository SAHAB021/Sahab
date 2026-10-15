import { useState } from 'react';
import { Lock, Mail, ArrowLeft, AlertCircle } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useEmployee } from '../EmployeeContext';

export default function AdminLogin() {
  const { lang, dir } = useApp();
  const { signIn } = useEmployee();
  const ar = lang === 'ar';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const inputClass = 'w-full px-4 py-3 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setError(signInError);
      setLoading(false);
    }
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
        <form onSubmit={handleSubmit} className="card-industrial p-6 space-y-4">
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
                className={`${inputClass} ps-10`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@sahab.sa"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-base-muted mb-1.5">{ar ? 'كلمة المرور' : 'Password'}</label>
            <div className="relative">
              <Lock size={16} className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-base-muted" />
              <input
                type="password"
                required
                className={`${inputClass} ps-10`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                dir="ltr"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
            {loading ? (ar ? 'جاري التحقق...' : 'Signing in...') : (ar ? 'تسجيل الدخول' : 'Sign In')}
          </button>
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
