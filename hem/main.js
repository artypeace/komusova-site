/* Hẻm: signboard scenes on top of shared/core.js */
(() => {
  const S = window.Site;
  const root = S.root;
  const done = () => root.classList.add('ready');
  if (!S.hasGsap || S.reduce) { done(); return; }
  const { $, $$, fine } = S;

  /* ---------- Hero: the signs are hung one by one ---------- */
  const h1 = S.splitWords($('.hero-h1'));
  const signs = $$('.facade .sign, .facade .plate, .facade .neon');
  gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.1 })
    .from('.nav > *', { y: -16, opacity: 0, duration: 0.9, stagger: 0.05 }, 0)
    .from(signs, {
      xPercent: (i) => (i % 2 ? 60 : -60), rotation: (i) => (i % 2 ? 5 : -5), opacity: 0,
      duration: 1.1, stagger: 0.09, ease: 'back.out(1.5)',
    }, 0.1)
    .from('.hero-photo-in', { clipPath: 'inset(100% 0 0 0)', duration: 1.4, ease: 'expo.inOut' }, 0.3)
    .from('.hero-photo-in img', { scale: 1.3, duration: 1.8 }, 0.4)
    .from($$('.wi', h1), { yPercent: 110, duration: 1.1, stagger: 0.05 }, 0.7)
    .from('.hero-sub, .hero-actions', { y: 24, opacity: 0, duration: 1, stagger: 0.08 }, 0.95)
    .from('.sticker', { scale: 0, rotation: -140, duration: 1, ease: 'back.out(2)' }, 1.1);
  done();
  S.finishLoading();

  S.reveals();

  /* ---------- Image trail: the city flashes under the cursor ---------- */
  const trail = $('.trail');
  const pool = $$('.trail-pool img');
  let n = 0;
  let z = 3;
  let last = { x: -999, y: -999 };
  let moved = 0;
  function flash(x, y) {
    const img = pool[n++ % pool.length];
    gsap.killTweensOf(img);
    img.style.zIndex = z++;
    gsap.timeline()
      .set(img, { x: x - img.offsetWidth / 2, y: y - img.offsetHeight / 2, rotation: gsap.utils.random(-8, 8), opacity: 1, scale: 0.6 })
      .to(img, { scale: 1, duration: 0.5, ease: 'expo.out' })
      .to(img, { opacity: 0, scale: 0.85, y: '+=40', duration: 0.7, ease: 'power2.in' }, 0.75);
  }
  if (fine) {
    trail.addEventListener('mousemove', (e) => {
      const r = trail.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      moved = Date.now();
      if (Math.hypot(x - last.x, y - last.y) < 90) return;
      last = { x, y };
      flash(x, y);
    });
  }
  // without a mouse, or until it moves, the city flashes on its own
  let auto;
  ScrollTrigger.create({
    trigger: trail, start: 'top 70%', end: 'bottom 30%',
    onToggle: (self) => {
      clearInterval(auto);
      if (!self.isActive) return;
      auto = setInterval(() => {
        if (Date.now() - moved < 1500) return;
        flash(gsap.utils.random(0.15, 0.85) * trail.clientWidth, gsap.utils.random(0.2, 0.8) * trail.clientHeight);
      }, 420);
    },
  });

  /* ---------- Scroll scenes ---------- */
  gsap.matchMedia().add({ desktop: '(min-width: 901px)' }, (ctx) => {
    const { desktop } = ctx.conditions;

    // manifesto lines slide in from alternating sides
    $$('.big-lines').forEach((p) => $$('.ln', p).forEach((ln, i) => gsap.fromTo(ln,
      { xPercent: i % 2 ? 14 : -14, opacity: 0.15 },
      { xPercent: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: ln, start: 'top bottom', end: 'top 60%', scrub: true } })));

    // routes are slapped onto the wall
    gsap.set('.route', { y: 70, opacity: 0 });
    ScrollTrigger.batch('.route', {
      start: 'top 88%', once: true,
      onEnter: (b) => gsap.to(b, { y: 0, opacity: 1, duration: 1, ease: 'expo.out', stagger: 0.1, clearProps: 'transform,opacity' }),
    });

    // one day: each sign switches on as you reach it
    $('.stops').classList.add('is-live');
    $$('.stop').forEach((st) => ScrollTrigger.create({
      trigger: st, start: 'top 72%',
      onEnter: () => st.classList.add('is-lit'), onLeaveBack: () => st.classList.remove('is-lit'),
    }));

    // posters drift at their own pace
    if (desktop) {
      $$('.poster').forEach((p) => gsap.to(p, {
        yPercent: +p.dataset.speed || 0, ease: 'none',
        scrollTrigger: { trigger: '.posters', start: 'top bottom', end: 'bottom top', scrub: true },
      }));
    }

    gsap.from('.guide-photo', { y: 60, rotation: -9, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.guide-photo', start: 'top 80%' } });
    gsap.from('.slip', { y: 90, rotation: 14, opacity: 0, duration: 1.4, ease: 'back.out(1.4)', scrollTrigger: { trigger: '.slip', start: 'top 85%' } });
    gsap.from('.form', { y: 60, rotation: -2, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '.form', start: 'top 85%' } });
    gsap.from('.footer-sign b', { yPercent: 45, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });

    return () => $('.stops').classList.remove('is-live');
  });
})();
