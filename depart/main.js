/* SGN: departure-board scenes on top of shared/core.js */
(() => {
  const S = window.Site;
  const root = S.root;
  const done = () => root.classList.add('ready');
  if (!S.hasGsap || S.reduce) { done(); return; }
  const { $, $$, fine } = S;

  const CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const rnd = () => CH[Math.floor(Math.random() * CH.length)];
  const keep = /[\s·→&:.,'’+-]/;

  // board text rolls through random letters and settles one character at a time
  function scramble(el, duration = 0.9) {
    const final = el.dataset.final || (el.dataset.final = el.textContent);
    const chars = [...final];
    const at = chars.map((_, i) => (i / chars.length) * 0.7 + Math.random() * 0.3);
    const o = { p: 0 };
    return gsap.to(o, {
      p: 1, duration, ease: 'none',
      onUpdate: () => { el.textContent = chars.map((c, i) => (keep.test(c) || o.p >= at[i] ? c : rnd())).join(''); },
      onComplete: () => { el.textContent = final; },
    });
  }

  // one split-flap tile: a few random flips, then its letter
  function flap(el) {
    const final = el.dataset.ch;
    const tl = gsap.timeline();
    const flips = 7 + Math.floor(Math.random() * 6);
    tl.add(() => el.classList.add('is-rolling'), 0);
    for (let i = 0; i < flips; i++) {
      tl.add(() => { el.textContent = rnd(); }, i * 0.055);
      tl.fromTo(el, { scaleY: 0.86 }, { scaleY: 1, duration: 0.05, ease: 'none' }, i * 0.055);
    }
    tl.add(() => { el.textContent = final; el.classList.remove('is-rolling'); }, flips * 0.055);
    return tl;
  }

  /* ---------- Hero intro ---------- */
  const h1 = S.splitWords($('.hero-h1'));
  const tiles = $$('.flap:not(.flap--gap)');
  tiles.forEach((t) => { t.textContent = ''; });

  const float = gsap.to('.pass', { y: -14, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1, paused: true });
  const intro = gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.15 });
  intro
    .from('.nav > *', { y: -16, opacity: 0, duration: 1, stagger: 0.06 }, 0)
    .from('.hero-meta > *', { y: 20, opacity: 0, duration: 1, stagger: 0.08 }, 0.1)
    .from('.flap', { y: 30, opacity: 0, duration: 0.9, stagger: 0.05 }, 0.15);
  tiles.forEach((t, i) => intro.add(flap(t), 0.35 + i * 0.09));
  intro
    .from($$('.wi', h1), { yPercent: 110, duration: 1.3, stagger: 0.06 }, 0.9)
    .from('.hero-sub, .hero-actions', { y: 30, opacity: 0, duration: 1.2, stagger: 0.1 }, 1.2)
    .from('.pass', { y: 180, rotation: 18, opacity: 0, duration: 1.8, ease: 'expo.out' }, 0.5)
    .add(() => float.play());
  done();
  S.finishLoading();

  S.reveals();

  /* ---------- Scroll scenes ---------- */
  gsap.matchMedia().add({ desktop: '(min-width: 901px)' }, (ctx) => {
    const { desktop } = ctx.conditions;

    if (desktop) {
      const hero = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
      gsap.to('.hero-pass', { yPercent: -14, ease: 'none', scrollTrigger: hero });
      gsap.to('.hero-bg', { xPercent: -8, ease: 'none', scrollTrigger: hero });
    }

    // flight info: the highlighter runs under the key phrases
    $$('.info mark').forEach((m) => gsap.fromTo(m, { '--mk': '0%' }, {
      '--mk': '100%', ease: 'none',
      scrollTrigger: { trigger: m, start: 'top 85%', end: 'top 55%', scrub: true },
    }));
    ScrollTrigger.create({ trigger: '.data', start: 'top 85%', once: true, onEnter: () => $$('.data dt').forEach((dt, i) => scramble(dt, 1).delay(i * 0.12)) });

    // classes: tickets slide out of the printer
    gsap.set('.ticket', { y: 80, opacity: 0 });
    ScrollTrigger.batch('.ticket', {
      start: 'top 88%', once: true,
      onEnter: (b) => gsap.to(b, { y: 0, opacity: 1, duration: 1.2, ease: 'expo.out', stagger: 0.12, clearProps: 'transform,opacity' }),
    });

    // board: each row rolls in as it arrives
    $$('.board-row:not(.board-row--head)').forEach((row) => ScrollTrigger.create({
      trigger: row, start: 'top 90%', once: true,
      onEnter: () => $$('.scr', row).forEach((el, i) => scramble(el, 0.8 + i * 0.12)),
    }));

    // passport: the strip slides sideways while the page scrolls, stamps land on cue
    const wrap = $('.strip-wrap');
    const strip = $('.strip');
    wrap.classList.add('is-driven');
    const slide = gsap.to(strip, {
      x: () => -Math.max(0, strip.scrollWidth - wrap.clientWidth), ease: 'none',
      scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
    });
    $$('.stamp').forEach((st) => gsap.from(st, {
      scale: 2.6, opacity: 0, duration: 0.45, ease: 'power4.in',
      scrollTrigger: { trigger: st, containerAnimation: slide, start: 'left 78%' },
    }));

    // crew: the badge swings in on its lanyard, then sways with the scroll
    gsap.from('.badge', { rotation: -12, duration: 2.6, ease: 'elastic.out(1, 0.25)', scrollTrigger: { trigger: '.badge-wrap', start: 'top 75%' } });
    gsap.set('.badge-wrap', { transformOrigin: '50% -80px' });
    const sway = gsap.quickTo('.badge-wrap', 'rotation', { duration: 1.4, ease: 'elastic.out(1, 0.3)' });
    let rest;
    ScrollTrigger.create({
      trigger: '.crew', start: 'top bottom', end: 'bottom top',
      onUpdate: (self) => {
        sway(gsap.utils.clamp(-6, 6, self.getVelocity() / -320));
        clearTimeout(rest);
        rest = setTimeout(() => sway(0), 140);
      },
    });

    // cargo: the photo is unwrapped, the label slapped on
    gsap.from('.cargo-photo', { clipPath: 'inset(100% 0 0 0)', duration: 1.5, ease: 'expo.inOut', scrollTrigger: { trigger: '.cargo-photo', start: 'top 80%' } });
    gsap.from('.cargo-label', { x: -30, rotation: -6, opacity: 0, duration: 0.9, ease: 'back.out(2)', delay: 0.9, scrollTrigger: { trigger: '.cargo-photo', start: 'top 80%' } });

    gsap.from('.footer-big', { yPercent: 35, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });

    return () => wrap.classList.remove('is-driven');
  });

  /* ---------- The boarding pass leans toward the cursor ---------- */
  if (fine) {
    const pass = $('.pass');
    const rx = gsap.quickTo(pass, 'rotationX', { duration: 0.8, ease: 'power3' });
    const ry = gsap.quickTo(pass, 'rotationY', { duration: 0.8, ease: 'power3' });
    $('.hero').addEventListener('mousemove', (e) => {
      ry((e.clientX / window.innerWidth - 0.5) * 14);
      rx(-(e.clientY / window.innerHeight - 0.5) * 10);
    });
    $('.hero').addEventListener('mouseleave', () => { rx(0); ry(0); });
  }
})();
