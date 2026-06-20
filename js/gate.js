/* ============================================================================
   ODYSSEY — LOGIN GATE  ·  invite-only · two ways in (emailed code OR password)
   ----------------------------------------------------------------------------
   Covers the whole app until the user is authenticated. The app (render, motion,
   data) only boots once initGate() calls onEnter(). On sign-out the app reloads,
   bringing the gate back. Allowlist is enforced in cloud.js (config.js list).
   ========================================================================== */
import * as Cloud from './cloud.js?v=4';

const OMEGA = 'Ω';

export function initGate(onEnter) {
  const gate = document.getElementById('gate');
  const body = document.getElementById('gate-body');

  // Defensive: if the gate markup is missing, don't lock the user out forever.
  if (!gate || !body) { onEnter(); return; }

  let entered = false;
  const enter = () => {
    if (entered) return;
    entered = true;
    gate.classList.add('gate--out');
    setTimeout(() => gate.classList.add('gate--hidden'), 650);
    onEnter();
  };

  // Live auth → the moment a session appears (code verified, password ok,
  // magic-link return), drop the gate and boot the app.
  Cloud.onAuth((u) => { if (u) enter(); });

  let email = '';   // remembered between steps

  /* ---- tiny render helpers ------------------------------------------- */
  const h = (html) => { body.innerHTML = html; };
  const $ = (s) => body.querySelector(s);
  const setStatus = (msg, kind = '') => {
    const el = $('#gate-status'); if (el) { el.textContent = msg || ''; el.className = 'gate-status ' + kind; }
  };
  const friendly = (e) => {
    const m = (e && e.message) || String(e);
    if (e && e.code === 'not-invited') return m;
    if (/Invalid login credentials/i.test(m)) return 'Email or password is incorrect.';
    if (/Email not confirmed/i.test(m)) return 'Confirm your email first — check your inbox for the link.';
    if (/Token has expired|otp_expired|expired|invalid.*(token|otp)/i.test(m)) return 'That code is wrong or expired — request a new one.';
    if (/already registered/i.test(m)) return 'You already have an account — sign in instead.';
    if (/Password should be/i.test(m)) return m.replace(/^Password should be/i, 'Your password must be');
    if (/rate limit|too many|for security purposes/i.test(m)) return 'Too many attempts — wait a minute and try again.';
    return m;
  };

  /* ---- STEP 0: checking / unconfigured / offline --------------------- */
  function renderChecking() {
    h(`<p class="gate-checking mono">Checking access…</p>`);
  }
  function renderError(title, sub, retry = true) {
    h(`<p class="gate-title">${title}</p>
       <p class="gate-sub">${sub}</p>
       ${retry ? `<button class="btn btn--clay magnetic gate-btn" id="gate-retry">Retry</button>` : ''}`);
    const r = $('#gate-retry'); if (r) r.onclick = () => boot();
  }

  /* ---- STEP 1: email --------------------------------------------------- */
  function renderEmail() {
    h(`<p class="gate-title">Welcome back</p>
       <p class="gate-sub">Odyssey is private. Sign in to continue.</p>
       <input id="gate-email" class="gate-input" type="email" inputmode="email" autocomplete="email"
              placeholder="you@email.com" value="${email}" />
       <button class="btn btn--clay magnetic gate-btn" id="gate-continue">Continue <span class="arrow">→</span></button>
       <p id="gate-status" class="gate-status"></p>
       <p class="gate-foot">Invite-only. Your data is private to your account.</p>`);
    const input = $('#gate-email'), go = $('#gate-continue');
    input.focus();
    const submit = () => {
      const v = input.value.trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) { setStatus('Enter a valid email.', 'err'); return; }
      if (!Cloud.isAllowed(v)) { setStatus('That email isn’t on the invite list.', 'err'); return; }
      email = v;
      renderMethod();
    };
    go.onclick = submit;
    input.onkeydown = (e) => { if (e.key === 'Enter') submit(); };
  }

  /* ---- STEP 2: choose method (code default · password secondary) ------ */
  function renderMethod() {
    h(`<p class="gate-checking mono">${email}</p>
       <p class="gate-title">How would you like to sign in?</p>
       <p class="gate-sub">We can email you a one-time 6-digit code — nothing to remember.</p>
       <button class="btn btn--clay magnetic gate-btn" id="gate-send">Email me a code</button>
       <p class="gate-alt">or <button class="gate-link" id="gate-use-pass">use a password</button></p>
       <p id="gate-status" class="gate-status"></p>
       <p class="gate-foot"><button class="gate-link" id="gate-back">← different email</button></p>`);
    $('#gate-send').onclick = sendCode;
    $('#gate-use-pass').onclick = renderPassword;
    $('#gate-back').onclick = renderEmail;
  }

  async function sendCode() {
    setStatus('Sending your code…');
    $('#gate-send').disabled = true;
    try {
      await Cloud.sendCode(email);
      renderCode();
    } catch (e) {
      $('#gate-send').disabled = false;
      setStatus(friendly(e), 'err');
    }
  }

  /* ---- STEP 3a: enter the code ---------------------------------------- */
  function renderCode() {
    h(`<p class="gate-checking mono">${email}</p>
       <p class="gate-title">Enter your code</p>
       <p class="gate-sub">We emailed a 6-digit code. It expires shortly.</p>
       <input id="gate-code" class="gate-input gate-code" inputmode="numeric" autocomplete="one-time-code"
              maxlength="6" placeholder="••••••" />
       <button class="btn btn--clay magnetic gate-btn" id="gate-verify">Verify &amp; enter</button>
       <p id="gate-status" class="gate-status"></p>
       <p class="gate-foot"><button class="gate-link" id="gate-resend">Resend code</button>
          · <button class="gate-link" id="gate-back">← back</button></p>`);
    const code = $('#gate-code');
    code.focus();
    const submit = async () => {
      const token = code.value.replace(/\D/g, '');
      if (token.length < 6) { setStatus('Enter the 6-digit code.', 'err'); return; }
      setStatus('Verifying…');
      $('#gate-verify').disabled = true;
      try {
        await Cloud.verifyCode(email, token);   // onAuth → enter()
      } catch (e) {
        $('#gate-verify').disabled = false;
        setStatus(friendly(e), 'err');
      }
    };
    $('#gate-verify').onclick = submit;
    code.onkeydown = (e) => { if (e.key === 'Enter') submit(); };
    $('#gate-resend').onclick = async () => {
      const rb = $('#gate-resend'); if (!rb || rb.disabled) return;
      rb.disabled = true; setStatus('Resending…');
      try { await Cloud.sendCode(email); setStatus('New code sent — check your inbox.', 'ok'); }
      catch (e) { setStatus(friendly(e), 'err'); }
      finally { setTimeout(() => { const b = $('#gate-resend'); if (b) b.disabled = false; }, 30000); }  // respect Supabase OTP cooldown
    };
    $('#gate-back').onclick = renderMethod;
  }

  /* ---- STEP 3b: password ---------------------------------------------- */
  function renderPassword() {
    h(`<p class="gate-checking mono">${email}</p>
       <p class="gate-title">Enter your password</p>
       <p class="gate-sub">Or <button class="gate-link" id="gate-want-code">email me a code instead</button>.</p>
       <input id="gate-pass" class="gate-input" type="password" autocomplete="current-password"
              placeholder="Your password" />
       <button class="btn btn--clay magnetic gate-btn" id="gate-signin">Sign in</button>
       <p id="gate-status" class="gate-status"></p>
       <p class="gate-foot">
         <button class="gate-link" id="gate-create">First time? Create a password</button> ·
         <button class="gate-link" id="gate-forgot">Forgot?</button> ·
         <button class="gate-link" id="gate-back">← back</button>
       </p>`);
    const pass = $('#gate-pass');
    pass.focus();
    let busy = false;                                   // shared re-entrancy guard for this panel
    const signin = async () => {
      if (!pass.value) { setStatus('Enter your password.', 'err'); return; }
      setStatus('Signing in…');
      $('#gate-signin').disabled = true;
      try {
        await Cloud.signInWithPassword(email, pass.value);   // onAuth → enter()
      } catch (e) {
        $('#gate-signin').disabled = false;
        setStatus(friendly(e), 'err');
      }
    };
    $('#gate-signin').onclick = signin;
    pass.onkeydown = (e) => { if (e.key === 'Enter') signin(); };
    $('#gate-want-code').onclick = renderMethod;
    $('#gate-back').onclick = renderMethod;
    $('#gate-create').onclick = async () => {
      if (busy) return;
      if (pass.value.length < 6) { setStatus('Choose a password of at least 6 characters.', 'err'); return; }
      busy = true; setStatus('Creating your account…');
      try {
        const { user, session } = await Cloud.signUpWithPassword(email, pass.value);
        if (session) { /* onAuth → enter() */ }
        // Supabase anti-enumeration: signing up an existing email returns a decoy
        // user with identities:[] and sends no email — detect it so we don't tell
        // the user to "check your email" for a confirmation that never arrives.
        else if (user && Array.isArray(user.identities) && user.identities.length === 0)
          setStatus('You already have an account — sign in with your password, or tap Forgot.', 'err');
        else setStatus('Account created — check your email to confirm, then sign in.', 'ok');
      } catch (e) { setStatus(friendly(e), 'err'); }
      finally { busy = false; }
    };
    $('#gate-forgot').onclick = async () => {
      if (busy) return;
      busy = true; setStatus('Sending a reset link…');
      try { await Cloud.resetPassword(email); setStatus('Reset link sent — check your email.', 'ok'); }
      catch (e) { setStatus(friendly(e), 'err'); }
      finally { busy = false; }
    };
  }

  /* ---- boot the gate -------------------------------------------------- */
  async function boot() {
    renderChecking();
    if (!Cloud.cloudEnabled()) {
      renderError('Sign-in unavailable',
        'This build has no Supabase keys, so the invite-only gate can’t run. Add keys in js/config.js.', false);
      return;
    }
    const res = await Cloud.initCloud();
    if (res.user) { enter(); return; }            // valid session → straight in
    if (!res.enabled) {
      const offline = (typeof navigator !== 'undefined' && navigator.onLine === false);
      renderError(offline ? 'You’re offline' : 'Can’t reach sign-in',
        offline
          ? 'Odyssey needs a connection to confirm your sign-in. It’ll work again once you’re back online.'
          : 'We couldn’t load the sign-in service — check your connection and retry.', true);
      return;
    }
    renderEmail();
  }

  boot();
}
