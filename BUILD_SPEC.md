# ODYSSEY — BUILD SPEC (Single Source of Truth)

> **What this is:** The authoritative, build-ready specification for *Odyssey* — a cinematic, education-first wellness web app for an ex-smoker rebuilding their lungs and body to a lean ~75 kg through breathwork, calisthenics, zone-2 cardio, and pure-vegetarian nutrition. Synthesized from four expert tracks (Pulmonology, Calisthenics, Nutrition, Design/Motion) and reconciled into one coherent decision.
>
> **Not medical advice.** This is a wellness & education product. See §4 Safety Gates. The user-facing copy must always carry the disclaimer.
>
> **Core principle:** The smoke-free streak is the north star. Every rule, plan, and animation maps to real user data (streak days, weeks-elapsed, weight trend). Built to repeat indefinitely and scale via a 3-mode speed dial (Gentle / Balanced / Relentless).

---

## 0. RECONCILED DECISIONS (conflicts resolved)

| Topic | Conflict | **Decision** |
|---|---|---|
| Weekly split structure | Pulmonology proposes a 7-day breath+cardio-led week (Mon/Wed/Fri calisthenics). Calisthenics proposes a Push/Pull/Legs/Full split (Mon Push, Tue Pull, Thu Legs, Fri Full). | **Adopt the Calisthenics PPL+Full split as the strength backbone, with Pulmonology's daily non-negotiable breathwork (~10–15 min) layered on top of every day.** See §2.3 and §5. |
| Calisthenics days/week per mode | Pulmonology says 3–4×/week; Calisthenics speed-dial says Gentle=3, Balanced=4–5, Relentless=5–6. | **Use the Calisthenics speed-dial numbers** (3 / 4–5 / 5–6). Pulmonology's "3–4×" is the Gentle–Balanced band and is consistent. |
| Protein anchor | Calisthenics: 1.6–2.0 g/kg. Nutrition: 2.0 g/kg of **target** (75 kg) ≈ 150 g, 2.2 in a cut, 1.8 min on lean-gain. | **Anchor protein to the 75 kg target: 2.0 g/kg = 150 g/day default; 2.2 g/kg (165 g) in a cut; 1.8 g/kg (135 g) min on lean-gain.** Never scales down with a cut. |
| BMR input weight | Nutrition explicit: use **current** weight for BMR; protein anchored to **target**. | **BMR from current weight; protein from target weight.** Locked. |
| Goal selection bands | Nutrition: recomp if \|cur−75\|≤3; cut if cur>78; lean-gain if cur<72. | **Adopt verbatim.** §2.1. |
| Accent color | Both design references push near-monochrome + one vitality accent + one warm accent. Dark and light use different accent hexes. | **Dual token sets** (dark exterior / light interior), one oxygen-green primary + one warm "ignition" secondary each. §3.1. |
| Forceful pranayama (Kapalbhati/Bhastrika) | Pulmonology gates them hard behind weeks-elapsed + streak + safety. | **Locked behind Level=peak (weeks≥12 AND streak≥30) AND all safety gates green; never in Gentle mode.** §2.4, §4. |

---

## 1. PRODUCT VISION & SCREEN/ROUTE INVENTORY

### 1.1 Vision
Odyssey turns quitting smoking and rebuilding the body into a **cinematic, personal, repeatable rhythm**. A dark, video-like "breath-field" exterior sells the transformation in one breath; a calm, legible light "cockpit" interior runs the daily protocol. One metaphor — *breath / lungs healing* — runs through hero, transitions, the Lung Lab, and celebrations. Motion only ever visualizes real data (streak, recovery %, weight-toward-75kg).

### 1.2 Routes / Screens

| Route | Screen | Theme | Purpose |
|---|---|---|---|
| `/` | **Landing** | Dark exterior | WebGL breath-field hero, kinetic manifesto, speed-dial teaser, `Begin the odyssey` CTA, safety footer. |
| `/onboarding` | **Onboarding / Calibration** | Dark→light handoff | Pinned 01–06 numbered panels capture baseline; soft safety gate; previews the generated plan. |
| `/dashboard` | **Dashboard Cockpit** | Light interior | Daily home base: hero streak counter, today's checkable protocol, stat cards, speed-dial selector, Craving SOS. |
| `/schedule` | **Weekly Schedule** | Light interior | 7-day repeatable grid (strength split + breathwork + cardio + nutrition), per-mode load, deload logic, export/repeat. |
| `/lung-lab` | **Lung Lab** | Light interior (cinematic) | Scroll-scrubbed WebGL lungs that clear/pinken with streak; recovery timeline; breathwork library with pacers; cannabis-aware, non-preachy. |
| `/nutrition` | **Nutrition** | Light interior | Daily pure-veg plate, macro band by mode + weight delta, vegan-swap + egg add-on chips, lung-support foods rail, hydration, grocery list. |
| `/journey` | **Milestones / Journey Map** | Light interior + dark celebration takeovers | GreenCube-style vertical timeline of streak/body/lung/strength milestones, badge nodes, heatmap calendar, screen-wide celebrations, relapse-safe reset. |

**Global UI:** custom cursor, magnetic buttons/links, Lenis smooth scroll, persistent speed-dial control, persistent disclaimer in footer, `prefers-reduced-motion` fallbacks on every WebGL/scroll effect.

---

## 2. THE RULE ENGINE

> All formulas below are JS-ready. Units: weight in kg, height in cm, age in years, energy in kcal. The engine is **pure** (no side effects) — feed it a `profile` + `logs`, get back targets. Re-run on the triggers in §2.7.

### 2.1 BMR → TDEE → Goal → Calories & Macros

```js
// ---- Constants ----
const TARGET_WEIGHT = 75;          // kg, the lean physique anchor
const PROTEIN_FLOOR_MALE = 1500;   // kcal hard floor
const PROTEIN_FLOOR_FEMALE = 1200;

const ACTIVITY = {
  sedentary:   1.2,    // desk job, little exercise
  light:       1.375,  // light exercise 1-3 d/wk, walking
  moderate:    1.55,   // moderate exercise 3-5 d/wk  (DEFAULT for this user)
  very:        1.725,  // hard exercise 6-7 d/wk
  extra:       1.9     // physical job + daily training
};

// ---- Step 1: BMR (Mifflin-St Jeor) from CURRENT weight ----
function bmr({ sex, weightKg, heightCm, ageYr }) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYr;
  return sex === 'male' ? base + 5 : base - 161;
}

// ---- Step 2: TDEE (maintenance) ----
function tdee(profile) {
  return bmr(profile) * ACTIVITY[profile.activity];
}

// ---- Step 3: Goal auto-selection (compare current vs 75 kg target) ----
function selectGoal(currentWeight) {
  const delta = currentWeight - TARGET_WEIGHT;
  if (delta > 3)       return 'cut';        // > 78 kg
  if (delta < -3)      return 'leanGain';   // < 72 kg
  return 'recomp';                          // within ±3 kg  (DEFAULT)
}

// ---- Step 4: Goal adjustment, scaled by speed-dial mode ----
// Mode scales the AGGRESSIVENESS of the deficit/surplus, never protein.
const GOAL_ADJ = {
  recomp:   { gentle: -0.05, balanced: -0.075, relentless: -0.10 },
  cut:      { gentle: -0.10, balanced: -0.15,  relentless: -0.20 },
  leanGain: { gentle: +0.05, balanced: +0.075, relentless: +0.10 }
};

function calorieTarget(profile, mode) {
  const maint = tdee(profile);
  const goal  = selectGoal(profile.currentWeight);
  let target  = maint * (1 + GOAL_ADJ[goal][mode]);

  // Early-quit buffer (see §2.7 streak gate): +100..150 kcal days 0-7
  if (profile.streakDays <= 7) target += 125;

  // SAFETY FLOOR (always last): never below max(BMR, sex floor)
  const floor = Math.max(bmr(profile), profile.sex === 'male' ? PROTEIN_FLOOR_MALE : PROTEIN_FLOOR_FEMALE);
  return { goal, kcal: Math.round(Math.max(target, floor)) };
}

// ---- Step 5: Macro outputs ----
// Protein anchored to TARGET (75 kg), NOT current weight.
function macros(profile, mode) {
  const { goal, kcal } = calorieTarget(profile, mode);

  // protein g/kg of TARGET weight
  const proteinPerKg = goal === 'cut' ? 2.2 : goal === 'leanGain' ? 1.8 : 2.0;
  const proteinG = Math.round(proteinPerKg * TARGET_WEIGHT);   // 165 / 135 / 150
  const proteinKcal = proteinG * 4;

  // fat: 0.9 g/kg of TARGET (floor 0.6), ~25-30% kcal
  const fatG = Math.round(0.9 * TARGET_WEIGHT);                // ~68 g
  const fatKcal = fatG * 9;

  // carbs: remainder
  const carbKcal = Math.max(kcal - proteinKcal - fatKcal, 0);
  const carbG = Math.round(carbKcal / 4);

  return {
    goal, kcal,
    protein_g: proteinG,
    fat_g: fatG,
    carb_g: carbG,
    feedings: 4,                          // 4-5 feedings of 30-40 g protein
    proteinPerFeeding_g: Math.round(proteinG / 4)
  };
}
```

**Worked example (male, 78 kg, 175 cm, 28 y, moderate, Balanced, streak 40 d):**
BMR = `10·78 + 6.25·175 − 5·28 + 5` = **1739 kcal** → TDEE = `1739·1.55` ≈ **2695 kcal** → goal `recomp` (|78−75|=3 ≤ 3) → −7.5% ≈ **2493 kcal**. Macros: protein **150 g** (600 kcal), fat **68 g** (612 kcal), carbs ≈ **320 g** (1281 kcal).

### 2.2 Smoke-Free Recovery % Curve (streak days → 0..100)

Milestone breakpoints from the pulmonology recovery model. The curve **interpolates between anchor points** so the dashboard shows a smooth, ever-rising number; clamps at 100.

```js
// Anchor points: [streakDays, lungRestorePct]. Days derived from the model's
// timeframes (lower bound used as the day the % is "reached").
const RECOVERY_ANCHORS = [
  [0,      0],     // baseline
  [0.0139, 3],     // 20 min  (20/1440 day)
  [0.5,    8],     // 12-24 h  -> CO normalizes
  [2,     14],     // 2-3 d    -> taste/smell, nerves
  [14,    35],     // 2 wk-3 mo-> circulation, early lung fn
  [30,    68],     // 1-9 mo   -> cilia regrow (entry)
  [365,   85],     // 1 yr     -> CHD risk halves
  [730,   95],     // 2-5 yr   -> stroke/cancer risk falls
  [3650, 100]      // 10-15 yr -> near-normalization
];

function recoveryPct(streakDays) {
  const a = RECOVERY_ANCHORS;
  if (streakDays <= 0) return 0;
  if (streakDays >= a[a.length - 1][0]) return 100;
  for (let i = 1; i < a.length; i++) {
    const [d0, p0] = a[i - 1], [d1, p1] = a[i];
    if (streakDays <= d1) {
      // linear interpolation between anchors
      const t = (streakDays - d0) / (d1 - d0);
      return +(p0 + t * (p1 - p0)).toFixed(1);
    }
  }
  return 100;
}
```

**Milestone breakpoints (for the Lung Lab timeline + toasts):**

| Streak | Body change | Recovery % |
|---|---|---|
| 20 min – 8 h | Nicotine spike settles; HR/BP fall, O₂ rises | 3 |
| 12 – 24 h | Carbon monoxide normalizes | 8 |
| 2 – 3 d | Taste/smell/nerves revive; temporary cough may start | 14 |
| 2 wk – 3 mo | Circulation + early lung function improve | 35 |
| 1 – 9 mo | Cilia regrow; cough/breathlessness ease | 68 |
| 1 yr | Coronary heart-disease risk halves | 85 |
| 2 – 5 yr | Stroke/cancer risks keep falling | 95 |
| 10 – 15 yr | Long-term near-normalization | 100 |

### 2.3 Calisthenics Weekly-Plan Generator (keyed by speed-dial mode)

```js
// Strength backbone = Push/Pull/Legs/Full split (Calisthenics expert),
// with daily breathwork layered on (Pulmonology). Volume scales by mode.
const SPEED_DIAL = {
  gentle:     { trainingDays: 3, volumeMod: 0.6, repBias: 'low',  rest: '90-150s', cardioZone: 2, intervals: false, peakPranayama: false },
  balanced:   { trainingDays: 5, volumeMod: 1.0, repBias: 'mid',  rest: '60-120s', cardioZone: 2, intervals: true,  peakPranayama: 'gateOnly' },
  relentless: { trainingDays: 6, volumeMod: 1.3, repBias: 'high', rest: '30-90s',  cardioZone: 3, intervals: true,  peakPranayama: 'gateOnly' }
};

// Canonical week (Balanced). Gentle drops to Mon/Thu/Fri strength; Relentless
// adds a 2nd push/pull or skill day. 1 full rest day is non-negotiable.
const WEEK_TEMPLATE = {
  Mon: { focus: 'Push (chest/shoulders/triceps)', strength: true,  cardio: 'walk 15m', breath: ['diaphragmatic','pursed-lip'] },
  Tue: { focus: 'Pull (back/biceps) + grip',      strength: true,  cardio: 'zone2 30-40m optional', breath: ['box','costal'] },
  Wed: { focus: 'Active recovery + lung rehab',   strength: false, cardio: 'zone2 25-40m', breath: ['anulom-vilom'] },
  Thu: { focus: 'Legs (squat+hinge) + core',      strength: true,  cardio: 'walk', breath: ['diaphragmatic','costal','box'] },
  Fri: { focus: 'Full-body skill + conditioning', strength: true,  cardio: 'graded intervals (wk5+)', breath: ['pursed-lip'] },
  Sat: { focus: 'Long zone-2 + mobility',         strength: false, cardio: 'zone2 35-50m', breath: ['+peak pranayama if gated'] },
  Sun: { focus: 'Full rest',                      strength: false, cardio: 'optional stroll', breath: ['anulom-vilom','slow diaphragmatic'] }
};

function generateCalisthenicsWeek(mode, level /* foundation|build|peak */) {
  const dial = SPEED_DIAL[mode];
  const minSets = 2;
  const days = mode === 'gentle' ? ['Mon','Thu','Fri'] : Object.keys(WEEK_TEMPLATE);

  return days.map(day => {
    const t = WEEK_TEMPLATE[day];
    const base = t.strength ? EXERCISES[t.focus] : [];   // see exercise tables §6 ref
    return {
      day,
      focus: t.focus,
      breathwork: t.breath,                         // DAILY, ~10-15 min, non-negotiable
      cardio: t.cardio,
      blocks: base.map(ex => ({
        exercise: pickLadderRung(ex, level),        // regression/progression by level
        sets: Math.max(minSets, Math.round(ex.sets * dial.volumeMod)),
        reps: repForBias(ex.repRange, dial.repBias) // low/mid/high end of range
      }))
    };
  });
}
```

**Per-mode summary:** Gentle = 3 strength days, 0.6× sets (min 2), low reps, zone-2 only, no intervals, no forceful pranayama. Balanced = 4–5 days, 1.0× as written, 60–120 s rest. Relentless = 5–6 days (+1 full rest non-negotiable), 1.25–1.4× sets, top-of-range reps, finishers, shorter rest. **Deload** every 4th–6th week (or on 3+ warning signs): same days, ~50% volume, easy zone-2 only.

### 2.4 Lung-Training Weekly Generator (level from weeks-elapsed + streak)

```js
// TWO clocks: weeks-elapsed (training adaptation) + streak (physiological headroom).
function lungLevel(weeksElapsed, streakDays) {
  if (weeksElapsed >= 12 && streakDays >= 30) return 'peak';   // cilia-regrowth window
  if (weeksElapsed >= 5  && streakDays >= 14) return 'build';  // CO cleared, fn rising
  return 'foundation';                                         // weeks 1-4 regardless of streak
}

const BREATH_LIBRARY = {
  foundation: [ 'diaphragmatic', 'pursed-lip', 'costal-expansion' ],
  build:      [ 'diaphragmatic', 'pursed-lip', 'costal-expansion', 'box', 'anulom-vilom', 'breath-stacking' ],
  peak:       [ /* all build + */ 'kapalbhati', 'bhastrika' ]   // GATED, never Gentle, safety must be green
};

// Per-mode dosage within a level (minutes/intensity), Pulmonology dosages:
const BREATH_DOSAGE = {
  diaphragmatic: { gentle: '5m lying', balanced: '8m', relentless: '10m + carry into walk' },
  box:           { gentle: '3-3-3-3 x3m', balanced: '4-4-4-4 x5m', relentless: '5-5-5-5 or 6-6-6-6 x8m' },
  'anulom-vilom':{ gentle: '3-5m no holds', balanced: '7m', relentless: '10m + gentle 1-2s hold' },
  kapalbhati:    { gentle: 'DO NOT USE', balanced: '1-2 rounds 20-30 slow pumps', relentless: '2-3 rounds 30-40' },
  bhastrika:     { gentle: 'DO NOT USE', balanced: '1 round 10-15', relentless: '2-3 rounds 15-20, full recovery' }
};

function generateLungWeek(weeksElapsed, streakDays, mode, safetyGreen) {
  const level = lungLevel(weeksElapsed, streakDays);
  let pool = BREATH_LIBRARY[level].slice();
  // Gate forceful techniques: never Gentle, never if safety not green
  if (mode === 'gentle' || !safetyGreen) {
    pool = pool.filter(t => t !== 'kapalbhati' && t !== 'bhastrika');
  }
  // Cardio intervals only at build+ AND streak >= 14 AND not Gentle
  const intervals = level !== 'foundation' && streakDays >= 14 && mode !== 'gentle';
  return { level, dailyBreathwork: '10-15 min', techniques: pool, dosage: BREATH_DOSAGE, intervals };
}
```

**Progression clocks:**
- **Weeks 1–4 = FOUNDATION** (regardless of streak): diaphragmatic/pursed-lip/costal; zone-2 walking only; regression-level calisthenics.
- **Weeks 5–12 = BUILD** (gate: streak ≥ ~14 d): add box + Anulom Vilom; graded intervals 1–2×/wk; standard reps + harder variations.
- **Week 12+ AND streak ≥ ~30 d = PEAK**: cautiously trial Kapalbhati/Bhastrika (slow), intervals toward 2:2, hardest calisthenics.
- **Streak breaks:** do **not** reset to zero — step intensity back one tier for a few days (drop forceful pranayama + intervals, lean Gentle), let body re-clear, then climb. Re-baseline every 8–12 weeks.

### 2.5 Diet Day Generator (hits macro targets from pure-veg sources)

```js
// Pure lacto-vegetarian. Eggless default; optional egg add-on; vegan-swap flag.
// Goal: hit { protein_g, fat_g, carb_g, kcal } from macros() across 4 meals.
const VEG_PROTEIN = [ // food, serving, proteinG  (full table §2.6)
  ['Paneer',100,18],['Tofu (firm)',100,12],['Tempeh',100,19],
  ['Soy chunks (30g dry)',30,15],['Greek yogurt/hung curd',150,15],
  ['Whey isolate',30,24],['Pea+rice blend (vegan)',33,22],
  ['Dal cooked',200,12],['Chickpeas cooked',165,14],['Rajma cooked',175,15],
  ['Roasted chana',40,8],['Milk',250,8],['Besan',50,11],
  ['Peanut/PB',30,8],['Almonds',30,6],['Pumpkin seeds',30,9],
  ['Hemp seeds',30,9],['Quinoa cooked',185,8]
];
const EGG_ADDONS = [['Whole egg',1,6],['Egg whites',3,11]]; // optional chips

function generateDietDay(targets, { vegan = false, allowEgg = false } = {}) {
  // Default repeatable template (Nutrition expert sampleDay), then auto-tune
  // portions/shake scoops to close the protein gap, fill carbs around training.
  const plan = {
    Breakfast: { kcal: 560, protein: 32,
      items: '2 besan chillas (1 tsp oil, onion/tomato/spinach); 150g hung curd/Greek yogurt; 250ml milk' },
    Lunch:     { kcal: 720, protein: 45,
      items: '1 bowl rajma/mixed dal (200g); 30g dry soy chunks in curry; 2 roti or 1 cup rice; curd + salad' },
    Snack:     { kcal: 480, protein: 38,
      items: '1 scoop whey/plant protein; 40g roasted chana; hung-curd + veg sticks; 1 vit-C fruit (orange/guava)' },
    Dinner:    { kcal: 640, protein: 40,
      items: '150g paneer/tofu sabzi (1-2 tsp oil); 1 bowl moong dal; 2 roti or 1 cup millet; sauteed greens' }
  };
  if (vegan) applyVeganSwaps(plan);     // milk->soy, curd->soy yogurt, paneer->tofu, whey->pea/soy, +B12 +algal-omega3
  if (allowEgg) plan.Breakfast.eggChip = '+2 egg whites in batter (+11g)';

  // Auto-tune: scale shake/soy/paneer to hit targets.protein_g; adjust grains for carbs.
  return closeMacroGap(plan, targets);
}
```

Defaults sum to ≈ **2400 kcal / 155 g protein** — already on-target for the recomp band. `closeMacroGap()` nudges shake scoops (24 g each), soy (15 g/30 g), and grain/roti count to land within ±5 g protein and ±50 kcal of the day's `macros()` output. **Combine grains+legumes** (rice+dal, roti+rajma) across the day for complete amino acids. Vegan adds B12 + algal omega-3 + creatine (3–5 g).

### 2.6 Veg protein reference (g protein / serving)

Paneer 18/100g · Tempeh 19/100g · Tofu 12/100g · Soy chunks 15/30g dry · Greek yogurt 15/150g · Whey isolate 24/scoop · Pea+rice 22/scoop · Dal 12/200g · Chickpeas 14/165g · Rajma 15/175g · Roasted chana 8/40g · Milk 8/250ml · Besan 11/50g · Peanut/PB 8/30g · Almonds 6/30g · Pumpkin/Hemp seeds 9/30g · Quinoa 8/185g · *egg add-on:* whole egg 6, 3 whites 11.

**Hydration:** 30–35 ml/kg/day (~2.5–3 L at 75 kg) + 500–750 ml per training hour; upper end for quitters (thins mucus). **Supplements (veg + smoker):** B12 (500–1000 mcg/d), D3 (1000–2000 IU), algal omega-3 (250–500 mg DHA+EPA), vitamin C food-first (avoid high-dose beta-carotene supplements — lung-cancer risk in smokers), iron+C if ferritin low, zinc 10–15 mg, magnesium 200–400 mg at night.

### 2.7 Dynamic Recalc Triggers

| Trigger | Action |
|---|---|
| **Weight** | Recompute BMR/TDEE when 7-day rolling avg moves ≥ 1.0 kg, or weekly (whichever first). Re-run `selectGoal`. Protein stays anchored to 75 kg. |
| **Activity** | Swap multiplier + recompute immediately on change; nudge ±1 band on sustained wearable shift. |
| **Speed-dial** | Scales deficit/surplus aggressiveness only (`GOAL_ADJ[goal][mode]`), never protein floor. |
| **Smoke-free streak** | Days 0–7: force Gentle / cap intensity, +125 kcal buffer, no aggressive cut. Days 8–30: allow Balanced. 30+ (stable): allow Relentless. Relapse → cap toward Gentle for a week (supportive, not punitive). |
| **Plateau** | If rolling weight stalls ~2–3 wk while adherent, adjust TDEE ±5% in goal direction. Refeed/diet-break every 8–12 wk of a sustained cut. |
| **Safety override (last)** | Clamp kcal ≥ max(BMR, 1500 m / 1200 f). Cap fat loss ~0.75 kg/wk, lean-gain ~0.25 kg/wk. On dizziness/poor sleep/mood crash/stalled lifts → auto-step intensity down one mode + prompt doctor baseline. Re-anchor monthly. |

### 2.8 Milestone Definitions & Celebration Triggers

```js
const MILESTONES = {
  streak: [
    { id:'s1',  days:1,   label:'Day One',         celebrate:'badge-ignite' },
    { id:'s3',  days:3,   label:'72 Hours',        celebrate:'lung-clarity' },  // taste/smell
    { id:'s14', days:14,  label:'Two Weeks',       celebrate:'lung-clarity' },
    { id:'s30', days:30,  label:'30 Days',         celebrate:'fullscreen-takeover' },
    { id:'s100',days:100, label:'100 Days',        celebrate:'fullscreen-takeover' },
    { id:'s365',days:365, label:'One Year',        celebrate:'fullscreen-takeover' } // "New lungs, new you."
  ],
  lungPct: [ // fires when recoveryPct(streak) crosses these
    { id:'l35', pct:35, label:'Circulation restored', celebrate:'lung-clarity' },
    { id:'l68', pct:68, label:'Cilia regrown',        celebrate:'lung-clarity' },
    { id:'l85', pct:85, label:'CHD risk halved',      celebrate:'lung-clarity' }
  ],
  weight: [ // progress ring toward 75 kg; fires per kg closer or at band entry
    { id:'w_band', test: w => Math.abs(w-75)<=3, label:'Entered the 75kg band', celebrate:'ring-snap' }
  ],
  money: [ { id:'m_round', test: saved => saved % 5000 === 0 && saved>0, label:'Money saved milestone', celebrate:'split-flap' } ],
  strengthPR: [ // first clean rep of a ladder rung = PR
    { id:'pr_pushup',  skill:'Full push-up',  celebrate:'pr-flare' },
    { id:'pr_pullup',  skill:'First pull-up', celebrate:'pr-flare' },
    { id:'pr_pistol',  skill:'Box pistol',    celebrate:'pr-flare' },
    { id:'pr_lsit',    skill:'Full L-sit',    celebrate:'pr-flare' }
  ]
};
```

**Celebration → animation map** (see §3.5): `badge-ignite` (node grey→glow + line draws), `lung-clarity` (Lung Lab pinkens + shimmer + toast), `ring-snap` (progress ring completes + accent ripple), `split-flap` (money flips + coin-shimmer), `pr-flare` (vignette pulse + shake), `fullscreen-takeover` (cockpit dims, breath-field returns for one light-mode inhale + Fraunces line). **Relapse-safe:** lifetime progress preserved; reset framed supportively, never shaming.

---

## 3. THE DESIGN SYSTEM

### 3.1 Color Tokens (final, hex) — dual dark/light via CSS custom properties

```css
:root {                         /* DARK EXTERIOR (landing, onboarding, celebration takeovers) */
  --bg:            #06090C;      /* deep void */
  --surface:       #0E141A;      /* raised panels/cards */
  --text-hi:       #F2F6F4;      /* primary text */
  --text-lo:       #7C8A88;      /* secondary/eyebrow text */
  --accent:        #5CFFC8;      /* oxygen-green — vitality / streak / CTA glow */
  --accent-2:      #FF6B4A;      /* warm "ignition" — streak fire, PRs, warnings */
}
[data-theme="light"] {          /* LIGHT INTERIOR (dashboard, schedule, lung lab, nutrition, journey) */
  --bg:            #F4F7F5;
  --surface:       #FFFFFF;
  --text-hi:       #0C1411;
  --text-lo:       #5E6B66;
  --accent:        #0FB67E;      /* oxygen-green, darkened for AA contrast on light */
  --accent-2:      #FF6B4A;      /* same warm ignition accent across both themes */
}
```

Discipline: near-monochrome canvas + **one** vitality accent + **one** warm ignition accent. No other decorative color. Speed-dial recolors the accent **ramp** per mode (Gentle = cooler/dimmer accent, Relentless = hotter/brighter toward `--accent-2`) but never introduces new hues.

### 3.2 Typography — Google Fonts link + roles

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

| Role | Font | Use |
|---|---|---|
| Display | **Anton** (single weight) | Billboard kinetic headlines, hero streak day-count. Tracking −0.02em, line-height 0.92. |
| Body | **Inter** (400/500/600) | Light-interior dashboard, all UI copy. Body line-height 1.6. |
| Editorial | **Fraunces** (opsz variable + italic) | Reflective pull-quotes / milestone copy. Loose tracking, line-height 1.4. |
| Mono HUD | **JetBrains Mono** (400/500) | Streak counter, biometrics, 01–06 step index, eyebrows. +0.16em tracking, uppercase. |

### 3.3 Type scale (modular ~1.25 major-third, 8px grid)

`eyebrow 12px (mono, uppercase, +0.16em)` · `body 16px (Inter, 1.6)` · `lead 20px` · `h3 28px` · `h2 40px` · `h1 64px` · **exterior kinetic hero** `clamp(4rem, 12vw, 13rem)`.

### 3.4 Spacing, grid & elevation

- **Spacing scale (8px base):** 4, 8, 12, 16, 24, 32, 48, 64, 96, 128 px.
- **Grid:** 12-col, max content width 1280px, gutter 24px; 4-cell portfolio/milestone card grid against generous negative space.
- **Radii:** 4 (chips), 12 (cards), 24 (modals/panels).
- **Elevation (light interior):** `e1 0 1px 2px rgba(12,20,17,.06)`, `e2 0 4px 16px rgba(12,20,17,.08)`, `e3 0 12px 40px rgba(12,20,17,.12)`. Dark exterior leans on glow (accent box-shadow) over drop-shadow.
- **Motion tokens:** ease `cubic-bezier(.22,1,.36,1)`; durations fast 200ms / base 400ms / slow 800ms; Lenis lerp 0.08; breath cycle 4s.

### 3.5 Component list

Custom cursor (accent ring, label-morph, lag-trail) · Magnetic button/link · Speed-dial knob (draggable, snaps 3 modes, recolors accent ramp) · Streak hero counter (Anton + mono sub-stats, eased count-up) · Stat card (reveal-mask wipe) · Today's-protocol checklist row · Craving SOS button → 4-7-8 modal · Numbered 01–06 panel (pin/scrub) · Vertical timeline rail (onboarding + journey spine) · 7-day schedule grid w/ drag-to-rearrange day cards · Macro/calorie band · Vegan-swap + egg add-on chips · Hydration tracker · Breathwork pacer (animated) · WebGL breath-field hero · WebGL Lung Lab lungs (scroll-scrubbed) · Milestone badge node · Streak heatmap calendar · Celebration overlays · Adaptive "plan re-tuned" banner · Disclaimer footer.

### 3.6 Motion / Animation Choreography

| Moment | Effect | Library |
|---|---|---|
| Global scroll | Lenis smooth-scroll (lerp ~0.08) driving all ScrollTrigger off one rAF loop | Lenis + GSAP ScrollTrigger |
| Landing hero load | WebGL breath-field: ~30k GPU points form lungs; 4s inhale(converge→accent glow)/exhale(disperse→void); pointer-parallax; scroll-velocity stretch | Three.js GLSL point shader + GSAP |
| Hero headline / section intros | Anton split per-char (SplitText), masked reveal from below, stagger; word-swap SMOKE→BREATHE→BECOME | GSAP SplitText + ScrollTrigger |
| Onboarding / calibration | Full-height pinned 01–06 panels, answer in/release out; progress rail fills as vertical timeline | GSAP ScrollTrigger (pin + scrub) |
| Exterior→interior handoff | Iris/clip-wipe dark→light, accent sweep, breath-field "exhales" into cockpit; masks route swap | GSAP timeline + Flip |
| Dashboard mount | Counters (streak, cigs avoided, money, lung %) count up from 0 eased; reveal-mask stagger | GSAP counter tween + ScrollTrigger batch |
| Buttons / speed-dial / nav | Magnetic hover (translate toward cursor, spring); dial knob draggable/magnetic, snaps, recolors ramp | GSAP + quickTo pointer math |
| Sitewide pointer | Custom cursor ring scales over targets, morphs to label ('open','breathe'), lag-trails | Vanilla JS + GSAP quickTo |
| Lung Lab | Scroll-scrubbed WebGL lungs clear/pinken with streak; pinned while side panel scrubs 24h→2wk→1yr facts | Three.js + GSAP ScrollTrigger scrub |
| Section/image reveals | clip-path inset wipe on media/cards, parallax y-offset, line-by-line text reveals | GSAP ScrollTrigger + clip-path |
| Milestone achieved | Particle burst from counter, accent flood, scale-pop, breath-mote confetti; fired imperatively on threshold | GSAP timeline + canvas-confetti + Three.js burst |

**Hero concept:** A WebGL "breath field" — a living lung-shaped organism of ~30k GPU points (custom GLSL) on a continuous 4s respiratory cycle (inhale: converge + ignite to `--accent`; exhale: disperse to void). Pointer bends it; scroll velocity stretches it. First scroll triggers one deep exhale → resolves into the pinned kinetic headline. **As the real streak grows, the ratio of glowing-green to grey "tar" particles improves** — the hero literally visualizes healing. Reduced-motion fallback: slow CSS gradient-breath loop, same palette.

### 3.7 Libraries + CDN URLs (no build step; plain `index.html` + ES modules + UMD)

```html
<!-- UMD globals -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/Flip.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.42/dist/lenis.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js"></script>
```
```js
// ES modules
import * as THREE from 'https://esm.sh/three@0.160.0';
// SplitText: use GSAP Club plugin if licensed, else a tiny custom char/word splitter (free).
// Dev-only: lil-gui from https://cdn.jsdelivr.net/npm/lil-gui — STRIP from prod.
```
Register `gsap.registerPlugin(ScrollTrigger, Flip)` after core. CSS custom properties hold the dual dark/light systems. `prefers-reduced-motion` fallback for every WebGL/scroll effect; `IntersectionObserver` as the low-power reveal backstop.

---

## 4. SAFETY GATES & MEDICAL-DISCLAIMER COPY

### 4.1 Persistent disclaimer (footer of every screen)
> **Wellness & education, not medical advice.** Odyssey is an educational tool, not a substitute for professional medical care. Get a baseline check from a doctor before ramping intensity — ideally spirometry (FEV1/FVC), resting SpO₂, blood pressure, resting heart rate, and bloodwork (B12, vitamin D, iron/ferritin). Stop and seek care for any red-flag symptom below.

### 4.2 RED-FLAG — STOP & seek urgent care (hard modal, blocks training)
Chest pain or pressure · coughing up blood (hemoptysis) · severe or sudden breathlessness that doesn't settle with rest · fainting · bluish lips/fingertips. *These are never a normal training response.*

### 4.3 SLOW DOWN / stop the current session
Lightheadedness, dizziness, tingling around mouth or hands, visual changes, palpitations, nausea → usually over-breathing (hypocapnia) or overexertion. Return to slow nasal breathing, sit down; clears within minutes.

### 4.4 Live governors
- **Talk Test:** can't speak a short sentence during cardio → above zone 2, back off. Default cardio ceiling ≈ `180 − age` HR.
- **Pain ≠ effort:** sharp/chest/joint pain → stop. Burning muscles + recovering breath = honest effort.
- **Warm up** 2–3 min easy nasal breathing before any forceful work; hydrate.

### 4.5 Forceful pranayama gate (Kapalbhati / Bhastrika)
Locked behind `level === 'peak'` (weeks ≥ 12 AND streak ≥ 30) AND all safety flags green AND mode ≠ Gentle. **Never** with: uncontrolled high BP, heart disease, hernia, epilepsy, vertigo, recent abdominal/chest/eye surgery, pregnancy, active straining menstruation, or a full stomach. Stop immediately on dizziness/lightheadedness/tingling. Start very slow; rounds short; full recovery between.

### 4.6 Onboarding soft gate (route to "see a doctor first")
Flags: chest pain/breathlessness, pregnancy, current meds, asthma/COPD, hypertension, heart disease, hernia, recent surgery, uncontrolled GERD/epilepsy. Any flag → show "Clear this plan with a clinician first" before continuing; the plan still generates in education mode but caps intensity at Gentle until acknowledged.

### 4.7 Illness rule
Productive/worsening cough, fever, wheeze, new chest infection → pause active training and rest. (Early-cessation "smoker's-flu" cough as cilia regrow is expected.) Persists beyond 1–2 weeks → see a doctor.

### 4.8 Calorie safety floor
Daily target never below `max(BMR, 1500 male / 1200 female)`. No aggressive cut during days 0–7 of a quit. Auto-step intensity down on dizziness/poor sleep/mood crash/stalled lifts.

---

## 5. REPEATABLE DAILY / WEEKLY / MONTHLY STRUCTURE

### 5.1 DAILY (the repeatable rhythm)
1. **Breathwork — non-negotiable, ~10–15 min** (technique pool by level + mode, §2.4).
2. **Today's protocol** from the dashboard: the day's strength/cardio block (§2.3), hydration target, 4 meals (§2.5).
3. **Movement floor (NEAT):** 7,000–10,000 steps, stairs with pursed-lip breathing.
4. **Hydration:** 2.5–3 L (+500–750 ml/training hour); warm herbal teas as craving rituals.
5. **Protein:** hit 150 g across 4–5 feedings of 30–40 g.
6. **Smoke-free check-in:** log the streak (the north star), mood, cravings; Craving SOS → 4-7-8 breathing on demand.

### 5.2 WEEKLY (canonical 7-day template; scales by mode)
- **Mon** Push + lung-opening + 15 min zone-2 walk + breathwork.
- **Tue** Pull + grip + (zone-2 30–40 min optional) + breathwork (box + costal).
- **Wed** Active recovery / lung rehab: zone-2 25–40 min + diaphragmatic/pursed-lip + thoracic mobility.
- **Thu** Legs (squat + hinge/glute) + core + breathwork.
- **Fri** Full-body skill + conditioning circuit; **graded intervals slot here once past week 4** (build+, streak ≥ 14, not Gentle); + breathwork.
- **Sat** Long zone-2 35–50 min + mobility; **peak pranayama trialled here only** when gated green.
- **Sun** Full rest: gentle stretch, 15 min calming breath (Anulom Vilom + slow diaphragmatic), reflect on the streak, log metrics.
- **Gentle days** override: keep breathwork, swap calisthenics for mobility, walk to comfort, drop intervals + forceful pranayama. **Relentless days:** add a round, extend cardio to top of range, add gated peak pranayama.
- **Weekly check-in:** review streak, adherence, deload warning signs (3+ → deload). Export / repeat next week.

### 5.3 MONTHLY (re-anchor & re-baseline)
- **Every 4 weeks:** progress photos, waist measurement, strength numbers (not scale alone) — recomp holds weight steady while the mirror changes.
- **Recompute engine monthly:** fresh weigh-in (7-day rolling avg) re-runs BMR/TDEE + `selectGoal`; optional bloodwork re-anchor.
- **Deload every 4th–6th week** (or sooner on warning signs): same days, ~50% volume, easy zone-2 only.
- **Re-baseline every 8–12 weeks:** resting HR, recovery breath rate, walking distance, ideally repeat spirometry with a doctor; ratchet each variable up one notch as metrics improve.
- **Plateau:** stalled ~2–3 wk adherent → ±5% TDEE. Refeed/diet-break every 8–12 wk of a sustained cut.
- **Level promotion check:** re-evaluate `lungLevel(weeks, streak)` — foundation→build→peak as both clocks advance.

---

## 6. BUILD NOTES FOR THE DEVELOPER

- **State model:** `profile` (sex, age, heightCm, currentWeight rolling-avg, activity, dietFlags{vegan,allowEgg}, mode, quitDate→streakDays, startDate→weeksElapsed, safetyFlags) + `logs` (weight, workouts, meals, breathwork, cravings). Engine functions in §2 are pure — keep them in `js/engine.js`, import into each screen.
- **Theming:** `data-theme` attribute on `<html>` flips the CSS custom-property set (§3.1). Exterior routes = dark; interior = light; celebration takeovers temporarily borrow dark.
- **Speed-dial is the universal lever:** one control recolors the accent ramp, scales calorie aggressiveness (`GOAL_ADJ`), scales calisthenics volume (`volumeMod`), and gates forceful pranayama/intervals. Wire it once, read everywhere.
- **The streak is the north star:** drives the hero number (Anton scale), the breath-field clarity, `recoveryPct`, intensity caps, and celebrations. Never let workout ambition cost the streak.
- **Performance is part of the art:** one rAF loop (Lenis→GSAP), GPU particles, 60fps target on iPhone + MacBook, reduced-motion + IntersectionObserver fallbacks on every effect.
- **Folders:** `css/` (tokens + components), `js/` (engine.js, motion.js, hero.js, lung-lab.js, per-screen modules). No build step.
