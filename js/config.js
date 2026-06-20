/* ============================================================================
   ODYSSEY — CLOUD CONFIG  (Supabase, 100% free) + INVITE-ONLY ALLOWLIST
   ----------------------------------------------------------------------------
   These keys enable cross-device sync AND the invite-only login gate.
   The anon ("publishable") key is SAFE to expose in front-end code — it only
   works through Row-Level Security, so each user can read/write ONLY their own
   row. Never put the SECRET key or the DB password here.

   Sign-in is gated: only the emails in ALLOWED_EMAILS below may sign in or
   create an account from the app. Edit that list to invite or remove people.
   (Setup — Brevo SMTP + Supabase auth — is in PROJECT_STATUS.md §10.)
   ========================================================================== */
export const SUPABASE_URL = 'https://jrlwvadwlwsljdtxpwrb.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_Z8KO1Q46FLW1kKbF75rPgw_Usq_9bmX';

/* ----------------------------------------------------------------------------
   INVITE LIST — who is allowed in. Compared case-insensitively, whitespace
   trimmed. Add an email to invite someone; remove it to revoke app access.
   NOTE: this is a CLIENT-side gate (good for a private personal app). For a
   hard server-side lock, also disable public sign-ups in Supabase or add the
   allowlist trigger described in PROJECT_STATUS.md §10. Either way, Supabase
   Row-Level Security already keeps every user's data private to them.
   -------------------------------------------------------------------------- */
export const ALLOWED_EMAILS = [
  'pprem9300@gmail.com',
  // 'invitee@example.com',   // ← add invited people here
];
