/* ============================================================================
   ODYSSEY — CLOUD SYNC  (Supabase, free tier · local-first · fully optional)
   Dormant + zero external dependency until config.js is filled in.
   ========================================================================== */
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js?v=3';

let client = null;
let user = null;
let pushTimer = null;
const authListeners = new Set();

export const cloudEnabled = () => !!(SUPABASE_URL && SUPABASE_ANON_KEY);
export const currentUser = () => user;
export const onAuth = (cb) => authListeners.add(cb);
const emit = () => authListeners.forEach((cb) => cb(user));

/* Lazy-load supabase-js from CDN ONLY when sync is actually configured. */
export async function initCloud() {
  if (!cloudEnabled()) return { enabled: false, user: null };
  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
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
    console.warn('[odyssey] cloud init failed — staying local:', err);
    return { enabled: false, user: null };
  }
}

export async function signIn(email) {
  if (!client) throw new Error('cloud not initialised');
  return client.auth.signInWithOtp({ email, options: { emailRedirectTo: location.href.split('#')[0] } });
}

export async function signOut() {
  if (client) await client.auth.signOut();
  user = null; emit();
}

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
