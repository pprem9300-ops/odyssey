/* ============================================================================
   ODYSSEY — CLOUD + AUTH  (Supabase, free tier · local-first sync · invite-only)
   ----------------------------------------------------------------------------
   Two ways in (see gate.js): an 8-digit code emailed via Brevo, OR email+password.
   Sign-in/up is gated to ALLOWED_EMAILS (config.js). Dormant + zero external
   dependency until config.js is filled in.
   ========================================================================== */
import { SUPABASE_URL, SUPABASE_ANON_KEY, ALLOWED_EMAILS } from './config.js?v=4';

let client = null;
let user = null;
let pushTimer = null;
const authListeners = new Set();

export const cloudEnabled = () => !!(SUPABASE_URL && SUPABASE_ANON_KEY);
export const currentUser = () => user;
export const onAuth = (cb) => authListeners.add(cb);
const emit = () => authListeners.forEach((cb) => cb(user));

/* ---- Invite allowlist (client-side gate) ------------------------------- */
const norm = (e) => String(e || '').trim().toLowerCase().normalize('NFKC');
export const isAllowed = (email) =>
  (ALLOWED_EMAILS || []).map(norm).includes(norm(email));

const requireAllowed = (email) => {
  if (!isAllowed(email)) {
    const err = new Error('This app is invite-only — that email isn’t on the invite list.');
    err.code = 'not-invited';
    throw err;
  }
};
const requireClient = () => { if (!client) throw new Error('Cloud not initialised. Check your connection and retry.'); };

/* Where Supabase should send the user back after a magic-link / confirm /
   password-reset click — strip any existing hash so the token lands clean. */
const redirectTo = () => location.href.split('#')[0];

/* Lazy-load supabase-js from CDN ONLY when sync is actually configured.
   Guarded against double-init (the gate and the app both call this). */
export async function initCloud() {
  if (!cloudEnabled()) return { enabled: false, user: null };
  if (client) return { enabled: true, user };          // already initialised
  try {
    // Prefer the vendored, same-origin UMD bundle (window.supabase) so sign-in
    // works OFFLINE from the cached PWA shell; fall back to the CDN if absent.
    const createClient = (typeof window !== 'undefined' && window.supabase?.createClient)
      || (await import('https://esm.sh/@supabase/supabase-js@2')).createClient;
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
    const { data } = await client.auth.getSession();
    user = data.session?.user || null;
    client.auth.onAuthStateChange((_event, session) => {
      user = session?.user || null;
      emit();
    });
    return { enabled: true, user };
  } catch (err) {
    console.warn('[odyssey] cloud init failed:', err);
    client = null;
    return { enabled: false, user: null, error: err };
  }
}

/* ---- AUTH: emailed 8-digit code (passwordless; length set in Supabase) - */
// Sends a one-time code (and/or magic link, per the Supabase email template).
export async function sendCode(email) {
  requireClient(); requireAllowed(email);
  const { error } = await client.auth.signInWithOtp({
    email: norm(email),
    options: { shouldCreateUser: true, emailRedirectTo: redirectTo() },
  });
  if (error) throw error;
  return true;
}
// Verify the 8-digit code the user typed in (length-agnostic — Supabase checks it).
export async function verifyCode(email, token) {
  requireClient(); requireAllowed(email);
  const { data, error } = await client.auth.verifyOtp({
    email: norm(email), token: String(token).trim(), type: 'email',
  });
  if (error) throw error;
  return data;
}

/* ---- AUTH: email + password -------------------------------------------- */
export async function signInWithPassword(email, password) {
  requireClient(); requireAllowed(email);
  const { data, error } = await client.auth.signInWithPassword({ email: norm(email), password });
  if (error) throw error;
  return data;
}
// Create an account with a password (allowlisted emails only). If Supabase email
// confirmation is ON, data.session is null until the user confirms by email.
export async function signUpWithPassword(email, password) {
  requireClient(); requireAllowed(email);
  const { data, error } = await client.auth.signUp({
    email: norm(email), password, options: { emailRedirectTo: redirectTo() },
  });
  if (error) throw error;
  return data;                                   // { user, session }
}
export async function resetPassword(email) {
  requireClient(); requireAllowed(email);
  const { error } = await client.auth.resetPasswordForEmail(norm(email), { redirectTo: redirectTo() });
  if (error) throw error;
  return true;
}
// Set / change the password for the currently signed-in user.
export async function updatePassword(password) {
  requireClient();
  if (!user) throw new Error('Sign in first.');
  const { error } = await client.auth.updateUser({ password });
  if (error) throw error;
  return true;
}

export async function signOut() {
  if (client) await client.auth.signOut();
  user = null; emit();
}

/* ---- DATA SYNC --------------------------------------------------------- */
/* Pull this user's saved state ( returns the plain object, or null ). */
export async function pull() {
  if (!client || !user) return null;
  const { data, error } = await client.from('odyssey_state').select('data').eq('user_id', user.id).maybeSingle();
  if (error) { console.warn('[odyssey] pull error:', error.message); return null; }
  return data?.data ?? null;
}

/* Debounced upsert — no-op unless signed in. */
export function pushDebounced(state) {
  if (!client || !user) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(async () => {
    const { error } = await client
      .from('odyssey_state')
      .upsert({ user_id: user.id, data: state, updated_at: new Date().toISOString() });
    if (error) console.warn('[odyssey] push error:', error.message);
  }, 800);
}
