# 🫁 ODYSSEY — Project Status

> **Read this file first.** It is the living source of truth for the Odyssey build.
> Companion docs: [`DECISIONS.md`](DECISIONS.md) (why we chose what) · [`BUILD_SPEC.md`](BUILD_SPEC.md) (technical spec — rule-engine formulas + screens + motion).

**Last updated:** 2026-06-20
**Current phase:** `P10 — Live polish · invite-only login gate built (code OR password via Brevo); needs Supabase+Brevo dashboard config`
**Overall progress:** ▰▰▰▰▰▰▰ ~97% (auth gate built & verified locally; remaining: Brevo SMTP + Supabase auth config to make live login deliver codes · nutrition-regimes library)
**🌐 LIVE:** **https://pprem9300-ops.github.io/odyssey/** · repo `github.com/pprem9300-ops/odyssey` (public). Auto-redeploys on `git push origin main`. ⚠️ The app is now **invite-only** — it shows a login gate until you sign in (`js/gate.js`). Live sign-in needs the **manual Supabase + Brevo setup in §10** (SMTP sender, code email template, URL Configuration).

> **Dev note (important):** the app is served by **`serve.py`** (no-cache) via `launch.json` + `Odyssey.app`. Module imports carry a `?v=3` cache-bust. Do NOT use plain `python -m http.server` — it heuristically caches CSS/JS and you'll chase "my edits don't show" ghosts. Bump `?v=` (or rely on serve.py's no-cache) when shipping changes; bump `CACHE` in `sw.js` for the PWA.

---

## ▶ RESUME HERE (next session)

**State:** fully built, verified, and **deployed live** → https://pprem9300-ops.github.io/odyssey/ (auto-redeploys on `git push origin main`). `gh` CLI is installed + authed as **`pprem9300-ops`**. Repo: `github.com/pprem9300-ops/odyssey` (public; only the public-safe Supabase publishable key is committed).

**Immediate next actions (priority order):**
1. **Finish the auth setup so live login works (≈10 min in two dashboards) — see §10.** The invite-only gate (`js/gate.js`) is built & verified locally; it needs: (a) **Brevo** account → verify a sender → SMTP key; (b) **Supabase → Project Settings → Auth → SMTP** = Brevo creds; (c) **Supabase → Auth → Email Templates → Magic Link** → emit `{{ .Token }}` so "email me a code" delivers a **6-digit code**; (d) **Supabase → Auth → URL Configuration** Site URL + redirect `…/odyssey/**`; (e) add invited emails to `ALLOWED_EMAILS` in `js/config.js`. Then verify the code + password round-trips on the live site.
2. **Build the nutrition-regimes library** (the one unbuilt feature) — proven **lean-gain + cut** protocols as a browsable view. The `odyssey-proven-regimes` research workflow failed earlier (account session limit); either re-run it or author the content directly, then add a "Regimes" view + nav link.
3. Optional hardening: make invite-only enforce **server-side** too (Supabase → Auth → disable public signups, or an allowlist trigger — §10). Today the allowlist is client-side; RLS already isolates each user's data.
4. Optional: §6 backlog (relapse/reset flow, per-day checklist persistence, wearable import, AI weekly insight).

**Run locally:** `python3 ~/Desktop/odyssey/serve.py 4178 ~/Desktop/odyssey` then open `http://localhost:4178` — OR double-click `~/Desktop/Odyssey.app`. **Ship a change:** `cd ~/Desktop/odyssey && git add -A && git commit -m "…" && git push` (Pages rebuilds in ~1 min).

---

## 1. One-line vision

An awwwards-grade, **breathy Claude-pastel** web app that acts as a **pulmonologist + calisthenics rehabilitator + pure-veg sports nutritionist** for Anakin — an ex/reducing smoker building a lean, slightly-muscular **75 kg** physique — with a transparent rule engine, daily/weekly/monthly repeatable plans, smoke-free streak tracking, and milestone celebration effects.

---

## 2. The user (Anakin) — real profile 🔒

| Field | Value | Engine effect |
|-------|-------|---------------|
| Name | **Anakin** | App greets by name |
| Weight | **56 kg** (range 55–57) | BMR input; **goal = `leanGain`** (−19 kg from 75 target) |
| Height | **175 cm** | BMR input |
| Age | **22** | BMR input |
| Sex | male *(assumed from name — editable)* | BMR formula variant |
| Training | **7 days/week** | activity = `very` (1.725); 6 train + 1 active-recovery |
| Smoking | **Reduce + rehab**, no quit date | streak tracks clean/reduced days; supportive framing |
| Symptoms | morning cough, exertional breathlessness, post-weed chest tightness (clears in hrs) | **conservative gating**, zone-2 start, prominent doctor-baseline nudge |
| Diet | **Lacto-veg, eggless** | dairy/whey + legumes/soy; no eggs |
| Equipment | **floor-only** (will buy essentials) | floor-first; bar/bands toggles unlock progressions |

**Reality note:** 56 → 75 kg is a **lean bulk** (~+18–20 kg lean mass) — a multi-month-to-multi-year journey at a healthy 0.25–0.5 kg/wk. Speed dial controls pace; milestones break it into wins.

---

## 3. Locked decisions (full rationale in `DECISIONS.md`)

| # | Decision | Choice |
|---|----------|--------|
| D1 | Build scope | 🔒 Show-stopper prototype first — self-contained, deployable, no build step |
| D2 | Plan brain | 🔒 Smart rule engine — deterministic, offline (no API key) |
| D3 | Aesthetic | 🔒 **REVISED → Breathy Claude-pastel light world** (was dark exterior; pivoted per user) |
| D4 | Motion level | 🔒 Full bonkers — Lenis + GSAP, canvas breath-field, custom cursor, milestone detonations |
| D5 | Tech stack | 🔒 Vanilla HTML/CSS/JS (ES modules) + CDN libs · `localStorage` · responsive |
| D8 | Palette | 🔒 **Official Anthropic/Claude colors → pastel "breath" extension** |
| D9 | Type | 🔒 **Fraunces** (breathy display) + **Inter** (UI) + **JetBrains Mono** (stats) — dropped Anton as too harsh for breathy |

---

## 4. Design system — 🔒 "Breathy Claude Pastels"

**Canvas (warm cream):** `--cream #FAF9F5` bg · `--paper #FFFFFF` surface · `--sand #F1ECE2` inset · `--haze #E8E6DC` border · `--ink #141413` text · `--ink-soft #57564F` secondary · `--ink-faint #8A887E` tertiary.

**Accents (Claude + pastel tints), mapped semantically:**
- 🔶 **Clay `#D97757`** → streak / energy / primary CTA · pastel `--clay-soft #F0D6CB`
- 🔷 **Sky `#6A9BCC`** → breath / lungs / cardio · pastel `--sky-soft #CFE0EF`
- 🟢 **Sage `#788C5D`** → nutrition / recovery / growth · pastel `--sage-soft #D6DEC8`

**Type:** Fraunces (display, soft optical serif — breathy) · Inter (UI) · JetBrains Mono (stats/eyebrows). Scale 12·16·20·28·40·64 + hero `clamp(3.5rem,11vw,11rem)`.

**Motion discipline:** `prefers-reduced-motion` honored · soft spring easing `cubic-bezier(.22,1,.36,1)` · breath cycle 4s · GPU transforms only · 1–2 hero anims per viewport.

---

## 5. Architecture (file map)

```
odyssey/
├── PROJECT_STATUS.md   ← this file
├── DECISIONS.md        ← decision log
├── BUILD_SPEC.md       ← technical spec (research swarm) ✅
├── index.html          ← SPA shell, fonts, libs, all screens     [✅]
├── css/styles.css      ← breathy-pastel design system + components [✅]
├── serve.py            ← no-cache static dev server (used by launch.json + Odyssey.app) [✅]
├── manifest.webmanifest · sw.js · icon*.png/svg · icon-macos.svg ← installable PWA + Ω icon source [✅]
├── Odyssey.command · deploy.command · LAUNCH.md  ← local launch / 1-click deploy / guide [✅]
│   (also: ~/Desktop/Odyssey.app — double-click launcher with the Ω icon)
└── js/
    ├── engine.js       ← pure rule engine + Anakin profile (TDEE, recovery, splits, readiness) [✅]
    ├── app.js          ← state, routing, render, persistence, sync, moves/sleep/profile UI [✅]
    ├── motion.js       ← Lenis + GSAP + breath-field (pauses off-screen) + intro (cursor removed) [✅]
    ├── onboard.js      ← calibration / edit-every-metric overlay   [✅]
    ├── chart.js        ← weight-trend SVG (pure)                   [✅]
    ├── exercises.js    ← 60-move encyclopedia (AUTO-GENERATED from workflow) [✅]
    ├── gate.js         ← invite-only LOGIN GATE (code OR password) — covers app until authed [✅]
    ├── cloud.js        ← Supabase auth + sync (code/password/reset, allowlist, free) [✅]
    └── config.js       ← Supabase keys + ALLOWED_EMAILS invite list [✅]
```
*Module imports use a `?v=` cache-bust (auth files at `?v=4`, unchanged modules at `?v=3`). Bump it (or rely on serve.py) when shipping CSS/JS changes; bump `CACHE` in `sw.js` (now `odyssey-v3`) for the PWA.*

---

## 6. Roadmap

- ✅ **P0 — Discovery:** scope + profile questions answered
- ✅ **P1 — Research & design system:** `ui-ux-pro-max` + `brand-guidelines` skills pulled · 4-expert swarm → `BUILD_SPEC.md`
- ✅ **P2 — Engine:** `engine.js` with Anakin defaults + leanGain math (verified: 2930 kcal, 135g protein, recovery curve, gating)
- ✅ **P3 — Shell + tokens:** `index.html` + `css/styles.css` (breathy Claude pastels)
- ✅ **P4 — Screens:** landing · cockpit · schedule · lung lab · nutrition · journey (6 working; onboarding deferred — values editable in-app)
- ✅ **P5 — Motion:** Lenis, breath-field canvas, custom cursor, scroll reveals, count-ups, milestone celebration takeover
- ✅ **P6 — Verify:** previewed desktop 1280 + mobile 390 · no console errors · celebration + speed-dial gating + breath-tile gating confirmed
- ✅ **P7 — Handoff:** PWA · desktop launcher · deploy scripts · docs
- ✅ **P8 — v2:** deep exercise library + Moves view · sleep + Readiness · routine-style picker · omega icon · cold-boot intro · perf pass · cloud sync live
- ✅ **P9 — Deployed:** GitHub Pages live, auto-redeploy on push; works on iPhone / iPad / anywhere
- 🔄 **P10 — Live polish:** ✅ invite-only login gate (code OR password, allowlist) built + verified locally · ⏳ Brevo SMTP + Supabase auth config to make live login deliver codes (§10) · build nutrition-regimes library

### Verified working (preview)
Engine math correct · all 6 views render · Day-One milestone takeover fires · speed dial gates Balanced/Relentless until 8/30 days · breath tiles gate by level · floor-only foundation exercises · mobile responsive (burger nav, stacked CTAs). Known cosmetic: hero word-swap cross-fades every 2.6s (clean in live motion).

### Done since v1 (all verified in preview)
- ✅ **Cloud sync** (Supabase, free, local-first) — magic-link auth + per-user sync + manual **"Sync now"**; **dormant until keys added** (see §10). `js/cloud.js`, `js/config.js`.
- ✅ **Date-based tracking** — `cleanDates[]` (real streak that breaks on a missed day), `weightHistory[]`, calendar-accurate heatmap.
- ✅ **Onboarding / edit-every-metric** — `js/onboard.js`: 10-step breathy calibration overlay (auto-opens first run, reopen via nav **Profile**); validated; preserves streak/weight history. Fixed a hoisting bug + hardened close.
- ✅ **Weight-trend chart** — `js/chart.js`: "The climb to 75 kg" cockpit chart (target line, kg-to-go, dated trend). Shows once weight is logged.
- ✅ **Installable PWA** — `manifest.webmanifest` + `sw.js` + real PNG/SVG icons. Add-to-Home-Screen, full-screen, offline shell. SW skips localhost (no stale dev cache) + network-first on `config.js`.
- ✅ **Desktop launcher + one-click deploy** — `Odyssey.command` (local + LAN phone URL), `deploy.command` (free Vercel), `LAUNCH.md`.
- ✅ **Omega (Ω) app icon** — all PWA/home-screen icons + favicon regenerated; a real `~/Desktop/Odyssey.app` (rounded `.icns`) double-click launcher. Sources: `icon.svg`, `icon-macos.svg`.
- ✅ **Deep exercise library** — `js/exercises.js`: **60 moves** (push/pull/legs/core/breathwork/mobility) with full form, cues, mistakes, muscles, breathing, tempo, ROM, progressions, per-level reps, "why it matters for you". New **Moves** view (browse + filter) + a rich **exercise-detail modal** clickable from Moves, Week & Today. (QA: all 52 named moves present, 0 missing/dupes.)
- ✅ **Cloud sync LIVE** — Supabase URL + publishable key in `config.js`; `odyssey_state` table created by user; client verified (chip → "Sign in"). Sign in via magic link to activate cross-device sync.
- ✅ **Sleep tracking + Readiness** — nightly hours+quality log → a 0–100 Readiness score (engine `computeReadiness`) that advises today's intensity, + 7-night bars. Verified (8h/great→100/high; 4.5h/poor→34/low→Gentle).
- ✅ **Routine styles** — engine now generates **Full-body** (all muscles every session), **Upper/Lower**, or **Push/Pull/Legs** with a "best for you" recommendation by training days. Selector in the Week view. Node-verified.
- ✅ **No-cache dev server** — `serve.py` (used by `launch.json` + `Odyssey.app`) so edits always show on reload; killed a duplicate plain server that was holding port 4178. Module imports carry `?v=3` cache-bust.

### Experience pass (verified)
- ✅ **Custom cursor removed** — native cursor; killed its global `pointermove` cost.
- ✅ **Cold-boot intro** — branded Ω → "ODYSSEY" → tagline + progress, exhales into the app (tap to skip; reduced-motion safe). `motion.intro()`.
- ✅ **Scroll/animation perf** — the breath-field now **pauses when off-screen** (it was drawing ~900 sprites/frame to a hidden canvas on every interior view — the main jank source) + fewer particles + DPR capped at 1.5.
- ✅ **Clean-day undo** — "Log a clean day" is now a toggle: logged → "✓ Logged today — tap to undo" (fixes accidental streak marks).
- ✅ **Sleep logging confirmed** — hours + quality → Readiness (verified 7h/Good → 81).
- ✅ **Desktop launcher fixed** — `Odyssey.app` & `Odyssey.command` now find `python3` by **absolute path** (GUI `.app`s get a minimal PATH without `/usr/local/bin`, so bare `python3` failed → "site can't be reached"), use `serve.py`, and **poll until the server responds** before opening the browser (no race). Server log: `/tmp/odyssey-serve.log`.

### Pending
- ⏳ **Proven nutrition regimes library** — the research workflow hit the **account session limit** (resets 2:10pm Asia/Calcutta). Training-structure regimes are delivered (the split styles); the deeper lean-gain/cut *nutrition* protocols are queued for a retry after reset (or I'll author them directly).

### Backlog (v3 — not yet built)
- Relapse/reset flow (supportive streak reset that preserves lifetime history)
- Per-day checklist persistence (per-date completion) + breathwork-minutes log
- Wearable import (steps/HR) to auto-tune the activity multiplier
- AI weekly insight layer (the D2 "Hybrid" option) — optional Claude API

---

## 7. Open questions (mostly resolved; remaining are minor)

- ✅ metrics, name, days/week, smoking approach, symptoms, equipment, diet — all answered
- ❓ **Sex** assumed male (from "Anakin") — flip in onboarding if wrong (changes BMR by ~166 kcal)
- ❓ **Baseline cigs/day + price** for the "cigarettes avoided / money saved" counters — using estimate (10/day) until you confirm
- ❓ **Current ability** (push-up? plank hold?) — engine starts at foundation regressions; tell me and I'll set the starting rung

---

## 8. Maintenance protocol

Updated at every phase boundary: bump date/phase/progress (§ top) · flip roadmap ✅/🔄/⏳ (§6) · log decisions in `DECISIONS.md` + mirror in §3 · resolve ❓ as answered (§7).

---

## 9. How to open, run & deploy

**🌐 Live (anywhere):** **https://pprem9300-ops.github.io/odyssey/** — open on any device; on iPhone/iPad: Safari → Share → **Add to Home Screen** for the full-screen Ω app.

**Ship an update:** `cd ~/Desktop/odyssey && git add -A && git commit -m "…" && git push` → GitHub Pages rebuilds in ~1 min. Bump `?v=` on changed module imports (or `CACHE` in `sw.js`) so clients get fresh assets.

**Run locally (dev):**
```bash
python3 ~/Desktop/odyssey/serve.py 4178 ~/Desktop/odyssey
# open http://localhost:4178   — OR double-click ~/Desktop/Odyssey.app
```
Use **`serve.py`** (no-cache), NOT plain `http.server`. Serve over http (not `file://` — ES modules). Preview config `odyssey` is in `.claude/launch.json`.

**Data reset:** browser console → `localStorage.removeItem('odyssey.profile.v1')`.

---

## 10. Auth + cloud-sync setup (Supabase + Brevo — free, ~10 min, no card)

The app is **invite-only**: `js/gate.js` shows a login gate until you sign in, with **two ways in** — an emailed **6-digit code** (recommended) **or** email + **password**. Codes/emails are delivered by **Brevo** (SMTP) because Supabase's built-in mailer is rate-limited (~2–3/hr → testing only). Supabase RLS keeps every user's data private to them. The `anon`/publishable key is public-by-design.

**Already done:** ✅ Supabase project live, `odyssey_state` table + RLS, keys in `js/config.js`, gate + auth code built & verified locally.

**⏳ TO DO (these are dashboard steps — I can't do them without your logins):**

**A. Brevo (the email sender) — free, 300 emails/day**
1. Sign up at [brevo.com](https://www.brevo.com) (free "Starter").
2. **Senders, Domains & Dedicated IPs → Senders →** add & **verify** a sender email (e.g. your Gmail — click the confirmation Brevo emails you). This is the "from" address.
3. **SMTP & API → SMTP** → note: **Server** `smtp-relay.brevo.com`, **Port** `587`, **Login** (your Brevo account email), and **generate an SMTP key** (the password). Copy the key.

**B. Supabase → point auth emails at Brevo**
4. **Project Settings → Authentication → SMTP Settings → Enable custom SMTP:**
   - Host `smtp-relay.brevo.com` · Port `587` · Username = your Brevo login · Password = the Brevo **SMTP key** · Sender email = the **verified** sender from step 2 · Sender name `Odyssey`.
5. **Authentication → Email Templates → "Magic Link"** → make sure the body includes the **code token** so "email me a code" delivers a 6-digit code (not only a link). Use e.g.:
   ```html
   <h2>Your Odyssey code</h2>
   <p>Enter this code to sign in:</p>
   <p style="font-size:28px;letter-spacing:6px"><strong>{{ .Token }}</strong></p>
   <p>Or tap: <a href="{{ .ConfirmationURL }}">sign in</a></p>
   ```
6. **Authentication → Providers → Email** → keep **Email** enabled; **password** sign-in is on by default. *(Optional: turn OFF "Confirm email" so a freshly created password account is usable instantly; with invite-only + the allowlist this is reasonable.)*
7. **Authentication → URL Configuration** → **Site URL** = `https://pprem9300-ops.github.io/odyssey/` and add to **Redirect URLs**: `https://pprem9300-ops.github.io/odyssey/**` (keep `http://localhost:4178/**` for local). Needed for password-reset/confirm links and the magic-link fallback.

**C. The invite list (in code — I seeded yours)**
8. `js/config.js` → `ALLOWED_EMAILS` already contains `pprem9300@gmail.com`. Add a line per invited person; `git push` to deploy. Only listed emails can sign in/up from the app.

**Verify:** open the live site → gate appears → enter your email → **Email me a code** → type the 6-digit code → you're in (or use a password). Sign out (Profile-area "Synced ✓" modal) re-shows the gate.

**Optional hardening — make invite-only *server-side* too (recommended).** The `ALLOWED_EMAILS` list is a **client** gate: it stops casual access and unwanted accounts in the UI, but the publishable key in `config.js` is public, so a determined person could call Supabase's signup API directly and self-provision an (empty) account. **RLS already prevents them seeing anyone else's data** — the only gap is unwanted account creation. To close it, pick one:
- **Easiest:** Supabase → **Authentication → Sign In / Providers** (or Auth → Settings) → turn **OFF "Allow new users to sign up."** Then create your account once (sign in via code while it's still on, or use the dashboard's **Add user**), and turn it off. New invitees need you to add them in the dashboard.
- **Keeps the in-code list working for self-signup —** add this trigger (SQL Editor → Run). It rejects any signup whose email isn't in an `allowed_emails` table:
  ```sql
  create table if not exists allowed_emails (email text primary key);
  insert into allowed_emails (email) values ('pprem9300@gmail.com') on conflict do nothing;

  create or replace function public.enforce_invite() returns trigger
    language plpgsql security definer as $$
  begin
    if not exists (select 1 from allowed_emails where lower(email) = lower(new.email)) then
      raise exception 'not invited';
    end if;
    return new;
  end $$;

  drop trigger if exists enforce_invite_trg on auth.users;
  create trigger enforce_invite_trg before insert on auth.users
    for each row execute function public.enforce_invite();
  ```
  Keep this table in sync with `ALLOWED_EMAILS` in `config.js` (the client list still drives the nice UI rejection message).

**Offline behavior (by design):** the gate needs Supabase to confirm your session. `supabase-js` is **vendored same-origin** (`js/vendor/supabase.umd.js`, precached by `sw.js`), so once you've signed in, the PWA opens **offline** with an unexpired session. A *first-ever* sign-in, or an expired session, needs a connection — offline cold-start then shows a clear "You're offline" message instead of looping.

