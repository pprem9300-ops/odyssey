# 🧭 ODYSSEY — Decision Log

Append-only record of every locked decision and *why*. Newest at top.
See [`PROJECT_STATUS.md`](PROJECT_STATUS.md) for current state.

---

## 2026-06-26 — D27 · Bespoke per-view scroll moments (Lab/Week/Fuel pins) + Lenis on ALL phones

Follow-up to D26: push the motion per-view. **User chose (via a quick options ask) to run Lenis smooth-scroll on ALL phones** — explicitly overriding the "mobile stays native" default and accepting the historical jank risk; **pins stay desktop-only** (a pin + mobile's resizing toolbar viewport genuinely breaks layout — not a stylistic choice).

- **`initViewScroll(name)` (motion.js):** desktop-only **pins** via `gsap.matchMedia('(min-width:769px)')` (auto-reverts off mobile → no pin-spacer/dynamic-viewport trap) + **universal parallax** (transform-only, all devices). All triggers target **persistent mount nodes** (innerHTML swaps on re-render, the node stays) and are rebuilt through ONE reverted `matchMedia` → **re-render-safe**. Wired from `switchView` (on enter) AND the end of `renderAll` (active bespoke view) so a data-log re-render rebuilds the triggers on fresh DOM.
  - **Lung Lab** — pin `.lab-hero`, scrub the lungs *alive* (scale 0.9→1.06 + opacity) as you scroll; mobile gets a light lungs parallax.
  - **Week** — pin `#train-progress` (hold the analytics while you read the charts) + parallax `#periodize`/`#plate-card`.
  - **Fuel** — pin `#macro-band` (a brief "here are your macros" hold) + parallax `#food-rail`.
- **Lenis on all phones:** `initSmoothScroll` drops the coarse-pointer/low-`deviceMemory` gate (keeps the reduced-motion gate), `syncTouch:true` + `touchMultiplier:1.6` so Lenis drives touch scrolling. **The old jank was Lenis's own rAF fighting the ticker + the particle canvas — both gone — so the one-ticker setup should hold; still, `syncTouch:true` is the historically risky setting → confirm on a real phone. One-line dial-back = `syncTouch:false`** (Lenis active, native touch momentum). **→ Applied as D27.1 (`4c78338`): the phone stuttered with `syncTouch:true`, so it's now `false` — desktop stays smooth (wheel/trackpad), mobile uses native iOS touch momentum, and the per-view parallax/reveals still run on mobile via ScrollTrigger on native scroll. Lesson re-confirmed: don't let Lenis drive touch on this app.**
- **`lenisStop`/`lenisStart`** wired on the exercise / SOS / sync / celebrate overlays (open→stop, close→start) so the page can't drift behind a modal on touch.

Guardrails held: `engine.js`/`exercises.js`/`cloud.js`/`gate.js` untouched (only `motion.js`, `app.js`, `index.html`, `sw.js`). Verified in preview: no console errors, exactly the expected triggers (1 pin-spacer, no leak), views not collapsed (Fuel 3243px). ⚠️ pins/parallax/Lenis don't animate in the frozen preview → **live verification pending.** Cache-bust → `app.js?v=26`, `motion.js?v=13`, `sw odyssey-v26` (css unchanged at `?v=24`).

---

## 2026-06-26 — D26 · Full design + motion refactor → "OXYGEN" (BUILT — supersedes D25's plan + D20's palette as the design north-star)

Executed D25's brief. Studied the three Framer refs' technique (deep-dark + one warm accent, big editorial type, smooth scroll, scroll-linked reveals, restraint), ran the `awwwards-web-motion` + `frontend-design` + `ui-ux-pro-max` skills, and **got sign-off via a `show_widget` live demo (palette + type + motion toggles) BEFORE any teardown.** User chose **Oxygen** palette + **Fraunces** serif + full cold-boot + "all kinds of fancy animations." Refactored incrementally (token layer → motion engine → wire → verify → landing polish) and shipped (`fe28c1e`).

**Direction = "OXYGEN"** — subject-grounded to escape the generic "dark + one bright accent" AI-default `frontend-design` flagged: the interface is *breathing, oxygenated space*, and **colour temperature is the recovery metaphor** — **oxygen-teal `#4FD4C4`** (breath/lungs/recovery) ↔ **ember-coral `#FF6B42`** (energy/streak/CTA), with a `--grad` teal→coral "vital gradient" as the one signature element per view. Deeper, slightly-cool void `#08090C` + warm off-white `#F2EEE6` + muted sage/lilac. Kept the 4 accent var families (clay/sky/sage/lilac) so the swap is mostly a `:root` flip + `chart.js`/confetti hexes — components adapt automatically.

**Type:** kept **Fraunces** serif headlines (the warm, distinctive signature — deliberately *unlike* the refs' grotesques, which keeps Odyssey un-templated) at a bigger/tighter scale; Space Grotesk eyebrows/data; Inter body; JetBrains mono.

**Motion (`js/motion.js` rebuilt, every export preserved):**
- **Lenis re-introduced the correct way** (it was pulled earlier for jank): **ONE ticker** driven by `gsap.ticker` (`lagSmoothing(0)`, `lenis.on('scroll',ScrollTrigger.update)`, no second rAF), **gated on reduced-motion / `(hover:none),(pointer:coarse)` / low `deviceMemory`/Save-Data** → desktop-only; mobile + low-end keep native scroll. **No gsap pins anywhere** (journey rail = CSS `position:sticky` + scrubbed `scaleY`; hero parallax = scrub-without-pin) → no mobile pin-spacer trap. The old jank came from Lenis's own rAF fighting the ticker + the particle canvas — both gone.
- **Cinematic cold-boot** (`intro()`): breath-omega blurs/scales in (`back.out`) → wordmark+tag rise → loading rail fills with a live `%` counter → clip-away + omega punch; tap-to-skip; reduced-motion = quick fade.
- **Hero** owned by `initHero` (excluded from the global `initReveals`): masked split-line title + staggered eyebrow/lead/CTA + breathing **oxygen aura** (CSS) + desktop scroll parallax.
- **Top scroll-progress rail** (`initScrollProgress`, rAF-throttled, transform-only) replaced the inline nav handler. Reveals (IO), masked headlines, magnetic (cached rect, off on coarse), count-ups (rAF), journey spine (scrubbed), pacer, recoloured confetti all kept. **View-swap stays swap-first — never gated on gsap/IO** (the hard rule). Dead `breathField` canvas + hero word-swap deleted (safe no-op `breathField` export kept).

**Guardrails held:** `engine.js` / `exercises.js` / `cloud.js` / `gate.js` **untouched** — only `css/styles.css`, `js/motion.js`, `js/app.js` (import bumps + dead-call removal + `initScrollProgress` swap), `js/chart.js` (HEX), `index.html`, `sw.js`. Feature pattern intact. Verified in preview (desktop 1440 + mobile 375): no console errors, engine + synced data render, no horizontal scroll, ring teal. Cache-bust → `?v=24`, `sw odyssey-v24` (motion `?v=11`, chart `?v=5`). ⚠️ Preview freezes gsap.ticker/IO/Lenis-raf → motion proven via the show_widget demo + force-state; **live perf/cold-boot to confirm on the real device.**

---

## 2026-06-26 — D25 · Full design + animation refactor (PLANNED → DELIVERED in D26 "Oxygen")

User wants a **major overhaul of animation, visual design and overall feel** — more interactive, awwwards-grade, with a smooth scroll-driven journey — now that all features/views/links exist. **The cinematic-dark direction (D20) is intentionally being evolved/replaced** (this supersedes D20 as the design north-star once the new direction is chosen).

**References** (replicate the motion language, scroll journey, smoothness + **colour mood** with our OWN original code — study the techniques/engine; do **not** copy their code or assets): `wearedaima.framer.website`, `agentura.framer.website`, `dragonfly.xyz`. All Framer sites → expect Framer Motion + smooth-scroll + scroll-linked reveals; dragonfly likely adds WebGL/canvas. User likes the animation, design AND colour of all three.

**Approach (next session, fresh context):** (1) research the refs' techniques; (2) propose a palette/type/motion direction and get sign-off via a `show_widget` live demo BEFORE any teardown; (3) refactor incrementally — motion/token layer (`css :root` + `js/motion.js`) first, then per view; re-introduce **Lenis** smooth-scroll via the `awwwards-web-motion` one-ticker setup (gated on `prefers-reduced-motion` + low `deviceMemory`, pins off on mobile); animate transform/opacity/clip-path only; (4) verify (preview freezes gsap.ticker/IO + boots at a 2px viewport → `preview_resize` 1440; use force-state screenshots + `show_widget` + live), bump `?v=` + `sw.js` CACHE, ship, update docs + memory.

**Guardrails:** the `engine.js` intelligence (performance progression, graduation, aesthetic/looksmaxx, body-comp, adaptive cals, training-load, coach, measurement trends, editable target) and the synced `profile.*Log` data MUST keep working untouched. Keep the feature pattern. Never gate critical logic (view-swap, saves) on gsap/IO callbacks. **Push notifications: declined by the user.** Full brief in PROJECT_STATUS "▶ RESUME HERE → 🎨 NEXT UP".

---

## 2026-06-26 — D24 · Last-state persistence + photos→cloud · editable goal weight · measurement-aware calc

Three asks across two shipped increments.

**Persistence + all-data-in-cloud (`83c5454`):** the last open view is saved to localStorage on every nav and restored on boot — the app **reopens where you left off** (device-local UX, intentionally not synced). **Progress photos moved from a local-only key into `profile.photoLog` → now synced to localStorage + Supabase** (this SUPERSEDES the D22 "photos local-only" decision), with a one-time migration from the old key, compressed to 600px q0.6 and capped at the last 12 to keep each profile push sane. Everything recorded is now in the cloud when signed in.

**Editable goal weight (`eeae6ce`):** the 75 kg target was a hardcoded `const`; now an editable per-profile field. `targetOf(p)` (default 75, backward-compatible with saved profiles) threads through `selectGoal` / `macros` (protein+fat anchor) / `aestheticBalance` / `weightTrend` / `computePlan` stats / the weight milestone (scales to target−3) and every "75" UI string. A goal **stepper lives on the cockpit weight card**.

**Measurement-aware calculation layer (`eeae6ce`):** measurements now drive the MATH, not just the body-comp readout. `bmr(p)` uses **Katch-McArdle** (370 + 21.6·LBM) from the estimated lean mass when measurements exist (else Mifflin-St Jeor) → measurement-accurate TDEE/calories (shown with a "calibrated to your composition" note). `selectGoal` is **body-fat-aware** (carrying fat under target → recomp, not a bulk). `measurementTrends(p)` compares the latest entry vs one ~3 weeks prior → V-taper-sharpening / fat-gain / leaning-out **coach directives** + a stale-measurement nudge.

60 node asserts (10 new); verified live. **Install as an app:** iPhone Safari → Share → Add to Home Screen; Mac Safari 17+ → File → Add to Dock (or Chrome → Install page as app) — pointed at the live Pages URL. Cache-bust → `?v=23` (engine `?v=8`), `sw odyssey-v23`.

---

## 2026-06-26 — D23 · Intelligence layer (synthesise the logs into accurate state + adaptive direction)

User: "add all smart features that make the app more accurate and comprehensive in direction and current state." The app now *collects* a lot, so the leap is to *synthesise* it. All pure engine, node-tested (**50 asserts**), surfaced cleanly.

- **Body composition** — `bodyComposition(p)`: **RFM body-fat %** (`64 − 20·height/waist` for men) from the measurements, lean/fat mass, and the **shoulder:waist V-taper ratio vs the golden 1.618** (added a `shoulder` measurement). Quantifies the looksmaxx goal. Shown in the measurements card + a line in the aesthetic card.
- **Adaptive nutrition** — `weightTrend(p)` least-squares-regresses the logged weigh-ins → real **kg/wk rate** + pace vs the goal's ideal band; `adaptiveCalories(p)` turns that into a **calorie nudge** ("gaining 1.05 kg/wk — trim ~200 kcal"). **ETA to 75 kg now comes from the real trend** (`stats.etaWeeks`), not a static formula.
- **Comprehensive readiness + training load** — `trainingLoad(p)` = acute(7d):chronic(28d) **ACWR** with overtraining(>1.5)/detraining(<0.8) flags; `computeReadiness` now **blends sleep + load + mood** (returns `factors` + `load`). Surfaced on the readiness card.
- **Daily-focus coach** — `dailyFocus()` synthesises readiness, load, nutrition pace, weak-point, deload-due and consistency into the **1–3 prioritised directives** that matter today (warn → info → good). New **Coach card leads the Today view**.
- **Weak-point auto-targeting** — `generateWeek(p, now, weakGroup)`: the aesthetic engine's laggard group (computed in `computePlan`, threaded in) gets a **+1 bonus "bring-up" set** on its block. Closes assessment → action.

`computePlan` now assembles the intelligence once and shares it (engine stays pure; `computeReadiness` gained a `now` param). Cache-bust → `?v=21` (engine import `?v=7`), `sw odyssey-v21`.

---

## 2026-06-26 — D22 · Four feature increments (deload/equipment · measurements/photos · analytics/plate · grocery/swaps)

User picked **all four** queued features in one go. Built as four verified increments on top of the training brain (D21); engine logic node-tested (**39 asserts**), UI verified live.

- **Periodization (engine):** `deloadState(p)` — a manual deload toggle (`profile.deloadActive`) that halves strength volume in `generateWeek`, auto-**suggested** every ~6 training-weeks; surfaced as a card in the Week view with an equipment-toggle row (`bar`/`bands`/`weights` → the existing `equipCap` unlocks pull-up/dip/band rungs). Added an `hrow` equip cap (Band row needs bands).
- **Wellness:** body measurements (`profile.measureLog{date:{waist,chest,arm,thigh,weight}}`, synced) → latest + colour-coded deltas (waist-down = good, the rest up = good) tied to the V-taper; logging weight also updates `currentWeight`/`weightHistory`. **Progress photos** stored **local-only** (`localStorage['odyssey.photos.v1']`, NOT in the synced profile — avoids bloating Supabase), canvas-compressed to 720px JPEG q0.7, capped at 30, with a tap-two before/after compare.
- **Workout analytics:** `chart.js` HEX palette **fixed to cinematic-dark** (the weight chart was near-invisible on dark since D20) + two new pure-SVG charts (`barChartSVG`, `lineChartSVG`); the Week "training so far" now shows **weekly rep×load volume** bars + the most-logged movement's **progression curve** (est-1RM if weighted, else top reps). Fixed `trainStats` volume to count bodyweight reps (was 0). **Plate calculator** (`platePlan()` in engine) card for weighted progressions.
- **Nutrition:** per-slot **meal swaps** — `mealOptions()` gives 3 alternatives per slot, `generateDietDay` honours `profile.mealSwaps`; numbered swap chips in each meal row. Auto **grocery list** (`groceryList()`, categorised + keyed, checkable → `profile.groceryChecked`). **Macro history** mini-chart = protein logged (from checked meals) over 10 days vs target.

**Two bugs caught in preview + fixed:** (1) `.col-7`/`.col-5` grid classes didn't exist (only 12/8/6/4/3) → charts/cards squished → added them + responsive collapse; (2) `barChartSVG` reads `b.value` but `weeklyVolume` returned `{volume}` → flat bars → renamed to `{value}`. **Lesson:** the fresh Claude-preview server boots at a **2px viewport** — `preview_resize` to 1440×900 before screenshots, and the screenshot tool needs a real scroll (smooth-scroll off + `scrollIntoView`) to capture below-the-fold.

Cache-bust → `?v=20` (engine import `?v=6`, chart `?v=4`), `sw odyssey-v20`.

---

## 2026-06-22 — D21 · Training brain v2 → PERFORMANCE-DRIVEN (decoupled from streak) + aesthetic/looksmaxx engine + cardio/agility/plyo

User direction (3 interrupts that sharpened the spec): make plans **smart & industry-grade**, **calisthenics + aesthetics + looksmaxxing** focused, exercises **dynamic** (auto-progressing basic→advanced), and **weave in agility + cardio** — with the explicit rule that **training intensity must NOT be gated by the smoke-free streak**; it progresses from *what your current state can handle*, read off the **workout logs**, and overloads steadily.

**The re-architecture (engine.js, pure + node-tested — 26 asserts pass):**
- **Decoupled training from streak.** Old `allowedMode`/`clampMode`/`lungLevel` streak-gating of *training* is gone. New `trainingLevel(profile)` derives a foundation/build/peak stage + 0–100 athlete score from the **demonstrated rungs in `workoutLog`** + session count. Proven by tests: 400-day streak + zero logs → stays foundation/basic, intervals locked; zero streak + rich logs → rises to build, auto-advances exercises, unlocks intervals. The streak/recovery% is now **purely the wellness layer** (`recoveryPct`, breath-technique unlocks, milestones) — kept, secondary.
- **Dynamic exercises = `adaptiveRung()`** — double-progression + ladder climb: hit the top of the rep range across recent sessions → advance the calisthenics ladder rung (incline→knee→full→diamond→archer…); struggle below the bottom → ease back; else +1 rep. Per-session **dedupe** so two patterns never land on the same move. Equipment still caps reachable rungs (bar/bands).
- **Aesthetic / looksmaxx engine = `aestheticBalance()`** — maps logged exercises→muscle groups, scores vs a **V-taper ideal** (back 22 / shoulders 18 / legs 20 / chest 15 / core 15 / arms 10), a **pull:push posture ratio**, a weakest-link nudge, and a 0–100 index blending balance (.45) + posture (.20) + consistency (.35). Surfaced as the cockpit's lead card.
- **Pro weekly template** — PPL/Upper-Lower/Full by training-days, **undulating** strength vs hypertrophy days, each day = warm-up → (power/plyo when fresh on leg days) → aesthetic-biased strength (pull≥push, delts+lats+core for the frame) → conditioning finisher (Zone-2 base / agility / HIIT — **performance-unlocked**) → breath. Sunday rest, Wed active recovery.
- **Speed dial fully unlocked** + new **`Auto`** mode that follows `recommendedMode` (level + readiness); no streak locks.

**New content:** 13 moves authored to the encyclopedia schema (families **agility** ·4, **plyometric** ·5, **conditioning** ·4) → library now **73 moves**, with clean progression chains the engine climbs.

**UI:** Today view **reordered training-first** (program + aesthetic index lead; streak/lungs/sleep demoted to a "Recovery & wellness" block). Level-up `▲` chips, emphasis tags, conditioning icons in the Week grid. **Audit fix:** the Today checklist (`doneToday`) was in-memory only → now persisted per-date in `profile.checklistLog` (the lone data-loss gap; everything else already saved to localStorage + Supabase).

**Engine API change:** `computePlan(profile, EXERCISE_DB, now?)` now takes the exercise DB (for muscle mapping) — engine stays import-free + node-testable. Verified live in preview (no console errors). Cache-bust → `?v=18` (engine/exercises imports `?v=4`), `sw odyssey-v18`.

**Follow-up same day (graduation + reset/undo):** added the **auto-graduation layer** — `graduation(p)` enters an **Advanced phase** after ~14 distinct training-weeks (≈3.5 months) OR demonstrated peak OR a manual `advancedMode` opt-in ("I'm ready" toggle). Advanced **raises the rung floor** (`adaptiveRung` gained a `minIdx`) so beginner moves are retired, and **auto-adds a skill block** per session via `skillFor()` (handstand line / pistol line / L-sit). Also **reset + undo everywhere**: per-exercise "Clear today", Today-checklist "Reset", meals "Reset", water "Reset", and a global "Reset logs" in the account modal (clears day-to-day logs; keeps streak/weight/sleep/settings). `hrow` got an equip cap (Band row needs bands). Node-tested (**32 asserts**) + verified live. Cache-bust → `?v=19` (engine import `?v=5`), `sw odyssey-v19`.

---

## 2026-06-20 — D20 · Complete design refactor → CINEMATIC DARK (supersedes light/pastel)

User: "completely refactor design of app with the 3 websites." Chose (via options) **Cinematic dark** (pacômepertant-style) + **Fraunces serif headlines with Space Grotesk grotesque accents** (eyebrows/labels/marquee). This **supersedes the light pastel direction (D19)** — but the multi-accent identity is KEPT: the coral/periwinkle/sage/lilac pastels are **retuned to glow on the void** rather than dropped (honors the earlier "not monotone" ask).
**What changed (css `:root` token flip — most components adapt automatically):** canvas → dark void `#0B0B0C`, surfaces `#161618`, text warm off-white `#F4F1EA`; each accent now has base=fill / `-deep`=light text-on-tint / `-soft`=dark border-or-tag-bg / `-mist`=darkest card surface. Added `--font-grotesk` (Space Grotesk) → `.eyebrow` + marquee. Added a CSS-only **marquee tempo band** on the landing. Fixed light-theme leftovers: `#intro` + `#gate` radial backgrounds → dark vignette, `theme-color` meta → dark, `[data-takeover]` → deeper void. The `#fff` values that remain are text ON colored accent fills (fine on dark). Verified desktop across landing/cockpit/Moves; components adapt via tokens. **`--font-display` stays Fraunces** (serif headlines = the warm signature against the grotesque accents).
**Lesson reinforced:** bump `?v=` on any changed module/CSS (styles now `?v=9`, sw `odyssey-v8`) or the browser serves stale.

---

## 2026-06-20 — D19 · Awwwards-grade refactor (research-grounded) + palette pivot to premium pastel

User wants the app to feel **awwwards-grade**, modeled on **digitalists.at** (light/bold duotone, electric accent, oversized kinetic type, scroll-wired WebGL), **aircenter.space** (mono-white architectural restraint, Onest grotesque, Locomotive virtual scroll on Expo easing, Barba page transitions, split-text + clip-path reveals), **pacomepertant.com** (two-value cinematic `#0a0a0a`/`#fafafa`, one signature scrubbed WebGL interaction, marquee tempo). **Thesis: restraint is expensive — craft lives in timing, easing, spacing, transition continuity; one signature interaction; high contrast; whitespace.** A 6-agent research workflow produced the full plan; key parts preserved here (the `/tmp` raw file is ephemeral).

**Skills installed globally** (`~/.claude/skills/`): `frontend-design` (Anthropic, safe markdown) + authored `awwwards-web-motion` (the motion+perf playbook). Skipped script-executing skills (Impeccable/claudedesignskills/ui-ux-pro-max engine) for safety.

**Motion + perf rules (the `awwwards-web-motion` skill has full code):** ONE ticker (Lenis driven by `gsap.ticker`, `lagSmoothing(0)`, `lenis.on('scroll',ScrollTrigger.update)`, no 2nd rAF); animate **transform/opacity/clip-path only** (no width/height/box-shadow); `scrub` numeric not `true`; `anticipatePin:1`; reveals via `ScrollTrigger.batch`/`toggleActions` not N timelines; `will-change` on-start/off-complete; gate offscreen canvas/marquees w/ IntersectionObserver; `content-visibility:auto`+`contain-intrinsic-size` on long sections; `gsap.matchMedia` reduced-motion path + Lenis off; **drop pins on mobile**; profile at 4× CPU throttle (no >16ms frames, no "Forced reflow"). Easing tokens: out-enter(`power4.out`/`expo`) / in-exit ~65% (`power3.in`) / none-scrub; 150–600ms; stagger .05–.12.

**Palette candidates** (all light/high-contrast/premium; kept var names so swapping `:root` needs no JS change). **A "Restored Clinic" was APPLIED** then user reversed it (wants multi-accent pastel, see below):
- **A (applied):** `--cream:#FCFCFB --paper:#FFFFFF --sand:#F4F3EF --haze:#E2E0D9 --ink:#0E0E0C --ink-soft:#4A4945 --ink-faint:#86847C`; `--clay:#D9542B/-deep#B23E1C/-soft#F6D9CD/-mist#FCEFE9 --sky:#3E6FA8/… --sage:#5E7347/…`. Mono-white, single hot-clay accent.
- **B "Acid Restoration" (digitalists):** warm-white `#F7F6F1`, ink `#0A0A08`, ONE electric lime-chartreuse `#C8E000` (needs dark text on accent fills); dark celebration takeover `#0A0A08`/`#F4F4EC`.
- **C "Frozen Wave" (aircenter):** cool-white `#FBFCFD`, ink `#0B0E11`, ice-blue HERO `#1E73C8` (accent flips to `--sky`), clay `#E0613A` demoted to streak/SOS.

**PALETTE PIVOT (latest user direction, NOT yet built):** user now wants **NOT monotone** — "change clay to other colors, use the **best pastel palette**, refactor all colors, clean and premium." So A/B/C (single-accent) are superseded → design a **refined premium MULTI-ACCENT PASTEL** system (use `ui-ux-pro-max` color search + `frontend-design`), refactor every color source.

**Also pivoted:** user **dislikes the hero particle breath-field** (remove it — also the main scroll-lag source) and the **"Smoke becomes breath/muscle/you"** copy (remove the kinetic word-swap). Redesign the hero clean/premium/calm with real data, no particles.

**Built & keep:** anatomical **lungs SVG** (trachea/carina/bronchial-tree/3+2 lobes, palette-var-driven, recovery fill + CSS breathing) replacing the old two-blob; unified **motion tokens**; `transitionView` (clip-path wipe — **verify; GSAP `inset()` tween is unreliable, prefer `autoAlpha` crossfade**) + `revealHeadline` (masked split-line). The scroll-driven **Journey** (pinned progress rail filling to real streak fraction + scrubbed milestone reveals) is **designed but NOT built** — `initJourneyScroll()` is a stub in app.js. **New asks queued:** full streak reset (UI), detailed exercise tracker + plan generator (per-exercise set/rep/weight logging + history/PRs). See PROJECT_STATUS "RESUME HERE".

---

## 2026-06-20 — Invite-only auth (email/password + emailed code via Brevo); Streamlit re-rejected

### D18 · Access → **invite-only login gate**, two ways in, on GitHub Pages (Streamlit rejected again)
User asked to (1) deploy via Streamlit, (2) add email/password **and** emailed-code login via **Brevo**, (3) make the app **invite-only** (no access without logging in). **Streamlit re-rejected** (reaffirms [D17]): it can only host our static PWA inside an iframe, which breaks localStorage/auth-redirects/PWA-install — and crucially, goals 2 & 3 need **none** of Streamlit. They're all achievable on the existing **GitHub Pages + Supabase** stack, better. User confirmed: keep Pages.
**What was built (client):**
- **`js/gate.js`** — a full-screen login gate that covers the app until authenticated. `app.js` now does `boot() → initGate(enterApp)`; the app only renders (`enterApp`) once a session exists. Sign-out → `location.reload()` re-shows the gate.
- **Two ways in (user chose "password OR emailed code"):** a 6-digit **OTP code** (`signInWithOtp` → `verifyOtp type:'email'`, primary/recommended) **or** **email+password** (`signInWithPassword`, with create-password + reset). Both Supabase Auth.
- **Invite-only via client allowlist** — `ALLOWED_EMAILS` in `js/config.js` (user chose "email allowlist in the app" over "disable signup + invite"). `cloud.js` enforces `isAllowed()` on every auth entry path. **Honest scope:** the allowlist is a *client-side* gate (good for a private personal app); the hard locks are (a) Supabase **RLS** already isolates every user to their own row, and (b) the optional server-side hardening noted in PROJECT_STATUS §10 (disable public signups, or an allowlist trigger).
**What's manual (no dashboard creds):** wire **Brevo as Supabase's SMTP sender** (Supabase's built-in mailer is rate-limited ~2-3/hr → testing only, so Brevo is the *right* fix for real code delivery), set the Magic-Link email template to emit `{{ .Token }}` (the 6-digit code), and finish the still-pending Supabase **URL Configuration** (Site URL + redirect). Steps in PROJECT_STATUS §10.
**Why:** matches the real goal (private, invite-only, reliable email codes) with the right tools; zero new infra; the PWA stays intact; `git push` = deploy.

---

## 2026-06-20 — Deployment → GitHub Pages (Streamlit rejected)

### D17 · Hosting → **GitHub Pages** (public repo), NOT Streamlit
User proposed "GitHub + Streamlit" to use the app anywhere. **Streamlit rejected** — it's a Python *data-app* framework that renders its own widget UI; Odyssey is a static HTML/CSS/JS PWA, so Streamlit could only bury it in an iframe (`components.html`), which breaks localStorage/auth/PWA-install, caps height, and adds Streamlit chrome. Chose **GitHub Pages**: free, HTTPS, auto-redeploy on `git push`, native fit for a static site, and our PWA → Add-to-Home-Screen gives the omega app on iPhone/iPad.
Setup: installed `gh` via brew; user did one browser auth (account **`pprem9300-ops`**); created public repo `pprem9300-ops/odyssey`, pushed, enabled Pages (main/root). **Live: https://pprem9300-ops.github.io/odyssey/**. `config.js` is committed (publishable key only — public-safe; no secret key / DB password anywhere). Fixed manifest `id` → `/odyssey/` for subpath uniqueness; `sw.js` + manifest already used relative paths (subpath-safe).
**Remaining:** add the Pages URL to Supabase Auth → URL Configuration (Site URL + Redirect `…/odyssey/**`) for live magic-link sign-in.
**Why:** matches the real goal (use it anywhere on iPhone/iPad) with the right tool; zero ongoing cost; `git push` = deploy.

---

## 2026-06-19 — v2 features + experience pass

### D12 · Deep exercise library (60 moves) → `js/exercises.js`, auto-generated
A 5-author + QA workflow wrote encyclopedia-grade detail (form, cues, mistakes, muscles, breathing, tempo, ROM, progressions, per-level reps, "why it matters") for all 60 moves. Assembled via a Python transform of the workflow output (no manual retyping). New **Moves** library view + clickable **exercise-detail modal** (from Moves, Week, Today).
**Why:** user said the plan was "too basic"; depth is the differentiator. Auto-generation keeps it regenerable.

### D13 · Sleep tracking → **manual log + Readiness** (not Apple Health)
User chose manual nightly log (hours + quality 1–4) → engine `computeReadiness` returns a 0–100 score + intensity advice (poor sleep → suggest Gentle). **Apple Health/Watch auto-sync was declined as out-of-scope** — a pure web PWA can't read HealthKit (needs a native wrapper).
**Why:** web-native, works now, syncs via cloud; honest about the native limitation.

### D14 · Routine styles → **Full-body / Upper-Lower / PPL** with a "best for you" pick
`generateWeek` is now split-style aware (`profile.splitStyle`, default `auto`). Recommendation by training days: ≤3→full-body, 4→upper/lower, 5–6→PPL. Selector in the Week view.
**Why:** user asked for "muscle-group-wise or all-muscles-everyday, whichever's best." Evidence: higher per-muscle frequency suits novices; splits suit higher volume/more days.

### D15 · App icon → **Greek omega (Ω)** in clay-on-cream
Replaced the lungs mark with a serif Ω (Odyssey ↔ Omega). Regenerated all PWA/home-screen icons + favicon (qlmanage+sips), built a rounded `.icns`, and a real `~/Desktop/Odyssey.app` launcher carrying it.
**Why:** explicit user request; thematically apt; gives a clean desktop/home-screen identity.

### D16 · Experience pass — cursor removed · intro · perf · no-cache server
Per user feedback (choppy scroll/animations): **removed the custom cursor** (native + no pointermove cost); added a **cold-boot intro** (`motion.intro()`); fixed jank by **pausing the breath-field whenever off-screen** (it was drawing ~900 sprites/frame to a hidden canvas on every interior view) + fewer particles + DPR≤1.5. "Log a clean day" became a **toggle** (undo accidental marks). Added **`serve.py`** (no-cache) + `?v=3` import cache-bust because plain `http.server` heuristic-caching kept serving stale CSS/JS.
**Why:** the always-on canvas was the real scroll-killer; the cache issue caused repeated "edits don't show" confusion.

---

## 2026-06-19 — v2 add-ons (parallel build)

### D11 · Onboarding · weight chart · PWA · desktop/deploy — built as self-contained modules
Built four add-ons via a 4-stream parallel workflow (agents wrote disjoint new files; lead wired the shared files): **onboarding/edit-profile** (`js/onboard.js`), **weight-trend chart** (`js/chart.js`), **installable PWA** (`manifest.webmanifest`, `sw.js`, icons), and **macOS launcher + one-click deploy** (`Odyssey.command`, `deploy.command`). A manual **"Sync now"** was added to the sync modal.
**Why this shape:** these are mostly independent of each other → parallel build is fast and safe when each agent owns disjoint new files and returns integration snippets for the lead to apply coherently. Lead-applied integration fixes: SW network-first on `config.js` + SW skipped on localhost (no stale dev cache); fixed an `onboard.js` hoisting bug (`render()` ran before `step.render` was assigned) and hardened the overlay `close()` with a guaranteed-removal fallback.

---

## 2026-06-19 — Cloud sync (free) + real tracking

### D10 · Progress storage → **Supabase free tier, local-first** (+ date-based tracking)
User asked how progress is stored/tracked and chose "cloud sync — only if free." Chose **Supabase** free tier (no credit card): passwordless **magic-link** auth + one **JSONB row per user** (`odyssey_state`), protected by Row-Level Security. Layered **local-first**: the app always saves to `localStorage` and works offline; signing in syncs the same streak/weight/plan across iPhone + MacBook. Built **dormant-until-keys** (`js/config.js` blank ⇒ pure local mode, zero external dependency).
Also upgraded tracking to be **date-based**: `cleanDates[]` → a real streak that breaks on a missed day; `weightHistory[]` → dated trend; the journey heatmap now reflects real calendar dates.
**Why:** the original requirement was "access from phone OR MacBook" — cloud sync makes the streak identical on both. Supabase free tier covers a personal app indefinitely; the anon key is safe in client code (RLS-scoped per user). New files: `js/cloud.js`, `js/config.js`.

---

## 2026-06-19 — Real metrics + palette pivot (P2 entry)

### Profile · Anakin → **56 kg / 175 cm / 22 y, 7 days/week**
Real user data replaces demo defaults. Current weight 56 kg vs 75 kg target ⇒ engine auto-selects **`leanGain`** (delta −19 < −3). Activity = `very` (1.725) for 7-day training. Streak starts at 0 (reduce + rehab, no quit date).
**Why:** the engine is input-driven; these become the seeded defaults. Honest framing given to user: this is a lean bulk (~+18–20 kg lean), a long journey paced by the speed dial.

### D8 · Palette → **Official Claude colors, extended to pastel "breathy"** (OVERRIDES D3's dark exterior)
Pulled exact Anthropic brand hexes via `brand-guidelines` skill: clay `#D97757`, sky `#6A9BCC`, sage `#788C5D`, cream `#FAF9F5`, ink `#141413`. Extended into soft pastel tints over a warm cream canvas; accents mapped semantically (clay=streak, sky=breath, sage=nutrition). **Dropped the dark `#06090C` void exterior** — the whole app is now a breathy light world.
**Why:** explicit user request ("claude colors, pastel shades, breathy"). Reference shifts from greencube (dark/neon) toward admilk (cream/airy/premium). "Breathy" is also on-theme for a lung app.

### D9 · Type → **Fraunces + Inter + JetBrains Mono** (dropped Anton)
**Why:** Anton (ultra-bold condensed billboard) reads too harsh for a soft, breathy pastel world. Fraunces (variable optical serif, light weights + italic) is elegant and airy — an exhale in type form — while Inter keeps the UI clean and JetBrains Mono keeps stats instrument-grade.

---

## 2026-06-19 — Initial scope (P0 Discovery)

### D1 · Build scope → **Show-stopper prototype first**
A self-contained, deployable, animated build to lock the awwwards-grade look & feel before wiring deeper logic.
**Why:** user wants to *see* "next level" first; fastest path to a wow artifact openable on phone + laptop. Round two adds cloud sync/accounts if desired.

### D2 · Plan brain → **Smart rule engine**
Deterministic algorithms (TDEE, protein/kg, progression ladders, recovery curve) — no AI API.
**Why:** instant, offline, free, fully transparent and tunable; reliable for daily use. AI can be layered later (was offered as "Hybrid").

### D3 · Aesthetic → **Dark cinematic exterior + light interior**
Cinematic dark landing/onboarding for the wow-factor; calm light cockpit for daily readability.
**Why:** matches reference sites (greencube.space, admilk.co) for the entry journey while keeping the day-to-day surface legible and non-fatiguing.

### D4 · Motion level → **Full bonkers**
Lenis smooth scroll, GSAP ScrollTrigger pinning, Three.js/WebGL hero, custom cursor, kinetic type, screen-wide milestone detonations.
**Why:** explicit user ask ("go full bonkers", "really next level"). Constrained by motion discipline (reduced-motion honored, GPU-only transforms) so it stays premium.

### D5 · Tech stack → **Vanilla HTML/CSS/JS + CDN libs**
No build step; `localStorage` persistence; responsive for iPhone + MacBook.
**Why:** consistent with D1 (prototype-first). Opens directly in any browser, trivially deployable to Vercel/Netlify/GitHub Pages, no toolchain to maintain.

### D6 · Design foundation → **`ui-ux-pro-max` skill, overridden for awwwards grade**
Took structural guidance (Dark Mode OLED, WCAG AAA, gamification mandatory, motion discipline) and the **Inter + Playfair Display Italic + JetBrains Mono** tri-stack type system. **Overrode** the skill's auto-suggested soft lavender/Lora palette.
**Why:** user explicitly authorized "override for awwwards grade design if necessary"; the default wellness palette read too "spa," not cinematic. Final accent palette to be set in `BUILD_SPEC.md`.

### D7 · Process → **Research-swarm-grounded engine + maintained status docs**
A 4-expert parallel research swarm (pulmonology · calisthenics · veg nutrition · motion design) writes `BUILD_SPEC.md` before any app code; `PROJECT_STATUS.md` + this log are maintained throughout.
**Why:** physiology and safety must be researched, not guessed; user requested status docs for clear context across sessions.

---

## Safety / scope guardrails (standing)

- App is **wellness/education**, not medical advice. Lung protocol ships with explicit safety gates (stop on chest pain, severe breathlessness, dizziness, coughing blood) and a "get a baseline check from a doctor" prompt.
- Diet is **pure vegetarian**; default lacto-veg + eggless with optional add-ons and vegan swaps.
