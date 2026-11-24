/* Vintage Advertising 2.0: navigation, choreography, forms, consent-gated analytics.
   Rules: animate transform and opacity only; respect prefers-reduced-motion; never block content if a library fails. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var cfg = window.VA_CONFIG || {};
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };

  /* ---------- analytics: nothing loads or fires without an ID AND the visitor's consent ---------- */
  var CONSENT_KEY = 'va_consent';
  function consent() { try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; } }
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  var analyticsOn = false;
  function startAnalytics() {
    if (analyticsOn || !cfg.ga4 || consent() !== 'granted') return;
    analyticsOn = true;
    var s = doc.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(cfg.ga4);
    doc.head.appendChild(s);
    gtag('js', new Date()); gtag('config', cfg.ga4, { anonymize_ip: true });
  }
  /** Fire one named conversion event. Does nothing when analytics is off, so events are never duplicated or sent without consent. */
  window.vaTrack = function (name, params) { if (analyticsOn) gtag('event', name, params || {}); };
  function consentBar() {
    if (!cfg.ga4 || consent()) { startAnalytics(); return; }
    var bar = doc.createElement('div');
    bar.className = 'consent-bar'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Analytics choice');
    bar.innerHTML = '<p>We use privacy-friendly analytics to see which pages help visitors. Nothing is measured unless you agree.</p><div><button type="button" data-c="granted">Allow</button><button type="button" data-c="denied">No thanks</button></div>';
    doc.body.appendChild(bar);
    bar.addEventListener('click', function (e) {
      var v = e.target && e.target.getAttribute && e.target.getAttribute('data-c'); if (!v) return;
      try { localStorage.setItem(CONSENT_KEY, v); } catch (x) { /* storage blocked: choice lasts for this page only */ }
      bar.remove(); startAnalytics();
    });
  }

  /* ---------- header, menu ---------- */
  var header = $('.site-header'), lastY = 0, ticking = false;
  function onScroll() {
    var y = window.scrollY || 0;
    header.classList.toggle('is-scrolled', y > 24);
    if (!root.classList.contains('menu-open')) header.classList.toggle('is-hidden', y > lastY && y > 220);
    lastY = y; ticking = false;
  }
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  var btn = $('.menu-btn'), panel = $('.menu-panel');
  var inertEls = $$('main, footer');
  function setMenu(open) {
    root.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    inertEls.forEach(function (el) { if (open) el.setAttribute('inert', ''); else el.removeAttribute('inert'); });
    $$('a.m-link', panel).forEach(function (a, i) { a.style.transitionDelay = open ? (0.12 + i * 0.06) + 's' : '0s'; });
    if (open) { var first = $('a', panel); if (first) setTimeout(function () { first.focus(); }, 80); } else btn.focus();
  }
  if (btn && panel) {
    btn.addEventListener('click', function () { setMenu(!root.classList.contains('menu-open')); });
    panel.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('a')) setMenu(false); });
    doc.addEventListener('keydown', function (e) {
      if (!root.classList.contains('menu-open')) return;
      if (e.key === 'Escape') { setMenu(false); return; }
      if (e.key === 'Tab') {   // keep focus inside the open menu
        var f = $$('a,button', panel).concat([btn]).filter(function (el) { return el.offsetParent !== null || el === btn; });
        var i = f.indexOf(doc.activeElement);
        if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
    addEventListener('resize', function () { if (innerWidth > 960 && root.classList.contains('menu-open')) setMenu(false); });
  }

  /* ---------- forms: real endpoints, honeypot, clear messages ---------- */
  function backend() { return (cfg.backend || '').replace(/\/$/, ''); }
  function post(path, data) {
    return fetch(backend() + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var e = new Error((j && j.error && j.error.message) || 'Something went wrong. Please try again.'); e.fields = j && j.error && j.error.fields; throw e; } return j; }); });
  }
  window.vaPost = post;
  $$('form[data-contact]').forEach(function (form) {
    var msg = $('.msg', form), submit = $('button[type=submit]', form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = new FormData(form);
      if (!d.get('consent')) { msg.className = 'msg err'; msg.textContent = 'Please tick the box so we may reply to you.'; return; }
      submit.disabled = true; msg.className = 'msg'; msg.textContent = 'Sending…';
      post('/api/contact', { name: d.get('name'), email: d.get('email'), service: d.get('service'), message: d.get('message'), website: d.get('website') })
        .then(function () { form.reset(); msg.className = 'msg ok'; msg.textContent = 'Thank you. We reply within two working days.'; window.vaTrack('generate_lead', { method: 'contact_form', service: d.get('service') }); setTimeout(function () { location.href = '/thank-you/'; }, 700); })
        .catch(function (err) { msg.className = 'msg err'; msg.textContent = err.message + ' You can also write to ' + (cfg.email || 'us') + '.'; })
        .then(function () { submit.disabled = false; });
    });
  });
  $$('[data-track]').forEach(function (a) { a.addEventListener('click', function () { window.vaTrack(a.getAttribute('data-track'), { page: location.pathname }); }); });

  /* ---------- choreography ---------- */
  function ready() {
    var g = window.gsap, ST = window.ScrollTrigger;
    if (!g || !ST || reduce) { root.classList.remove('js-anim'); return; }
    g.registerPlugin(ST);
    window.__vaReady = true;
    var intro = !root.classList.contains('no-intro');
    var delay = intro ? 1.95 : 0.1;
    g.defaults({ ease: 'power3.out' });

    // hero entrance, in stages
    var hero = $('.hero');
    if (hero) {
      var tl = g.timeline({ delay: delay });
      tl.to($$('.hero [data-fade]'), { opacity: 1, duration: 1.1, stagger: 0.12 }, 0)
        .to($$('.hero .line>span'), { y: 0, duration: 1.25, stagger: 0.14 }, 0.1)
        .to($$('.hero [data-reveal]'), { opacity: 1, y: 0, duration: 1, stagger: 0.12 }, 0.7);
      // depth: layers drift at different speeds as the page scrolls away
      g.to('.hero__rings', { yPercent: 14, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
      g.to('.hero__glow', { yPercent: 8, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
      g.to('.hero__inner', { yPercent: -5, opacity: 0.35, ease: 'none', scrollTrigger: { trigger: hero, start: '60% top', end: 'bottom top', scrub: true } });
      if (finePointer) {   // optional cursor response, transform only
        var gx = g.quickTo('.hero__glow', 'x', { duration: 1.4, ease: 'power3' }), gy = g.quickTo('.hero__glow', 'y', { duration: 1.4, ease: 'power3' });
        var rx = g.quickTo('.hero__rings svg', 'x', { duration: 2, ease: 'power3' }), ry = g.quickTo('.hero__rings svg', 'y', { duration: 2, ease: 'power3' });
        hero.addEventListener('pointermove', function (e) {
          var px = e.clientX / innerWidth - 0.5, py = e.clientY / innerHeight - 0.5;
          gx(px * 70); gy(py * 50); rx(px * -22); ry(py * -16);
        }, { passive: true });
      }
    }
    // page-top headings of inner pages
    $$('.page-hero .line>span').forEach(function (s, i) { g.to(s, { y: 0, duration: 1.15, delay: 0.15 + i * 0.12 }); });
    $$('.page-hero [data-reveal], .page-hero [data-fade]').forEach(function (el, i) { g.to(el, { opacity: 1, y: 0, duration: 1, delay: 0.25 + i * 0.1 }); });

    // everything else reveals once as it enters
    ST.batch($$('main [data-reveal]').filter(function (el) { return !el.closest('.hero') && !el.closest('.page-hero'); }), {
      start: 'top 90%', once: true,
      onEnter: function (els) { g.to(els, { opacity: 1, y: 0, duration: 1.05, stagger: 0.11, overwrite: true }); }
    });
    $$('main [data-lines]').forEach(function (box) {
      ST.create({ trigger: box, start: 'top 85%', once: true, onEnter: function () { g.to($$('.line>span', box), { y: 0, duration: 1.15, stagger: 0.12 }); } });
    });
    // statement: words brighten as they are read (opacity only, desktop only)
    var words = $$('.statement .w');
    if (words.length && finePointer) {
      g.set(words, { opacity: 0.16 });
      g.to(words, { opacity: 1, stagger: 0.08, ease: 'none', scrollTrigger: { trigger: '.statement', start: 'top 80%', end: 'bottom 45%', scrub: 0.6 } });
    }
    // portfolio: a panel lifts off each image and the image settles
    $$('.work').forEach(function (w) {
      var cover = $('.work__cover', w), art = $('.work__art', w);
      ST.create({ trigger: w, start: 'top 86%', once: true, onEnter: function () {
        g.to(cover, { scaleY: 0, transformOrigin: 'top', duration: 1.25, ease: 'power4.inOut' });
        g.to(art, { scale: 1, duration: 1.8, ease: 'power3.out' });
      } });
    });
    addEventListener('load', function () { ST.refresh(); });
  }

  function init() {
    consentBar();
    if (window.gsap) ready();
    else {   // library still loading, or blocked: wait briefly, then fall back to a fully visible page
      var tries = 0, t = setInterval(function () { tries++; if (window.gsap && window.ScrollTrigger) { clearInterval(t); ready(); } else if (tries > 40) { clearInterval(t); root.classList.remove('js-anim'); } }, 100);
    }
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
})();
