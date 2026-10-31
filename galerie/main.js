/* Выставка: gallery scenes on top of shared/core.js */
(() => {
  const S = window.Site;
  const root = S.root;
  const done = () => root.classList.add('ready');
  const { $, $$, reduce, fine } = S;

  /* ---------- Gallery light: a spotlight over the entrance wall ---------- */
  const hero = $('.hero');
  const frame = $('.frame--hero');
  const light = { x: 0.7, y: 0.35 };
  const centre = { x: 0.75, y: 0.6 };
  function measure() {
    const h = hero.getBoundingClientRect();
    const r = frame.getBoundingClientRect();
    centre.x = (r.left + r.width / 2 - h.left) / h.width;
    centre.y = (r.top + r.height / 2 - h.top) / h.height;
  }
  function paint() {
    hero.style.setProperty('--lx', (light.x * 100).toFixed(2) + '%');
    hero.style.setProperty('--ly', (light.y * 100).toFixed(2) + '%');
    // the frame's shadow falls away from the light
    frame.style.setProperty('--sx', ((centre.x - light.x) * 70).toFixed(1) + 'px');
    frame.style.setProperty('--sy', (10 + (centre.y - light.y) * 50).toFixed(1) + 'px');
  }
  measure();
  paint();
  window.addEventListener('resize', measure);

  /* ---------- Works: a frame and its catalogue line light up together ---------- */
  if (fine) {
    const hang = $('.hang');
    const cat = $('.catalogue');
    $$('.frame', hang).forEach((f) => {
      const li = $(`li[data-no="${f.dataset.no}"]`, cat);
      const set = (on) => {
        hang.classList.toggle('is-hover', on);
        cat.classList.toggle('is-hover', on);
        f.classList.toggle('is-on', on);
        li.classList.toggle('is-on', on);
      };
      [f, li].forEach((el) => {
        el.addEventListener('mouseenter', () => set(true));
        el.addEventListener('mouseleave', () => set(false));
      });
    });
  }

  if (!S.hasGsap || reduce) { done(); return; }

  /* ---------- Screening room: the timecode runs while the screen is in view ---------- */
  const tc = $('.tc');
  let frames = 0;
  let rolling = false;
  new IntersectionObserver(([e]) => { rolling = e.isIntersecting; }).observe($('.screen'));
  const pad = (n) => String(n).padStart(2, '0');
  setInterval(() => {
    if (!rolling) return;
    frames++;
    const s = Math.floor(frames / 25);
    tc.textContent = `00:${pad(Math.floor(s / 60))}:${pad(s % 60)}:${pad(frames % 25)}`;
  }, 40);

  /* ---------- Hero: the lights come on ---------- */
  const h1 = S.splitWords($('.hero-h1'));
  gsap.timeline({ delay: 0.1 })
    .fromTo('.lights', { opacity: 1 }, { opacity: 0.6, duration: 0.06, ease: 'none' }, 0.35)
    .to('.lights', { opacity: 1, duration: 0.05, ease: 'none' })
    .to('.lights', { opacity: 0.35, duration: 0.06, ease: 'none' }, '+=0.14')
    .to('.lights', { opacity: 0.85, duration: 0.05, ease: 'none' })
    .to('.lights', { opacity: 0, duration: 1, ease: 'power2.out' })
    .from('.frame--hero', { y: -24, duration: 1.6, ease: 'expo.out' }, 0.75)
    .from($$('.wi', h1), { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.06 }, 0.95)
    .from('.hero-text .kicker, .hero-sub, .hero-actions, .hero .wall-label', { y: 20, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.08 }, 1.2)
    .from('.hero-info > div', { y: 16, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.08 }, 1.35)
    .from('.nav > *', { y: -14, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06 }, 1.35)
    .add(measure);
  done();
  S.finishLoading();

  // without a mouse, or once it rests, the light drifts on its own
  const target = { x: 0.7, y: 0.35 };
  let moved = 0;
  let heroOn = true;
  new IntersectionObserver(([e]) => { heroOn = e.isIntersecting; }).observe(hero);
  if (fine) {
    hero.addEventListener('mousemove', (e) => {
      const r = hero.getBoundingClientRect();
      target.x = (e.clientX - r.left) / r.width;
      target.y = (e.clientY - r.top) / r.height;
      moved = Date.now();
    });
  }
  gsap.ticker.add(() => {
    if (!heroOn) return;
    if (Date.now() - moved > 2500) {
      const t = performance.now() / 1000;
      target.x = 0.6 + Math.sin(t * 0.3) * 0.25;
      target.y = 0.4 + Math.sin(t * 0.47) * 0.16;
    }
    light.x += (target.x - light.x) * 0.05;
    light.y += (target.y - light.y) * 0.05;
    paint();
  });

  /* ---------- Pinned rooms first, so everything below them is measured after ---------- */
  gsap.matchMedia().add({ desktop: '(min-width: 901px)', mobile: '(max-width: 900px)' }, (ctx) => {
    const { desktop } = ctx.conditions;
    const floor = $('.floor');
    const cells = $$('.cell', floor);
    const here = $('.here', floor);
    const mark = (n) => cells.forEach((c, i) => { c.classList.toggle('is-here', i === n); c.classList.toggle('is-past', i < n); });
    floor.classList.add('is-live');
    mark(0);

    if (desktop) {
      // the halls slide past like a corridor
      const halls = $('.halls');
      const track = $('.halls-track');
      halls.classList.add('is-pinned');
      const dist = () => track.scrollWidth - window.innerWidth;
      const corridor = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: halls, pin: true, scrub: 0.8, start: 'top top', end: () => '+=' + dist(), invalidateOnRefresh: true,
          onUpdate: (self) => gsap.set('.halls-line i', { scaleX: self.progress }),
        },
      });
      const count = $('.halls-count');
      ['I', 'II', 'III', 'IV'].forEach((n, i) => {
        const room = $$('.room, .door', track)[i];
        ScrollTrigger.create({
          trigger: room, containerAnimation: corridor, start: 'left 55%', end: 'right 55%',
          onToggle: (self) => { if (self.isActive) count.textContent = n; },
        });
        const img = $('.frame-in img', room);
        if (img) {
          gsap.fromTo(img, { scale: 1.3 }, {
            scale: 1, ease: 'none',
            scrollTrigger: { trigger: room, containerAnimation: corridor, start: 'left right', end: 'center center', scrub: true },
          });
        }
      });

      // floor plan: "you are here" walks the corridors, room by room
      const at = (i) => ({
        x: () => cells[i].offsetLeft + cells[i].offsetWidth - here.offsetWidth - 16,
        y: () => cells[i].offsetTop + 16,
      });
      const walk = gsap.timeline({
        scrollTrigger: {
          trigger: '.plan', start: 'top top', end: '+=170%', pin: true, scrub: 0.6, invalidateOnRefresh: true,
          onUpdate: (self) => mark(Math.round(self.progress * (cells.length - 1))),
        },
      });
      walk.set(here, at(0));
      for (let i = 1; i < cells.length; i++) {
        walk.to(here, { x: at(i).x, duration: 0.5, ease: 'power1.inOut' })
          .to(here, { y: at(i).y, duration: 0.5, ease: 'power1.inOut' });
      }
    } else {
      cells.forEach((c, i) => ScrollTrigger.create({
        trigger: c, start: 'top 62%',
        onEnter: () => mark(i), onLeaveBack: () => mark(i - 1),
      }));
    }

    return () => {
      floor.classList.remove('is-live');
      $('.halls').classList.remove('is-pinned');
      mark(-1);
    };
  });

  S.reveals();

  /* ---------- Wall text: the "do not" is crossed out as you read ---------- */
  gsap.from('.sign', { y: 40, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.sign', start: 'top 88%' } });
  gsap.fromTo('.strike', { '--k': 0, color: '#0b0b0b' }, {
    '--k': 1, color: '#b3b2ac', ease: 'none',
    scrollTrigger: { trigger: '.sign', start: 'top 72%', end: 'center 45%', scrub: true },
  });

  /* ---------- Works: the spotlights switch on one by one ---------- */
  gsap.set('.hang .frame', { filter: 'grayscale(1) brightness(.55)' });
  ScrollTrigger.batch('.hang .frame', {
    start: 'top 85%', once: true,
    onEnter: (b) => gsap.to(b, { filter: 'grayscale(0) brightness(1)', duration: 0.9, ease: 'power2.out', stagger: { each: 0.14, from: 'random' }, clearProps: 'filter' }),
  });

  gsap.from('.screen', { scale: 0.9, opacity: 0, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '.screen', start: 'top 80%' } });
  gsap.from('.frame--curator', { y: -30, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.frame--curator', start: 'top 80%' } });
  gsap.from('.ticket', { y: 60, rotation: -2, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '.ticket', start: 'top 85%' } });
  gsap.from('.footer-word', { yPercent: 40, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });
})();
