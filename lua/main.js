/* Lụa: silk scenes on top of shared/core.js */
(() => {
  const S = window.Site;
  const root = S.root;
  const done = () => root.classList.add('ready');
  const { $, $$, reduce, fine } = S;

  /* ---------- Silk: many fine threads moving as one cloth ---------- */
  const canvas = $('.silk');
  const ctx = canvas.getContext('2d');
  let W = 0;
  let H = 0;
  let t = 0;
  let running = false;
  const m = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };

  function size() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    const lines = W < 700 ? 46 : 72;
    const step = W < 700 ? 10 : 14;
    for (let i = 0; i < lines; i++) {
      const k = i / lines;
      const y0 = H * (0.16 + k * 0.72);
      const sheen = 0.5 + 0.5 * Math.sin(i * 0.17 + t * 0.7);
      ctx.beginPath();
      for (let x = -20, first = true; x <= W + 20; x += step, first = false) {
        const y = y0
          + Math.sin(x * 0.0042 + t * 0.55 + k * 2.2 + m.x * 1.4) * H * 0.07
          + Math.sin(x * 0.0016 - t * 0.35 + k * 3.1) * H * (0.1 + m.y * 0.06);
        if (first) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      // the light catches some threads, the rest stay in the fabric's own shade
      ctx.strokeStyle = sheen > 0.74 ? `rgba(255, 255, 255, ${0.4 * sheen})` : `rgba(164, 120, 100, ${0.05 + 0.13 * sheen})`;
      ctx.lineWidth = sheen > 0.74 ? 1.5 : 1;
      ctx.stroke();
    }
  }
  function frame() {
    if (!running) return;
    t += 0.008;
    m.x += (m.tx - m.x) * 0.03;
    m.y += (m.ty - m.y) * 0.03;
    draw();
    requestAnimationFrame(frame);
  }
  size();
  draw();
  window.addEventListener('resize', () => { size(); draw(); });
  if (!reduce) {
    new IntersectionObserver(([e]) => {
      const was = running;
      running = e.isIntersecting;
      if (running && !was) requestAnimationFrame(frame);
    }).observe(canvas);
    if (fine) window.addEventListener('mousemove', (e) => { m.tx = e.clientX / window.innerWidth; m.ty = e.clientY / window.innerHeight; }, { passive: true });
  }

  /* ---------- Swatch book: drag it sideways with the mouse ---------- */
  const rail = $('.sw-rail');
  if (fine) {
    let down = false;
    let sx = 0;
    let sl = 0;
    let dist = 0;
    rail.addEventListener('pointerdown', (e) => { down = true; sx = e.clientX; sl = rail.scrollLeft; dist = 0; });
    window.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - sx;
      dist = Math.max(dist, Math.abs(dx));
      if (dist > 4) rail.classList.add('is-dragging');
      rail.scrollLeft = sl - dx;
    });
    window.addEventListener('pointerup', () => { down = false; requestAnimationFrame(() => rail.classList.remove('is-dragging')); });
    rail.addEventListener('click', (e) => { if (dist > 4) e.preventDefault(); }, true);
    rail.addEventListener('dragstart', (e) => e.preventDefault());
  }

  if (!S.hasGsap || reduce) { done(); return; }

  /* ---------- Hero intro ---------- */
  gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.1 })
    .from('.hero-kicker', { y: 16, opacity: 0, duration: 1.2 }, 0.2)
    .from('.hero-word span', { yPercent: 35, opacity: 0, filter: 'blur(18px)', duration: 2.2, stagger: 0.14 }, 0.2)
    .from('.oval--a', { scale: 0.75, opacity: 0, duration: 2.2 }, 0.4)
    .from('.oval--b', { scale: 0.75, opacity: 0, duration: 2.2 }, 0.6)
    .from('.oval img', { scale: 1.4, duration: 2.8 }, 0.4)
    .from('.hero-h1, .hero-sub, .hero-actions', { y: 26, opacity: 0, duration: 1.4, stagger: 0.1 }, 0.9)
    .from('.nav > *', { y: -14, opacity: 0, duration: 1, stagger: 0.06 }, 0.9);
  done();
  S.finishLoading();

  // the manifesto comes into focus word by word
  $$('.touch-text').forEach((el) => {
    S.splitWords(el, 'tw');
    gsap.fromTo($$('.tw', el), { opacity: 0.12, filter: 'blur(8px)' }, {
      opacity: 1, filter: 'blur(0px)', ease: 'none', stagger: 0.1,
      scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 55%', scrub: true },
    });
  });

  S.reveals();

  /* ---------- Thread of the day: drawn with the scroll, knots tie as it passes ---------- */
  const wrap = $('.thread-wrap');
  const base = $('.thread-base');
  const line = $('.thread-line');
  const knots = $$('.knot');
  let len = 0;
  function buildThread() {
    const r = wrap.getBoundingClientRect();
    const pts = knots.map((k) => {
      const d = $('.knot-dot', k).getBoundingClientRect();
      return { x: d.left + d.width / 2 - r.left, y: d.top + d.height / 2 - r.top };
    });
    const amp = r.width > 700 ? 90 : 14;
    let prev = { x: pts[0].x, y: 0 };
    let d = `M ${prev.x} 0`;
    [...pts, { x: pts[pts.length - 1].x, y: r.height }].forEach((p, i) => {
      const s = i % 2 ? 1 : -1;
      const dy = p.y - prev.y;
      d += ` C ${prev.x + amp * s} ${prev.y + dy * 0.35}, ${p.x + amp * s} ${prev.y + dy * 0.65}, ${p.x} ${p.y}`;
      prev = p;
    });
    base.setAttribute('d', d);
    line.setAttribute('d', d);
    len = line.getTotalLength();
    line.style.strokeDasharray = len;
  }
  buildThread();
  wrap.classList.add('has-svg');
  ScrollTrigger.create({
    trigger: wrap, start: 'top 60%', end: 'bottom 60%',
    onRefresh: (self) => { buildThread(); line.style.strokeDashoffset = len * (1 - self.progress); },
    onUpdate: (self) => { line.style.strokeDashoffset = len * (1 - self.progress); },
  });
  knots.forEach((k) => ScrollTrigger.create({
    trigger: $('.knot-dot', k), start: 'center 60%',
    onEnter: () => k.classList.add('is-on'), onLeaveBack: () => k.classList.remove('is-on'),
  }));

  /* ---------- Other scenes ---------- */
  gsap.matchMedia().add({ desktop: '(min-width: 901px)' }, (ctx) => {
    const { desktop } = ctx.conditions;

    if (desktop) {
      const hero = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
      gsap.to('.oval--a', { yPercent: -30, ease: 'none', scrollTrigger: hero });
      gsap.to('.oval--b', { yPercent: -60, ease: 'none', scrollTrigger: hero });
      gsap.to('.hero-word', { yPercent: 18, opacity: 0.4, ease: 'none', scrollTrigger: hero });
    }

    // labels are sewn on and swing into place
    $$('.tag').forEach((tag, i) => {
      const st = { trigger: tag, start: 'top 82%' };
      gsap.from($('.tag-photo', tag), { clipPath: 'inset(100% 0 0 0)', duration: 1.6, ease: 'expo.inOut', delay: (i % 4) * 0.08, scrollTrigger: st });
      gsap.from($('.tag-label', tag), { rotation: i % 2 ? 9 : -9, y: -24, opacity: 0, duration: 2.2, ease: 'elastic.out(1, 0.35)', delay: 0.5 + (i % 4) * 0.08, scrollTrigger: st });
    });

    gsap.from('.sw', { x: 120, opacity: 0, duration: 1.4, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: '.sw-rail', start: 'top 85%' } });
    gsap.from('.about-photo', { clipPath: 'circle(0% at 50% 50%)', duration: 1.8, ease: 'expo.inOut', clearProps: 'clipPath', scrollTrigger: { trigger: '.about-photo', start: 'top 80%' } });
    gsap.from('.afar-photo', { clipPath: 'inset(100% 0 0 0)', duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: '.afar-photo', start: 'top 82%' } });
    gsap.fromTo('.footer-word', { letterSpacing: '.12em', opacity: 0.4 }, { letterSpacing: '-.05em', opacity: 1, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });
  });
})();
