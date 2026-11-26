/* Vintage Advertising: Project Centre, payment proofs and team access screens.
   Loaded with <script src="centre.js"></script> after forms.js. Uses window.API and the styles forms.js installs. Hashes:
   CLIENT  #projects  #project-PRJ-0001
   TEAM    #admin-projects  #admin-project-PRJ-0001  #admin-proofs  #admin-team
   The server decides what each role may do; this file only hides buttons the server would refuse. */
(function () {
  'use strict';
  if (!window.API || !API.on) return;

  var STATUS = { enquiry: 'Enquiry', awaiting_agreement: 'Awaiting Agreement', awaiting_deposit: 'Awaiting Deposit', onboarding: 'Onboarding', in_progress: 'In Progress', internal_review: 'Internal Review', client_review: 'Client Review', revisions: 'Revisions', awaiting_final_payment: 'Awaiting Final Payment', ready_for_handover: 'Ready for Handover', completed: 'Completed', cancelled: 'Cancelled' };
  var TONE = { completed: 'green', cancelled: 'grey', client_review: 'gold', awaiting_deposit: 'gold', awaiting_final_payment: 'gold', revisions: 'red', enquiry: 'grey' };
  var SERVICES = { websites: 'Website', marketing: 'Marketing', ai: 'AI chatbot', automation: 'Automation', seo: 'SEO', other: 'Other' };
  var PROOF = { proof_submitted: ['Proof received', 'gold'], under_verification: ['Being verified', 'blue'], verified: ['Verified', 'green'], rejected: ['Rejected', 'red'] };
  var PAYSTATE = { unpaid: ['Unpaid', 'grey'], payment_reported: ['Payment reported, not yet paid', 'gold'], verified: ['Paid', 'green'], refunded: ['Refunded', 'grey'], proof_submitted: ['Proof received, not yet paid', 'gold'], under_verification: ['Being verified, not yet paid', 'blue'], rejected: ['Proof rejected', 'red'], paid: ['Paid', 'green'] };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmt(d) { return d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'; }
  function fmtT(d) { return d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'; }
  function usd(n, c) { return (c && c !== 'USD' ? c + ' ' : '$') + Number(n).toFixed(2); }
  function toast(t) { var d = document.createElement('div'); d.className = 'toast'; d.textContent = t; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 3800); }
  function q(s, r) { return (r || document).querySelector(s); }
  function qa(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function pill(t, tone) { return '<span class="vf-pill vf-' + (tone || 'grey') + '">' + esc(t) + '</span>'; }
  function sPill(s) { return pill(STATUS[s] || s, TONE[s] || 'blue'); }
  function bar(p) { return '<div class="vf-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + p + '"><i style="width:' + p + '%"></i></div>'; }
  function isTeam(u) { return u && (u.role === 'owner' || u.role === 'admin' || u.role === 'staff'); }
  function opts(map, sel) { return Object.keys(map).map(function (k) { return '<option value="' + k + '"' + (k === sel ? ' selected' : '') + '>' + esc(map[k]) + '</option>'; }).join(''); }
  function openBlob(path) { API.call('GET', path, undefined, { blob: true }).then(function (b) { var u = URL.createObjectURL(b); window.open(u, '_blank'); setTimeout(function () { URL.revokeObjectURL(u); }, 60000); }, function (e) { toast(API.text(e)); }); }

  var sec = document.createElement('section');
  sec.className = 'bp'; sec.id = 'pcview'; sec.setAttribute('role', 'dialog'); sec.setAttribute('aria-label', 'Projects');
  sec.innerHTML = '<div class="bp-in"><button class="btn small" type="button" id="pc-x" style="position:fixed;top:calc(18px + env(safe-area-inset-top,0px));right:max(16px,env(safe-area-inset-right,0px));z-index:5">Close</button><div id="pc-body" style="padding-top:34px"></div></div>';
  document.body.appendChild(sec);
  var body = q('#pc-body'), gen = 0, current = null;
  function stale(g) { return g !== gen; }
  function close() { sec.classList.remove('show'); document.body.style.overflow = ''; gen++; }
  q('#pc-x').onclick = function () { history.replaceState(null, '', location.pathname + location.search); close(); };
  function go(h) { if (location.hash === h) route(); else location.hash = h; }
  function fail(e) { body.innerHTML = '<div class="eyebrow">Something went wrong</div><p class="lead">' + esc(API.text(e)) + '</p><p><button class="btn small" data-act="reload">Try again</button></p>'; }
  function again() { route(true); }
  function field(label, id, inner) { return '<div><label class="vf-l" for="' + id + '" style="display:block;font:500 .8rem var(--font-body);margin-bottom:4px">' + esc(label) + '</label>' + inner + '</div>'; }

  /* ---------------- routing ---------------- */
  function route(keep) {
    var h = decodeURIComponent(location.hash || ''), m, r = null;
    if (h === '#projects') r = ['cList'];
    else if ((m = /^#project-(PRJ-\d+)$/.exec(h))) r = ['cView', m[1]];
    else if (h === '#admin-projects') r = ['tList'];
    else if ((m = /^#admin-project-(PRJ-\d+)$/.exec(h))) r = ['tView', m[1]];
    else if (h === '#admin-proofs') r = ['tProofs'];
    else if (h === '#admin-team') r = ['tTeam'];
    else if (h === '#admin-seo') r = ['tSeo'];
    if (!r) { if (sec.classList.contains('show')) close(); return; }
    current = r; var g = ++gen;
    sec.classList.add('show'); document.body.style.overflow = 'hidden'; if (!keep) sec.scrollTop = 0;
    if (!keep) body.innerHTML = '<p class="lead">Loading...</p>';
    API.ready.then(function () {
      if (stale(g)) return; var u = API.user;
      if (!u) { body.innerHTML = '<div class="eyebrow">Sign in</div><h2>Please sign in first</h2><p><a class="btn small gold" href="#portal">Sign in</a></p>'; return; }
      var teamView = r[0][0] === 't';
      if (teamView && !isTeam(u)) { body.innerHTML = '<h2>Not available</h2><p class="lead">This area is for the Vintage Advertising team.</p>'; return; }
      if (!teamView && u.role !== 'client') { body.innerHTML = '<h2>Client area</h2><p class="lead">This is the client view. Team members use <a class="vf-link" href="#admin-projects">Projects</a> instead.</p>'; return; }
      ({ cList: cList, cView: cView, tList: tList, tView: tView, tProofs: tProofs, tTeam: tTeam, tSeo: tSeo })[r[0]](g, r[1], u);
    });
  }
  window.addEventListener('hashchange', function () { route(); });
  body.addEventListener('click', function (e) {
    if (e.target.closest('[data-act="reload"]')) route();
    var l = e.target.closest('[data-go]'); if (l) { e.preventDefault(); go(l.getAttribute('data-go')); }
  });
  function nav(items) { return '<p class="vf-row" style="margin:0 0 14px">' + items.map(function (i) { return '<button class="btn mini" data-go="' + i[1] + '">' + i[0] + '</button>'; }).join('') + '</p>'; }
  function post(path, data, done) { API.post(path, data).then(function (r) { if (done) done(r); }, function (e) { toast(API.text(e)); }); }
  function patch(path, data, done) { API.call('PATCH', path, data).then(function (r) { if (done) done(r); }, function (e) { toast(API.text(e)); }); }
  function val(id) { var el = q('#' + id, body); return el ? el.value.trim() : ''; }

  /* ================= CLIENT: list ================= */
  function cList(g) {
    API.get('/api/portal/projects').then(function (d) {
      if (stale(g)) return;
      var h = nav([['Back to my account', '#portal'], ['Onboarding forms', '#forms']]) + '<div class="eyebrow">Projects</div><h2>Your projects</h2>';
      if (!d.projects.length) h += '<p class="lead">You have no projects yet. Once we start work, it will appear here with its progress, updates and invoices.</p>';
      h += '<div class="vf-grid">' + d.projects.map(function (p) {
        return '<div class="vf-card"><small class="vf-saved">' + esc(p.id) + ' | ' + esc(SERVICES[p.service] || p.service) + '</small><h4>' + esc(p.name) + '</h4><div>' + sPill(p.status) + '</div>' + bar(p.progress) +
          '<p>' + p.progress + '% complete' + (p.milestonesTotal ? ' (' + p.milestonesDone + ' of ' + p.milestonesTotal + ' steps)' : '') + '</p>' + (p.actions ? '<p style="color:var(--gold)">' + p.actions + ' thing' + (p.actions > 1 ? 's' : '') + ' for you to do</p>' : '') +
          '<button class="btn mini" data-go="#project-' + esc(p.id) + '">Open</button></div>';
      }).join('') + '</div>';
      body.innerHTML = h;
    }, function (e) { if (!stale(g)) fail(e); });
  }

  /* ================= CLIENT: one project ================= */
  function cView(g, id) {
    var base = '/api/portal/projects/' + id;
    API.get(base).then(function (p) {
      if (stale(g)) return;
      var h = nav([['All projects', '#projects']]) + '<div class="eyebrow">' + esc(p.id) + ' | ' + esc(SERVICES[p.service] || p.service) + '</div><h2>' + esc(p.name) + '</h2><p>' + sPill(p.status) + (p.assignedTo ? ' <span class="vf-saved">Looked after by ' + esc(p.assignedTo) + '</span>' : '') + '</p>' + bar(p.progress) +
        '<p class="vf-saved">' + p.progress + '% complete. Progress counts finished steps only; it is never estimated.' + (p.target ? ' Target date ' + fmt(p.target) + '.' : '') + '</p>';
      if (p.description) h += '<p class="lead">' + esc(p.description) + '</p>';
      if (p.actions.length) h += '<div class="vf-hub"><b>What you need to do</b><ul class="vf-hist">' + p.actions.map(function (a) {
        var go = a.type === 'onboarding' ? ' <button class="vf-link" data-go="#forms">Open</button>' : a.type === 'handover' ? ' <button class="vf-link" data-go="#handover-' + esc(a.ref) + '">Open</button>' : '';
        return '<li>' + esc(a.text) + go + '</li>'; }).join('') + '</ul></div>';
      if (p.milestones.length) h += '<div class="vf-sec"><h3>Steps</h3><ul class="vf-hist">' + p.milestones.map(function (m) {
        return '<li>' + (m.status === 'done' ? pill('Done', 'green') : m.status === 'in_progress' ? pill('In progress', 'blue') : m.status === 'skipped' ? pill('Skipped', 'grey') : pill('Planned', 'grey')) + ' <b>' + esc(m.title) + '</b>' + (m.due ? ' <small>Due ' + fmt(m.due) + '</small>' : '') + (m.description ? '<small>' + esc(m.description) + '</small>' : '') + '</li>'; }).join('') + '</ul></div>';
      if (p.invoices.length) h += '<div class="vf-sec"><h3>Invoices</h3><p class="vf-i">Payment is by bank transfer only. An invoice is marked paid only after we have confirmed the money in our bank account. Uploading a receipt does not mark it paid.</p><div id="pc-inv">' + p.invoices.map(function (i) {
        return '<div class="vf-card" data-inv="' + esc(i.id) + '" style="margin:10px 0"><b>' + esc(i.id) + '</b> ' + (i.status === 'paid' ? pill('Paid', 'green') : pill('Unpaid', 'grey')) + '<p>' + esc(i.description) + ' | ' + usd(i.amount, i.currency) + ' | due ' + fmt(i.due) + '</p>' +
          '<p><button class="btn mini" data-pdf="' + esc(i.id) + '">Download PDF</button></p>' + (i.status === 'unpaid' ? '<div data-proofs></div><div class="vf-row"><label class="btn mini" style="cursor:pointer">Upload transfer receipt<input type="file" accept="image/jpeg,image/png,image/webp" hidden data-proof="' + esc(i.id) + '"></label><button class="btn mini" data-go="#pay-' + esc(i.id) + '">How to pay</button></div>' : '') + '</div>'; }).join('') + '</div></div>';
      if (p.handover) h += '<div class="vf-sec"><h3>Handover</h3><p>' + pill(String(p.handover.status).replace(/_/g, ' '), 'blue') + ' <button class="btn mini" data-go="#handover-' + esc(p.handover.id) + '">Open handover</button></p></div>';
      if (p.updates.length) h += '<div class="vf-sec"><h3>Updates from us</h3><ul class="vf-hist">' + p.updates.map(function (u) { return '<li>' + esc(u.body) + '<small>' + esc(u.author) + ', ' + fmtT(u.at) + '</small></li>'; }).join('') + '</ul></div>';
      h += '<div class="vf-sec"><h3>Files</h3><ul class="vf-files">' + (p.files.length ? p.files.map(function (f) { return '<li><button class="vf-link" data-file="' + f.id + '">' + esc(f.name) + '</button> <small>' + (f.kind === 'client_upload' ? 'You uploaded' : 'From us') + ', ' + fmt(f.addedAt) + '</small></li>'; }).join('') : '<li class="vf-saved">No files yet.</li>') + '</ul>' +
        '<label class="btn mini" style="cursor:pointer">Add a file (PNG, JPG, WebP or PDF, up to 5 MB)<input type="file" accept="image/png,image/jpeg,image/webp,application/pdf" hidden id="pc-up"></label></div>';
      h += '<div class="vf-sec"><h3>Ask for a change</h3>' + (p.revisions.length ? '<ul class="vf-hist">' + p.revisions.map(function (v) { return '<li>' + pill(v.status.replace('_', ' '), v.status === 'done' ? 'green' : 'blue') + ' ' + esc(v.body) + (v.response ? '<small>Our reply: ' + esc(v.response) + '</small>' : '') + '</li>'; }).join('') + '</ul>' : '') +
        '<div class="vf-q"><textarea class="vf-in" id="pc-rev" maxlength="3000" aria-label="Describe the change you want"></textarea></div><button class="btn small" id="pc-rev-go">Send change request</button></div>';
      h += '<div class="vf-sec"><h3>Messages</h3><ul class="vf-hist">' + (p.messages.length ? p.messages.map(function (m) { return '<li><b>' + (m.from === 'client' ? 'You' : esc(m.author)) + '</b> <small>' + fmtT(m.at) + '</small>' + esc(m.body) + '</li>'; }).join('') : '<li class="vf-saved">No messages yet.</li>') + '</ul>' +
        '<div class="vf-q"><textarea class="vf-in" id="pc-msg" maxlength="3000" aria-label="Write a message"></textarea></div><button class="btn small gold" id="pc-msg-go">Send message</button></div>';
      if (p.history.length) h += '<div class="vf-sec"><h3>History</h3><ul class="vf-hist">' + p.history.slice(0, 30).map(function (x) { return '<li>' + esc(String(x.action).replace(/_/g, ' ')) + (x.to ? ': ' + esc(STATUS[x.to] || x.to) : '') + (x.note ? '. ' + esc(x.note) : '') + '<small>' + fmtT(x.at) + '</small></li>'; }).join('') + '</ul></div>';
      body.innerHTML = h;
      qa('[data-inv]', body).forEach(function (card) { var iid = card.getAttribute('data-inv'), box = q('[data-proofs]', card); if (!box) return;
        API.get('/api/portal/invoices/' + iid + '/proofs').then(function (r) { if (stale(g)) return; var s = PAYSTATE[r.paymentState] || PAYSTATE.unpaid;
          box.innerHTML = '<p>' + pill(s[0], s[1]) + '</p>' + (r.proofs.length ? '<ul class="vf-files">' + r.proofs.map(function (x) { var st = PROOF[x.status] || [x.status, 'grey']; return '<li>' + pill(st[0], st[1]) + ' <button class="vf-link" data-pf="' + esc(iid) + '|' + x.id + '">' + esc(x.name) + '</button> <small>' + fmtT(x.submittedAt) + '</small>' + (x.note ? '<small>Note: ' + esc(x.note) + '</small>' : '') + '</li>'; }).join('') + '</ul>' : ''); }, function () {}); });
      body.onclick = function (e) {
        var t;
        if ((t = e.target.closest('[data-file]'))) { openBlob(base + '/files/' + t.getAttribute('data-file')); return; }
        if ((t = e.target.closest('[data-pdf]'))) { openBlob('/api/portal/invoices/' + t.getAttribute('data-pdf') + '/pdf'); return; }
        if ((t = e.target.closest('[data-pf]'))) { var a = t.getAttribute('data-pf').split('|'); openBlob('/api/portal/invoices/' + a[0] + '/proofs/' + a[1]); return; }
        if (e.target.closest('#pc-msg-go')) { var m = val('pc-msg'); if (m) post(base + '/messages', { body: m }, function () { toast('Message sent.'); again(); }); return; }
        if (e.target.closest('#pc-rev-go')) { var v = val('pc-rev'); if (v) post(base + '/revisions', { body: v }, function () { toast('Change request sent.'); again(); }); return; }
        var l = e.target.closest('[data-go]'); if (l) { e.preventDefault(); go(l.getAttribute('data-go')); }
      };
      body.onchange = function (e) {
        var inp = e.target, f = inp.files && inp.files[0]; if (!f) return;
        if (f.size > 5 * 1024 * 1024) { toast('That file is over 5 MB.'); inp.value = ''; return; }
        if (inp.id === 'pc-up') API.upload(base + '/files?name=' + encodeURIComponent(f.name), f).then(function () { toast('File added.'); again(); }, function (er) { toast(API.text(er)); });
        else if (inp.hasAttribute('data-proof')) {
          var amt = prompt('Optional: how much did you send? (leave empty to skip)', '');
          API.upload('/api/portal/invoices/' + inp.getAttribute('data-proof') + '/proof?name=' + encodeURIComponent(f.name) + (amt && Number(amt) > 0 ? '&amount=' + encodeURIComponent(amt) : ''), f).then(function (r) { toast(r.note || 'Receipt received. The invoice stays unpaid until we confirm the money.'); again(); }, function (er) { toast(API.text(er)); });
        }
      };
    }, function (e) { if (!stale(g)) fail(e); });
  }

  /* ================= TEAM: project list ================= */
  function tList(g, _a, u) {
    Promise.all([API.get('/api/admin/projects' + (tList.filter ? '?status=' + tList.filter : '')), API.get('/api/admin/projects-overview'), API.get('/api/admin/clients').catch(function () { return { clients: [] }; }), API.get('/api/admin/team').catch(function () { return { team: [] }; })]).then(function (rs) {
      if (stale(g)) return; var list = rs[0].projects, ov = rs[1], clients = rs[2].clients, tm = rs[3].team;
      var h = nav([['Payment proofs', '#admin-proofs'], ['Team access', '#admin-team'], ['SEO register', '#admin-seo'], ['Onboarding', '#admin-forms'], ['Handovers', '#admin-handovers']]) + '<div class="eyebrow">Project Centre</div><h2>Projects</h2>' +
        '<p class="vf-saved">' + Object.keys(ov.byStatus).map(function (k) { return esc(STATUS[k] || k) + ': ' + ov.byStatus[k]; }).join(' | ') + (ov.pastTarget ? ' | <b style="color:#ff9b8f">Past target date: ' + ov.pastTarget + '</b>' : '') + '</p>' +
        '<div class="vf-row">' + field('Show', 'pc-f', '<select class="vf-in" id="pc-f"><option value="">All statuses</option>' + opts(STATUS, tList.filter) + '</select>') + '</div>';
      h += '<div class="vf-scroll"><table class="vf-tbl vf-stack"><thead><tr><th>Project</th><th>Client</th><th>Status</th><th>Progress</th><th>Assigned</th></tr></thead><tbody>' + (list.length ? list.map(function (p) {
        return '<tr><td><button class="vf-link" data-go="#admin-project-' + esc(p.id) + '">' + esc(p.id) + '</button> ' + esc(p.name) + '</td><td>' + esc(p.clientName) + '</td><td>' + sPill(p.status) + '</td><td>' + p.progress + '%</td><td>' + esc(p.assignedTo || '-') + '</td></tr>'; }).join('') : '<tr><td colspan="5" class="vf-saved">No projects.</td></tr>') + '</tbody></table></div>';
      h += '<div class="vf-sec"><h3>New project</h3><div class="vf-row">' + field('Client', 'np-c', '<select class="vf-in" id="np-c">' + clients.map(function (c) { return '<option value="' + esc(c.id) + '">' + esc(c.name) + ' (' + esc(c.email) + ')</option>'; }).join('') + '</select>') +
        field('Project name', 'np-n', '<input class="vf-in" id="np-n" maxlength="120">') + field('Service', 'np-s', '<select class="vf-in" id="np-s">' + opts(SERVICES, 'websites') + '</select>') + field('Target date', 'np-d', '<input class="vf-in" id="np-d" type="date">') +
        field('Assign to', 'np-a', '<select class="vf-in" id="np-a"><option value="">Nobody yet</option>' + tm.filter(function (x) { return x.active; }).map(function (x) { return '<option value="' + esc(x.id) + '">' + esc(x.name) + ' (' + esc(x.role) + ')</option>'; }).join('') + '</select>') +
        '<button class="btn small gold" id="np-go">Create</button></div></div>';
      body.innerHTML = h;
      q('#pc-f', body).onchange = function () { tList.filter = this.value; again(); };
      q('#np-go', body).onclick = function () { var n = val('np-n'); if (!n) { toast('Give the project a name.'); return; }
        post('/api/admin/projects', { clientId: val('np-c'), name: n, service: val('np-s'), targetDate: val('np-d') || undefined, assignedTo: val('np-a') || undefined }, function (p) { toast('Project created.'); go('#admin-project-' + p.id); }); };
      body.onclick = null; body.onchange = null;
    }, function (e) { if (!stale(g)) fail(e); });
  }

  /* ================= TEAM: one project ================= */
  function tView(g, id, u) {
    var base = '/api/admin/projects/' + id;
    Promise.all([API.get(base), API.get('/api/admin/team').catch(function () { return { team: [] }; })]).then(function (rs) {
      if (stale(g)) return; var p = rs[0], tm = rs[1].team;
      var h = nav([['All projects', '#admin-projects'], ['Payment proofs', '#admin-proofs']]) + '<div class="eyebrow">' + esc(p.id) + ' | ' + esc(SERVICES[p.service] || p.service) + '</div><h2>' + esc(p.name) + '</h2><p>' + sPill(p.status) + '</p>' + bar(p.progress) +
        '<p class="vf-saved">' + p.progress + '% from ' + p.milestonesDone + ' of ' + p.milestonesTotal + ' finished steps. Onboarding ' + p.onboarding.percent + '%.' + (p.depositException ? ' <b style="color:var(--gold)">Deposit exception: ' + esc(p.depositException) + '</b>' : '') + '</p>';
      h += '<div class="vf-sec"><h3>Status</h3><p class="vf-i">The server refuses moves that skip the rules (for example starting work before the deposit is verified, or completing before the handover is complete). If it refuses, the reason is shown.</p><div class="vf-row">' +
        field('Move to', 'st-s', '<select class="vf-in" id="st-s">' + opts(STATUS, p.status) + '</select>') + field('Note', 'st-n', '<input class="vf-in" id="st-n" maxlength="500">') + field('Exception reason (only if allowed)', 'st-e', '<input class="vf-in" id="st-e" maxlength="500">') + '<button class="btn small gold" id="st-go">Change status</button></div>' +
        '<div class="vf-row">' + field('Assigned to', 'as-a', '<select class="vf-in" id="as-a"><option value="">Nobody</option>' + tm.filter(function (x) { return x.active; }).map(function (x) { return '<option value="' + esc(x.id) + '"' + (x.id === p.assignedToId ? ' selected' : '') + '>' + esc(x.name) + '</option>'; }).join('') + '</select>') + '<button class="btn small" id="as-go">Save assignment</button></div></div>';
      h += '<div class="vf-sec"><h3>Steps</h3><ul class="vf-hist">' + p.milestones.map(function (m) { return '<li><b>' + esc(m.title) + '</b> (weight ' + m.weight + (m.clientVisible === false ? ', internal' : '') + ') ' + pill(m.status.replace('_', ' '), m.status === 'done' ? 'green' : 'blue') +
        ' <select class="vf-in" style="width:auto;display:inline-block" data-ms="' + m.id + '">' + opts({ pending: 'Planned', in_progress: 'In progress', done: 'Done', skipped: 'Skipped' }, m.status) + '</select></li>'; }).join('') + '</ul>' +
        '<div class="vf-row">' + field('New step', 'ms-t', '<input class="vf-in" id="ms-t" maxlength="140">') + field('Weight (1-100)', 'ms-w', '<input class="vf-in" id="ms-w" type="number" min="1" max="100" value="1">') + '<button class="btn small" id="ms-go">Add step</button></div></div>';
      h += '<div class="vf-sec"><h3>Invoices</h3><ul class="vf-hist">' + (p.invoices.length ? p.invoices.map(function (i) { return '<li>' + esc(i.id) + ' ' + (i.status === 'paid' ? pill('Paid', 'green') : pill(i.status, 'grey')) + ' ' + usd(i.amount, i.currency) + ' <button class="vf-link" data-pdf="' + esc(i.id) + '">PDF</button><small>' + esc(i.description) + '</small></li>'; }).join('') : '<li class="vf-saved">None linked.</li>') + '</ul>' +
        '<div class="vf-row">' + field('Link an invoice (e.g. INV-1001)', 'iv-i', '<input class="vf-in" id="iv-i" maxlength="20">') + '<button class="btn small" id="iv-go">Link</button></div><p class="vf-saved">Marking an invoice paid is done only from <a class="vf-link" href="#admin-proofs">Payment proofs</a> or Billing, after checking the bank account.</p></div>';
      h += '<div class="vf-sec"><h3>Post an update</h3><div class="vf-q"><textarea class="vf-in" id="up-b" maxlength="3000" aria-label="Update text"></textarea></div><label class="vf-opt"><input type="checkbox" id="up-v"> Show this to the client (leave unticked for an internal note)</label><button class="btn small" id="up-go">Post update</button>' +
        '<ul class="vf-hist">' + p.updates.slice(0, 10).map(function (x) { return '<li>' + (x.internal ? pill('Internal', 'grey') + ' ' : pill('Client sees', 'green') + ' ') + esc(x.body) + '<small>' + esc(x.author) + ', ' + fmtT(x.at) + '</small></li>'; }).join('') + '</ul></div>';
      h += '<div class="vf-sec"><h3>Change requests</h3><ul class="vf-hist">' + (p.revisions.length ? p.revisions.map(function (v) { return '<li>' + pill(v.status.replace('_', ' '), 'blue') + ' ' + esc(v.body) + ' <select class="vf-in" style="width:auto;display:inline-block" data-rv="' + v.id + '">' + opts({ open: 'Open', in_progress: 'In progress', done: 'Done', declined: 'Declined' }, v.status) + '</select>' + (v.response ? '<small>Reply: ' + esc(v.response) + '</small>' : '') + '</li>'; }).join('') : '<li class="vf-saved">None.</li>') + '</ul></div>';
      h += '<div class="vf-sec"><h3>Tasks</h3><ul class="vf-hist">' + p.tasks.map(function (t) { return '<li>' + esc(t.title) + (t.assigneeName ? ' <small>' + esc(t.assigneeName) + '</small>' : '') + ' <select class="vf-in" style="width:auto;display:inline-block" data-tk="' + t.id + '">' + opts({ open: 'Open', doing: 'Doing', done: 'Done' }, t.status) + '</select></li>'; }).join('') + '</ul><div class="vf-row">' + field('New task', 'tk-t', '<input class="vf-in" id="tk-t" maxlength="200">') + '<button class="btn small" id="tk-go">Add task</button></div></div>';
      h += '<div class="vf-sec"><h3>Files</h3><ul class="vf-files">' + (p.files.length ? p.files.map(function (f) { return '<li><button class="vf-link" data-file="' + f.id + '">' + esc(f.name) + '</button> <small>' + esc(f.kind.replace('_', ' ')) + (f.kind === 'client_upload' ? '' : f.released ? ', released to client' : ', not released') + '</small>' + (f.kind !== 'client_upload' && !f.released ? ' <button class="btn mini" data-rel="' + f.id + '">Release to client</button>' : '') + '</li>'; }).join('') : '<li class="vf-saved">No files.</li>') + '</ul>' +
        '<label class="btn mini" style="cursor:pointer">Add a review file<input type="file" hidden id="tf-up" accept="image/png,image/jpeg,image/webp,application/pdf"></label> <span class="vf-saved">Final deliverables are released in the handover, not here.</span></div>';
      h += '<div class="vf-sec"><h3>Messages</h3><ul class="vf-hist">' + p.messages.map(function (m) { return '<li><b>' + (m.from === 'client' ? 'Client' : esc(m.author)) + '</b> <small>' + fmtT(m.at) + '</small>' + esc(m.body) + '</li>'; }).join('') + '</ul><div class="vf-q"><textarea class="vf-in" id="mg-b" maxlength="3000" aria-label="Reply"></textarea></div><button class="btn small gold" id="mg-go">Reply to client</button></div>';
      h += '<div class="vf-sec"><h3>History</h3><ul class="vf-hist">' + p.history.slice(0, 40).map(function (x) { return '<li>' + esc(String(x.action).replace(/_/g, ' ')) + (x.to ? ': ' + esc(STATUS[x.to] || x.to) : '') + (x.note ? '. ' + esc(x.note) : '') + '<small>' + esc(x.actor || '') + ', ' + fmtT(x.at) + '</small></li>'; }).join('') + '</ul></div>';
      body.innerHTML = h;
      body.onclick = function (e) {
        var t, bt = function (id) { return e.target.closest('#' + id); };
        if ((t = e.target.closest('[data-file]'))) { openBlob(base + '/files/' + t.getAttribute('data-file')); return; }
        if ((t = e.target.closest('[data-pdf]'))) { openBlob('/api/admin/invoices/' + t.getAttribute('data-pdf') + '/pdf'); return; }
        if ((t = e.target.closest('[data-rel]'))) { if (confirm('Release this file to the client?')) post(base + '/files/' + t.getAttribute('data-rel') + '/release', {}, function () { toast('Released.'); again(); }); return; }
        if (bt('st-go')) { post(base + '/status', { status: val('st-s'), note: val('st-n'), exception: val('st-e') }, function () { toast('Status changed.'); again(); }); return; }
        if (bt('as-go')) { patch(base, { assignedTo: val('as-a') || null }, function () { toast('Saved.'); again(); }); return; }
        if (bt('ms-go')) { var mt = val('ms-t'); if (mt) post(base + '/milestones', { title: mt, weight: Number(val('ms-w')) || 1 }, function () { again(); }); return; }
        if (bt('iv-go')) { var iv = val('iv-i'); if (iv) post(base + '/invoices', { invoiceId: iv }, function () { toast('Linked.'); again(); }); return; }
        if (bt('up-go')) { var ub = val('up-b'); if (ub) post(base + '/updates', { body: ub, visible: q('#up-v', body).checked }, function () { toast('Posted.'); again(); }); return; }
        if (bt('tk-go')) { var tk = val('tk-t'); if (tk) post(base + '/tasks', { title: tk }, function () { again(); }); return; }
        if (bt('mg-go')) { var mb = val('mg-b'); if (mb) post(base + '/messages', { body: mb }, function () { toast('Sent.'); again(); }); return; }
        var l = e.target.closest('[data-go]'); if (l) { e.preventDefault(); go(l.getAttribute('data-go')); }
      };
      body.onchange = function (e) {
        var s = e.target, x;
        if ((x = s.getAttribute('data-ms'))) { var reason = s.value === 'skipped' ? prompt('Why is this step skipped?', '') : ''; if (s.value === 'skipped' && !reason) { again(); return; } patch(base + '/milestones/' + x, { status: s.value, skipReason: reason || undefined }, function () { again(); }); return; }
        if ((x = s.getAttribute('data-rv'))) { var resp = s.value === 'declined' ? prompt('Reply to the client (shown to them):', '') : ''; patch(base + '/revisions/' + x, { status: s.value, response: resp || '' }, function () { again(); }); return; }
        if ((x = s.getAttribute('data-tk'))) { patch(base + '/tasks/' + x, { status: s.value }, function () { again(); }); return; }
        if (s.id === 'tf-up' && s.files[0]) { var f = s.files[0]; if (f.size > 5 * 1024 * 1024) { toast('That file is over 5 MB.'); return; } API.upload(base + '/files?kind=review&name=' + encodeURIComponent(f.name), f).then(function () { toast('File added.'); again(); }, function (er) { toast(API.text(er)); }); }
      };
    }, function (e) { if (!stale(g)) fail(e); });
  }

  /* ================= TEAM: payment proofs ================= */
  function tProofs(g) {
    API.get('/api/admin/proofs' + (tProofs.filter ? '?status=' + tProofs.filter : '')).then(function (d) {
      if (stale(g)) return;
      var h = nav([['Projects', '#admin-projects']]) + '<div class="eyebrow">Payment proofs</div><h2>Bank transfer receipts</h2><p class="vf-i">A receipt is only a claim. Check your bank account, then verify. An invoice becomes paid only when you verify and confirm you have seen the money in the account.</p>' +
        '<div class="vf-row">' + field('Show', 'pf-f', '<select class="vf-in" id="pf-f"><option value="">All</option>' + opts({ proof_submitted: 'Proof received', under_verification: 'Being verified', verified: 'Verified', rejected: 'Rejected' }, tProofs.filter) + '</select>') + '</div>';
      h += '<div class="vf-scroll"><table class="vf-tbl vf-stack"><thead><tr><th>Invoice</th><th>Client says</th><th>Status</th><th>Received</th><th>Actions</th></tr></thead><tbody>' + (d.proofs.length ? d.proofs.map(function (x) {
        var st = PROOF[x.status] || [x.status, 'grey'], open = x.status === 'proof_submitted' || x.status === 'under_verification';
        return '<tr><td>' + esc(x.invoice) + (x.clientName ? '<br><small>' + esc(x.clientName) + '</small>' : '') + '</td><td>' + (x.reportedAmount != null ? usd(x.reportedAmount, x.currency) : '-') + (x.duplicateOf ? '<br><b style="color:#ff9b8f">Same file as an earlier upload</b>' : '') + '</td><td>' + pill(st[0], st[1]) + (x.note ? '<br><small>' + esc(x.note) + '</small>' : '') + '</td><td>' + fmtT(x.submittedAt) + '</td><td>' +
          '<button class="btn mini" data-view="' + x.id + '">View</button>' + (open ? ' ' + (x.status === 'proof_submitted' ? '<button class="btn mini" data-pr="start_verification|' + x.id + '">Start checking</button> ' : '') + '<button class="btn mini gold" data-pr="verify|' + x.id + '">Verify</button> <button class="btn mini" data-pr="reject|' + x.id + '">Reject</button>' : '') + ' <button class="vf-link" data-hist="' + esc(x.invoice) + '">History</button></td></tr>'; }).join('') : '<tr><td colspan="5" class="vf-saved">No proofs.</td></tr>') + '</tbody></table></div><div id="pf-hist"></div>';
      body.innerHTML = h;
      q('#pf-f', body).onchange = function () { tProofs.filter = this.value; again(); };
      body.onchange = null;
      body.onclick = function (e) {
        var t;
        if ((t = e.target.closest('[data-view]'))) { openBlob('/api/admin/proofs/' + t.getAttribute('data-view') + '/file'); return; }
        if ((t = e.target.closest('[data-hist]'))) { var iv = t.getAttribute('data-hist'); API.get('/api/admin/invoices/' + iv + '/payment-history').then(function (r) { q('#pf-hist', body).innerHTML = '<h3 class="sec">Payment history, ' + esc(iv) + '</h3><ul class="vf-hist">' + r.events.map(function (x) { return '<li>' + esc(String(x.action).replace(/_/g, ' ')) + ' <small>' + esc(x.actor) + ', ' + fmtT(x.at) + (x.detail ? '. ' + esc(x.detail) : '') + '</small></li>'; }).join('') + '</ul>'; }, function (er) { toast(API.text(er)); }); return; }
        if ((t = e.target.closest('[data-pr]'))) {
          var a = t.getAttribute('data-pr').split('|'), data = { action: a[0] };
          if (a[0] === 'reject') { var why = prompt('Why is this proof rejected? The client will see this.', ''); if (!why) return; data.note = why; }
          if (a[0] === 'verify') { if (!confirm('Confirm: you have seen this money in the bank account. The invoice will be marked PAID.')) return; data.bankConfirmed = true; data.note = prompt('Optional note (bank reference):', '') || ''; }
          post('/api/admin/proofs/' + a[1] + '/review', data, function () { toast('Done.'); again(); });
        }
      };
    }, function (e) { if (!stale(g)) fail(e); });
  }

  /* ================= TEAM: access ================= */
  function tTeam(g, _a, u) {
    API.get('/api/admin/team').then(function (d) {
      if (stale(g)) return;
      var canManage = function (t) { return u.role === 'owner' ? t.role !== 'owner' : u.role === 'admin' && t.role === 'staff'; };
      var h = nav([['Projects', '#admin-projects']]) + '<div class="eyebrow">Access</div><h2>Team access</h2>' +
        '<ul class="vf-hist"><li><b>Owner</b>: everything, including money, books, exports and creating administrators.</li><li><b>Admin</b>: runs the business day to day: clients, billing, books, projects and staff. Cannot create administrators or change the owner.</li><li><b>Staff</b>: works on assigned projects, tasks, updates, messages and review files. No finance, books or exports.</li><li><b>Client</b>: sees only their own projects, invoices and files.</li></ul>' +
        '<div class="vf-scroll"><table class="vf-tbl vf-stack"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Access</th><th></th></tr></thead><tbody>' + d.team.map(function (t) {
          var me = t.id === u.id, can = canManage(t) && !me;
          return '<tr><td>' + esc(t.name) + (me ? ' (you)' : '') + '</td><td>' + esc(t.email) + '</td><td>' + (can && u.role === 'owner' ? '<select class="vf-in" style="width:auto" data-role="' + esc(t.id) + '">' + opts({ admin: 'Admin', staff: 'Staff' }, t.role) + '</select>' : esc(t.role)) + '</td><td>' + (t.active ? pill('Active', 'green') : pill('Switched off', 'red')) + '</td><td>' + (can ? '<button class="btn mini" data-act2="' + esc(t.id) + '|' + (t.active ? 'off' : 'on') + '">' + (t.active ? 'Switch off' : 'Switch on') + '</button>' : '') + '</td></tr>'; }).join('') + '</tbody></table></div>' +
        '<div class="vf-sec"><h3>Add a team member</h3><p class="vf-i">They receive an email to choose a password.' + (u.role === 'owner' ? '' : ' Only the owner can create administrators.') + '</p><div class="vf-row">' + field('Name', 'tm-n', '<input class="vf-in" id="tm-n" maxlength="100">') + field('Email', 'tm-e', '<input class="vf-in" id="tm-e" type="email" maxlength="200">') + field('Role', 'tm-r', '<select class="vf-in" id="tm-r">' + (u.role === 'owner' ? '<option value="admin">Admin</option>' : '') + '<option value="staff">Staff</option></select>') + '<button class="btn small gold" id="tm-go">Add</button></div></div>';
      body.innerHTML = h;
      body.onclick = function (e) {
        var t;
        if (e.target.closest('#tm-go')) { var n = val('tm-n'), em = val('tm-e'); if (!n || !em) { toast('Enter a name and email.'); return; } post('/api/admin/team', { name: n, email: em, role: val('tm-r') }, function () { toast('Invitation sent.'); again(); }); return; }
        if ((t = e.target.closest('[data-act2]'))) { var a = t.getAttribute('data-act2').split('|'); if (a[1] === 'off' && !confirm('Switch this person off? They will be signed out and cannot sign in.')) return; patch('/api/admin/team/' + a[0], { active: a[1] === 'on' }, function () { again(); }); return; }
        var l = e.target.closest('[data-go]'); if (l) { e.preventDefault(); go(l.getAttribute('data-go')); }
      };
      body.onchange = function (e) { var s = e.target, id = s.getAttribute('data-role'); if (!id) return; if (confirm('Change this person\'s role? They will be signed out and must sign in again.')) patch('/api/admin/team/' + id, { role: s.value }, function () { again(); }); else again(); };
    }, function (e) { if (!stale(g)) fail(e); });
  }


  /* ================= TEAM: SEO register (typed-in, sourced, dated; nothing estimated) ================= */
  var LINKS = { prospect: 'Prospect', requested: 'Requested', live: 'Live', lost: 'Lost', rejected: 'Rejected' };
  function tSeo(g) {
    API.get('/api/admin/seo').then(function (d) {
      if (stale(g)) return;
      var h = nav([['Projects', '#admin-projects']]) + '<div class="eyebrow">SEO</div><h2>SEO register</h2><p class="vf-i">' + esc(d.note) + ' Use Google Search Console for measured positions, impressions and clicks, and type them in with the date. Do not enter estimates or purchased links.</p>' +
        '<div class="vf-sec"><h3>Measured rankings</h3><div class="vf-scroll"><table class="vf-tbl vf-stack"><thead><tr><th>Keyword</th><th>Country</th><th>Page</th><th>Position</th><th>Impr.</th><th>Clicks</th><th>Source, date</th><th></th></tr></thead><tbody>' +
        (d.rankings.length ? d.rankings.map(function (x) { return '<tr><td>' + esc(x.keyword) + '</td><td>' + esc(x.country) + '</td><td>' + esc(x.page) + '</td><td>' + (x.position == null ? '-' : x.position) + '</td><td>' + (x.impressions == null ? '-' : x.impressions) + '</td><td>' + (x.clicks == null ? '-' : x.clicks) + '</td><td>' + esc(x.source) + ', ' + esc(x.measured_on) + '</td><td><button class="vf-link" data-rkdel="' + x.id + '">Remove</button></td></tr>'; }).join('') : '<tr><td colspan="8" class="vf-saved">Nothing recorded yet.</td></tr>') + '</tbody></table></div>' +
        '<div class="vf-row">' + field('Keyword', 'rk-k', '<input class="vf-in" id="rk-k" maxlength="120">') + field('Country', 'rk-c', '<input class="vf-in" id="rk-c" maxlength="40">') + field('Page', 'rk-p', '<input class="vf-in" id="rk-p" value="/" maxlength="200">') + field('Position', 'rk-pos', '<input class="vf-in" id="rk-pos" type="number" step="0.1" min="0">') + field('Source', 'rk-s', '<input class="vf-in" id="rk-s" value="Google Search Console" maxlength="80">') + field('Date measured', 'rk-d', '<input class="vf-in" id="rk-d" type="date">') + '<button class="btn small gold" id="rk-go">Record</button></div></div>' +
        '<div class="vf-sec"><h3>Backlinks</h3><div class="vf-scroll"><table class="vf-tbl vf-stack"><thead><tr><th>Link</th><th>Points to</th><th>Type</th><th>Status</th><th></th></tr></thead><tbody>' +
        (d.backlinks.length ? d.backlinks.map(function (x) { return '<tr><td>' + esc(x.url) + (x.note ? '<br><small>' + esc(x.note) + '</small>' : '') + '</td><td>' + esc(x.target_page) + '</td><td>' + esc(x.kind || '-') + '</td><td><select class="vf-in" style="width:auto" data-bl="' + x.id + '">' + opts(LINKS, x.status) + '</select></td><td><button class="vf-link" data-bldel="' + x.id + '">Remove</button></td></tr>'; }).join('') : '<tr><td colspan="5" class="vf-saved">No backlinks recorded.</td></tr>') + '</tbody></table></div>' +
        '<div class="vf-row">' + field('Address of the linking page', 'bl-u', '<input class="vf-in" id="bl-u" placeholder="https://" maxlength="500">') + field('Points to', 'bl-t', '<input class="vf-in" id="bl-t" value="/" maxlength="200">') + field('Type', 'bl-k', '<input class="vf-in" id="bl-k" placeholder="directory, guest article, partner" maxlength="60">') + '<button class="btn small gold" id="bl-go">Add</button></div></div>';
      body.innerHTML = h;
      body.onclick = function (e) {
        var t;
        if (e.target.closest('#rk-go')) { post('/api/admin/seo/rankings', { keyword: val('rk-k'), country: val('rk-c'), page: val('rk-p'), position: val('rk-pos') || null, source: val('rk-s'), measuredOn: val('rk-d') }, function () { toast('Recorded.'); again(); }); return; }
        if (e.target.closest('#bl-go')) { post('/api/admin/seo/backlinks', { url: val('bl-u'), targetPage: val('bl-t'), kind: val('bl-k') }, function () { toast('Added.'); again(); }); return; }
        if ((t = e.target.closest('[data-rkdel]'))) { if (confirm('Remove this entry?')) API.call('DELETE', '/api/admin/seo/rankings/' + t.getAttribute('data-rkdel')).then(again, function (er) { toast(API.text(er)); }); return; }
        if ((t = e.target.closest('[data-bldel]'))) { if (confirm('Remove this backlink?')) API.call('DELETE', '/api/admin/seo/backlinks/' + t.getAttribute('data-bldel')).then(again, function (er) { toast(API.text(er)); }); return; }
        var l = e.target.closest('[data-go]'); if (l) { e.preventDefault(); go(l.getAttribute('data-go')); }
      };
      body.onchange = function (e) { var id = e.target.getAttribute('data-bl'); if (id) patch('/api/admin/seo/backlinks/' + id, { status: e.target.value }, function () { toast('Saved.'); }); };
    }, function (e) { if (!stale(g)) fail(e); });
  }

  /* ================= entry points in the existing portal and admin pages ================= */
  function inject() {
    var u = API.user; if (!u) return;
    var pb = q('#bp-body');
    if (pb && u.role === 'client' && !q('#pc-entry', pb) && pb.children.length > 2) {
      var c = document.createElement('div'); c.id = 'pc-entry'; c.className = 'vf-hub';
      c.innerHTML = '<b>My projects</b><p class="vf-saved">Follow progress, read updates, see invoices, upload your transfer receipt and message us.</p><button class="btn small gold" data-pcgo="#projects">Open my projects</button>';
      pb.insertBefore(c, pb.children[2] || null);
    }
    var ab = q('#ba-body');
    if (ab && isTeam(u) && !q('#pc-aentry', ab) && ab.children.length > 2) {
      var a = document.createElement('div'); a.id = 'pc-aentry'; a.className = 'vf-hub';
      a.innerHTML = '<button class="btn small gold" data-pcgo="#admin-projects">Projects</button> <button class="btn small" data-pcgo="#admin-proofs">Payment proofs</button> <button class="btn small" data-pcgo="#admin-team">Team access</button> <button class="btn small" data-pcgo="#admin-seo">SEO register</button>';
      ab.insertBefore(a, ab.children[2] || null);
    }
  }
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-pcgo]'); if (!b) return; e.preventDefault(); location.hash = b.getAttribute('data-pcgo'); });
  var scheduled = false;
  new MutationObserver(function () { if (scheduled) return; scheduled = true; setTimeout(function () { scheduled = false; try { inject(); } catch (e) {} }, 60); }).observe(document.body, { childList: true, subtree: true });
  API.onChange(function () { setTimeout(inject, 100); });
  route();
})();
