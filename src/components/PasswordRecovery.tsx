import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { takeRecoveryFlag } from '@/lib/authRedirect';
import SetNewPasswordModal from '@/customer/components/SetNewPasswordModal';

/**
 * After opening a password-reset link (customer or staff), asks for the new
 * password right away, on whichever page the link returned to.
 */
export default function PasswordRecovery() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    if (takeRecoveryFlag()) {
      supabase.auth.getSession().then(({ data }) => {
        if (active && data.session) setOpen(true);
      });
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setOpen(true);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return open ? <SetNewPasswordModal onClose={() => setOpen(false)} /> : null;
}
