/* ============================================================================
   ODYSSEY — WEIGHT-TREND CHART  (pure, no DOM, no deps, no fetch)
   Returns an SVG string: breathy pastel area+line weight trend toward 75 kg.
   Tokens inlined from css/styles.css (SVG gradients need literal hex):
     --cream #FAF9F5 · --paper #FFFFFF · --haze #E4E0D4 · --ink #1A1916
     --ink-soft #57564F · --ink-faint #8A887E
     --clay #D97757 · --clay-deep #C25A3B · --clay-soft #F0D6CB
     --sky #6A9BCC · --sky-deep #4E7CAA · --sky-soft #CFE0EF
     --sage #788C5D · --sage-deep #5E7045 · --sage-soft #D6DEC8
   Fonts: --font-display 'Fraunces' serif · --font-mono 'JetBrains Mono'.
   ========================================================================== */

const HEX = {
  cream: '#FAF9F5', paper: '#FFFFFF', haze: '#E4E0D4', ink: '#1A1916',
  inkSoft: '#57564F', inkFaint: '#8A887E',
  clay: '#D97757', clayDeep: '#C25A3B', claySoft: '#F0D6CB',
  sky: '#6A9BCC', skyDeep: '#4E7CAA', skySoft: '#CFE0EF',
  sage: '#788C5D', sageDeep: '#5E7045', sageSoft: '#D6DEC8',
};
const MONO = "'JetBrains Mono', ui-monospace, monospace";
const SERIF = "'Fraunces', Georgia, serif";

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const r1 = (n) => Math.round(n * 10) / 10;
const fmtKg = (n) => {
  const v = r1(n);
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
};

/* ---- normalize history into ordered, clean [{label, kg}] ----------------- */
function clean(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter(e => e && Number.isFinite(+e.kg))
    .map(e => ({ date: e.date || '', kg: +e.kg }))
    // stable sort by ISO date when present; otherwise keep insertion order
    .sort((a, b) => (a.date && b.date) ? (a.date < b.date ? -1 : a.date > b.date ? 1 : 0) : 0);
}

function shortDate(iso) {
  // 'YYYY-MM-DD' -> 'DD Mon'; fall back to raw string
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (!m) return iso || '';
  const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+m[2] - 1];
  return `${+m[3]} ${mon}`;
}

/* ============================================================================
   weightDeltaLabel(history) -> "+1.5 kg in 3 weeks" | "" | "Logged 56.0 kg"
   ========================================================================== */
export function weightDeltaLabel(history) {
  const pts = clean(history);
  if (!pts.length) return '';
  if (pts.length === 1) return `Logged ${fmtKg(pts[0].kg)} kg`;

  const first = pts[0], last = pts[pts.length - 1];
  const delta = r1(last.kg - first.kg);
  const sign = delta > 0 ? '+' : '';
  const mag = `${sign}${fmtKg(delta)} kg`;

  // span: prefer real dates → weeks; else fall back to entries
  let span = '';
  const d0 = /^\d{4}-\d{2}-\d{2}$/.test(first.date) ? new Date(first.date) : null;
  const d1 = /^\d{4}-\d{2}-\d{2}$/.test(last.date) ? new Date(last.date) : null;
  if (d0 && d1 && d1 >= d0) {
    const days = Math.round((d1 - d0) / 86400000);
    if (days >= 7) {
      const wk = Math.round(days / 7);
      span = ` in ${wk} ${wk === 1 ? 'week' : 'weeks'}`;
    } else if (days >= 1) {
      span = ` in ${days} ${days === 1 ? 'day' : 'days'}`;
    }
  }
  if (!span) {
    const n = pts.length;
    span = ` over ${n} ${n === 1 ? 'entry' : 'entries'}`;
  }
  if (delta === 0) return `Holding steady${span}`;
  return `${mag}${span}`;
}

/* ============================================================================
   weightTrendSVG(history, opts) -> SVG string
   ========================================================================== */
export function weightTrendSVG(history, {
  target = 75, current, startWeight, width = 560, height = 220,
} = {}) {
  const W = Math.max(280, +width || 560);
  const H = Math.max(160, +height || 220);
  const pts = clean(history);

  /* ---- empty state ------------------------------------------------------ */
  if (!pts.length) {
    return emptyState(W, H, target);
  }

  /* ---- geometry --------------------------------------------------------- */
  const pad = { t: 30, r: 22, b: 34, l: 44 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;

  const kgs = pts.map(p => p.kg);
  // pad the y domain to include both data AND the target line, with breathing room
  let lo = Math.min(...kgs, target);
  let hi = Math.max(...kgs, target);
  if (lo === hi) { lo -= 2; hi += 2; }              // single flat value
  const padY = Math.max(1, (hi - lo) * 0.18);
  lo = Math.floor(lo - padY);
  hi = Math.ceil(hi + padY);
  const span = hi - lo || 1;

  const y = (kg) => pad.t + plotH * (1 - (kg - lo) / span);
  const n = pts.length;
  const x = (i) => n === 1 ? pad.l + plotW / 2 : pad.l + plotW * (i / (n - 1));

  /* ---- gridlines + y labels (4 ticks) ----------------------------------- */
  const ticks = 4;
  let grid = '';
  for (let i = 0; i <= ticks; i++) {
    const kg = lo + (span * i) / ticks;
    const gy = y(kg);
    grid += `<line x1="${r1(pad.l)}" y1="${r1(gy)}" x2="${r1(W - pad.r)}" y2="${r1(gy)}" stroke="${HEX.haze}" stroke-width="1" stroke-opacity="${i === 0 ? '.9' : '.55'}"/>`;
    grid += `<text x="${pad.l - 9}" y="${r1(gy + 3.5)}" text-anchor="end" font-family="${MONO}" font-size="10" fill="${HEX.inkFaint}">${fmtKg(kg)}</text>`;
  }

  /* ---- target line at `target` kg --------------------------------------- */
  const ty = y(target);
  const inRange = target >= lo && target <= hi;
  let targetLayer = '';
  if (inRange) {
    targetLayer = `
      <line x1="${r1(pad.l)}" y1="${r1(ty)}" x2="${r1(W - pad.r)}" y2="${r1(ty)}"
            stroke="${HEX.clay}" stroke-width="1.5" stroke-dasharray="5 5" stroke-opacity=".85"/>
      <text x="${r1(W - pad.r)}" y="${r1(ty - 7)}" text-anchor="end"
            font-family="${MONO}" font-size="10" letter-spacing=".12em" fill="${HEX.clayDeep}">TARGET ${fmtKg(target)}</text>`;
  }

  /* ---- line + area path ------------------------------------------------- */
  const linePts = pts.map((p, i) => [x(i), y(p.kg)]);
  const linePath = linePts.map(([px, py], i) => `${i === 0 ? 'M' : 'L'}${r1(px)} ${r1(py)}`).join(' ');
  const baseline = pad.t + plotH;
  const areaPath = `${linePath} L${r1(linePts[linePts.length - 1][0])} ${r1(baseline)} L${r1(linePts[0][0])} ${r1(baseline)} Z`;

  /* ---- start marker (faint reference dot, when distinct) ---------------- */
  let startLayer = '';
  const startKg = Number.isFinite(+startWeight) ? +startWeight : pts[0].kg;
  if (n > 1 && Number.isFinite(+startWeight) && Math.abs(startKg - pts[0].kg) > 0.05) {
    const sy = y(startKg);
    startLayer = `<line x1="${r1(pad.l)}" y1="${r1(sy)}" x2="${r1(W - pad.r)}" y2="${r1(sy)}" stroke="${HEX.skyDeep}" stroke-width="1" stroke-dasharray="2 5" stroke-opacity=".5"/>`;
  }

  /* ---- x labels (first · last, plus mid when room) ---------------------- */
  let xLabels = '';
  const labelAt = (i, anchor) => {
    const lbl = shortDate(pts[i].date) || `#${i + 1}`;
    if (!lbl) return '';
    return `<text x="${r1(x(i))}" y="${r1(H - 12)}" text-anchor="${anchor}" font-family="${MONO}" font-size="10" fill="${HEX.inkFaint}">${esc(lbl)}</text>`;
  };
  if (n === 1) {
    xLabels = labelAt(0, 'middle');
  } else {
    xLabels = labelAt(0, 'start') + labelAt(n - 1, 'end');
    if (n >= 5) xLabels += labelAt(Math.floor((n - 1) / 2), 'middle');
  }

  /* ---- latest point: clay dot + big callout ----------------------------- */
  const last = pts[n - 1];
  const lx = x(n - 1), lyv = y(last.kg);
  const cur = Number.isFinite(+current) ? +current : last.kg;
  const toGo = r1(target - cur);
  const callout = toGo > 0
    ? `${fmtKg(Math.abs(toGo))} kg to go`
    : toGo < 0 ? `${fmtKg(Math.abs(toGo))} kg over` : 'on target';

  // callout block top-left, never overlapping the rising line
  const calloutLayer = `
    <text x="${pad.l}" y="${pad.t - 14}" font-family="${MONO}" font-size="9.5" letter-spacing=".14em" fill="${HEX.inkFaint}">LATEST WEIGHT</text>
    <text x="${pad.l - 2}" y="${pad.t + 7}" font-family="${SERIF}" font-size="26" font-weight="400" fill="${HEX.ink}">${fmtKg(last.kg)}<tspan font-family="${MONO}" font-size="11" fill="${HEX.inkFaint}"> kg</tspan></text>
    <text x="${pad.l + 86}" y="${pad.t + 4}" font-family="${MONO}" font-size="10" fill="${HEX.clayDeep}">${esc(callout)}</text>`;

  const dot = `
    <circle cx="${r1(lx)}" cy="${r1(lyv)}" r="7" fill="${HEX.claySoft}" opacity=".9"/>
    <circle cx="${r1(lx)}" cy="${r1(lyv)}" r="4" fill="${HEX.clay}"/>
    <circle cx="${r1(lx)}" cy="${r1(lyv)}" r="4" fill="none" stroke="${HEX.paper}" stroke-width="1.4"/>`;

  // small dots on each intermediate logged point
  const innerDots = pts.slice(0, -1).map((p, i) =>
    `<circle cx="${r1(x(i))}" cy="${r1(y(p.kg))}" r="2.6" fill="${HEX.paper}" stroke="${HEX.sage}" stroke-width="1.4"/>`
  ).join('');

  const gid = `wt-${W}x${H}`;

  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img"
     aria-label="Weight trend: latest ${fmtKg(last.kg)} kg, target ${fmtKg(target)} kg" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="${gid}-fill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${HEX.sage}" stop-opacity=".22"/>
      <stop offset="0.55" stop-color="${HEX.sky}" stop-opacity=".10"/>
      <stop offset="1" stop-color="${HEX.sky}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="${gid}-line" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${HEX.sageDeep}"/>
      <stop offset="1" stop-color="${HEX.skyDeep}"/>
    </linearGradient>
  </defs>
  <g>${grid}</g>
  ${startLayer}
  <path d="${areaPath}" fill="url(#${gid}-fill)"/>
  <path d="${linePath}" fill="none" stroke="url(#${gid}-line)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
  ${innerDots}
  ${targetLayer}
  ${dot}
  <g>${xLabels}</g>
  ${calloutLayer}
</svg>`;
}

/* ---- elegant empty state ------------------------------------------------- */
function emptyState(W, H, target) {
  const cx = W / 2;
  const gid = `wt-empty-${W}x${H}`;
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img"
     aria-label="No weight logged yet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="${gid}-line" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${HEX.sageDeep}" stop-opacity=".55"/>
      <stop offset="1" stop-color="${HEX.skyDeep}" stop-opacity=".55"/>
    </linearGradient>
  </defs>
  <line x1="34" y1="${r1(H * 0.34)}" x2="${W - 34}" y2="${r1(H * 0.34)}"
        stroke="${HEX.clay}" stroke-width="1.5" stroke-dasharray="5 5" stroke-opacity=".75"/>
  <text x="${W - 34}" y="${r1(H * 0.34 - 7)}" text-anchor="end"
        font-family="${MONO}" font-size="10" letter-spacing=".12em" fill="${HEX.clayDeep}">TARGET ${fmtKg(target)}</text>
  <path d="M34 ${r1(H * 0.78)} C ${W * 0.32} ${r1(H * 0.72)}, ${W * 0.55} ${r1(H * 0.55)}, ${W - 34} ${r1(H * 0.42)}"
        fill="none" stroke="url(#${gid}-line)" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="2 7" opacity=".7"/>
  <circle cx="${W - 34}" cy="${r1(H * 0.42)}" r="4" fill="${HEX.clay}" opacity=".7"/>
  <text x="${cx}" y="${r1(H * 0.62)}" text-anchor="middle"
        font-family="${SERIF}" font-size="17" font-style="italic" fill="${HEX.inkSoft}">Log your weight to see the climb to ${fmtKg(target)}kg</text>
</svg>`;
}
