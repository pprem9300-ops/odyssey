/* ============================================================================
   ODYSSEY — MOTION  ·  Lenis + GSAP + canvas breath-field + cursor + celebrations
   "Full bonkers", but disciplined: GPU transforms, reduced-motion fallbacks.
   ========================================================================== */
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

/* ---- Unified motion tokens (out-enter / in-exit ~65% / none-scrub) ------ */
export const EASE = { out: 'power4.out', in: 'power3.in', io: 'power3.inOut', scrub: 'none', spring: 'back.out(1.4)' };
export const DUR  = { micro: 0.18, fast: 0.32, base: 0.5, slow: 0.8, exit: 0.32 };
const isMobile = () => matchMedia('(max-width: 768px)').matches;

/* ---- Smooth scroll (Lenis drives one rAF loop) -------------------------- */
let lenisInstance = null;
export function initSmoothScroll() {
  if (RM || !window.Lenis) return null;
  lenisInstance = new window.Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true, syncTouch: false });
  lenisInstance.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenisInstance.raf(t * 1000), false, true);  // early priority: scroll settles before ScrollTrigger reads
  gsap.ticker.lagSmoothing(0);
  return lenisInstance;
}
export function scrollToTop() {
  if (lenisInstance) lenisInstance.scrollTo(0, { immediate: true });
  else window.scrollTo(0, 0);
}

/* ---- Custom cursor REMOVED — native cursor (clearer + no pointermove cost) */
export function initCursor() {
  document.getElementById('cursor')?.remove();
  document.getElementById('cursor-dot')?.remove();
}

export function bindMagnetic(root = document) {
  if (RM || matchMedia('(hover: none)').matches) return;
  root.querySelectorAll('.magnetic').forEach((el) => {
    if (el._mag) return; el._mag = true;
    const xT = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3' });
    const yT = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3' });
    let r = null;                                   // cache rect on enter — no layout read per move
    el.addEventListener('pointerenter', () => { r = el.getBoundingClientRect(); });
    el.addEventListener('pointermove', (e) => {
      if (!r) r = el.getBoundingClientRect();
      xT((e.clientX - (r.left + r.width / 2)) * 0.3);
      yT((e.clientY - (r.top + r.height / 2)) * 0.3);
    });
    el.addEventListener('pointerleave', () => { r = null; xT(0); yT(0); });
  });
}

/* ---- Scroll reveals (IntersectionObserver, staggered) ------------------- */
export function initReveals(root = document) {
  const els = root.querySelectorAll('.reveal:not(.in)');
  if (RM) { els.forEach((e) => e.classList.add('in')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        const d = parseInt(en.target.dataset.d || 0, 10);
        setTimeout(() => en.target.classList.add('in'), d * 90);
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  els.forEach((e) => io.observe(e));
}

/* ---- Eased count-up ----------------------------------------------------- */
export function countUp(el, to, { dur = 1.4, dp = 0 } = {}) {
  if (!el) return;
  if (RM) { el.textContent = (+to).toFixed(dp); return; }
  const o = { v: parseFloat(el.textContent) || 0 };
  gsap.to(o, { v: +to, duration: dur, ease: 'power2.out', onUpdate: () => { el.textContent = o.v.toFixed(dp); } });
}

/* ---- Hero kinetic intro + word swap ------------------------------------- */
export function initHero() {
  if (gsap && !RM) {
    gsap.from('.hero h1 .kinetic span', { yPercent: 115, opacity: 0, duration: 1.1, ease: 'power4.out', stagger: 0.12, delay: 0.15 });
  }
  const swap = document.getElementById('swap');
  if (!swap) return;
  const words = ['becomes breath', 'becomes muscle', 'becomes you'];
  let i = 0;
  setInterval(() => {
    i = (i + 1) % words.length;
    if (RM) { swap.textContent = words[i]; return; }
    gsap.to(swap, { yPercent: -100, opacity: 0, duration: 0.4, ease: 'power2.in', onComplete: () => {
      swap.textContent = words[i];
      gsap.fromTo(swap, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: 'power3.out' });
    }});
  }, 2600);
}

/* ---- View transition — clip-path wipe (desktop), instant on mobile/RM ---- */
export function transitionView(swap) {
  // Snappy + light: swap immediately, let the cheap CSS `viewIn` fade do the transition.
  // (The old gsap/timer wipe added ~800ms of perceived lag on every page change.)
  swap();
}

/* ---- Masked split-line headline reveals (vanilla, no paid SplitText) ----- */
export function revealHeadline(scope = document) {
  if (RM || !gsap) return;
  scope.querySelectorAll('h2.display:not([data-split])').forEach((h) => {
    h.dataset.split = '1';
    const complex = [...h.children].some((c) => c.tagName !== 'BR');   // has inline markup → don't line-split
    if (complex) {
      gsap.from(h, { yPercent: 24, autoAlpha: 0, duration: DUR.slow, ease: EASE.out,
        scrollTrigger: { trigger: h, start: 'top 88%' } });
      return;
    }
    const lines = h.innerHTML.split(/<br\s*\/?>/i).map((s) => s.trim()).filter(Boolean);
    h.innerHTML = lines.map((l) => `<span class="ln"><i>${l}</i></span>`).join('');
    gsap.from(h.querySelectorAll('.ln i'), { yPercent: 115, duration: DUR.slow, ease: EASE.out, stagger: 0.08,
      scrollTrigger: { trigger: h, start: 'top 86%' } });
  });
}

/* ---- Cold-boot intro sequence ------------------------------------------- */
export function intro(onDone) {
  const el = document.getElementById('intro');
  if (!el) { onDone && onDone(); return; }
  document.body.style.overflow = 'hidden';
  const finish = () => { document.body.style.overflow = ''; el.remove(); onDone && onDone(); };
  if (RM || !gsap) { el.style.transition = 'opacity .5s'; el.style.opacity = '0'; setTimeout(finish, 520); return; }
  const om = el.querySelector('.intro-omega'), wd = el.querySelector('.intro-word'), tg = el.querySelector('.intro-tag'), bar = el.querySelector('.intro-bar > i');
  const tl = gsap.timeline({ onComplete: finish });
  tl.from(om, { scale: 0.5, opacity: 0, duration: 1.0, ease: 'power3.out' })
    .from([wd, tg], { y: 16, opacity: 0, duration: 0.6, ease: 'power3.out', stagger: 0.12 }, 0.45)
    .to(om, { scale: 1.07, duration: 1.0, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 0.3)
    .fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 1.7, ease: 'power1.inOut' }, 0.2)
    .to(el, { opacity: 0, duration: 0.7, ease: 'power2.inOut' }, '+=0.15')
    .to(om, { scale: 1.25, duration: 0.7, ease: 'power2.in' }, '<');
  el.addEventListener('click', () => tl.timeScale(3.2), { once: true });  // tap to skip
}

/* ============================================================================
   BREATH-FIELD  — particle lungs that breathe; greener as recovery rises
   ========================================================================== */
export function breathField(canvas, getRecovery) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1, particles = [], sprites = {}, raf = null, running = false, inView = false;
  const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
  // fewer particles + a hard cap = much smoother paint
  const COUNT = Math.min(1000, Math.max(420, Math.round((innerWidth * innerHeight) / 2000)));

  function makeSprite(rgb) {
    const s = document.createElement('canvas'); s.width = s.height = 40;
    const c = s.getContext('2d');
    const g = c.createRadialGradient(20, 20, 0, 20, 20, 20);
    g.addColorStop(0, `rgba(${rgb},0.95)`); g.addColorStop(0.45, `rgba(${rgb},0.32)`); g.addColorStop(1, `rgba(${rgb},0)`);
    c.fillStyle = g; c.beginPath(); c.arc(20, 20, 20, 0, Math.PI * 2); c.fill();
    return s;
  }
  sprites = { grey: makeSprite('150,148,138'), clay: makeSprite('217,84,43'), sky: makeSprite('62,111,168'), sage: makeSprite('94,115,71') };

  const inLungs = (nx, ny) => {
    const lobe = (cx, cy, rx, ry) => ((nx - cx) ** 2) / (rx * rx) + ((ny - cy) ** 2) / (ry * ry) <= 1;
    const trachea = nx > 0.475 && nx < 0.525 && ny > 0.12 && ny < 0.42;
    return lobe(0.37, 0.55, 0.155, 0.26) || lobe(0.63, 0.55, 0.155, 0.26) || trachea;
  };
  function build() {
    particles = [];
    for (let i = 0; i < COUNT; i++) {
      let nx, ny, tries = 0;
      do { nx = Math.random(); ny = Math.random(); tries++; } while (!inLungs(nx, ny) && tries < 30);
      particles.push({ hx: nx, hy: ny, sx: Math.random(), sy: Math.random(), ph: Math.random() * Math.PI * 2, sz: 0.5 + Math.random() * 0.9, seed: Math.random() });
    }
  }
  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    W = canvas.clientWidth; H = canvas.clientHeight;
    if (!W || !H) return;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function frame(time) {
    if (!W || !H) return;
    ctx.clearRect(0, 0, W, H);
    const rec = (typeof getRecovery === 'function' ? getRecovery() : 0) / 100;
    const healthy = Math.max(0.12, rec);
    const breath = (Math.sin(time / 2000) + 1) / 2;
    const conv = breath * breath * (3 - 2 * breath);
    pointer.x += (pointer.tx - pointer.x) * 0.06; pointer.y += (pointer.ty - pointer.y) * 0.06;
    const px = pointer.x - 0.5, py = pointer.y - 0.5;
    const box = Math.min(W, H) * 0.92, ox = (W - box) / 2, oy = (H - box) / 2;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const indiv = (Math.sin(time / 2000 + p.ph) + 1) / 2;
      const k = conv * 0.78 + indiv * 0.22;
      let nx = p.sx + (p.hx - p.sx) * k, ny = p.sy + (p.hy - p.sy) * k;
      nx += px * (0.04 + p.seed * 0.05) * (1 - k * 0.5); ny += py * (0.04 + p.seed * 0.05) * (1 - k * 0.5);
      const x = ox + nx * box, y = oy + ny * box;
      const isHealthy = p.seed < healthy;
      const sp = !isHealthy ? sprites.grey : (p.seed < healthy * 0.4 ? sprites.clay : p.seed < healthy * 0.72 ? sprites.sky : sprites.sage);
      ctx.globalAlpha = isHealthy ? (0.45 + conv * 0.55) : (0.18 + conv * 0.18);
      const size = (6 + p.sz * 10) * (0.7 + conv * 0.6) * (isHealthy ? 1 : 0.8);
      ctx.drawImage(sp, x - size / 2, y - size / 2, size, size);
    }
    ctx.globalAlpha = 1;
  }
  function loop(t) { if (!running) return; frame(t); raf = requestAnimationFrame(loop); }
  function start() { if (running || document.hidden) return; resize(); if (!W) return; running = true; raf = requestAnimationFrame(loop); }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; }

  build();
  if (RM) { resize(); frame(2000); return; }   // single static breath, no loop

  // PAUSE the loop whenever the hero canvas isn't on screen (interior views) or the tab is hidden
  const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; inView ? start() : stop(); }, { threshold: 0.01 });
  io.observe(canvas);
  document.addEventListener('visibilitychange', () => { document.hidden ? stop() : (inView && start()); });
  addEventListener('resize', () => { if (inView) { resize(); build(); } });
  const host = canvas.closest('.hero') || canvas;
  host.addEventListener('pointermove', (e) => { const r = host.getBoundingClientRect(); pointer.tx = (e.clientX - r.left) / r.width; pointer.ty = (e.clientY - r.top) / r.height; });
}

/* ============================================================================
   BREATH PACER — animate a core through [inhale, hold, exhale, hold] seconds
   ========================================================================== */
export function runPacer(coreEl, cycle, { onPhase } = {}) {
  if (!coreEl) return { stop() {} };
  const [inh, h1, exh, h2] = cycle;
  if (RM) { coreEl.textContent = 'Breathe\nslowly'; return { stop() {} }; }
  const tl = gsap.timeline({ repeat: -1 });
  tl.to(coreEl, { scale: 1.45, duration: inh, ease: 'sine.inOut', onStart: () => set('Breathe in') });
  if (h1) tl.to(coreEl, { scale: 1.45, duration: h1, onStart: () => set('Hold') });
  tl.to(coreEl, { scale: 0.85, duration: exh, ease: 'sine.inOut', onStart: () => set('Breathe out') });
  if (h2) tl.to(coreEl, { scale: 0.85, duration: h2, onStart: () => set('Hold') });
  function set(t) { coreEl.textContent = t; onPhase && onPhase(t); }
  return { stop() { tl.kill(); gsap.to(coreEl, { scale: 1, duration: 0.4 }); } };
}

/* ============================================================================
   CELEBRATIONS
   ========================================================================== */
const COLORS = ['#DD6A47', '#6E9AD4', '#87A36C', '#A695D6'];
export function burst() {
  if (RM || !window.confetti) return;
  const c = window.confetti;
  const opts = { particleCount: 90, spread: 80, scalar: 1.1, ticks: 220, colors: COLORS, disableForReducedMotion: true };
  c({ ...opts, origin: { x: 0.5, y: 0.45 } });
  setTimeout(() => c({ particleCount: 60, spread: 110, startVelocity: 28, origin: { x: 0.15, y: 0.6 }, colors: COLORS }), 180);
  setTimeout(() => c({ particleCount: 60, spread: 110, startVelocity: 28, origin: { x: 0.85, y: 0.6 }, colors: COLORS }), 320);
}

export function celebrate({ eyebrow, title, note }) {
  const el = document.getElementById('celebrate');
  document.getElementById('celebrate-eyebrow').textContent = eyebrow || 'Milestone';
  document.getElementById('celebrate-title').innerHTML = title || 'Milestone';
  document.getElementById('celebrate-note').textContent = note || '';
  document.documentElement.setAttribute('data-takeover', 'on');
  el.classList.add('on');
  burst();
  if (!RM) gsap.from('#celebrate-title', { scale: 0.7, opacity: 0, duration: 0.9, ease: 'back.out(1.6)' });
}
export function closeCelebrate() {
  document.getElementById('celebrate').classList.remove('on');
  document.documentElement.removeAttribute('data-takeover');
}

export function refreshScrollTriggers() { if (ScrollTrigger && !RM) ScrollTrigger.refresh(); }

/* ---- Scroll-driven Journey — filling spine + staggered milestone reveals -- */
export function journeyScroll(reached = 0) {
  // Node reveals are handled by initReveals (IntersectionObserver — robust without the ticker).
  // This adds only the decorative scrubbed progress spine, filling to the real achieved fraction.
  if (RM || !gsap || !ScrollTrigger) return;
  const rail = document.getElementById('journey-rail');
  const fill = document.getElementById('journey-fill');
  if (!rail || !fill) return;
  ScrollTrigger.getAll().forEach((t) => { if (t.vars && t.vars.id === 'journey') t.kill(); });  // re-entrant on view switch
  gsap.set(fill, { scaleY: 0 });
  gsap.to(fill, { scaleY: Math.max(0.03, Math.min(1, reached)), ease: 'none',
    scrollTrigger: { id: 'journey', trigger: rail, start: 'top 75%', end: 'bottom 60%', scrub: 0.6 } });
  ScrollTrigger.refresh();
}
