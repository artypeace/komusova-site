/* Shared by all three designs: language, Saigon clock, nav, menu, anchors,
   FAQ, booking form, cursor, magnetic buttons and smooth scroll.
   Each design's main.js adds its own scenes on top through window.Site. */
window.Site = (() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  if (fine) root.classList.add('fine');

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const lang = () => root.dataset.lang;
  const S = { root, reduce, fine, hasGsap, $, $$, lang, lenis: null };
  const langHooks = [];
  S.onLang = (fn) => langHooks.push(fn);

  /* ---------- Smooth scroll ---------- */
  if (hasGsap) {
    gsap.registerPlugin(ScrollTrigger);
    if (!reduce && window.Lenis) {
      S.lenis = new Lenis({ lerp: 0.1 });
      S.lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => S.lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }

  /* ---------- Saigon clock ---------- */
  function tick() {
    let t;
    try {
      t = new Intl.DateTimeFormat('ru-RU', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
    } catch (e) { return; }
    $$('.sgn-time').forEach((el) => { el.textContent = t; });
  }
  setInterval(tick, 20000);

  /* ---------- Language ---------- */
  function setLang(l, save) {
    root.lang = l;
    root.dataset.lang = l;
    const title = root.getAttribute('data-title-' + l);
    const desc = root.getAttribute('data-desc-' + l);
    if (title) document.title = title;
    if (desc) $('meta[name="description"]')?.setAttribute('content', desc);
    $$('[data-ru]').forEach((el) => {
      const v = el.getAttribute('data-' + l);
      if (el.dataset.attr) el.setAttribute(el.dataset.attr, v);
      else el.textContent = v;
    });
    $$('.lang-btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.set === l)));
    $$('a[data-keep-lang]').forEach((a) => { a.href = a.getAttribute('href').split('?')[0] + '?lang=' + l; });
    if (save) { try { localStorage.setItem('komusova-lang', l); } catch (e) {} }
    tick();
    langHooks.forEach((fn) => fn(l));
    if (hasGsap) ScrollTrigger.refresh();
  }
  S.setLang = setLang;
  $$('.lang-btn').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.set, true)));
  setLang(lang(), false);

  /* ---------- Nav: colour of the section under it, hide on scroll down ---------- */
  const nav = $('.nav');
  const themed = $$('[data-nav]');
  const menu = $('#menu');
  const burger = $('.nav-burger');
  let lastY = window.scrollY;
  let ticking = false;

  function updateNav() {
    ticking = false;
    if (!nav) return;
    const y = window.scrollY;
    if (!menu || !menu.classList.contains('is-open')) {
      const probe = 38;
      const sec = themed.find((s) => { const r = s.getBoundingClientRect(); return r.top <= probe && r.bottom > probe; });
      const theme = sec ? sec.dataset.nav : 'dark';
      nav.dataset.theme = theme;
      nav.classList.toggle('is-light', theme === 'light');
      nav.classList.toggle('is-solid', y > 60);
      if (y > 160 && y > lastY + 2) nav.classList.add('is-hidden');
      if (y < lastY - 2 || y <= 160) nav.classList.remove('is-hidden');
    }
    lastY = y;
  }
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(updateNav); } }, { passive: true });
  updateNav();
  S.updateNav = updateNav;

  function setMenu(open) {
    if (!menu) return;
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    burger?.setAttribute('aria-expanded', String(open));
    nav.classList.remove('is-hidden');
    nav.classList.toggle('is-menu', open);
    if (!open) updateNav();
    if (S.lenis) { if (open) S.lenis.stop(); else S.lenis.start(); }
  }
  burger?.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));

  /* ---------- Anchors (+ preselect a format in the form) ---------- */
  const formatSelect = $('select[name="format"]');
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    const target = id === '#top' ? document.body : $(id);
    if (!target) return;
    e.preventDefault();
    if (a.dataset.format && formatSelect) formatSelect.value = a.dataset.format;
    if (menu?.classList.contains('is-open')) setMenu(false);
    const behavior = reduce ? 'auto' : 'smooth';
    if (S.lenis) S.lenis.scrollTo(id === '#top' ? 0 : target, { duration: 1.6 });
    else if (id === '#top') window.scrollTo({ top: 0, behavior });
    else target.scrollIntoView({ behavior });
  });

  /* ---------- FAQ: one answer open at a time ---------- */
  $$('.faq details').forEach((d) => d.addEventListener('toggle', () => {
    if (d.open) $$('.faq details').forEach((o) => { if (o !== d) o.open = false; });
    if (hasGsap) ScrollTrigger.refresh();
  }));

  /* ---------- Toast ---------- */
  const toastEl = $('.toast');
  let toastTimer;
  S.toast = (msg) => {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 4200);
  };

  /* ---------- Booking form → Instagram DM ---------- */
  const form = $('.form');
  if (form) {
    const out = $('.form-out', form);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const val = (k) => String(fd.get(k) || '').trim();
      const ru = lang() === 'ru';
      let ok = true;
      ['name', 'contact'].forEach((k) => {
        const field = form.elements[k].closest('.field');
        const empty = !val(k);
        field.classList.toggle('is-error', empty);
        if (empty && ok) { form.elements[k].focus(); ok = false; }
      });
      if (!ok) { S.toast(ru ? 'Заполните имя и контакт' : 'Please add your name and contact'); return; }

      const fmt = formatSelect ? formatSelect.options[formatSelect.selectedIndex].textContent : '';
      const text = [
        ru ? 'Здравствуйте, Анастасия! Хочу на шопинг-тур в Хошимине.' : 'Hi Anastasia! I’d love a shopping tour in Ho Chi Minh City.',
        (ru ? 'Имя: ' : 'Name: ') + val('name'),
        (ru ? 'Связь: ' : 'Contact: ') + val('contact'),
        val('dates') && (ru ? 'Даты: ' : 'Dates: ') + val('dates'),
        fmt && (ru ? 'Формат: ' : 'Format: ') + fmt,
        val('wishes') && (ru ? 'Пожелания: ' : 'Wishes: ') + val('wishes'),
      ].filter(Boolean).join('\n');

      let copied = false;
      try { await navigator.clipboard.writeText(text); copied = true; } catch (err) {}
      if (out) {
        out.textContent = (ru ? 'Текст заявки:\n\n' : 'Your request:\n\n') + text;
        out.classList.add('is-on');
      }
      window.open('https://ig.me/m/komusova', '_blank', 'noopener');
      S.toast(copied
        ? (ru ? 'Заявка скопирована — вставьте её в чат' : 'Request copied — paste it into the chat')
        : (ru ? 'Скопируйте текст заявки под формой' : 'Copy the request text below the form'));
      if (hasGsap) ScrollTrigger.refresh();
    });
    $$('.field input', form).forEach((i) => i.addEventListener('input', () => i.closest('.field').classList.remove('is-error')));
  }

  /* ---------- Text splitting for reveals ---------- */
  S.splitWords = (el, cls = 'w') => {
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/([ \n\t]+)/).forEach((p) => {
            if (!p) return;
            if (/^[ \n\t]+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            w.className = cls;
            if (cls === 'w') {
              const i = document.createElement('span');
              i.className = 'wi';
              i.textContent = p;
              w.appendChild(i);
            } else w.textContent = p;
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    walk(el);
    return el;
  };
  S.splitChars = (el) => {
    el.innerHTML = [...el.textContent].map((c) => `<span class="ch">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
    return $$('.ch', el);
  };

  /* ---------- Common reveals ---------- */
  S.reveals = () => {
    if (!hasGsap || reduce) return;
    $$('[data-split]').forEach((el) => {
      S.splitWords(el);
      gsap.from($$('.wi', el), {
        yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.05,
        scrollTrigger: { trigger: el, start: 'top 86%' },
      });
    });
    $$('[data-fade]').forEach((el) => {
      gsap.from(el, { y: 36, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
    });
  };

  /* ---------- Pointer niceties ---------- */
  if (fine && !reduce && hasGsap) {
    const cursor = $('.cursor');
    const label = $('.cursor-label');
    if (cursor) {
      const cx = gsap.quickTo(cursor, 'x', { duration: 0.45, ease: 'power3' });
      const cy = gsap.quickTo(cursor, 'y', { duration: 0.45, ease: 'power3' });
      window.addEventListener('mousemove', (e) => { cx(e.clientX); cy(e.clientY); }, { passive: true });
      $$('[data-cursor-ru]').forEach((el) => {
        el.addEventListener('mouseenter', () => { label.textContent = el.getAttribute('data-cursor-' + lang()); cursor.classList.add('is-on'); });
        el.addEventListener('mouseleave', () => cursor.classList.remove('is-on'));
      });
    }
    $$('[data-magnetic]').forEach((el) => {
      const mx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      const my = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        mx((e.clientX - r.left - r.width / 2) * 0.3);
        my((e.clientY - r.top - r.height / 2) * 0.3);
      });
      el.addEventListener('mouseleave', () => { mx(0); my(0); });
    });
  }

  /* ---------- Loading screen helper ---------- */
  S.finishLoading = () => {
    root.classList.add('loaded');
    $('.preloader')?.remove();
    if (S.lenis) S.lenis.start();
  };
  if (!hasGsap || reduce) S.finishLoading();
  else if (S.lenis && $('.preloader')) S.lenis.stop();

  if (hasGsap) {
    window.addEventListener('load', () => ScrollTrigger.refresh());
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
  }
  return S;
})();
