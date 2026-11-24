(function () {
  'use strict';
  var $ = function (s) { return document.getElementById(s); };
  var cfg = window.VA_CONFIG || {};
  var money = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };
  var esc = function (s) { var d = document.createElement('div'); d.textContent = String(s); return d.innerHTML; };

  /* Estimator: live backend prices, falling back to the prices embedded at build time */
  var data = []; try { data = JSON.parse($('va-pricing').textContent); } catch (e) {}
  function est() {
    var cat = data.filter(function (c) { return c.key === $('e-cat').value; })[0]; if (!cat) return;
    var p = cat.plans.filter(function (x) { return x.name === $('e-plan').value; })[0] || cat.plans[0];
    var care = $('e-care').checked, h = '<strong>' + esc(p.name) + '</strong><br>';
    if (p.once != null) h += money(p.once) + ' one-time' + (care && p.month != null ? ' + ' + money(p.month) + ' per month care plan' : '');
    else h += money(p.month) + ' per month';
    $('e-out').innerHTML = h;
  }
  function plans() { var cat = data.filter(function (c) { return c.key === $('e-cat').value; })[0]; $('e-plan').innerHTML = cat ? cat.plans.map(function (p) { return '<option>' + esc(p.name) + '</option>'; }).join('') : ''; est(); }
  fetch((cfg.backend || '').replace(/\/$/, '') + '/api/pricing').then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { if (j && j.categories) { data = j.categories; plans(); } }).catch(function () {});
  $('e-cat').addEventListener('change', plans); $('e-plan').addEventListener('change', est); $('e-care').addEventListener('change', est); plans();

  /* Discovery: creates a record in the existing lead system, with consent */
  var disc = $('disc');
  disc.addEventListener('submit', function (e) {
    e.preventDefault(); var f = new FormData(disc), m = disc.querySelector('.msg');
    if (!f.get('consent')) { m.className = 'msg err'; m.textContent = 'Please tick the box so we may store your answers.'; return; }
    var o = {}; f.forEach(function (v, k) { o[k] = v; }); o.consent = true; o.summary = 'Experience Studio discovery form';
    m.className = 'msg'; m.textContent = 'Sending…';
    window.vaPost('/api/leads', o).then(function () { disc.reset(); m.className = 'msg ok'; m.textContent = 'Thank you. We will reply within two working days.'; window.vaTrack && window.vaTrack('generate_lead', { method: 'studio_discovery' }); setTimeout(function () { location.href = '/thank-you/'; }, 700); })
      .catch(function (err) { m.className = 'msg err'; m.textContent = err.message; });
  });

  /* Health check: the server fetches the page and returns measured values only */
  $('health-form').addEventListener('submit', function (e) {
    e.preventDefault(); var out = $('h-out'); out.textContent = 'Checking…';
    window.vaPost('/api/tools/health-check', { url: $('h-url').value }).then(function (r) {
      var rows = [['Final address', r.finalUrl], ['HTTP status', r.status], ['HTTPS', r.https ? 'Yes' : 'No'], ['Response time', r.ms + ' ms'], ['HTML size', r.bytes + ' bytes'], ['Title', r.title || 'Missing'], ['Title length', r.title ? r.title.length + ' characters' : 'n/a'], ['Meta description', r.description || 'Missing'], ['H1 headings', r.h1], ['Canonical', r.canonical || 'Missing'], ['Images', r.images + ' (' + r.imagesNoAlt + ' without alt text)'], ['Viewport meta', r.viewport ? 'Present' : 'Missing']];
      out.innerHTML = '<table class="kv">' + rows.map(function (x) { return '<tr><th scope="row">' + esc(x[0]) + '</th><td>' + esc(x[1]) + '</td></tr>'; }).join('') + '</table><p class="note">Measured from one request to the page. This is not a full audit.</p>';
    }).catch(function (err) { out.textContent = err.message; });
  });

  /* ROI: arithmetic on the visitor's own inputs */
  function roi() {
    var v = +$('r-v').value, c = +$('r-c').value / 100, w = +$('r-w').value / 100, s = +$('r-s').value, enq = v * c, cust = enq * w;
    $('r-out').innerHTML = 'About <strong>' + enq.toFixed(1) + '</strong> enquiries and <strong>' + cust.toFixed(1) + '</strong> customers a month, worth <strong>' + money(cust * s) + '</strong> a month on these assumptions.<br><small>Illustrative only, not a forecast.</small>';
  }
  ['r-v', 'r-c', 'r-w', 'r-s'].forEach(function (i) { $(i).addEventListener('input', roi); }); roi();

  /* Brand preview with a real contrast calculation */
  function lum(h) { var c = [1, 3, 5].map(function (i) { var v = parseInt(h.substr(i, 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
  function brand() {
    var bg = $('b-bg').value, fg = $('b-fg').value, ac = $('b-ac').value, p = $('b-prev');
    p.style.background = bg; p.style.color = fg; p.querySelector('span').style.background = ac; p.querySelector('span').style.color = bg;
    var a = lum(bg), b = lum(fg), r = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    $('b-contrast').textContent = 'Text contrast ratio ' + r.toFixed(1) + ':1. ' + (r >= 4.5 ? 'Meets the WCAG AA guideline for body text.' : 'Below the WCAG AA guideline of 4.5:1 for body text.');
  }
  ['b-bg', 'b-fg', 'b-ac'].forEach(function (i) { $(i).addEventListener('input', brand); }); brand();
})();
