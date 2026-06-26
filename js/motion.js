/* ============================================================================
   ODYSSEY — MOTION  ·  one-ticker Lenis + GSAP · cinematic cold-boot · reveals
   "Awwwards-grade, disciplined": GPU transforms only, gated on device + RM.
   Hard rule: never gate critical logic (view-swap, saves) on gsap/IO callbacks.
   ========================================================================== */
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const Lenis = window.Lenis;
if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

/* ---- Unified motion tokens (out-enter / in-exit ~65% / none-scrub) ------ */
export const EASE = { out: 'power4.out', in: 'power3.in', io: 'power3.inOut', scrub: 'none', spring: 'back.out(1.4)' };
export const DUR  = { micro: 0.18, fast: 0.32, base: 0.5, slow: 0.85, exit: 0.32 };

const isMobile = () => matchMedia('(max-width: 768px)').matches;
const coarse   = () => matchMedia('(hover: none), (pointer: coarse)').matches;
const lowEnd   = () => (navigator.deviceMemory && navigator.deviceMemory < 4) ||
                       (navigator.connection && navigator.connection.saveData) || false;

/* ============================================================================
   SMOOTH SCROLL — Lenis, ONE ticker (driven by gsap), desktop only
   Re-introduced carefully (it was pulled earlier for jank): gated on RM /
   coarse-pointer / low-memory → those get native scroll, which is jank-proof.
   ========================================================================== */
let lenis = null;
export function initSmoothScroll() {
  if (lenis) return lenis;
  if (RM || !Lenis || !gsap || !ScrollTrigger) return null;   // only skip for reduced-motion / missing libs
  try {
    lenis = new Lenis({
      duration: 1.1,                                   // 1.0–1.3 = the awwwards feel
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),  // expo-out
      smoothWheel: true,
      syncTouch: false,                                // native momentum on touch — Lenis driving touch stuttered on phone; smooths desktop wheel/trackpad only
    });
    gsap.ticker.add((t) => lenis.raf(t * 1000));       // ONE loop — no second rAF
    gsap.ticker.lagSmoothing(0);                       // scrubbed anims never "catch up"
    lenis.on('scroll', ScrollTrigger.update);
  } catch (_) { lenis = null; }
  return lenis;
}
export function scrollToTop() {
  if (lenis) lenis.scrollTo(0, { immediate: true });
  else window.scrollTo(0, 0);
}
export function lenisStop()  { if (lenis) lenis.stop(); }
export function lenisStart() { if (lenis) lenis.start(); }

/* ---- Top scroll-progress rail + nav scrolled-state (works with/without Lenis) -- */
export function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  const nav = document.getElementById('nav');
  let ticking = false;
  const update = () => {
    ticking = false;
    const de = document.documentElement;
    const y = window.scrollY || de.scrollTop || 0;
    const max = (de.scrollHeight - window.innerHeight) || 1;
    const p = Math.min(1, Math.max(0, y / max));
    if (bar) bar.style.transform = `scaleX(${p})`;
    if (nav) nav.classList.toggle('is-scrolled', y > 20);
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  update();
}

/* ---- Custom cursor REMOVED — native cursor (clearer + no pointermove cost) */
export function initCursor() {
  document.getElementById('cursor')?.remove();
  document.getElementById('cursor-dot')?.remove();
}

/* ---- Magnetic hover — cache rect on enter (no layout read per move) ------ */
export function bindMagnetic(root = document) {
  if (RM || !gsap || coarse()) return;
  root.querySelectorAll('.magnetic').forEach((el) => {
    if (el._mag) return; el._mag = true;
    const xT = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3' });
    const yT = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3' });
    let r = null;
    el.addEventListener('pointerenter', () => { r = el.getBoundingClientRect(); });
    el.addEventListener('pointermove', (e) => {
      if (!r) r = el.getBoundingClientRect();
      xT((e.clientX - (r.left + r.width / 2)) * 0.3);
      yT((e.clientY - (r.top + r.height / 2)) * 0.3);
    });
    el.addEventListener('pointerleave', () => { r = null; xT(0); yT(0); });
  });
}

/* ---- Scroll reveals (IntersectionObserver, staggered; hero owned by initHero) -- */
export function initReveals(root = document) {
  const els = [...root.querySelectorAll('.reveal:not(.in)')].filter((e) => !e.closest('.hero'));
  if (RM) { els.forEach((e) => e.classList.add('in')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        const d = parseInt(en.target.dataset.d || 0, 10);
        setTimeout(() => en.target.classList.add('in'), d * 70);
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  els.forEach((e) => io.observe(e));
}

/* ---- Eased count-up (rAF — no ticker dependency) ------------------------- */
export function countUp(el, to, { dur = 1400, dp = 0 } = {}) {
  if (!el) return;
  const target = +to;
  if (RM) { el.textContent = target.toFixed(dp); return; }
  const from = parseFloat(el.textContent) || 0;
  const t0 = performance.now();
  (function frame(t) {
    const k = Math.min(1, (t - t0) / dur);
    const e = 1 - Math.pow(1 - k, 3);
    el.textContent = (from + (target - from) * e).toFixed(dp);
    if (k < 1) requestAnimationFrame(frame);
  })(performance.now());
}

/* ---- Masked split-line headline reveals — CSS + IO (no ticker dependency) --- */
export function revealHeadline(scope = document) {
  if (RM) return;
  const watch = (el, lines) => {
    const io = new IntersectionObserver((es) => es.forEach((en) => {
      if (en.isIntersecting) {
        lines ? el.querySelectorAll('.ln').forEach((ln) => ln.classList.add('in')) : el.classList.add('in');
        io.disconnect();
      }
    }), { threshold: 0.25, rootMargin: '0px 0px -6% 0px' });
    io.observe(el);
  };
  scope.querySelectorAll('h2.display:not([data-split])').forEach((h) => {
    h.dataset.split = '1';
    const complex = [...h.children].some((c) => c.tagName !== 'BR');   // inline markup → plain fade-reveal
    if (complex) { h.classList.add('reveal'); watch(h, false); return; }
    const lines = h.innerHTML.split(/<br\s*\/?>/i).map((s) => s.trim()).filter(Boolean);
    h.innerHTML = lines.map((l, i) => `<span class="ln"><i style="transition-delay:${i * 80}ms">${l}</i></span>`).join('');
    watch(h, true);
  });
}

/* ============================================================================
   HERO — masked-line title + staggered reveal + scroll parallax (owned here)
   ========================================================================== */
export function initHero() {
  const hero = document.querySelector('.hero'); if (!hero) return;
  const h1 = hero.querySelector('.hero-title');
  if (h1 && !h1.dataset.split) {
    h1.dataset.split = '1'; h1.classList.remove('reveal');
    const lines = h1.innerHTML.split(/<br\s*\/?>/i).map((s) => s.trim()).filter(Boolean);
    h1.innerHTML = lines.map((l, i) => `<span class="ln"><i style="transition-delay:${i * 90}ms">${l}</i></span>`).join('');
  }
  const items = [...hero.querySelectorAll('.reveal')].filter((e) => e !== h1);
  if (RM) { items.forEach((e) => e.classList.add('in')); if (h1) h1.querySelectorAll('.ln').forEach((l) => l.classList.add('in')); return; }
  items.forEach((e) => { const d = parseInt(e.dataset.d || 0, 10); setTimeout(() => e.classList.add('in'), 90 + d * 110); });
  if (h1) requestAnimationFrame(() => h1.querySelectorAll('.ln').forEach((l) => l.classList.add('in')));
  // hero parallax lives in initViewScroll('landing') now, so it reverts + resets when you leave the landing view
}

/* ============================================================================
   COLD-BOOT INTRO — cinematic: breath-omega in · wordmark rise · loading rail
   ========================================================================== */
export function intro(onDone) {
  const el = document.getElementById('intro');
  if (!el) { onDone && onDone(); return; }
  document.body.style.overflow = 'hidden';
  const finish = () => { document.body.style.overflow = ''; el.remove(); onDone && onDone(); };
  const om = el.querySelector('.intro-omega'), wd = el.querySelector('.intro-word'),
        tg = el.querySelector('.intro-tag'), bar = el.querySelector('.intro-bar > i'),
        count = el.querySelector('.intro-count');
  if (RM || !gsap) {
    if (count) count.textContent = '100%';
    el.style.transition = 'opacity .5s'; el.style.opacity = '0';
    setTimeout(finish, 520); return;
  }
  const tl = gsap.timeline({ onComplete: finish, defaults: { ease: 'power3.out' } });
  tl.from(om, { scale: 0.5, autoAlpha: 0, filter: 'blur(16px)', duration: 1.15, ease: 'back.out(1.3)' })
    .from([wd, tg], { yPercent: 80, autoAlpha: 0, duration: 0.7, stagger: 0.12 }, 0.5)
    .fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 1.7, ease: 'power1.inOut' }, 0.55);
  if (count) tl.to({ n: 0 }, { n: 100, duration: 1.7, ease: 'power1.inOut',
    onUpdate() { count.textContent = Math.round(this.targets()[0].n) + '%'; } }, 0.55);
  tl.to(el, { autoAlpha: 0, duration: 0.75, ease: 'power2.inOut' }, '+=0.15')
    .to(om, { scale: 1.3, autoAlpha: 0, duration: 0.75, ease: 'power2.in' }, '<')
    .to([wd, tg, bar], { autoAlpha: 0, duration: 0.4 }, '<');
  el.addEventListener('click', () => tl.timeScale(3.4), { once: true });   // tap to skip
}

/* ============================================================================
   VIEW TRANSITION — swap-FIRST, never gated (CSS `viewIn` does the fade)
   ========================================================================== */
export function transitionView(swap) { swap(); }

/* ============================================================================
   BREATH PACER — animate a core through [inhale, hold, exhale, hold] seconds
   ========================================================================== */
export function runPacer(coreEl, cycle, { onPhase } = {}) {
  if (!coreEl || !gsap) return { stop() {} };
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
const COLORS = ['#FF6B42', '#4FD4C4', '#93C17D', '#B6A6E8'];   // Oxygen accents
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
  lenisStop();                                         // freeze the page behind the takeover
  burst();
  if (!RM && gsap) gsap.from('#celebrate-title', { scale: 0.7, opacity: 0, duration: 0.9, ease: 'back.out(1.6)' });
}
export function closeCelebrate() {
  document.getElementById('celebrate').classList.remove('on');
  document.documentElement.removeAttribute('data-takeover');
  lenisStart();
}

export function refreshScrollTriggers() { if (ScrollTrigger && !RM) ScrollTrigger.refresh(); }

/* ---- Scroll-driven Journey — filling spine to the real achieved fraction -- */
export function journeyScroll(reached = 0) {
  if (RM || !gsap || !ScrollTrigger) return;
  const rail = document.getElementById('journey-rail');
  const fill = document.getElementById('journey-fill');
  if (!rail || !fill) return;
  ScrollTrigger.getAll().forEach((t) => { if (t.vars && t.vars.id === 'journey') t.kill(); });   // re-entrant on view switch
  gsap.set(fill, { scaleY: 0 });
  gsap.to(fill, { scaleY: Math.max(0.03, Math.min(1, reached)), ease: 'none',
    scrollTrigger: { id: 'journey', trigger: rail, start: 'top 75%', end: 'bottom 60%', scrub: 0.6 } });
  ScrollTrigger.refresh();
}

/* ============================================================================
   PER-VIEW SCROLL CHOREOGRAPHY — bespoke pinned + parallax moments
   Desktop-only PINS (matchMedia min-width:769 → auto-revert off mobile, no
   pin-spacer trap); parallax runs on ALL devices. Triggers target PERSISTENT
   mount elements (their innerHTML is swapped on re-render, the node stays), and
   the whole thing is rebuilt via ONE reverted matchMedia → re-render-safe.
   Called on view-enter (switchView) AND after renderAll for the active view.
   ========================================================================== */
let viewMM = null;
const DESKTOP = '(min-width: 769px)';
export function initViewScroll(name) {
  if (!gsap || !ScrollTrigger || RM) return;
  if (viewMM) { viewMM.revert(); viewMM = null; }     // tear down the previous view's pins/parallax (revert also resets inline transforms)
  if (name !== 'journey') ScrollTrigger.getAll().forEach((t) => { if (t.vars && t.vars.id === 'journey') t.kill(); });  // drop the journey spine on leave
  const view = document.getElementById('view-' + name);
  if (!view) { ScrollTrigger.refresh(); return; }
  const q = (sel) => view.querySelector(sel);
  const parallax = (el, amt) => { if (el) gsap.fromTo(el, { yPercent: amt }, { yPercent: -amt, ease: 'none',
    scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.8 } }); };
  viewMM = gsap.matchMedia();

  if (name === 'landing') {                            // hero parallax — desktop only, in viewMM so it reverts + resets on leave
    viewMM.add(DESKTOP, () => {
      const hero = q('.hero'), inner = q('.hero-inner'), aura = q('.hero-aura'), hint = q('.scroll-hint');
      if (inner) gsap.to(inner, { yPercent: 14, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 } });
      if (aura)  gsap.to(aura,  { yPercent: -30, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 1 } });
      if (hint)  gsap.to(hint,  { autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: '32% top', scrub: true } });
    });
  } else if (name === 'lab') {
    const hero = q('.lab-hero'), lungs = q('#lungs-mount');
    if (hero && lungs) {
      viewMM.add(DESKTOP, () => {                       // pin the hero, scrub the lungs alive (grey→oxygenated scale)
        gsap.fromTo(lungs, { scale: 0.9, autoAlpha: 0.72 }, { scale: 1.06, autoAlpha: 1, ease: 'none',
          scrollTrigger: { trigger: hero, start: 'top 12%', end: '+=70%', pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true } });
      });
      viewMM.add('(max-width: 768px)', () => parallax(lungs, 7));
    }
  } else if (name === 'week') {
    viewMM.add(DESKTOP, () => {                         // hold the analytics while you read the charts
      const prog = q('#train-progress');
      if (prog) ScrollTrigger.create({ trigger: prog, start: 'top 16%', end: '+=40%', pin: true, anticipatePin: 1, invalidateOnRefresh: true });
    });
    viewMM.add('all', () => { parallax(q('#periodize'), 9); parallax(q('#plate-card'), 12); });
  } else if (name === 'fuel') {
    viewMM.add(DESKTOP, () => {                         // brief "here are your macros" hold, then the meals flow
      const macro = q('#macro-band');
      if (macro) ScrollTrigger.create({ trigger: macro, start: 'top 16%', end: '+=32%', pin: true, anticipatePin: 1, invalidateOnRefresh: true });
    });
    viewMM.add('all', () => parallax(q('#food-rail'), 7));
  }
  ScrollTrigger.refresh();
}

/* ---- Removed: the hero particle breath-field (canvas) — kept as a safe no-op
   so any stale caller never throws. The hero signature is now the CSS aura. --- */
export function breathField() {}
