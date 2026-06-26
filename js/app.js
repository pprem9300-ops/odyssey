/* ============================================================================
   ODYSSEY — APP  ·  state · routing · render · persistence · interactions
   ========================================================================== */
import * as E from './engine.js?v=7';
import * as M from './motion.js?v=10';
import * as Cloud from './cloud.js?v=4';
import { initGate } from './gate.js?v=5';
import { openCalibration } from './onboard.js?v=3';
import { weightTrendSVG, weightDeltaLabel, barChartSVG, lineChartSVG } from './chart.js?v=4';
import { EXERCISE_DB, EXERCISE_LIST, EXERCISE_FAMILIES } from './exercises.js?v=4';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const STORE = 'odyssey.profile.v1';

const ICON = {
  fuel: '<path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 002.5 2.5z"/>',
  protein: '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M8 9.5h8"/>',
  cig: '<rect x="2" y="11" width="16" height="5" rx="1"/><path d="M18 7c2 0 2 2 0 4M21 8c1.5 0 1.5 1.5 0 3"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M9.5 14.5c0 1.1 1.1 2 2.5 2s2.5-.9 2.5-2-1.1-1.8-2.5-2-2.5-.9-2.5-2 1.1-2 2.5-2 2.5.9 2.5 2"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  level: '<path d="M3 17l6-6 4 4 8-8"/><path d="M21 7v5h-5"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
};
const svg = (p, c = 'currentColor') => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const lockIco = (c = 'currentColor') => `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px">${ICON.lock}</svg>`;
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const GOAL_LABEL = { recomp: 'recomp', cut: 'cut', leanGain: 'lean-gain' };

/* ---- State -------------------------------------------------------------- */
let profile = load();
let plan = E.computePlan(profile, EXERCISE_DB);
let doneToday = new Set();
let selectedBreath = 'Diaphragmatic';
let pacer = null, sosPacer = null, restInterval = null;

function load() {
  try { const s = JSON.parse(localStorage.getItem(STORE)); if (s) return { ...E.DEFAULT_PROFILE, ...s }; } catch (_) {}
  return { ...E.DEFAULT_PROFILE };
}
function save() { localStorage.setItem(STORE, JSON.stringify(profile)); Cloud.pushDebounced(profile); }
function recompute() { plan = E.computePlan(profile, EXERCISE_DB); }

/* ---- Today checklist persistence (per-date, persisted + synced) --------- */
function checklistStore() { profile.checklistLog = profile.checklistLog || {}; return profile.checklistLog; }
function saveChecklist() { const a = [...doneToday]; const d = todayISO(); if (a.length) checklistStore()[d] = a; else delete checklistStore()[d]; save(); }

/* ---- dated streak helpers ---------------------------------------------- */
function todayISO() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function isoMinus(days) { const d = new Date(); d.setDate(d.getDate() - days); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function computeStreak(dates) {
  if (!dates || !dates.length) return 0;
  const set = new Set(dates);
  let i = set.has(todayISO()) ? 0 : (set.has(isoMinus(1)) ? 1 : -1);  // grace: today or yesterday
  if (i < 0) return 0;
  let streak = 0;
  while (set.has(isoMinus(i))) { streak++; i++; }
  return streak;
}

/* ============================================================================
   RENDER
   ========================================================================== */
function renderAll() {
  recompute();
  renderNav();
  renderCockpit();
  renderCoach();
  renderAesthetic();
  renderSleep();
  renderMood();
  renderWeek();
  renderPeriodize();
  renderPlate();
  renderMoves();
  renderLab();
  renderFuel();
  renderGrocery();
  renderMacroHistory();
  renderJourney();
  renderMeasure();
  renderPhotos();
  renderDisclaimers();
}

function renderNav() {
  $('#nav-streak').textContent = profile.streakDays;
}

/* ---- Cockpit ------------------------------------------------------------ */
function renderCockpit() {
  const p = plan;
  doneToday = new Set(checklistStore()[todayISO()] || []);   // per-date, persisted + synced
  $('#greet').textContent = `Welcome back, ${p.profile.name} — day ${p.profile.streakDays} of your odyssey`;
  M.countUp($('#day-count'), p.profile.streakDays);
  $('#streak-noun').textContent = p.profile.streakDays === 1 ? 'day' : 'days';
  $('#streak-line').innerHTML = streakLine(p);
  const lb = $('#log-day');
  if (lb) { const logged = todayLogged(); lb.textContent = logged ? '✓ Logged today — tap to undo' : '+ Log a clean day'; lb.classList.toggle('btn--ghost', logged); lb.classList.toggle('btn--clay', !logged); }

  // recovery ring
  const circ = 2 * Math.PI * 52;
  $('#ring-fg').style.strokeDashoffset = circ * (1 - p.recovery / 100);
  M.countUp($('#recovery-pct'), p.recovery, { dp: p.recovery < 10 ? 1 : 0 });

  // safety banner
  $('#safety-banner').innerHTML = `<span style="font-size:1.2rem">⚕</span><div><strong>Wellness & education — not medical advice.</strong> With your cough + exertional breathlessness, get a baseline check (spirometry, SpO₂, BP) before ramping. Forceful pranayama stays locked until your lungs earn it. Stop on chest pain, dizziness, or coughing blood.</div>`;

  // speed dial
  renderDial();

  // stat cards
  const m = p.macros, s = p.stats;
  const cards = [
    { ic: 'fuel', c: 'clay', k: 'Daily fuel', v: m.kcal, sm: 'kcal', sub: `${m.surplus >= 0 ? '+' : ''}${m.surplus} kcal · ${GOAL_LABEL[m.goal]}` },
    { ic: 'protein', c: 'sage', k: 'Protein', v: m.protein_g, sm: 'g', sub: `${m.proteinPerFeeding_g}g × ${m.feedings} feeds` },
    { ic: 'target', c: 'sage', k: 'Weight → 75kg', v: s.weightToGo, sm: 'kg', sub: `~${s.etaWeeks} wks ${s.etaFromTrend ? 'at your current pace' : 'at a healthy pace'}`, weight: true },
    { ic: 'cig', c: 'sky', k: 'Cigarettes avoided', v: s.cigsAvoided, sm: '', sub: 'since day one' },
    { ic: 'coin', c: 'clay', k: 'Money saved', v: s.moneySaved, sm: '₹', sub: `~₹${profile.smoking.baselineCigsPerDay * profile.smoking.costPerCig}/day`, money: true },
    { ic: 'level', c: 'sky', k: 'Lung level', v: cap(p.lung.level), sm: '', sub: `${p.lung.techniques.length} techniques unlocked`, txt: true },
  ];
  $('#stat-cards').innerHTML = cards.map(c => `
    <div class="card col-4 keep card--lift reveal stat">
      <div class="ico" style="background:var(--${c.c}-soft); color:var(--${c.c}-deep)">${svg(ICON[c.ic])}</div>
      <div class="val">${c.money ? '<small>₹</small>' : ''}<span data-count="${c.txt ? '' : c.v}">${c.txt ? c.v : (c.weight ? c.v : 0)}</span>${c.sm && !c.money ? `<small> ${c.sm}</small>` : ''}</div>
      <div class="k">${c.k}</div>
      <div class="sub" style="font-size:.8rem;color:var(--ink-faint)">${c.sub}</div>
      ${c.weight ? `<div style="display:flex;gap:6px;margin-top:8px"><button class="chip" data-w="-0.5">– 0.5</button><button class="chip" data-w="0.5">+ 0.5</button><span class="chip">${profile.currentWeight} kg now</span></div>` : ''}
    </div>`).join('');
  // animate numeric counters
  $$('#stat-cards [data-count]').forEach(el => { const v = el.getAttribute('data-count'); if (v !== '') M.countUp(el, v, { dp: (+v % 1 ? 1 : 0) }); });
  $$('#stat-cards [data-w]').forEach(b => b.onclick = () => { adjustWeight(+b.dataset.w); });

  // weight-trend chart — only meaningful once weight has been logged
  const hist = profile.weightHistory || [];
  const trendWrap = $('#weight-trend-wrap');
  if (trendWrap) {
    if (hist.length) {
      trendWrap.style.display = '';
      $('#weight-trend-svg').innerHTML = weightTrendSVG(hist, { target: E.TARGET_WEIGHT, current: profile.currentWeight, startWeight: hist[0] ? hist[0].kg : undefined });
      $('#weight-trend-delta').textContent = weightDeltaLabel(hist);
    } else {
      trendWrap.style.display = 'none';
    }
  }

  // today's full session — performance-driven, woven power/cardio/agility
  const today = todayPlan();
  const focusShort = today.focus.split('—')[0].trim();
  $('#today-day').textContent = today.day + ' · ' + focusShort + (today.emphasis ? ' · ' + today.emphasis : '');
  const rows = [];
  if (today.warmup && today.warmup.length) rows.push(row('warmup', 'Warm-up & mobility', today.warmup.join(' · '), 'Prep'));
  if (today.power) rows.push(row('power', today.power.exercise, `${today.power.sets} × ${today.power.reps} · ${today.power.aesthetic} · do these fresh`, 'Power', today.power.exercise, false, upChip(today.power)));
  if (today.skill) rows.push(row('skill', today.skill.exercise, `${today.skill.sets} × ${today.skill.reps} · ${today.skill.aesthetic}`, 'Skill', today.skill.exercise, false, upChip(today.skill)));
  if (today.strength && today.blocks.length) {
    today.blocks.forEach(b => {
      const logged = exSetsToday(b.exercise);
      const sub = logged.length
        ? `✓ Logged ${logged.map(setLabel).join(', ')} · ${b.aesthetic}`
        : `${b.sets} sets · ${b.reps} · ${b.aesthetic}`;
      rows.push(row('s_' + b.exercise, b.exercise, sub, 'Strength', b.exercise, logged.length > 0, upChip(b)));
    });
  }
  const cond = today.conditioning || {};
  if (cond.label) {
    const condTag = cond.kind === 'intervals' ? 'HIIT' : cond.kind === 'agility' ? 'Agility' : cond.kind === 'rest' ? 'Rest' : 'Cardio';
    const condEx = (cond.exercises && cond.exercises[0] && EXERCISE_DB[cond.exercises[0]]) ? cond.exercises[0] : null;
    rows.push(row('conditioning', cond.label, cond.detail || '', condTag, condEx));
  }
  rows.push(row('breath', `Breathwork — ${today.breathwork.join(' · ')}`, '10–15 min · non-negotiable', 'Breath'));
  const _wt = waterTarget(), _wn = waterToday();
  rows.push(row('hydrate', 'Hydration', _wn > 0 ? `${_wn}/${_wt} glasses logged · ${(_wn * 0.25).toFixed(2).replace(/\.?0+$/, '')} L` : 'Hit your water target — log it in Fuel', 'Fuel', _wn >= _wt));
  rows.push(row('protein', `Hit ${m.protein_g}g protein`, `${m.proteinPerFeeding_g}g across ${m.feedings} meals`, 'Fuel'));
  rows.push(row('checkin', 'Smoke-free check-in', 'Log the streak · note mood & cravings', 'Mind'));
  $('#today-checklist').innerHTML = rows.join('');
  $$('#today-checklist .check-row').forEach(r => r.onclick = () => {
    const id = r.dataset.id;
    r.classList.toggle('done'); doneToday.has(id) ? doneToday.delete(id) : doneToday.add(id);
    saveChecklist();
  });
  $$('#today-checklist [data-ex]').forEach(s => s.onclick = (ev) => { ev.stopPropagation(); openExerciseDetail(s.dataset.ex); });

  // today's breath card
  $('#today-breath').innerHTML = p.lung.techniques.slice(0, 4).map(t => {
    const d = E.BREATH_DETAIL[t];
    return `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span>${t}</span><span class="tag" style="background:var(--sky-soft);color:var(--sky-deep)">${d ? d.tag : ''}</span></div>`;
  }).join('');
}

function row(id, title, sub, tag, exName, forceDone, titleSuffix = '') {
  const done = (forceDone || doneToday.has(id)) ? ' done' : '';
  const titleHtml = (exName && EXERCISE_DB[exName]) ? `<span class="ex-link" data-ex="${escAttr(exName)}">${title}</span>` : title;
  return `<div class="check-row${done}" data-id="${id}">
    <div class="check-box">${svg(ICON.check, '#fff')}</div>
    <div class="ct"><div>${titleHtml}${titleSuffix}</div><div class="sub">${sub}</div></div>
    <span class="tag">${tag}</span></div>`;
}
function upChip(b) {
  if (!b) return '';
  if (b.advanced) return ` <span class="up-chip">▲ leveled up</span>`;
  if (b.regressed) return ` <span class="up-chip down">↺ eased</span>`;
  if (b.held) return ` <span class="up-chip hold">maxed — add load</span>`;
  return '';
}

function streakLine(p) {
  if (p.profile.streakDays === 0) return `Your odyssey begins now. From this breath on, your body starts to heal — and every clean day turns the lungs in your hero a shade greener.`;
  const next = p.milestones.next;
  return `<span class="serif-italic" style="color:var(--clay)">${p.recovery}% lung recovery.</span> Next milestone: <strong>${next.label}</strong> in ${plural(Math.max(0, next.at - p.profile.streakDays), 'day')}.`;
}

function renderDial() {
  const modes = ['auto', 'gentle', 'balanced', 'relentless'];
  const isAuto = plan.modeIsAuto;
  $('#speed-dial').innerHTML = modes.map((mo) => {
    const active = mo === 'auto' ? isAuto : (!isAuto && plan.effectiveMode === mo);
    const rec = mo !== 'auto' && plan.recommendedMode === mo;
    const label = mo === 'auto' ? 'Auto' : E.SPEED_DIAL[mo].label;
    return `<button class="${active ? 'is-on' : ''}" data-mode="${mo}">${label}${rec ? ' <span class="rec-dot" title="recommended for your level">●</span>' : ''}</button>`;
  }).join('');
  $$('#speed-dial button').forEach(b => b.onclick = () => { profile.mode = b.dataset.mode; save(); renderAll(); });
  const dial = E.SPEED_DIAL[plan.effectiveMode];
  const tl = plan.training;
  $('#dial-note').textContent = isAuto
    ? `Auto — tracking your performance (${cap(plan.level)} level · ${tl.sessions} session${tl.sessions === 1 ? '' : 's'} logged) → ${dial.label}: ${dial.trainingDays} days · ${Math.round(dial.volumeMod * 100)}% volume. Log your sets and it climbs on its own — never gated by your streak.`
    : `${dial.label}: ${dial.trainingDays} training days · ${Math.round(dial.volumeMod * 100)}% volume. Recommended for your level: ${cap(plan.recommendedMode)}.`;
}

/* ---- Coach · today's focus (synthesis of readiness/load/nutrition/weak-point) -- */
function renderCoach() {
  const el = $('#coach-card'); if (!el) return;
  const items = plan.coach || [];
  const sevCls = { warn: 'coach-warn', info: 'coach-info', good: 'coach-good' };
  el.innerHTML = `
    <p class="eyebrow" style="color:var(--clay-deep)">Coach · today's focus</p>
    <div class="coach-list">${items.map(it => `<div class="coach-item ${sevCls[it.sev] || ''}"><span class="coach-ic">${it.icon}</span><span>${it.text}</span></div>`).join('')}</div>`;
}

/* ---- Aesthetic / looksmaxx index — scored from the workout log ---------- */
function subScore(k, v) {
  return `<div class="ab-ss"><div class="ab-ss-k mono">${k}</div><div class="ab-ss-v display">${v}</div></div>`;
}
function renderAesthetic() {
  const el = $('#aesthetic-card'); if (!el) return;
  const a = plan.aesthetic;
  const g = plan.graduation;
  const phaseHtml = g.advanced
    ? `<div class="ab-phase adv"><div><strong>Advanced phase active</strong> · ${g.tenureWeeks} training week${g.tenureWeeks === 1 ? '' : 's'} — beginner moves retired, skill work auto-added.</div>${g.manual ? `<button class="ab-adv-btn" id="adv-undo">↺ back to auto</button>` : ''}</div>`
    : `<div class="ab-phase"><div>${cap(g.phase)} phase · ${g.tenureWeeks} training week${g.tenureWeeks === 1 ? '' : 's'} logged. Advanced auto-unlocks at ~14 weeks${g.weeksToAdvanced ? ` (${g.weeksToAdvanced} to go)` : ''} — or whenever you're ready.</div><button class="ab-adv-btn" id="adv-go">I'm ready →</button></div>`;
  const order = ['back', 'shoulders', 'chest', 'core', 'legs', 'arms'];
  const maxIdeal = Math.max(...Object.values(a.ideal));
  const bars = order.map(g => {
    const v = a.groups[g] || 0, ideal = a.ideal[g];
    const w = a.hasData ? Math.min(100, (v / maxIdeal) * 100) : 0;
    const mark = (ideal / maxIdeal) * 100;
    const weak = a.weakest === g ? ' weak' : '';
    return `<div class="ab-row${weak}">
      <span class="ab-k">${a.groupLabels[g]}</span>
      <div class="ab-track"><i style="width:${w}%"></i><b style="left:${mark}%" title="V-taper target ${ideal}%"></b></div>
      <span class="ab-v mono">${a.hasData ? v + '%' : '—'}</span>
    </div>`;
  }).join('');
  el.innerHTML = `
    <div class="ab-head">
      <div><p class="eyebrow" style="color:var(--clay-deep)">Aesthetic index · looksmaxx</p>
        <h3 class="display" style="margin-top:6px">${cap(plan.level)} athlete</h3></div>
      <div class="ab-score"><div class="display ab-score-n">${a.score}<small>/100</small></div>
        <div class="mono ab-score-l">V-taper · posture · lean</div></div>
    </div>
    <div class="ab-sub">${subScore('Balance', a.balance)}${subScore('Posture', a.posture)}${subScore('Consistency', a.consistency)}</div>
    <p class="eyebrow" style="margin-top:22px">Muscle balance vs your V-taper target <span class="ab-target-key">▏ target</span></p>
    <div class="ab-bars">${bars}</div>
    ${plan.bodyComp.vTaper ? `<p class="ab-vtaper mono">Shoulder : waist <strong>${plan.bodyComp.vTaper}</strong> · ${plan.bodyComp.vTaperPct}% of the golden 1.618${plan.bodyComp.bodyFat ? ` · est. ${plan.bodyComp.bodyFat}% body-fat` : ''}</p>` : ''}
    <div class="ab-nudge"><span class="ab-nudge-ic">◎</span><div>${a.nudge}</div></div>
    ${phaseHtml}
    <p class="ab-foot mono">Pull : push ${a.hasData ? a.pullPushRatio + '× — aim ≥ 1 for posture &amp; back width' : '— log sets to score it'} · last 28 days of training</p>`;
  const go = $('#adv-go'); if (go) go.onclick = () => { profile.advancedMode = true; save(); recompute(); renderAll(); };
  const undo = $('#adv-undo'); if (undo) undo.onclick = () => { profile.advancedMode = false; save(); recompute(); renderAll(); };
}

/* ---- Sleep & readiness -------------------------------------------------- */
function renderSleep() {
  const r = plan.readiness;
  const log = (profile.sleepLog || []).slice().sort((a, b) => (a.date < b.date ? -1 : 1));
  const last7 = log.slice(-7);
  const qLabels = ['', 'Poor', 'OK', 'Good', 'Great'];
  const bars = last7.length
    ? last7.map(e => { const pct = Math.max(8, Math.min(100, (e.hours / 9) * 100)); return `<div title="${e.date}: ${e.hours}h" style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;gap:4px;align-items:center"><div style="width:100%;background:var(--lilac);opacity:.85;border-radius:5px 5px 0 0;height:${pct}%"></div><span class="mono" style="font-size:9px;color:var(--ink-faint)">${e.date.slice(8)}</span></div>`; }).join('')
    : `<span class="mono" style="color:var(--ink-faint);font-size:.8rem;align-self:center;margin:auto">No nights logged yet</span>`;
  const band = r.band, color = band === 'high' ? 'sage' : band === 'low' ? 'clay' : 'sky';
  const score = r.score == null ? '—' : r.score;
  $('#sleep-card').innerHTML = `
    <div class="sleep-grid">
      <div>
        <p class="eyebrow" style="color:var(--${color}-deep)">Sleep &amp; readiness</p>
        <div style="display:flex;align-items:baseline;gap:10px;margin:8px 0 6px">
          <span class="display" style="font-size:clamp(2.4rem,6vw,3.2rem)">${score}</span>
          <span class="mono" style="color:var(--ink-faint);font-size:.78rem">${r.score == null ? '' : '/100 · ' + band + ' readiness'}</span>
        </div>
        <p style="color:var(--ink-soft);font-size:.92rem;line-height:1.5">${r.advice}</p>
        ${r.load && r.load.band && r.load.band !== 'none' ? `<p class="load-line mono">Training load · <span class="load-${r.load.band}">${r.load.band}</span>${r.load.acwr ? ` · ACWR ${r.load.acwr}` : ''}</p>` : ''}
        ${r.lastNight ? `<p class="mono" style="font-size:.74rem;color:var(--ink-faint);margin-top:8px">Last night · ${r.lastNight.hours}h · ${qLabels[r.lastNight.quality] || ''}</p>` : ''}
      </div>
      <div>
        <p class="eyebrow">Last 7 nights</p>
        <div style="display:flex;gap:6px;height:72px;align-items:flex-end;margin:10px 0 16px">${bars}</div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <input id="sleep-hours" type="number" min="0" max="14" step="0.5" value="${r.lastNight ? r.lastNight.hours : 7.5}" style="width:72px;padding:9px 11px;border:1.5px solid var(--haze);border-radius:10px;font:inherit;background:var(--cream)">
          <span class="mono" style="font-size:.72rem;color:var(--ink-faint)">hrs</span>
          <div class="dial" id="sleep-quality" style="padding:5px">${[1, 2, 3, 4].map(q => `<button data-q="${q}" style="padding:7px 11px;font-size:.78rem">${qLabels[q]}</button>`).join('')}</div>
          <button class="btn btn--clay magnetic" id="sleep-log" style="padding:11px 18px">Log</button>
        </div>
      </div>
    </div>`;
  let selQ = (r.lastNight && r.lastNight.quality) || 3;
  const markQ = () => $$('#sleep-quality button').forEach(b => b.classList.toggle('is-on', +b.dataset.q === selQ));
  $$('#sleep-quality button').forEach(b => b.onclick = () => { selQ = +b.dataset.q; markQ(); });
  markQ();
  $('#sleep-log').onclick = () => logSleep($('#sleep-hours').value || 7.5, selQ);
}
function logSleep(hours, quality) {
  const t = todayISO();
  profile.sleepLog = (profile.sleepLog || []).filter(e => e.date !== t);
  profile.sleepLog.push({ date: t, hours: +hours, quality: +quality });
  save(); recompute(); renderAll();
}

/* ---- Week --------------------------------------------------------------- */
function renderWeek() {
  const td = todayPlan().day;
  const sp = plan.split;
  $('#week-sub').innerHTML = `${sp.styles[sp.style].label} — ${sp.styles[sp.style].muscles.toLowerCase()}, built for a lean V-taper and tuned to <strong>${cap(plan.effectiveMode)}</strong>. Each day weaves warm-up → power → strength → conditioning (cardio · agility · plyo), and every exercise <strong>auto-progresses from your logged sets</strong> — basic → advanced, never gated by your streak. Daily breathwork; Sunday is full rest.`;

  // routine-style selector (full-body vs splits) + recommendation
  const order = ['full-body', 'upper-lower', 'ppl'];
  $('#split-select').innerHTML = `<p class="eyebrow">Routine style · ${sp.style === sp.recommended ? 'using our pick for you' : 'your choice'}</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-top:12px">
    ${order.map(k => { const s = sp.styles[k], on = sp.style === k, rec = sp.recommended === k;
      return `<button class="card magnetic ${on ? 'card--clay' : ''}" data-split="${k}" style="text-align:left;cursor:pointer;${on ? 'border-color:var(--clay)' : ''}">
        <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
          <strong style="font-family:var(--font-display);font-weight:400;font-size:1.08rem">${s.label}</strong>
          ${rec ? '<span class="lvl-tag lvl-foundation">best for you</span>' : ''}</div>
        <div class="mono" style="font-size:.72rem;color:var(--ink-faint);margin:5px 0 9px">${s.muscles}</div>
        <div style="font-size:.84rem;color:var(--ink-soft);line-height:1.45">${s.blurb}</div></button>`;
    }).join('')}</div>
    <p style="margin-top:14px;color:var(--ink-soft);font-size:.9rem">More training days favors a split; fewer days favors full-body. For <strong>${cap(plan.effectiveMode)}</strong> (${E.SPEED_DIAL[plan.effectiveMode].trainingDays} days) we recommend <strong>${sp.styles[sp.recommended].label}</strong> — but pick whichever you'll stick to.</p>`;
  $$('#split-select [data-split]').forEach(b => b.onclick = () => { profile.splitStyle = b.dataset.split; save(); renderAll(); });

  const condIcon = (k) => k === 'intervals' ? '◇ HIIT' : k === 'agility' ? '⇄ Agility' : k === 'recovery' ? '◷ Recovery' : '◷ Zone-2';
  $('#week-grid').innerHTML = plan.week.map(d => {
    const rest = !d.strength;
    const power = d.power ? `<div class="blk ex-tap blk-power" data-ex="${escAttr(d.power.exercise)}"><span>⚡ ${d.power.exercise}${d.power.advanced ? ' <span class="up-dot" title="leveled up">▲</span>' : ''}</span><span class="s">${d.power.sets}×</span></div>` : '';
    const skill = d.skill ? `<div class="blk ex-tap blk-skill" data-ex="${escAttr(d.skill.exercise)}"><span>◇ ${d.skill.exercise}</span><span class="s">${d.skill.sets}×</span></div>` : '';
    const blocks = d.strength && d.blocks.length
      ? d.blocks.map(b => `<div class="blk ex-tap" data-ex="${escAttr(b.exercise)}"><span>${b.exercise}${b.advanced ? ' <span class="up-dot" title="leveled up">▲</span>' : ''}</span><span class="s">${b.sets}×${b.reps.replace(' reps', '')}</span></div>`).join('')
      : `<div class="blk" style="border:none;color:var(--sky-deep)">${(d.conditioning && d.conditioning.label) || d.cardio}</div>`;
    const cond = (d.strength && d.conditioning && d.conditioning.kind !== 'rest') ? `<div class="wk-cond">${condIcon(d.conditioning.kind)}</div>` : '';
    const cornerTag = d.day === td ? '<span class="tag" style="background:var(--clay);color:#fff">today</span>'
      : (d.emphasis ? `<span class="emph-tag emph-${d.emphasis}">${d.emphasis}</span>` : '');
    return `<div class="day-card ${rest ? 'rest' : ''} ${d.day === td ? 'today' : ''}">
      <div class="dh"><span class="dn">${d.day}</span>${cornerTag}</div>
      <div class="df">${d.focus}</div>
      <div class="blocks">${skill}${power}${blocks}</div>
      ${cond}
      <div class="breath">◷ ${d.breathwork.join(' · ')}</div>
    </div>`;
  }).join('');
  $$('#week-grid [data-ex]').forEach(el => el.onclick = () => openExerciseDetail(el.dataset.ex));
  renderTrainingProgress();
}

/* ---- Training progress — aggregates the workout log (volume · PRs · sessions) -- */
function trainStats() {
  const log = wLog();
  const recent = new Set(); for (let i = 0; i < 7; i++) recent.add(isoMinus(i));
  let sessions = 0, sets = 0, volume = 0, weekSets = 0;
  Object.keys(log).forEach((date) => {
    let daySets = 0;
    Object.values(log[date]).forEach((arr) => arr.forEach((s) => { sets++; daySets++; volume += (s.reps || 0) * Math.max(s.weight || 0, 1); }));
    if (daySets) sessions++;
    if (recent.has(date)) weekSets += daySets;
  });
  return { sessions, sets, volume: Math.round(volume), weekSets };
}
/* weekly rep×load volume, last N 7-day buckets ending today */
function weeklyVolume(weeksBack = 6) {
  const log = wLog(), buckets = {};
  Object.keys(log).forEach((date) => {
    const ms = Date.parse(date + 'T00:00:00'); if (Number.isNaN(ms)) return;
    const wk = Math.floor(ms / (7 * 864e5));
    let vol = 0; Object.values(log[date]).forEach((arr) => arr.forEach((s) => { vol += (s.reps || 0) * Math.max(s.weight || 0, 1); }));
    buckets[wk] = (buckets[wk] || 0) + vol;
  });
  const nowWk = Math.floor(Date.parse(todayISO() + 'T00:00:00') / (7 * 864e5));
  const out = [];
  for (let i = weeksBack - 1; i >= 0; i--) { const wk = nowWk - i; out.push({ label: i === 0 ? 'now' : i + 'w', value: Math.round(buckets[wk] || 0) }); }
  return out;
}
/* the most-logged movement's performance curve (est-1RM if weighted, else top reps) */
function topMovementSeries() {
  const log = wLog(), counts = {};
  Object.values(log).forEach((day) => Object.keys(day).forEach((n) => counts[n] = (counts[n] || 0) + 1));
  const name = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
  if (!name) return { name: null, values: [], labels: [] };
  const sessions = exHistory(name).slice().reverse();   // oldest → newest
  const values = sessions.map((s) => { let best = 0; s.sets.forEach((x) => { const v = (x.weight || 0) > 0 ? x.weight * (1 + (x.reps || 0) / 30) : (x.reps || 0); if (v > best) best = v; }); return Math.round(best * 10) / 10; });
  return { name, values, labels: sessions.map((s) => fmtDate(s.date)) };
}
function allPRs() {
  const names = new Set();
  Object.values(wLog()).forEach((day) => Object.keys(day).forEach((n) => names.add(n)));
  return [...names].map((n) => ({ name: n, pr: exPR(n) })).filter((x) => x.pr).slice(0, 6);
}
function renderTrainingProgress() {
  const el = $('#train-progress'); if (!el) return;
  const st = trainStats();
  if (!st.sessions) {
    el.innerHTML = `<div class="card"><p class="eyebrow">Your training</p><p class="lead" style="margin-top:8px;font-size:1rem">No sessions logged yet — open any move (in Today or Moves) and log your sets. Your sessions, volume and personal records will build here.</p></div>`;
    return;
  }
  const prs = allPRs();
  const vol = weeklyVolume(6);
  const series = topMovementSeries();
  el.innerHTML = `
    <p class="eyebrow">Your training so far</p>
    <div class="bento" style="margin-top:14px">
      <div class="stat card col-4"><div class="k">Sessions</div><div class="val" data-count="${st.sessions}">0</div></div>
      <div class="stat card col-4"><div class="k">Sets logged</div><div class="val" data-count="${st.sets}">0</div></div>
      <div class="stat card col-4"><div class="k">Volume · reps×load</div><div class="val" data-count="${st.volume}">0</div></div>
    </div>
    <div class="bento" style="margin-top:18px">
      <div class="card col-7"><p class="eyebrow">Weekly volume · last 6 weeks</p><div style="margin-top:10px">${barChartSVG(vol, { accent: 'sage' })}</div></div>
      <div class="card col-5"><p class="eyebrow">${series.name ? 'Progression · ' + series.name : 'Strength progression'}</p><div style="margin-top:10px">${series.values.length >= 2 ? lineChartSVG(series.values, { accent: 'clay', labels: series.labels }) : `<p style="color:var(--ink-faint);font-size:.85rem;margin-top:8px">Log a move across 2+ sessions to watch its curve climb.</p>`}</div></div>
    </div>
    ${prs.length ? `<div class="card" style="margin-top:18px"><p class="eyebrow">Personal records</p><div class="pr-list">${prs.map((p) => `<div class="pr-row"><span class="ex-link" data-ex="${escAttr(p.name)}">${p.name}</span><span class="mono" style="color:var(--clay-deep)">${setLabel(p.pr)}</span></div>`).join('')}</div></div>` : ''}
    <p class="mono" style="font-size:.78rem;color:var(--ink-faint);margin-top:14px">${st.weekSets} set${st.weekSets === 1 ? '' : 's'} in the last 7 days</p>`;
  $$('#train-progress [data-count]').forEach((e) => M.countUp(e, e.getAttribute('data-count')));
  $$('#train-progress [data-ex]').forEach((c) => c.onclick = () => openExerciseDetail(c.dataset.ex));
}

/* ---- Lung Lab ----------------------------------------------------------- */
function renderLab() {
  const rec = plan.recovery;
  $('#lab-intro').textContent = `You're at ${rec}% of the way to a non-smoker's lungs. This isn't a metaphor — it's interpolated from real recovery physiology. Train the breath daily and watch it climb.`;
  $('#lab-level').textContent = plan.lung.level;
  $('#lungs-mount').innerHTML = lungsSVG(rec);

  // timeline
  $('#lung-timeline').innerHTML = E.RECOVERY_TIMELINE.map(t => `
    <div class="tl-item ${plan.profile.streakDays >= t.days ? 'reached' : ''}">
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px">
        <span class="at">${t.at}</span><span class="pct-badge">${t.pct}% recovery</span>
      </div>
      <p style="margin-top:4px;color:var(--ink-soft)">${t.body}</p>
    </div>`).join('');

  // breath tiles
  $('#breath-tiles').innerHTML = ['Diaphragmatic', 'Pursed-lip', 'Costal expansion', 'Box breathing', 'Anulom Vilom', 'Kapalbhati', 'Bhastrika'].map(t => {
    const unlocked = plan.lung.techniques.includes(t);
    const d = E.BREATH_DETAIL[t];
    const sel = t === selectedBreath ? ' is-sel' : '';
    return `<div class="breath-tile${sel}${unlocked ? '' : ' locked'}" data-breath="${t}">
      <div style="display:flex;justify-content:space-between;align-items:center"><strong>${t}</strong><span class="tag" style="background:var(--sky-soft);color:var(--sky-deep)">${d.tag}</span></div>
      <p style="font-size:.82rem;color:var(--ink-soft);margin-top:6px">${unlocked ? d.benefit : lockIco('var(--ink-faint)') + ' Unlocks at peak level + green safety'}</p>
    </div>`;
  }).join('');
  $$('#breath-tiles .breath-tile').forEach(t => t.onclick = () => {
    if (t.classList.contains('locked')) return;
    selectedBreath = t.dataset.breath; setPacer(selectedBreath); renderLab();
  });
  setPacer(selectedBreath, false);
}

function setPacer(name, autostart = false) {
  const d = E.BREATH_DETAIL[name]; if (!d) return;
  $('#pacer-name').textContent = name;
  $('#pacer-how').textContent = d.how;
  if (pacer) { pacer.stop(); pacer = null; $('#pacer-core').textContent = 'Tap to\nbreathe'; }
  $('#pacer').classList.remove('run');
}

/* ---- Fuel --------------------------------------------------------------- */
function renderFuel() {
  const m = plan.macros, diet = plan.diet;
  $('#fuel-sub').innerHTML = `${m.kcal} kcal · ${m.protein_g}g protein — a lacto-veg, eggless ${GOAL_LABEL[m.goal]} plan, anchored to your 75 kg target.${plan.adaptiveCal && plan.adaptiveCal.note ? ` <span class="adapt-cal">${plan.adaptiveCal.suggestion ? '⚖ ' : ''}${plan.adaptiveCal.note}</span>` : ' Combine grains + legumes across the day for complete protein.'}`;
  const macs = [['Protein', m.protein_g, 'sage'], ['Carbs', m.carb_g, 'clay'], ['Fat', m.fat_g, 'sky']];
  $('#macro-band').innerHTML = macs.map(([k, g, c]) => `
    <div class="macro card--${c}">
      <div class="k mono" style="color:var(--${c}-deep);font-size:11px;letter-spacing:.12em;text-transform:uppercase">${k}</div>
      <div class="g">${g}<small>g</small></div>
      <div class="meter ${c === 'clay' ? '' : c}" style="margin-top:8px"><i data-fill="100"></i></div>
    </div>`).join('');
  setTimeout(() => $$('#macro-band .meter > i').forEach(i => i.style.width = '100%'), 60);

  $('#meal-list').innerHTML = diet.meals.map(meal => `
    <div class="meal-row meal-check" data-meal="${escAttr(meal.meal)}" data-protein="${meal.protein}">
      <div class="check-box">${svg(ICON.check, '#fff')}</div>
      <div><div class="mname">${meal.meal}</div><div style="color:var(--ink-soft);font-size:.9rem;margin-top:4px">${meal.items}</div>
        ${meal.altCount > 1 ? `<div class="meal-swaps">${meal.alternatives.map((alt, i) => `<button class="swap-chip${i === meal.altIndex ? ' on' : ''}" data-slot="${escAttr(meal.slot)}" data-i="${i}" title="${escAttr(alt.items)}">${i + 1}</button>`).join('')}<span class="swap-label mono">swap</span></div>` : ''}
      </div>
      <div class="mmacros">${meal.kcal} kcal<br>${meal.protein}g P</div>
    </div>`).join('') +
    `<div style="display:flex;justify-content:space-between;padding-top:16px;font-family:var(--font-mono);font-size:.86rem">
      <span style="color:var(--ink-faint)">DAY TOTAL <span id="meal-logged" style="color:var(--sage-deep)"></span></span><span>${diet.totalKcal} kcal · ${diet.totalProtein}g protein</span></div>` +
    `<div style="margin-top:12px"><button class="mini-reset" id="meals-reset">↺ Reset today's meals</button></div>`;
  $$('#meal-list .meal-check').forEach(r => r.onclick = () => toggleMeal(r.dataset.meal));
  $$('#meal-list .swap-chip').forEach(b => b.onclick = (ev) => { ev.stopPropagation(); swapStore()[b.dataset.slot] = +b.dataset.i; save(); renderAll(); });
  const mr = $('#meals-reset'); if (mr) mr.onclick = () => { delete mealStore()[todayISO()]; save(); paintMeals(); };
  paintMeals();

  $('#food-rail').innerHTML = E.LUNG_FOODS.map(f => `<span class="chip">${f}</span>`).join('');
  $('#supp-list').innerHTML = E.SUPPLEMENTS.map(s => `<div><strong style="font-size:.92rem">${s.n}</strong><div style="font-size:.8rem;color:var(--ink-soft)">${s.why}</div></div>`).join('');
  renderWater();
}

/* ---- Water tracker (per-date glasses, persisted + synced) ---------------- */
function waterStore() { profile.waterLog = profile.waterLog || {}; return profile.waterLog; }
function waterTarget() { return Math.min(14, Math.max(8, Math.round(Math.max(2500, (profile.currentWeight || 56) * 35) / 250))); }
function waterToday() { return waterStore()[todayISO()] || 0; }
function renderWater() {
  const card = $('#water-card'); if (!card) return;
  const t = waterTarget();
  const pips = Array.from({ length: t }, (_, i) => `<button class="wpip" data-w="${i + 1}" aria-label="${i + 1} glasses"></button>`).join('');
  card.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px">
      <p class="eyebrow" style="color:var(--sky-deep)">Hydration</p>
      <span class="mono" style="font-size:.78rem;color:var(--ink-faint)"><span id="water-l">0</span> / ${(t * 0.25).toFixed(1)} L</span>
    </div>
    <div style="font-family:var(--font-display);font-size:clamp(2rem,5vw,2.8rem);line-height:1;margin-top:8px"><span id="water-n">0</span><span style="font-size:.32em;color:var(--ink-faint);font-family:var(--font-mono);letter-spacing:.08em"> / ${t} glasses</span></div>
    <div class="wpips" style="margin-top:14px">${pips}</div>
    <div style="display:flex;gap:10px;margin-top:16px">
      <button class="btn btn--clay magnetic" id="water-add" style="padding:11px 20px;font-size:.92rem">+ Glass</button>
      <button class="btn btn--ghost magnetic" id="water-sub" style="padding:11px 17px;font-size:.92rem" aria-label="Remove a glass">−</button>
      <button class="mini-reset" id="water-reset" style="align-self:center" aria-label="Reset water to zero">↺ Reset</button>
    </div>
    <p style="font-size:.78rem;color:var(--ink-faint);margin-top:12px;line-height:1.5">250 ml each · tap a glass to set. The upper end thins mucus while your lungs clear.</p>`;
  $('#water-add').onclick = () => setWater(waterToday() + 1);
  $('#water-sub').onclick = () => setWater(waterToday() - 1);
  $('#water-reset').onclick = () => setWater(0);
  $$('#water-card .wpip').forEach(p => p.onclick = () => { const v = +p.dataset.w; setWater(v === waterToday() ? v - 1 : v); });
  paintWater(waterToday());
}
function paintWater(n) {
  $$('#water-card .wpip').forEach((p, i) => p.classList.toggle('on', i < n));
  const nEl = $('#water-n'), lEl = $('#water-l');
  if (nEl) nEl.textContent = n;
  if (lEl) lEl.textContent = (n * 0.25).toFixed(2).replace(/\.?0+$/, '') || '0';
}
function setWater(n) {
  const t = waterTarget();
  n = Math.max(0, Math.min(t + 6, n));
  waterStore()[todayISO()] = n;
  save();
  paintWater(n);                              // toggle classes in place → pips animate via CSS
}

/* ---- Per-meal check-off (per-date, persisted + synced) ------------------ */
function mealStore() { profile.mealLog = profile.mealLog || {}; return profile.mealLog; }
function paintMeals() {
  const eaten = new Set(mealStore()[todayISO()] || []);
  let count = 0, loggedP = 0;
  $$('#meal-list .meal-row').forEach((r) => {
    const on = eaten.has(r.dataset.meal);
    r.classList.toggle('eaten', on);
    if (on) { count++; loggedP += +r.dataset.protein || 0; }
  });
  const s = $('#meal-logged'); if (s) s.textContent = count ? `· ${count} eaten, ${loggedP}g in` : '';
}
function toggleMeal(name) {
  const d = todayISO(); const arr = mealStore()[d] || [];
  const i = arr.indexOf(name); if (i >= 0) arr.splice(i, 1); else arr.push(name);
  if (arr.length) mealStore()[d] = arr; else delete mealStore()[d];
  save();
  paintMeals();                               // toggle .eaten in place → check fills via CSS
}

/* ---- Daily mood check-in (per-date, persisted + synced) ----------------- */
const MOODS = ['Rough', 'Low', 'OK', 'Good', 'Great'];
function moodStore() { profile.moodLog = profile.moodLog || {}; return profile.moodLog; }
function renderMood() {
  const card = $('#mood-card'); if (!card) return;
  card.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px">
      <p class="eyebrow">Daily check-in</p>
      <span class="mono" id="mood-status" style="font-size:.76rem"></span>
    </div>
    <h3 class="display" style="margin:8px 0 16px;font-size:1.4rem">How's today feeling?</h3>
    <div class="mood-row">${MOODS.map((m, i) => `<button class="mood-pip" data-m="${i}">${m}</button>`).join('')}</div>
    <textarea id="mood-note" class="mood-note" rows="2" placeholder="A line about today — wins, cravings, anything (optional)…"></textarea>`;
  $$('#mood-card .mood-pip').forEach((b) => b.onclick = () => pickMood(+b.dataset.m));
  const note = $('#mood-note');
  if (note) {
    note.value = journalStore()[todayISO()] || '';
    note.oninput = () => { const v = note.value.trim(); if (v) journalStore()[todayISO()] = v; else delete journalStore()[todayISO()]; save(); };
  }
  paintMood(moodStore()[todayISO()]);
}
function journalStore() { profile.journalLog = profile.journalLog || {}; return profile.journalLog; }
/* ---- Data export (full profile + all logs → JSON download) -------------- */
function exportData() {
  try {
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `odyssey-backup-${todayISO()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    const s = $('#sync-status'); if (s) s.textContent = '✓ Downloaded your data backup.';
  } catch (e) { const s = $('#sync-status'); if (s) s.textContent = 'Export failed: ' + e.message; }
}
function paintMood(sel) {
  $$('#mood-card .mood-pip').forEach((b, i) => b.classList.toggle('on', sel === i));
  const s = $('#mood-status');
  if (s) { s.textContent = sel != null ? '✓ noted' : 'tap how you feel'; s.style.color = sel != null ? 'var(--sage-deep)' : 'var(--ink-faint)'; }
}
function pickMood(i) {
  const cur = moodStore()[todayISO()];
  const next = cur === i ? undefined : i;
  if (next == null) delete moodStore()[todayISO()]; else moodStore()[todayISO()] = next;
  save();
  paintMood(next);
}

/* ---- Journey ------------------------------------------------------------ */
function renderJourney() {
  const p = plan;
  const _mnodes = E.MILESTONES.map((m, i) => {
    const done = p.milestones.achieved.some(a => a.id === m.id);
    const isNext = p.milestones.next.id === m.id && !done;
    const target = m.kind === 'streak' ? plural(m.at, 'day') : `${m.at} kg`;
    return `<div class="mnode reveal ${done ? 'done' : ''} ${isNext ? 'next' : ''}" data-d="${i}">
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px">
        <span class="ml">${m.label}</span><span class="mono" style="font-size:.76rem;color:var(--ink-faint)">${target}</span>
      </div>
      <p class="mn" style="margin-top:4px">${m.note}</p>
      ${done ? '<p class="mq" style="margin-top:6px">— reached</p>' : ''}
    </div>`;
  }).join('');
  $('#journey-rail').innerHTML = `<i class="journey-fill" id="journey-fill"></i>${_mnodes}`;
  $('#next-ml').textContent = p.milestones.next.label;
  $('#next-ml-eta').textContent = `${plural(Math.max(0, p.milestones.next.at - p.profile.streakDays), 'clean day')} to go`;

  // heatmap (last 49 calendar days; lit if that date is a logged clean day)
  const clean = new Set(p.profile.cleanDates || []);
  const cells = [];
  for (let i = 48; i >= 0; i--) cells.push(`<span class="heat ${clean.has(isoMinus(i)) ? 'l2' : ''}" title="${isoMinus(i)}"></span>`);
  $('#heatmap').innerHTML = cells.join('');
  renderInsight();
}

/* ---- Weekly insight — ties together every daily log (last 7 days) -------- */
function renderInsight() {
  const el = $('#weekly-insight'); if (!el) return;
  const days = []; for (let i = 0; i < 7; i++) days.push(isoMinus(i));
  const clean = (profile.cleanDates || []).filter(d => days.includes(d)).length;
  const sleeps = (profile.sleepLog || []).filter(s => days.includes(s.date));
  const avgSleep = sleeps.length ? sleeps.reduce((a, s) => a + (s.hours || 0), 0) / sleeps.length : null;
  const moods = days.map(d => moodStore()[d]).filter(v => v != null);
  const avgMood = moods.length ? moods.reduce((a, b) => a + b, 0) / moods.length : null;
  const sessions = days.filter(d => { const x = wLog()[d]; return x && Object.keys(x).length; }).length;
  const wTarget = waterTarget();
  const waterHit = days.filter(d => (waterStore()[d] || 0) >= wTarget).length;
  const stats = [
    { k: 'Clean days', v: `${clean}/7` },
    { k: 'Workouts', v: `${sessions}` },
    avgSleep != null ? { k: 'Avg sleep', v: `${avgSleep.toFixed(1)}h` } : null,
    avgMood != null ? { k: 'Avg mood', v: MOODS[Math.round(avgMood)] } : null,
    { k: 'Hydration', v: `${waterHit}/7` },
  ].filter(Boolean);
  const line = [];
  line.push(clean >= 6 ? `A near-perfect ${clean}/7 clean days — the momentum is real.`
    : clean >= 3 ? `${clean} clean days this week — every one is your lungs healing.`
    : `${clean} clean ${clean === 1 ? 'day' : 'days'} — a reset is a fresh start, not a failure.`);
  if (sessions >= 4) line.push(`${sessions} training sessions in — strong.`);
  else if (sessions > 0) line.push(`${sessions} session${sessions > 1 ? 's' : ''} logged.`);
  if (avgSleep != null && avgSleep < 6.5) line.push(`Sleep averaged ${avgSleep.toFixed(1)}h — aim for 7+ to recover faster.`);
  el.innerHTML = `<div class="card card--clay">
    <p class="eyebrow" style="color:var(--clay-deep)">This week</p>
    <p class="lead" style="margin:8px 0 18px;font-size:1.05rem">${line.join(' ')}</p>
    <div class="insight-stats">${stats.map(s => `<div><div class="mono" style="font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-faint)">${s.k}</div><div style="font-family:var(--font-display);font-size:1.5rem;margin-top:3px">${s.v}</div></div>`).join('')}</div>
  </div>`;
}

/* ============================================================================
   PERIODIZATION — equipment unlocks + deload week
   ========================================================================== */
function renderPeriodize() {
  const el = $('#periodize'); if (!el) return;
  const eq = profile.equipment || {};
  const d = plan.deload;
  const eqs = [['bar', 'Pull-up bar'], ['bands', 'Resistance bands'], ['weights', 'Weights / vest']];
  el.innerHTML = `<div class="card">
    <div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap">
      <p class="eyebrow">Equipment · unlocks harder progressions</p>
      <span class="mono" style="font-size:.72rem;color:var(--ink-faint)">tap to toggle</span>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
      ${eqs.map(([k, label]) => `<button class="chip eq-chip${eq[k] ? ' is-on' : ''}" data-eq="${k}">${eq[k] ? '✓ ' : ''}${label}</button>`).join('')}
    </div>
    <div class="deload-row">
      <div><p class="eyebrow">Deload week · planned recovery</p>
        <p style="font-size:.86rem;color:var(--ink-soft);margin-top:6px;max-width:440px">${d.active ? 'Deload ON — volume cut ~50% this week. Same moves, fewer sets, full recovery; come back stronger.' : (d.suggested ? `You've trained ${d.weeks} weeks — a deload is due. Take a week at half volume to recover and supercompensate.` : `Auto-suggested every ~6 training weeks${d.weeks ? ` (you're at ${d.weeks})` : ''}. Use it when joints or energy feel beat up.`)}</p></div>
      <button class="btn ${d.active ? 'btn--clay' : 'btn--ghost'} magnetic" id="deload-toggle" style="padding:11px 18px;white-space:nowrap">${d.active ? 'End deload' : 'Start deload'}</button>
    </div>
  </div>`;
  $$('#periodize .eq-chip').forEach(b => b.onclick = () => { const k = b.dataset.eq; profile.equipment = { ...(profile.equipment || {}), [k]: !(profile.equipment || {})[k] }; save(); renderAll(); });
  $('#deload-toggle').onclick = () => { profile.deloadActive = !profile.deloadActive; save(); renderAll(); };
}

/* ---- Plate calculator --------------------------------------------------- */
let plateTarget = 40;
function renderPlate() {
  const el = $('#plate-card'); if (!el) return;
  el.innerHTML = `<div class="card">
    <p class="eyebrow">Plate calculator · for weighted progressions</p>
    <div class="plate-in">
      <label>Target load <input id="plate-total" type="number" inputmode="decimal" min="0" step="1.25" value="${plateTarget}"> kg</label>
      <label>Bar <input id="plate-bar" type="number" inputmode="decimal" min="0" step="1" value="20"> kg</label>
    </div>
    <div id="plate-out" style="margin-top:16px"></div>
  </div>`;
  const draw = () => {
    const total = +$('#plate-total').value || 0, bar = +$('#plate-bar').value || 0;
    plateTarget = total;
    const r = E.platePlan(total, bar);
    const out = $('#plate-out');
    if (r.belowBar) { out.innerHTML = `<p style="color:var(--ink-faint);font-size:.9rem">Target is below the bar weight.</p>`; return; }
    const sideKg = r.perSide.reduce((a, b) => a + b, 0);
    const chips = r.perSide.length ? r.perSide.map(p => `<span class="plate-chip">${p}</span>`).join('') : '<span style="color:var(--ink-faint)">just the bar</span>';
    out.innerHTML = `<div class="plate-side"><span class="mono" style="color:var(--ink-faint);font-size:.74rem">PER SIDE</span><div class="plate-chips">${chips}</div></div>
      <p class="mono" style="font-size:.78rem;color:var(--ink-faint);margin-top:10px">${bar} + ${sideKg}×2 = <strong style="color:var(--ink)">${bar + sideKg * 2} kg</strong>${r.remainder ? ` · ${r.remainder} kg short with standard plates` : ''}</p>`;
  };
  $('#plate-total').oninput = draw; $('#plate-bar').oninput = draw; draw();
}

/* ============================================================================
   NUTRITION — grocery list + macro history (meal swaps are in renderFuel)
   ========================================================================== */
function swapStore() { profile.mealSwaps = profile.mealSwaps || {}; return profile.mealSwaps; }
function groceryCheckStore() { profile.groceryChecked = profile.groceryChecked || {}; return profile.groceryChecked; }
function groceryDone(list) { const c = groceryCheckStore(); return list.reduce((s, cat) => s + cat.items.filter(i => c[i.key]).length, 0); }
function renderGrocery() {
  const el = $('#grocery-card'); if (!el) return;
  const list = E.groceryList(profile);
  const checked = groceryCheckStore();
  const total = list.reduce((s, c) => s + c.items.length, 0);
  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap">
      <p class="eyebrow" style="color:var(--sage-deep)">Grocery list · this week's plan</p>
      <span class="mono" style="font-size:.74rem;color:var(--ink-faint)"><span id="groc-done">${groceryDone(list)}</span>/${total}</span>
    </div>
    <div class="groc-cats">${list.map(c => `
      <div class="groc-cat"><div class="groc-h mono">${c.cat}</div>
        ${c.items.map(i => `<button class="groc-item${checked[i.key] ? ' on' : ''}" data-k="${i.key}"><span class="groc-box">${svg(ICON.check, '#fff')}</span><span>${i.label}</span></button>`).join('')}
      </div>`).join('')}</div>
    <button class="mini-reset" id="groc-reset" style="margin-top:14px">↺ Uncheck all</button>`;
  $$('#grocery-card .groc-item').forEach(b => b.onclick = () => {
    const k = b.dataset.k; const c = groceryCheckStore(); if (c[k]) delete c[k]; else c[k] = true; save();
    b.classList.toggle('on'); $('#groc-done').textContent = groceryDone(list);
  });
  $('#groc-reset').onclick = () => { profile.groceryChecked = {}; save(); renderGrocery(); };
}
function renderMacroHistory() {
  const el = $('#macro-history-card'); if (!el) return;
  const target = plan.macros.protein_g;
  const days = []; for (let i = 9; i >= 0; i--) days.push(isoMinus(i));
  const diet = plan.diet;
  const proteinFor = (date) => { const eaten = new Set(mealStore()[date] || []); return diet.meals.reduce((s, m) => s + (eaten.has(m.meal) ? m.protein : 0), 0); };
  const vals = days.map(proteinFor);
  const max = Math.max(target, ...vals, 1);
  const bars = days.map((d, i) => { const v = vals[i]; const h = Math.max(3, (v / max) * 100); return `<div class="mh-col" title="${d}: ${v}g protein"><div class="mh-bar ${v >= target * 0.9 ? 'hit' : ''}" style="height:${h}%"></div><span class="mh-x mono">${d.slice(8)}</span></div>`; }).join('');
  const loggedVals = vals.filter(v => v > 0);
  const avg = loggedVals.length ? Math.round(loggedVals.reduce((a, b) => a + b, 0) / loggedVals.length) : 0;
  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap">
      <p class="eyebrow">Protein logged · last 10 days</p>
      <span class="mono" style="font-size:.74rem;color:var(--ink-faint)">target ${target}g</span>
    </div>
    <div class="mh-chart" style="--mh-target:${100 - (target / max) * 100}%">${bars}</div>
    <p class="mono" style="font-size:.78rem;color:var(--ink-faint);margin-top:10px">Avg on logged days: <strong style="color:var(--ink)">${avg}g</strong> · tick meals in the list to log intake</p>`;
}

/* ============================================================================
   WELLNESS — body measurements + progress photos (photos local-only)
   ========================================================================== */
const MEASURES = [['waist', 'Waist', 'cm'], ['shoulder', 'Shoulders', 'cm'], ['chest', 'Chest', 'cm'], ['arm', 'Arm', 'cm'], ['thigh', 'Thigh', 'cm'], ['weight', 'Weight', 'kg']];
function measureStore() { profile.measureLog = profile.measureLog || {}; return profile.measureLog; }
function latestMeasure() {
  const log = measureStore(); const dates = Object.keys(log).sort();
  if (!dates.length) return null;
  return { date: dates[dates.length - 1], v: log[dates[dates.length - 1]], prev: dates.length > 1 ? log[dates[dates.length - 2]] : null };
}
function renderMeasure() {
  const el = $('#measure-card'); if (!el) return;
  const latest = latestMeasure();
  const v = (latest && latest.v) || {}, prev = (latest && latest.prev) || {};
  const rows = MEASURES.map(([k, label, unit]) => {
    const cur = v[k], pv = prev[k];
    const delta = (cur != null && pv != null) ? +(cur - pv).toFixed(1) : null;
    // for waist, down is good; for everything else, up is good
    const good = delta == null ? '' : (k === 'waist' ? (delta <= 0 ? 'good' : 'bad') : (delta >= 0 ? 'good' : 'bad'));
    const dStr = delta == null ? '' : `<span class="m-delta ${good}">${delta > 0 ? '+' : ''}${delta}</span>`;
    return `<div class="m-row"><span class="m-k">${label}</span><input class="m-in" type="number" inputmode="decimal" data-k="${k}" placeholder="—" value="${cur != null ? cur : ''}"><span class="m-u mono">${unit}</span>${dStr}</div>`;
  }).join('');
  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap">
      <p class="eyebrow" style="color:var(--lilac-deep)">Body measurements · the mirror, not the scale</p>
      ${latest ? `<span class="mono" style="font-size:.72rem;color:var(--ink-faint)">last ${fmtDate(latest.date)}</span>` : ''}
    </div>
    <div class="m-grid">${rows}</div>
    ${plan.bodyComp.hasData ? `<div class="bodycomp">
      <div class="bc-stat"><div class="bc-k mono">Body-fat</div><div class="bc-v">${plan.bodyComp.bodyFat}<small>%</small></div></div>
      <div class="bc-stat"><div class="bc-k mono">Lean mass</div><div class="bc-v">${plan.bodyComp.leanMass != null ? plan.bodyComp.leanMass : '—'}<small>kg</small></div></div>
      <div class="bc-stat"><div class="bc-k mono">V-taper</div><div class="bc-v">${plan.bodyComp.vTaper != null ? plan.bodyComp.vTaper : '—'}<small>${plan.bodyComp.vTaperPct != null ? ' · ' + plan.bodyComp.vTaperPct + '%' : ''}</small></div></div>
    </div>` : ''}
    <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap;align-items:center">
      <button class="btn btn--clay magnetic" id="measure-save" style="padding:11px 18px">Log today</button>
      ${latest ? `<button class="mini-reset" id="measure-del">↺ Delete last entry</button>` : ''}
    </div>
    <p style="font-size:.78rem;color:var(--ink-faint);margin-top:12px;line-height:1.5">Waist down + chest/arms up = the V-taper sharpening. The shoulder-to-waist ratio is the aesthetic anchor — track it monthly.</p>`;
  $('#measure-save').onclick = () => {
    const entry = {}; $$('#measure-card .m-in').forEach(i => { if (i.value !== '') entry[i.dataset.k] = +i.value; });
    if (!Object.keys(entry).length) return;
    measureStore()[todayISO()] = entry;
    if (entry.weight) { adjustWeightTo(entry.weight); }
    save(); recompute(); renderAll();
  };
  const del = $('#measure-del'); if (del) del.onclick = () => { const log = measureStore(); const dates = Object.keys(log).sort(); if (dates.length) { delete log[dates[dates.length - 1]]; save(); recompute(); renderAll(); } };
}
function adjustWeightTo(kg) {
  profile.currentWeight = Math.max(40, Math.min(110, +kg));
  const t = todayISO();
  profile.weightHistory = (profile.weightHistory || []).filter(e => e.date !== t);
  profile.weightHistory.push({ date: t, kg: profile.currentWeight });
}

const PHOTO_KEY = 'odyssey.photos.v1';
function loadPhotos() { try { return JSON.parse(localStorage.getItem(PHOTO_KEY)) || []; } catch (_) { return []; } }
function savePhotos(arr) { try { localStorage.setItem(PHOTO_KEY, JSON.stringify(arr)); return true; } catch (e) { alert('Photo storage is full — delete some older photos first.'); return false; } }
let photoSel = [];
function renderPhotos() {
  const el = $('#photos-card'); if (!el) return;
  const photos = loadPhotos();
  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap">
      <p class="eyebrow">Progress photos · on-device only</p>
      <span class="mono" style="font-size:.72rem;color:var(--ink-faint)">${photos.length}</span>
    </div>
    <label class="photo-add" for="photo-input">+ Add photo</label>
    <input id="photo-input" type="file" accept="image/*" style="display:none">
    <div class="photo-grid" id="photo-grid">${photos.length ? photos.map((p, i) => `<div class="photo-cell${photoSel.includes(i) ? ' sel' : ''}" data-i="${i}"><img src="${p.data}" alt="${p.date}" loading="lazy"><span class="photo-date mono">${fmtDate(p.date)}</span><button class="photo-del" data-del="${i}" aria-label="Delete photo">×</button></div>`).join('') : `<p style="color:var(--ink-faint);font-size:.86rem;grid-column:1/-1;line-height:1.5">No photos yet. Same pose · same light · monthly. Stored only on this device (not synced).</p>`}</div>
    ${photos.length >= 2 ? `<p class="mono" style="font-size:.72rem;color:var(--ink-faint);margin-top:10px">Tap two to compare ${photoSel.length === 2 ? '· <button class="mini-reset" id="photo-clear">clear</button>' : ''}</p>` : ''}
    <div id="photo-compare"></div>`;
  $('#photo-input').onchange = (e) => { const f = e.target.files && e.target.files[0]; if (f) addPhoto(f); };
  $$('#photos-card .photo-cell').forEach(c => c.onclick = (ev) => {
    if (ev.target.dataset.del != null) return;
    const i = +c.dataset.i;
    photoSel = photoSel.includes(i) ? photoSel.filter(x => x !== i) : [...photoSel, i].slice(-2);
    renderPhotos();
  });
  $$('#photos-card .photo-del').forEach(b => b.onclick = (ev) => { ev.stopPropagation(); const i = +b.dataset.del; const arr = loadPhotos(); arr.splice(i, 1); savePhotos(arr); photoSel = []; renderPhotos(); });
  const clear = $('#photo-clear'); if (clear) clear.onclick = () => { photoSel = []; renderPhotos(); };
  if (photoSel.length === 2) {
    const a = photos[photoSel[0]], b = photos[photoSel[1]];
    if (a && b) $('#photo-compare').innerHTML = `<div class="photo-cmp"><figure><img src="${a.data}"><figcaption class="mono">${fmtDate(a.date)}</figcaption></figure><figure><img src="${b.data}"><figcaption class="mono">${fmtDate(b.date)}</figcaption></figure></div>`;
  }
}
function addPhoto(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const max = 720; let w = img.width, h = img.height;
      if (w > h && w > max) { h = h * max / w; w = max; } else if (h > max) { w = w * max / h; h = max; }
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      const data = c.toDataURL('image/jpeg', 0.7);
      const arr = loadPhotos(); arr.push({ date: todayISO(), data });
      while (arr.length > 30) arr.shift();          // cap local storage
      if (savePhotos(arr)) renderPhotos();
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

/* ---- Moves library + exercise detail ------------------------------------ */
const FAMILY_LABELS = { push: 'Push', vpush: 'Vertical push', dip: 'Dips', pull: 'Pull', hrow: 'Rows', squat: 'Squat', hinge: 'Hinge', calf: 'Calves', core: 'Core', agility: 'Agility & footwork', plyometric: 'Plyometrics & power', conditioning: 'Conditioning & cardio', breathwork: 'Breathwork', mobility: 'Mobility & warm-up' };
const escAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
let moveFilter = 'all';

function renderMoves() {
  const fams = EXERCISE_FAMILIES;
  $('#moves-filter').innerHTML = ['all', ...fams].map(f => `<button class="chip${moveFilter === f ? ' is-on' : ''}" data-fam="${f}">${f === 'all' ? 'All ' + EXERCISE_LIST.length : (FAMILY_LABELS[f] || f)}</button>`).join('');
  $$('#moves-filter [data-fam]').forEach(b => b.onclick = () => { moveFilter = b.dataset.fam; renderMoves(); });
  const groups = moveFilter === 'all' ? fams : [moveFilter];
  $('#moves-body').innerHTML = groups.map(fam => {
    const items = EXERCISE_LIST.filter(e => e.family === fam);
    if (!items.length) return '';
    return `<div class="moves-fam"><div class="fam-h"><h3 class="display">${FAMILY_LABELS[fam] || fam}</h3><span class="mono" style="color:var(--ink-faint);font-size:.78rem">${items.length} moves</span></div>
      <div class="moves-grid">${items.map(moveCard).join('')}</div></div>`;
  }).join('');
  $$('#moves-body [data-ex]').forEach(c => c.onclick = () => openExerciseDetail(c.dataset.ex));
}
function moveCard(e) {
  const musc = (e.primaryMuscles || []).slice(0, 3).join(' · ');
  return `<button class="move-card" data-ex="${escAttr(e.name)}">
    <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><span class="mc-name">${e.name}</span><span class="lvl-tag lvl-${e.level}">${e.level}</span></div>
    <span class="mc-musc">${musc}</span></button>`;
}

/* ---- Exercise tracker (per-date set/rep/weight log + history + PR) ------- */
function wLog() { profile.workoutLog = profile.workoutLog || {}; return profile.workoutLog; }
function fmtDate(iso) { const d = new Date(iso + 'T00:00'); return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }
function exSetsToday(name) { return (wLog()[todayISO()] || {})[name] || []; }
function exHistory(name) {           // [{date, sets}] newest first
  const log = wLog();
  return Object.keys(log).filter(d => (log[d][name] || []).length).sort().reverse().map(d => ({ date: d, sets: log[d][name] }));
}
function exLastSets(name) { const h = exHistory(name).filter(x => x.date !== todayISO()); return h.length ? h[0].sets : null; }
function exPR(name) {                 // best set by estimated 1RM (Epley); bodyweight (wt 0) ranks by reps
  let best = null;
  exHistory(name).forEach(({ sets }) => sets.forEach(s => {
    const score = (s.weight || 0) > 0 ? s.weight * (1 + (s.reps || 0) / 30) : (s.reps || 0) / 100;
    if (!best || score > best.score) best = { reps: s.reps, weight: s.weight, score };
  }));
  return best;
}
const setLabel = (s) => `${s.reps}${s.weight ? '×' + s.weight + 'kg' : ' reps'}`;
function saveExerciseLog(name, sets) {
  const log = wLog(); const d = todayISO();
  log[d] = log[d] || {};
  if (sets && sets.length) log[d][name] = sets;
  else { delete log[d][name]; if (!Object.keys(log[d]).length) delete log[d]; }
  save();
}

function openExerciseDetail(name) {
  const e = EXERCISE_DB[name];
  if (!e) return;
  const level = plan.level;
  const reps = (e.repRange && e.repRange[level]) || (e.repRange && (e.repRange.foundation || e.repRange.build || e.repRange.peak)) || '—';
  const rest = e.restGuidance ? e.restGuidance.split('.')[0] : (E.SPEED_DIAL[plan.effectiveMode] || {}).rest || '—';
  const list = (arr, cls = '') => (arr && arr.length) ? `<ul class="ex-list ${cls}">${arr.map(x => `<li>${x}</li>`).join('')}</ul>` : '';
  const steps = (e.steps && e.steps.length) ? `<ol class="ex-steps">${e.steps.map(s => `<li>${s}</li>`).join('')}</ol>` : '';
  const sec = (h, body) => body ? `<div class="ex-sec"><h4>${h}</h4>${body}</div>` : '';
  const muscChips = [...(e.primaryMuscles || []).map(m => `<span class="chip">${m}</span>`), ...(e.secondaryMuscles || []).map(m => `<span class="chip" style="opacity:.65">${m}</span>`)].join('');
  const link = (n) => n && EXERCISE_DB[n] ? `<span class="ex-link" data-go="${escAttr(n)}">${n}</span>` : (n || '—');
  const _today = exSetsToday(name).map(s => ({ reps: s.reps, weight: s.weight }));
  const _last = exLastSets(name); const _pr = exPR(name); const _hist = exHistory(name).slice(0, 6);
  let working = _today.length ? _today : [{ reps: _last && _last[0] ? _last[0].reps : '', weight: _last && _last[0] ? _last[0].weight : '' }];
  clearInterval(restInterval); restInterval = null;                       // kill any prior rest timer
  const restSec = parseInt((String(rest).match(/\d+/) || ['90'])[0], 10) || 90;
  $('#ex-detail').innerHTML = `
    <div class="ex-head">
      <div>
        <p class="eyebrow">${FAMILY_LABELS[e.family] || e.family}${e.equipment && e.equipment.length ? ' · ' + e.equipment[0] : ''}</p>
        <h2 class="display">${e.name}</h2>
        ${e.aka ? `<p class="ex-aka">${e.aka}</p>` : ''}
      </div>
      <span class="lvl-tag lvl-${e.level}">${e.level}</span>
    </div>
    <div class="ex-sec"><h4>Your prescription · ${cap(plan.effectiveMode)} · ${level}</h4>
      <div class="ex-prescribe">
        <div class="ex-pres"><div class="k">Sets × reps</div><div class="v">${reps}</div></div>
        <div class="ex-pres"><div class="k">Tempo</div><div class="v">${e.tempo || '—'}</div></div>
        <div class="ex-pres"><div class="k">Rest</div><div class="v" style="font-size:.95rem">${rest}</div></div>
      </div></div>
    <div class="ex-sec ex-track">
      <h4>Track this session${_pr ? ` · <span style="color:var(--clay-deep)">PR ${setLabel(_pr)}</span>` : ''}</h4>
      <div id="ex-setrows"></div>
      <div class="ex-track-actions">
        <button class="btn btn--ghost" id="ex-add-set" type="button">+ Add set</button>
        <button class="btn btn--clay" id="ex-save-log" type="button">Save session</button>
        <button class="btn btn--ghost" id="ex-clear-log" type="button">Clear today</button>
      </div>
      ${_last ? `<p class="ex-last">Last session: ${_last.map(setLabel).join(', ')}</p>` : ''}
      <p id="ex-log-status" class="ex-log-status"></p>
      <div class="ex-rest">
        <div class="rest-dial">
          <svg class="rest-ring" viewBox="0 0 72 72" aria-hidden="true"><circle class="rr-bg" cx="36" cy="36" r="31"/><circle class="rr-fg" id="rest-ring-fg" cx="36" cy="36" r="31"/></svg>
          <span id="rest-time" class="rest-time mono">0:00</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:9px">
          <span class="eyebrow" style="font-size:10px">Rest timer · ${restSec}s</span>
          <div class="rest-ctrls">
            <button class="btn btn--ghost" id="rest-minus" type="button" aria-label="minus 15 seconds">−15</button>
            <button class="btn btn--clay" id="rest-toggle" type="button">Start</button>
            <button class="btn btn--ghost" id="rest-plus" type="button" aria-label="plus 15 seconds">+15</button>
          </div>
        </div>
      </div>
    </div>
    <div class="ex-sec"><h4>History</h4>${_hist.length ? `<div class="ex-hist">${_hist.map(h => `<div class="ex-hist-row"><span class="mono">${fmtDate(h.date)}${h.date === todayISO() ? ' · today' : ''}</span><span>${h.sets.map(setLabel).join(' · ')}</span></div>`).join('')}</div>` : `<p style="color:var(--ink-faint)">No sessions logged yet — log your sets above and they'll appear here.</p>`}</div>
    ${e.benefitForUser ? `<div class="ex-sec"><h4>Why it matters for you</h4><p class="lead" style="font-size:1rem">${e.benefitForUser}</p></div>` : ''}
    ${sec('Muscles worked', `<div class="ex-musc">${muscChips}</div>`)}
    ${e.setup ? sec('Setup', `<p style="color:var(--ink-soft);line-height:1.55">${e.setup}</p>`) : ''}
    ${sec('How to perform', steps)}
    ${sec('Form cues', list(e.formCues))}
    ${sec('Common mistakes', list(e.commonMistakes, 'warn'))}
    ${e.breathing ? sec('Breathing', `<p style="color:var(--ink-soft);line-height:1.55">${e.breathing}</p>`) : ''}
    ${e.rangeOfMotion ? sec('Range of motion', `<p style="color:var(--ink-soft);line-height:1.55">${e.rangeOfMotion}</p>`) : ''}
    ${sec('Progression path', `<p style="color:var(--ink-soft)">⟵ Easier: ${link(e.regression)} &nbsp;&nbsp;·&nbsp;&nbsp; Harder: ${link(e.progression)} ⟶</p>`)}
    ${e.safety ? `<div class="safety-banner" style="margin-top:22px"><span style="font-size:1.1rem">⚕</span><div>${e.safety}</div></div>` : ''}`;
  $$('#ex-detail [data-go]').forEach(l => l.onclick = () => openExerciseDetail(l.dataset.go));
  // ---- tracker wiring ----
  const drawSets = () => {
    $('#ex-setrows').innerHTML = working.map((s, i) => `<div class="set-row" data-i="${i}"><span class="set-n mono">${i + 1}</span><input class="set-reps" type="number" inputmode="numeric" min="0" placeholder="reps" value="${s.reps ?? ''}"><span class="set-x">reps</span><input class="set-wt" type="number" inputmode="decimal" min="0" placeholder="0" value="${s.weight ?? ''}"><span class="set-x">kg</span><button class="set-del" type="button" aria-label="remove set">×</button></div>`).join('');
    $$('#ex-setrows .set-row').forEach(rowEl => {
      const i = +rowEl.dataset.i;
      rowEl.querySelector('.set-reps').oninput = (ev) => { working[i].reps = ev.target.value === '' ? '' : +ev.target.value; };
      rowEl.querySelector('.set-wt').oninput = (ev) => { working[i].weight = ev.target.value === '' ? '' : +ev.target.value; };
      rowEl.querySelector('.set-del').onclick = () => { working.splice(i, 1); if (!working.length) working.push({ reps: '', weight: '' }); drawSets(); };
    });
  };
  drawSets();
  $('#ex-add-set').onclick = () => { const l = working[working.length - 1] || {}; working.push({ reps: l.reps ?? '', weight: l.weight ?? '' }); drawSets(); };
  $('#ex-save-log').onclick = () => {
    const clean = working.filter(s => s.reps !== '' && s.reps != null).map(s => ({ reps: +s.reps, weight: (s.weight === '' || s.weight == null) ? 0 : +s.weight }));
    saveExerciseLog(name, clean);
    const st = $('#ex-log-status'); if (st) st.textContent = clean.length ? `✓ Saved ${clean.length} set${clean.length > 1 ? 's' : ''} for today` : 'Cleared today’s log';
    renderAll();
  };
  $('#ex-clear-log').onclick = () => {
    saveExerciseLog(name, []);        // remove today's entry for this move (undo the session)
    renderAll();
    openExerciseDetail(name);         // refresh modal (history · PR · inputs)
    const st = $('#ex-log-status'); if (st) st.textContent = '↺ Cleared today’s log for this move.';
  };
  // ---- rest timer ----
  (() => {
    let total = restSec, remaining = restSec;
    const C = 2 * Math.PI * 31;
    const ring = $('#rest-ring-fg'), timeEl = $('#rest-time'), btn = $('#rest-toggle');
    if (ring) ring.style.strokeDasharray = C;
    const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;
    const paint = () => { if (timeEl) timeEl.textContent = fmt(remaining); if (ring) ring.style.strokeDashoffset = (C * (1 - remaining / total)).toFixed(1); };
    const stop = () => { clearInterval(restInterval); restInterval = null; if (btn) btn.textContent = 'Start'; };
    const tick = () => { remaining--; paint(); if (remaining <= 0) { stop(); ring && ring.classList.add('rr-done'); if (navigator.vibrate) navigator.vibrate([140, 70, 140]); } };
    const start = () => { if (restInterval || remaining <= 0) return; if (btn) btn.textContent = 'Pause'; ring && ring.classList.remove('rr-done'); restInterval = setInterval(tick, 1000); };
    paint();
    if (btn) btn.onclick = () => restInterval ? stop() : start();
    $('#rest-minus') && ($('#rest-minus').onclick = () => { remaining = Math.max(5, remaining - 15); total = Math.max(total, remaining); paint(); });
    $('#rest-plus') && ($('#rest-plus').onclick = () => { remaining += 15; total = Math.max(total, remaining); paint(); });
  })();
  M.bindMagnetic($('#ex-modal'));
  $('#ex-modal').classList.add('on');
}

/* ---- Disclaimers -------------------------------------------------------- */
function renderDisclaimers() {
  const html = `<strong>Wellness & education, not medical advice.</strong> Odyssey is an educational tool, not a substitute for professional care. Get a baseline check from a doctor before ramping intensity — ideally spirometry (FEV1/FVC), resting SpO₂, blood pressure, and bloodwork (B12, vitamin D, iron). Stop and seek care for chest pain, coughing blood, severe breathlessness, fainting, or bluish lips. &nbsp;·&nbsp; Built for Anakin · breathe · build · become.`;
  ['disclaimer-foot', 'disclaimer-foot-2', 'disclaimer-foot-3', 'disclaimer-foot-4', 'disclaimer-foot-5'].forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = html; });
}

/* ============================================================================
   HELPERS
   ========================================================================== */
function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }
function todayPlan() {
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const td = names[new Date().getDay()];
  return plan.week.find(d => d.day === td) || plan.week[0];
}
function adjustWeight(delta) {
  profile.currentWeight = Math.round((profile.currentWeight + delta) * 10) / 10;
  profile.currentWeight = Math.max(40, Math.min(110, profile.currentWeight));
  const t = todayISO();
  profile.weightHistory = (profile.weightHistory || []).filter(e => e.date !== t);
  profile.weightHistory.push({ date: t, kg: profile.currentWeight });
  save(); renderAll();
}
function lungsSVG(rec) {
  const f = 0.18 + (rec / 100) * 0.60;            // recovery → fill opacity
  const f2 = Math.min(0.9, f + 0.12);
  return `<svg class="lungs-svg" viewBox="0 0 320 372" fill="none" role="img" aria-label="${rec}% lung recovery">
    <defs>
      <linearGradient id="lobeFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="var(--sky)" stop-opacity="${f}"/>
        <stop offset="1" stop-color="var(--sage)" stop-opacity="${f2}"/>
      </linearGradient>
      <radialGradient id="aura" cx="50%" cy="46%" r="58%">
        <stop offset="0" stop-color="var(--sky)" stop-opacity="${(0.08 + f * 0.12).toFixed(3)}"/>
        <stop offset="1" stop-color="var(--sky)" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <ellipse cx="160" cy="196" rx="150" ry="152" fill="url(#aura)"/>
    <!-- trachea -->
    <path class="lung-airway" d="M160 30 L160 100" stroke="var(--ink-soft)" stroke-width="9" stroke-linecap="round"/>
    <!-- bronchial tree: carina → main → lobar → segmental -->
    <path class="lung-airway" d="M160 100 C150 114 132 120 120 130 C108 138 102 150 100 162 M120 130 C124 144 122 156 118 168
                                 M160 100 C170 114 188 120 200 130 C212 138 218 150 220 162 M200 130 C196 144 198 156 202 168"
          stroke="var(--ink-faint)" stroke-width="4.5" stroke-linecap="round" fill="none"/>
    <!-- RIGHT lung (viewer-left): 3 lobes, horizontal + oblique fissures -->
    <g class="lung lung-right">
      <path d="M150 108 C112 104 84 132 76 182 C68 230 78 290 106 312 C126 328 148 318 149 286 C150 244 150 152 150 108Z"
            fill="url(#lobeFill)" stroke="var(--sky)" stroke-opacity=".5" stroke-width="2"/>
      <path d="M149 156 C120 156 96 162 80 178" stroke="var(--paper)" stroke-width="2.5" opacity=".65"/>
      <path d="M148 222 C120 230 98 244 86 266" stroke="var(--paper)" stroke-width="2.5" opacity=".65"/>
    </g>
    <!-- LEFT lung (viewer-right): 2 lobes, cardiac notch + lingula -->
    <g class="lung lung-left">
      <path d="M170 108 C208 104 236 132 244 182 C252 230 242 290 214 312 C194 328 173 318 172 286
               C171 262 179 252 173 242 C167 232 173 220 173 206 C173 152 170 126 170 108Z"
            fill="url(#lobeFill)" stroke="var(--sky)" stroke-opacity=".5" stroke-width="2"/>
      <path d="M173 214 C200 222 222 238 234 262" stroke="var(--paper)" stroke-width="2.5" opacity=".65"/>
    </g>
    <circle cx="160" cy="25" r="6" fill="var(--clay)"/>
    <text x="160" y="360" text-anchor="middle" font-family="JetBrains Mono" font-size="12" letter-spacing="1.5" fill="var(--ink-faint)">${rec}% RESTORED</text>
  </svg>`;
}

/* ============================================================================
   ROUTING
   ========================================================================== */
function initJourneyScroll() {
  const all = plan.milestones.all.length || 1;
  const reached = Math.min(1, plan.milestones.achieved.length / all);   // rail fills to where you really are
  M.journeyScroll(reached);
}

function switchView(name) {
  M.transitionView(() => {
    $$('.view').forEach(v => v.classList.toggle('is-active', v.dataset.view === name));
    $$('.nav-link').forEach(l => l.classList.toggle('is-active', l.dataset.view === name));
    M.scrollToTop();
    const view = $(`#view-${name}`);
    M.initReveals(view);
    if (name !== 'lab' && pacer) { pacer.stop(); pacer = null; }
    // defer the heavy work (magnetic bind, ScrollTrigger.refresh, journey) one frame
    // so the new view paints instantly — no per-navigation hitch
    requestAnimationFrame(() => {
      M.revealHeadline(view); M.bindMagnetic(view); M.refreshScrollTriggers();
      if (name === 'journey') initJourneyScroll();
    });
  });
}

/* ============================================================================
   INTERACTIONS
   ========================================================================== */
function logCleanDay() {
  const before = profile.streakDays || 0;
  profile.cleanDates = profile.cleanDates || [];
  const t = todayISO();
  if (!profile.cleanDates.includes(t)) profile.cleanDates.push(t);
  profile.streakDays = computeStreak(profile.cleanDates);
  profile.weeksElapsed = Math.floor(profile.streakDays / 7);
  save(); recompute();
  const hit = E.MILESTONES.find(m => m.kind === 'streak' && m.at > before && m.at <= profile.streakDays);
  renderAll();
  if (hit) M.celebrate({ eyebrow: `${plural(hit.at, 'day')} smoke-free`, title: titleFx(hit.label), note: hit.note });
}
function todayLogged() { return (profile.cleanDates || []).includes(todayISO()); }
function unlogCleanDay() {
  profile.cleanDates = (profile.cleanDates || []).filter(d => d !== todayISO());
  profile.streakDays = computeStreak(profile.cleanDates);
  profile.weeksElapsed = Math.floor(profile.streakDays / 7);
  save(); recompute(); renderAll();
}
function toggleCleanDay() { todayLogged() ? unlogCleanDay() : logCleanDay(); }
function resetStreak() {
  if (!confirm('Reset your smoke-free streak to 0?\n\nThis clears every logged clean day. Your weight, plan and settings stay. A reset is a fresh start — not a failure.')) return;
  profile.cleanDates = [];
  profile.streakDays = 0;
  profile.weeksElapsed = 0;
  save(); recompute(); renderAll();
}
function resetLogs() {
  if (!confirm('Reset ALL logged training, meals, water, mood, journal and checklist data?\n\nYour streak, weight history, sleep and settings stay. This cannot be undone.')) return;
  ['workoutLog', 'waterLog', 'mealLog', 'moodLog', 'journalLog', 'checklistLog'].forEach(k => { profile[k] = {}; });
  doneToday = new Set();
  save(); recompute(); renderAll();
  const s = $('#sync-status'); if (s) s.textContent = '✓ Logged data reset.';
}
function titleFx(label) {
  return label.replace(/(\w+)$/, '<em>$1</em>');
}

function openSOS() {
  $('#sos-modal').classList.add('on');
  sosPacer = M.runPacer($('#sos-core'), [4, 7, 8, 0]);
}
function closeSOS() {
  $('#sos-modal').classList.remove('on');
  if (sosPacer) { sosPacer.stop(); sosPacer = null; }
}

/* ---- Profile editor (full calibration / edit every metric) -------------- */
function openProfileEditor(firstRun = false) {
  openCalibration(profile, {
    firstRun,
    onSave(updated) {
      profile = { ...E.DEFAULT_PROFILE, ...updated };
      // keep streak in sync if cleanDates were preserved/edited
      profile.streakDays = computeStreak(profile.cleanDates);
      save(); recompute(); renderAll();
    },
  });
}

/* ---- Cloud sync UI ------------------------------------------------------ */
async function syncPull() {
  const remote = await Cloud.pull();
  if (remote && typeof remote === 'object') {
    profile = { ...E.DEFAULT_PROFILE, ...remote };
    save(); recompute(); renderAll();
  } else {
    Cloud.pushDebounced(profile);            // first device seeds the cloud
  }
  updateSyncUI();
}

function updateSyncUI() {
  const btn = $('#sync-btn'), body = $('#sync-body');
  if (!Cloud.cloudEnabled()) {
    btn.textContent = 'On-device';
    if (body) body.innerHTML = `<p class="lead" style="font-size:.96rem">Your progress is saved <strong>on this device</strong>. Add your free Supabase keys to <span class="mono" style="font-size:.85em">js/config.js</span> to enable accounts + cross-device sync — steps in <span class="mono" style="font-size:.85em">PROJECT_STATUS.md §10</span>.</p>`;
    return;
  }
  const u = Cloud.currentUser();
  if (u) {
    btn.textContent = 'Synced ✓';
    if (body) body.innerHTML = `<p class="lead" style="font-size:.96rem">Signed in as <strong>${u.email || 'you'}</strong>. Your streak, weight & plan follow you across every device, automatically.</p>
      <div style="display:flex; gap:10px; margin-top:14px; flex-wrap:wrap">
        <button class="btn btn--clay magnetic" id="sync-now">Sync now</button>
        <button class="btn btn--ghost magnetic" id="sync-pass">Set / change password</button>
        <button class="btn btn--ghost magnetic" id="sync-export">Export data</button>
        <button class="btn btn--ghost magnetic" id="sync-reset">Reset logs</button>
        <button class="btn btn--ghost magnetic" id="sync-out">Sign out</button>
      </div>
      <div id="sync-pass-wrap" style="display:none; margin-top:12px">
        <input id="sync-pass-input" type="password" autocomplete="new-password" placeholder="New password (min 6 chars)" style="width:100%;padding:12px 15px;border:1.5px solid var(--haze);border-radius:12px;font:inherit;background:var(--cream)">
        <button class="btn btn--clay magnetic" id="sync-pass-save" style="margin-top:8px;width:100%;justify-content:center">Save password</button>
      </div>
      <p id="sync-status" class="mono" style="font-size:.78rem;color:var(--ink-faint);margin-top:10px"></p>`;
    const now = $('#sync-now'); if (now) now.onclick = async () => {
      $('#sync-status').textContent = 'Syncing…';
      Cloud.pushDebounced(profile); await syncPull();
      $('#sync-status').textContent = '✓ Up to date.';
    };
    const passToggle = $('#sync-pass'); if (passToggle) passToggle.onclick = () => {
      const w = $('#sync-pass-wrap'); w.style.display = w.style.display === 'none' ? 'block' : 'none';
      if (w.style.display === 'block') $('#sync-pass-input').focus();
    };
    const passSave = $('#sync-pass-save'); if (passSave) passSave.onclick = async () => {
      const pw = $('#sync-pass-input').value;
      if (pw.length < 6) { $('#sync-status').textContent = 'Password must be at least 6 characters.'; return; }
      $('#sync-status').textContent = 'Saving…';
      try { await Cloud.updatePassword(pw); $('#sync-status').textContent = '✓ Password saved — you can now sign in with it.'; $('#sync-pass-wrap').style.display = 'none'; }
      catch (e) { $('#sync-status').textContent = 'Error: ' + e.message; }
    };
    const exp = $('#sync-export'); if (exp) exp.onclick = exportData;
    const rst = $('#sync-reset'); if (rst) rst.onclick = resetLogs;
    const out = $('#sync-out'); if (out) out.onclick = async () => { await Cloud.signOut(); location.reload(); };
  } else {
    // Within the app the user is always signed in; landing here means the
    // session dropped — bring the gate back with a reload.
    btn.textContent = 'Sign in';
    if (body) body.innerHTML = `<p class="lead" style="font-size:.96rem">Your session ended. Reload to sign back in.</p>
      <button class="btn btn--clay magnetic" id="sync-reload" style="margin-top:12px;width:100%;justify-content:center">Reload &amp; sign in</button>`;
    const rl = $('#sync-reload'); if (rl) rl.onclick = () => location.reload();
  }
}

/* ============================================================================
   BOOT
   ========================================================================== */
let appEntered = false;
function enterApp() {
  if (appEntered) return;               // the gate calls this exactly once
  appEntered = true;
  renderAll();

  // motion
  M.initSmoothScroll();
  M.initCursor();                       // removes the old custom-cursor nodes
  M.initReveals();
  M.revealHeadline();
  M.bindMagnetic();
  M.breathField($('#breath-field'), () => plan.recovery);
  M.intro(() => M.initHero());          // cold-boot intro → then animate the hero in

  // nav scroll state
  const nav = $('#nav');
  addEventListener('scroll', () => nav.classList.toggle('is-scrolled', scrollY > 20), { passive: true });

  // routing — any [data-view]
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-view]');
    if (t) { e.preventDefault(); switchView(t.dataset.view); }
  });

  // pacer tap
  $('#pacer').onclick = () => {
    const wrap = $('#pacer');
    if (pacer) { pacer.stop(); pacer = null; wrap.classList.remove('run'); $('#pacer-core').textContent = 'Tap to\nbreathe'; return; }
    const d = E.BREATH_DETAIL[selectedBreath];
    wrap.classList.add('run');
    pacer = M.runPacer($('#pacer-core'), d.cycle);
  };

  // buttons
  $('#log-day').onclick = toggleCleanDay;
  $('#reset-streak').onclick = resetStreak;
  $('#checklist-reset').onclick = () => { doneToday.clear(); saveChecklist(); renderCockpit(); };
  $('#sos').onclick = openSOS;
  $('#sos-close').onclick = closeSOS;
  $('#sos-modal').onclick = (e) => { if (e.target.id === 'sos-modal') closeSOS(); };
  $('#celebrate-close').onclick = M.closeCelebrate;
  $('#demo-celebrate').onclick = () => {
    const n = plan.milestones.next;
    M.celebrate({ eyebrow: 'Milestone preview', title: titleFx(n.label), note: n.note });
  };
  const navLinks = $('#nav-links');
  $('#burger').onclick = (e) => { e.stopPropagation(); navLinks.classList.toggle('open'); };
  navLinks.addEventListener('click', () => navLinks.classList.remove('open'));   // close after choosing
  document.addEventListener('click', (e) => {                                     // close on outside tap
    if (navLinks.classList.contains('open') && !e.target.closest('#nav-links, #burger')) navLinks.classList.remove('open');
  });
  $('#profile-btn').onclick = () => openProfileEditor(false);
  $('#nav-m-profile').onclick = () => openProfileEditor(false);
  $('#nav-m-account').onclick = () => { updateSyncUI(); $('#sync-modal').classList.add('on'); };

  // exercise detail modal
  const closeEx = () => { $('#ex-modal').classList.remove('on'); clearInterval(restInterval); restInterval = null; };
  $('#ex-close').onclick = closeEx;
  $('#ex-modal').onclick = (e) => { if (e.target.id === 'ex-modal') closeEx(); };

  // account / sync modal — cloud is already initialised by the gate.
  const openSync = () => { updateSyncUI(); $('#sync-modal').classList.add('on'); };
  const closeSync = () => $('#sync-modal').classList.remove('on');
  $('#sync-btn').onclick = openSync;
  $('#sync-close').onclick = closeSync;
  $('#sync-modal').onclick = (e) => { if (e.target.id === 'sync-modal') closeSync(); };
  updateSyncUI();
  if (Cloud.currentUser()) syncPull();                         // pull this user's cloud state on entry
  Cloud.onAuth(() => { updateSyncUI(); if (Cloud.currentUser()) syncPull(); });

  // first-run welcome → calibration (only when nothing has ever been saved)
  if (!localStorage.getItem(STORE)) openProfileEditor(true);

  console.log('%cODYSSEY','color:#D97757;font:600 16px sans-serif','— engine online. Signed in:', Cloud.currentUser()?.email || '—', '· Plan:', plan);
}

/* The app is invite-only: render nothing until the gate authenticates the user. */
function boot() { initGate(enterApp); }

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
