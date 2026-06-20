/* ============================================================================
   ODYSSEY — CALIBRATION  ·  onboarding + full edit-profile flow
   Self-contained, dependency-free overlay. Injects its own scoped DOM + <style>
   that REUSE the global design tokens (no new colors/fonts/structure).

   PUBLIC API
   ----------
   import { openCalibration } from './onboard.js';
   openCalibration(profile, { firstRun = false, onSave });
     · profile  — the live profile object (read-only here; we spread a copy)
     · firstRun — true shows a warm welcome intro + soft safety note
     · onSave(updated) — called with a NEW profile object on finish.
                         cleanDates / weightHistory / streakDays / weeksElapsed
                         are preserved verbatim from the original.
   On cancel / Escape: closes and calls nothing.

   Uses window.gsap for panel transitions when present; otherwise a CSS fallback.
   Honors prefers-reduced-motion. Buttons carry `.magnetic` so the global cursor
   reacts; a tiny internal magnetic binder runs so the overlay is self-sufficient.
   ========================================================================== */

const NS = 'odyc';                 // class/id namespace
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---- option vocab (mirrors engine.js, in plain words) ------------------- */
const PACES = [
  { mode: 'gentle',     label: 'Gentle',     desc: 'Ease in — lower volume, longer rest. Best while lungs still clear.' },
  { mode: 'balanced',   label: 'Balanced',   desc: 'The steady middle — five training days, full volume.' },
  { mode: 'relentless', label: 'Relentless', desc: 'Push hard — six days, higher volume. Unlocks as your streak grows.' },
];
const ACTIVITIES = [
  { key: 'sedentary', label: 'Sedentary',     desc: 'Desk-bound, little movement most days.' },
  { key: 'light',     label: 'Lightly active', desc: 'Light exercise 1–3 days a week.' },
  { key: 'moderate',  label: 'Moderately active', desc: 'Moderate exercise 3–5 days a week.' },
  { key: 'very',      label: 'Very active',    desc: 'Hard exercise 6–7 days a week.' },
  { key: 'extra',     label: 'Extra active',   desc: 'Athlete-level — twice-daily or physical job.' },
];
const SYMPTOMS = [
  { key: 'cough',       label: 'Cough' },
  { key: 'breathless',  label: 'Breathless on effort' },
  { key: 'chest-tightness', label: 'Chest tightness' },
  { key: 'none',        label: 'None of these' },
];
const RANGES = { age: [14, 90], heightCm: [120, 220], currentWeight: [35, 160], cigs: [0, 60] };

/* ---- tiny helpers ------------------------------------------------------- */
const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
const clampNum = (v, [lo, hi]) => Math.min(hi, Math.max(lo, v));
const isNum = (v) => v !== '' && v != null && !Number.isNaN(+v);

/* ========================================================================== */
export function openCalibration(profile, { firstRun = false, onSave } = {}) {
  injectStyle();

  /* draft = a working copy; we only mutate the draft, never the live object */
  const src = profile || {};
  const draft = {
    name: src.name ?? '',
    sex: src.sex ?? 'male',
    age: src.age ?? 22,
    heightCm: src.heightCm ?? 175,
    currentWeight: src.currentWeight ?? 70,
    mode: src.mode ?? 'gentle',
    activity: src.activity ?? 'moderate',
    diet: {
      vegan: !!(src.diet && src.diet.vegan),
      allowEgg: !!(src.diet && src.diet.allowEgg),
    },
    equipment: {
      bar: !!(src.equipment && src.equipment.bar),
      bands: !!(src.equipment && src.equipment.bands),
      weights: !!(src.equipment && src.equipment.weights),
    },
    smoking: {
      approach: (src.smoking && src.smoking.approach) || 'reduce',
      baselineCigsPerDay: src.smoking?.baselineCigsPerDay ?? 10,
      costPerCig: src.smoking?.costPerCig ?? 17,
    },
    symptoms: Array.isArray(src.symptoms) ? src.symptoms.slice() : [],
  };

  /* ---- build the step list -------------------------------------------- */
  const steps = [];
  if (firstRun) steps.push(stepWelcome);
  steps.push(stepBasics, stepBody, stepPace, stepActivity, stepDiet, stepEquipment, stepSmoking, stepSymptoms, stepReview);

  let idx = 0;

  /* ---- scaffold -------------------------------------------------------- */
  const scrim = el('div', `${NS}-scrim`);
  scrim.setAttribute('role', 'dialog');
  scrim.setAttribute('aria-modal', 'true');
  scrim.setAttribute('aria-label', firstRun ? 'Calibrate your odyssey' : 'Edit profile');
  scrim.innerHTML = `
    <div class="${NS}-sheet">
      <header class="${NS}-head">
        <div>
          <p class="${NS}-eyebrow">${firstRun ? 'Welcome · calibration' : 'Edit profile · recalibrate'}</p>
          <h2 class="${NS}-title display" id="${NS}-title"></h2>
        </div>
        <button class="${NS}-x magnetic" id="${NS}-cancel" aria-label="Close">&times;</button>
      </header>
      <div class="${NS}-progress" id="${NS}-progress" aria-hidden="true"></div>
      <p class="${NS}-stepcount mono" id="${NS}-stepcount"></p>
      <div class="${NS}-body" id="${NS}-body"></div>
      <p class="${NS}-err" id="${NS}-err" role="alert"></p>
      <footer class="${NS}-foot">
        <button class="${NS}-btn ${NS}-ghost magnetic" id="${NS}-back">Back</button>
        <button class="${NS}-btn ${NS}-clay magnetic" id="${NS}-next">Continue <span class="${NS}-arr">→</span></button>
      </footer>
    </div>`;
  document.body.appendChild(scrim);
  document.body.style.overflow = 'hidden';

  const $ = (s) => scrim.querySelector(s);
  const titleEl = $(`#${NS}-title`);
  const bodyEl = $(`#${NS}-body`);
  const progEl = $(`#${NS}-progress`);
  const countEl = $(`#${NS}-stepcount`);
  const errEl = $(`#${NS}-err`);
  const backBtn = $(`#${NS}-back`);
  const nextBtn = $(`#${NS}-next`);

  /* progress dots */
  steps.forEach((_, i) => { const d = el('span', `${NS}-dot`); d.dataset.i = i; progEl.appendChild(d); });

  /* ---- close / finish -------------------------------------------------- */
  function close() {
    document.removeEventListener('keydown', onKey);
    document.body.style.overflow = '';
    let removed = false;
    const done = () => { if (removed) return; removed = true; scrim.remove(); };
    if (window.gsap && !REDUCED) gsap.to(scrim, { autoAlpha: 0, duration: 0.3, onComplete: done });
    else scrim.style.opacity = '0';
    setTimeout(done, REDUCED ? 0 : 360);   // guaranteed removal even if onComplete is missed
  }

  function finish() {
    const updated = {
      ...profile,                                   // preserve everything not edited here
      name: (draft.name || '').trim() || (profile?.name ?? 'Friend'),
      sex: draft.sex,
      age: clampNum(Math.round(+draft.age), RANGES.age),
      heightCm: clampNum(Math.round(+draft.heightCm), RANGES.heightCm),
      currentWeight: clampNum(Math.round(+draft.currentWeight * 10) / 10, RANGES.currentWeight),
      mode: draft.mode,
      activity: draft.activity,
      diet: { ...(profile?.diet || {}), vegan: draft.diet.vegan, allowEgg: draft.diet.vegan ? false : draft.diet.allowEgg },
      equipment: { ...(profile?.equipment || {}), bar: draft.equipment.bar, bands: draft.equipment.bands, weights: draft.equipment.weights },
      smoking: {
        ...(profile?.smoking || {}),
        approach: draft.smoking.approach,
        baselineCigsPerDay: clampNum(Math.round(+draft.smoking.baselineCigsPerDay), RANGES.cigs),
        costPerCig: Math.max(0, Math.round(+draft.smoking.costPerCig)),
      },
      symptoms: draft.symptoms.slice(),
      // explicitly preserved dated history / progress:
      streakDays: profile?.streakDays ?? 0,
      weeksElapsed: profile?.weeksElapsed ?? 0,
      cleanDates: (profile?.cleanDates || []).slice(),
      weightHistory: (profile?.weightHistory || []).slice(),
    };
    close();
    if (typeof onSave === 'function') onSave(updated);
  }

  /* ---- navigation ------------------------------------------------------ */
  function go(to, dir) {
    const valid = validate(steps[idx]);
    if (dir > 0 && !valid) return;           // block forward on invalid
    errEl.textContent = '';
    idx = to;
    render(dir);
  }

  function render(dir = 1) {
    const step = steps[idx];
    titleEl.textContent = step.title;
    countEl.textContent = `Step ${idx + 1} / ${steps.length}`;
    backBtn.style.visibility = idx === 0 ? 'hidden' : 'visible';
    nextBtn.innerHTML = idx === steps.length - 1
      ? `${firstRun ? 'Begin the odyssey' : 'Save changes'} <span class="${NS}-arr">→</span>`
      : `Continue <span class="${NS}-arr">→</span>`;

    scrim.querySelectorAll(`.${NS}-dot`).forEach((d, i) => {
      d.classList.toggle('done', i < idx);
      d.classList.toggle('on', i === idx);
    });

    bodyEl.innerHTML = '';
    const panel = el('div', `${NS}-panel`);
    step.render(panel);
    bodyEl.appendChild(panel);
    bindMagnetic(panel);
    errEl.textContent = '';

    /* animate the panel in */
    if (window.gsap && !REDUCED) {
      gsap.fromTo(panel, { autoAlpha: 0, x: dir >= 0 ? 26 : -26 }, { autoAlpha: 1, x: 0, duration: 0.42, ease: 'power3.out' });
    }
    /* focus the first field for keyboard users */
    const first = panel.querySelector('input, select, button, [tabindex]');
    if (first && !REDUCED) setTimeout(() => first.focus({ preventScroll: true }), 60);
  }

  function validate(step) {
    if (!step.validate) return true;
    const msg = step.validate();
    errEl.textContent = msg || '';
    return !msg;
  }

  /* ---- keyboard -------------------------------------------------------- */
  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'Enter' && !e.shiftKey) {
      const t = e.target;
      if (t && (t.tagName === 'TEXTAREA')) return;
      e.preventDefault();
      nextBtn.click();
    }
  }
  document.addEventListener('keydown', onKey);

  backBtn.onclick = () => { if (idx > 0) go(idx - 1, -1); };
  nextBtn.onclick = () => { if (!validate(steps[idx])) return; idx === steps.length - 1 ? finish() : go(idx + 1, 1); };
  $(`#${NS}-cancel`).onclick = close;
  scrim.addEventListener('mousedown', (e) => { if (e.target === scrim) close(); });

  /* entrance + first render are kicked off at the END of openCalibration,
     AFTER every step's `.render` is assigned below (hoisting: the step
     functions exist early, but `.render` is attached by the statements
     in the step-definitions block, which must run before render()). */

  /* ======================================================================
     STEP DEFINITIONS
     ====================================================================== */

  function stepWelcome(p) {}
  stepWelcome.title = 'Breathe. Build. Become.';
  stepWelcome.render = (p) => {
    p.appendChild(el('p', `${NS}-lead`,
      `This is your odyssey — a living protocol that heals your lungs, rebuilds your body toward a lean 75&nbsp;kg, and turns every smoke-free day into measurable progress. A few quick questions and we'll calibrate everything to <em>you</em>.`));
    const note = el('div', `${NS}-safety`);
    note.innerHTML = `<span class="${NS}-safety-ic">⚕</span><div><strong>Wellness &amp; education — not medical advice.</strong> Get a baseline check (spirometry, SpO₂, BP) before ramping intensity. Stop on chest pain, dizziness, or coughing blood. Forceful breathwork stays locked until your lungs earn it.</div>`;
    p.appendChild(note);
  };

  function stepBasics(p) {}
  stepBasics.title = 'The basics';
  stepBasics.render = (p) => {
    p.appendChild(fieldText('What should we call you?', 'name', draft.name, { placeholder: 'Your name', autocomplete: 'given-name' }));
    p.appendChild(segment('Sex (for metabolic math)', [
      { v: 'male', label: 'Male' }, { v: 'female', label: 'Female' },
    ], draft.sex, (v) => draft.sex = v));
    p.appendChild(fieldNum('Age', 'age', draft.age, RANGES.age, 'years'));
  };
  stepBasics.validate = () => {
    if (!String(draft.name).trim()) return 'Please enter a name so we can greet you.';
    if (!isNum(draft.age) || +draft.age < RANGES.age[0] || +draft.age > RANGES.age[1]) return `Age must be between ${RANGES.age[0]} and ${RANGES.age[1]}.`;
    return '';
  };

  function stepBody(p) {}
  stepBody.title = 'Your body, today';
  stepBody.render = (p) => {
    p.appendChild(el('p', `${NS}-hint`, 'These drive your calorie and macro targets — and the engine re-runs them every time your weight changes.'));
    p.appendChild(fieldNum('Height', 'heightCm', draft.heightCm, RANGES.heightCm, 'cm'));
    p.appendChild(fieldNum('Current weight', 'currentWeight', draft.currentWeight, RANGES.currentWeight, 'kg', { step: '0.1' }));
  };
  stepBody.validate = () => {
    if (!isNum(draft.heightCm) || +draft.heightCm < RANGES.heightCm[0] || +draft.heightCm > RANGES.heightCm[1]) return `Height must be between ${RANGES.heightCm[0]} and ${RANGES.heightCm[1]} cm.`;
    if (!isNum(draft.currentWeight) || +draft.currentWeight < RANGES.currentWeight[0] || +draft.currentWeight > RANGES.currentWeight[1]) return `Weight must be between ${RANGES.currentWeight[0]} and ${RANGES.currentWeight[1]} kg.`;
    return '';
  };

  function stepPace(p) {}
  stepPace.title = 'Choose your pace';
  stepPace.render = (p) => {
    p.appendChild(el('p', `${NS}-hint`, 'The speed dial paces everything. You can change it anytime — and higher paces unlock as your streak grows.'));
    p.appendChild(cardChoices(PACES.map(x => ({ v: x.mode, label: x.label, desc: x.desc })), draft.mode, (v) => draft.mode = v, 'clay'));
  };

  function stepActivity(p) {}
  stepActivity.title = 'How active are you?';
  stepActivity.render = (p) => {
    p.appendChild(cardChoices(ACTIVITIES.map(x => ({ v: x.key, label: x.label, desc: x.desc })), draft.activity, (v) => draft.activity = v, 'sky'));
  };

  function stepDiet(p) {}
  stepDiet.title = 'Fuel preferences';
  stepDiet.render = (p) => {
    p.appendChild(el('p', `${NS}-hint`, 'Odyssey is pure-vegetarian by design. Tune it to your kitchen.'));
    const eggToggle = toggle('Eggs are okay', 'Include eggs in the plan', draft.diet.allowEgg, (on) => { draft.diet.allowEgg = on; }, 'sage');
    const veganToggle = toggle('Fully vegan', 'No dairy or eggs at all', draft.diet.vegan, (on) => {
      draft.diet.vegan = on;
      if (on) { draft.diet.allowEgg = false; setToggle(eggToggle, false); }
      setToggleDisabled(eggToggle, on);
    }, 'sage');
    p.appendChild(veganToggle);
    p.appendChild(eggToggle);
    setToggleDisabled(eggToggle, draft.diet.vegan);
  };

  function stepEquipment(p) {}
  stepEquipment.title = 'What can you train with?';
  stepEquipment.render = (p) => {
    p.appendChild(el('p', `${NS}-hint`, 'Floor work is always on. Toggle what you have — the engine unlocks new progressions to match.'));
    const floor = toggle('Floor', 'Always available', true, () => {}, 'clay');
    setToggleDisabled(floor, true); floor.classList.add(`${NS}-locked`);
    p.appendChild(floor);
    p.appendChild(toggle('Pull-up bar', 'Doorway or fixed bar', draft.equipment.bar, (on) => draft.equipment.bar = on, 'clay'));
    p.appendChild(toggle('Resistance bands', 'Loop or tube bands', draft.equipment.bands, (on) => draft.equipment.bands = on, 'clay'));
    p.appendChild(toggle('Dumbbells', 'Any free weights', draft.equipment.weights, (on) => draft.equipment.weights = on, 'clay'));
  };

  function stepSmoking(p) {}
  stepSmoking.title = 'Your relationship with smoke';
  stepSmoking.render = (p) => {
    p.appendChild(segment('Approach', [
      { v: 'reduce', label: 'Reduce' }, { v: 'quit', label: 'Quit' },
    ], draft.smoking.approach, (v) => draft.smoking.approach = v));
    p.appendChild(el('p', `${NS}-hint`, 'Your baseline lets us count cigarettes avoided and money saved as your streak grows.'));
    p.appendChild(fieldNum('Cigarettes per day (baseline)', 'cigs', draft.smoking.baselineCigsPerDay, RANGES.cigs, 'cigs/day'));
    p.appendChild(fieldNum('Cost per cigarette', 'cost', draft.smoking.costPerCig, [0, 999], '₹ each', { min: '0' }));
  };
  stepSmoking.validate = () => {
    if (!isNum(draft.smoking.baselineCigsPerDay) || +draft.smoking.baselineCigsPerDay < RANGES.cigs[0] || +draft.smoking.baselineCigsPerDay > RANGES.cigs[1])
      return `Cigarettes per day must be between ${RANGES.cigs[0]} and ${RANGES.cigs[1]}.`;
    if (!isNum(draft.smoking.costPerCig) || +draft.smoking.costPerCig < 0) return 'Cost per cigarette must be 0 or more.';
    return '';
  };

  function stepSymptoms(p) {}
  stepSymptoms.title = 'Any of these lately?';
  stepSymptoms.render = (p) => {
    p.appendChild(el('p', `${NS}-hint`, 'This helps Odyssey keep your ramp safe. Pick any that apply.'));
    const wrap = el('div', `${NS}-chips`);
    SYMPTOMS.forEach(sm => {
      const active = sm.key === 'none' ? draft.symptoms.length === 0 : draft.symptoms.includes(sm.key);
      const chip = el('button', `${NS}-chip magnetic${active ? ' on' : ''}`, sm.label);
      chip.type = 'button';
      chip.setAttribute('aria-pressed', String(active));
      chip.onclick = () => {
        if (sm.key === 'none') {
          draft.symptoms = [];
        } else {
          const i = draft.symptoms.indexOf(sm.key);
          if (i >= 0) draft.symptoms.splice(i, 1); else draft.symptoms.push(sm.key);
        }
        // re-render chips to reflect the exclusive "none"
        wrap.querySelectorAll(`.${NS}-chip`).forEach((c, n) => {
          const k = SYMPTOMS[n].key;
          const a = k === 'none' ? draft.symptoms.length === 0 : draft.symptoms.includes(k);
          c.classList.toggle('on', a);
          c.setAttribute('aria-pressed', String(a));
        });
      };
      wrap.appendChild(chip);
    });
    p.appendChild(wrap);
  };

  function stepReview(p) {}
  stepReview.title = firstRun ? 'Ready to begin' : 'Review your changes';
  stepReview.render = (p) => {
    const dietWord = draft.diet.vegan ? 'Vegan' : (draft.diet.allowEgg ? 'Vegetarian + eggs' : 'Vegetarian, eggless');
    const eq = ['Floor', draft.equipment.bar && 'Pull-up bar', draft.equipment.bands && 'Bands', draft.equipment.weights && 'Dumbbells'].filter(Boolean).join(' · ');
    const sym = draft.symptoms.length
      ? draft.symptoms.map(k => (SYMPTOMS.find(s => s.key === k) || { label: k }).label).join(', ')
      : 'None reported';
    const rows = [
      ['Name', draft.name],
      ['Sex · age', `${draft.sex === 'male' ? 'Male' : 'Female'} · ${draft.age}`],
      ['Height · weight', `${draft.heightCm} cm · ${draft.currentWeight} kg`],
      ['Pace', (PACES.find(x => x.mode === draft.mode) || {}).label],
      ['Activity', (ACTIVITIES.find(x => x.key === draft.activity) || {}).label],
      ['Diet', dietWord],
      ['Equipment', eq],
      ['Smoking', `${draft.smoking.approach === 'quit' ? 'Quit' : 'Reduce'} · ${draft.smoking.baselineCigsPerDay}/day · ₹${draft.smoking.costPerCig} each`],
      ['Symptoms', sym],
    ];
    const tbl = el('div', `${NS}-review`);
    rows.forEach(([k, v]) => {
      const r = el('div', `${NS}-review-row`);
      r.innerHTML = `<span class="${NS}-review-k mono">${k}</span><span class="${NS}-review-v">${v || '—'}</span>`;
      tbl.appendChild(r);
    });
    p.appendChild(tbl);
    p.appendChild(el('p', `${NS}-hint`, firstRun
      ? 'Your streak, weight history and clean days are kept safe. You can edit any of this later from your profile.'
      : 'Your streak, clean-day history and weight log are preserved. Saving recomputes your plan.'));
  };

  /* ======================================================================
     FIELD FACTORIES (scoped, token-styled)
     ====================================================================== */
  function fieldText(label, key, value, opts = {}) {
    const wrap = el('label', `${NS}-field`);
    wrap.innerHTML = `<span class="${NS}-label">${label}</span>`;
    const input = el('input', `${NS}-input`);
    input.type = 'text';
    input.value = value ?? '';
    if (opts.placeholder) input.placeholder = opts.placeholder;
    if (opts.autocomplete) input.autocomplete = opts.autocomplete;
    input.oninput = () => { draft[key] = input.value; };
    wrap.appendChild(input);
    return wrap;
  }

  function fieldNum(label, key, value, [lo, hi], unit, attrs = {}) {
    const wrap = el('label', `${NS}-field`);
    wrap.innerHTML = `<span class="${NS}-label">${label}</span>`;
    const box = el('div', `${NS}-numbox`);
    const input = el('input', `${NS}-input ${NS}-num`);
    input.type = 'number';
    input.inputMode = 'decimal';
    input.value = value;
    input.min = attrs.min ?? lo; input.max = attrs.max ?? hi;
    if (attrs.step) input.step = attrs.step;
    input.setAttribute('aria-label', `${label} in ${unit}`);
    const target = (k) => k === 'cigs' ? (v) => draft.smoking.baselineCigsPerDay = v
      : k === 'cost' ? (v) => draft.smoking.costPerCig = v
      : (v) => draft[k] = v;
    const set = target(key);
    input.oninput = () => { set(input.value === '' ? '' : +input.value); };
    input.onblur = () => {
      if (input.value === '') return;
      const c = clampNum(+input.value, [lo, hi]);
      input.value = c; set(c);
    };
    box.appendChild(input);
    box.appendChild(el('span', `${NS}-unit mono`, unit));
    wrap.appendChild(box);
    return wrap;
  }

  /* two-up segmented control */
  function segment(label, options, current, onPick) {
    const wrap = el('div', `${NS}-field`);
    if (label) wrap.appendChild(el('span', `${NS}-label`, label));
    const seg = el('div', `${NS}-seg`);
    options.forEach(o => {
      const b = el('button', `${NS}-seg-btn magnetic${o.v === current ? ' on' : ''}`, o.label);
      b.type = 'button';
      b.onclick = () => { onPick(o.v); seg.querySelectorAll(`.${NS}-seg-btn`).forEach(x => x.classList.remove('on')); b.classList.add('on'); };
      seg.appendChild(b);
    });
    wrap.appendChild(seg);
    return wrap;
  }

  /* radio-style stacked choice cards (single select) */
  function cardChoices(options, current, onPick, accent = 'clay') {
    const wrap = el('div', `${NS}-choices`);
    options.forEach(o => {
      const c = el('button', `${NS}-choice magnetic${o.v === current ? ' on' : ''}`);
      c.type = 'button';
      c.dataset.accent = accent;
      c.innerHTML = `<span class="${NS}-choice-dot"></span><span class="${NS}-choice-txt"><strong>${o.label}</strong>${o.desc ? `<span class="${NS}-choice-desc">${o.desc}</span>` : ''}</span>`;
      c.onclick = () => { onPick(o.v); wrap.querySelectorAll(`.${NS}-choice`).forEach(x => x.classList.remove('on')); c.classList.add('on'); };
      wrap.appendChild(c);
    });
    return wrap;
  }

  /* on/off pill row */
  function toggle(label, sub, on, onChange, accent = 'clay') {
    const row = el('div', `${NS}-toggle magnetic${on ? ' on' : ''}`);
    row.dataset.accent = accent;
    row.setAttribute('role', 'switch');
    row.setAttribute('aria-checked', String(on));
    row.tabIndex = 0;
    row.innerHTML = `<span class="${NS}-toggle-txt"><strong>${label}</strong>${sub ? `<span class="${NS}-toggle-sub">${sub}</span>` : ''}</span><span class="${NS}-switch"><i></i></span>`;
    const flip = () => {
      if (row.dataset.disabled === '1') return;
      const nv = !row.classList.contains('on');
      row.classList.toggle('on', nv);
      row.setAttribute('aria-checked', String(nv));
      onChange(nv);
    };
    row.onclick = flip;
    row.onkeydown = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); } };
    return row;
  }
  function setToggle(row, on) { row.classList.toggle('on', on); row.setAttribute('aria-checked', String(on)); }
  function setToggleDisabled(row, disabled) {
    row.dataset.disabled = disabled ? '1' : '0';
    row.classList.toggle(`${NS}-dim`, disabled);
    row.setAttribute('aria-disabled', String(disabled));
  }

  /* ---- kick off (now that every step.render above is assigned) --------- */
  if (window.gsap && !REDUCED) gsap.fromTo(scrim, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.32 });
  else { scrim.style.opacity = '0'; requestAnimationFrame(() => { scrim.style.transition = 'opacity .3s'; scrim.style.opacity = '1'; }); }
  render(1);
  bindMagnetic(scrim);
}

/* ============================================================================
   Internal magnetic binder (self-contained; mirrors motion.js feel)
   ========================================================================== */
function bindMagnetic(root) {
  if (REDUCED || matchMedia('(hover: none)').matches) return;
  root.querySelectorAll('.magnetic').forEach((node) => {
    if (node.dataset.mag === '1') return;
    node.dataset.mag = '1';
    const strength = 0.28;
    node.addEventListener('mousemove', (e) => {
      const r = node.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) * strength;
      const y = (e.clientY - (r.top + r.height / 2)) * strength;
      node.style.transform = `translate(${x}px, ${y}px)`;
    });
    node.addEventListener('mouseleave', () => { node.style.transform = ''; });
  });
}

/* ============================================================================
   Scoped <style> — REUSES the global tokens (no new colors / fonts)
   ========================================================================== */
function injectStyle() {
  if (document.getElementById(`${NS}-style`)) return;
  const s = document.createElement('style');
  s.id = `${NS}-style`;
  s.textContent = `
  .${NS}-scrim{position:fixed;inset:0;z-index:9500;display:grid;place-items:center;padding:20px;
    background:radial-gradient(120% 90% at 70% 0%,var(--clay-mist),transparent 55%),
               radial-gradient(90% 80% at 15% 100%,var(--sky-mist),transparent 50%),
               color-mix(in srgb,var(--cream) 88%, rgba(26,25,22,.4));
    backdrop-filter:blur(10px);overflow-y:auto;}
  .${NS}-sheet{width:100%;max-width:560px;background:var(--paper);border:1px solid var(--haze);
    border-radius:var(--r-lg);box-shadow:var(--e3);padding:clamp(22px,4vw,38px);
    display:flex;flex-direction:column;gap:18px;max-height:calc(100svh - 40px);overflow:hidden;}
  .${NS}-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;}
  .${NS}-eyebrow{font-family:var(--font-mono);font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-faint);font-weight:500;}
  .${NS}-title{font-family:var(--font-display);font-weight:400;font-size:clamp(1.5rem,4.4vw,2.2rem);line-height:1.02;letter-spacing:-.02em;color:var(--ink);margin-top:6px;}
  .${NS}-x{width:38px;height:38px;flex:none;border-radius:50%;border:1.5px solid var(--haze);color:var(--ink-soft);
    font-size:1.5rem;line-height:1;display:grid;place-content:center;transition:all var(--fast,.2s) var(--ease);}
  .${NS}-x:hover{border-color:var(--clay);color:var(--clay);}

  .${NS}-progress{display:flex;gap:7px;}
  .${NS}-dot{flex:1;height:4px;border-radius:999px;background:var(--haze);transition:background var(--base,.45s) var(--ease);}
  .${NS}-dot.done{background:var(--clay);}
  .${NS}-dot.on{background:var(--clay);box-shadow:var(--glow-clay);}
  .${NS}-stepcount{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-faint);margin-top:-8px;}

  .${NS}-body{overflow-y:auto;padding-right:2px;flex:1;min-height:120px;}
  .${NS}-panel{display:flex;flex-direction:column;gap:18px;}
  .${NS}-lead{font-family:var(--font-body);font-size:clamp(1.02rem,2.2vw,1.22rem);color:var(--ink-soft);line-height:1.55;}
  .${NS}-lead em,.${NS}-hint em{font-family:var(--font-display);font-style:italic;color:var(--clay);}
  .${NS}-hint{font-size:.92rem;color:var(--ink-faint);line-height:1.5;}

  .${NS}-safety{display:flex;gap:12px;align-items:flex-start;padding:16px 18px;border-radius:var(--r-md);
    background:var(--clay-mist);border:1px solid var(--clay-soft);font-size:.88rem;color:var(--ink-soft);line-height:1.5;}
  .${NS}-safety strong{color:var(--ink);}
  .${NS}-safety-ic{font-size:1.2rem;line-height:1;}

  .${NS}-field{display:flex;flex-direction:column;gap:9px;}
  .${NS}-label{font-family:var(--font-mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-faint);}
  .${NS}-input{width:100%;padding:13px 16px;border:1.5px solid var(--haze);border-radius:var(--r-sm);
    font:inherit;color:var(--ink);background:var(--cream);transition:border-color var(--fast,.2s) var(--ease),box-shadow var(--fast,.2s) var(--ease);}
  .${NS}-input:focus{outline:none;border-color:var(--clay);box-shadow:0 0 0 4px var(--clay-mist);}
  .${NS}-numbox{display:flex;align-items:center;gap:10px;}
  .${NS}-num{max-width:160px;}
  .${NS}-unit{font-size:.82rem;color:var(--ink-faint);}

  .${NS}-seg{display:flex;gap:6px;padding:6px;background:var(--sand);border-radius:var(--r-chip);width:fit-content;}
  .${NS}-seg-btn{padding:10px 22px;border-radius:var(--r-chip);font-size:.9rem;color:var(--ink-soft);position:relative;
    transition:color var(--fast,.2s) var(--ease);will-change:transform;}
  .${NS}-seg-btn.on{color:#fff;}
  .${NS}-seg-btn.on::before{content:'';position:absolute;inset:0;border-radius:var(--r-chip);background:var(--clay);z-index:-1;box-shadow:var(--glow-clay);}

  .${NS}-choices{display:flex;flex-direction:column;gap:10px;}
  .${NS}-choice{display:flex;align-items:flex-start;gap:14px;text-align:left;padding:16px 18px;border-radius:var(--r-md);
    background:var(--paper);border:1.5px solid var(--haze);transition:border-color var(--fast,.2s) var(--ease),background var(--fast,.2s) var(--ease),box-shadow var(--base,.45s) var(--ease);will-change:transform;}
  .${NS}-choice:hover{border-color:var(--clay);box-shadow:var(--e2);}
  .${NS}-choice-dot{width:20px;height:20px;flex:none;margin-top:2px;border-radius:50%;border:2px solid var(--haze);position:relative;transition:all var(--fast,.2s) var(--ease);}
  .${NS}-choice-txt{display:flex;flex-direction:column;gap:3px;}
  .${NS}-choice-txt strong{font-weight:500;color:var(--ink);}
  .${NS}-choice-desc{font-size:.86rem;color:var(--ink-soft);line-height:1.45;}
  .${NS}-choice.on{border-color:var(--clay);background:var(--clay-mist);}
  .${NS}-choice.on .${NS}-choice-dot{border-color:var(--clay);background:var(--clay);box-shadow:inset 0 0 0 3px var(--paper);}
  .${NS}-choice[data-accent="sky"].on{border-color:var(--sky);background:var(--sky-mist);}
  .${NS}-choice[data-accent="sky"].on .${NS}-choice-dot{border-color:var(--sky);background:var(--sky);}
  .${NS}-choice[data-accent="sky"]:hover{border-color:var(--sky);}
  .${NS}-choice[data-accent="sage"].on{border-color:var(--sage);background:var(--sage-mist);}
  .${NS}-choice[data-accent="sage"].on .${NS}-choice-dot{border-color:var(--sage);background:var(--sage);}

  .${NS}-toggle{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:15px 18px;border-radius:var(--r-md);
    background:var(--paper);border:1.5px solid var(--haze);transition:border-color var(--fast,.2s) var(--ease),background var(--fast,.2s) var(--ease);will-change:transform;}
  .${NS}-toggle:hover{border-color:var(--clay);}
  .${NS}-toggle[data-accent="sky"]:hover{border-color:var(--sky);}
  .${NS}-toggle[data-accent="sage"]:hover{border-color:var(--sage);}
  .${NS}-toggle-txt{display:flex;flex-direction:column;gap:2px;}
  .${NS}-toggle-txt strong{font-weight:500;color:var(--ink);}
  .${NS}-toggle-sub{font-size:.82rem;color:var(--ink-faint);}
  .${NS}-switch{width:46px;height:27px;flex:none;border-radius:999px;background:var(--haze);position:relative;transition:background var(--base,.45s) var(--ease);}
  .${NS}-switch i{position:absolute;top:3px;left:3px;width:21px;height:21px;border-radius:50%;background:var(--paper);box-shadow:var(--e1);transition:transform var(--base,.45s) var(--ease);}
  .${NS}-toggle.on .${NS}-switch{background:var(--clay);}
  .${NS}-toggle.on[data-accent="sky"] .${NS}-switch{background:var(--sky);}
  .${NS}-toggle.on[data-accent="sage"] .${NS}-switch{background:var(--sage);}
  .${NS}-toggle.on .${NS}-switch i{transform:translateX(19px);}
  .${NS}-toggle.on{background:var(--clay-mist);border-color:var(--clay-soft);}
  .${NS}-toggle.on[data-accent="sky"]{background:var(--sky-mist);border-color:var(--sky-soft);}
  .${NS}-toggle.on[data-accent="sage"]{background:var(--sage-mist);border-color:var(--sage-soft);}
  .${NS}-dim{opacity:.5;cursor:not-allowed;}
  .${NS}-locked{cursor:default;}

  .${NS}-chips{display:flex;flex-wrap:wrap;gap:10px;}
  .${NS}-chip{padding:11px 18px;border-radius:var(--r-chip);background:var(--paper);border:1.5px solid var(--haze);
    font-size:.9rem;color:var(--ink-soft);transition:all var(--fast,.2s) var(--ease);will-change:transform;}
  .${NS}-chip:hover{border-color:var(--clay);}
  .${NS}-chip.on{background:var(--clay);border-color:var(--clay);color:#fff;box-shadow:var(--glow-clay);}

  .${NS}-review{display:flex;flex-direction:column;border:1px solid var(--haze);border-radius:var(--r-md);overflow:hidden;background:var(--cream);}
  .${NS}-review-row{display:flex;justify-content:space-between;gap:16px;padding:13px 16px;border-bottom:1px solid var(--haze);}
  .${NS}-review-row:last-child{border-bottom:none;}
  .${NS}-review-k{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-faint);flex:none;padding-top:2px;}
  .${NS}-review-v{text-align:right;color:var(--ink);font-size:.96rem;}

  .${NS}-err{min-height:1.1em;font-size:.86rem;color:var(--clay-deep);font-weight:500;margin-top:-4px;}

  .${NS}-foot{display:flex;justify-content:space-between;gap:12px;align-items:center;}
  .${NS}-btn{display:inline-flex;align-items:center;gap:10px;padding:14px 26px;border-radius:var(--r-chip);
    font-weight:500;font-size:.96rem;transition:transform var(--fast,.2s) var(--ease),box-shadow var(--base,.45s) var(--ease);will-change:transform;}
  .${NS}-clay{background:var(--clay);color:#fff;box-shadow:var(--glow-clay);}
  .${NS}-clay:hover{box-shadow:var(--e3);}
  .${NS}-ghost{background:transparent;color:var(--ink);border:1.5px solid var(--haze);}
  .${NS}-ghost:hover{border-color:var(--clay);}
  .${NS}-arr{transition:transform var(--base,.45s) var(--ease);}
  .${NS}-btn:hover .${NS}-arr{transform:translateX(4px);}

  @media (max-width:560px){
    .${NS}-sheet{max-height:calc(100svh - 24px);padding:20px;}
    .${NS}-foot{flex-direction:row;}
    .${NS}-btn{padding:13px 20px;font-size:.9rem;}
  }
  @media (prefers-reduced-motion:reduce){
    .${NS}-dot,.${NS}-switch,.${NS}-switch i,.${NS}-arr,.${NS}-choice,.${NS}-toggle{transition-duration:.01ms !important;}
    .${NS}-scrim{backdrop-filter:none;}
  }`;
  document.head.appendChild(s);
}
