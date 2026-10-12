import { useState } from 'react';
import { KeyRound, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';
import { PasswordInput } from '@/components/AuthExtras';

/** Shown after opening a password-reset link: the customer picks a new password right away. */
export default function SetNewPasswordModal({ onClose }: { onClose: () => void }) {
  const { lang, dir } = useApp();
  const ar = lang === 'ar';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const input = 'w-full px-4 py-3 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) return setError(ar ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
    if (password !== confirm) return setError(ar ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) {
      console.error('Setting the new password failed', err);
      setError(
        /different from the old/i.test(err.message)
          ? (ar ? 'اختر كلمة مرور مختلفة عن القديمة' : 'Choose a password different from the old one')
          : (ar ? 'تعذر حفظ كلمة المرور. اطلب رابط استعادة جديداً وحاول مرة أخرى.' : 'Could not save the password. Request a new reset link and try again.'),
      );
      return;
    }
    setDone(true);
  };

  return (
    <div className="fixed inset-0 z-[210] flex items-end sm:items-center justify-center sm:p-4 animate-fade-in" dir={dir}>
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
      <div role="dialog" aria-modal="true" aria-label={ar ? 'كلمة مرور جديدة' : 'New password'} className="relative w-full sm:max-w-md bg-elevated border border-base rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 animate-scale-in">
        {done ? (
          <div className="text-center space-y-4 py-2">
            <CheckCircle2 size={44} className="mx-auto text-green-500" />
            <p className="font-black text-base-primary text-lg">{ar ? 'تم تغيير كلمة المرور بنجاح' : 'Your password was changed'}</p>
            <p className="text-sm text-base-muted">{ar ? 'استخدم كلمة المرور الجديدة في المرات القادمة.' : 'Use your new password from now on.'}</p>
            <button type="button" onClick={onClose} className="btn-primary w-full justify-center">{ar ? 'متابعة' : 'Continue'}</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-yellow-accent/10 border border-yellow-accent/30 flex items-center justify-center"><KeyRound size={22} className="text-yellow-accent" /></div>
              <div>
                <h2 className="font-black text-base-primary text-lg">{ar ? 'اختر كلمة مرور جديدة' : 'Choose a new password'}</h2>
                <p className="text-xs text-base-muted">{ar ? 'تم التحقق من بريدك الإلكتروني' : 'Your email has been verified'}</p>
              </div>
            </div>
            {error && (
              <div role="alert" className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2 text-sm text-red-500">
                <AlertCircle size={16} className="shrink-0 mt-0.5" /> {error}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-base-muted mb-1.5">{ar ? 'كلمة المرور الجديدة' : 'New password'}</label>
              <PasswordInput autoComplete="new-password" className={input} value={password} onChange={setPassword} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-base-muted mb-1.5">{ar ? 'تأكيد كلمة المرور' : 'Confirm password'}</label>
              <PasswordInput autoComplete="new-password" className={input} value={confirm} onChange={setConfirm} />
            </div>
            <button type="submit" disabled={busy} className="btn-primary w-full justify-center disabled:opacity-60">
              {busy ? <Loader2 size={18} className="animate-spin" /> : <KeyRound size={18} />}
              {ar ? 'حفظ كلمة المرور' : 'Save password'}
            </button>
            <button type="button" onClick={onClose} className="w-full text-sm text-base-muted hover:text-yellow-accent">{ar ? 'لاحقاً' : 'Later'}</button>
          </form>
        )}
      </div>
    </div>
  );
}
