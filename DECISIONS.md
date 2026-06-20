# 🧭 ODYSSEY — Decision Log

Append-only record of every locked decision and *why*. Newest at top.
See [`PROJECT_STATUS.md`](PROJECT_STATUS.md) for current state.

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
