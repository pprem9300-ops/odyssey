# 🫁 ODYSSEY — Project Status

> **Read this file first.** It is the living source of truth for the Odyssey build.
> Companion docs: [`DECISIONS.md`](DECISIONS.md) (why we chose what) · [`BUILD_SPEC.md`](BUILD_SPEC.md) (technical spec — rule-engine formulas + screens + motion).

**Last updated:** 2026-06-20
**Current phase:** `P9 — DEPLOYED & live (GitHub Pages) · usable on iPhone / iPad / anywhere`
**Overall progress:** ▰▰▰▰▰▰▰ ~97% (live & verified; remaining: live sign-in redirect config + nutrition-regimes library)
**🌐 LIVE:** **https://pprem9300-ops.github.io/odyssey/** · repo `github.com/pprem9300-ops/odyssey` (public). Auto-redeploys on `git push origin main`. ⚠️ Magic-link sign-in on the live URL needs the Pages URL added to **Supabase → Auth → URL Configuration** (Site URL + Redirect `…/odyssey/**`).

> **Dev note (important):** the app is served by **`serve.py`** (no-cache) via `launch.json` + `Odyssey.app`. Module imports carry a `?v=3` cache-bust. Do NOT use plain `python -m http.server` — it heuristically caches CSS/JS and you'll chase "my edits don't show" ghosts. Bump `?v=` (or rely on serve.py's no-cache) when shipping changes; bump `CACHE` in `sw.js` for the PWA.

---

## ▶ RESUME HERE (next session)

**State:** fully built, verified, and **deployed live** → https://pprem9300-ops.github.io/odyssey/ (auto-redeploys on `git push origin main`). `gh` CLI is installed + authed as **`pprem9300-ops`**. Repo: `github.com/pprem9300-ops/odyssey` (public; only the public-safe Supabase publishable key is committed).

**Immediate next actions (priority order):**
1. **Make live sign-in work** — the user must add the Pages URL in **Supabase → Authentication → URL Configuration**: Site URL = `https://pprem9300-ops.github.io/odyssey/`, and Redirect URLs += `https://pprem9300-ops.github.io/odyssey/**`. Then verify the magic-link round-trip on the live site (sign in → "Synced ✓" → data syncs across devices).
2. **Build the nutrition-regimes library** (the one unbuilt feature) — proven **lean-gain + cut** protocols as a browsable view. The `odyssey-proven-regimes` research workflow failed earlier (account session limit); either re-run it or author the content directly, then add a "Regimes" view + nav link.
3. Optional: §6 backlog (relapse/reset flow, per-day checklist persistence, wearable import, AI weekly insight).

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
- ✅ **P7 — Handoff:** PWA · desktop launcher · deploy scripts · docs
- ✅ **P8 — v2:** deep exercise library + Moves view · sleep + Readiness · routine-style picker · omega icon · cold-boot intro · perf pass · cloud sync live
- ✅ **P9 — Deployed:** GitHub Pages live, auto-redeploy on push; works on iPhone / iPad / anywhere
- 🔄 **P10 — Live polish:** verify live magic-link sign-in (needs Supabase redirect config) · build nutrition-regimes library

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

## 10. Cloud sync setup (Supabase — free, ~10 min, no card)

**Status:** ✅ steps 1–4 DONE — project live, `odyssey_state` table + RLS exist, keys are in `js/config.js`, client verified. **⏳ Remaining = step 5** (add the live Pages URL to the redirect allowlist so magic-link sign-in works on the deployed site).

The app runs **local-first** (on-device, zero setup); this section is what makes it **sync across devices**. Free forever for a personal app.

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
5. **⏳ DO THIS (only remaining step):** **Authentication → URL Configuration** → set **Site URL** = `https://pprem9300-ops.github.io/odyssey/` and add to **Redirect URLs**: `https://pprem9300-ops.github.io/odyssey/**` (keep `http://localhost:4178/**` for local). This is what makes magic-link sign-in work on the live site.

Then: nav button shows **Sign in** → enter email → tap the magic link on each device → **Synced ✓**. The `anon` key is public-by-design (Row-Level Security means each user touches only their own row).

