const STORAGE_KEY = 'uid_reg_checkout';
const PENDING_CHECKOUT_KEY = 'uid_reg_pending_checkout';

interface RegistrationCredentials {
  email: string;
  password: string;
}

export interface PendingRegistrationCheckout {
  memberId: string;
  authUserId: string;
}

export function storeRegistrationCredentials(email: string, password: string): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ email, password }));
}

export function storePendingRegistrationCheckout(memberId: string, authUserId: string): void {
  sessionStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify({ memberId, authUserId }));
}

export function getPendingRegistrationCheckout(): PendingRegistrationCheckout | null {
  const raw = sessionStorage.getItem(PENDING_CHECKOUT_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PendingRegistrationCheckout;
    if (parsed.memberId && parsed.authUserId) return parsed;
  } catch {
    sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
  }
  return null;
}

export function clearRegistrationCredentials(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function clearPendingRegistrationCheckout(): void {
  sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
}

/**
 * After registration checkout, the user may not have an auth session yet when
 * email confirmation is enabled. Restore the session once the webhook has
 * confirmed payment (and confirmed the email server-side).
 */
export async function restoreRegistrationSession(): Promise<{ ok: boolean; error?: string }> {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return { ok: false };

  let credentials: RegistrationCredentials;
  try {
    credentials = JSON.parse(raw) as RegistrationCredentials;
  } catch {
    clearRegistrationCredentials();
    return { ok: false, error: 'Invalid registration session data.' };
  }

  const { supabase } = await import('../lib/supabase');

  for (let attempt = 0; attempt < 8; attempt++) {
    const { error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (!error) {
      clearRegistrationCredentials();
      clearPendingRegistrationCheckout();
      return { ok: true };
    }

    // Webhook may still be confirming the email — retry briefly.
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  return {
    ok: false,
    error: 'Payment succeeded but sign-in is still pending. Please sign in with your email and password.',
  };
}
