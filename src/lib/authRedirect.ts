import { supabase } from './supabase';

/**
 * Supabase sends people back to the site after they open the email
 * confirmation link or finish Google sign-in, with the session (or an error)
 * in the URL fragment. The site uses hash routing (#/account), so those
 * fragments are handled here before the app renders: the session is stored,
 * the URL is cleaned to #/account, and a one-time notice is kept for the
 * account page ("your account is verified", "link expired", ...).
 */

export type AuthNotice = 'verified' | 'google' | 'link-expired' | 'link-error' | 'reset-link-expired' | 'oauth-error';

const NOTICE_KEY = 'sahab.authNotice';
const RECOVERY_KEY = 'sahab.passwordRecovery';

/**
 * Where Supabase should send people back to. No hash: Supabase appends its own fragment.
 * `to: 'admin'` brings staff back to the dashboard instead of the customer account page.
 */
export const authReturnUrl = (kind: 'verified' | 'google' | 'recovery', to?: 'admin') =>
  `${window.location.origin}/?auth=${kind}${to ? `&to=${to}` : ''}`;

function fragmentParams(): URLSearchParams | null {
  const hash = window.location.hash;
  // Either "#access_token=..." or a route followed by Supabase's fragment ("#/account#access_token=...").
  const idx = Math.max(hash.lastIndexOf('#access_token='), hash.lastIndexOf('#error'));
  const raw = idx >= 0 ? hash.slice(idx + 1) : hash.slice(1);
  if (!/(^|&)(access_token|error|error_description)=/.test(raw)) return null;
  return new URLSearchParams(raw);
}

function setRecovery() {
  try {
    sessionStorage.setItem(RECOVERY_KEY, '1');
  } catch {
    /* storage unavailable */
  }
}

function setNotice(n: AuthNotice) {
  try {
    sessionStorage.setItem(NOTICE_KEY, n);
    // An expired reset link opens the "forgot password" form so a new link is one click away.
    if (n === 'reset-link-expired') sessionStorage.setItem('sahab.authView', 'forgot');
  } catch {
    /* storage unavailable */
  }
}

/** True once after opening a password-reset link: the "choose a new password" window should open. */
export function takeRecoveryFlag(): boolean {
  try {
    const v = sessionStorage.getItem(RECOVERY_KEY) === '1';
    sessionStorage.removeItem(RECOVERY_KEY);
    return v;
  } catch {
    return false;
  }
}

export function takeAuthNotice(): AuthNotice | null {
  try {
    const n = sessionStorage.getItem(NOTICE_KEY) as AuthNotice | null;
    sessionStorage.removeItem(NOTICE_KEY);
    return n;
  } catch {
    return null;
  }
}

export async function handleAuthRedirect(): Promise<void> {
  const search = new URLSearchParams(window.location.search);
  const kind = search.get('auth');
  const target = search.get('to') === 'admin' ? '#/admin' : '#/account';
  const params = fragmentParams();
  if (!kind && !params) return;

  try {
    if (params?.get('error') || params?.get('error_description')) {
      const code = params.get('error_code') || '';
      if (kind === 'google') setNotice('oauth-error');
      else if (kind === 'recovery') setNotice('reset-link-expired');
      else setNotice(code === 'otp_expired' ? 'link-expired' : 'link-error');
    } else if (params?.get('access_token') && params.get('refresh_token')) {
      // supabase-js only reads a bare "#access_token=..." fragment, so store the session ourselves.
      const { error } = await supabase.auth.setSession({
        access_token: params.get('access_token')!,
        refresh_token: params.get('refresh_token')!,
      });
      if (error) console.error('Storing the returned session failed', error);
      if (error) setNotice(kind === 'google' ? 'oauth-error' : kind === 'recovery' ? 'reset-link-expired' : 'link-error');
      else if (kind === 'recovery' || params.get('type') === 'recovery') setRecovery();
      else setNotice(kind === 'google' || params.get('provider_token') ? 'google' : 'verified');
    } else if (kind) {
      // No tokens (e.g. PKCE code exchange done by supabase-js): just make sure the session is loaded.
      const { data } = await supabase.auth.getSession();
      if (data.session && kind === 'recovery') setRecovery();
      else if (data.session) setNotice(kind === 'google' ? 'google' : 'verified');
    }
  } catch (err) {
    console.error('Handling the sign-in redirect failed', err);
    setNotice(kind === 'google' ? 'oauth-error' : kind === 'recovery' ? 'reset-link-expired' : 'link-error');
  }

  window.history.replaceState(null, '', `${window.location.origin}${window.location.pathname}${target}`);
}

let googleEnabled: Promise<boolean> | null = null;

/** True when Google sign-in is switched on in Supabase (Authentication → Providers). */
export function isGoogleSignInEnabled(): Promise<boolean> {
  if (!googleEnabled) {
    googleEnabled = fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => !!s?.external?.google)
      .catch(() => false);
  }
  return googleEnabled;
}

export async function signInWithGoogle(): Promise<string | null> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: authReturnUrl('google') },
  });
  return error ? error.message : null;
}

/**
 * Explains why Supabase refused to send an email right now. Supabase allows one
 * email per address every ~60 seconds, and only a few per hour on its built-in
 * mail service.
 */
export function emailSendError(err: { status?: number; code?: string; message?: string }, ar: boolean): string {
  const msg = err.message || '';
  if (err.code === 'email_address_not_authorized' || /not authorized/i.test(msg)) {
    // Supabase's built-in mail service only delivers to the project team's own addresses.
    return ar
      ? 'خدمة البريد في الموقع غير مفعّلة لهذا البريد بعد. تواصل معنا عبر الهاتف أو واتساب لاستعادة حسابك.'
      : 'The site cannot email this address yet. Contact us by phone or WhatsApp to recover your account.';
  }
  if (err.code === 'email_address_invalid' || (/invalid/i.test(msg) && /email/i.test(msg))) {
    return ar ? 'البريد الإلكتروني غير صالح' : 'This email address is not valid';
  }
  const secs = msg.match(/after (\d+) seconds?/i)?.[1];
  if (secs) return ar ? `لحمايتك، انتظر ${secs} ثانية ثم أعد المحاولة.` : `For security, wait ${secs} seconds and try again.`;
  if (err.status === 429 || /rate limit/i.test(msg) || err.code === 'over_email_send_rate_limit') {
    return ar
      ? 'تم الوصول إلى الحد المسموح لإرسال الرسائل مؤقتاً. حاول مرة أخرى بعد قليل (حتى ساعة).'
      : 'The email sending limit was reached for now. Please try again a little later (up to an hour).';
  }
  return ar ? 'تعذر الإرسال الآن، حاول مرة أخرى بعد دقيقة.' : 'Could not send right now. Try again in a minute.';
}

/** Resends the activation email. Returns null when sent, otherwise a message to show. */
export async function resendConfirmation(email: string, ar: boolean): Promise<string | null> {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email.trim(),
    options: { emailRedirectTo: authReturnUrl('verified') },
  });
  if (!error) return null;
  console.error('Resending the confirmation email failed', error);
  return emailSendError(error, ar);
}

export const isEmailNotConfirmed = (err: { code?: string; message?: string } | null | undefined) =>
  !!err && (err.code === 'email_not_confirmed' || /email not confirmed/i.test(err.message || ''));
