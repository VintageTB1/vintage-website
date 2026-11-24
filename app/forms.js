/* Vintage Advertising: client onboarding forms and project handover screens.
   One file, loaded with <script src="forms.js"></script> after the main page script. It uses window.API and the
   site's own styles, draws its own full-screen panel, and answers these hashes:
   #forms  #forms-<key>  #handover  #handover-<id>  #admin-forms  #admin-forms-<clientId>[-<key>]  #admin-handovers  #admin-handover-<id> */
(function () {
  'use strict';
  if (!window.API || !API.on) return;

  /* ---------- small helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmt(d) { return d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'; }
  function fmtT(d) { return d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'; }
  function toast(t) { var d = document.createElement('div'); d.className = 'toast'; d.textContent = t; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 3800); }
  function money(c) { return '$' + (c / 100).toFixed(2); }
  function kb(n) { return n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'; }
  function q(sel, r) { return (r || document).querySelector(sel); }
  function qa(sel, r) { return Array.prototype.slice.call((r || document).querySelectorAll(sel)); }
  function debounce(fn, ms) { var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }
  function saveBlob(blob) { var u = URL.createObjectURL(blob); window.open(u, '_blank'); setTimeout(function () { URL.revokeObjectURL(u); }, 60000); }
  function openDoc(path) { API.call('GET', path, undefined, { blob: true }).then(saveBlob, function (e) { toast(API.text(e)); }); }
  function pill(text, tone) { return '<span class="vf-pill vf-' + (tone || 'grey') + '">' + esc(text) + '</span>'; }

  var FORM_STATUS = { new: ['Not started', 'grey'], draft: ['In progress', 'blue'], submitted: ['Awaiting review', 'gold'], changes_requested: ['Corrections needed', 'red'], approved: ['Approved', 'green'], prepared: ['Ready to sign', 'blue'], signed: ['Signed, awaiting countersignature', 'gold'], countersigned: ['Signed by both sides', 'green'] };
  var ONB = { not_started: ['Not started', 'grey'], in_progress: ['In progress', 'blue'], awaiting_review: ['Awaiting review', 'gold'], corrections_requested: ['Corrections requested', 'red'], completed: ['Completed', 'green'] };
  var HO_TONE = { in_progress: 'blue', internal_qa: 'blue', awaiting_client_review: 'gold', revisions_required: 'red', awaiting_payment_verification: 'gold', preparing_handover: 'blue', awaiting_client_acceptance: 'gold', handover_completed: 'green', reopened: 'red', closed: 'grey' };
  function fstat(s) { var x = FORM_STATUS[s] || [s, 'grey']; return pill(x[0], x[1]); }

  /* ---------- styles ---------- */
  var css = '.vf-pill{display:inline-block;padding:3px 10px;border-radius:999px;font:500 .62rem var(--font-body);letter-spacing:.12em;text-transform:uppercase;border:1px solid var(--silver-dim);white-space:nowrap}' +
    '.vf-green{color:#7fd6a0;border-color:#7fd6a0}.vf-gold{color:var(--gold);border-color:var(--gold)}.vf-red{color:#ff9b8f;border-color:#ff9b8f}.vf-blue{color:#9cc4ff;border-color:#9cc4ff}.vf-grey{color:var(--muted)}' +
    '.vf-bar{height:8px;background:rgba(192,192,192,.18);border-radius:99px;overflow:hidden;margin:12px 0}.vf-bar i{display:block;height:100%;background:var(--gold)}' +
    '.vf-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;margin-top:14px}' +
    '.vf-card{border:1px solid var(--silver-dim);border-radius:4px;padding:18px;display:flex;flex-direction:column;gap:8px;min-width:0}.vf-card h4{margin:0;font:500 1.05rem var(--font-head)}.vf-card p{margin:0;color:var(--muted);font-size:.88rem}' +
    '.vf-card.vf-locked{opacity:.55}.vf-q{margin:20px 0;max-width:760px}.vf-q label.vf-l{display:block;font:500 .95rem var(--font-body);margin-bottom:6px}.vf-q .vf-h{color:var(--muted);font-size:.82rem;margin:0 0 8px}' +
    '.vf-q input[type=text],.vf-q input[type=email],.vf-q input[type=tel],.vf-q input[type=date],.vf-q input[type=number],.vf-q input[type=url],.vf-q textarea,.vf-q select,.vf-in{width:100%;background:rgba(10,18,38,.6);border:1px solid var(--silver-dim);border-radius:3px;color:var(--white);font:300 .95rem var(--font-body);padding:12px 14px;min-height:44px}' +
    '.vf-q textarea{min-height:110px}.vf-opt{display:flex;gap:10px;align-items:flex-start;padding:8px 0;font-size:.93rem}.vf-opt input{margin-top:4px;flex:none}.vf-err{color:#ff9b8f;font-size:.84rem;margin-top:6px}.vf-q.vf-bad>label.vf-l{color:#ff9b8f}' +
    '.vf-note{border-left:3px solid var(--gold);padding:4px 0 4px 14px;color:var(--silver);font-size:.92rem;max-width:760px}.vf-note p{margin:8px 0}' +
    '.vf-tbl{width:100%;border-collapse:collapse;font-size:.85rem;margin:8px 0}.vf-tbl th,.vf-tbl td{border-bottom:1px solid var(--silver-dim);padding:8px 6px;text-align:left;vertical-align:top}.vf-tbl th{font:500 .6rem var(--font-body);letter-spacing:.14em;text-transform:uppercase;color:var(--silver)}' +
    '.vf-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}.vf-files li{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:6px 0;font-size:.88rem}.vf-files{list-style:none;padding:0;margin:8px 0}' +
    '.vf-sticky{position:sticky;bottom:0;background:var(--navy);padding:14px 0;border-top:1px solid var(--silver-dim);margin-top:30px;display:flex;gap:12px;align-items:center;flex-wrap:wrap}' +
    '.vf-saved{color:var(--muted);font-size:.8rem}.vf-sec{margin-top:36px}.vf-sec h3{font:500 1.4rem var(--font-head);margin:0 0 6px}.vf-sec .vf-i{color:var(--muted);max-width:760px;font-size:.92rem}' +
    '.vf-row{display:flex;gap:10px;flex-wrap:wrap;align-items:end;margin:12px 0}.vf-row>*{flex:1 1 180px;min-width:0}.vf-row>.btn{flex:0 0 auto}' +
    '.vf-hist{list-style:none;margin:10px 0;padding:0;font-size:.86rem}.vf-hist li{padding:8px 0;border-bottom:1px solid var(--silver-dim);color:var(--silver)}.vf-hist small{color:var(--muted);display:block}' +
    '.vf-steps{display:flex;gap:4px;margin:14px 0;flex-wrap:wrap}.vf-steps i{flex:1 1 40px;height:6px;border-radius:3px;background:rgba(192,192,192,.2)}.vf-steps i.on{background:var(--gold)}' +
    '.vf-ck{display:flex;gap:10px;align-items:flex-start;padding:8px 0;border-bottom:1px solid var(--silver-dim);font-size:.9rem}.vf-ck input{margin-top:4px}.vf-ck span{flex:1}.vf-ck em{color:var(--muted);font-style:normal;font-size:.78rem;display:block}' +
    '.vf-link{background:none;border:0;color:var(--gold);cursor:pointer;font:inherit;text-decoration:underline;padding:0}.vf-hub{border:1px solid var(--gold);border-radius:4px;padding:18px;margin:18px 0;max-width:760px}' +
    '#vf-body{padding-top:34px}@media(max-width:600px){.vf-q{margin:16px 0}.vf-tbl.vf-stack thead{display:none}.vf-tbl.vf-stack tr{display:block;border-bottom:1px solid var(--silver-dim);padding:6px 0}.vf-tbl.vf-stack td{display:block;border:0;padding:4px 0}.vf-tbl.vf-stack td[data-l]::before{content:attr(data-l)": ";color:var(--muted);font-size:.74rem}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* ---------- panel ---------- */
  var sec = document.createElement('section');
  sec.className = 'bp'; sec.id = 'vfview'; sec.setAttribute('role', 'dialog'); sec.setAttribute('aria-label', 'Forms and handover');
  sec.innerHTML = '<div class="bp-in"><button class="btn small" type="button" id="vf-x" style="position:fixed;top:calc(18px + env(safe-area-inset-top,0px));right:max(16px,env(safe-area-inset-right,0px));z-index:5">Close</button><div id="vf-body"></div></div>';
  document.body.appendChild(sec);
  var body = q('#vf-body');
  var gen = 0;
  function stale(g) { return g !== gen; }
  q('#vf-x').onclick = function () { history.replaceState(null, '', location.pathname + location.search); close(); };
  function close() { sec.classList.remove('show'); document.body.style.overflow = ''; gen++; }
  function open() { sec.classList.add('show'); document.body.style.overflow = 'hidden'; sec.scrollTop = 0; }
  function go(h) { if (location.hash === h) route(); else location.hash = h; }
  function msg(t, tone) { return '<div class="al-banner">' + t + '</div>'; }
  function fail(e) { body.innerHTML = '<div class="eyebrow">Something went wrong</div><p class="lead">' + esc(API.text(e)) + '</p><p><button class="btn small" data-act="retry">Try again</button></p>'; }
  var lastRoute = null;

  /* ---------- routing ---------- */
  var UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
  function route() {
    var h = decodeURIComponent(location.hash || ''), m;
    var r = null;
    if (h === '#forms') r = ['hub'];
    else if ((m = /^#forms-([a-z]+)$/.exec(h))) r = ['form', m[1]];
    else if (h === '#handover') r = ['hoList'];
    else if ((m = /^#handover-(HO-\d+)$/.exec(h))) r = ['hoView', m[1]];
    else if (h === '#admin-forms') r = ['aList'];
    else if ((m = new RegExp('^#admin-forms-(' + UUID + ')(?:-([a-z]+))?$').exec(h))) r = m[2] ? ['aForm', m[1], m[2]] : ['aClient', m[1]];
    else if (h === '#admin-handovers') r = ['aHoList'];
    else if ((m = /^#admin-handover-(HO-\d+)$/.exec(h))) r = ['aHo', m[1]];
    if (!r) { if (sec.classList.contains('show')) close(); return; }
    lastRoute = r;
    var g = ++gen;
    open();
    body.innerHTML = '<p class="lead">Loading...</p>';
    API.ready.then(function () {
      if (stale(g)) return;
      var u = API.user;
      if (!u) { body.innerHTML = '<div class="eyebrow">Sign in</div><h2>Please sign in first</h2><p class="lead">Sign in to your account to continue.</p><p><a class="btn small gold" href="#portal">Sign in</a></p>'; return; }
      var admin = r[0][0] === 'a';
      if (admin && !(u.role === 'owner' || u.role === 'admin' || u.role === 'staff')) { body.innerHTML = '<h2>Not available</h2><p class="lead">This area is for the Vintage Advertising team.</p>'; return; }
      if (!admin && u.role !== 'client') { body.innerHTML = '<h2>Client area</h2><p class="lead">This is the client view. Use <a class="vf-link" href="#admin-forms">Client Onboarding Management</a> or <a class="vf-link" href="#admin-handovers">Handover Management</a>.</p>'; return; }
      var fn = { hub: hub, form: formPage, hoList: hoList, hoView: hoView, aList: aList, aClient: aClient, aForm: aForm, aHoList: aHoList, aHo: aHo }[r[0]];
      fn(g, r[1], r[2]);
    });
  }
  body.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act="retry"]'); if (b) route();
    var l = e.target.closest('[data-go]'); if (l) { e.preventDefault(); go(l.getAttribute('data-go')); }
  });
  window.addEventListener('hashchange', route);

  /* =============================================================== CLIENT: hub =============================================================== */
  function hub(g) {
    API.get('/api/portal/forms').then(function (d) {
      if (stale(g)) return;
      var o = d.onboarding, s = ONB[o.status] || ONB.not_started;
      var h = '<div class="eyebrow">Client Onboarding</div><h2>Your onboarding</h2>';
      h += '<div class="vf-hub"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center"><b>' + o.percent + '% complete</b>' + pill(s[0], s[1]) + '</div><div class="vf-bar"><i style="width:' + o.percent + '%"></i></div>' +
        '<p class="vf-saved">' + o.done + ' of ' + o.required + ' forms approved' + (o.awaiting ? ', ' + o.awaiting + ' waiting for our review' : '') + (o.corrections ? ', ' + o.corrections + ' need corrections' : '') + (o.outstanding ? ', ' + o.outstanding + ' still to fill in' : '') + '. Onboarding is complete once we have approved every form. Payment is tracked separately.</p></div>';
      if (d.outstandingDocs && d.outstandingDocs.length) h += '<h3 class="sec">Still needed from you</h3><ul class="vf-hist">' + d.outstandingDocs.map(function (x) { return '<li>' + esc(x.label || x.title || x) + (x.form ? '<small>' + esc(x.form) + '</small>' : '') + '</li>'; }).join('') + '</ul>';
      var groups = {};
      d.forms.forEach(function (f) { (groups[f.group] = groups[f.group] || []).push(f); });
      Object.keys(groups).forEach(function (gr) {
        h += '<h3 class="sec">' + esc(gr) + '</h3><div class="vf-grid">' + groups[gr].map(function (f) {
          var act = f.unlocked ? '<button class="btn mini" data-go="#forms-' + f.key + '">' + (f.status === 'new' ? 'Start' : f.status === 'draft' || f.status === 'changes_requested' ? 'Continue' : f.status === 'prepared' ? 'Review and sign' : 'View') + '</button>' : '';
          return '<div class="vf-card' + (f.unlocked ? '' : ' vf-locked') + '"><small class="vf-saved">Form ' + esc(f.no) + '</small><h4>' + esc(f.title) + '</h4><p>' + esc(f.tagline) + '</p>' +
            (f.unlocked ? '<div>' + fstat(f.status) + '</div>' : '<p>' + esc(f.reason) + '</p>') + (f.note && f.status === 'changes_requested' ? '<p style="color:#ff9b8f">' + esc(f.note) + '</p>' : '') + act + '</div>';
        }).join('') + '</div>';
      });
      h += '<h3 class="sec">Project handover</h3><p class="lead"><button class="btn small" data-go="#handover">Open my projects</button></p>';
      if (d.history && d.history.length) h += '<h3 class="sec">History</h3><ul class="vf-hist">' + d.history.slice(0, 30).map(function (x) { return '<li>' + esc(x.form) + ': ' + esc(x.action) + (x.detail ? ' (' + esc(x.detail) + ')' : '') + '<small>' + fmtT(x.at) + ' by ' + esc(x.actor) + '</small></li>'; }).join('') + '</ul>';
      body.innerHTML = h;
    }, fail);
  }

  /* =============================================================== form renderer =============================================================== */
  function condMet(c, a, ctx) {
    if (!c) return true;
    if (c.any) return c.any.some(function (x) { return condMet(x, a, ctx); });
    if (c.realEstate) return ctx.realEstate !== false;
    if (c.service) return !ctx.services.length || ctx.services.indexOf(c.service) >= 0;
    var v = a[c.field];
    if (c.equals !== undefined) return v === c.equals;
    if (c.includes !== undefined) return Array.isArray(v) ? v.indexOf(c.includes) >= 0 : String(v || '').indexOf(c.includes) >= 0;
    return true;
  }
  function noteHtml(f) {
    var h = '<div class="vf-note">' + String(f.body || '').split(/\n\s*\n/).map(function (p) { return '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>'; }).join('');
    if (f.table) h += '<div class="vf-scroll"><table class="vf-tbl"><thead><tr>' + f.table.head.map(function (x) { return '<th>' + esc(x) + '</th>'; }).join('') + '</tr></thead><tbody>' + f.table.rows.map(function (r) { return '<tr>' + r.map(function (x) { return '<td>' + esc(x) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
    return h + '</div>';
  }

  /* Draws a form from its definition. S = {def, answers, files, ctx, suggest, ro, fileUrl, canUpload} */
  function renderFields(S) {
    var out = '';
    S.def.sections.forEach(function (sc) {
      out += '<div class="vf-sec"><h3>' + esc(sc.title) + '</h3>' + (sc.intro ? '<p class="vf-i">' + esc(sc.intro) + '</p>' : '');
      sc.fields.forEach(function (f) { out += field(S, f); });
      out += '</div>';
    });
    return out;
  }
  function field(S, f) {
    var shown = condMet(f.showIf, S.answers, S.ctx);
    var wrap = function (inner, noLabel) { return '<div class="vf-q" data-f="' + f.id + '"' + (shown ? '' : ' hidden') + '>' + (noLabel ? '' : '<label class="vf-l"' + (f.type === 'text' || f.type === 'textarea' || f.type === 'email' || f.type === 'tel' || f.type === 'date' || f.type === 'number' || f.type === 'url' ? ' for="vf-' + f.id + '"' : '') + '>' + esc(f.label) + (f.required ? ' <span style="color:var(--gold)">*</span>' : '') + '</label>' + (f.help ? '<p class="vf-h">' + esc(f.help) + '</p>' : '')) + inner + '<div class="vf-err" data-e="' + f.id + '" hidden></div></div>'; };
    var v = S.answers[f.id], dis = S.ro ? ' disabled' : '';
    if (f.type === 'note') return '<div data-f="' + f.id + '"' + (shown ? '' : ' hidden') + ' style="margin:18px 0">' + noteHtml(f) + '</div>';
    if (f.type === 'lines') return '';
    if (f.type === 'textarea') return wrap('<textarea id="vf-' + f.id + '" data-id="' + f.id + '" maxlength="' + (f.max || 4000) + '"' + dis + '>' + esc(v || '') + '</textarea>');
    if (['text', 'email', 'tel', 'date', 'number', 'url'].indexOf(f.type) >= 0) {
      var sg = !v && S.suggest && S.suggest[f.id] ? S.suggest[f.id] : '';
      return wrap((f.prefix ? '<span class="vf-h">' + esc(f.prefix) + '</span>' : '') + '<input type="' + (f.type === 'number' ? 'text' : f.type) + '" id="vf-' + f.id + '" data-id="' + f.id + '" value="' + esc(v || sg) + '" ' + (f.placeholder ? 'placeholder="' + esc(f.placeholder) + '" ' : '') + (f.type === 'number' ? 'inputmode="decimal" ' : '') + 'maxlength="' + (f.max || 300) + '"' + dis + '>' + (sg && !v ? '<p class="vf-h">Filled in from your earlier answer. Check it and change it if needed.</p>' : ''));
    }
    if (f.type === 'radio' || f.type === 'checks') {
      var multi = f.type === 'checks', cur = multi ? (Array.isArray(v) ? v : []) : (v || '');
      var otherVal = '', opts = (f.options || []).slice();
      if (f.other) { var ov = multi ? cur.filter(function (x) { return /^Other: /.test(x); })[0] : (/^Other: /.test(cur) ? cur : ''); otherVal = ov ? ov.slice(7) : ''; }
      var h = opts.map(function (o, i) {
        var on = multi ? cur.indexOf(o) >= 0 : cur === o;
        return '<label class="vf-opt"><input type="' + (multi ? 'checkbox' : 'radio') + '" name="vf-' + f.id + '" data-id="' + f.id + '" data-o="' + esc(o) + '"' + (on ? ' checked' : '') + dis + '><span>' + esc(o) + '</span></label>';
      }).join('');
      if (f.other) h += '<label class="vf-opt"><input type="' + (multi ? 'checkbox' : 'radio') + '" name="vf-' + f.id + '" data-id="' + f.id + '" data-other="1"' + (otherVal ? ' checked' : '') + dis + '><span>Other (please specify)</span></label><input type="text" class="vf-in" data-oid="' + f.id + '" value="' + esc(otherVal) + '" maxlength="200" placeholder="Please specify"' + dis + ' style="margin-bottom:6px">';
      return wrap(h);
    }
    if (f.type === 'file') {
      var mine = (S.files || []).filter(function (x) { return x.field === f.id; });
      return wrap('<ul class="vf-files" data-files="' + f.id + '">' + mine.map(function (x) { return fileLi(S, x); }).join('') + '</ul>' + (S.ro || !S.canUpload ? '' : '<input type="file" class="vf-in" data-up="' + f.id + '" accept=".png,.jpg,.jpeg,.webp,.pdf,image/png,image/jpeg,image/webp,application/pdf"><p class="vf-h">PNG, JPG, WebP or PDF, up to 5 MB each. For videos or larger files, paste a link in your answers or email them to us.</p>'));
    }
    if (f.type === 'table') {
      var t = v && typeof v === 'object' ? v : {};
      var head = '<thead><tr><th></th>' + (f.cols || []).map(function (c) { return '<th>' + esc(c.label) + '</th>'; }).join('') + '</tr></thead>';
      var rows = (f.rows || []).map(function (r) {
        var cells = (f.cols || []).map(function (c) {
          var cv = (t[r.id] || {})[c.id] || '';
          if (c.type === 'radio') {
            var os = c.options || r.options || [];
            return '<td data-l="' + esc(c.label) + '"><select class="vf-in" data-t="' + f.id + '" data-r="' + r.id + '" data-c="' + c.id + '"' + dis + '><option value=""></option>' + os.map(function (o) { return '<option' + (o === cv ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select></td>';
          }
          return '<td data-l="' + esc(c.label) + '"><input class="vf-in" type="text" maxlength="300" data-t="' + f.id + '" data-r="' + r.id + '" data-c="' + c.id + '" value="' + esc(cv) + '"' + dis + '></td>';
        }).join('');
        var lab = r.editLabel ? '<input class="vf-in" type="text" maxlength="80" placeholder="' + esc(r.label) + '" data-t="' + f.id + '" data-r="' + r.id + '" data-c="label" value="' + esc((t[r.id] || {}).label || '') + '"' + dis + '>' : esc(r.label);
        return '<tr><td><b>' + lab + '</b></td>' + cells + '</tr>';
      }).join('');
      return wrap('<div class="vf-scroll"><table class="vf-tbl vf-stack">' + head + '<tbody>' + rows + '</tbody></table></div>');
    }
    return '';
  }
  function fileLi(S, x) {
    return '<li data-fid="' + x.id + '"><span>' + esc(x.name) + ' (' + kb(x.size) + ')</span> <button type="button" class="vf-link" data-view="' + x.id + '">View</button>' + (S.ro || !S.canUpload ? '' : ' <button type="button" class="vf-link" data-del="' + x.id + '">Remove</button>') + '</li>';
  }
  /* reads the form's DOM back into an answers object */
  function collect(root, def) {
    var a = {};
    qa('[data-f]', root).forEach(function (w) {
      var id = w.getAttribute('data-f');
      var inp = qa('input[data-id],textarea[data-id]', w);
      if (!inp.length) return;
      var first = inp[0];
      if (first.tagName === 'TEXTAREA' || first.type === 'text' || first.type === 'email' || first.type === 'tel' || first.type === 'date' || first.type === 'url') {
        if (first.hasAttribute('data-oid') || first.hasAttribute('data-o')) { /* option inputs */ } else { a[id] = first.value; return; }
      }
      var multi = first.type === 'checkbox', vals = [];
      inp.forEach(function (i) {
        if (!i.checked) return;
        if (i.hasAttribute('data-other')) { var t = q('[data-oid="' + id + '"]', w); var s = (t && t.value || '').trim(); if (s) vals.push('Other: ' + s); }
        else vals.push(i.getAttribute('data-o'));
      });
      a[id] = multi ? vals : (vals[0] || '');
    });
    qa('[data-t]', root).forEach(function (el) {
      var f = el.getAttribute('data-t'), r = el.getAttribute('data-r'), c = el.getAttribute('data-c');
      a[f] = a[f] || {}; a[f][r] = a[f][r] || {}; if (el.value) a[f][r][c] = el.value;
    });
    return a;
  }
  function applyVisibility(root, S) {
    var a = collect(root, S.def);
    S.def.sections.forEach(function (sc) { sc.fields.forEach(function (f) { var w = q('[data-f="' + f.id + '"]', root); if (w) w.hidden = !condMet(f.showIf, a, S.ctx); }); });
  }
  function showErrors(root, fields) {
    qa('.vf-err', root).forEach(function (e) { e.hidden = true; e.textContent = ''; });
    qa('.vf-q.vf-bad').forEach(function (e) { e.classList.remove('vf-bad'); });
    var first = null;
    Object.keys(fields || {}).forEach(function (k) {
      var e = q('[data-e="' + k + '"]', root);
      if (e) { e.hidden = false; e.textContent = fields[k]; e.parentNode.classList.add('vf-bad'); if (!first) first = e; }
    });
    if (first) first.parentNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /* =============================================================== CLIENT: one form =============================================================== */
  function formPage(g, key) {
    API.get('/api/portal/forms/' + key).then(function (d) {
      if (stale(g)) return;
      var def = d.def, agreement = def.kind === 'agreement';
      var S = { def: def, answers: d.answers || {}, files: d.files || [], ctx: d.ctx, suggest: d.suggest, ro: !d.editable, canUpload: d.editable && !agreement };
      var h = '<div class="eyebrow">Form ' + esc(def.no) + '</div><h2>' + esc(def.title) + '</h2><p><button class="vf-link" data-go="#forms">Back to my onboarding</button> ' + fstat(d.status) + '</p>';
      if (d.status === 'changes_requested' && d.adminNote) h += '<div class="al-banner" style="border-color:#ff9b8f">We need a few changes: ' + esc(d.adminNote) + '</div>';
      if (d.status === 'submitted' || d.status === 'approved') h += '<div class="al-banner">' + (d.status === 'approved' ? 'We approved this form. Thank you.' : 'We have received this form and will review it. You can read it below.') + '</div>';
      if (agreement && d.status === 'prepared') h += '<div class="al-banner">Please read this carefully, tick each box, type your full name and press Sign. Your typed name counts as your electronic signature.</div>';
      if (def.intro) h += '<p class="lead" style="max-width:760px">' + esc(def.intro) + '</p>';
      h += '<div id="vf-form">' + renderFields(S) + '</div>';
      if (d.editable) {
        h += '<div class="vf-sec"><h3>' + (agreement ? 'Agreement and signature' : 'Consent and signature') + '</h3>' + def.consents.map(function (c, i) { return '<label class="vf-opt"><input type="checkbox" data-consent="' + i + '"><span>' + esc(c) + '</span></label>'; }).join('') +
          '<div class="vf-q" data-f="__sign"><label class="vf-l" for="vf-sign">Type your full name as your electronic signature <span style="color:var(--gold)">*</span></label><input type="text" id="vf-sign" maxlength="120" autocomplete="name"><div class="vf-err" data-e="signedName" hidden></div><div class="vf-err" data-e="consents" hidden></div></div></div>';
        h += '<div class="vf-sticky">' + (agreement ? '' : '<span class="vf-saved" id="vf-saved">Your answers save automatically.</span>') + '<button class="btn gold" id="vf-submit">' + (agreement ? 'Sign agreement' : 'Submit form') + '</button></div>';
      } else {
        if (d.signed) h += '<p class="vf-saved">Signed electronically by ' + esc(d.signed.name) + ' on ' + fmtT(d.signed.at) + '.' + (d.counter ? ' Countersigned by ' + esc(d.counter.name) + ' (' + esc(d.counter.role) + ') on ' + fmtT(d.counter.at) + '.' : '') + '</p>';
        h += '<p><button class="btn small" id="vf-doc">Open printable copy</button></p>';
      }
      body.innerHTML = h;
      var root = q('#vf-form');
      qa('[data-up]', root).forEach(function (i) { i.disabled = false; });
      if (!d.editable) { var b = q('#vf-doc'); if (b) b.onclick = function () { openDoc('/api/portal/forms/' + key + '/document'); }; return; }
      wireForm(root, S, key, agreement);
    }, function (e) { if (!stale(g)) fail(e); });
  }
  function wireForm(root, S, key, agreement) {
    var base = '/api/portal/forms/' + key, saved = q('#vf-saved');
    var save = debounce(function () {
      if (agreement) return;
      if (saved) saved.textContent = 'Saving...';
      API.call('PATCH', base, { answers: collect(root, S.def) }).then(function () { if (saved) saved.textContent = 'Saved ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); }, function (e) { if (saved) saved.textContent = API.text(e); });
    }, 900);
    var onChange = function () { S.answers = collect(root, S.def); applyVisibility(root, S); save(); };
    root.addEventListener('input', onChange); root.addEventListener('change', function (e) {
      var up = e.target.closest('[data-up]');
      if (up) { upload(up); return; }
      onChange();
    });
    function upload(inp) {
      var f = inp.files[0]; if (!f) return;
      if (f.size > 5 * 1024 * 1024) { toast('That file is over 5 MB.'); inp.value = ''; return; }
      var fld = inp.getAttribute('data-up'); inp.disabled = true;
      API.upload(base + '/files?field=' + encodeURIComponent(fld) + '&name=' + encodeURIComponent(f.name), f).then(function (r) {
        S.files = r.files; var ul = q('[data-files="' + fld + '"]', root); ul.innerHTML = S.files.filter(function (x) { return x.field === fld; }).map(function (x) { return fileLi(S, x); }).join('');
        toast('File added.');
      }, function (e) { toast(API.text(e)); }).then(function () { inp.disabled = false; inp.value = ''; });
    }
    root.addEventListener('click', function (e) {
      var v = e.target.closest('[data-view]'), x = e.target.closest('[data-del]');
      if (v) { var id = v.getAttribute('data-view'); API.call('GET', base + '/files/' + id, undefined, { blob: true }).then(saveBlob, function (er) { toast(API.text(er)); }); }
      if (x) { API.call('DELETE', base + '/files/' + x.getAttribute('data-del')).then(function (r) { S.files = r.files; qa('[data-files]', root).forEach(function (ul) { var fld = ul.getAttribute('data-files'); ul.innerHTML = S.files.filter(function (y) { return y.field === fld; }).map(function (y) { return fileLi(S, y); }).join(''); }); }, function (er) { toast(API.text(er)); }); }
    });
    q('#vf-submit').onclick = function () {
      var btn = this, consents = qa('[data-consent]').map(function (c) { return c.checked; });
      btn.disabled = true;
      API.post(base + '/submit', { answers: collect(root, S.def), consents: consents, signedName: q('#vf-sign').value }).then(function () {
        toast(agreement ? 'Agreement signed. Thank you.' : 'Form sent. Thank you.'); route();
      }, function (e) {
        btn.disabled = false;
        if (e.fields) { showErrors(document, e.fields); toast('Please check the highlighted answers.'); } else toast(API.text(e));
      });
    };
  }

  /* =============================================================== CLIENT: handover =============================================================== */
  function steps(stage, n) { var h = '<div class="vf-steps">'; for (var i = 0; i < n; i++) h += '<i class="' + (i <= stage ? 'on' : '') + '"></i>'; return h + '</div>'; }
  function hoList(g) {
    API.get('/api/portal/handovers').then(function (d) {
      if (stale(g)) return;
      var h = '<div class="eyebrow">Project Handover</div><h2>Your projects</h2><p><button class="vf-link" data-go="#forms">Back to my onboarding</button></p>';
      h += d.handovers.length ? '<div class="vf-grid">' + d.handovers.map(function (x) { return '<div class="vf-card"><h4>' + esc(x.title) + '</h4><p>' + esc(x.serviceLabel) + '</p><div>' + pill(x.statusLabel, HO_TONE[x.status]) + '</div>' + steps(x.stage, x.stages) + (x.needsYou ? '<p style="color:var(--gold)">Waiting for you</p>' : '') + '<button class="btn mini" data-go="#handover-' + x.id + '">Open</button></div>'; }).join('') + '</div>'
        : '<p class="lead">Nothing to show yet. When one of your projects is ready for you to review, it appears here and we send you an email.</p>';
      body.innerHTML = h;
    }, fail);
  }
  function hoView(g, id) {
    API.get('/api/portal/handovers/' + id).then(function (d) {
      if (stale(g)) return;
      var h = '<div class="eyebrow">Project Handover</div><h2>' + esc(d.title) + '</h2><p><button class="vf-link" data-go="#handover">All projects</button> ' + pill(d.statusLabel, HO_TONE[d.status]) + ' ' + esc(d.serviceLabel) + '</p>' + steps(d.progress.stage, d.progress.stages);
      if (d.previewUrl) h += '<p><a class="btn small" target="_blank" rel="noopener" href="' + esc(d.previewUrl) + '">Open preview</a></p>';
      if (d.canReview) h += '<div class="vf-hub"><b>Please review your project</b><p class="vf-saved">Look through everything. If you want changes, tell us below. If you are happy, approve it. Approving does not hand it over yet; we first check everything is in order.</p>' +
        '<div class="vf-row"><div><label class="vf-l" for="ho-name">Type your full name to approve</label><input class="vf-in" id="ho-name" maxlength="120"></div><button class="btn gold" id="ho-approve">Approve project</button></div></div>';
      if (d.status === 'revisions_required') h += '<div class="al-banner">We are working on the changes you asked for. We will email you when it is ready to review again.</div>';
      if (d.status === 'awaiting_payment_verification' || d.status === 'preparing_handover') h += '<div class="al-banner">Thank you. We are preparing your handover package. We will email you when it is ready.</div>';
      if (d.released) {
        h += '<h3 class="sec">Your deliverables</h3>';
        h += d.deliverables.length ? '<ul class="vf-hist">' + d.deliverables.map(function (x) { return '<li><b>' + esc(x.title) + '</b>' + (x.category ? ' ' + pill(x.category) : '') + '<br>' + (x.kind === 'file' ? '<button class="vf-link" data-dl="' + x.id + '" data-n="' + esc(x.filename) + '">Download ' + esc(x.filename) + '</button> (' + kb(x.size) + ')' : x.kind === 'link' ? '<a class="vf-link" target="_blank" rel="noopener" href="' + esc(x.url) + '">' + esc(x.url) + '</a>' : '') + (x.body ? '<br><span style="white-space:pre-wrap">' + esc(x.body) + '</span>' : '') + '</li>'; }).join('') + '</ul>' : '<p class="lead">No items listed.</p>';
        if (d.instructions) h += '<h3 class="sec">How to use and manage it</h3><p style="white-space:pre-wrap;max-width:760px">' + esc(d.instructions) + '</p>';
        if (d.supportNote) h += '<h3 class="sec">Support after the project</h3><p style="white-space:pre-wrap;max-width:760px">' + esc(d.supportNote) + '</p>';
        if (d.handedOverAt) h += '<p class="vf-saved">Handed over ' + fmt(d.handedOverAt) + (d.handoverMethod ? ' (' + esc(d.handoverMethod) + ')' : '') + '.</p>';
      }
      if (d.canAccept) h += '<div class="vf-hub"><b>Accept the handover</b><p class="vf-saved">We will not treat silence as acceptance. Tick each statement, type your name and accept, or tell us what is missing.</p>' +
        d.statements.map(function (s, i) { return '<label class="vf-opt"><input type="checkbox" data-st="' + i + '"><span>' + esc(s) + '</span></label>'; }).join('') +
        '<div class="vf-row"><div><label class="vf-l" for="ho-aname">Type your full name as your electronic signature</label><input class="vf-in" id="ho-aname" maxlength="120"></div></div><div class="vf-row"><div><label class="vf-l" for="ho-acom">Comments (optional)</label><textarea class="vf-in" id="ho-acom" maxlength="2000" style="min-height:70px"></textarea></div></div><button class="btn gold" id="ho-accept">Accept handover</button></div>';
      if (d.acceptance) h += '<div class="al-banner">Accepted by ' + esc(d.acceptance.signedName) + ' on ' + fmtT(d.acceptance.signedAt) + '. <button class="vf-link" id="ho-rec">Open acceptance record</button></div>';
      var kinds = [];
      if (d.canReview) kinds.push(['revision', 'I would like a change'], ['feedback', 'General feedback']);
      if (d.canReport) kinds.push(['missing', 'Something is missing'], ['issue', 'Something is not working']);
      kinds.push(['question', 'I have a question']);
      h += '<h3 class="sec">Send us a message</h3><div class="vf-row"><div><label class="vf-l" for="ho-k">About</label><select class="vf-in" id="ho-k">' + kinds.map(function (k) { return '<option value="' + k[0] + '">' + k[1] + '</option>'; }).join('') + '</select></div></div><div class="vf-row"><div><textarea class="vf-in" id="ho-msg" maxlength="3000" placeholder="Tell us what you need"></textarea></div></div><button class="btn small" id="ho-send">Send</button>';
      if (d.feedback.length) h += '<h3 class="sec">Your messages</h3><ul class="vf-hist">' + d.feedback.map(function (x) { return '<li><b>' + (x.author === 'owner' ? 'Vintage Advertising' : 'You') + '</b> ' + pill(x.kind) + ' ' + (x.author === 'client' ? pill(x.status === 'in_progress' ? 'being handled' : x.status, x.status === 'resolved' ? 'green' : x.status === 'declined' ? 'red' : 'gold') : '') + '<br>' + esc(x.body) + (x.resolution ? '<br><i>' + esc(x.resolution) + '</i>' : '') + '<small>' + fmtT(x.createdAt) + '</small></li>'; }).join('') + '</ul>';
      h += '<h3 class="sec">History</h3><ul class="vf-hist">' + d.history.slice().reverse().map(function (x) { return '<li>' + esc(x.action) + (x.note ? ': ' + esc(x.note) : '') + '<small>' + fmtT(x.at) + '</small></li>'; }).join('') + '</ul>';
      body.innerHTML = h;
      var again = function (r) { if (!stale(g)) route(); };
      var b;
      if ((b = q('#ho-approve'))) b.onclick = function () { b.disabled = true; API.post('/api/portal/handovers/' + id + '/approve', { signedName: q('#ho-name').value }).then(function () { toast('Thank you. Project approved.'); again(); }, function (e) { b.disabled = false; toast(API.text(e)); }); };
      if ((b = q('#ho-accept'))) b.onclick = function () { b.disabled = true; API.post('/api/portal/handovers/' + id + '/accept', { signedName: q('#ho-aname').value, comments: q('#ho-acom').value, confirmations: qa('[data-st]').map(function (c) { return c.checked; }) }).then(function () { toast('Handover accepted. Thank you.'); again(); }, function (e) { b.disabled = false; toast(API.text(e)); }); };
      q('#ho-send').onclick = function () { var btn = this; btn.disabled = true; API.post('/api/portal/handovers/' + id + '/feedback', { kind: q('#ho-k').value, body: q('#ho-msg').value }).then(function () { toast('Sent. We will get back to you.'); again(); }, function (e) { btn.disabled = false; toast(API.text(e)); }); };
      if ((b = q('#ho-rec'))) b.onclick = function () { openDoc('/api/portal/handovers/' + id + '/acceptance'); };
      qa('[data-dl]').forEach(function (x) { x.onclick = function () { API.download('/api/portal/handovers/' + id + '/files/' + x.getAttribute('data-dl'), x.getAttribute('data-n')).catch(function (e) { toast(API.text(e)); }); }; });
    }, function (e) { if (!stale(g)) fail(e); });
  }

  /* =============================================================== ADMIN: onboarding overview =============================================================== */
  var aq = { q: '', service: '', form: '', status: '', onboarding: '', from: '', to: '' };
  function qs(o) { return Object.keys(o).filter(function (k) { return o[k]; }).map(function (k) { return k + '=' + encodeURIComponent(o[k]); }).join('&'); }
  var SVC = { marketing: 'Marketing subscription', website: 'Website', chatbot: 'AI chatbot', automation: 'Automation', advanced_ai: 'Advanced AI', maintenance: 'Maintenance' };
  function aList(g) {
    API.get('/api/admin/forms?' + qs(aq)).then(function (d) {
      if (stale(g)) return;
      var s = d.stats;
      var h = '<div class="eyebrow">Admin</div><h2>Client Onboarding Management</h2><p><button class="vf-link" data-go="#admin-handovers">Open Handover Management</button></p>';
      h += '<div class="bp-cards">' + [['Clients', s.total], ['Not started', s.not_started], ['In progress', s.in_progress], ['Awaiting review', s.awaiting_review], ['Corrections requested', s.corrections_requested], ['Completed', s.completed]].map(function (x) { return '<div class="bp-card"><small>' + x[0] + '</small><b>' + x[1] + '</b></div>'; }).join('') + '</div>';
      function sel(id, label, opts, cur) { return '<div><label class="vf-l" for="' + id + '">' + label + '</label><select class="vf-in" id="' + id + '"><option value="">All</option>' + opts.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === cur ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></div>'; }
      h += '<div class="vf-row"><div><label class="vf-l" for="af-q">Client or business</label><input class="vf-in" id="af-q" value="' + esc(aq.q) + '"></div>' +
        sel('af-service', 'Service', Object.keys(SVC).map(function (k) { return [k, SVC[k]]; }), aq.service) + sel('af-form', 'Form', d.forms.map(function (f) { return [f.key, f.no + ' ' + f.title]; }), aq.form) +
        sel('af-status', 'Form status', Object.keys(FORM_STATUS).filter(function (k) { return k !== 'new'; }).map(function (k) { return [k, FORM_STATUS[k][0]]; }), aq.status) + sel('af-onb', 'Onboarding', Object.keys(ONB).map(function (k) { return [k, ONB[k][0]]; }), aq.onboarding) +
        '<div><label class="vf-l" for="af-from">Registered from</label><input class="vf-in" type="date" id="af-from" value="' + aq.from + '"></div><div><label class="vf-l" for="af-to">to</label><input class="vf-in" type="date" id="af-to" value="' + aq.to + '"></div>' +
        '<button class="btn small" id="af-go">Filter</button><button class="btn small" id="af-csv">Export CSV</button></div>';
      h += '<div class="vf-scroll"><table class="vf-tbl"><thead><tr><th>Client</th><th>Services</th><th>Forms</th><th>Onboarding</th><th>Progress</th><th>Last activity</th><th></th></tr></thead><tbody>' + (d.clients.length ? d.clients.map(function (c) {
        var o = ONB[c.onboarding.status];
        return '<tr><td><b>' + esc(c.business || c.name) + '</b><br><span class="vf-saved">' + esc(c.name) + ' - ' + esc(c.email) + '</span><br><span class="vf-saved">Registered ' + fmt(c.registered) + '</span></td><td>' + (c.services.map(function (x) { return esc(SVC[x] || x); }).join(', ') || '-') + '</td>' +
          '<td>' + c.assigned + ' assigned' + (c.waiting ? '<br>' + pill(c.waiting + ' to review', 'gold') : '') + '</td><td>' + pill(o[0], o[1]) + '</td><td>' + c.onboarding.percent + '%</td><td>' + fmt(c.lastActivity) + '</td><td><button class="btn mini" data-go="#admin-forms-' + c.id + '">Open</button></td></tr>';
      }).join('') : '<tr><td colspan="7">No clients match.</td></tr>') + '</tbody></table></div>';
      body.innerHTML = h;
      q('#af-go').onclick = function () { aq = { q: q('#af-q').value, service: q('#af-service').value, form: q('#af-form').value, status: q('#af-status').value, onboarding: q('#af-onb').value, from: q('#af-from').value, to: q('#af-to').value }; route(); };
      q('#af-csv').onclick = function () { API.download('/api/admin/forms-export?' + qs(aq), 'onboarding.csv').catch(function (e) { toast(API.text(e)); }); };
    }, fail);
  }

  function aClient(g, cid) {
    API.get('/api/admin/forms/' + cid).then(function (d) {
      if (stale(g)) return;
      var o = d.onboarding, os = ONB[o.status];
      var h = '<div class="eyebrow">Admin</div><h2>' + esc(d.client.name) + '</h2><p><button class="vf-link" data-go="#admin-forms">All clients</button> ' + pill(os[0], os[1]) + ' ' + o.percent + '% - ' + esc(d.client.email) + '</p>';
      h += '<h3 class="sec">Services</h3><p class="vf-saved">Detected from orders and subscriptions. You can add services for work arranged outside the site.</p><div>' + Object.keys(SVC).map(function (k) { return '<label class="vf-opt" style="display:inline-flex;margin-right:16px"><input type="checkbox" data-svc="' + k + '"' + (d.services.services && d.services.services.indexOf(k) >= 0 || (Array.isArray(d.services) && d.services.indexOf(k) >= 0) ? ' checked' : '') + '><span>' + SVC[k] + '</span></label>'; }).join('') + '</div><p><button class="btn mini" id="ac-svc">Save services</button></p>';
      h += '<h3 class="sec">Forms</h3><div class="vf-scroll"><table class="vf-tbl"><thead><tr><th>Form</th><th>Status</th><th>Updated</th><th></th></tr></thead><tbody>' + d.forms.map(function (f) {
        return '<tr><td><b>' + esc(f.no) + ' ' + esc(f.title) + '</b></td><td>' + (f.unlocked ? fstat(f.status) : pill('Not assigned', 'grey')) + '</td><td>' + fmt(f.updatedAt) + '</td><td>' + (f.unlocked ? '<button class="btn mini" data-go="#admin-forms-' + cid + '-' + f.key + '">' + (f.kind === 'agreement' && (f.status === 'new' || f.status === 'prepared') ? 'Prepare' : 'Open') + '</button>' : '') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
      h += '<h3 class="sec">Project handovers</h3><p><button class="btn mini" data-go="#admin-handovers">Handover Management</button></p>';
      h += '<h3 class="sec">Audit trail</h3><ul class="vf-hist">' + d.audit.slice(0, 60).map(function (x) { return '<li>' + esc(x.action) + (x.detail ? ': ' + esc(x.detail) : '') + '<small>' + fmtT(x.at) + ' - ' + esc(x.actor) + '</small></li>'; }).join('') + '</ul>';
      body.innerHTML = h;
      q('#ac-svc').onclick = function () { API.post('/api/admin/forms/' + cid + '/services', { services: qa('[data-svc]').filter(function (c) { return c.checked; }).map(function (c) { return c.getAttribute('data-svc'); }) }).then(function () { toast('Services saved.'); route(); }, function (e) { toast(API.text(e)); }); };
    }, fail);
  }

  function aForm(g, cid, key) {
    API.get('/api/admin/forms/' + cid + '/' + key).then(function (d) {
      if (stale(g)) return;
      var def = d.def, agreement = def.kind === 'agreement', base = '/api/admin/forms/' + cid + '/' + key;
      var S = { def: def, answers: d.answers || {}, files: d.files || [], ctx: d.ctx, suggest: {}, ro: true, canUpload: false };
      var h = '<div class="eyebrow">Form ' + esc(def.no) + '</div><h2>' + esc(def.title) + '</h2><p><button class="vf-link" data-go="#admin-forms-' + cid + '">Back to client</button> ' + fstat(d.status) + '</p>';
      if (agreement && (d.status === 'new' || d.status === 'prepared')) {
        var sp = d.suggestPrepared || {}, pr = d.prepared || {};
        h += '<h3 class="sec">Prepare for the client</h3><p class="vf-saved">Fill in the details, check them against the signed contract, then save. The client gets an email and signs online.</p><div id="vf-prep">';
        d.preparedFields.forEach(function (f) {
          var v = pr[f.id] != null && pr[f.id] !== '' ? pr[f.id] : sp[f.id];
          if (f.type === 'lines') {
            var ls = Array.isArray(v) && v.length ? v : [{ service: '', plan: '', fee: '', billing: '' }];
            h += '<div class="vf-q"><label class="vf-l">' + esc(f.label) + '</label><div id="vf-lines">' + ls.map(lineRow).join('') + '</div><button type="button" class="btn mini" id="vf-addline">Add line</button><div class="vf-err" data-e="' + f.id + '" hidden></div></div>';
          } else h += '<div class="vf-q"><label class="vf-l" for="vp-' + f.id + '">' + esc(f.label) + '</label>' + (f.help ? '<p class="vf-h">' + esc(f.help) + '</p>' : '') + (f.type === 'textarea' ? '<textarea id="vp-' + f.id + '" data-p="' + f.id + '">' + esc(v || '') + '</textarea>' : '<input id="vp-' + f.id + '" data-p="' + f.id + '" type="' + (f.type === 'date' ? 'date' : 'text') + '" value="' + esc(v || '') + '">') + '<div class="vf-err" data-e="' + f.id + '" hidden></div></div>';
        });
        h += '</div><p><button class="btn gold" id="vf-prepsave">' + (d.status === 'prepared' ? 'Save and notify client again' : 'Save and send to client') + '</button></p>';
      }
      h += '<div class="vf-sec"><h3>' + (agreement ? 'Agreement' : 'Client answers') + '</h3>' + (d.status === 'new' && !agreement ? '<p class="vf-saved">The client has not started this form.</p>' : '<div id="vf-form">' + renderFields(S) + '</div>') + '</div>';
      if (d.signed) h += '<p>Signed by <b>' + esc(d.signed.name) + '</b> on ' + fmtT(d.signed.at) + '. Consents accepted: ' + (d.consents || []).length + '. Form version ' + d.version + '.</p>';
      if (d.counter) h += '<p>Countersigned by <b>' + esc(d.counter.name) + '</b> (' + esc(d.counter.role) + ') on ' + fmtT(d.counter.at) + '.</p>';
      if (d.adminNote) h += '<p class="vf-saved">Last message to client: ' + esc(d.adminNote) + '</p>';
      h += '<h3 class="sec">Review</h3><div class="vf-row"><div><label class="vf-l" for="vr-note">Message to the client (needed unless you approve)</label><textarea class="vf-in" id="vr-note" maxlength="1000" style="min-height:70px"></textarea></div></div><div class="bp-act">';
      if (!agreement) h += '<button class="btn mini gold" data-rv="approve">Approve</button><button class="btn mini" data-rv="changes">Request corrections</button><button class="btn mini" data-rv="reject">Reject</button>';
      if (d.status !== 'new' && d.status !== 'draft' && d.status !== 'changes_requested' && d.status !== 'prepared') h += '<button class="btn mini" data-rv="reopen">Reopen for client</button>';
      if (d.status !== 'new') h += '<button class="btn mini" id="vr-doc">Printable copy</button>';
      h += '</div>';
      if (agreement && d.status === 'signed') h += '<h3 class="sec">Countersign</h3><div class="vf-row"><div><label class="vf-l" for="cs-n">Your full name</label><input class="vf-in" id="cs-n" maxlength="120"></div><div><label class="vf-l" for="cs-r">Your role</label><input class="vf-in" id="cs-r" maxlength="120" value="Operations Manager"></div><button class="btn gold" id="cs-go">Countersign</button></div><p class="vf-saved">Only countersign if you are authorised to sign for the agency.</p>';
      h += '<h3 class="sec">Internal notes</h3><p class="vf-saved">Only the team sees these.</p><ul class="vf-hist" id="vn-list">' + (d.notes || []).map(function (n) { return '<li>' + esc(n.body) + '<small>' + fmtT(n.at) + '</small></li>'; }).join('') + '</ul>' +
        (d.status !== 'new' ? '<div class="vf-row"><div><input class="vf-in" id="vn-body" maxlength="2000" placeholder="Add a note"></div><button class="btn mini" id="vn-add">Add</button></div>' : '');
      h += '<h3 class="sec">History</h3><ul class="vf-hist">' + (d.events || []).slice().reverse().map(function (x) { return '<li>' + esc(x.action) + (x.detail ? ': ' + esc(x.detail) : '') + '<small>' + fmtT(x.at) + ' - ' + esc(x.actor) + '</small></li>'; }).join('') + '</ul>';
      body.innerHTML = h;
      var root = q('#vf-form');
      if (root) { root.addEventListener('click', function (e) { var v = e.target.closest('[data-view]'); if (v) API.call('GET', '/api/admin/form-files/' + v.getAttribute('data-view'), undefined, { blob: true }).then(saveBlob, function (er) { toast(API.text(er)); }); }); }
      qa('[data-rv]').forEach(function (b) { b.onclick = function () { b.disabled = true; API.call('PATCH', base, { action: b.getAttribute('data-rv'), note: q('#vr-note').value }).then(function () { toast('Done.'); route(); }, function (e) { b.disabled = false; toast(API.text(e)); }); }; });
      var x;
      if ((x = q('#vr-doc'))) x.onclick = function () { openDoc(base + '/document'); };
      if ((x = q('#cs-go'))) x.onclick = function () { x.disabled = true; API.post(base + '/countersign', { name: q('#cs-n').value, role: q('#cs-r').value }).then(function () { toast('Countersigned.'); route(); }, function (e) { x.disabled = false; toast(API.text(e)); }); };
      if ((x = q('#vn-add'))) x.onclick = function () { API.post(base + '/notes', { body: q('#vn-body').value }).then(function () { route(); }, function (e) { toast(API.text(e)); }); };
      if ((x = q('#vf-addline'))) x.onclick = function () { q('#vf-lines').insertAdjacentHTML('beforeend', lineRow({ service: '', plan: '', fee: '', billing: '' })); };
      if ((x = q('#vf-prepsave'))) x.onclick = function () {
        var prep = {}; qa('[data-p]').forEach(function (i) { prep[i.getAttribute('data-p')] = i.value; });
        var lines = qa('.vf-line').map(function (r) { return { service: q('[data-l=service]', r).value, plan: q('[data-l=plan]', r).value, fee: q('[data-l=fee]', r).value, billing: q('[data-l=billing]', r).value }; });
        if (q('#vf-lines')) prep.lines = lines;
        x.disabled = true;
        API.post(base + '/prepare', { prepared: prep }).then(function () { toast('Saved and sent to the client.'); route(); }, function (e) { x.disabled = false; if (e.fields) showErrors(document, e.fields); toast(API.text(e)); });
      };
    }, function (e) { if (!stale(g)) fail(e); });
  }
  function lineRow(l) {
    return '<div class="vf-row vf-line"><div><select class="vf-in" data-l="service"><option value="">Service</option>' + Object.keys(SVC).map(function (k) { return '<option' + (SVC[k] === l.service ? ' selected' : '') + '>' + SVC[k] + '</option>'; }).join('') + '</select></div>' +
      '<div><input class="vf-in" data-l="plan" placeholder="Plan" value="' + esc(l.plan) + '"></div><div><input class="vf-in" data-l="fee" placeholder="Fee (USD)" inputmode="decimal" value="' + esc(l.fee) + '"></div><div><input class="vf-in" data-l="billing" placeholder="Billing, e.g. once-off" value="' + esc(l.billing) + '"></div></div>';
  }

  /* =============================================================== ADMIN: handover =============================================================== */
  var hq = { view: '', q: '' };
  var VIEWS = [['', 'All'], ['awaiting_handover', 'Awaiting handover'], ['client_review', 'Client review'], ['payment_verification', 'Payment verification'], ['awaiting_acceptance', 'Awaiting acceptance'], ['completed', 'Completed'], ['overdue', 'Overdue'], ['outstanding_deliverables', 'No deliverables yet'], ['revisions', 'Revisions or reopened']];
  function aHoList(g) {
    Promise.all([API.get('/api/admin/handovers?' + qs(hq)), API.get('/api/admin/forms')]).then(function (rs) {
      if (stale(g)) return;
      var d = rs[0], clients = rs[1].clients;
      var h = '<div class="eyebrow">Admin</div><h2>Handover Management</h2><p><button class="vf-link" data-go="#admin-forms">Open Client Onboarding Management</button></p>';
      h += '<div class="bp-cards">' + VIEWS.slice(1).map(function (v) { return '<div class="bp-card" style="cursor:pointer" data-view="' + v[0] + '"><small>' + v[1] + '</small><b>' + (d.stats[v[0]] || 0) + '</b></div>'; }).join('') + '</div>';
      h += '<div class="vf-row"><div><label class="vf-l" for="hl-v">View</label><select class="vf-in" id="hl-v">' + VIEWS.map(function (v) { return '<option value="' + v[0] + '"' + (v[0] === hq.view ? ' selected' : '') + '>' + v[1] + '</option>'; }).join('') + '</select></div><div><label class="vf-l" for="hl-q">Search</label><input class="vf-in" id="hl-q" value="' + esc(hq.q) + '"></div><button class="btn small" id="hl-go">Filter</button></div>';
      h += '<div class="vf-scroll"><table class="vf-tbl"><thead><tr><th>Project</th><th>Client</th><th>Status</th><th>Due</th><th>Items</th><th></th></tr></thead><tbody>' + (d.handovers.length ? d.handovers.map(function (x) {
        return '<tr><td><b>' + esc(x.title) + '</b><br><span class="vf-saved">' + x.id + ' - ' + esc(x.serviceLabel) + '</span></td><td>' + esc(x.clientName) + '</td><td>' + pill(x.statusLabel, HO_TONE[x.status]) + (x.openFeedback ? ' ' + pill(x.openFeedback + ' open', 'red') : '') + '</td><td>' + fmt(x.dueDate) + (x.overdue ? ' ' + pill('overdue', 'red') : '') + '</td><td>' + x.deliverables + ' deliverables</td><td><button class="btn mini" data-go="#admin-handover-' + x.id + '">Open</button></td></tr>';
      }).join('') : '<tr><td colspan="6">Nothing matches.</td></tr>') + '</tbody></table></div>';
      h += '<h3 class="sec">New handover</h3><div class="vf-row"><div><label class="vf-l" for="hn-c">Client</label><select class="vf-in" id="hn-c">' + clients.map(function (c) { return '<option value="' + c.id + '">' + esc(c.business || c.name) + '</option>'; }).join('') + '</select></div><div><label class="vf-l" for="hn-s">Service</label><select class="vf-in" id="hn-s">' + Object.keys(SVC).map(function (k) { return '<option value="' + k + '">' + SVC[k] + '</option>'; }).join('') + '</select></div><div><label class="vf-l" for="hn-t">Project title</label><input class="vf-in" id="hn-t" maxlength="150"></div><div><label class="vf-l" for="hn-d">Due date</label><input class="vf-in" type="date" id="hn-d"></div><button class="btn small gold" id="hn-go">Create</button></div>';
      body.innerHTML = h;
      qa('[data-view]').forEach(function (c) { c.onclick = function () { hq.view = c.getAttribute('data-view'); route(); }; });
      q('#hl-go').onclick = function () { hq = { view: q('#hl-v').value, q: q('#hl-q').value }; route(); };
      q('#hn-go').onclick = function () { API.post('/api/admin/handovers', { clientId: q('#hn-c').value, service: q('#hn-s').value, title: q('#hn-t').value, dueDate: q('#hn-d').value }).then(function (r) { go('#admin-handover-' + r.id); }, function (e) { toast(API.text(e)); }); };
    }, fail);
  }

  var ACT = { submit_qa: ['Send to internal QA'], qa_fail: ['QA failed, back to team', 1], approve_qa: ['Approve QA and send to client', 0, 1], revision_done: ['Revisions done, send to client', 0, 1], verify_payment: ['Confirm payment checked'], release_package: ['Release handover package to client', 0, 1], reissue: ['Reissue to client', 0, 1], back_to_preparing: ['Back to preparing'], close: ['Close project'], reopen: ['Reopen', 1] };
  function aHo(g, id) {
    API.get('/api/admin/handovers/' + id).then(function (d) {
      if (stale(g)) return;
      var H = d.handover, base = '/api/admin/handovers/' + id, locked = H.status === 'handover_completed' || H.status === 'closed';
      var h = '<div class="eyebrow">Admin - ' + id + '</div><h2>' + esc(H.title) + '</h2><p><button class="vf-link" data-go="#admin-handovers">All handovers</button> ' + pill(H.statusLabel, HO_TONE[H.status]) + ' ' + esc(H.serviceLabel) + ' for <b>' + esc(d.client.name) + '</b></p>';
      h += '<p class="vf-saved">Handover status is separate from the project and from payment. Nothing here changes an invoice.</p>';
      h += '<h3 class="sec">Next step</h3><div class="vf-row"><div><label class="vf-l" for="tr-note">Note (required for some steps)</label><input class="vf-in" id="tr-note" maxlength="2000"></div>' + (d.actions.indexOf('release_package') >= 0 ? '<div><label class="vf-l" for="tr-m">How is it being delivered?</label><input class="vf-in" id="tr-m" value="' + esc(H.handover_method || '') + '" placeholder="Portal, email, meeting..."></div>' : '') + '</div><div class="bp-act">' +
        (d.actions.length ? d.actions.map(function (a) { return '<button class="btn mini' + (ACT[a][2] ? ' gold' : '') + '" data-tr="' + a + '">' + ACT[a][0] + '</button>'; }).join('') : '<span class="vf-saved">' + (H.status === 'awaiting_client_review' ? 'Waiting for the client to review.' : H.status === 'awaiting_client_acceptance' ? 'Waiting for the client to accept.' : 'No action available.') + '</span>') + '</div>';
      if (H.status === 'awaiting_payment_verification' || H.status === 'preparing_handover' || H.payment_verified_at) {
        h += '<h3 class="sec">Payment check (read only)</h3><ul class="vf-hist">' + d.payment.lines.map(function (l) { return '<li>' + esc(l.id) + ' ' + esc(l.description) + ': ' + pill(l.status, l.paid ? 'green' : 'red') + ' ' + money(l.amountCents) + '</li>'; }).join('') + '</ul>' + (d.payment.note ? '<p class="vf-saved">' + esc(d.payment.note) + '</p>' : '') + '<p>' + (d.payment.ok ? pill('Everything shown is paid', 'green') : pill('Outstanding ' + money(d.payment.outstandingCents) + ': an authorised exception note is needed', 'red')) + '</p>' + (H.payment_verified_at ? '<p class="vf-saved">Verified by ' + esc(H.payment_verified_by) + ' on ' + fmtT(H.payment_verified_at) + (H.payment_exception ? ' as an exception: ' + esc(H.payment_note) : '') + '</p>' : '') + '<p class="vf-saved">To record a payment, use Billing. Handover never marks invoices paid.</p>';
      }
      h += '<h3 class="sec">Details</h3><div class="vf-row"><div><label class="vf-l" for="hd-t">Title</label><input class="vf-in" id="hd-t" value="' + esc(H.title) + '"></div><div><label class="vf-l" for="hd-a">Assigned to</label><input class="vf-in" id="hd-a" value="' + esc(H.assignee) + '"></div><div><label class="vf-l" for="hd-d">Due date</label><input class="vf-in" type="date" id="hd-d" value="' + esc(H.due_date || '') + '"></div></div><div class="vf-row"><div><label class="vf-l" for="hd-p">Preview link for the client</label><input class="vf-in" id="hd-p" value="' + esc(H.preview_url) + '" placeholder="https://"></div></div>' +
        '<div class="vf-row"><div><label class="vf-l" for="hd-i">How to use and manage what was delivered (shown to the client after release)</label><textarea class="vf-in" id="hd-i">' + esc(H.instructions) + '</textarea></div></div><div class="vf-row"><div><label class="vf-l" for="hd-s">Agreed support after the project (copy it from the contract; leave empty if none was agreed)</label><textarea class="vf-in" id="hd-s" style="min-height:70px">' + esc(H.support_note) + '</textarea></div></div><button class="btn mini" id="hd-save">Save details</button>';
      ['qa', 'package', 'closure'].forEach(function (ph) {
        var items = d.checklist.filter(function (i) { return i.phase === ph; });
        h += '<h3 class="sec">' + { qa: 'Internal QA checklist', package: 'Handover package checklist', closure: 'Closure checklist' }[ph] + '</h3>' + items.map(function (i) {
          return '<div class="vf-ck"><input type="checkbox" data-ck="' + i.id + '"' + (i.done ? ' checked' : '') + (i.auto && !locked ? ' disabled' : '') + '><span>' + esc(i.label) + (i.critical ? ' ' + pill('required', 'gold') : '') + (i.auto ? ' ' + pill('automatic', 'grey') : '') + (i.exception_reason ? '<em>Exception: ' + esc(i.exception_reason) + '</em>' : '') + (i.done ? '<em>Done ' + fmtT(i.done_at) + ' by ' + esc(i.done_by) + '</em>' : '') + '</span>' +
            (!i.done && !i.auto && i.critical ? '<button class="vf-link" data-ex="' + i.id + '">Exception</button>' : '') + (!i.auto ? '<button class="vf-link" data-rm="' + i.id + '">Remove</button>' : '') + '</div>';
        }).join('') + '<div class="vf-row"><div><input class="vf-in" data-addck="' + ph + '" placeholder="Add an item"></div><button class="btn mini" data-addbtn="' + ph + '">Add</button></div>';
      });
      h += '<h3 class="sec">Deliverables</h3><ul class="vf-hist">' + (d.deliverables.map(function (x) { return '<li><b>' + esc(x.title) + '</b> ' + (x.category ? pill(x.category) : '') + ' ' + (x.kind === 'file' ? '<button class="vf-link" data-dl="' + x.id + '">' + esc(x.filename) + ' (' + kb(x.size) + ')</button>' : x.kind === 'link' ? esc(x.url) : 'written details') + (locked ? '' : ' <button class="vf-link" data-dd="' + x.id + '">Remove</button>') + '</li>'; }).join('') || '<li>None yet.</li>') + '</ul>';
      if (!locked) h += '<div class="vf-row"><div><label class="vf-l" for="dv-t">Title</label><input class="vf-in" id="dv-t" maxlength="150"></div><div><label class="vf-l" for="dv-c">Category</label><input class="vf-in" id="dv-c" maxlength="80" placeholder="Credentials, Documentation, Reports..."></div><div><label class="vf-l" for="dv-u">Link (https://)</label><input class="vf-in" id="dv-u"></div><button class="btn mini" id="dv-link">Add link</button></div><div class="vf-row"><div><label class="vf-l" for="dv-b">Written details (for example how to log in; do not paste passwords into email)</label><textarea class="vf-in" id="dv-b" style="min-height:70px"></textarea></div><button class="btn mini" id="dv-text">Add text</button></div><div class="vf-row"><div><label class="vf-l" for="dv-f">Or upload a file (PNG, JPG, WebP or PDF, 5 MB)</label><input class="vf-in" type="file" id="dv-f" accept=".png,.jpg,.jpeg,.webp,.pdf"></div></div>';
      h += '<h3 class="sec">Client feedback</h3><ul class="vf-hist">' + (d.feedback.map(function (x) { return '<li><b>' + (x.author === 'owner' ? 'Us' : 'Client') + '</b> ' + pill(x.kind) + ' ' + (x.author === 'client' ? pill(x.status, x.status === 'resolved' ? 'green' : x.status === 'declined' ? 'red' : 'gold') : '') + '<br>' + esc(x.body) + (x.resolution ? '<br><i>' + esc(x.resolution) + '</i>' : '') + '<small>' + fmtT(x.created_at) + '</small>' +
        (x.author === 'client' && x.kind !== 'question' && x.status !== 'resolved' && x.status !== 'declined' ? '<span class="bp-act" style="margin-top:6px"><button class="btn mini" data-fb="' + x.id + '" data-s="in_progress">Working on it</button><button class="btn mini" data-fb="' + x.id + '" data-s="resolved">Resolved</button><button class="btn mini" data-fb="' + x.id + '" data-s="declined">Decline</button></span>' : '') + '</li>'; }).join('') || '<li>None.</li>') + '</ul>' +
        '<div class="vf-row"><div><label class="vf-l" for="fb-r">Reply to the client or explanation for the button above</label><input class="vf-in" id="fb-r" maxlength="2000"></div><button class="btn mini" id="fb-send">Send reply</button></div>';
      if (d.acceptance) h += '<h3 class="sec">Acceptance record</h3><p>Accepted by <b>' + esc(d.acceptance.signed_name) + '</b> on ' + fmtT(d.acceptance.signed_at) + ' from IP ' + esc(d.acceptance.signed_ip) + '. <button class="vf-link" id="ac-doc">Open record</button></p>';
      h += '<h3 class="sec">History</h3><ul class="vf-hist">' + d.history.slice().reverse().map(function (x) { return '<li>' + esc(x.action) + (x.from_status && x.from_status !== x.to_status ? ' (' + esc(x.from_status.replace(/_/g, ' ')) + ' to ' + esc(x.to_status.replace(/_/g, ' ')) + ')' : '') + (x.note ? ': ' + esc(x.note) : '') + '<small>' + fmtT(x.at) + ' - ' + esc(x.actor) + '</small></li>'; }).join('') + '</ul>';
      body.innerHTML = h;
      var again = function () { if (!stale(g)) route(); }, err = function (e) { toast(API.text(e)); };
      qa('[data-tr]').forEach(function (b) { b.onclick = function () {
        var a = b.getAttribute('data-tr');
        if (ACT[a][1] && !q('#tr-note').value.trim()) { toast('Please add a note first.'); return; }
        b.disabled = true; var p = { action: a, note: q('#tr-note').value }; if (q('#tr-m')) p.method = q('#tr-m').value;
        API.post(base + '/transition', p).then(function () { toast('Done.'); again(); }, function (e) { b.disabled = false; toast(API.text(e)); });
      }; });
      var x;
      q('#hd-save').onclick = function () { API.call('PATCH', base, { title: q('#hd-t').value, assignee: q('#hd-a').value, dueDate: q('#hd-d').value, previewUrl: q('#hd-p').value, instructions: q('#hd-i').value, supportNote: q('#hd-s').value }).then(function () { toast('Saved.'); again(); }, err); };
      qa('[data-ck]').forEach(function (c) { c.onchange = function () { API.call('PATCH', base + '/checklist/' + c.getAttribute('data-ck'), { done: c.checked }).then(again, err); }; });
      qa('[data-ex]').forEach(function (c) { c.onclick = function () { var r = prompt('Why is this item being skipped? This is recorded in the history.'); if (r) API.call('PATCH', base + '/checklist/' + c.getAttribute('data-ex'), { exceptionReason: r }).then(again, err); }; });
      qa('[data-rm]').forEach(function (c) { c.onclick = function () { API.call('DELETE', base + '/checklist/' + c.getAttribute('data-rm')).then(again, err); }; });
      qa('[data-addbtn]').forEach(function (c) { c.onclick = function () { var ph = c.getAttribute('data-addbtn'), v = q('[data-addck="' + ph + '"]').value; if (v) API.post(base + '/checklist', { phase: ph, label: v }).then(again, err); }; });
      if ((x = q('#dv-link'))) x.onclick = function () { API.post(base + '/deliverables', { kind: 'link', title: q('#dv-t').value, category: q('#dv-c').value, url: q('#dv-u').value }).then(again, err); };
      if ((x = q('#dv-text'))) x.onclick = function () { API.post(base + '/deliverables', { kind: 'text', title: q('#dv-t').value, category: q('#dv-c').value, body: q('#dv-b').value }).then(again, err); };
      if ((x = q('#dv-f'))) x.onchange = function () { var f = x.files[0]; if (!f) return; if (!q('#dv-t').value.trim()) { toast('Give it a title first.'); x.value = ''; return; } API.upload(base + '/deliverables?kind=file&title=' + encodeURIComponent(q('#dv-t').value) + '&category=' + encodeURIComponent(q('#dv-c').value) + '&name=' + encodeURIComponent(f.name), f).then(again, err); };
      qa('[data-dd]').forEach(function (c) { c.onclick = function () { API.call('DELETE', base + '/deliverables/' + c.getAttribute('data-dd')).then(again, err); }; });
      qa('[data-dl]').forEach(function (c) { c.onclick = function () { API.call('GET', base + '/files/' + c.getAttribute('data-dl'), undefined, { blob: true }).then(saveBlob, err); }; });
      qa('[data-fb]').forEach(function (c) { c.onclick = function () { var s = c.getAttribute('data-s'), r = q('#fb-r').value; if (s === 'declined' && !r.trim()) { toast('Type the reason in the reply box first.'); return; } API.post(base + '/feedback/' + c.getAttribute('data-fb'), { status: s, resolution: r }).then(again, err); }; });
      q('#fb-send').onclick = function () { API.post(base + '/reply', { body: q('#fb-r').value }).then(function () { toast('Reply recorded.'); again(); }, err); };
      if ((x = q('#ac-doc'))) x.onclick = function () { openDoc(base + '/acceptance'); };
    }, function (e) { if (!stale(g)) fail(e); });
  }

  /* =============================================================== entry points in the existing pages =============================================================== */
  function inject() {
    var u = API.user; if (!u) return;
    var pb = q('#bp-body');
    if (pb && u.role === 'client' && !q('#vf-entry', pb) && pb.children.length > 2) {
      var c = document.createElement('div'); c.id = 'vf-entry'; c.className = 'vf-hub';
      c.innerHTML = '<b>Client Onboarding</b><p class="vf-saved">Fill in your onboarding forms, see what we still need, and follow your project handover.</p><button class="btn small gold" data-vfgo="#forms">Open Client Onboarding</button> <button class="btn small" data-vfgo="#handover">My projects</button>';
      pb.insertBefore(c, pb.children[2] || null);
    }
    var ab = q('#ba-body');
    if (ab && (u.role === 'owner' || u.role === 'admin' || u.role === 'staff') && !q('#vf-aentry', ab) && ab.children.length > 2) {
      var a = document.createElement('div'); a.id = 'vf-aentry'; a.className = 'vf-hub';
      a.innerHTML = '<button class="btn small gold" data-vfgo="#admin-forms">Client Onboarding Management</button> <button class="btn small" data-vfgo="#admin-handovers">Handover Management</button>';
      ab.insertBefore(a, ab.children[2] || null);
    }
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-vfgo]'); if (!b) return;
    e.preventDefault(); location.hash = b.getAttribute('data-vfgo');
  });
  var scheduled = false;
  new MutationObserver(function () { if (scheduled) return; scheduled = true; setTimeout(function () { scheduled = false; try { inject(); } catch (e) {} }, 60); }).observe(document.body, { childList: true, subtree: true });
  API.onChange(function () { setTimeout(inject, 100); });
  route();
})();
