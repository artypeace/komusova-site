/* The Saigon Issue: magazine scenes on top of shared/core.js */
(() => {
  const S = window.Site;
  const nav = S.$('.nav');
  if (!S.hasGsap) return;
  const { $, $$, reduce, fine } = S;


  // the small logo appears in the nav once the masthead has scrolled away
  nav.classList.add('hide-logo');
  ScrollTrigger.create({
    trigger: '.masthead', start: 'bottom 64px',
    onEnter: () => nav.classList.remove('hide-logo'),
    onLeaveBack: () => nav.classList.add('hide-logo'),
  });

  /* ---------- Cover intro ---------- */
  const intro = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } });
  intro
    .from('.cover-strip', { clipPath: 'inset(0 50% 0 50%)', duration: 1.4, ease: 'expo.inOut' }, 0)
    .from('.masthead .mast-in', { yPercent: 100, duration: 1.6 }, 0.2)
    .from('.cover-photo-in', { clipPath: 'inset(0 0 100% 0)', duration: 1.5, ease: 'expo.inOut' }, 0.35)
    .from('.cover-photo-in img', { scale: 1.35, duration: 2.2 }, 0.45)
    .from('.cover-lines > *', { y: 30, opacity: 0, duration: 1.1, stagger: 0.07 }, 0.9)
    .from('.sticker', { scale: 0, rotate: -200, duration: 1.3, ease: 'back.out(1.6)' }, 1.3)
    .from('.nav > *', { y: -16, opacity: 0, duration: 1, stagger: 0.06 }, 1.0);

  if (reduce) {
    intro.progress(1);
  } else {
    const pre = $('.preloader');
    const num = $('.pre-num');
    const p = { v: 0 };
    gsap.timeline()
      .from('.pre-issue, .pre-line', { y: 40, opacity: 0, duration: 0.9, stagger: 0.1, ease: 'expo.out' }, 0)
      .to(p, { v: 1, duration: 1.3, ease: 'power2.inOut', onUpdate: () => pre.style.setProperty('--p', p.v) }, 0.2)
      .add(() => { num.textContent = '01'; }, 1.5)
      .to(pre, { xPercent: -100, rotateY: -18, skewY: 2, duration: 1.1, ease: 'expo.inOut', transformPerspective: 1600 }, 1.85)
      .add(() => intro.play(), 1.95)
      .add(S.finishLoading);
  }

  S.reveals();

  /* ---------- Scroll scenes ---------- */
  gsap.matchMedia().add({ motion: '(prefers-reduced-motion: no-preference)', desktop: '(min-width: 901px)' }, (ctx) => {
    const { motion, desktop } = ctx.conditions;
    if (!motion) return;

    if (desktop) {
      const cov = { trigger: '.cover', start: 'top top', end: 'bottom top', scrub: true };
      gsap.to('.masthead', { yPercent: -35, ease: 'none', scrollTrigger: cov });
      gsap.to('.cover-photo', { yPercent: 8, ease: 'none', scrollTrigger: cov });
    }

    // contents: page numbers count up like a printer’s proof
    $$('.toc-page').forEach((el) => {
      const target = +el.dataset.page;
      const o = { v: 0 };
      gsap.to(o, {
        v: target, duration: 1.4, ease: 'power3.out',
        onUpdate: () => { el.textContent = String(Math.round(o.v)).padStart(3, '0'); },
        scrollTrigger: { trigger: el, start: 'top 88%' },
      });
    });
    gsap.from('.toc-row', { y: 40, opacity: 0, duration: 1.1, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: '.toc', start: 'top 82%' } });

    // letter photo
    gsap.from('.letter-photo-in', { clipPath: 'inset(100% 0 0 0)', duration: 1.5, ease: 'expo.inOut', scrollTrigger: { trigger: '.letter-photo', start: 'top 80%' } });

    // photo story: each picture is unveiled, then drifts
    $$('.story-grid figure > a').forEach((a, i) => {
      gsap.from(a, { clipPath: 'inset(0 0 100% 0)', duration: 1.4, ease: 'expo.inOut', delay: (i % 2) * 0.1, scrollTrigger: { trigger: a, start: 'top 85%' } });
      if (desktop) gsap.fromTo($('img', a), { yPercent: -6, scale: 1.12 }, { yPercent: 6, scale: 1.12, ease: 'none', scrollTrigger: { trigger: a, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    // itinerary: the blue line fills as you read
    gsap.fromTo('.it-line-fill', { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.it-wrap', start: 'top 60%', end: 'bottom 60%', scrub: true } });
    $$('.it-item').forEach((it) => ScrollTrigger.create({
      trigger: it, start: 'top 60%',
      onEnter: () => it.classList.add('is-on'), onLeaveBack: () => it.classList.remove('is-on'),
    }));

    gsap.from('.svc-photo', { clipPath: 'inset(0 0 100% 0)', duration: 1.5, ease: 'expo.inOut', scrollTrigger: { trigger: '.svc-photo', start: 'top 80%' } });

    gsap.from('.footer-mast .mast-in', { yPercent: 100, duration: 1.5, ease: 'expo.out', scrollTrigger: { trigger: '.footer-mast', start: 'top 95%' } });
  });

  /* ---------- The cover tilts toward the cursor ---------- */
  if (fine && !reduce) {
    const card = $('.cover-photo-in');
    const rx = gsap.quickTo(card, 'rotateX', { duration: 0.8, ease: 'power3' });
    const ry = gsap.quickTo(card, 'rotateY', { duration: 0.8, ease: 'power3' });
    $('.cover').addEventListener('mousemove', (e) => {
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      ry(x * 8);
      rx(-y * 6);
    });
    $('.cover').addEventListener('mouseleave', () => { rx(0); ry(0); });
  }
})();
