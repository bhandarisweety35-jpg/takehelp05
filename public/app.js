const $ = s => document.querySelector(s), app = $('#app');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const inr = n => '₹' + Number(n).toLocaleString('en-IN');
const dfmt = d => d ? new Date(d.length > 10 ? d.replace(' ', 'T') + 'Z' : d + 'T00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const badge = s => `<span class="badge s-${s.replace(' ', '')}">${esc(s)}</span>`;
const pri = p => ({ High: '🔴 High', Medium: '🟡 Medium', Low: '🟢 Low' }[p] || p);
const price = o => o.final_price ?? o.estimated;
const API = (window.API_URL || '').replace(/\/$/, '');
let me = null, P = null, acts = {};
function flash(m, ok) { const f = $('#flash'); f.textContent = m; f.className = ok ? 'ok' : 'err'; f.hidden = false; clearTimeout(flash.t); flash.t = setTimeout(() => f.hidden = true, 5000); }
async function api(url, o = {}) {
  const opt = { credentials: 'include', ...o };
  if (o.json) { opt.method = o.method || 'POST'; opt.headers = { 'Content-Type': 'application/json' }; opt.body = JSON.stringify(o.json); }
  let r, d = {}; try { r = await fetch(API + url, opt); d = await r.json(); } catch { if (!r) throw new Error('Cannot reach the server. Check your connection.'); }
  if (!r.ok) throw new Error(d.error || 'Something went wrong. Please try again.'); return d;
}
const calc = v => { const p = P, rows = [['Pages', v.pages, p.page], ['Drawings', v.drawings, p.drawing], ['Tables', v.tables_n, p.table], ['Graphs', v.graphs, p.graph],
  ['Simple diagrams', v.simple_diagrams, p.simple_diagram], ['Detailed diagrams', v.detailed_diagrams, p.detailed_diagram]];
  const sum = rows.reduce((s, r) => s + r[1] * r[2], 0); return { rows, sum, total: Math.max(p.min, sum) }; };
const breakdown = c => c.rows.filter(r => r[1] > 0).map(r => `${r[0]}: ${r[1]} × ${inr(r[2])} = ${inr(r[1] * r[2])}`).join('<br>') || 'Enter quantities to see the price.';
function nav() {
  const a = me && me.role === 'admin';
  $('#links').innerHTML = a ? `<a href="#/admin">Dashboard</a><a href="#/admin/orders">Orders</a><a href="#/admin/waiting">Waiting List</a><a href="#/admin/history">History</a><a href="#/admin/pricing">Pricing</a><a href="#/admin/calculator">Calculator</a><a href="#" data-out>Logout</a>`
    : `<a href="#/">Home</a><a href="#/order/record">Record Writing</a><a href="#/order/observation">Observation</a><a href="#/order/assignment">Assignments</a><a href="#/how">How It Works</a><a href="#/orders">My Orders</a>${me ? `<a href="#" data-out>Logout (${esc(me.name.split(' ')[0])})</a>` : '<a href="#/login">Login</a>'}<a class="btn sm" href="#/order">Submit Your Work</a>`;
}
document.addEventListener('click', async e => {
  if (e.target.closest('#burger')) return $('#links').classList.toggle('open');
  if (e.target.closest('#links a')) $('#links').classList.remove('open');
  if (e.target.closest('[data-out]')) { e.preventDefault(); await api('/api/auth/logout', { method: 'POST' }); me = null; nav(); location.hash = '#/'; return; }
  const h = e.target.closest('[data-href]'); if (h) return location.hash = h.dataset.href;
  const t = e.target.closest('[data-act]'); if (t && acts[t.dataset.act]) { try { await acts[t.dataset.act](t); } catch (x) { flash(x.message); } }
});
const sub = (sel, fn) => $(sel).addEventListener('submit', async e => { e.preventDefault(); const b = e.target.querySelector('button[type=submit]'); b.disabled = true; try { await fn(new FormData(e.target), e.target); } catch (x) { flash(x.message); } b.disabled = false; });
const minDate = () => { const d = new Date(); d.setDate(d.getDate() + 6); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const needClient = () => { if (!me) { location.hash = '#/login'; flash('Please log in first.'); return false; } if (me.role === 'admin') { location.hash = '#/admin'; return false; } return true; };
const needAdmin = () => { if (!me || me.role !== 'admin') { location.hash = '#/admin/login'; return false; } return true; };

// ---------- Public pages ----------
const SERV = [['record', '📘', 'Record Writing', 'College records written neatly according to your sample and subject requirements.'], ['observation', '📝', 'Observation Writing', 'Observation records prepared based on the provided material.'], ['assignment', '📚', 'Assignment Writing', 'Assignments prepared from the questions/reference material provided.']];
const cards = () => `<div class="grid3">${SERV.map(s => `<div class="card"><h3>${s[1]} ${s[2]}</h3><p>${s[3]}</p><a class="btn sm" href="#/order/${s[0]}">Order now</a></div>`).join('')}</div>`;
const notice = () => `<div class="notice">⏰ Orders must be submitted at least <b>6 days before</b> the required delivery date. Minimum order value: ₹100.</div>`;
async function home() {
  app.innerHTML = `<section class="hero"><h1>TakeHelp?</h1><p class="tag">Need help getting done with College work? You found this!</p><p>Submit your record, observation, or assignment requirements and let us handle the writing work.</p><a class="btn" href="#/order">Get Started</a> <a class="btn alt" href="#/how">How It Works</a></section>${cards()}<div class="steps"><span>1. Upload your work</span>→<span>2. We review it</span>→<span>3. Get your work completed</span></div>${notice()}`;
}
const how = () => { app.innerHTML = `<h2>How It Works</h2><div class="steps"><span>1. Upload your work</span>→<span>2. We review it</span>→<span>3. Get your work completed</span></div>
<div class="card"><p><b>1.</b> Register with your real name and roll number, pick a service and fill in the details with your sample/reference files.</p><p><b>2.</b> You instantly see an estimated price. We review your files and confirm the final price.</p><p><b>3.</b> Track the status in <a href="#/orders">My Orders</a> and get notified as your work progresses.</p></div>${notice()}`; };
const chooser = () => { app.innerHTML = `<h2>What do you need help with?</h2>${cards()}${notice()}`; };
function register() {
  app.innerHTML = `<form class="card" id="f"><h2>Create your account</h2><p>Use your real name and roll number exactly as in your college records.</p>
<label>Full name</label><input name="name" required autocomplete="name"><label>Roll number</label><input name="rollNo" required><label>Phone (10 digits)</label><input name="phone" inputmode="numeric" maxlength="10" required>
<br><button class="btn" type="submit">Register</button><p>Already registered? <a href="#/login">Login</a></p></form>`;
  sub('#f', async fd => { me = (await api('/api/auth/register', { json: Object.fromEntries(fd) })).user; nav(); location.hash = '#/order'; });
}
function login() {
  app.innerHTML = `<form class="card" id="f"><h2>Student Login</h2><p>Enter your name, roll number and phone number exactly as you registered.</p><label>Full name</label><input name="name" required autocomplete="name"><label>Roll number</label><input name="rollNo" required><label>Phone (10 digits)</label><input name="phone" inputmode="numeric" maxlength="13" required><br><button class="btn" type="submit">Login</button><p>New here? <a href="#/register">Create an account</a></p></form>`;
  sub('#f', async fd => { me = (await api('/api/auth/login', { json: Object.fromEntries(fd) })).user; nav(); location.hash = '#/orders'; });
}
function adminLogin() {
  app.innerHTML = `<form class="card" id="f"><h2>Admin Login</h2><label>Username</label><input name="username" required autocomplete="username"><label>Password</label><input type="password" name="password" required autocomplete="current-password"><br><button class="btn" type="submit">Login</button></form>`;
  sub('#f', async fd => { me = (await api('/api/admin/login', { json: Object.fromEntries(fd) })).user; nav(); location.hash = '#/admin'; });
}

// ---------- Client ----------
const CNT = [['drawings', 'Drawings'], ['tables_n', 'Tables'], ['graphs', 'Graphs'], ['simple_diagrams', 'Simple diagrams'], ['detailed_diagrams', 'Detailed diagrams']];
const KINDS = {
  record: { t: 'Record Writing', toggle: 1, cnt: CNT, files: [['sample', 'Sample PDF/Image'], ['subject', 'Subject/Reference PDF'], ['reference', 'Additional reference files', 1]] },
  observation: { t: 'Observation Writing', cnt: [['drawings', 'Drawings'], ['tables_n', 'Tables'], ['graphs', 'Graphs'], ['simple_diagrams', 'Diagrams']], files: [['sample', 'Sample/Observation PDF'], ['reference', 'Reference PDF(s)', 1]] },
  assignment: { t: 'Assignment Writing', cnt: CNT, files: [['assignment', 'Assignment Questions PDF'], ['sample', 'Sample/Reference PDF'], ['reference', 'Additional reference files', 1]] } };
async function orderForm(kind) {
  if (!needClient()) return; const K = KINDS[kind]; [P] = [await api('/api/pricing')]; const cap = await api('/api/capacity');
  app.innerHTML = `<form class="card wide" id="f"><h2>${K.t}</h2>
<div class="notice ${cap.full ? 'err' : ''}"><b>Current Capacity: ${cap.active} / ${cap.max}</b><br>${cap.full ? 'Currently full — new orders are temporarily closed.<br>We’re currently handling 15 active orders. New orders will open when a slot becomes available.' : `${cap.available} slot${cap.available > 1 ? 's' : ''} currently available.`}</div>
${notice()}<label>Subject name</label><input name="subject" required maxlength="120"><label>Due date</label><input type="date" name="due_date" min="${minDate()}" required>
<small>Earliest possible date: ${dfmt(minDate())}</small><label>Number of pages</label><input type="number" name="pages" min="1" max="1000" inputmode="numeric" required>
<h3>Requirements</h3>${K.cnt.map(([k, l]) => K.toggle ? `<label class="tog"><input type="checkbox" data-tg="${k}">${l} required</label><input type="number" name="${k}" min="1" max="500" value="1" disabled hidden placeholder="Number of ${l.toLowerCase()}">` : `<label>Number of ${l}</label><input type="number" name="${k}" min="0" max="500" value="0">`).join('')}
<h3>Upload files <small>(PDF, JPG, PNG · max 10 MB each)</small></h3>${K.files.map(([k, l, m]) => `<label>${l}</label><input type="file" name="${k}" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" ${m ? 'multiple' : ''}>`).join('')}
<label>Anything else we should know?</label><textarea name="comments" maxlength="3000"></textarea>
<div class="price"><big id="tot"></big><div id="bd"></div><small>Minimum order value: ₹100 · final price is confirmed after review</small></div>
<button class="btn" type="submit" ${cap.full ? 'disabled' : ''}>Submit Order</button></form>`;
  const f = $('#f'), vals = () => { const g = n => { const e = f.elements[n]; return e && !e.disabled ? Math.max(0, parseInt(e.value) || 0) : 0; };
    return { pages: g('pages'), drawings: g('drawings'), tables_n: g('tables_n'), graphs: g('graphs'), simple_diagrams: g('simple_diagrams'), detailed_diagrams: g('detailed_diagrams') }; };
  const upd = () => { const c = calc(vals()); $('#tot').textContent = 'Estimated Total: ' + inr(c.total); $('#bd').innerHTML = breakdown(c); };
  f.addEventListener('input', upd); f.addEventListener('change', e => { const k = e.target.dataset.tg; if (k) { const i = f.elements[k]; i.disabled = !e.target.checked; i.hidden = !e.target.checked; } upd(); }); upd();
  sub('#f', async (fd) => {
    if (fd.get('due_date') < minDate()) return flash('Orders must be submitted at least 6 days before the required delivery date. Please select a later date.');
    fd.append('type', K.t); const o = await api('/api/orders', { method: 'POST', body: fd }); confirmation(o);
  });
}
function confirmation(o) {
  app.innerHTML = `<div class="card"><h2>Order Submitted Successfully!</h2><p>Your request has been submitted and is waiting for review.</p><dl><dt>Order ID</dt><dd><b>${esc(o.code)}</b></dd><dt>Subject</dt><dd>${esc(o.subject)}</dd><dt>Work type</dt><dd>${esc(o.type)}</dd><dt>Due date</dt><dd>${dfmt(o.due_date)}</dd><dt>Pages</dt><dd>${o.pages}</dd><dt>Drawings</dt><dd>${o.drawings}</dd><dt>Tables</dt><dd>${o.tables_n}</dd><dt>Graphs</dt><dd>${o.graphs}</dd><dt>Estimated price</dt><dd>${inr(o.estimated)}</dd><dt>Status</dt><dd>${badge(o.status)}</dd></dl><a class="btn" href="#/orders">View My Orders</a></div>`;
}
async function notes(target) {
  const n = await api('/api/notifications'); if (!n.items.length) return;
  target.innerHTML = `<h3>🔔 Notifications ${n.unread ? `(${n.unread} new)` : ''}</h3><div class="card">${n.items.slice(0, 8).map(i => `<p style="margin:.3rem 0">${i.is_read ? '' : '<b>•</b> '}${esc(i.message)} <small>${dfmt(i.created_at)}</small></p>`).join('')}</div>`;
  if (n.unread) api('/api/notifications/read', { method: 'POST' });
}
async function myOrders() {
  if (!needClient()) return; const os = await api('/api/orders');
  app.innerHTML = `<h2>My Orders</h2><div id="nt"></div>${os.length ? `<div class="tw"><table><tr><th>Order ID</th><th>Type</th><th>Subject</th><th>Due</th><th>Price</th><th>Status</th><th>Submitted</th></tr>${os.map(o => `<tr data-href="#/orders/${o.id}"><td>${esc(o.code)}</td><td>${esc(o.type)}</td><td>${esc(o.subject)}</td><td>${dfmt(o.due_date)}</td><td>${inr(price(o))}${o.final_price ? '' : ' (est.)'}</td><td>${badge(o.status)}</td><td>${dfmt(o.created_at)}</td></tr>`).join('')}</table></div>` : '<div class="card">No orders yet. <a href="#/order">Submit your first order</a></div>'}`;
  notes($('#nt'));
}
const fileLinks = fs => fs.length ? fs.map(f => `<a class="btn sm alt" target="_blank" rel="noopener" href="${API}/api/files/${f.id}">${esc(f.role)}: ${esc(f.original_name)}</a>`).join(' ') : 'No files';
async function myOrder(id) {
  if (!needClient()) return; const o = await api('/api/orders/' + id);
  app.innerHTML = `<a href="#/orders">← My Orders</a><div class="card"><h2>${esc(o.code)} ${badge(o.status)}</h2><dl><dt>Type</dt><dd>${esc(o.type)}</dd><dt>Subject</dt><dd>${esc(o.subject)}</dd><dt>Due date</dt><dd>${dfmt(o.due_date)}</dd><dt>Pages</dt><dd>${o.pages}</dd><dt>Drawings / Tables / Graphs</dt><dd>${o.drawings} / ${o.tables_n} / ${o.graphs}</dd><dt>Diagrams (simple / detailed)</dt><dd>${o.simple_diagrams} / ${o.detailed_diagrams}</dd><dt>Estimated price</dt><dd>${inr(o.estimated)}</dd><dt>Final price</dt><dd>${o.final_price ? `<b>${inr(o.final_price)}</b>` : 'Not confirmed yet'}</dd><dt>Submitted</dt><dd>${dfmt(o.created_at)}</dd></dl><h3>Your instructions</h3><p class="pre">${esc(o.comments) || '—'}</p><h3>Files</h3><p>${fileLinks(o.files)}</p></div>`;
}

// ---------- Admin ----------
const PR = { High: 0, Medium: 1, Low: 2 };
const SORTS = { due: (a, b) => a.due_date.localeCompare(b.due_date), pages: (a, b) => b.pages - a.pages, price: (a, b) => price(b) - price(a), drawings: (a, b) => b.drawings - a.drawings,
  diagrams: (a, b) => (b.simple_diagrams + b.detailed_diagrams) - (a.simple_diagrams + a.detailed_diagrams), newest: (a, b) => b.id - a.id, oldest: (a, b) => a.id - b.id, priority: (a, b) => PR[a.priority] - PR[b.priority] };
const otable = (os, extra) => `<div class="tw"><table><tr><th>ID</th><th>Client</th><th>Type</th><th>Subject</th><th>Pages</th><th>Draw.</th><th>Tables</th><th>Graphs</th><th>Due</th><th>Est.</th><th>Final</th><th>Status</th><th>Priority</th><th>Submitted</th>${extra ? '<th></th>' : ''}</tr>
${os.map(o => `<tr data-href="#/admin/orders/${o.id}"><td>${esc(o.code)}</td><td>${esc(o.client_name)}<br><small>${esc(o.roll_no)}</small></td><td>${esc(o.type.replace(' Writing', ''))}</td><td>${esc(o.subject)}</td><td>${o.pages}</td><td>${o.drawings}</td><td>${o.tables_n}</td><td>${o.graphs}</td><td>${dfmt(o.due_date)}</td><td>${inr(o.estimated)}</td><td>${o.final_price ? inr(o.final_price) : '—'}</td><td>${badge(o.status)}</td><td>${pri(o.priority)}</td><td>${dfmt(o.created_at)}</td>${extra ? extra(o) : ''}</tr>`).join('') || '<tr><td colspan="15">No orders found.</td></tr>'}</table></div>`;
async function adminDash() {
  if (!needAdmin()) return; const [s, nx] = await Promise.all([api('/api/admin/stats'), api('/api/admin/next')]);
  const cards = [['Active Orders', `${s.active} / ${s.max}`], ['Available Slots', s.available], ['Waiting List', s.waiting], ['New Orders', s.new], ['In Progress', s.inProgress], ['Due Soon', s.dueSoon], ['Completed', s.completed], ['Est. Revenue', inr(s.estRevenue)], ['Final Revenue', inr(s.finalRevenue)]];
  const bars = [['New', s.new], ['Accepted', s.accepted], ['In Progress', s.inProgress], ['Waiting', s.waiting], ['Completed', s.completed], ['Cancelled', s.cancelled]], mx = Math.max(1, ...bars.map(b => b[1]));
  app.innerHTML = `<h2>Dashboard</h2><div class="grid3">${cards.map(c => `<div class="card stat"><b>${c[1]}</b><span>${c[0]}</span></div>`).join('')}</div>
<div class="cols"><div class="card"><h3>Orders by status</h3>${bars.map(b => `<p style="margin:.4rem 0">${b[0]} (${b[1]})<div class="bar" style="width:${b[1] / mx * 100}%"></div></p>`).join('')}</div><div id="nt"></div></div>
<h3>🎯 What Should I Work On Next?</h3>${nx.length ? nx.map((o, i) => `<div class="card" data-href="#/admin/orders/${o.id}" style="margin:.5rem 0;cursor:pointer"><b>${i + 1}. ${esc(o.subject)}</b> · ${esc(o.type)} · ${pri(o.priority)}<br>Due <b>${dfmt(o.due_date)}</b> · ${o.pages} pages · ${inr(price(o))} · ${badge(o.status)}</div>`).join('') : '<div class="card">No active orders.</div>'}`;
  notes($('#nt'));
}
async function adminOrders() {
  if (!needAdmin()) return; app.innerHTML = `<h2>Orders</h2><div class="row"><select id="fl"><option value="active">Active orders</option><option value="">All orders</option>${['New', 'Accepted', 'In Progress', 'Waiting List', 'Completed', 'Cancelled'].map(s => `<option>${s}</option>`).join('')}</select>
<input id="q" placeholder="Search ID, client, roll no, subject"><select id="so"><option value="due">Due date – nearest first</option><option value="pages">Pages – highest</option><option value="price">Price – highest</option><option value="drawings">Drawings</option><option value="diagrams">Diagrams</option><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="priority">Priority</option></select></div><div id="t"></div>`;
  let list = []; const draw = () => $('#t').innerHTML = otable([...list].sort(SORTS[$('#so').value]));
  const load = async () => { list = await api(`/api/admin/orders?filter=${encodeURIComponent($('#fl').value || 'all')}&q=${encodeURIComponent($('#q').value)}`); draw(); };
  $('#fl').onchange = load; $('#q').oninput = () => { clearTimeout(load.t); load.t = setTimeout(load, 300); }; $('#so').onchange = draw; load();
}
async function adminOrder(id) {
  if (!needAdmin()) return; const o = await api('/api/admin/orders/' + id), A = o.allowed;
  const btn = (s, l, c = '') => `<button class="btn sm ${c}" data-act="st" data-v="${s}" ${A.includes(s) ? '' : 'disabled'}>${l}</button>`;
  app.innerHTML = `<a href="#/admin/orders">← Orders</a><h2>${esc(o.code)} ${badge(o.status)} ${pri(o.priority)}</h2><div class="cols">
<div class="card"><h3>Client</h3><dl><dt>Name</dt><dd>${esc(o.client_name)}</dd><dt>Roll no.</dt><dd>${esc(o.roll_no)}</dd><dt>Phone</dt><dd>${esc(o.client_phone)}</dd></dl>
<h3>Work</h3><dl><dt>Type</dt><dd>${esc(o.type)}</dd><dt>Subject</dt><dd>${esc(o.subject)}</dd><dt>Pages</dt><dd>${o.pages}</dd><dt>Drawings</dt><dd>${o.drawings}</dd><dt>Tables</dt><dd>${o.tables_n}</dd><dt>Graphs</dt><dd>${o.graphs}</dd><dt>Simple diagrams</dt><dd>${o.simple_diagrams}</dd><dt>Detailed diagrams</dt><dd>${o.detailed_diagrams}</dd><dt>Due date</dt><dd><b>${dfmt(o.due_date)}</b></dd><dt>Submitted</dt><dd>${dfmt(o.created_at)}</dd></dl></div>
<div class="card"><h3>Uploaded files</h3><p>${fileLinks(o.files)}</p><h3>Client instructions</h3><p class="pre">${esc(o.comments) || '—'}</p><h3>History</h3>${o.history.map(h => `<small>${dfmt(h.created_at)} – ${esc(h.status)}</small>`).join('<br>')}</div></div>
<div class="card" style="margin-top:1rem"><h3>Pricing & management</h3><p>Estimated: <b>${inr(o.estimated)}</b></p><form id="f"><div class="row"><div><label>Final price (₹)</label><input name="final_price" type="number" min="100" step="1" value="${o.final_price ?? ''}" placeholder="Not set"></div>
<div><label>Priority</label><select name="priority"><option value="Auto">Auto (${o.priority_manual ? 'manual set' : o.priority})</option>${['High', 'Medium', 'Low'].map(p => `<option ${o.priority_manual && o.priority === p ? 'selected' : ''}>${p}</option>`).join('')}</select></div></div>
<label>Admin notes (private – clients never see this)</label><textarea name="admin_notes">${esc(o.admin_notes)}</textarea><br><button class="btn" type="submit">Save</button></form>
<div class="row">${btn('Accepted', 'Accept')}${btn('Waiting List', 'Move to Waiting List')}${btn('In Progress', 'Start Work')}${btn('Completed', 'Mark Completed')}${btn('Cancelled', 'Cancel/Reject', 'red')}${!A.length ? '<button class="btn sm red" data-act="del">Delete order</button>' : ''}</div></div>`;
  const reload = () => adminOrder(id);
  acts = { st: async t => { await api('/api/admin/orders/' + id, { method: 'PATCH', json: { status: t.dataset.v } }); flash('Status updated.', 1); reload(); },
    del: async () => { if (confirm('Permanently delete this order and its files?')) { await api('/api/admin/orders/' + id, { method: 'DELETE' }); location.hash = '#/admin/history'; } } };
  sub('#f', async fd => { await api('/api/admin/orders/' + id, { method: 'PATCH', json: Object.fromEntries(fd) }); flash('Saved.', 1); reload(); });
}
async function adminWaiting() {
  if (!needAdmin()) return; const os = await api('/api/admin/orders?filter=' + encodeURIComponent('Waiting List')); const cap = await api('/api/capacity');
  app.innerHTML = `<h2>Waiting List</h2><p>Active: <b>${cap.active} / ${cap.max}</b></p>${otable(os, o => `<td><button class="btn sm" data-act="acc" data-id="${o.id}" ${cap.full ? 'disabled' : ''}>Accept</button></td>`)}`;
  acts = { acc: async t => { await api('/api/admin/orders/' + t.dataset.id, { method: 'PATCH', json: { status: 'Accepted' } }); flash('Order accepted.', 1); adminWaiting(); } };
  app.querySelectorAll('button[data-act]').forEach(b => b.addEventListener('click', e => e.stopPropagation(), true));
}
async function adminHistory() {
  if (!needAdmin()) return; app.innerHTML = `<h2>Order History</h2><div class="row"><input id="q" placeholder="Order ID, client, roll no, subject"><select id="st"><option value="history">Completed + Cancelled</option><option>Completed</option><option>Cancelled</option><option value="all">Every status</option></select>
<select id="ty"><option value="">All work types</option><option>Record Writing</option><option>Observation Writing</option><option>Assignment Writing</option></select><input type="date" id="dt" title="Submitted on"></div><div id="t"></div>`;
  const load = async () => { const os = await api(`/api/admin/orders?filter=${$('#st').value}&q=${encodeURIComponent($('#q').value)}&type=${encodeURIComponent($('#ty').value)}&date=${$('#dt').value}`); $('#t').innerHTML = otable(os.sort(SORTS.newest)); };
  ['st', 'ty', 'dt'].forEach(i => $('#' + i).onchange = load); $('#q').oninput = () => { clearTimeout(load.t); load.t = setTimeout(load, 300); }; load();
}
async function adminPricing() {
  if (!needAdmin()) return; P = await api('/api/pricing');
  app.innerHTML = `<form class="card" id="f"><h2>Pricing settings</h2><p>Used for all new estimates and the calculator. Minimum order value: ₹100.</p>${[['page', 'Price per page'], ['drawing', 'Price per drawing'], ['table', 'Price per table'], ['graph', 'Price per graph'], ['simple_diagram', 'Price per simple diagram'], ['detailed_diagram', 'Price per detailed diagram']].map(([k, l]) => `<label>${l} (₹)</label><input type="number" name="${k}" min="0" step="0.5" value="${P[k]}" required>`).join('')}<br><button class="btn" type="submit">Save prices</button></form>`;
  sub('#f', async fd => { await api('/api/admin/pricing', { method: 'PUT', json: Object.fromEntries(fd) }); flash('Prices updated.', 1); });
}
async function adminCalc() {
  if (!needAdmin()) return; P = await api('/api/pricing');
  app.innerHTML = `<form class="card" id="f"><h2>Pricing Calculator</h2>${[['pages', 'Pages'], ['drawings', 'Drawings'], ['tables_n', 'Tables'], ['graphs', 'Graphs'], ['simple_diagrams', 'Simple diagrams'], ['detailed_diagrams', 'Detailed diagrams']].map(([k, l]) => `<label>${l}</label><input type="number" name="${k}" min="0" value="0">`).join('')}<div class="price"><div id="bd"></div><big id="tot"></big></div></form>`;
  const upd = () => { const f = $('#f'), v = {}; ['pages', 'drawings', 'tables_n', 'graphs', 'simple_diagrams', 'detailed_diagrams'].forEach(k => v[k] = Math.max(0, parseInt(f.elements[k].value) || 0)); const c = calc(v);
    $('#bd').innerHTML = breakdown(c); $('#tot').textContent = 'Total: ' + inr(c.total) + (c.sum < P.min ? ' (minimum applied)' : ''); };
  $('#f').addEventListener('input', upd); upd();
}

// ---------- Router ----------
const routes = [[/^\/$/, home], [/^\/how$/, how], [/^\/order$/, chooser], [/^\/order\/(record|observation|assignment)$/, orderForm], [/^\/orders$/, myOrders], [/^\/orders\/(\d+)$/, myOrder],
  [/^\/login$/, login], [/^\/register$/, register], [/^\/admin\/login$/, adminLogin], [/^\/admin$/, adminDash], [/^\/admin\/orders$/, adminOrders], [/^\/admin\/orders\/(\d+)$/, adminOrder],
  [/^\/admin\/waiting$/, adminWaiting], [/^\/admin\/history$/, adminHistory], [/^\/admin\/pricing$/, adminPricing], [/^\/admin\/calculator$/, adminCalc]];
async function route() {
  acts = {}; const p = location.hash.slice(1) || '/'; scrollTo(0, 0);
  for (const [re, fn] of routes) { const m = p.match(re); if (m) { try { if (!P) P = await api('/api/pricing'); await fn(...m.slice(1)); } catch (e) { app.innerHTML = `<div class="notice err">${esc(e.message)}</div>`; } return; } }
  app.innerHTML = '<div class="card"><h2>Page not found</h2><a href="#/">Go home</a></div>';
}
window.addEventListener('hashchange', route);
(async () => { try { me = (await api('/api/me')).user; } catch {} nav(); route(); })();
