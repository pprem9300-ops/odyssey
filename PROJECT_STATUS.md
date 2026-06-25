# 🫁 ODYSSEY — Project Status

> **Read this file first.** It is the living source of truth for the Odyssey build.
> Companion docs: [`DECISIONS.md`](DECISIONS.md) (why we chose what) · [`BUILD_SPEC.md`](BUILD_SPEC.md) (technical spec — rule-engine formulas + screens + motion).

**Last updated:** 2026-06-26
**Current phase:** `P14 — Four feature increments (D22): deload + equipment toggles, body measurements + progress photos, training analytics + plate calculator, meal swaps + grocery list + macro history. Engine node-tested (39 asserts) + verified live. Only remaining optional: reminders/notifications (needs a push server).`
**Overall progress:** ▰▰▰▰▰▰▰ ~99% (auth · cinematic-dark · training brain v2 + graduation + reset/undo + deload/equipment + measurements/photos + analytics/plate + grocery/swaps — all live, verified). Cache-bust now `?v=20`, `sw odyssey-v20` (engine import `?v=6`, chart `?v=4`, exercises `?v=4`).
**🎨 Design = CINEMATIC DARK (D20):** `:root` in css is dark (void `#0B0B0C` / off-white `#F4F1EA` / pastels retuned to glow); `--font-grotesk` Space Grotesk for eyebrows+marquee, Fraunces for headlines. The old "breathy light pastel" is superseded — don't reintroduce light tokens.
**🌐 LIVE:** **https://pprem9300-ops.github.io/odyssey/** · repo `github.com/pprem9300-ops/odyssey` (public). Auto-redeploys on `git push origin main`. The app is **invite-only** — a login gate (`js/gate.js`) blocks access until you sign in (6-digit code via Brevo **or** email+password). Brevo SMTP + the `{{ .Token }}` email template + URL Configuration are **all configured and confirmed working** (real code delivered + signed in on phone).

> **Dev note (important):** the app is served by **`serve.py`** (no-cache) via `launch.json` + `Odyssey.app`. Module imports carry a `?v=` cache-bust (now `?v=17`). Do NOT use plain `python -m http.server` — it heuristically caches CSS/JS and you'll chase "my edits don't show" ghosts. Bump `?v=` (or rely on serve.py's no-cache) when shipping changes; bump `CACHE` in `sw.js` for the PWA.

---

## ▶ RESUME HERE (next session)

**Everything below is DONE, LIVE, and verified (2026-06-26, tree clean & pushed).** Shipped: invite-only auth (Brevo), the **cinematic-dark redesign**, native-scroll perf, the daily feature increments (water/mood/meals/sleep/journal/export), and — newest — the **performance-driven TRAINING BRAIN v2 (D21)**: calisthenics / aesthetics / **looksmaxx** programming that auto-progresses from your logged sets (basic→advanced) and is **decoupled from the smoke-free streak**, with agility/cardio/plyo woven into a pro week, an **auto-graduation** layer (retires easy moves + adds skill work after ~14 training-weeks / demonstrated peak / a manual "I'm ready" toggle), and **reset + undo across every log**. **Plus the D22 wave:** deload + equipment toggles, body measurements + progress photos (photos local-only), training analytics (volume + progression charts) + a plate calculator, and meal swaps + grocery list + macro history. Nothing is mid-flight. The only remaining optional item is reminders/notifications (needs a push server). **First, read this block + DECISIONS D18–D22 to reload context.**

**Key things a fresh session must know:**
- **Training brain is PERFORMANCE-DRIVEN (D21), NOT streak-gated.** `engine.js` is pure + node-testable (`computePlan(profile, EXERCISE_DB, now?)`). Progression comes from `profile.workoutLog`: `trainingLevel()` (stage + score), `adaptiveRung()` (double-progression + ladder climb, deduped per session), `aestheticBalance()` (V-taper/posture/looksmaxx 0–100 + weakest-link nudge). Intervals/plyo/agility unlock from logged sessions. The streak/recovery% is now the **wellness layer only** (breath unlocks, milestones). Library = **73 moves** (added agility/plyometric/conditioning families). To re-test: `cp js/{engine,exercises}.js /tmp/x/*.mjs` and run an importing `.mjs` (see D21).
- **Design = cinematic dark** (D20) — dark void + warm off-white + glowing pastel accents; Fraunces headlines + Space Grotesk eyebrows/marquee. Don't reintroduce light tokens.
- **Animations are CSS/IO/rAF only** (no gsap-ticker dependency). **Scroll is native** (Lenis removed — it caused stalls). Keep both: never gate critical logic on gsap/IO callbacks.
- **Feature pattern:** per-date data in `profile.{workoutLog,waterLog,moodLog,mealLog,journalLog}` (auto-syncs via Supabase); render a card once, then a `paint*()` toggles classes IN PLACE so CSS transitions animate (don't full-re-render on each tap).
- ⚠️ **The Claude preview FREEZES gsap.ticker + IntersectionObserver + timers** — motion/scroll/reveals/count-ups do NOT run there. Verify motion via: force end-state in eval (`.add('in')`) for screenshots, a `show_widget` demo (runs in the user's real browser), and live testing.
- ⚠️ **ALWAYS bump `?v=` on any changed JS/CSS import + `sw.js` CACHE** or the browser serves a stale module (bit us repeatedly). Now at `?v=20` / `sw odyssey-v20` (engine import `?v=6`, chart `?v=4`, exercises `?v=4`). ⚠️ Also: the fresh Claude-preview server boots at a **2px viewport** — `preview_resize` to 1440×900 before screenshots; the grid only defines `.col-12/8/7/6/5/4/3`.
- **DEV:** on localhost, `localStorage.setItem('odyssey.devbypass','1')` skips the login gate; seed `localStorage['odyssey.profile.v1']` to populate. ⚠️ A fresh Claude-preview server can boot at a 2px viewport — call `preview_resize` (e.g. 1440×900) before screenshots.

### ✅ Done 2026-06-22 → 06-26 (P12–P14 — newest first)
- **Four feature increments** (D22): deload + equipment toggles (Week view) · body measurements + progress photos (Journey; photos local-only in `odyssey.photos.v1`) · training analytics — weekly-volume bars + a movement-progression line (chart.js palette fixed to dark) + plate calculator · meal swaps + auto grocery list + macro-history. Engine: `deloadState`/`platePlan`/`groceryList`/`mealOptions`; 39 node asserts; verified live.
- **Auto-graduation + reset/undo** (`8542c7d`, D21 follow-up): Advanced phase after ~14 training-weeks / peak / manual "I'm ready" toggle → retires beginner moves (`adaptiveRung` `minIdx` floor) + auto-adds a skill block (`skillFor`: handstand / pistol / L-sit). Reset + undo on every log — exercise "Clear today", checklist/meals/water "Reset", global "Reset logs" in the account modal. **32 node asserts pass**; verified live.
- **Training brain v2 — performance-driven** (`0faa163`, D21): decoupled training from the streak; `trainingLevel` / `adaptiveRung` / `aestheticBalance` / `graduation` in `engine.js` (pure; `computePlan(profile, EXERCISE_DB, now?)`); pro weekly template (PPL/UL/full, undulating, warm-up→power→strength→conditioning→breath); cockpit reordered **training-first**; +13 agility/plyo/conditioning moves → **73-move** library. **Audit:** all logs save to localStorage + Supabase; fixed the one gap (Today checklist → `profile.checklistLog`).
- **Cinematic-dark redesign + daily feature increments** (P12): see DECISIONS **D20** + the FEATURE BUILD-OUT list below.

### ✅ Done this session (P11 so far)
- **Global skills installed** (reuse these): `~/.claude/skills/frontend-design` (Anthropic, design-philosophy) + `~/.claude/skills/awwwards-web-motion` (authored: one-ticker Lenis/GSAP setup, scroll storytelling, transitions, **60fps anti-jank checklist**, reference ideology). Plus existing `ui-ux-pro-max`. **Invoke `awwwards-web-motion` + `frontend-design` for all of the below.**
- **Research artifact** (palettes B/C, full motion+perf playbook, scroll-Journey design, lungs spec, skills list) was generated by a workflow. The key content is mirrored in `DECISIONS.md` **D19**. (Raw file `…/tasks/ws6h68l7u.output` is in ephemeral `/tmp` — may be gone; rely on D19.)
- **Palette A "Restored Clinic" applied** to `css/styles.css` `:root` (gallery-white `#FCFCFB` / near-black `#0E0E0C` / hot clay `#D9542B`). **⚠️ USER NOW WANTS THIS CHANGED** (see asks).
- **Motion tokens** added: `EASE`/`DUR` in `js/motion.js`; `--ease`/`--ease-in`/`--ease-io`/`--d-*` in css.
- **`transitionView()`** (clip-path wipe) + **`revealHeadline()`** (masked split-line) added to motion.js; `switchView` now wraps in `transitionView`. ⚠️ The clip-path wipe may collapse (GSAP tweening `inset()` strings is unreliable) — **verify/replace** (a crossfade via `autoAlpha` is the safe swap).
- **Lungs redesigned** → anatomical SVG (trachea/carina/bronchial-tree/3+2 lobes) in `lungsSVG()` (app.js), uses `var(--sky/--sage/--clay)` so it auto-adapts to any palette, recovery-driven fill + CSS breathing. ✅ keep.
- **Mobile** already fixed earlier (nav dropdown, sleep-grid collapse, safe-areas, no h-scroll).
- **DEV BYPASS**: on localhost only, run `localStorage.setItem('odyssey.devbypass','1')` to skip the login gate (`js/gate.js`); seed a test profile into `localStorage['odyssey.profile.v1']` (e.g. `{streakDays:40,weeksElapsed:5,cleanDates:[...40 ISO dates...],currentWeight:56,...}`). The intro overlay (z-10000) blocks clicks for ~3.5s — remove `#intro` via eval when testing.

### ✅ DONE 2026-06-20 (latest)
- **HERO redesigned** — removed the particle breath-field (`#breath-field` canvas deleted from index.html → also killed the main scroll-lag source) and the "Smoke becomes…" word-swap copy. New clean editorial hero "Rebuild your lungs. Rebuild yourself." + retuned `.hero h1` size; the `.hero` radial-mist gradient now shows as a soft pastel bg. Verified in browser. (`initHero` word-swap + `breathField()` are now dead no-ops — safe to delete later.)
- **PREMIUM PASTEL multi-accent palette applied** (supersedes single-accent A/B/C) — `:root` in styles.css: cream `#FAF8F4` / ink `#14130F` / coral `--clay #DD6A47` / periwinkle `--sky #6E9AD4` / sage `--sage #87A36C` / NEW `--lilac #A695D6` (+ -deep/-soft/-mist each). `motion.js` `COLORS` updated. High-contrast dark text on soft pastel surfaces = clean/premium, multi-color not monotone. **`--lilac` defined but not yet wired** (use it for the sleep/readiness card). Tweak `:root` freely.
- **STREAK RESET added** — "↺ Reset streak" button on the cockpit streak block → confirm → clears `cleanDates`/`streakDays`/`weeksElapsed` (weight+plan kept). `resetStreak()` in app.js, wired in enterApp, `.streak-reset` css. (Code verified/parses; quick visual check still pending.)

- **DETAILED EXERCISE TRACKER added** (✅ pushed `290330f`) — in the exercise modal: log actual **sets (reps × kg)** per exercise per day, **history** list + **PR** badge (est-1RM/bodyweight reps), last-session prefill as target. Persisted in `profile.workoutLog` (`{date:{exerciseName:[{reps,weight}]}}` → syncs via cloud). Today checklist reflects logged sets ("✓ Logged 12 reps, 10 reps") + marks the row done. Helpers: `wLog/exSetsToday/exHistory/exLastSets/exPR/saveExerciseLog/setLabel/fmtDate` in app.js. Verified desktop+mobile, no console errors.

- **SCROLL-DRIVEN JOURNEY built** (✅ pushed `491813b`) — `#view-journey`: a filling progress spine (`#journey-fill`, scrubbed `scaleY` to the **real achieved fraction**, clay→sage gradient) + **sticky readout** aside on desktop (`.journey-aside`, CSS `position:sticky` — NOT gsap pin, which breaks mobile) + milestone nodes that reveal via IntersectionObserver (`.reveal`+`data-d`, robust without the ticker). `journeyScroll()` in motion.js (fill only), `initJourneyScroll()` in app.js (called from `switchView('journey')`). Verified: design renders desktop; mobile no-overflow + aside un-sticks.
- **View transition made bulletproof** — `transitionView` now swaps on a **real `setTimeout`, not a gsap callback**, so navigation never depends on the ticker advancing. (The clip-path wipe is gone; it's an `autoAlpha` fade now.)
- **`--lilac` wired** into the sleep/readiness card (`card--lilac`). Palette is genuinely 4-accent.

> ⚠️ **PREVIEW-TESTING GOTCHA (important for next session):** the Claude preview/headless browser **freezes `gsap.ticker` at frame 0** (requestAnimationFrame + timers are throttled when it isn't actively rendering). So **gsap-driven transitions/scrubs/reveals do NOT animate in the preview, and gsap-callback-gated logic won't run** — making nav/transitions look "broken" in preview when they're fine live. Verify gsap motion by (a) forcing state via eval (toggle `.is-active`, add `.in`, set inline `transform`) for screenshots, and (b) trusting standard ScrollTrigger/IO code + testing on the **live** site. Don't gate critical logic (like view-swap) on gsap callbacks.

- **PERF PASS done** (✅ pushed `1cd0b1a`) — user reported "stuttery/slow on each page". Fixes: **instant view transitions** (was an ~800ms gsap/timer wipe per nav → `transitionView` now just `swap()`, CSS `viewIn` .3s fade only); **deferred** magnetic-bind + `ScrollTrigger.refresh` + journey one `rAF` after swap (no nav hitch); **bindMagnetic caches the rect** on pointerenter (was reading `getBoundingClientRect` every pointermove = layout thrash); **lighter Lenis** (`lerp 0.1`, `syncTouch:false` → native momentum on mobile); **`content-visibility:auto`** on the 60 Moves cards. ⚠️ Couldn't measure FPS (preview freezes the ticker) — **profile live at 4× CPU throttle to confirm**; if still janky, next lever is disabling Lenis on coarse-pointer/low-`deviceMemory`.

- **Scroll FIXED — Lenis removed → native scroll** (was hijacking scroll, causing "stops moving"/"freeze-frames"). ScrollTrigger runs on native scroll fine.
- **Subtle animation set applied (user-approved via a live demo widget)** — all **CSS/IO/rAF based, NO gsap-ticker dependency**: `.reveal` (14px rise + fade, .55s, 70ms stagger), masked headline line-wipe (`revealHeadline` rebuilt CSS+IO), hover/press (btn lift 2px + active scale), `countUp` (rAF ease-out), marquee, viewIn crossfade. Tuned subtle.

> ⚠️ **PREVIEW LIMITATION (critical for verifying motion):** the Claude headless preview **freezes both `gsap.ticker` AND IntersectionObserver** (no real rendering) — so gsap animations, IO scroll-reveals, count-ups, and timed transitions DON'T run there; reveals stay at opacity 0. **To verify motion: force end-state via eval** (`document.querySelectorAll('.reveal,.ln').forEach(e=>e.classList.add('in'))`) for screenshots, build a **show_widget demo** (renders in the user's REAL browser — true motion test), and test on the **live** site. Never gate critical logic on gsap/IO callbacks; keep fallbacks.
> ⚠️ **STALE-MODULE TRAP:** editing a JS/CSS file but NOT bumping its `?v=` makes the browser run the OLD module/styles (even with serve.py no-cache). **ALWAYS bump `?v=` on changed imports + `sw.js` CACHE.** Currently `?v=10`, `sw` `odyssey-v10`.

### 🚧 FEATURE BUILD-OUT (user picked Workout + Nutrition + Wellness depth, shipping incrementally)
**Pattern established** (reuse it): per-date data in `profile.{workoutLog,waterLog,moodLog}` (auto-syncs via cloud); render the card structure once, then a `paint*()` toggles classes IN PLACE so CSS transitions animate (don't full-re-render on each tap). Reflect in the Today checklist where relevant.
- ✅ **Nutrition — water tracker** (`55ef9a0`): Fuel hydration card → fillable glass pips, target from bodyweight, `waterLog`.
- ✅ **Wellness — mood check-in** (`88a81cb`): cockpit card, Rough→Great, `moodLog`.
- ✅ **Workout — training progress + PRs** (`1f7cdf7`): Week view aggregates `workoutLog` → sessions/sets/volume + personal-records list.
- ✅ **Nutrition — per-meal check-off** (`d2ac6d2`): tappable Fuel meal rows, logged-protein tally, `mealLog`.
- ✅ **Wellness — weekly insight** (`96f8d6f`): Journey 'This week' card, adaptive sentence + chips from all daily logs (last 7 days).
- ✅ **Workout — rest timer** (`5360fc1`): exercise-modal coral ring countdown, Start/Pause, ±15, vibrate at 0.
- ✅ **Wellness — journaling + data export** (`347e325`): daily note on the mood card (`journalLog`); 'Export data' in account modal → JSON backup of all logs.
- ✅ **TRAINING BRAIN v2 — performance-driven (D21)**: exercises auto-progress from `workoutLog` (basic→advanced); cockpit-lead **aesthetic/looksmaxx index** (V-taper/posture/consistency + weakest-link nudge); **agility · cardio · plyometrics** woven into a pro, undulating calisthenics week; **decoupled from the streak**; Today checklist now **persisted** (`checklistLog`); Today view reordered **training-first**. Library → **73 moves**.
- ✅ **AUTO-GRADUATION + RESET/UNDO (D21 follow-up)**: after ~14 training-weeks OR peak OR a manual "I'm ready" toggle, an **Advanced phase** retires beginner moves (rung floor rises) and **auto-adds skill work** (handstand/pistol/L-sit) per session. Plus **reset + undo everywhere** — per-exercise "Clear today", checklist/meals/water "Reset", and a global "Reset logs" in the account modal. Node-tested (32 asserts), verified live.
- ✅ **Workout** (D22) — training analytics (weekly-volume bars + movement-progression line) + **plate calculator**.
- ✅ **Nutrition** (D22) — **meal swaps** (3 alternatives/slot) + auto **grocery list** + **macro-history** chart.
- ✅ **Wellness** (D22) — **body measurements** (waist/chest/arm/thigh/weight + colour-coded deltas) + **progress photos** (local-only, before/after compare).
- 🔜 **Reminders / notifications** — the ONLY remaining queued item (⚠️ true push needs a push server + SW push handlers; a static PWA can only do local `Notification` while open — scope honestly before building).

### 🔜 ALSO OPEN
1. **Confirm perf live** (4× CPU throttle, real device). If still janky on low-end, native scroll is already in; next lever is trimming reveals.
2. Nutrition-regimes "Regimes" view (proven lean-gain/cut protocols).

### Standing (unchanged)
- Invite more people: add email to `ALLOWED_EMAILS` in `js/config.js`, `git push`. Optional server-side allowlist hardening in §10.

**Run locally:** `python3 ~/Desktop/odyssey/serve.py 4178 ~/Desktop/odyssey` → `http://localhost:4178` (or `~/Desktop/Odyssey.app`). **Ship:** `cd ~/Desktop/odyssey && git add -A && git commit -m "…" && git push` (Pages rebuilds ~1 min). **Bump `?v=` on changed module imports** (auth files at `?v=4`) and `CACHE` in `sw.js`.

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
- 🔄 **P10 — Live polish:** ✅ invite-only login gate (code OR password, allowlist) **LIVE — Brevo SMTP + code template + URL config done, sign-in verified on phone** · ⏳ build nutrition-regimes library · optional server-side allowlist hardening (§10)

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

**✅ DONE & verified live (2026-06-20):** Supabase project + `odyssey_state` table + RLS · gate + auth code · **Brevo SMTP wired into Supabase** · Magic-Link template emits `{{ .Token }}` (6-digit code) · Auth URL Configuration set. A real code was delivered and sign-in confirmed on phone. The steps below are kept as the reference for re-doing it or onboarding a new device/provider.

**Setup reference (dashboard steps):**

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

