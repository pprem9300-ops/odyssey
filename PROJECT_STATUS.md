# 🫁 ODYSSEY — Project Status

> **Read this file first.** It is the living source of truth for the Odyssey build.
> Companion docs: [`DECISIONS.md`](DECISIONS.md) (why we chose what) · [`BUILD_SPEC.md`](BUILD_SPEC.md) (technical spec — rule-engine formulas + screens + motion).

**Last updated:** 2026-06-19
**Current phase:** `P8 — v2 shipped (cloud sync live · deep library · sleep · routines · omega icon · intro · perf)`
**Overall progress:** ▰▰▰▰▰▰▰ ~96% (running & verified; only the nutrition-regimes library is outstanding)

> **Dev note (important):** the app is served by **`serve.py`** (no-cache) via `launch.json` + `Odyssey.app`. Module imports carry a `?v=3` cache-bust. Do NOT use plain `python -m http.server` — it heuristically caches CSS/JS and you'll chase "my edits don't show" ghosts. Bump `?v=` (or rely on serve.py's no-cache) when shipping changes; bump `CACHE` in `sw.js` for the PWA.

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
    ├── cloud.js        ← Supabase sync (free, local-first)         [✅]
    └── config.js       ← Supabase keys (SET — sync live)           [✅]
```
*Module imports use `?v=3` cache-bust. Bump it (or rely on serve.py) when shipping CSS/JS changes.*

---

## 6. Roadmap

- ✅ **P0 — Discovery:** scope + profile questions answered
- ✅ **P1 — Research & design system:** `ui-ux-pro-max` + `brand-guidelines` skills pulled · 4-expert swarm → `BUILD_SPEC.md`
- ✅ **P2 — Engine:** `engine.js` with Anakin defaults + leanGain math (verified: 2930 kcal, 135g protein, recovery curve, gating)
- ✅ **P3 — Shell + tokens:** `index.html` + `css/styles.css` (breathy Claude pastels)
- ✅ **P4 — Screens:** landing · cockpit · schedule · lung lab · nutrition · journey (6 working; onboarding deferred — values editable in-app)
- ✅ **P5 — Motion:** Lenis, breath-field canvas, custom cursor, scroll reveals, count-ups, milestone celebration takeover
- ✅ **P6 — Verify:** previewed desktop 1280 + mobile 390 · no console errors · celebration + speed-dial gating + breath-tile gating confirmed
- 🔄 **P7 — Handoff:** see §9 below

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

## 9. How to open, run & deploy (P7 handoff)

**It's a zero-build static site** — `index.html` + `css/` + `js/`. No npm, no compile.

**On your MacBook (local):**
```bash
cd ~/Desktop/odyssey
python3 -m http.server 4178
# open http://localhost:4178
```
(A preview config named `odyssey` is already in `.claude/launch.json`.)
*Note:* open via a server, not `file://` — the JS uses ES modules which browsers block on `file://`.

**On your iPhone:** deploy it (below) and open the URL, then "Add to Home Screen" for an app-like, full-screen launch. Same data lives per-device in `localStorage` (no account yet — that's the D1 "round two" cloud-sync option).

**Deploy (free, ~2 min) — any of:**
- **Netlify Drop:** drag the `odyssey` folder onto app.netlify.com/drop → instant URL.
- **Vercel:** `npx vercel` in the folder.
- **GitHub Pages:** push to a repo → Settings → Pages → deploy from root.

**Data reset:** clear it from the browser console — `localStorage.removeItem('odyssey.profile.v1')`.

---

## 10. Cloud sync setup (Supabase — free, ~10 min, no card)

The app runs **local-first**: it works with zero setup (on-device). Do this only when you want your streak/weight/plan to **sync across iPhone + MacBook**. Free forever for a personal app.

1. **Create the project** — go to [supabase.com](https://supabase.com) → sign up → **New project** (Free plan, no credit card). Wait ~2 min for provisioning.
2. **Create the table** — open **SQL Editor** → **New query** → paste & **Run**:
   ```sql
   create table if not exists odyssey_state (
     user_id uuid primary key references auth.users on delete cascade,
     data jsonb,
     updated_at timestamptz default now()
   );
   alter table odyssey_state enable row level security;
   create policy "own row only" on odyssey_state
     for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
   ```
3. **Copy your keys** — **Settings → API** → copy **Project URL** and the **anon public** key into `js/config.js`:
   ```js
   export const SUPABASE_URL = 'https://YOURPROJECT.supabase.co';
   export const SUPABASE_ANON_KEY = 'eyJ...your-anon-key...';
   ```
4. **Email auth** is on by default (magic link). *(Optional: Authentication → Providers → Email → turn off "Confirm email" for instant one-tap links.)*
5. **Add your deployed URL** to **Authentication → URL Configuration → Redirect URLs** (e.g. your Netlify/Vercel URL) so magic links open the live app.

Then: nav button shows **Sign in** → enter email → tap the magic link on each device → **Synced ✓**. The `anon` key is public-by-design (Row-Level Security means each user touches only their own row).

