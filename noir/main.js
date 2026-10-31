/* Noir: cinematic scenes on top of shared/core.js */
(() => {
  const S = window.Site;
  if (!S.hasGsap) return;
  const { $, $$, reduce, fine } = S;

  /* ---------- Splitting ---------- */
  $$('.manifesto-text').forEach((el) => S.splitWords(el, 'mw'));
  $$('.hw').forEach(S.splitChars);
  const preChars = S.splitChars($('.pre-word'));
  const footChars = S.splitChars($('.footer-word'));

  /* ---------- Hero intro ---------- */
  const intro = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } });
  intro
    .from('.hero-frame', { clipPath: 'inset(100% 0% 0% 0% round 50vw 50vw 6px 6px)', duration: 1.6, ease: 'expo.inOut' }, 0)
    .from('.hero-frame img', { scale: 1.45, duration: 2.2 }, 0.1)
    .from('.hero .ch', { yPercent: 110, duration: 1.5, stagger: 0.045 }, 0.55)
    .from('.badge', { scale: 0, rotate: -120, duration: 1.4 }, 1.1)
    .from('.hero-top > *, .hero-bottom > *', { y: 24, opacity: 0, duration: 1.2, stagger: 0.08 }, 1.0)
    .from('.nav > *', { y: -20, opacity: 0, duration: 1.2, stagger: 0.06 }, 1.1);

  /* ---------- Preloader ---------- */
  if (reduce) {
    intro.progress(1);
  } else {
    const count = { v: 0 };
    const num = $('.pre-num');
    gsap.timeline()
      .from(preChars, { yPercent: 110, duration: 1.1, stagger: 0.05, ease: 'expo.out' }, 0)
      .to(count, { v: 100, duration: 1.7, ease: 'power2.inOut', onUpdate: () => { num.textContent = String(Math.round(count.v)).padStart(3, '0'); } }, 0)
      .to(preChars, { yPercent: -110, duration: 0.7, stagger: 0.03, ease: 'expo.in' }, 1.75)
      .to('.preloader', { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, 2.15)
      .add(() => intro.play(), 2.3)
      .add(S.finishLoading);
  }

  S.reveals();

  /* ---------- Scroll scenes ---------- */
  gsap.matchMedia().add({ motion: '(prefers-reduced-motion: no-preference)', desktop: '(min-width: 901px)' }, (ctx) => {
    const { motion, desktop } = ctx.conditions;
    if (!motion) return;

    // hero: words drift apart, photo sinks
    const heroST = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
    gsap.to('.hw--l', { xPercent: -28, ease: 'none', scrollTrigger: heroST });
    gsap.to('.hw--r', { xPercent: 28, ease: 'none', scrollTrigger: heroST });
    gsap.fromTo('.hero-frame img', { yPercent: 0, scale: 1 }, { yPercent: 10, scale: 1.08, ease: 'none', immediateRender: false, scrollTrigger: heroST });
    gsap.to('.hero-top, .hero-bottom', { opacity: 0, y: -30, ease: 'none', scrollTrigger: { ...heroST, end: '40% top' } });

    // manifesto: words fill in with scroll (one tween per language)
    $$('.manifesto-text').forEach((p) => {
      gsap.fromTo($$('.mw', p), { opacity: 0.14 }, {
        opacity: 1, ease: 'none', stagger: 0.1,
        scrollTrigger: { trigger: '.manifesto-body', start: 'top 78%', end: 'bottom 50%', scrub: true },
      });
    });

    // route: horizontal on desktop, vertical list on phones
    const track = $('.route-track');
    const stops = $$('.stop');
    if (desktop) {
      const stopsEl = $('.stops');
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      // a stop lights up when the drawn line reaches its dot
      const light = () => {
        const tip = gsap.getProperty('.route-line', 'scaleX') * stopsEl.offsetWidth;
        stops.forEach((s) => s.classList.toggle('is-on', tip >= s.offsetLeft + 2));
      };
      gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: '.route', start: 'top top', end: () => '+=' + dist(), scrub: 1, pin: true, invalidateOnRefresh: true, anticipatePin: 1 },
        onUpdate: light,
      })
        .to(track, { x: () => -dist() }, 0)
        .fromTo('.route-line', { scaleX: 0 }, { scaleX: 1 }, 0)
        .to('.route-bg', { xPercent: -30 }, 0);
    } else {
      stops.forEach((s) => ScrollTrigger.create({
        trigger: s, start: 'top 70%',
        onEnter: () => s.classList.add('is-on'), onLeaveBack: () => s.classList.remove('is-on'),
      }));
    }

    // lookbook: columns at different speeds, photos drift inside frames
    if (desktop) {
      const lb = { trigger: '.lb-cols', start: 'top bottom', end: 'bottom top', scrub: true };
      gsap.fromTo('.lb-col:nth-child(1)', { y: 60 }, { y: -60, ease: 'none', scrollTrigger: lb });
      gsap.fromTo('.lb-col:nth-child(2)', { y: 160 }, { y: -200, ease: 'none', scrollTrigger: lb });
      gsap.fromTo('.lb-col:nth-child(3)', { y: 20 }, { y: -100, ease: 'none', scrollTrigger: lb });
    }
    $$('.lb-img img').forEach((img) => {
      gsap.fromTo(img, { yPercent: -13 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    // about: arch opens upward
    gsap.from('.about-figure', {
      clipPath: 'inset(100% 0% 0% 0% round 50vw 50vw 6px 6px)', duration: 1.6, ease: 'expo.inOut',
      scrollTrigger: { trigger: '.about-figure', start: 'top 78%' },
    });
    gsap.from('.about-figure img', { scale: 1.3, duration: 2, ease: 'expo.out', scrollTrigger: { trigger: '.about-figure', start: 'top 78%' } });

    // buyer image
    gsap.from('.buyer-img', {
      clipPath: 'inset(0% 0% 100% 0%)', duration: 1.5, ease: 'expo.inOut',
      scrollTrigger: { trigger: '.buyer-img', start: 'top 80%' },
    });

    // footer wordmark
    gsap.from(footChars, {
      yPercent: 105, duration: 1.3, ease: 'expo.out', stagger: 0.04,
      scrollTrigger: { trigger: '.footer-word', start: 'top 95%' },
    });

    // marquee speeds up with scroll velocity
    const tracks = $$('.marquee-track');
    ScrollTrigger.create({
      trigger: '.marquee', start: 'top bottom', end: 'bottom top',
      onUpdate: (self) => {
        const v = Math.min(Math.abs(self.getVelocity()) / 600, 4);
        tracks.forEach((t) => t.getAnimations().forEach((a) => { a.playbackRate = 1 + v; }));
      },
    });
  });

  /* ---------- Tour preview follows the cursor ---------- */
  if (fine && !reduce) {
    const preview = $('.tour-preview');
    const pImgs = $$('img', preview);
    gsap.set(preview, { xPercent: -50, yPercent: -50, scale: 0.6 });
    const px = gsap.quickTo(preview, 'x', { duration: 0.7, ease: 'power3' });
    const py = gsap.quickTo(preview, 'y', { duration: 0.7, ease: 'power3' });
    const list = $('.tours-list');
    list.addEventListener('mousemove', (e) => { px(e.clientX); py(e.clientY); });
    $$('.tour').forEach((t, i) => t.addEventListener('mouseenter', (e) => {
      pImgs.forEach((im, j) => im.classList.toggle('on', j === i));
      if (gsap.getProperty(preview, 'opacity') < 0.05) gsap.set(preview, { x: e.clientX, y: e.clientY });
      gsap.to(preview, { opacity: 1, scale: 1, duration: 0.6, ease: 'expo.out' });
    }));
    list.addEventListener('mouseleave', () => gsap.to(preview, { opacity: 0, scale: 0.6, duration: 0.45, ease: 'power3.out' }));
  }
})();
