/* ============================================================================
   ODYSSEY — RULE ENGINE  (pure, deterministic, no DOM, no side effects)
   Implements BUILD_SPEC.md §2. Feed it a `profile`, get back the full plan.
   All formulas grounded in the 4-expert research swarm. Units: kg / cm / yr / kcal.
   ========================================================================== */

export const TARGET_WEIGHT = 75;            // kg — the lean physique anchor
const KCAL_FLOOR_MALE = 1500;
const KCAL_FLOOR_FEMALE = 1200;

export const ACTIVITY = {
  sedentary: 1.2, light: 1.375, moderate: 1.55, very: 1.725, extra: 1.9,
};

/* ---- Default profile: ANAKIN (real data) -------------------------------- */
export const DEFAULT_PROFILE = {
  name: 'Anakin',
  sex: 'male',
  age: 22,
  heightCm: 175,
  currentWeight: 56,          // kg (range 55–57)
  activity: 'very',           // trains 7 days/week
  mode: 'gentle',             // speed dial — capped to gentle early (streak<8); user can push as streak grows
  splitStyle: 'auto',         // 'auto' | 'full-body' | 'upper-lower' | 'ppl'
  streakDays: 0,              // reduce + rehab, no quit date yet → day one
  weeksElapsed: 0,            // training weeks since start
  diet: { vegan: false, allowEgg: false },
  equipment: { bar: false, bands: false, weights: false },  // floor-only; toggles unlock progressions
  smoking: { approach: 'reduce', baselineCigsPerDay: 10, costPerCig: 17 }, // ₹ est. (~₹340/pack of 20)
  symptoms: ['cough', 'breathless', 'post-weed-tightness'],
  safetyGreen: true,          // no hard red-flags; doctor-baseline still recommended
  cleanDates: [],             // ['YYYY-MM-DD', ...] — real dated streak history
  weightHistory: [],          // [{ date, kg }, ...] — dated weight trend
  sleepLog: [],               // [{ date, hours, quality(1-4) }, ...] — nightly sleep
};

/* ============================================================================
   §2.1  BMR → TDEE → GOAL → CALORIES & MACROS
   ========================================================================== */
export function bmr({ sex, currentWeight, heightCm, age }) {
  const base = 10 * currentWeight + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

export function tdee(p) { return bmr(p) * ACTIVITY[p.activity]; }

export function selectGoal(currentWeight) {
  const delta = currentWeight - TARGET_WEIGHT;
  if (delta > 3) return 'cut';
  if (delta < -3) return 'leanGain';
  return 'recomp';
}

const GOAL_ADJ = {
  recomp:   { gentle: -0.05, balanced: -0.075, relentless: -0.10 },
  cut:      { gentle: -0.10, balanced: -0.15,  relentless: -0.20 },
  leanGain: { gentle: +0.05, balanced: +0.075, relentless: +0.10 },
};

export function calorieTarget(p, mode = p.mode) {
  const maint = tdee(p);
  const goal = selectGoal(p.currentWeight);
  let target = maint * (1 + GOAL_ADJ[goal][mode]);
  if (p.streakDays <= 7) target += 125;                       // early buffer
  const floor = Math.max(bmr(p), p.sex === 'male' ? KCAL_FLOOR_MALE : KCAL_FLOOR_FEMALE);
  return { goal, maintenance: Math.round(maint), kcal: Math.round(Math.max(target, floor)) };
}

export function macros(p, mode = p.mode) {
  const { goal, kcal, maintenance } = calorieTarget(p, mode);
  const proteinPerKg = goal === 'cut' ? 2.2 : goal === 'leanGain' ? 1.8 : 2.0;
  const protein_g = Math.round(proteinPerKg * TARGET_WEIGHT);   // 165 / 135 / 150
  const fat_g = Math.round(0.9 * TARGET_WEIGHT);                // ~68
  const carb_g = Math.max(Math.round((kcal - protein_g * 4 - fat_g * 9) / 4), 0);
  return {
    goal, kcal, maintenance,
    protein_g, fat_g, carb_g,
    feedings: 4,
    proteinPerFeeding_g: Math.round(protein_g / 4),
    surplus: kcal - maintenance,
  };
}

/* ============================================================================
   §2.2  SMOKE-FREE RECOVERY %  (streak days → 0..100, interpolated)
   ========================================================================== */
const RECOVERY_ANCHORS = [
  [0, 0], [0.0139, 3], [0.5, 8], [2, 14], [14, 35], [30, 68], [365, 85], [730, 95], [3650, 100],
];

export function recoveryPct(streakDays) {
  const a = RECOVERY_ANCHORS;
  if (streakDays <= 0) return 0;
  if (streakDays >= a[a.length - 1][0]) return 100;
  for (let i = 1; i < a.length; i++) {
    const [d0, p0] = a[i - 1], [d1, p1] = a[i];
    if (streakDays <= d1) {
      const t = (streakDays - d0) / (d1 - d0);
      return +(p0 + t * (p1 - p0)).toFixed(1);
    }
  }
  return 100;
}

export const RECOVERY_TIMELINE = [
  { at: '20 min', days: 0.0139, pct: 3,  body: 'Heart rate & blood pressure begin to fall; oxygen rises.' },
  { at: '12–24 h', days: 0.5,   pct: 8,  body: 'Carbon monoxide clears your blood. Oxygen normalizes.' },
  { at: '2–3 days', days: 2,    pct: 14, body: 'Taste & smell revive. A temporary clearing cough may start.' },
  { at: '2 wk–3 mo', days: 14,  pct: 35, body: 'Circulation improves; lung function climbs. Exercise feels easier.' },
  { at: '1–9 mo', days: 30,     pct: 68, body: 'Cilia regrow and sweep the lungs clean. Cough & breathlessness ease.' },
  { at: '1 year', days: 365,    pct: 85, body: 'Coronary heart-disease risk drops to half a smoker’s.' },
  { at: '2–5 yr', days: 730,    pct: 95, body: 'Stroke & cancer risks keep falling toward a non-smoker’s.' },
  { at: '10–15 yr', days: 3650, pct: 100, body: 'Long-term near-normalization. You, restored.' },
];

/* ============================================================================
   §2.3 / §2.4  SPEED DIAL + LEVEL + WEEK GENERATORS
   ========================================================================== */
export const SPEED_DIAL = {
  gentle:     { label: 'Gentle',     trainingDays: 3, volumeMod: 0.6, repBias: 'low',  rest: '90–150s', cardioZone: 2, intervals: false },
  balanced:   { label: 'Balanced',   trainingDays: 5, volumeMod: 1.0, repBias: 'mid',  rest: '60–120s', cardioZone: 2, intervals: true },
  relentless: { label: 'Relentless', trainingDays: 6, volumeMod: 1.3, repBias: 'high', rest: '30–90s',  cardioZone: 3, intervals: true },
};

// Streak gates the *allowed* ceiling on the dial (§2.7). Supportive, not punitive.
export function allowedMode(streakDays) {
  if (streakDays < 8) return 'gentle';
  if (streakDays < 30) return 'balanced';
  return 'relentless';
}
const MODE_ORDER = ['gentle', 'balanced', 'relentless'];
export function clampMode(mode, streakDays) {
  const cap = allowedMode(streakDays);
  return MODE_ORDER.indexOf(mode) <= MODE_ORDER.indexOf(cap) ? mode : cap;
}

export function lungLevel(weeksElapsed, streakDays) {
  if (weeksElapsed >= 12 && streakDays >= 30) return 'peak';
  if (weeksElapsed >= 5 && streakDays >= 14) return 'build';
  return 'foundation';
}

/* ---- Exercise ladders (easiest → hardest). `bar`/`bands` = equipment gate. -- */
const LADDERS = {
  push:   ['Incline push-up (hands raised)', 'Knee push-up', 'Full push-up', 'Diamond push-up', 'Archer push-up', 'Pseudo-planche push-up'],
  vpush:  ['Wall pike push-up', 'Pike push-up', 'Elevated pike push-up', 'Wall handstand hold', 'Handstand push-up negative'],
  dip:    ['Bench/chair dip (bent legs)', 'Bench dip (straight legs)', 'Deep chair dip', 'Parallel-bar dip'],
  pull:   ['Towel/door inverted row', 'Table inverted row', 'Band-assisted pull-up', 'Negative pull-up', 'Full pull-up', 'Archer pull-up'],
  hrow:   ['Prone Y-T-W raise', 'Towel row (isometric)', 'Table inverted row', 'Band row'],
  squat:  ['Assisted/box squat', 'Bodyweight squat', 'Tempo squat (3s down)', 'Bulgarian split squat', 'Cossack squat', 'Box pistol squat', 'Pistol squat'],
  hinge:  ['Glute bridge', 'Single-leg glute bridge', 'Hip thrust (shoulders raised)', 'Nordic curl negative'],
  core:   ['Dead bug', 'Forearm plank', 'Hollow hold (tuck)', 'Hollow rock', 'L-sit tuck', 'Full L-sit'],
  calf:   ['Two-leg calf raise', 'Single-leg calf raise', 'Deficit single-leg raise'],
};
const LADDER_GATE = { pull: 'bar', hrow: null }; // pull benefits from bar but has floor fallbacks; we gate top rungs in pickRung

function pickRung(ladderKey, level, equipment) {
  const ladder = LADDERS[ladderKey];
  let idx = level === 'foundation' ? 1 : level === 'build' ? 2 : 3;
  idx = Math.min(idx, ladder.length - 1);
  // Equipment gates: bar-only rungs for pull (band/full pull-up) fall back to inverted rows
  if (ladderKey === 'pull' && !equipment.bar && !equipment.bands) idx = Math.min(idx, 1); // table rows
  if (ladderKey === 'pull' && equipment.bands && !equipment.bar) idx = Math.min(idx, 2);  // band-assisted
  if (ladderKey === 'dip' && idx >= 3 && !equipment.bar) idx = 2;                          // no parallel bars
  return ladder[idx];
}

const REP = { low: r => r[0], mid: r => Math.round((r[0] + r[1]) / 2), high: r => r[1] };
function reps(range, bias) { return REP[bias](range); }

// focus → movement blocks [ladderKey, baseSets, repRange]
const FOCUS_BLOCKS = {
  push:   [['push', 4, [6, 12]], ['vpush', 3, [5, 10]], ['dip', 3, [6, 12]], ['core', 3, [20, 45]]],
  pull:   [['pull', 4, [4, 10]], ['hrow', 3, [8, 15]], ['core', 3, [20, 45]]],
  legs:   [['squat', 4, [8, 15]], ['hinge', 3, [8, 15]], ['calf', 3, [12, 20]], ['core', 3, [20, 45]]],
  upper:  [['push', 4, [6, 12]], ['pull', 4, [4, 10]], ['vpush', 3, [5, 10]], ['core', 3, [20, 45]]],
  lower:  [['squat', 4, [8, 15]], ['hinge', 4, [8, 15]], ['calf', 3, [12, 20]], ['core', 3, [20, 45]]],
  full:   [['push', 3, [6, 12]], ['pull', 3, [4, 10]], ['squat', 3, [8, 15]], ['hinge', 2, [8, 15]], ['core', 3, [20, 45]]],
};
const FOCUS_LABEL = {
  push: 'Push — chest · shoulders · triceps', pull: 'Pull — back · biceps · grip', legs: 'Legs — squat · hinge + core',
  upper: 'Upper body — push + pull', lower: 'Lower body — squat · hinge · calves', full: 'Full body — all major muscles',
};

/* ---- Split styles: full-body (all muscles daily) vs muscle-group splits --- */
export const SPLITS = {
  'full-body':   { label: 'Full-body', muscles: 'All muscles, every session', focuses: ['full'],
    blurb: 'Every workout trains your whole body. Highest frequency per muscle — the most proven setup for a novice building lean mass on 3 days a week.' },
  'upper-lower': { label: 'Upper / Lower', muscles: 'Alternating halves', focuses: ['upper', 'lower'],
    blurb: 'Alternate upper-body and lower-body days. The best balance of volume and recovery once you train 4 days a week.' },
  'ppl':         { label: 'Push / Pull / Legs', muscles: 'Split by movement', focuses: ['push', 'pull', 'legs'],
    blurb: 'Split by movement pattern. Lets you pile on volume across 5–6 days as you advance.' },
};
export function recommendSplit(trainingDays) { return trainingDays <= 3 ? 'full-body' : trainingDays <= 4 ? 'upper-lower' : 'ppl'; }
export function resolveSplit(p) {
  const dial = SPEED_DIAL[clampMode(p.mode, p.streakDays)];
  const rec = recommendSplit(dial.trainingDays);
  return (p.splitStyle && p.splitStyle !== 'auto' && SPLITS[p.splitStyle]) ? p.splitStyle : rec;
}

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TRAIN_DAYS = { 3: ['Mon', 'Wed', 'Fri'], 4: ['Mon', 'Tue', 'Thu', 'Fri'], 5: ['Mon', 'Tue', 'Thu', 'Fri', 'Sat'], 6: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] };
const DAY_BREATH = {
  Mon: ['Diaphragmatic', 'Pursed-lip'], Tue: ['Box breathing', 'Costal expansion'], Wed: ['Anulom Vilom', 'Thoracic mobility'],
  Thu: ['Diaphragmatic', 'Costal expansion'], Fri: ['Pursed-lip', 'Box breathing'], Sat: ['Costal expansion', '+ peak pranayama if unlocked'], Sun: ['Anulom Vilom', 'Slow diaphragmatic'],
};

// Generate the repeatable week for ANY split style, scaled by speed-dial.
export function generateWeek(p) {
  const mode = clampMode(p.mode, p.streakDays);
  const dial = SPEED_DIAL[mode];
  const level = lungLevel(p.weeksElapsed, p.streakDays);
  const focuses = SPLITS[resolveSplit(p)].focuses;
  const trainSet = new Set(TRAIN_DAYS[dial.trainingDays] || TRAIN_DAYS[5]);
  let fi = 0;
  return ALL_DAYS.map(day => {
    const breath = DAY_BREATH[day] || ['Diaphragmatic', 'Pursed-lip'];
    if (!trainSet.has(day)) {
      const rest = day === 'Sun';
      return { day, key: null, focus: rest ? 'Full rest — the day you grow' : 'Active recovery + lung rehab',
        strength: false, blocks: [], cardio: rest ? 'Optional gentle stroll' : 'Zone-2 25–40 min', breathwork: breath };
    }
    const focus = focuses[fi % focuses.length]; fi++;
    const blocks = FOCUS_BLOCKS[focus].map(([k, sets, range]) => ({
      exercise: pickRung(k, level, p.equipment),
      sets: Math.max(2, Math.round(sets * dial.volumeMod)),
      reps: k === 'core' ? `${reps(range, dial.repBias)}s` : `${reps(range, dial.repBias)} reps`,
      rest: dial.rest,
    }));
    return { day, key: focus, focus: FOCUS_LABEL[focus] || focus, strength: true, blocks,
      cardio: dial.intervals && day === 'Fri' ? 'Graded intervals (wk 5+)' : 'Zone-2 walk', breathwork: breath };
  });
}

/* ---- Breathwork library by level (forceful pranayama gated) -------------- */
const BREATH_LIBRARY = {
  foundation: ['Diaphragmatic', 'Pursed-lip', 'Costal expansion'],
  build:      ['Diaphragmatic', 'Pursed-lip', 'Costal expansion', 'Box breathing', 'Anulom Vilom', 'Breath stacking'],
  peak:       ['Diaphragmatic', 'Pursed-lip', 'Costal expansion', 'Box breathing', 'Anulom Vilom', 'Breath stacking', 'Kapalbhati', 'Bhastrika'],
};
const FORCEFUL = new Set(['Kapalbhati', 'Bhastrika']);

export function generateLungWeek(p) {
  const mode = clampMode(p.mode, p.streakDays);
  const level = lungLevel(p.weeksElapsed, p.streakDays);
  let techniques = BREATH_LIBRARY[level].slice();
  const forcefulUnlocked = level === 'peak' && p.safetyGreen && mode !== 'gentle';
  if (!forcefulUnlocked) techniques = techniques.filter(t => !FORCEFUL.has(t));
  return {
    level,
    dailyMinutes: '10–15 min',
    techniques,
    forcefulUnlocked,
    intervals: level !== 'foundation' && p.streakDays >= 14 && mode !== 'gentle',
  };
}

export const BREATH_DETAIL = {
  'Diaphragmatic': { tag: 'Foundation', cycle: [4, 0, 6, 0], how: 'Hand on belly. Inhale through the nose 4s — belly rises, chest quiet. Exhale 6s — belly falls.', benefit: 'Retrains your main breathing muscle, lowers the stress that fuels cravings.' },
  'Pursed-lip': { tag: 'Rescue', cycle: [2, 0, 4, 0], how: 'Inhale through the nose 2s. Purse lips like blowing a candle, exhale slowly 4s.', benefit: 'Keeps airways open longer, relieves breathlessness on stairs & effort.' },
  'Costal expansion': { tag: 'Foundation', cycle: [4, 1, 6, 0], how: 'Hands on lower ribs. Breathe wide into your hands, feel the ribcage expand sideways.', benefit: 'Opens the lower lobes that smoking stiffens; improves lung volume.' },
  'Box breathing': { tag: 'Build', cycle: [4, 4, 4, 4], how: 'Inhale 4 · hold 4 · exhale 4 · hold 4. Smooth square.', benefit: 'Calms the nervous system, builds CO₂ tolerance and focus.' },
  'Anulom Vilom': { tag: 'Build', cycle: [4, 0, 6, 0], how: 'Alternate-nostril: inhale left, exhale right, inhale right, exhale left. No force.', benefit: 'Balances and steadies the breath; gentle and craving-calming.' },
  'Breath stacking': { tag: 'Build', cycle: [2, 1, 2, 0], how: 'Take small sips of air on top of each other to fill fully, then a long exhale.', benefit: 'Recruits more lung tissue, improves maximal inflation.' },
  'Kapalbhati': { tag: 'Peak · gated', cycle: [1, 0, 1, 0], how: 'Short forceful exhales through the nose, passive inhales. 20–30 slow pumps. STOP if dizzy.', benefit: 'Energizing airway clearance. Locked until peak level + green safety.' },
  'Bhastrika': { tag: 'Peak · gated', cycle: [2, 0, 2, 0], how: 'Forceful equal inhale+exhale, 10–15 reps, full recovery between rounds.', benefit: 'Strong ventilation drill. Locked until peak level + green safety.' },
};

/* ============================================================================
   §2.5  DIET DAY (pure lacto-veg, eggless default)
   ========================================================================== */
export function generateDietDay(p, m = macros(p)) {
  const veg = p.diet.vegan, egg = p.diet.allowEgg;
  const meals = [
    { meal: 'Breakfast', kcal: 560, protein: 32, accent: 'sky',
      items: veg ? '2 besan chillas (spinach/onion); 150g soy yogurt; 250ml soy milk + 1 scoop pea protein'
                 : '2 besan chillas (spinach/onion); 150g hung curd / Greek yogurt; 250ml milk' + (egg ? ' + 2 egg whites in batter' : '') },
    { meal: 'Lunch', kcal: 720, protein: 45, accent: 'sage',
      items: '1 bowl rajma / mixed dal (200g) + 30g soy chunks; 2 roti or 1 cup rice; salad' + (veg ? '' : ' + curd') },
    { meal: 'Snack', kcal: 480, protein: 38, accent: 'clay',
      items: `1 scoop ${veg ? 'pea+rice' : 'whey'} protein; 40g roasted chana; ${veg ? 'soy yogurt' : 'hung curd'} + veg sticks; 1 orange or guava (vitamin C)` },
    { meal: 'Dinner', kcal: 640, protein: 40, accent: 'sky',
      items: `150g ${veg ? 'tofu' : 'paneer / tofu'} sabzi; 1 bowl moong dal; 2 roti or millet; sautéed greens` },
  ];
  const totalP = meals.reduce((s, x) => s + x.protein, 0);
  const totalK = meals.reduce((s, x) => s + x.kcal, 0);
  return { meals, totalProtein: totalP, totalKcal: totalK, target: m };
}

export const LUNG_FOODS = ['Oranges & guava (vitamin C)', 'Spinach & leafy greens', 'Ginger & turmeric', 'Garlic & onion', 'Tomatoes (lycopene)', 'Green tea', 'Pumpkin & flax seeds (omega-3)', 'Berries (antioxidants)'];
export const SUPPLEMENTS = [
  { n: 'Vitamin B12', why: 'Essential on a vegetarian diet — nerve & blood health.' },
  { n: 'Vitamin D3', why: 'Most people run low; supports immunity & recovery.' },
  { n: 'Algal Omega-3', why: 'Veg DHA/EPA — anti-inflammatory for healing airways.' },
  { n: 'Vitamin C (food-first)', why: 'Counters oxidative stress. Avoid high-dose beta-carotene pills (lung-cancer risk in smokers).' },
  { n: 'Magnesium', why: '200–400 mg at night — sleep, muscle recovery.' },
];

/* ============================================================================
   §2.8  MILESTONES
   ========================================================================== */
export const MILESTONES = [
  { id: 's1', kind: 'streak', at: 1, label: 'Day One', note: 'The hardest rep is starting. Done.', fx: 'badge' },
  { id: 's3', kind: 'streak', at: 3, label: '72 Hours', note: 'Taste & smell switching back on.', fx: 'lung' },
  { id: 's14', kind: 'streak', at: 14, label: 'Two Weeks', note: 'Circulation rising. Exercise gets easier.', fx: 'lung' },
  { id: 's30', kind: 'streak', at: 30, label: '30 Days', note: 'A full month. Cilia are regrowing.', fx: 'takeover' },
  { id: 's100', kind: 'streak', at: 100, label: '100 Days', note: 'Triple digits. A different set of lungs.', fx: 'takeover' },
  { id: 's365', kind: 'streak', at: 365, label: 'One Year', note: 'New lungs, new you. Heart-disease risk halved.', fx: 'takeover' },
  { id: 'w_band', kind: 'weight', at: 72, label: 'Entered the 75 kg band', note: 'Lean & strong — the physique target.', fx: 'ring' },
];

export function nextMilestone(p) {
  const streakMs = MILESTONES.filter(m => m.kind === 'streak');
  return streakMs.find(m => m.at > p.streakDays) || streakMs[streakMs.length - 1];
}
export function achievedMilestones(p) {
  return MILESTONES.filter(m =>
    (m.kind === 'streak' && p.streakDays >= m.at) ||
    (m.kind === 'weight' && p.currentWeight >= m.at));
}

/* ============================================================================
   SLEEP → READINESS  (last night, lightly smoothed by the recent average)
   ========================================================================== */
export function computeReadiness(profile) {
  const log = (profile.sleepLog || []).slice().sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first
  const last = log[0];
  if (!last) return { score: null, band: 'unknown', advice: 'Log last night’s sleep to get today’s readiness — it tunes how hard to push.', lastNight: null };

  const hoursScore = (h) => {
    if (h >= 7.5 && h <= 9) return 60;
    if (h > 9 && h <= 10) return 50;
    if (h >= 6.5 && h < 7.5) return 48;
    if (h >= 5.5 && h < 6.5) return 34;
    if (h >= 4.5 && h < 5.5) return 22;
    return 14;
  };
  const QUALITY = [0, 12, 24, 33, 40];                 // quality 1..4 → 0..40
  const nightScore = (n) => Math.round(hoursScore(+n.hours) + (QUALITY[Math.max(1, Math.min(4, +n.quality || 3))]));

  // weight last night 70%, prior two nights 30% (rewards consistency)
  let score = nightScore(last);
  const prior = log.slice(1, 3);
  if (prior.length) {
    const avgPrior = prior.reduce((s, n) => s + nightScore(n), 0) / prior.length;
    score = Math.round(score * 0.7 + avgPrior * 0.3);
  }
  score = Math.max(0, Math.min(100, score));
  const band = score >= 75 ? 'high' : score >= 50 ? 'mid' : 'low';
  const advice = band === 'high'
    ? 'Recovered and primed — train as planned, and it’s a strong day to push the top of your rep ranges.'
    : band === 'mid'
      ? 'Decent recovery — train as planned and keep your rest periods honest.'
      : 'Under-recovered — keep today Gentle: full breathwork, an easy zone-2 walk, and lighter volume. Muscle is built while you sleep, not when you grind tired.';
  return { score, band, advice, lastNight: last, suggestGentle: band === 'low' };
}

/* ============================================================================
   AGGREGATOR — one call returns everything the UI needs
   ========================================================================== */
export function computePlan(profile) {
  const p = { ...DEFAULT_PROFILE, ...profile };
  const effMode = clampMode(p.mode, p.streakDays);
  const m = macros(p, effMode);
  const cigsAvoided = Math.round(p.streakDays * p.smoking.baselineCigsPerDay);
  const moneySaved = Math.round(cigsAvoided * p.smoking.costPerCig);
  const weightToGo = +(TARGET_WEIGHT - p.currentWeight).toFixed(1);
  // ETA at a healthy lean-gain rate (~0.35 kg/wk midpoint)
  const weeksToTarget = weightToGo > 0 ? Math.ceil(weightToGo / 0.35) : 0;
  return {
    profile: p,
    effectiveMode: effMode,
    allowed: allowedMode(p.streakDays),
    bmr: Math.round(bmr(p)),
    macros: m,
    recovery: recoveryPct(p.streakDays),
    week: generateWeek(p),
    split: { style: resolveSplit(p), recommended: recommendSplit(SPEED_DIAL[effMode].trainingDays), styles: SPLITS },
    lung: generateLungWeek(p),
    diet: generateDietDay(p, m),
    level: lungLevel(p.weeksElapsed, p.streakDays),
    milestones: { next: nextMilestone(p), achieved: achievedMilestones(p), all: MILESTONES },
    readiness: computeReadiness(p),
    stats: { cigsAvoided, moneySaved, weightToGo, weeksToTarget },
  };
}
