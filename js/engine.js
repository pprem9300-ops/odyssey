/* ============================================================================
   ODYSSEY — RULE ENGINE  (pure, deterministic, no DOM, no side effects)
   ----------------------------------------------------------------------------
   TRAINING BRAIN v2 (2026-06-22): the calisthenics program is now PERFORMANCE-
   DRIVEN, not streak-gated. Exercise difficulty auto-progresses from the user's
   own logged sets (double-progression + ladder climb), intensity (intervals,
   plyometrics, agility) unlocks from logged training — never from the smoke-free
   streak. Aesthetic / "looksmaxx" balance (V-taper, posture, leanness) is scored
   from the same logs. The streak + lung-recovery remain a SEPARATE wellness layer.
   Units: kg / cm / yr / kcal.  computePlan(profile, exDb, now) returns everything.
   ========================================================================== */

export const TARGET_WEIGHT = 75;            // kg — the lean physique anchor
const KCAL_FLOOR_MALE = 1500;
const KCAL_FLOOR_FEMALE = 1200;
const DAY_MS = 864e5;

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
  mode: 'auto',               // speed dial — 'auto' follows your performance; or pick gentle/balanced/relentless
  splitStyle: 'auto',         // 'auto' | 'full-body' | 'upper-lower' | 'ppl'
  goalFocus: 'aesthetic',     // calisthenics aesthetic + strength + athleticism
  advancedMode: false,        // manual override: opt into the Advanced phase before the ~14-week auto-unlock
  streakDays: 0,              // reduce + rehab, no quit date yet → day one (WELLNESS layer only)
  weeksElapsed: 0,            // training weeks since start
  diet: { vegan: false, allowEgg: false },
  equipment: { bar: false, bands: false, weights: false },  // floor-only; toggles unlock progressions
  smoking: { approach: 'reduce', baselineCigsPerDay: 10, costPerCig: 17 }, // ₹ est. (~₹340/pack of 20)
  symptoms: ['cough', 'breathless', 'post-weed-tightness'],
  safetyGreen: true,          // no hard red-flags; doctor-baseline still recommended
  cleanDates: [],             // ['YYYY-MM-DD', ...] — real dated streak history
  weightHistory: [],          // [{ date, kg }, ...] — dated weight trend
  sleepLog: [],               // [{ date, hours, quality(1-4) }, ...] — nightly sleep
  workoutLog: {},             // { 'YYYY-MM-DD': { exerciseName: [{reps,weight}] } } — drives progression
  waterLog: {},               // { 'YYYY-MM-DD': glasses }
  mealLog: {},                // { 'YYYY-MM-DD': [mealName] }
  moodLog: {},                // { 'YYYY-MM-DD': moodIndex }
  journalLog: {},             // { 'YYYY-MM-DD': note }
  checklistLog: {},           // { 'YYYY-MM-DD': [checkId] } — persisted Today checklist ticks
  measureLog: {},             // { 'YYYY-MM-DD': { waist, chest, arm, thigh, weight } } cm/kg — body measurements
  mealSwaps: {},              // { slot: altIndex } — chosen meal alternative per slot
  groceryChecked: {},         // { itemKey: true } — ticked grocery items
  deloadActive: false,        // manual deload week → ~half volume for recovery
};

/* ============================================================================
   §1  BMR → TDEE → GOAL → CALORIES & MACROS   (unchanged nutrition brain)
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
export function calorieTarget(p, mode = resolveMode(p)) {
  const maint = tdee(p);
  const goal = selectGoal(p.currentWeight);
  let target = maint * (1 + GOAL_ADJ[goal][mode]);
  if (p.streakDays <= 7) target += 125;                       // early buffer
  const floor = Math.max(bmr(p), p.sex === 'male' ? KCAL_FLOOR_MALE : KCAL_FLOOR_FEMALE);
  return { goal, maintenance: Math.round(maint), kcal: Math.round(Math.max(target, floor)) };
}
export function macros(p, mode = resolveMode(p)) {
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
   §2  SMOKE-FREE RECOVERY %  (WELLNESS layer — does NOT gate training)
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
   §3  SPEED DIAL  (volume/training-days — fully UNLOCKED, performance-recommended)
   ========================================================================== */
export const SPEED_DIAL = {
  gentle:     { label: 'Gentle',     trainingDays: 3, volumeMod: 0.7, repBias: 'low',  rest: '90–150s', cardioZone: 2, intervals: false },
  balanced:   { label: 'Balanced',   trainingDays: 5, volumeMod: 1.0, repBias: 'mid',  rest: '60–120s', cardioZone: 2, intervals: true },
  relentless: { label: 'Relentless', trainingDays: 6, volumeMod: 1.3, repBias: 'high', rest: '30–90s',  cardioZone: 3, intervals: true },
};
const MODE_ORDER = ['gentle', 'balanced', 'relentless'];

/* ============================================================================
   §4  WORKOUT-LOG HELPERS  (the raw material for all auto-progression)
   ========================================================================== */
function wlog(p) { return (p && p.workoutLog) || {}; }
function isoFromMs(ms) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
// Sessions logged for a given exercise, newest-first: [{date, sets:[{reps,weight}]}]
function exerciseSessions(p, name) {
  const log = wlog(p);
  return Object.keys(log)
    .filter(d => log[d] && (log[d][name] || []).length)
    .sort().reverse()
    .map(d => ({ date: d, sets: log[d][name] }));
}
// Highest index in a ladder the user has ever logged (or -1 if none).
function ladderTopLoggedIdx(p, ladder) {
  let top = -1;
  ladder.forEach((n, i) => { if (exerciseSessions(p, n).length) top = i; });
  return top;
}
// # of distinct training days logged within `days` of `now`.
function sessionsInWindow(p, days, now) {
  const cutoff = isoFromMs(now - days * DAY_MS);
  const log = wlog(p);
  return Object.keys(log).filter(d => d >= cutoff && Object.keys(log[d] || {}).length).length;
}
// Total distinct training days ever logged.
function totalSessions(p) {
  const log = wlog(p);
  return Object.keys(log).filter(d => Object.keys(log[d] || {}).length).length;
}
// Mastery: the recent `needed` sessions ALL hit ≥ `hi` reps on every working set.
function masteredRecent(p, name, hi, needed = 2) {
  const s = exerciseSessions(p, name).slice(0, needed);
  if (!s.length) return false;
  return s.every(sess => sess.sets.length && sess.sets.every(set => (set.reps || 0) >= hi));
}
// Struggling: the most recent session fell below `lo` on every set.
function strugglingRecent(p, name, lo) {
  const s = exerciseSessions(p, name)[0];
  if (!s) return false;
  return s.sets.length && s.sets.every(set => (set.reps || 0) < lo);
}
function bestRepsLast(p, name) {
  const s = exerciseSessions(p, name)[0];
  return s ? Math.max(0, ...s.sets.map(x => x.reps || 0)) : 0;
}

/* ============================================================================
   §5  TRAINING LEVEL + MODE  (derived from PERFORMANCE, not streak)
   ========================================================================== */
const STAGE_BASE_IDX = { foundation: 1, build: 2, peak: 3 };

// Aggregate athlete level from demonstrated rungs on the core lifts + consistency.
export function trainingLevel(p) {
  const core = ['push', 'pull', 'squat', 'core'];
  let sum = 0, n = 0;
  core.forEach(k => { sum += Math.max(0, ladderTopLoggedIdx(p, LADDERS[k])); n++; });
  const avgIdx = n ? sum / n : 0;
  const sessions = totalSessions(p);
  let stage = 'foundation';
  if (sessions >= 12 && avgIdx >= 2.4) stage = 'peak';
  else if (sessions >= 4 && avgIdx >= 1) stage = 'build';
  const score = Math.round(Math.min(100, (avgIdx / 4) * 68 + Math.min(sessions, 24) / 24 * 32));
  return { stage, score, avgIdx: +avgIdx.toFixed(2), sessions };
}

// Performance-recommended dial, nudged down by poor readiness. Never streak-gated.
export function recommendedMode(p) {
  const stage = trainingLevel(p).stage;
  let mode = stage === 'peak' ? 'relentless' : stage === 'build' ? 'balanced' : 'gentle';
  const r = computeReadiness(p);
  if (r.band === 'low') mode = mode === 'relentless' ? 'balanced' : 'gentle';
  return mode;
}
// Resolve the dial the plan actually runs on. 'auto' → recommendation; else the user's pick.
export function resolveMode(p) {
  const m = p && p.mode;
  if (m && SPEED_DIAL[m]) return m;
  return recommendedMode(p);
}

/* ---- TRAINING TENURE → GRADUATION ---------------------------------------
   Distinct calendar weeks with ≥1 logged session. ~14 of them (≈3.5 months)
   can't be faked without months passing → a robust "duration" signal.        */
function trainingWeeks(p) {
  const weeks = new Set();
  const log = wlog(p);
  Object.keys(log).forEach(d => {
    if (Object.keys(log[d] || {}).length) {
      const ms = Date.parse(d + 'T00:00:00');
      if (!Number.isNaN(ms)) weeks.add(Math.floor(ms / (7 * DAY_MS)));
    }
  });
  return weeks.size;
}
// The smart graduation layer: after sustained training OR demonstrated peak OR a
// manual opt-in, enter the Advanced phase → retire easy rungs + add skill work.
export function graduation(p) {
  const tl = trainingLevel(p);
  const tenureWeeks = trainingWeeks(p);
  const manual = !!(p && p.advancedMode);
  const advanced = manual || tl.stage === 'peak' || (tenureWeeks >= 14 && tl.stage !== 'foundation');
  const developing = !advanced && (tl.stage === 'build' || tenureWeeks >= 6);
  const phase = advanced ? 'advanced' : developing ? 'developing' : 'starter';
  const baseFloor = advanced ? 3 : developing ? 2 : 1;            // raises the rung floor → easy moves drop out
  return { phase, advanced, developing, manual, tenureWeeks, baseFloor, skillUnlocked: advanced, weeksToAdvanced: advanced ? 0 : Math.max(0, 14 - tenureWeeks) };
}
// Advanced-phase skill movement per focus (floor-only, trained fresh, low volume).
function skillFor(focus) {
  if (focus === 'legs' || focus === 'lower') return { ladder: LADDERS.squat, base: LADDERS.squat.length - 2, range: [3, 8], tag: 'pistol line', timed: false };
  if (focus === 'push' || focus === 'upper') return { ladder: LADDERS.vpush, base: LADDERS.vpush.length - 2, range: [3, 8], tag: 'handstand line', timed: false };
  return { ladder: LADDERS.core, base: LADDERS.core.length - 2, range: [5, 12], tag: 'L-sit', timed: true };
}

// Periodic deload (recovery week) — suggested every ~6 training-weeks; user-toggled.
export function deloadState(p) {
  const weeks = trainingWeeks(p);
  const suggested = weeks > 0 && weeks % 6 === 0;
  const active = !!(p && p.deloadActive);
  return { active, suggested, weeks, volumeMod: active ? 0.5 : 1 };
}

// Lung/breath level — WELLNESS layer; governs forceful-pranayama safety only.
export function lungLevel(weeksElapsed, streakDays) {
  if (weeksElapsed >= 12 && streakDays >= 30) return 'peak';
  if (weeksElapsed >= 5 && streakDays >= 14) return 'build';
  return 'foundation';
}

/* ============================================================================
   §6  EXERCISE LADDERS  (easiest → hardest). Names match the Moves library.
   ========================================================================== */
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
// Conditioning ladders (agility / plyometric / metabolic), authored in the library.
const COND_LADDERS = {
  agility: ['A-march', 'Lateral shuffle', 'Fast feet', 'Carioca footwork'],
  plyo:    ['Pogo hops', 'Squat jump', 'Tuck jump', 'Broad jump', 'Depth jump'],
  cond:    ['Squat thrust', 'Half burpee', 'Full burpee'],
};

// Equipment cap: which is the hardest reachable rung given the user's equipment.
function equipCap(k, eq) {
  eq = eq || {};
  if (k === 'pull') { if (eq.bar) return LADDERS.pull.length - 1; if (eq.bands) return 2; return 1; }
  if (k === 'dip')  { return eq.bar ? LADDERS.dip.length - 1 : 2; }
  if (k === 'hrow') { return eq.bands ? LADDERS.hrow.length - 1 : 2; }   // 'Band row' needs bands → floor-cap at table rows
  return undefined;   // uncapped
}

/* ---- The adaptive picker — double-progression + ladder climb ------------- */
// Returns the rung to train NOW + whether it advanced/held/regressed + the
// next rep target, all from logged performance. `range` = [lo, hi] for this slot.
function adaptiveRung(ladder, baseIdx, p, range, capIdx, minIdx = 0) {
  const [lo, hi] = range;
  const top = ladderTopLoggedIdx(p, ladder);
  const ceil = Math.min(ladder.length - 1, capIdx == null ? ladder.length - 1 : capIdx);
  const floor = Math.min(Math.max(0, minIdx), ceil);             // graduated floor — retires easy rungs
  let idx = Math.max(baseIdx, top, floor);
  if (idx < 0) idx = 0;
  idx = Math.min(idx, ceil);
  const name = ladder[idx];

  let advanced = false, held = false, regressed = false, reason = '', target;
  if (masteredRecent(p, name, hi) && idx < ceil) {
    idx += 1; advanced = true;
    reason = `Mastered ${name} — leveling you up to ${ladder[idx]}.`;
  } else if (masteredRecent(p, name, hi)) {
    held = true;
    reason = `Top of this ladder — add load, slow the tempo, or push past ${hi} reps.`;
  } else if (strugglingRecent(p, name, lo) && idx > Math.max(floor, baseIdx)) {
    idx -= 1; regressed = true;
    reason = `Easing back to ${ladder[idx]} to rebuild clean reps, then climb again.`;
  } else {
    const last = exerciseSessions(p, ladder[idx])[0];
    reason = last
      ? `Progressing — drive toward ${hi} clean reps across all sets to level up.`
      : `New movement — log your sets and it auto-progresses from here.`;
  }
  idx = Math.max(floor, Math.min(idx, ceil));                    // never below the graduated floor

  const trainName = ladder[idx];
  if (advanced) target = lo;                                  // fresh rung → start at the bottom
  else {
    const best = bestRepsLast(p, trainName);
    target = best ? Math.min(hi, Math.max(lo, best + 1)) : lo; // double-progression: +1 rep
  }
  return { idx, exercise: trainName, advanced, held, regressed, reason, target, range: [lo, hi] };
}

/* ============================================================================
   §7  AESTHETIC PROGRAMMING — focus blocks tuned for a lean V-taper physique
   ----------------------------------------------------------------------------
   Principle: prioritise the FRAME muscles (lats + delts for width, tight core
   for the waist), keep PULL ≥ PUSH for posture, train legs proportionally, and
   keep arms compound-driven (no "bulky biceps only" trap). Core every session.
   ========================================================================== */
// focus → [ladderKey, baseSets, [repLo, repHi]]
const FOCUS_BLOCKS = {
  push:   [['push', 4, [6, 12]], ['vpush', 4, [6, 12]], ['dip', 3, [8, 15]], ['core', 4, [20, 45]]],
  pull:   [['pull', 5, [5, 10]], ['hrow', 4, [8, 15]], ['core', 4, [20, 45]]],
  legs:   [['squat', 4, [8, 15]], ['hinge', 4, [8, 15]], ['calf', 3, [12, 20]], ['core', 3, [20, 45]]],
  upper:  [['pull', 4, [5, 10]], ['push', 4, [6, 12]], ['vpush', 3, [6, 12]], ['hrow', 3, [8, 15]], ['core', 3, [20, 45]]],
  lower:  [['squat', 4, [8, 15]], ['hinge', 4, [8, 15]], ['calf', 3, [12, 20]], ['core', 3, [20, 45]]],
  full:   [['pull', 3, [5, 10]], ['push', 3, [6, 12]], ['squat', 3, [8, 15]], ['vpush', 2, [6, 12]], ['core', 3, [20, 45]]],
};
const FOCUS_LABEL = {
  push: 'Push — chest · shoulders · triceps', pull: 'Pull — back · lats · biceps', legs: 'Legs — squat · hinge + core',
  upper: 'Upper — pull-led push/pull', lower: 'Lower — squat · hinge · calves', full: 'Full body — all major muscles',
};
// What each pattern does for the LOOK — surfaced in the UI.
const PATTERN_AESTHETIC = {
  push: 'Chest & pressing strength', vpush: 'Shoulder width · V-taper', dip: 'Lower chest & triceps',
  pull: 'Back width & lats · V-taper', hrow: 'Posture & rear delts', squat: 'Legs & athletic base',
  hinge: 'Posterior chain & glutes', calf: 'Calves', core: 'Tight waist & abs',
  agility: 'Agility & footwork', plyo: 'Power & explosiveness', cond: 'Conditioning & leanness',
};

/* ---- Split styles -------------------------------------------------------- */
export const SPLITS = {
  'full-body':   { label: 'Full-body', muscles: 'All muscles, every session', focuses: ['full'],
    blurb: 'Every workout trains your whole body — the highest frequency per muscle and the most proven setup for a novice building lean mass on 3 days a week.' },
  'upper-lower': { label: 'Upper / Lower', muscles: 'Alternating halves', focuses: ['upper', 'lower'],
    blurb: 'Alternate upper and lower days — the best balance of volume and recovery once you train 4–5 days a week.' },
  'ppl':         { label: 'Push / Pull / Legs', muscles: 'Split by movement', focuses: ['pull', 'push', 'legs'],
    blurb: 'Pull-led Push / Pull / Legs — lets you pile aesthetic volume across 5–6 days as you advance.' },
};
export function recommendSplit(trainingDays) { return trainingDays <= 3 ? 'full-body' : trainingDays <= 4 ? 'upper-lower' : 'ppl'; }
export function resolveSplit(p) {
  const dial = SPEED_DIAL[resolveMode(p)];
  const rec = recommendSplit(dial.trainingDays);
  return (p.splitStyle && p.splitStyle !== 'auto' && SPLITS[p.splitStyle]) ? p.splitStyle : rec;
}

/* ---- Warm-up / mobility picks (names from the Moves library) ------------- */
const WARMUP = {
  upper: ['Scapular push-up', 'Band/towel shoulder dislocate', 'Thoracic rotation (open book)', 'Wrist & forearm prep'],
  lower: ['Hip circles', 'Leg swings', 'Deep squat hold', 'Cat-Cow'],
  full:  ['Cat-Cow', 'Leg swings', 'Scapular push-up', 'Hip circles'],
};
function warmupFor(focus) {
  if (focus === 'legs' || focus === 'lower') return WARMUP.lower;
  if (focus === 'push' || focus === 'pull' || focus === 'upper') return WARMUP.upper;
  return WARMUP.full;
}

/* ============================================================================
   §8  CONDITIONING + AGILITY + PLYO unlocks (performance-based)
   ========================================================================== */
function conditioningUnlocks(p, now) {
  const tl = trainingLevel(p);
  const recent = sessionsInWindow(p, 28, now);
  return {
    // HIIT/interval cardio: once you've shown you can train consistently
    intervals: recent >= 4 && tl.avgIdx >= 1,
    // basic jumps are fine early; advanced plyo gated by demonstrated level
    plyoBaseIdx: tl.stage === 'foundation' ? 0 : 1,
    plyoCapIdx:  tl.stage === 'peak' ? 4 : tl.stage === 'build' ? 3 : 2,   // gate Broad(3)→build, Depth(4)→peak
    agilityBaseIdx: tl.stage === 'foundation' ? 0 : tl.stage === 'build' ? 1 : 2,
    stage: tl.stage,
  };
}

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TRAIN_DAYS = { 3: ['Mon', 'Wed', 'Fri'], 4: ['Mon', 'Tue', 'Thu', 'Fri'], 5: ['Mon', 'Tue', 'Thu', 'Fri', 'Sat'], 6: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] };
const DAY_BREATH = {
  Mon: ['Diaphragmatic', 'Pursed-lip'], Tue: ['Box breathing', 'Costal expansion'], Wed: ['Anulom Vilom', 'Thoracic mobility'],
  Thu: ['Diaphragmatic', 'Costal expansion'], Fri: ['Pursed-lip', 'Box breathing'], Sat: ['Costal expansion', '+ peak pranayama if unlocked'], Sun: ['Anulom Vilom', 'Slow diaphragmatic'],
};

/* ============================================================================
   §9  WEEK GENERATOR — a pro calisthenics regime, performance-progressed.
   Each training day: warm-up → (power, when fresh) → aesthetic strength blocks
   → conditioning finisher (zone-2 base / agility / intervals) → breath cooldown.
   Strength & hypertrophy emphasis UNDULATE across the week.
   ========================================================================== */
export function generateWeek(p, now = Date.now(), weakGroup = null) {
  const mode = resolveMode(p);
  const dial = SPEED_DIAL[mode];
  const tl = trainingLevel(p);
  const grad = graduation(p);
  const baseIdx = grad.baseFloor;                  // graduation raises the rung floor (retires easy moves)
  const minIdx = grad.advanced ? 3 : 0;
  const deload = deloadState(p);                   // recovery week → ~half volume
  const u = conditioningUnlocks(p, now);
  const splitStyle = resolveSplit(p);
  const focuses = SPLITS[splitStyle].focuses;
  const trainList = TRAIN_DAYS[dial.trainingDays] || TRAIN_DAYS[5];
  const trainSet = new Set(trainList);
  const intervalDay = trainList[trainList.length - 1];          // hardest conditioning last
  const agilityDay = trainList.length > 1 ? trainList[1] : trainList[0];

  let fi = 0, ti = 0;
  return ALL_DAYS.map(day => {
    const breath = DAY_BREATH[day] || ['Diaphragmatic', 'Pursed-lip'];

    if (!trainSet.has(day)) {
      const rest = day === 'Sun';
      return {
        day, key: null,
        focus: rest ? 'Full rest — the day you grow' : 'Active recovery + mobility',
        strength: false, emphasis: null, blocks: [], power: null,
        warmup: rest ? [] : ['Cat-Cow', 'Hip circles', 'Leg swings'],
        conditioning: rest
          ? { kind: 'rest', label: 'Full rest', detail: 'Sleep, hydrate, eat to your target. Muscle is built now — not in the gym.', exercises: [], unlocked: true }
          : { kind: 'recovery', label: 'Zone-2 + mobility flow', detail: '25–40 min easy aerobic (nose-breathe / talk-test) + a full mobility flow. Greases the joints and speeds recovery.', exercises: ['A-march'], unlocked: true },
        cardio: rest ? 'Optional gentle stroll' : 'Zone-2 25–40 min', breathwork: breath,
      };
    }

    const focus = focuses[fi % focuses.length]; fi++;
    const emphasis = (ti % 2 === 0) ? 'strength' : 'hypertrophy';   // weekly undulation

    // skill work (Advanced phase) — a NEW high-skill movement auto-added, trained fresh
    const used = new Set();
    let skill = null;
    if (grad.advanced) {
      const sk = skillFor(focus);
      const sr = adaptiveRung(sk.ladder, sk.base, p, sk.range, undefined, sk.base);
      used.add(sr.exercise);                                       // strength blocks dedupe around the skill
      skill = {
        exercise: sr.exercise, sets: 3,
        reps: sk.timed ? `${sr.target}s hold` : `${sr.target} quality reps`,
        rest: '90–120s', advanced: sr.advanced, kind: 'skill',
        aesthetic: 'Skill · ' + sk.tag,
        reason: `Skill work — own the advanced ${sk.tag} while you're fresh.`,
      };
    }

    // strength blocks — performance-driven rung + reps (deduped within a session)
    const blocks = FOCUS_BLOCKS[focus].map(([k, sets, range]) => {
      const cap = equipCap(k, p.equipment);
      let r = adaptiveRung(LADDERS[k], baseIdx, p, range, cap, minIdx);
      if (used.has(r.exercise)) {                                    // two patterns landed on the same move → split them
        const ladder = LADDERS[k];
        const ceil = Math.min(ladder.length - 1, cap == null ? ladder.length - 1 : cap);
        let alt = -1;
        for (let off = 1; off < ladder.length; off++) {
          const dn = r.idx - off, up = r.idx + off;
          if (dn >= 0 && !used.has(ladder[dn])) { alt = dn; break; }
          if (up <= ceil && !used.has(ladder[up])) { alt = up; break; }
        }
        if (alt >= 0) r = { ...r, idx: alt, exercise: ladder[alt], advanced: false, held: false, regressed: false, reason: 'Paired variation so today trains two distinct movements.' };
      }
      used.add(r.exercise);
      const repTarget = emphasis === 'strength'
        ? Math.max(range[0], Math.round(r.target * 0.8))             // strength day → lower reps, harder
        : r.target;                                                  // hypertrophy day → the progression target
      return {
        pattern: k, exercise: r.exercise,
        sets: Math.max(2, Math.round(sets * dial.volumeMod * deload.volumeMod)),
        reps: k === 'core' ? `${repTarget}s` : `${repTarget} reps`,
        target: repTarget, range: r.range, rest: dial.rest,
        advanced: r.advanced, held: r.held, regressed: r.regressed, reason: r.reason,
        aesthetic: PATTERN_AESTHETIC[k] || '',
      };
    });

    // weak-point auto-targeting — one bonus set on the lagging muscle group's block
    const WEAK_PATTERN = { shoulders: 'vpush', back: 'pull', chest: 'push', core: 'core', legs: 'squat' };
    if (weakGroup && WEAK_PATTERN[weakGroup]) {
      const wp = blocks.find(b => b.pattern === WEAK_PATTERN[weakGroup]);
      if (wp) { wp.sets += 1; wp.priority = true; wp.aesthetic += ' · priority bring-up'; }
    }

    // power (plyometrics) — placed FIRST when fresh, on leg/lower/full days
    let power = null;
    if (focus === 'legs' || focus === 'lower' || focus === 'full') {
      const pr = adaptiveRung(COND_LADDERS.plyo, u.plyoBaseIdx, p, [3, 5], u.plyoCapIdx);
      power = {
        exercise: pr.exercise, sets: 4, reps: `${pr.target} explosive reps`,
        rest: '60–120s', reason: pr.reason, advanced: pr.advanced,
        aesthetic: PATTERN_AESTHETIC.plyo, kind: 'plyo',
      };
    }

    // conditioning finisher
    let conditioning;
    if (day === intervalDay && u.intervals) {
      const cr = adaptiveRung(COND_LADDERS.cond, 0, p, [10, 16], COND_LADDERS.cond.length - 1);
      conditioning = {
        kind: 'intervals', label: 'Intervals · HIIT finisher',
        detail: '6–10 rounds · 30s hard / 30s easy. Drive hard, breathe it back on the rest — talk-test honest.',
        protocol: '30/30 × 8', exercises: [cr.exercise, 'Mountain climbers'], unlocked: true, reason: cr.reason,
        aesthetic: PATTERN_AESTHETIC.cond,
      };
    } else if (day === agilityDay) {
      const ar = adaptiveRung(COND_LADDERS.agility, u.agilityBaseIdx, p, [1, 1], COND_LADDERS.agility.length - 1);
      conditioning = {
        kind: 'agility', label: 'Agility & footwork',
        detail: '4–6 rounds · 20–30s quick, reactive feet. Light and fast — coordination + a lean aerobic burn.',
        exercises: [ar.exercise], unlocked: true, reason: ar.reason, aesthetic: PATTERN_AESTHETIC.agility,
      };
    } else {
      conditioning = {
        kind: 'zone2', label: 'Zone-2 aerobic base',
        detail: '15–25 min easy — nose-breathe / talk-test. Builds the aerobic engine that makes everything recover faster and reveals the lean look.',
        exercises: [], unlocked: true, aesthetic: PATTERN_AESTHETIC.cond,
      };
    }
    ti++;

    return {
      day, key: focus, focus: FOCUS_LABEL[focus] || focus, strength: true, emphasis,
      warmup: warmupFor(focus), power, skill, blocks, conditioning,
      cardio: conditioning.kind === 'zone2' ? 'Zone-2 15–25 min' : conditioning.label,
      breathwork: breath,
    };
  });
}

/* ============================================================================
   §10  BREATHWORK  (WELLNESS layer — forceful pranayama gated by lung safety)
   ========================================================================== */
const BREATH_LIBRARY = {
  foundation: ['Diaphragmatic', 'Pursed-lip', 'Costal expansion'],
  build:      ['Diaphragmatic', 'Pursed-lip', 'Costal expansion', 'Box breathing', 'Anulom Vilom', 'Breath stacking'],
  peak:       ['Diaphragmatic', 'Pursed-lip', 'Costal expansion', 'Box breathing', 'Anulom Vilom', 'Breath stacking', 'Kapalbhati', 'Bhastrika'],
};
const FORCEFUL = new Set(['Kapalbhati', 'Bhastrika']);
export function generateLungWeek(p) {
  const mode = resolveMode(p);
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
   §11  DIET DAY (pure lacto-veg, eggless default)   (unchanged)
   ========================================================================== */
// Per-slot meal options (the swap pool) — pure lacto-veg, eggless by default.
function mealOptions(p) {
  const veg = p.diet.vegan, egg = p.diet.allowEgg;
  return {
    Breakfast: [
      { kcal: 560, protein: 32, accent: 'sky', items: veg ? '2 besan chillas (spinach/onion); 150g soy yogurt; 250ml soy milk + 1 scoop pea protein' : '2 besan chillas (spinach/onion); 150g hung curd / Greek yogurt; 250ml milk' + (egg ? ' + 2 egg whites' : '') },
      { kcal: 540, protein: 34, accent: 'sky', items: `80g oats + 250ml ${veg ? 'soy ' : ''}milk + 1 scoop ${veg ? 'pea' : 'whey'} protein; 15g peanut butter; 1 banana` },
      { kcal: 520, protein: 33, accent: 'sky', items: veg ? '200g tofu bhurji (onion/tomato/turmeric); 2 multigrain toast; 1 orange' : '200g paneer bhurji; 2 multigrain toast; 1 orange' },
    ],
    Lunch: [
      { kcal: 720, protein: 45, accent: 'sage', items: '1 bowl rajma / mixed dal (200g) + 30g soy chunks; 2 roti or 1 cup rice; salad' + (veg ? '' : ' + curd') },
      { kcal: 700, protein: 44, accent: 'sage', items: 'Chole (200g chickpeas) + 40g soy granules; 1 cup rice; cucumber-tomato salad' },
      { kcal: 730, protein: 46, accent: 'sage', items: `150g ${veg ? 'tofu' : 'paneer'} + mixed-veg curry; 2 roti; 1 bowl dal; salad` },
    ],
    Snack: [
      { kcal: 480, protein: 38, accent: 'clay', items: `1 scoop ${veg ? 'pea+rice' : 'whey'} protein; 40g roasted chana; ${veg ? 'soy yogurt' : 'hung curd'} + veg sticks; 1 orange or guava` },
      { kcal: 460, protein: 36, accent: 'clay', items: `1 scoop ${veg ? 'pea' : 'whey'} shake; 2 multigrain toast + 20g peanut butter; handful almonds` },
      { kcal: 470, protein: 34, accent: 'clay', items: 'Sprouts chaat (150g moong) + 1 boiled potato; 30g pumpkin seeds; green tea' },
    ],
    Dinner: [
      { kcal: 640, protein: 40, accent: 'sky', items: `150g ${veg ? 'tofu' : 'paneer / tofu'} sabzi; 1 bowl moong dal; 2 roti or millet; sautéed greens` },
      { kcal: 620, protein: 41, accent: 'sky', items: '40g soya-chunk curry; 1 bowl dal; 2 roti; stir-fried broccoli & beans' },
      { kcal: 650, protein: 39, accent: 'sky', items: `${veg ? 'Tofu' : 'Paneer'} tikka (180g) + grilled veg; 1 bowl rajma; 1 roti` },
    ],
  };
}
export function generateDietDay(p, m = macros(p)) {
  const opts = mealOptions(p);
  const swaps = (p && p.mealSwaps) || {};
  const meals = Object.keys(opts).map(slot => {
    const list = opts[slot];
    const idx = Math.min(Math.max(0, swaps[slot] || 0), list.length - 1);
    return { meal: slot, slot, altIndex: idx, altCount: list.length, alternatives: list, ...list[idx] };
  });
  const totalP = meals.reduce((s, x) => s + x.protein, 0);
  const totalK = meals.reduce((s, x) => s + x.kcal, 0);
  return { meals, totalProtein: totalP, totalKcal: totalK, target: m };
}

// Curated weekly grocery list (pure-veg / eggless aware), categorised + keyed.
export function groceryList(p) {
  const veg = p && p.diet && p.diet.vegan;
  const cats = [
    { cat: 'Protein', items: [veg ? 'Tofu (1 kg)' : 'Paneer + tofu (1 kg)', 'Soy chunks / granules (250g)', 'Rajma + chickpeas (500g ea)', 'Moong + mixed dal (1 kg)', `${veg ? 'Pea/rice' : 'Whey'} protein (tub)`, 'Roasted chana (250g)'] },
    { cat: 'Grains', items: ['Atta / multigrain flour', 'Rice (1 kg)', 'Oats (500g)', 'Millet (500g)', 'Multigrain bread'] },
    { cat: 'Veg & fruit', items: ['Spinach & leafy greens', 'Onion · tomato · cucumber', 'Broccoli + beans', 'Oranges / guava', 'Bananas'] },
    { cat: veg ? 'Dairy-free' : 'Dairy', items: veg ? ['Soy milk (2 L)', 'Soy yogurt'] : ['Milk (2 L)', 'Hung curd / Greek yogurt'] },
    { cat: 'Pantry & seeds', items: ['Peanut butter', 'Almonds + pumpkin/flax seeds', 'Ginger · garlic · turmeric', 'Green tea', 'Cooking oil'] },
  ];
  return cats.map(c => ({ cat: c.cat, items: c.items.map(label => ({ label, key: (c.cat + ':' + label).replace(/[^a-z0-9]+/gi, '_').toLowerCase() })) }));
}

// Plate calculator — greedy plates per side for a target total load, given bar + plate set.
export function platePlan(total, barKg = 20, plates = [20, 15, 10, 5, 2.5, 1.25]) {
  total = +total || 0; barKg = +barKg || 0;
  if (total <= barKg) return { barKg, total, perSide: [], remainder: 0, belowBar: total < barKg };
  let perSideKg = (total - barKg) / 2;
  const perSide = [];
  for (const pl of plates) {
    while (perSideKg >= pl - 1e-9) { perSide.push(pl); perSideKg -= pl; }
  }
  return { barKg, total, perSide, remainder: +(perSideKg * 2).toFixed(2) };
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
   §12  MILESTONES  (streak — WELLNESS layer)
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
   §13  SLEEP → READINESS  (autoregulates today's intensity)
   ========================================================================== */
export function computeReadiness(profile, now = Date.now()) {
  const log = (profile.sleepLog || []).slice().sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first
  const last = log[0];
  if (!last) return { score: null, band: 'unknown', advice: 'Log last night’s sleep to get today’s readiness — it tunes how hard to push.', lastNight: null, factors: {} };

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

  let score = nightScore(last);
  const prior = log.slice(1, 3);
  if (prior.length) {
    const avgPrior = prior.reduce((s, n) => s + nightScore(n), 0) / prior.length;
    score = Math.round(score * 0.7 + avgPrior * 0.3);
  }
  // comprehensive: fold in accumulated training load + today's mood
  const load = trainingLoad(profile, now);
  const factors = { sleep: Math.max(0, Math.min(100, score)), load: 0, mood: 0 };
  if (load.band === 'high') { score -= 10; factors.load = -10; }       // accumulated fatigue
  else if (load.band === 'low') { score += 4; factors.load = 4; }      // fresh
  const todayMood = (profile.moodLog || {})[isoFromMs(now)];
  if (todayMood != null) { const a = (todayMood - 2) * 3; score += a; factors.mood = a; }  // 0..4 → -6..+6

  score = Math.max(0, Math.min(100, Math.round(score)));
  const band = score >= 75 ? 'high' : score >= 50 ? 'mid' : 'low';
  const advice = band === 'high'
    ? 'Recovered and primed — train as planned, and it’s a strong day to push the top of your rep ranges.'
    : band === 'mid'
      ? 'Decent recovery — train as planned and keep your rest periods honest.'
      : 'Under-recovered — keep today gentle: full breathwork, an easy zone-2 walk, and lighter volume. Muscle is built while you sleep, not when you grind tired.';
  return { score, band, advice, lastNight: last, suggestGentle: band === 'low', load, factors };
}

/* ============================================================================
   §14  AESTHETIC / LOOKSMAXX ENGINE — scored from the workout log
   ----------------------------------------------------------------------------
   Maps logged exercises → muscle groups, compares the real distribution to an
   aesthetic ideal (V-taper biased), measures pull:push posture, finds the
   weakest link, and blends a 0–100 "aesthetic index".
   ========================================================================== */
const MUSCLE_GROUPS = [
  ['shoulders', /deltoid|delt\b/i],
  ['back', /latissimus|\blats?\b|rhomboid|trapezius|teres|erector spinae|spinal erector|paraspinal/i],
  ['chest', /pectoralis|\bpecs?\b/i],
  ['arms', /biceps|triceps|brachi|forearm|wrist flexor|wrist extensor/i],
  ['core', /abdomin|oblique|transverse abdom|\bcore\b|pelvic floor/i],
  ['legs', /quadricep|hamstring|glute|gastrocnemius|soleus|\bcalf\b|calves|adductor|abductor|hip flexor|iliopsoas|tibialis|hip rotator/i],
];
function groupOf(muscle) {
  for (const [g, re] of MUSCLE_GROUPS) { if (re.test(muscle)) return g; }
  return null;
}
// Ideal RELATIVE emphasis for a lean V-taper model physique (sums to 100).
const AESTHETIC_IDEAL = { back: 22, shoulders: 18, legs: 20, chest: 15, core: 15, arms: 10 };
const GROUP_NUDGE = {
  back: 'Add pulling volume — rows and pull-ups widen your back and drive the V-taper.',
  shoulders: 'Add vertical pressing / pike work — broad delts are the #1 lever for shoulder width.',
  legs: 'Train legs harder — proportional legs keep the physique complete, not top-heavy.',
  chest: 'Add pressing volume to fill out the chest.',
  core: 'Add direct core work — a tight, strong midsection sharpens the V-taper.',
  arms: 'Arms get plenty of indirect work — keep compounds first; a little direct work is fine.',
};
const GROUP_LABEL = { shoulders: 'Shoulders', back: 'Back & lats', chest: 'Chest', arms: 'Arms', core: 'Core & waist', legs: 'Legs & glutes' };

export function aestheticBalance(p, exDb = {}, now = Date.now()) {
  const cutoff = isoFromMs(now - 28 * DAY_MS);
  const log = wlog(p);
  const groups = { shoulders: 0, back: 0, chest: 0, arms: 0, core: 0, legs: 0 };
  let pushVol = 0, pullVol = 0, legVol = 0, totalSets = 0;

  Object.keys(log).forEach(date => {
    if (date < cutoff) return;
    const day = log[date] || {};
    Object.keys(day).forEach(name => {
      const sets = day[name] || [];
      const repVol = sets.reduce((s, x) => s + (x.reps || 0), 0);
      totalSets += sets.length;
      const ex = exDb[name];
      if (!ex) return;
      (ex.primaryMuscles || []).forEach(mu => { const g = groupOf(mu); if (g) groups[g] += repVol; });
      (ex.secondaryMuscles || []).forEach(mu => { const g = groupOf(mu); if (g) groups[g] += repVol * 0.5; });
      const fam = ex.family;
      if (fam === 'push' || fam === 'vpush' || fam === 'dip') pushVol += repVol;
      if (fam === 'pull' || fam === 'hrow') pullVol += repVol;
      if (fam === 'squat' || fam === 'hinge' || fam === 'calf' || fam === 'plyometric') legVol += repVol;
    });
  });

  const total = Object.values(groups).reduce((a, b) => a + b, 0);
  const pct = {};
  Object.keys(groups).forEach(g => pct[g] = total ? +(groups[g] / total * 100).toFixed(1) : 0);

  // balance: 100 minus half the total absolute deviation from the ideal split
  let dev = 0;
  Object.keys(AESTHETIC_IDEAL).forEach(g => dev += Math.abs((pct[g] || 0) - AESTHETIC_IDEAL[g]));
  const balance = total ? Math.max(0, Math.round(100 - dev / 2)) : 0;

  // posture: pull ÷ push (≥1 is good)
  const pp = pushVol ? +(pullVol / pushVol).toFixed(2) : (pullVol ? 2 : 0);
  const posture = (!pushVol && !pullVol) ? 0 : Math.max(0, Math.min(100, Math.round(pp >= 1 ? 100 : pp * 100)));

  // weakest link = biggest positive deficit vs ideal
  let weakest = null, worst = -Infinity;
  Object.keys(AESTHETIC_IDEAL).forEach(g => { const d = AESTHETIC_IDEAL[g] - (pct[g] || 0); if (d > worst) { worst = d; weakest = g; } });

  // consistency: sessions in last 21d vs 3 weeks at the dial's training-days
  const dial = SPEED_DIAL[resolveMode(p)];
  const recent = sessionsInWindow(p, 21, now);
  const consistency = Math.max(0, Math.min(100, Math.round(recent / (3 * dial.trainingDays) * 100)));

  // leanness trajectory (informational): how close to the 75 kg band, gaining lean
  const toGo = +(TARGET_WEIGHT - p.currentWeight).toFixed(1);
  const leanness = Math.max(0, Math.min(100, Math.round(100 - Math.abs(toGo) / 19 * 100)));

  const score = total
    ? Math.round(0.45 * balance + 0.20 * posture + 0.35 * consistency)
    : Math.round(0.35 * consistency);

  // the single most useful nudge
  let nudge;
  if (total && pushVol > 0 && pp < 0.9) nudge = 'Your pushing is outpacing your pulling — add rows/pull-ups. Pull-dominant training builds the back, widens the V-taper, and pulls the shoulders back for better posture.';
  else if (!total) nudge = 'Log your sets and the aesthetic engine starts tuning your split toward a lean V-taper — broad shoulders, wide back, tight waist.';
  else nudge = GROUP_NUDGE[weakest] || 'Keep the balance — pull ≥ push, frame muscles first, legs proportional.';

  return {
    groups: pct, groupLabels: GROUP_LABEL, ideal: AESTHETIC_IDEAL,
    pushVol, pullVol, legVol, pullPushRatio: pp,
    balance, posture, consistency, leanness, score,
    weakest, weakestLabel: weakest ? GROUP_LABEL[weakest] : null,
    nudge, totalSets, hasData: total > 0,
  };
}

/* ============================================================================
   §14b  CURRENT-STATE INTELLIGENCE — body comp · weight trend · adaptive cals ·
         training load · daily-focus coach (all pure, derived from the logs)
   ========================================================================== */

// Training load: acute (7d) vs chronic (28d avg-weekly) rep×load → ACWR.
export function trainingLoad(p, now = Date.now()) {
  const log = wlog(p);
  const dayVol = (date) => { const d = log[date]; if (!d) return 0; let v = 0; Object.values(d).forEach(arr => arr.forEach(s => v += (s.reps || 0) * Math.max(s.weight || 0, 1))); return v; };
  const sumWindow = (days) => { let v = 0; for (let i = 0; i < days; i++) v += dayVol(isoFromMs(now - i * DAY_MS)); return v; };
  const acute = sumWindow(7);
  const chronicWeekly = sumWindow(28) / 4;
  const acwr = chronicWeekly > 0 ? +(acute / chronicWeekly).toFixed(2) : (acute > 0 ? null : 0);
  let band = 'none', flag = '';
  if (acute || chronicWeekly) {
    if (acwr != null && acwr > 1.5) { band = 'high'; flag = 'Training load is spiking — you’re ramping volume fast. Watch the joints; a lighter day or a deload cuts injury risk.'; }
    else if (acwr != null && acwr < 0.8 && chronicWeekly > 0) { band = 'low'; flag = 'Training load is dropping — detraining creeps in. Add a session to hold your gains.'; }
    else { band = 'optimal'; flag = 'Training load is in the sweet spot — progressing without overreaching.'; }
  }
  return { acute: Math.round(acute), chronicWeekly: Math.round(chronicWeekly), acwr, band, flag };
}

// Body composition from the latest measurement (RFM needs only height + waist).
export function bodyComposition(p) {
  const log = (p && p.measureLog) || {};
  const dates = Object.keys(log).sort();
  const latest = dates.length ? log[dates[dates.length - 1]] : null;
  const waist = latest && +latest.waist;
  const shoulder = latest && +latest.shoulder;
  const chest = latest && +latest.chest;
  const weight = (latest && +latest.weight) || p.currentWeight;
  const h = p.heightCm;
  let bodyFat = null, leanMass = null, fatMass = null;
  if (waist && h) {
    bodyFat = (p.sex === 'female' ? 76 : 64) - 20 * (h / waist);    // Relative Fat Mass (height + waist)
    bodyFat = +Math.max(3, Math.min(50, bodyFat)).toFixed(1);
    if (weight) { fatMass = +(weight * bodyFat / 100).toFixed(1); leanMass = +(weight - fatMass).toFixed(1); }
  }
  const top = shoulder || chest;                                   // shoulder preferred; chest is the fallback
  const vTaper = (top && waist) ? +(top / waist).toFixed(2) : null;
  const vTaperPct = vTaper ? Math.max(0, Math.min(100, Math.round((vTaper / 1.618) * 100))) : null;
  return { bodyFat, leanMass, fatMass, vTaper, golden: 1.618, vTaperPct, usingShoulder: !!shoulder, waist: waist || null, hasData: !!(waist && h) };
}

// Least-squares weight trend over the last ~6 weeks → real rate + projection + pace.
export function weightTrend(p, now = Date.now()) {
  const goal = selectGoal(p.currentWeight);
  const idealBand = goal === 'leanGain' ? [0.2, 0.5] : goal === 'cut' ? [-0.75, -0.3] : [-0.2, 0.2];
  const cutoff = now - 45 * DAY_MS;
  const pts = (p.weightHistory || [])
    .filter(e => e && /^\d{4}-\d{2}-\d{2}$/.test(e.date) && Number.isFinite(+e.kg))
    .map(e => ({ t: Date.parse(e.date + 'T00:00:00'), kg: +e.kg }))
    .filter(o => o.t >= cutoff).sort((a, b) => a.t - b.t);
  if (pts.length < 2) return { ratePerWeek: null, weeksToTarget: null, onPace: null, idealBand, goal, points: pts.length };
  const n = pts.length, t0 = pts[0].t;
  const xs = pts.map(o => (o.t - t0) / DAY_MS), ys = pts.map(o => o.kg);
  const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0; for (let i = 0; i < n; i++) { num += (xs[i] - mx) * (ys[i] - my); den += (xs[i] - mx) ** 2; }
  const ratePerWeek = +((den ? num / den : 0) * 7).toFixed(2);
  const toGo = TARGET_WEIGHT - p.currentWeight;
  let weeksToTarget = null;
  if (Math.abs(ratePerWeek) > 0.02 && Math.sign(ratePerWeek) === Math.sign(toGo)) weeksToTarget = Math.max(1, Math.round(Math.abs(toGo) / Math.abs(ratePerWeek)));
  let onPace = 'on';
  if (ratePerWeek < idealBand[0]) onPace = goal === 'cut' ? 'fast' : 'slow';
  else if (ratePerWeek > idealBand[1]) onPace = goal === 'cut' ? 'slow' : 'fast';
  return { ratePerWeek, weeksToTarget, onPace, idealBand, goal, points: n };
}

// Auto-calibrate calories to the real weight trend.
export function adaptiveCalories(p, m = macros(p), now = Date.now()) {
  const wt = weightTrend(p, now);
  if (wt.ratePerWeek == null) return { ...wt, suggestion: 0, kcalAdjusted: m.kcal, note: 'Log 2+ weigh-ins over a couple of weeks and I’ll auto-calibrate your calories to your real rate.' };
  const [lo, hi] = wt.idealBand, rate = wt.ratePerWeek, goal = wt.goal;
  let delta = 0, note = '';
  if (rate > hi) { delta = -200; note = goal === 'cut' ? `Losing only ${rate} kg/wk — trim ~200 kcal to keep the cut moving.` : `Gaining ${rate} kg/wk — faster than the lean range; trim ~200 kcal to stay lean.`; }
  else if (rate < lo) { delta = +220; note = goal === 'cut' ? `Dropping ${Math.abs(rate)} kg/wk — too fast; add ~220 kcal to protect muscle.` : `Only ${rate} kg/wk — add ~220 kcal to keep building.`; }
  else { note = `On pace at ${rate} kg/wk — hold calories here.`; }
  const floor = Math.max(Math.round((m.maintenance || 1800) * 0.75), p.sex === 'female' ? 1200 : 1500);
  return { ...wt, suggestion: delta, kcalAdjusted: Math.max(floor, m.kcal + delta), note };
}

// Synthesize the 1–3 things that matter most today across every signal.
function dailyFocus(p, x, now) {
  const items = [];
  if (x.readiness && x.readiness.band === 'low') items.push({ icon: '🌙', sev: 'warn', text: 'Under-recovered today — keep it light: full breathwork, an easy zone-2 walk, lighter sets. You grow in recovery, not in the grind.' });
  if (x.load && x.load.band === 'high') items.push({ icon: '⚠️', sev: 'warn', text: x.load.flag });
  else if (x.load && x.load.band === 'low') items.push({ icon: '📉', sev: 'info', text: x.load.flag });
  if (x.adaptiveCal && x.adaptiveCal.suggestion) items.push({ icon: '🍽️', sev: 'info', text: x.adaptiveCal.note });
  if (x.aesthetic && x.aesthetic.hasData && x.aesthetic.weakestLabel) items.push({ icon: '◎', sev: 'info', text: `Lagging group: ${x.aesthetic.weakestLabel}. ${x.aesthetic.nudge}` });
  if (x.deload && x.deload.suggested && !x.deload.active) items.push({ icon: '↺', sev: 'info', text: `${x.deload.weeks} training weeks in — a deload week is due. Take it to recover and supercompensate.` });
  const log = wlog(p);
  let sessions7 = 0; for (let i = 0; i < 7; i++) { const d = log[isoFromMs(now - i * DAY_MS)]; if (d && Object.keys(d).length) sessions7++; }
  const dial = SPEED_DIAL[resolveMode(p)];
  if (!Object.keys(log).length) items.push({ icon: '▲', sev: 'info', text: 'Log your first session — every set teaches the engine and starts your auto-progression.' });
  else if (sessions7 < Math.max(2, dial.trainingDays - 2)) items.push({ icon: '📅', sev: 'info', text: `Only ${sessions7} session${sessions7 === 1 ? '' : 's'} in the last 7 days — consistency is the multiplier. Aim for ${dial.trainingDays}.` });
  if (!items.some(i => i.sev === 'warn') && items.length < 2) items.push({ icon: '✓', sev: 'good', text: 'Recovered, balanced and on pace — train as planned and push the top of your rep ranges today.' });
  const order = { warn: 0, info: 1, good: 2 };
  items.sort((a, b) => order[a.sev] - order[b.sev]);
  return items.slice(0, 3);
}

/* ============================================================================
   §15  AGGREGATOR — one call returns everything the UI needs
   ========================================================================== */
export function computePlan(profile, exDb = {}, now = Date.now()) {
  const p = { ...DEFAULT_PROFILE, ...profile };
  const effMode = resolveMode(p);
  const m = macros(p, effMode);
  const cigsAvoided = Math.round(p.streakDays * p.smoking.baselineCigsPerDay);
  const moneySaved = Math.round(cigsAvoided * p.smoking.costPerCig);
  const weightToGo = +(TARGET_WEIGHT - p.currentWeight).toFixed(1);
  const weeksToTarget = weightToGo > 0 ? Math.ceil(weightToGo / 0.35) : 0;
  const tl = trainingLevel(p);
  // intelligence layer (assemble once, share across the plan + the coach)
  const aesthetic = aestheticBalance(p, exDb, now);
  const readiness = computeReadiness(p, now);
  const load = trainingLoad(p, now);
  const bodyComp = bodyComposition(p);
  const wTrend = weightTrend(p, now);
  const adaptiveCal = adaptiveCalories(p, m, now);
  const deload = deloadState(p);
  const grad = graduation(p);
  const coach = dailyFocus(p, { readiness, load, aesthetic, adaptiveCal, deload, training: tl }, now);
  const etaWeeks = wTrend.weeksToTarget != null ? wTrend.weeksToTarget : weeksToTarget;
  return {
    profile: p,
    effectiveMode: effMode,
    recommendedMode: recommendedMode(p),
    modeIsAuto: !(p.mode && SPEED_DIAL[p.mode]),
    allowed: 'relentless',                       // dial is fully unlocked (no streak gate)
    bmr: Math.round(bmr(p)),
    macros: m,
    recovery: recoveryPct(p.streakDays),
    week: generateWeek(p, now, aesthetic.weakest),   // weak-point auto-targeting
    split: { style: resolveSplit(p), recommended: recommendSplit(SPEED_DIAL[effMode].trainingDays), styles: SPLITS },
    lung: generateLungWeek(p),
    diet: generateDietDay(p, m),
    level: tl.stage,                             // TRAINING level (performance-based)
    training: tl,
    graduation: grad,                            // time/readiness phase → retires easy moves + adds skills
    deload,                                      // recovery-week state
    aesthetic, bodyComp, load, coach,
    weightTrend: wTrend, adaptiveCal,
    milestones: { next: nextMilestone(p), achieved: achievedMilestones(p), all: MILESTONES },
    readiness,
    stats: { cigsAvoided, moneySaved, weightToGo, weeksToTarget, etaWeeks, etaFromTrend: wTrend.weeksToTarget != null },
  };
}
