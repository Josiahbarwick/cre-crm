/* ---------- Supabase client ---------- */
const SUPABASE_URL = 'https://akfdtbfbjzwlginrwrad.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrZmR0YmZianp3bGdpbnJ3cmFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0Njc0NzUsImV4cCI6MjEwMjA0MzQ3NX0.Sr6UDUjxjHRd1kRejHwQSzsB6Ci9rPsBzaZosi3J-G0';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let currentUser = null;
function currentUserEmail(){ return (currentUser && currentUser.email) || ''; }

let state = { contacts:[], deals:[], calls:[], activities:[], listings:[], listingInterests:[] };

/* ---------- row <-> app object mappers ---------- */
function contactFromRow(r){
  return { id:r.id, name:r.name, company:r.company||'', phone:r.phone||'', email:r.email||'',
    propertyType:r.property_type||'', status:r.status||'Cold', source:r.source||'', address:r.address||'',
    notes:r.notes||'', nextFollowUp:r.next_follow_up||'', lastContactedAt:r.last_contacted_at||null,
    transactionType:r.transaction_type||'', ownerEmail:r.owner_email||'', createdAt:r.created_at };
}
function contactToRow(c){
  return { name:c.name, company:c.company||null, phone:c.phone||null, email:c.email||null,
    property_type:c.propertyType||null, status:c.status||'Cold', source:c.source||null, address:c.address||null,
    notes:c.notes||null, next_follow_up:c.nextFollowUp||null, last_contacted_at:c.lastContactedAt||null,
    transaction_type:c.transactionType||null, owner_email:c.ownerEmail||null };
}
function listingFromRow(r){
  return { id:r.id, address:r.address, listingType:r.listing_type||'Lease', propertyType:r.property_type||'',
    status:r.status||'Active', price:r.price||0, squareFeet:r.square_feet||0, pricePerSf:r.price_per_sf||0,
    commissionPct:r.commission_pct||0, expirationDate:r.expiration_date||'', ownerContactId:r.owner_contact_id||null,
    clientContactId:r.client_contact_id||null,
    notes:r.notes||'', ownerEmail:r.owner_email||'', createdAt:r.created_at, updatedAt:r.updated_at };
}
function listingToRow(l){
  return { address:l.address, listing_type:l.listingType||'Lease', property_type:l.propertyType||null,
    status:l.status||'Active', price:l.price||0, square_feet:l.squareFeet||0, price_per_sf:l.pricePerSf||0,
    commission_pct:l.commissionPct||0, expiration_date:l.expirationDate||null, owner_contact_id:l.ownerContactId||null,
    client_contact_id:l.clientContactId||null,
    notes:l.notes||null, owner_email:l.ownerEmail||null };
}
function listingInterestFromRow(r){
  return { id:r.id, listingId:r.listing_id, contactId:r.contact_id, notes:r.notes||'', createdAt:r.created_at };
}
function dealFromRow(r){
  return { id:r.id, title:r.title, propertyAddress:r.property_address||'', value:r.value||0,
    commissionPct:r.commission_pct||0, stage:r.stage, closeDate:r.close_date||'', contactId:r.contact_id||null,
    notes:r.notes||'', ownerEmail:r.owner_email||'', createdAt:r.created_at, updatedAt:r.updated_at };
}
function dealToRow(d){
  return { title:d.title, property_address:d.propertyAddress||null, value:d.value||0, commission_pct:d.commissionPct||0,
    stage:d.stage, close_date:d.closeDate||null, contact_id:d.contactId||null, notes:d.notes||null,
    owner_email:d.ownerEmail||null };
}
function callFromRow(r){
  return { id:r.id, contactId:r.contact_id, timestamp:r.timestamp, outcome:r.outcome, notes:r.notes||'', loggedBy:r.logged_by||'' };
}
function activityFromRow(r){
  return { id:r.id, type:r.type, description:r.description, contactId:r.contact_id, dealId:r.deal_id, timestamp:r.timestamp };
}

/* ---------- constants ---------- */
const STATUSES = ['Cold','Warm','Hot','Client','Dead'];
const STAGES = ['New Lead','Contacted','Qualified','LOI / Proposal','Negotiation','Under Contract','Closed Won','Closed Lost'];
const OUTCOMES = ['No Answer','Left Voicemail','Gatekeeper','Callback Requested','Not Interested','Interested','Meeting Scheduled','Wrong Number'];
const PROPERTY_TYPES = ['Office','Industrial','Retail','Multifamily','Land','Mixed-Use','Medical','Hospitality','Other'];
const TRANSACTION_TYPES = ['Lease','Sale','Buyer','Tenant','Both'];
const LISTING_TYPES = ['Lease','Sale'];
const LISTING_STATUSES = ['Active','Under Contract','Expired','Withdrawn','Off Market'];

/* ---------- helpers ---------- */
function money(n){
  n = Number(n)||0;
  if(Math.abs(n) >= 1000000) return '$' + (n/1000000).toFixed(2).replace(/\.00$/,'') + 'M';
  if(Math.abs(n) >= 1000) return '$' + (n/1000).toFixed(0) + 'K';
  return '$' + n.toFixed(0);
}
function fullMoney(n){ n=Number(n)||0; return '$' + n.toLocaleString('en-US',{maximumFractionDigits:0}); }
function fmtDate(d){ if(!d) return '—'; const dt = new Date(d); if(isNaN(dt)) return d; return dt.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); }
function fmtDateTime(d){ const dt=new Date(d); return dt.toLocaleDateString('en-US',{month:'short',day:'numeric'}) + ' · ' + dt.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}); }
function timeAgo(d){
  const s = Math.floor((Date.now()-new Date(d).getTime())/1000);
  if(s<60) return 'just now';
  if(s<3600) return Math.floor(s/60)+'m ago';
  if(s<86400) return Math.floor(s/3600)+'h ago';
  return Math.floor(s/86400)+'d ago';
}
function initials(name){
  return (name||'?').split(' ').filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join('');
}
function ownerLabel(email){ return email ? email.split('@')[0] : 'Unassigned'; }
function isToday(d){
  if(!d) return false;
  const a=new Date(d), b=new Date();
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}
function isPastOrToday(d){
  if(!d) return false;
  const a = new Date(d); a.setHours(23,59,59,999);
  return a.getTime() <= new Date().setHours(23,59,59,999);
}
function esc(s){ return (s==null?'':String(s)).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function contactById(id){ return state.contacts.find(c=>c.id===id); }
function dealById(id){ return state.deals.find(d=>d.id===id); }
function listingById(id){ return state.listings.find(l=>l.id===id); }
function fmtSf(n){ n=Number(n)||0; return n? n.toLocaleString('en-US',{maximumFractionDigits:0})+' SF' : '—'; }
function fmtPerSf(n){ n=Number(n)||0; return n? '$'+n.toFixed(2)+'/SF' : '—'; }

function toast(msg){
  let t = document.querySelector('.toast');
  if(!t){ t = document.createElement('div'); t.className='toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(()=>t.classList.remove('show'), 2200);
}

/* ---------- data loading ---------- */
async function loadAllData(){
  const [contactsRes, dealsRes, callsRes, activitiesRes] = await Promise.all([
    supabaseClient.from('contacts').select('*').order('created_at',{ascending:false}),
    supabaseClient.from('deals').select('*').order('created_at',{ascending:false}),
    supabaseClient.from('calls').select('*').order('timestamp',{ascending:false}),
    supabaseClient.from('activities').select('*').order('timestamp',{ascending:false}).limit(500),
  ]);
  const firstError = contactsRes.error || dealsRes.error || callsRes.error || activitiesRes.error;
  if(firstError){
    document.getElementById('view').innerHTML = `<div class="panel"><div class="panel-body">
      <h3 style="margin-top:0;">Setup needed</h3>
      <p style="color:var(--text-dim);font-size:13.5px;">Couldn't load data from Supabase: <b>${esc(firstError.message)}</b>.
      Make sure you've run <code>schema.sql</code> in your Supabase project's SQL editor, then reload this page.</p>
    </div></div>`;
    return false;
  }
  state.contacts = (contactsRes.data||[]).map(contactFromRow);
  state.deals = (dealsRes.data||[]).map(dealFromRow);
  state.calls = (callsRes.data||[]).map(callFromRow);
  state.activities = (activitiesRes.data||[]).map(activityFromRow);

  const [listingsRes, interestsRes] = await Promise.all([
    supabaseClient.from('listings').select('*').order('created_at',{ascending:false}),
    supabaseClient.from('listing_interests').select('*'),
  ]);
  listingsSchemaReady = !listingsRes.error && !interestsRes.error;
  state.listings = listingsSchemaReady ? (listingsRes.data||[]).map(listingFromRow) : [];
  state.listingInterests = listingsSchemaReady ? (interestsRes.data||[]).map(listingInterestFromRow) : [];
  return true;
}
let listingsSchemaReady = true;

async function logActivity(type, description, contactId, dealId){
  const { error } = await supabaseClient.from('activities').insert({
    type, description, contact_id: contactId||null, deal_id: dealId||null,
  });
  if(error) console.error('logActivity failed', error);
}

/* ---------- realtime sync ---------- */
let realtimeChannel = null;
let realtimeDebounce = null;
function subscribeRealtime(){
  if(realtimeChannel) return;
  realtimeChannel = supabaseClient.channel('crm-sync')
    .on('postgres_changes', { event:'*', schema:'public', table:'contacts' }, onRemoteChange)
    .on('postgres_changes', { event:'*', schema:'public', table:'deals' }, onRemoteChange)
    .on('postgres_changes', { event:'*', schema:'public', table:'calls' }, onRemoteChange)
    .on('postgres_changes', { event:'*', schema:'public', table:'activities' }, onRemoteChange)
    .on('postgres_changes', { event:'*', schema:'public', table:'listings' }, onRemoteChange)
    .on('postgres_changes', { event:'*', schema:'public', table:'listing_interests' }, onRemoteChange)
    .subscribe();
}
function onRemoteChange(){
  clearTimeout(realtimeDebounce);
  realtimeDebounce = setTimeout(async ()=>{
    if(document.querySelector('.modal-overlay')) return; // don't yank the view out from under an open form
    await loadAllData();
    navigate();
  }, 350);
}

/* ---------- CSV import ---------- */
function parseCSV(text){
  const rows = []; let row=[], field='', inQuotes=false;
  for(let i=0;i<text.length;i++){
    const c = text[i];
    if(inQuotes){
      if(c==='"'){ if(text[i+1]==='"'){ field+='"'; i++; } else inQuotes=false; }
      else field += c;
    } else {
      if(c==='"') inQuotes = true;
      else if(c===','){ row.push(field); field=''; }
      else if(c==='\n' || c==='\r'){
        if(c==='\r' && text[i+1]==='\n') i++;
        row.push(field); field=''; rows.push(row); row=[];
      } else field += c;
    }
  }
  if(field.length || row.length){ row.push(field); rows.push(row); }
  return rows.filter(r => r.some(c=>c && c.trim()!==''));
}
function normalizeHeader(h){ return h.trim().toLowerCase().replace(/[^a-z0-9]/g,''); }
const CSV_HEADER_MAP = {
  name:'name', fullname:'name', contactname:'name', contact:'name',
  company:'company', companyname:'company', organization:'company', firm:'company',
  phone:'phone', phonenumber:'phone', mobile:'phone', cell:'phone', telephone:'phone',
  email:'email', emailaddress:'email',
  status:'status', leadstatus:'status',
  propertytype:'propertyType', type:'propertyType', assetclass:'propertyType', assettype:'propertyType',
  source:'source', leadsource:'source',
  address:'address', propertyaddress:'address',
  notes:'notes', note:'notes', comments:'notes',
  nextfollowup:'nextFollowUp', followupdate:'nextFollowUp', followup:'nextFollowUp',
};
function csvToContacts(text){
  const rows = parseCSV(text);
  if(!rows.length) return [];
  const headers = rows[0].map(normalizeHeader);
  const idx = {};
  headers.forEach((h,i)=>{ if(CSV_HEADER_MAP[h] && !(CSV_HEADER_MAP[h] in idx)) idx[CSV_HEADER_MAP[h]] = i; });
  const out = [];
  for(let r=1;r<rows.length;r++){
    const row = rows[r];
    const get = key => idx[key]!=null ? (row[idx[key]]||'').trim() : '';
    const name = get('name') || (row[0]||'').trim();
    if(!name) continue;
    const statusRaw = get('status');
    const status = STATUSES.find(s=>s.toLowerCase()===statusRaw.toLowerCase()) || 'Cold';
    const typeRaw = get('propertyType');
    const propertyType = PROPERTY_TYPES.find(t=>t.toLowerCase()===typeRaw.toLowerCase()) || (typeRaw || 'Other');
    const followRaw = get('nextFollowUp');
    const parsedDate = followRaw ? new Date(followRaw) : null;
    const nextFollowUp = parsedDate && !isNaN(parsedDate) ? parsedDate.toISOString().slice(0,10) : '';
    out.push({
      name, company:get('company'), phone:get('phone'), email:get('email'),
      propertyType, status, source: get('source') || 'Spreadsheet Import', address:get('address'),
      notes:get('notes'), nextFollowUp,
    });
  }
  return out;
}
function openCsvImportModal(rows){
  if(!rows.length){ toast('No contact rows found in that file'); return; }
  const existing = state.contacts;
  const isDupe = r => existing.some(c =>
    (r.email && c.email && c.email.toLowerCase()===r.email.toLowerCase()) ||
    (!r.email && c.name.toLowerCase()===r.name.toLowerCase() && r.phone && c.phone===r.phone)
  );
  const dupeCount = rows.filter(isDupe).length;
  const newCount = rows.length - dupeCount;
  const html = `
    <div class="modal-overlay">
      <div class="modal">
        <div class="modal-head"><h3>Import from spreadsheet</h3><button class="modal-close">&times;</button></div>
        <div class="modal-body">
          <p style="font-size:13.5px;color:var(--text-dim);margin-top:0;">Found <b>${rows.length}</b> rows. <b>${newCount}</b> will be imported as new contacts${dupeCount? `, <b>${dupeCount}</b> look like duplicates of contacts you already have (matched by email, or name+phone) and will be skipped.`:'.'}</p>
          <div class="table-wrap" style="max-height:280px;">
            <table><thead><tr><th>Name</th><th>Company</th><th>Phone</th><th>Status</th></tr></thead>
            <tbody>${rows.slice(0,50).map(r=>`<tr><td>${esc(r.name)}${isDupe(r)?' <span class="cell-sub">(dup)</span>':''}</td><td>${esc(r.company||'—')}</td><td>${esc(r.phone||'—')}</td><td>${esc(r.status)}</td></tr>`).join('')}</tbody></table>
          </div>
          ${rows.length>50? `<p style="font-size:12px;color:var(--text-dim);">Showing first 50 of ${rows.length} rows.</p>`:''}
        </div>
        <div class="modal-foot">
          <button class="btn outline" id="cancelBtn">Cancel</button>
          <button class="btn gold" id="confirmImportBtn">Import ${newCount} Contact${newCount===1?'':'s'}</button>
        </div>
      </div>
    </div>`;
  const root = document.getElementById('modalRoot');
  root.innerHTML = html;
  const close = ()=>root.innerHTML='';
  root.querySelector('.modal-close').onclick = close;
  root.querySelector('#cancelBtn').onclick = close;
  root.querySelector('.modal-overlay').addEventListener('click', e=>{ if(e.target.classList.contains('modal-overlay')) close(); });
  root.querySelector('#confirmImportBtn').onclick = async ()=>{
    const toAdd = rows.filter(r=>!isDupe(r));
    if(!toAdd.length){ toast('Nothing new to import'); close(); return; }
    const btn = root.querySelector('#confirmImportBtn');
    btn.disabled = true; btn.textContent = 'Importing…';
    const payload = toAdd.map(r => contactToRow({ ...r, ownerEmail: currentUserEmail() }));
    const { error } = await supabaseClient.from('contacts').insert(payload);
    if(error){ toast('Import failed: ' + error.message); btn.disabled = false; return; }
    await logActivity('contact', `Imported ${toAdd.length} contact${toAdd.length===1?'':'s'} from spreadsheet`);
    await loadAllData();
    toast(`Imported ${toAdd.length} contact${toAdd.length===1?'':'s'}`);
    close();
    renderProspects();
  };
}

/* ---------- routing ---------- */
const routes = { dashboard: renderDashboard, prospects: renderProspects, coldcall: renderColdCall, deals: renderDeals, listings: renderListings, activity: renderActivity };
let coldCallActiveId = null;
let currentSearch = '';

function navigate(){
  const hash = (location.hash || '#dashboard').slice(1);
  const route = routes[hash] ? hash : 'dashboard';
  document.querySelectorAll('.nav a').forEach(a=>a.classList.toggle('active', a.dataset.route===route));
  routes[route]();
}
window.addEventListener('hashchange', navigate);

document.getElementById('todayLabel').textContent = new Date().toLocaleDateString('en-US',{weekday:'long', month:'long', day:'numeric', year:'numeric'});

/* ---------- Dashboard ---------- */
function renderDashboard(){
  const view = document.getElementById('view');
  view.className = 'view';
  const openDeals = state.deals.filter(d=>!['Closed Won','Closed Lost'].includes(d.stage));
  const pipelineValue = openDeals.reduce((s,d)=>s+(Number(d.value)||0)*((Number(d.commissionPct)||0)/100),0);
  const callsToday = state.calls.filter(c=>isToday(c.timestamp)).length;
  const followUpsDue = state.contacts.filter(c=>c.status!=='Client' && c.status!=='Dead' && c.nextFollowUp && isPastOrToday(c.nextFollowUp)).length;
  const closedWonThisMonth = state.deals.filter(d=>d.stage==='Closed Won' && d.closeDate && new Date(d.closeDate).getMonth()===new Date().getMonth() && new Date(d.closeDate).getFullYear()===new Date().getFullYear());
  const wonCommission = closedWonThisMonth.reduce((s,d)=>s+(Number(d.value)||0)*((Number(d.commissionPct)||0)/100),0);

  const recentActivities = state.activities.slice(0,8);
  const dueContacts = state.contacts.filter(c=>c.status!=='Client' && c.status!=='Dead' && c.nextFollowUp && isPastOrToday(c.nextFollowUp))
    .sort((a,b)=>new Date(a.nextFollowUp)-new Date(b.nextFollowUp)).slice(0,6);

  view.innerHTML = `
    <div class="page-head">
      <div><h1>Dashboard</h1><p>Your team's book of business at a glance</p></div>
      <a href="#coldcall" class="btn gold">Start Cold Calling</a>
    </div>
    <div class="stat-grid">
      <div class="stat-card accent-blue"><div class="label">Total Prospects</div><div class="value">${state.contacts.length}</div><div class="sub">${state.contacts.filter(c=>c.status==='Client').length} clients</div></div>
      <div class="stat-card accent-gold"><div class="label">Open Deals</div><div class="value">${openDeals.length}</div><div class="sub">${state.deals.length} total in pipeline</div></div>
      <div class="stat-card accent-teal"><div class="label">Est. Pipeline Commission</div><div class="value">${money(pipelineValue)}</div><div class="sub">across open deals</div></div>
      <div class="stat-card accent-red"><div class="label">Follow-ups Due</div><div class="value">${followUpsDue}</div><div class="sub">${callsToday} calls logged today</div></div>
    </div>
    <div class="dash-grid">
      <div class="panel">
        <div class="panel-head"><h3>Follow-ups due</h3><a href="#coldcall" class="btn sm outline">Go to Cold Call</a></div>
        <div class="panel-body">
          <div class="row-list">
            ${dueContacts.length? dueContacts.map(c=>`
              <div class="row-item">
                <div class="avatar">${initials(c.name)}</div>
                <div class="row-main">
                  <div class="row-title">${esc(c.name)}</div>
                  <div class="row-sub">${esc(c.company||'—')}</div>
                </div>
                <span class="badge ${c.status.toLowerCase()}">${c.status}</span>
                <div class="row-meta">${fmtDate(c.nextFollowUp)}</div>
              </div>`).join('') : '<div class="empty">Nothing due — you\'re all caught up.</div>'}
          </div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-head"><h3>Recent activity</h3><a href="#activity" class="btn sm outline">View all</a></div>
        <div class="panel-body">
          <div class="timeline">
            ${recentActivities.length? recentActivities.map(a=>`
              <div class="tl-item">
                <div class="tl-time">${timeAgo(a.timestamp)}</div>
                <div class="tl-text">${a.description}</div>
              </div>`).join('') : '<div class="empty">No activity yet.</div>'}
          </div>
        </div>
      </div>
    </div>
    ${closedWonThisMonth.length? `<div class="panel" style="margin-top:16px;"><div class="panel-head"><h3>Closed won this month</h3><span class="badge client">${money(wonCommission)} commission</span></div><div class="panel-body">
      <div class="row-list">${closedWonThisMonth.map(d=>`<div class="row-item"><div class="avatar" style="background:var(--teal)">$</div><div class="row-main"><div class="row-title">${esc(d.title)}</div><div class="row-sub">${esc(d.propertyAddress||'')}</div></div><div class="row-meta">${fullMoney(d.value)}</div></div>`).join('')}</div>
    </div></div>` : ''}
  `;
}

/* ---------- Prospects ---------- */
function renderProspects(){
  const view = document.getElementById('view');
  view.className = 'view';
  view.innerHTML = `
    <div class="page-head">
      <div><h1>Prospects</h1><p>${state.contacts.length} contacts tracked</p></div>
      <div style="display:flex;gap:8px;">
        <label class="btn outline" for="csvImportInput" style="cursor:pointer;">Import from Spreadsheet</label>
        <input type="file" id="csvImportInput" accept=".csv,text/csv" hidden>
        <button class="btn gold" id="addContactBtn">+ Add Contact</button>
      </div>
    </div>
    <div class="filters-row">
      <select id="filterStatus"><option value="">All statuses</option>${STATUSES.map(s=>`<option value="${s}">${s}</option>`).join('')}</select>
      <select id="filterType"><option value="">All property types</option>${PROPERTY_TYPES.map(s=>`<option value="${s}">${s}</option>`).join('')}</select>
      <select id="filterTxn"><option value="">Leases &amp; Sales</option>${TRANSACTION_TYPES.map(s=>`<option value="${s}">${s} only</option>`).join('')}<option value="Unspecified">Unspecified</option></select>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Name</th><th>Company</th><th>Phone</th><th>Property Type</th><th>Deal Type</th><th>Status</th><th>Owner</th><th>Next Follow-up</th><th></th></tr></thead>
        <tbody id="prospectsBody"></tbody>
      </table>
    </div>
  `;
  document.getElementById('addContactBtn').onclick = ()=>openContactModal();
  document.getElementById('csvImportInput').addEventListener('change', e=>{
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = () => openCsvImportModal(csvToContacts(reader.result));
    reader.readAsText(file);
    e.target.value = '';
  });
  document.getElementById('filterStatus').onchange = renderProspectsTable;
  document.getElementById('filterType').onchange = renderProspectsTable;
  document.getElementById('filterTxn').onchange = renderProspectsTable;
  renderProspectsTable();
}

const TXN_BADGE_CLASS = { Lease:'client', Sale:'cold', Buyer:'warm', Tenant:'hot', Both:'dead' };
function txnBadge(t){
  if(!t) return '<span class="badge dead">Unspecified</span>';
  return `<span class="badge ${TXN_BADGE_CLASS[t]||'dead'}">${esc(t)}</span>`;
}

function contactRowHtml(c){
  return `
    <tr data-id="${c.id}">
      <td class="cell-name">${esc(c.name)}</td>
      <td>${esc(c.company||'—')}<div class="cell-sub">${esc(c.email||'')}</div></td>
      <td>${esc(c.phone||'—')}</td>
      <td>${esc(c.propertyType||'—')}</td>
      <td>${txnBadge(c.transactionType)}</td>
      <td><span class="badge ${c.status.toLowerCase()}">${c.status}</span></td>
      <td><span class="owner-tag" title="${esc(c.ownerEmail||'Unassigned')}"><span class="owner-dot">${esc(initials(ownerLabel(c.ownerEmail)))}</span>${esc(ownerLabel(c.ownerEmail))}</span></td>
      <td>${c.nextFollowUp? fmtDate(c.nextFollowUp) : '—'}</td>
      <td>
        <div class="actions-cell">
          <button class="icon-btn callBtn" title="Call"><svg viewBox="0 0 24 24"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.3 1.1L6.6 10.8z"/></svg></button>
          <button class="icon-btn emailBtn" title="Draft Email"><svg viewBox="0 0 24 24"><path d="M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm1 2.7V17h14V6.7l-7 5.3-7-5.3zm.8-.7L12 10.5 17.2 6H5.8z"/></svg></button>
          <button class="icon-btn editBtn" title="Edit"><svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg></button>
          <button class="icon-btn delBtn" title="Delete"><svg viewBox="0 0 24 24"><path d="M6 7h12l-1 14H7L6 7zm3-3h6l1 2H8l1-2z"/></svg></button>
        </div>
      </td>
    </tr>
  `;
}

function wireContactRow(tr){
  const id = tr.dataset.id;
  tr.querySelector('.editBtn').onclick = ()=>openContactModal(contactById(id));
  tr.querySelector('.emailBtn').onclick = ()=>openEmailComposer(contactById(id));
  tr.querySelector('.delBtn').onclick = async ()=>{
    if(confirm('Delete this contact? This cannot be undone.')){
      const { error } = await supabaseClient.from('contacts').delete().eq('id', id);
      if(error){ toast('Delete failed: '+error.message); return; }
      await loadAllData();
      toast('Contact deleted');
      renderProspectsTable();
    }
  };
  tr.querySelector('.callBtn').onclick = ()=>{ coldCallActiveId = id; location.hash = '#coldcall'; };
}

function renderProspectsTable(){
  const body = document.getElementById('prospectsBody');
  if(!body) return;
  const statusF = document.getElementById('filterStatus').value;
  const typeF = document.getElementById('filterType').value;
  const txnF = document.getElementById('filterTxn').value;
  const q = currentSearch.toLowerCase();
  let list = state.contacts.filter(c=>{
    if(statusF && c.status!==statusF) return false;
    if(typeF && c.propertyType!==typeF) return false;
    if(txnF==='Unspecified' && c.transactionType) return false;
    if(txnF && txnF!=='Unspecified' && c.transactionType!==txnF) return false;
    if(q && !(`${c.name} ${c.company} ${c.email}`.toLowerCase().includes(q))) return false;
    return true;
  }).sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));

  if(!list.length){ body.innerHTML = `<tr><td colspan="9"><div class="empty">No contacts found.</div></td></tr>`; return; }

  if(txnF){
    body.innerHTML = list.map(contactRowHtml).join('');
  } else {
    const leases = list.filter(c=>['Lease','Tenant','Both'].includes(c.transactionType));
    const sales = list.filter(c=>['Sale','Buyer','Both'].includes(c.transactionType));
    const unspecified = list.filter(c=>!c.transactionType);
    const section = (label, items) => items.length ? `<tr class="table-group-row"><td colspan="9">${label} <span class="cell-sub">(${items.length})</span></td></tr>${items.map(contactRowHtml).join('')}` : '';
    body.innerHTML = section('Leases', leases) + section('Sales', sales) + section('Unspecified', unspecified);
  }

  body.querySelectorAll('tr[data-id]').forEach(wireContactRow);
}

function openContactModal(contact){
  const isEdit = !!contact;
  const c = contact || { name:'', company:'', phone:'', email:'', propertyType:PROPERTY_TYPES[0], status:'Cold', source:'', address:'', notes:'', nextFollowUp:'' };
  const html = `
    <div class="modal-overlay">
      <div class="modal">
        <div class="modal-head"><h3>${isEdit?'Edit Contact':'Add Contact'}</h3><button class="modal-close">&times;</button></div>
        <div class="modal-body">
          ${isEdit? `<div class="owner-tag" style="margin-bottom:14px;"><span class="owner-dot">${esc(initials(ownerLabel(c.ownerEmail)))}</span>Owned by ${esc(ownerLabel(c.ownerEmail))} · added ${fmtDate(c.createdAt)}</div>`:''}
          <div class="form-grid">
            <label class="full">Full name<input type="text" id="f_name" value="${esc(c.name)}" placeholder="Jane Smith"></label>
            <label>Company<input type="text" id="f_company" value="${esc(c.company)}" placeholder="Smith Holdings"></label>
            <label>Phone<input type="tel" id="f_phone" value="${esc(c.phone)}" placeholder="(555) 123-4567"></label>
            <label>Email<input type="email" id="f_email" value="${esc(c.email)}" placeholder="jane@company.com"></label>
            <label>Source<input type="text" id="f_source" value="${esc(c.source)}" placeholder="Referral, LoopNet…"></label>
            <label>Property Type<select id="f_type">${PROPERTY_TYPES.map(t=>`<option ${t===c.propertyType?'selected':''}>${t}</option>`).join('')}</select></label>
            <label>Status<select id="f_status">${STATUSES.map(s=>`<option ${s===c.status?'selected':''}>${s}</option>`).join('')}</select></label>
            <label>Looking to<select id="f_txn"><option value="" ${!c.transactionType?'selected':''}>— Unspecified —</option>${TRANSACTION_TYPES.map(t=>`<option ${t===c.transactionType?'selected':''}>${t}</option>`).join('')}</select></label>
            <label class="full">Property Address<input type="text" id="f_address" value="${esc(c.address)}" placeholder="123 Main St, City"></label>
            <label>Next Follow-up<input type="date" id="f_followup" value="${c.nextFollowUp||''}"></label>
            <label class="full">Notes<textarea id="f_notes" placeholder="Context, priorities, relationship notes…">${esc(c.notes)}</textarea></label>
          </div>
          ${isEdit? `<div class="field-label" style="margin-top:18px;">Properties Owned</div><div id="propertiesSection"></div>` : ''}
        </div>
        <div class="modal-foot">
          <button class="btn outline" id="cancelBtn">Cancel</button>
          <button class="btn gold" id="saveBtn">${isEdit?'Save Changes':'Add Contact'}</button>
        </div>
      </div>
    </div>`;
  const root = document.getElementById('modalRoot');
  root.innerHTML = html;
  const close = ()=>root.innerHTML='';
  root.querySelector('.modal-close').onclick = close;
  root.querySelector('#cancelBtn').onclick = close;
  root.querySelector('.modal-overlay').addEventListener('click', e=>{ if(e.target.classList.contains('modal-overlay')) close(); });

  if(isEdit){
    const ownedListings = state.listings.filter(l=>l.ownerContactId===c.id);
    let activePropId = ownedListings[0]?.id || null;
    function renderPropsSection(){
      const sec = root.querySelector('#propertiesSection');
      if(!sec) return;
      if(!listingsSchemaReady){
        sec.innerHTML = `<div class="empty" style="text-align:left;padding:6px 0;">Run <code>schema_v2.sql</code> to enable property tracking.</div>`;
        return;
      }
      if(!ownedListings.length){
        sec.innerHTML = `<div class="empty" style="text-align:left;padding:6px 0 12px;">No properties on file for this contact yet.</div><button type="button" class="btn outline sm" id="addPropBtn">+ Add Property</button>`;
      } else {
        const active = ownedListings.find(l=>l.id===activePropId) || ownedListings[0];
        activePropId = active.id;
        sec.innerHTML = `
          <div class="property-tabs">
            ${ownedListings.map(l=>`<button type="button" class="property-tab-btn ${l.id===active.id?'active':''}" data-id="${l.id}">${esc((l.address||'').split(',')[0])}</button>`).join('')}
          </div>
          <div class="property-detail-card">
            <div class="property-detail-grid">
              <div><div class="ik">Type</div><div class="iv">${esc(active.listingType)}</div></div>
              <div><div class="ik">Property Type</div><div class="iv">${esc(active.propertyType||'—')}</div></div>
              <div><div class="ik">Status</div><div class="iv">${esc(active.status)}</div></div>
              <div><div class="ik">Price</div><div class="iv">${active.price?fullMoney(active.price):'—'}</div></div>
              <div><div class="ik">SF</div><div class="iv">${fmtSf(active.squareFeet)}</div></div>
              <div><div class="ik">$/SF</div><div class="iv">${fmtPerSf(active.pricePerSf)}</div></div>
              <div><div class="ik">Expires</div><div class="iv">${active.expirationDate?fmtDate(active.expirationDate):'—'}</div></div>
            </div>
            <div style="display:flex;gap:8px;">
              <button type="button" class="btn outline sm" id="editPropBtn">Edit Property</button>
              <button type="button" class="btn outline sm" id="addPropBtn">+ Add Another</button>
            </div>
          </div>
        `;
        sec.querySelectorAll('.property-tab-btn').forEach(btn=>{
          btn.onclick = ()=>{ activePropId = btn.dataset.id; renderPropsSection(); };
        });
        sec.querySelector('#editPropBtn').onclick = ()=>openListingModal(active);
      }
      const addBtn = sec.querySelector('#addPropBtn');
      if(addBtn) addBtn.onclick = ()=>openListingModal(null, c.id);
    }
    renderPropsSection();
  }
  root.querySelector('#saveBtn').onclick = async ()=>{
    const name = document.getElementById('f_name').value.trim();
    if(!name){ toast('Name is required'); return; }
    const data = {
      name,
      company: document.getElementById('f_company').value.trim(),
      phone: document.getElementById('f_phone').value.trim(),
      email: document.getElementById('f_email').value.trim(),
      source: document.getElementById('f_source').value.trim(),
      propertyType: document.getElementById('f_type').value,
      status: document.getElementById('f_status').value,
      transactionType: document.getElementById('f_txn').value,
      address: document.getElementById('f_address').value.trim(),
      nextFollowUp: document.getElementById('f_followup').value,
      notes: document.getElementById('f_notes').value.trim(),
    };
    const btn = document.getElementById('saveBtn');
    btn.disabled = true;
    if(isEdit){
      const { error } = await supabaseClient.from('contacts').update(contactToRow({ ...data, ownerEmail: contact.ownerEmail })).eq('id', contact.id);
      if(error){ toast('Save failed: '+error.message); btn.disabled=false; return; }
      await logActivity('contact', `Updated contact <b>${esc(name)}</b> <span class="cell-sub">(by ${esc(ownerLabel(currentUserEmail()))})</span>`, contact.id);
      toast('Contact updated');
    } else {
      const row = contactToRow({ ...data, ownerEmail: currentUserEmail() });
      const { data:inserted, error } = await supabaseClient.from('contacts').insert(row).select().single();
      if(error){ toast('Save failed: '+error.message); btn.disabled=false; return; }
      await logActivity('contact', `Added new prospect <b>${esc(name)}</b> <span class="cell-sub">(by ${esc(ownerLabel(currentUserEmail()))})</span>`, inserted.id);
      toast('Contact added');
    }
    await loadAllData();
    close();
    if(document.getElementById('prospectsBody')) renderProspectsTable();
    if(location.hash==='#dashboard') renderDashboard();
    if(location.hash==='#coldcall') renderColdCall();
  };
}

/* ---------- Cold Call ---------- */
function renderColdCall(){
  const view = document.getElementById('view');
  view.className = 'view';
  const q = currentSearch.toLowerCase();
  let queue = state.contacts.filter(c=>c.status!=='Client' && c.status!=='Dead');
  if(q) queue = queue.filter(c=>`${c.name} ${c.company}`.toLowerCase().includes(q));
  queue.sort((a,b)=>{
    const aDue = a.nextFollowUp && isPastOrToday(a.nextFollowUp);
    const bDue = b.nextFollowUp && isPastOrToday(b.nextFollowUp);
    if(aDue!==bDue) return aDue? -1:1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  if(!coldCallActiveId || !queue.find(c=>c.id===coldCallActiveId)){
    coldCallActiveId = queue[0]?.id || null;
  }

  view.innerHTML = `
    <div class="page-head">
      <div><h1>Cold Call</h1><p>${queue.length} prospects in your calling queue</p></div>
      <button class="btn gold" id="addContactBtn2">+ Add Prospect</button>
    </div>
    <div class="coldcall-wrap">
      <div class="panel">
        <div class="panel-head"><h3>Queue</h3></div>
        <div class="panel-body queue-list" id="queueList">
          ${queue.length? queue.map(c=>{
            const due = c.nextFollowUp && isPastOrToday(c.nextFollowUp);
            return `<div class="queue-item ${c.id===coldCallActiveId?'active':''}" data-id="${c.id}">
              <div class="qn">${esc(c.name)}</div>
              <div class="qc">${esc(c.company||'No company')}</div>
              <div style="margin-top:6px;display:flex;gap:6px;align-items:center;">
                <span class="badge ${c.status.toLowerCase()}">${c.status}</span>
                ${due?`<span class="badge hot">Due</span>`:''}
              </div>
            </div>`;
          }).join('') : '<div class="empty">No prospects to call. Add one to get started.</div>'}
        </div>
      </div>
      <div class="panel call-card" id="callPanel"></div>
    </div>
  `;
  document.getElementById('addContactBtn2').onclick = ()=>openContactModal();
  view.querySelectorAll('.queue-item').forEach(el=>{
    el.onclick = ()=>{ coldCallActiveId = el.dataset.id; renderColdCall(); };
  });
  renderCallPanel(queue);
}

let selectedOutcome = null;

function renderCallPanel(queue){
  const panel = document.getElementById('callPanel');
  const c = contactById(coldCallActiveId);
  selectedOutcome = null;
  if(!c){
    panel.innerHTML = `<div class="empty">Select a prospect from the queue to start calling.</div>`;
    return;
  }
  const history = state.calls.filter(call=>call.contactId===c.id).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));
  panel.innerHTML = `
    <div class="call-contact-head">
      <div>
        <h2>${esc(c.name)}</h2>
        <div class="company">${esc(c.company||'—')} ${c.propertyType?`· ${esc(c.propertyType)}`:''}</div>
        <div class="phone-big">${esc(c.phone||'No phone on file')}</div>
      </div>
      <span class="badge ${c.status.toLowerCase()}">${c.status}</span>
    </div>
    <div class="info-grid">
      <div><div class="ik">Email</div><div class="iv">${esc(c.email||'—')}</div></div>
      <div><div class="ik">Property Address</div><div class="iv">${esc(c.address||'—')}</div></div>
      <div><div class="ik">Source</div><div class="iv">${esc(c.source||'—')}</div></div>
      <div><div class="ik">Last Contacted</div><div class="iv">${c.lastContactedAt? fmtDate(c.lastContactedAt):'Never'}</div></div>
      <div><div class="ik">Owner</div><div class="iv">${esc(ownerLabel(c.ownerEmail))}</div></div>
    </div>
    ${c.notes? `<div style="background:var(--bg);border-radius:9px;padding:10px 12px;font-size:13px;margin-bottom:16px;">${esc(c.notes)}</div>`:''}

    <span class="field-label">Call outcome</span>
    <div class="outcome-grid" id="outcomeGrid">
      ${OUTCOMES.map(o=>`<button type="button" class="outcome-btn" data-outcome="${o}">${o}</button>`).join('')}
    </div>

    <span class="field-label">Call notes</span>
    <textarea id="callNotes" placeholder="What was discussed…"></textarea>

    <div class="form-grid" style="margin-top:12px;">
      <label>Next follow-up date<input type="date" id="nextFollowupInput" value="${c.nextFollowUp||''}"></label>
      <label>Update status<select id="statusUpdate">${STATUSES.map(s=>`<option ${s===c.status?'selected':''}>${s}</option>`).join('')}</select></label>
    </div>

    <div class="call-actions">
      <div style="display:flex;gap:8px;">
        <button class="btn outline sm" id="editContactBtn">Edit Contact</button>
        <button class="btn outline sm" id="emailContactBtn">Draft Email</button>
        <button class="btn outline sm" id="skipBtn">Skip &rarr;</button>
      </div>
      <button class="btn gold" id="logCallBtn">Log Call &amp; Next</button>
    </div>

    <div class="history-mini">
      <span class="field-label">Call history (${history.length})</span>
      ${history.length? history.slice(0,6).map(h=>`<div class="hitem"><b>${esc(h.outcome)}</b> — ${fmtDateTime(h.timestamp)}${h.loggedBy? ' — '+esc(h.loggedBy):''}${h.notes? ' — '+esc(h.notes):''}</div>`).join('') : '<div class="empty">No calls logged yet.</div>'}
    </div>
  `;

  panel.querySelectorAll('.outcome-btn').forEach(btn=>{
    btn.onclick = ()=>{
      selectedOutcome = btn.dataset.outcome;
      panel.querySelectorAll('.outcome-btn').forEach(b=>b.classList.toggle('selected', b===btn));
      const auto = { 'Not Interested':'Dead', 'Interested':'Warm', 'Meeting Scheduled':'Hot', 'Callback Requested':'Warm' };
      if(auto[selectedOutcome]) document.getElementById('statusUpdate').value = auto[selectedOutcome];
    };
  });

  document.getElementById('editContactBtn').onclick = ()=>openContactModal(c);
  document.getElementById('emailContactBtn').onclick = ()=>openEmailComposer(c);
  document.getElementById('skipBtn').onclick = ()=>{
    const idx = queue.findIndex(x=>x.id===c.id);
    coldCallActiveId = queue[(idx+1)%queue.length]?.id || null;
    renderColdCall();
  };
  document.getElementById('logCallBtn').onclick = async ()=>{
    if(!selectedOutcome){ toast('Pick a call outcome first'); return; }
    const notes = document.getElementById('callNotes').value.trim();
    const nextFollowUp = document.getElementById('nextFollowupInput').value;
    const newStatus = document.getElementById('statusUpdate').value;
    const btn = document.getElementById('logCallBtn');
    btn.disabled = true; btn.textContent = 'Logging…';

    const { error: callErr } = await supabaseClient.from('calls').insert({
      contact_id: c.id, outcome: selectedOutcome, notes: notes||null, logged_by: currentUserEmail(),
    });
    if(callErr){ toast('Failed to log call: '+callErr.message); btn.disabled=false; btn.textContent='Log Call & Next'; return; }

    const { error: contactErr } = await supabaseClient.from('contacts').update({
      last_contacted_at: new Date().toISOString(),
      next_follow_up: nextFollowUp || c.nextFollowUp || null,
      status: newStatus,
    }).eq('id', c.id);
    if(contactErr) toast('Call logged, but contact update failed: '+contactErr.message);

    await logActivity('call', `Called <b>${esc(c.name)}</b> — ${esc(selectedOutcome)}${currentUserEmail()? ' (by '+esc(currentUserEmail())+')':''}`, c.id);
    await loadAllData();
    toast('Call logged');
    const idx = queue.findIndex(x=>x.id===c.id);
    const nextQueue = state.contacts.filter(x=>x.status!=='Client' && x.status!=='Dead');
    coldCallActiveId = queue[idx+1]?.id || nextQueue[0]?.id || null;
    renderColdCall();
  };
}

/* ---------- Deals Pipeline ---------- */
let draggedDealId = null;

function renderDeals(){
  const view = document.getElementById('view');
  view.className = 'view view-deals';
  const q = currentSearch.toLowerCase();
  let deals = state.deals;
  if(q) deals = deals.filter(d=>`${d.title} ${d.propertyAddress}`.toLowerCase().includes(q));
  const totalValue = deals.reduce((s,d)=>s+(Number(d.value)||0),0);

  view.innerHTML = `
    <div class="page-head">
      <div><h1>Deals Pipeline</h1><p>${deals.length} deals · ${fullMoney(totalValue)} total deal value</p></div>
      <button class="btn gold" id="addDealBtn">+ Add Deal</button>
    </div>
    <div class="kanban" id="kanban">
      ${STAGES.map(stage=>{
        const inStage = deals.filter(d=>d.stage===stage);
        const stageValue = inStage.reduce((s,d)=>s+(Number(d.value)||0)*((Number(d.commissionPct)||0)/100),0);
        return `
        <div class="kcol" data-stage="${esc(stage)}">
          <div class="kcol-head"><span>${stage}</span><span class="kcount">${inStage.length}</span></div>
          <div class="kcol-body" data-stage="${esc(stage)}">
            ${inStage.map(d=>{
              const contact = contactById(d.contactId);
              return `<div class="kcard" draggable="true" data-id="${d.id}">
                <div class="kt">${esc(d.title)}</div>
                <div class="kc">${esc(d.propertyAddress||'')}</div>
                <div class="kv">${fullMoney(d.value)}</div>
                <div class="kmeta"><span>${contact?esc(contact.name):'No contact'}</span><span>${d.closeDate?fmtDate(d.closeDate):''}</span></div>
                <div class="owner-tag" style="margin-top:8px;" title="${esc(d.ownerEmail||'Unassigned')}"><span class="owner-dot">${esc(initials(ownerLabel(d.ownerEmail)))}</span>${esc(ownerLabel(d.ownerEmail))}</div>
              </div>`;
            }).join('')}
          </div>
          <button class="kcol-add" data-stage="${esc(stage)}">+ Add deal</button>
          ${stageValue? `<div style="text-align:center;font-size:11px;color:var(--text-dim);padding:0 10px 10px;">${money(stageValue)} commission</div>`:''}
        </div>`;
      }).join('')}
    </div>
  `;

  document.getElementById('addDealBtn').onclick = ()=>openDealModal();
  view.querySelectorAll('.kcol-add').forEach(btn=>{
    btn.onclick = ()=>openDealModal(null, btn.dataset.stage);
  });

  view.querySelectorAll('.kcard').forEach(card=>{
    card.addEventListener('click', ()=>openDealModal(dealById(card.dataset.id)));
    card.addEventListener('dragstart', e=>{
      draggedDealId = card.dataset.id;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    card.addEventListener('dragend', ()=>card.classList.remove('dragging'));
  });

  view.querySelectorAll('.kcol-body').forEach(col=>{
    col.addEventListener('dragover', e=>{ e.preventDefault(); col.classList.add('dragover'); });
    col.addEventListener('dragleave', ()=>col.classList.remove('dragover'));
    col.addEventListener('drop', async e=>{
      e.preventDefault();
      col.classList.remove('dragover');
      const deal = dealById(draggedDealId);
      if(deal && deal.stage !== col.dataset.stage){
        const oldStage = deal.stage;
        const newStage = col.dataset.stage;
        const { error } = await supabaseClient.from('deals').update({ stage:newStage, updated_at:new Date().toISOString() }).eq('id', deal.id);
        if(error){ toast('Failed to move deal: '+error.message); return; }
        await logActivity('deal', `Moved deal <b>${esc(deal.title)}</b> from ${oldStage} to ${newStage} <span class="cell-sub">(by ${esc(ownerLabel(currentUserEmail()))})</span>`, deal.contactId, deal.id);
        await loadAllData();
      }
      renderDeals();
    });
  });
}

function openDealModal(deal, defaultStage){
  const isEdit = !!deal;
  const d = deal || { title:'', propertyAddress:'', value:'', commissionPct:3, stage: defaultStage||STAGES[0], closeDate:'', contactId:'', notes:'' };
  const contactOptions = state.contacts.map(c=>`<option value="${c.id}" ${c.id===d.contactId?'selected':''}>${esc(c.name)}</option>`).join('');
  const html = `
    <div class="modal-overlay">
      <div class="modal">
        <div class="modal-head"><h3>${isEdit?'Edit Deal':'Add Deal'}</h3><button class="modal-close">&times;</button></div>
        <div class="modal-body">
          ${isEdit? `<div class="owner-tag" style="margin-bottom:14px;"><span class="owner-dot">${esc(initials(ownerLabel(d.ownerEmail)))}</span>Owned by ${esc(ownerLabel(d.ownerEmail))} · created ${fmtDate(d.createdAt)}</div>`:''}
          <div class="form-grid">
            <label class="full">Deal title<input type="text" id="d_title" value="${esc(d.title)}" placeholder="123 Main St — Office Sale"></label>
            <label class="full">Property address<input type="text" id="d_address" value="${esc(d.propertyAddress)}" placeholder="123 Main St, City"></label>
            <label>Deal value<input type="number" id="d_value" value="${d.value}" placeholder="1500000"></label>
            <label>Commission %<input type="number" step="0.1" id="d_comm" value="${d.commissionPct}" placeholder="3"></label>
            <label>Stage<select id="d_stage">${STAGES.map(s=>`<option ${s===d.stage?'selected':''}>${s}</option>`).join('')}</select></label>
            <label>Expected close date<input type="date" id="d_close" value="${d.closeDate||''}"></label>
            <label class="full">Linked contact<select id="d_contact"><option value="">— None —</option>${contactOptions}</select></label>
            <label class="full">Notes<textarea id="d_notes" placeholder="Deal terms, contingencies…">${esc(d.notes)}</textarea></label>
          </div>
        </div>
        <div class="modal-foot">
          ${isEdit? '<button class="btn danger" id="deleteDealBtn" style="margin-right:auto;">Delete</button>':''}
          <button class="btn outline" id="cancelBtn">Cancel</button>
          <button class="btn gold" id="saveDealBtn">${isEdit?'Save Changes':'Add Deal'}</button>
        </div>
      </div>
    </div>`;
  const root = document.getElementById('modalRoot');
  root.innerHTML = html;
  const close = ()=>root.innerHTML='';
  root.querySelector('.modal-close').onclick = close;
  root.querySelector('#cancelBtn').onclick = close;
  root.querySelector('.modal-overlay').addEventListener('click', e=>{ if(e.target.classList.contains('modal-overlay')) close(); });
  if(isEdit){
    root.querySelector('#deleteDealBtn').onclick = async ()=>{
      if(confirm('Delete this deal?')){
        const { error } = await supabaseClient.from('deals').delete().eq('id', deal.id);
        if(error){ toast('Delete failed: '+error.message); return; }
        await loadAllData();
        toast('Deal deleted'); close(); renderDeals();
      }
    };
  }
  root.querySelector('#saveDealBtn').onclick = async ()=>{
    const title = document.getElementById('d_title').value.trim();
    if(!title){ toast('Deal title is required'); return; }
    const data = {
      title,
      propertyAddress: document.getElementById('d_address').value.trim(),
      value: Number(document.getElementById('d_value').value)||0,
      commissionPct: Number(document.getElementById('d_comm').value)||0,
      stage: document.getElementById('d_stage').value,
      closeDate: document.getElementById('d_close').value,
      contactId: document.getElementById('d_contact').value || null,
      notes: document.getElementById('d_notes').value.trim(),
    };
    const btn = document.getElementById('saveDealBtn');
    btn.disabled = true;
    if(isEdit){
      const { error } = await supabaseClient.from('deals').update(dealToRow({ ...data, ownerEmail: deal.ownerEmail })).eq('id', deal.id).select();
      if(error){ toast('Save failed: '+error.message); btn.disabled=false; return; }
      await logActivity('deal', `Updated deal <b>${esc(title)}</b> <span class="cell-sub">(by ${esc(ownerLabel(currentUserEmail()))})</span>`, deal.contactId, deal.id);
      toast('Deal updated');
    } else {
      const row = dealToRow({ ...data, ownerEmail: currentUserEmail() });
      const { data:inserted, error } = await supabaseClient.from('deals').insert(row).select().single();
      if(error){ toast('Save failed: '+error.message); btn.disabled=false; return; }
      await logActivity('deal', `Created deal <b>${esc(title)}</b> in ${data.stage} <span class="cell-sub">(by ${esc(ownerLabel(currentUserEmail()))})</span>`, data.contactId, inserted.id);
      toast('Deal added');
    }
    await loadAllData();
    close(); renderDeals();
  };
}

/* ---------- Listings ---------- */
function renderListings(){
  const view = document.getElementById('view');
  view.className = 'view';
  if(!listingsSchemaReady){
    view.innerHTML = `<div class="panel"><div class="panel-body">
      <h3 style="margin-top:0;">Setup needed</h3>
      <p style="color:var(--text-dim);font-size:13.5px;">The Listings feature needs one more database update. Run <code>schema_v2.sql</code> in your Supabase project's SQL editor, then reload this page.</p>
    </div></div>`;
    return;
  }
  const q = currentSearch.toLowerCase();
  let listings = state.listings;
  if(q) listings = listings.filter(l=>`${l.address}`.toLowerCase().includes(q));
  const activeCount = listings.filter(l=>l.status==='Active').length;

  view.innerHTML = `
    <div class="page-head">
      <div><h1>Active Listings</h1><p>${listings.length} properties tracked · ${activeCount} active</p></div>
      <button class="btn gold" id="addListingBtn">+ Add Listing</button>
    </div>
    <div class="filters-row">
      <select id="filterListingStatus"><option value="">All statuses</option>${LISTING_STATUSES.map(s=>`<option value="${s}">${s}</option>`).join('')}</select>
      <select id="filterListingType"><option value="">Lease &amp; Sale</option>${LISTING_TYPES.map(s=>`<option value="${s}">${s} only</option>`).join('')}</select>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Address</th><th>Type</th><th>Property Type</th><th>Price</th><th>SF</th><th>$/SF</th><th>Expires</th><th>Status</th><th>Owner</th><th></th></tr></thead>
        <tbody id="listingsBody"></tbody>
      </table>
    </div>
  `;
  document.getElementById('addListingBtn').onclick = ()=>openListingModal();
  document.getElementById('filterListingStatus').onchange = renderListingsTable;
  document.getElementById('filterListingType').onchange = renderListingsTable;
  renderListingsTable();
}

function renderListingsTable(){
  const body = document.getElementById('listingsBody');
  if(!body) return;
  const statusF = document.getElementById('filterListingStatus').value;
  const typeF = document.getElementById('filterListingType').value;
  const q = currentSearch.toLowerCase();
  const list = state.listings.filter(l=>{
    if(statusF && l.status!==statusF) return false;
    if(typeF && l.listingType!==typeF) return false;
    if(q && !l.address.toLowerCase().includes(q)) return false;
    return true;
  }).sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));

  if(!list.length){ body.innerHTML = `<tr><td colspan="10"><div class="empty">No listings yet. Add your first active listing.</div></td></tr>`; return; }

  const statusCls = { 'Active':'client', 'Under Contract':'warm', 'Expired':'dead', 'Withdrawn':'dead', 'Off Market':'cold' };
  body.innerHTML = list.map(l=>`
    <tr data-id="${l.id}">
      <td class="cell-name">${esc(l.address)}</td>
      <td><span class="badge ${l.listingType==='Lease'?'client':'cold'}">${esc(l.listingType)}</span></td>
      <td>${esc(l.propertyType||'—')}</td>
      <td>${l.price? fullMoney(l.price):'—'}</td>
      <td>${fmtSf(l.squareFeet)}</td>
      <td>${fmtPerSf(l.pricePerSf)}</td>
      <td>${l.expirationDate? fmtDate(l.expirationDate):'—'}</td>
      <td><span class="badge ${statusCls[l.status]||'dead'}">${esc(l.status)}</span></td>
      <td><span class="owner-tag" title="${esc(l.ownerEmail||'Unassigned')}"><span class="owner-dot">${esc(initials(ownerLabel(l.ownerEmail)))}</span>${esc(ownerLabel(l.ownerEmail))}</span></td>
      <td>
        <div class="actions-cell">
          <button class="icon-btn editBtn" title="Edit"><svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg></button>
          <button class="icon-btn delBtn" title="Delete"><svg viewBox="0 0 24 24"><path d="M6 7h12l-1 14H7L6 7zm3-3h6l1 2H8l1-2z"/></svg></button>
        </div>
      </td>
    </tr>
  `).join('');

  body.querySelectorAll('tr').forEach(tr=>{
    const id = tr.dataset.id;
    tr.querySelector('.editBtn').onclick = ()=>openListingModal(listingById(id));
    tr.querySelector('.delBtn').onclick = async ()=>{
      if(confirm('Delete this listing? Linked potential-client records will also be removed.')){
        const { error } = await supabaseClient.from('listings').delete().eq('id', id);
        if(error){ toast('Delete failed: '+error.message); return; }
        await loadAllData();
        toast('Listing deleted');
        renderListingsTable();
      }
    };
  });
}

function parseListingText(text){
  const out = {};
  const addrMatch = text.match(/\d{1,6}\s+[A-Za-z0-9.'#-]+(?:\s+[A-Za-z0-9.'#-]+){0,5}(?:,\s*[A-Za-z .]+)?(?:,\s*[A-Z]{2}\s*\d{5})?/);
  if(addrMatch) out.address = addrMatch[0].trim();

  const perSfMatch = text.match(/\$\s*([\d,]+\.?\d*)\s*\/?\s*(?:SF|sq\.?\s*ft)/i);
  if(perSfMatch) out.pricePerSf = parseFloat(perSfMatch[1].replace(/,/g,''));

  const allDollar = [...text.matchAll(/\$\s*([\d,]+(?:\.\d+)?)/g)].map(m=>parseFloat(m[1].replace(/,/g,'')));
  const totalCandidate = allDollar.find(v => v !== out.pricePerSf && v > 1000);
  if(totalCandidate) out.price = totalCandidate;

  const sfMatch = text.match(/([\d,]{3,})\s*(?:SF|sq\.?\s*ft|square feet)/i);
  if(sfMatch) out.squareFeet = parseFloat(sfMatch[1].replace(/,/g,''));

  const expMatch = text.match(/expir\w*[^\n\d]{0,15}(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\w+ \d{1,2},? \d{4})/i);
  if(expMatch){
    const d = new Date(expMatch[1]);
    if(!isNaN(d)) out.expirationDate = d.toISOString().slice(0,10);
  }

  if(/for lease|lease rate|\/sf\/yr|\/sf\/mo/i.test(text)) out.listingType = 'Lease';
  else if(/for sale|asking price|purchase price/i.test(text)) out.listingType = 'Sale';

  return out;
}

let listingModalTab = 'details';
function contactMiniInfo(contactId){
  const c = contactById(contactId);
  if(!c) return 'No contact linked';
  const parts = [c.phone, c.email].filter(Boolean);
  return `${c.name}${parts.length? ' — '+parts.join(' · ') : ''}`;
}
function openListingModal(listing, prefillOwnerContactId){
  const isEdit = !!listing;
  const l = listing || { address:'', listingType:'Lease', propertyType:PROPERTY_TYPES[0], status:'Active', price:'', squareFeet:'', pricePerSf:'', commissionPct:'', expirationDate:'', ownerContactId:prefillOwnerContactId||'', clientContactId:'', notes:'' };
  listingModalTab = 'details';
  const fs = {
    address:l.address||'', listingType:l.listingType||'Lease', propertyType:l.propertyType||PROPERTY_TYPES[0],
    status:l.status||'Active', expirationDate:l.expirationDate||'', price:l.price||'', squareFeet:l.squareFeet||'',
    pricePerSf:l.pricePerSf||'', commissionPct:l.commissionPct||'', ownerContactId:l.ownerContactId||'',
    clientContactId:l.clientContactId||'', notes:l.notes||'',
  };
  const contactOptions = (selectedId) => state.contacts.map(c=>`<option value="${c.id}" ${c.id===selectedId?'selected':''}>${esc(c.name)}</option>`).join('');

  function detailsTabHtml(){
    return `
      <div class="autofill-box">
        <p class="hint">Paste text copied from a LoopNet listing, flyer, or offering memorandum — I'll try to pull out the address, price, SF, and expiration date for you to review.</p>
        <textarea id="autofillText" placeholder="Paste listing text here…"></textarea>
        <button type="button" class="btn outline sm" id="autofillBtn">Autofill from pasted text</button>
      </div>
      <div class="form-grid">
        <label class="full">Address<input type="text" id="l_address" value="${esc(fs.address)}" placeholder="123 Main St, City, ST"></label>
        <label>Listing Type<select id="l_type">${LISTING_TYPES.map(t=>`<option ${t===fs.listingType?'selected':''}>${t}</option>`).join('')}</select></label>
        <label>Property Type<select id="l_ptype">${PROPERTY_TYPES.map(t=>`<option ${t===fs.propertyType?'selected':''}>${t}</option>`).join('')}</select></label>
        <label>Status<select id="l_status">${LISTING_STATUSES.map(s=>`<option ${s===fs.status?'selected':''}>${s}</option>`).join('')}</select></label>
        <label>Expiration Date<input type="date" id="l_exp" value="${fs.expirationDate}"></label>
        <label>Price<input type="number" id="l_price" value="${fs.price}" placeholder="1500000"></label>
        <label>Square Feet<input type="number" id="l_sf" value="${fs.squareFeet}" placeholder="12000"></label>
        <label>Price / SF<input type="number" step="0.01" id="l_persf" value="${fs.pricePerSf}" placeholder="18.50"></label>
        <label>Commission %<input type="number" step="0.1" id="l_comm" value="${fs.commissionPct}" placeholder="6"></label>
        <label class="full">Property Owner (contact)<select id="l_owner"><option value="">— None —</option>${contactOptions(fs.ownerContactId)}</select>
          <span class="cell-sub" id="ownerInfo" style="margin-top:4px;">${contactMiniInfo(fs.ownerContactId)}</span></label>
        <label class="full">Client — who we represent<select id="l_client"><option value="">— None —</option>${contactOptions(fs.clientContactId)}</select>
          <span class="cell-sub" id="clientInfo" style="margin-top:4px;">${contactMiniInfo(fs.clientContactId)}</span></label>
      </div>
    `;
  }

  function notesTabHtml(){
    return `
      <p class="hint" style="color:var(--text-dim);font-size:12.5px;margin-top:0;">Notes, backstory, and special instructions for this listing.</p>
      <textarea id="l_notes" style="min-height:280px;" placeholder="Access instructions, ownership history, tenant relationships, negotiation notes, anything worth remembering…">${esc(fs.notes)}</textarea>
    `;
  }

  function clientsTabHtml(){
    const links = state.listingInterests.filter(li=>li.listingId===l.id);
    const linkedContacts = links.map(li=>({ link:li, contact: contactById(li.contactId) })).filter(x=>x.contact);
    const availableContacts = state.contacts.filter(c=>!links.some(li=>li.contactId===c.id));
    return `
      <p class="hint" style="color:var(--text-dim);font-size:12.5px;margin-top:0;">Prospects and clients interested in this property.</p>
      <div id="linkedContactsList">
        ${linkedContacts.length? linkedContacts.map(({link,contact})=>`
          <div class="linked-contact-row" data-link-id="${link.id}">
            <div class="avatar">${initials(contact.name)}</div>
            <div class="lc-main">
              <div class="lc-name">${esc(contact.name)}</div>
              <div class="lc-sub">${esc(contact.company||'')}</div>
            </div>
            <button type="button" class="icon-btn lc-email" title="Draft Email"><svg viewBox="0 0 24 24"><path d="M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm1 2.7V17h14V6.7l-7 5.3-7-5.3zm.8-.7L12 10.5 17.2 6H5.8z"/></svg></button>
            <button type="button" class="icon-btn lc-remove" title="Remove"><svg viewBox="0 0 24 24"><path d="M6 7h12l-1 14H7L6 7zm3-3h6l1 2H8l1-2z"/></svg></button>
          </div>`).join('') : '<div class="empty">No potential clients linked yet.</div>'}
      </div>
      <div class="add-linked-row">
        <select id="addLinkContact">${availableContacts.length? availableContacts.map(c=>`<option value="${c.id}">${esc(c.name)}${c.company?' — '+esc(c.company):''}</option>`).join('') : '<option value="">No more contacts to add</option>'}</select>
        <button type="button" class="btn outline sm" id="addLinkBtn" ${!availableContacts.length?'disabled':''}>+ Add</button>
      </div>
    `;
  }

  function renderModalBody(root){
    const body = root.querySelector('#listingModalBody');
    body.innerHTML = listingModalTab==='details' ? detailsTabHtml() : listingModalTab==='notes' ? notesTabHtml() : clientsTabHtml();
    if(listingModalTab==='details'){
      const bind = (id, key, isNumber) => {
        const el = root.querySelector('#'+id);
        el.addEventListener('input', ()=>{ fs[key] = isNumber ? el.value : el.value; });
        el.addEventListener('change', ()=>{ fs[key] = el.value; });
      };
      bind('l_address','address'); bind('l_type','listingType'); bind('l_ptype','propertyType');
      bind('l_status','status'); bind('l_exp','expirationDate'); bind('l_price','price');
      bind('l_sf','squareFeet'); bind('l_persf','pricePerSf'); bind('l_comm','commissionPct');
      root.querySelector('#l_owner').addEventListener('change', e=>{
        fs.ownerContactId = e.target.value;
        root.querySelector('#ownerInfo').textContent = contactMiniInfo(fs.ownerContactId);
      });
      root.querySelector('#l_client').addEventListener('change', e=>{
        fs.clientContactId = e.target.value;
        root.querySelector('#clientInfo').textContent = contactMiniInfo(fs.clientContactId);
      });
      root.querySelector('#autofillBtn').onclick = ()=>{
        const parsed = parseListingText(root.querySelector('#autofillText').value);
        if(parsed.address){ root.querySelector('#l_address').value = parsed.address; fs.address = parsed.address; }
        if(parsed.listingType){ root.querySelector('#l_type').value = parsed.listingType; fs.listingType = parsed.listingType; }
        if(parsed.price){ root.querySelector('#l_price').value = parsed.price; fs.price = parsed.price; }
        if(parsed.squareFeet){ root.querySelector('#l_sf').value = parsed.squareFeet; fs.squareFeet = parsed.squareFeet; }
        if(parsed.pricePerSf){ root.querySelector('#l_persf').value = parsed.pricePerSf; fs.pricePerSf = parsed.pricePerSf; }
        if(parsed.expirationDate){ root.querySelector('#l_exp').value = parsed.expirationDate; fs.expirationDate = parsed.expirationDate; }
        const found = Object.keys(parsed).length;
        toast(found ? `Filled in ${found} field${found===1?'':'s'} — please double-check them` : "Couldn't find recognizable fields in that text");
      };
    } else if(listingModalTab==='notes'){
      root.querySelector('#l_notes').addEventListener('input', e=>{ fs.notes = e.target.value; });
    } else {
      root.querySelectorAll('.lc-remove').forEach(btn=>{
        btn.onclick = async ()=>{
          const linkId = btn.closest('.linked-contact-row').dataset.linkId;
          const { error } = await supabaseClient.from('listing_interests').delete().eq('id', linkId);
          if(error){ toast('Failed to remove: '+error.message); return; }
          await loadAllData();
          toast('Removed');
          renderModalBody(root);
        };
      });
      root.querySelectorAll('.lc-email').forEach(btn=>{
        btn.onclick = ()=>{
          const linkId = btn.closest('.linked-contact-row').dataset.linkId;
          const link = state.listingInterests.find(x=>x.id===linkId);
          openEmailComposer(contactById(link.contactId), l);
        };
      });
      const addBtn = root.querySelector('#addLinkBtn');
      if(addBtn && !addBtn.disabled){
        addBtn.onclick = async ()=>{
          const contactId = root.querySelector('#addLinkContact').value;
          if(!contactId) return;
          const { error } = await supabaseClient.from('listing_interests').insert({ listing_id:l.id, contact_id:contactId });
          if(error){ toast('Failed to add: '+error.message); return; }
          await loadAllData();
          toast('Added');
          renderModalBody(root);
        };
      }
    }
  }

  const tabs = isEdit
    ? [['details','Details'],['notes','Notes'],['clients','Potential Clients']]
    : [['details','Details'],['notes','Notes']];
  const html = `
    <div class="modal-overlay">
      <div class="modal">
        <div class="modal-head"><h3>${isEdit?'Edit Listing':'Add Listing'}</h3><button class="modal-close">&times;</button></div>
        <div class="modal-body">
          <div class="modal-tabs">${tabs.map(([key,label],i)=>`<button type="button" class="modal-tab ${i===0?'active':''}" data-tab="${key}">${label}</button>`).join('')}</div>
          <div id="listingModalBody"></div>
        </div>
        <div class="modal-foot">
          ${isEdit? '<button class="btn danger" id="deleteListingBtn" style="margin-right:auto;">Delete</button>':''}
          <button class="btn outline" id="cancelBtn">Cancel</button>
          <button class="btn gold" id="saveListingBtn">${isEdit?'Save Changes':'Add Listing'}</button>
        </div>
      </div>
    </div>`;
  const root = document.getElementById('modalRoot');
  root.innerHTML = html;
  const close = ()=>root.innerHTML='';
  root.querySelector('.modal-close').onclick = close;
  root.querySelector('#cancelBtn').onclick = close;
  root.querySelector('.modal-overlay').addEventListener('click', e=>{ if(e.target.classList.contains('modal-overlay')) close(); });
  root.querySelectorAll('.modal-tab').forEach(btn=>{
    btn.onclick = ()=>{
      listingModalTab = btn.dataset.tab;
      root.querySelectorAll('.modal-tab').forEach(b=>b.classList.toggle('active', b===btn));
      renderModalBody(root);
    };
  });
  if(isEdit){
    root.querySelector('#deleteListingBtn').onclick = async ()=>{
      if(confirm('Delete this listing?')){
        const { error } = await supabaseClient.from('listings').delete().eq('id', l.id);
        if(error){ toast('Delete failed: '+error.message); return; }
        await loadAllData();
        toast('Listing deleted'); close(); navigate();
      }
    };
  }
  renderModalBody(root);

  root.querySelector('#saveListingBtn').onclick = async ()=>{
    const address = fs.address.trim();
    if(!address){ toast('Address is required'); return; }
    const data = {
      address,
      listingType: fs.listingType,
      propertyType: fs.propertyType,
      status: fs.status,
      expirationDate: fs.expirationDate,
      price: Number(fs.price)||0,
      squareFeet: Number(fs.squareFeet)||0,
      pricePerSf: Number(fs.pricePerSf)||0,
      commissionPct: Number(fs.commissionPct)||0,
      ownerContactId: fs.ownerContactId || null,
      clientContactId: fs.clientContactId || null,
      notes: fs.notes.trim(),
    };
    const btn = document.getElementById('saveListingBtn');
    btn.disabled = true;
    if(isEdit){
      const { error } = await supabaseClient.from('listings').update(listingToRow({ ...data, ownerEmail: l.ownerEmail })).eq('id', l.id);
      if(error){ toast('Save failed: '+error.message); btn.disabled=false; return; }
      await logActivity('listing', `Updated listing <b>${esc(address)}</b> <span class="cell-sub">(by ${esc(ownerLabel(currentUserEmail()))})</span>`);
      toast('Listing updated');
    } else {
      const row = listingToRow({ ...data, ownerEmail: currentUserEmail() });
      const { error } = await supabaseClient.from('listings').insert(row);
      if(error){ toast('Save failed: '+error.message); btn.disabled=false; return; }
      await logActivity('listing', `Added new listing <b>${esc(address)}</b> <span class="cell-sub">(by ${esc(ownerLabel(currentUserEmail()))})</span>`);
      toast('Listing added');
    }
    await loadAllData();
    close();
    if(document.getElementById('listingsBody')) renderListingsTable();
    if(location.hash==='#dashboard') renderDashboard();
  };
}

/* ---------- Email Composer ---------- */
const EMAIL_TEMPLATES = {
  intro: {
    label: 'Introduction',
    subject: (c)=>`Introduction — NAI Pfefferle`,
    body: (c,l,me)=>`Hi ${c.name.split(' ')[0]||''},\n\nMy name is ${me||'[your name]'} with NAI Pfefferle. I wanted to reach out and introduce myself${c.company? ` — I understand you're with ${c.company}`:''}. I'd love to learn more about your current real estate needs and see how we might be able to help.\n\nDo you have a few minutes for a call this week?\n\nBest,\n${me||'[your name]'}\nNAI Pfefferle`,
  },
  followup: {
    label: 'Follow-up After Call',
    subject: (c)=>`Great speaking with you`,
    body: (c,l,me)=>`Hi ${c.name.split(' ')[0]||''},\n\nThanks for taking the time to chat. As discussed, I wanted to follow up and keep the conversation going.\n\nLet me know if any questions come up in the meantime — happy to help.\n\nBest,\n${me||'[your name]'}\nNAI Pfefferle`,
  },
  listing: {
    label: 'Listing Info / Pitch',
    subject: (c,l)=>l? `Property Opportunity: ${l.address}` : `Property Opportunity`,
    body: (c,l,me)=>{
      if(!l) return `Hi ${c.name.split(' ')[0]||''},\n\nI wanted to share a property opportunity I think could be a great fit — let me know if you'd like more details.\n\nBest,\n${me||'[your name]'}\nNAI Pfefferle`;
      const lines = [`Hi ${c.name.split(' ')[0]||''},`,'', `I wanted to flag a ${l.listingType.toLowerCase()} opportunity that might be a fit:`, '', `Address: ${l.address}`];
      if(l.propertyType) lines.push(`Property Type: ${l.propertyType}`);
      if(l.squareFeet) lines.push(`Size: ${fmtSf(l.squareFeet)}`);
      if(l.price) lines.push(`${l.listingType==='Lease'?'Rate':'Price'}: ${fullMoney(l.price)}`);
      if(l.pricePerSf) lines.push(`Price/SF: ${fmtPerSf(l.pricePerSf)}`);
      lines.push('', "Let me know if you'd like to see it or want more details.", '', 'Best,', me||'[your name]', 'NAI Pfefferle');
      return lines.join('\n');
    },
  },
  checkin: {
    label: 'Checking In',
    subject: ()=>`Checking in`,
    body: (c,l,me)=>`Hi ${c.name.split(' ')[0]||''},\n\nJust wanted to check in and see where things stand on your end. Happy to reconnect whenever is useful for you.\n\nBest,\n${me||'[your name]'}\nNAI Pfefferle`,
  },
};

function openEmailComposer(contact, listing){
  if(!contact){ toast('No contact selected'); return; }
  const myName = ownerLabel(currentUserEmail());
  let templateKey = listing ? 'listing' : 'intro';
  const html = `
    <div class="modal-overlay">
      <div class="modal">
        <div class="modal-head"><h3>Draft Email — ${esc(contact.name)}</h3><button class="modal-close">&times;</button></div>
        <div class="modal-body">
          <div class="form-grid">
            <label class="full">To<input type="text" id="e_to" value="${esc(contact.email||'')}" placeholder="email@company.com"></label>
            <label class="full">Template<select id="e_template">${Object.entries(EMAIL_TEMPLATES).map(([k,t])=>`<option value="${k}" ${k===templateKey?'selected':''}>${t.label}</option>`).join('')}</select></label>
            <label class="full">Subject<input type="text" id="e_subject"></label>
            <label class="full">Body<textarea id="e_body" style="min-height:220px;"></textarea></label>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn outline" id="cancelBtn">Close</button>
          <button class="btn outline" id="copyBtn">Copy</button>
          <button class="btn gold" id="mailBtn">Open in Mail App</button>
        </div>
      </div>
    </div>`;
  const root = document.getElementById('modalRoot');
  root.innerHTML = html;
  const close = ()=>root.innerHTML='';
  root.querySelector('.modal-close').onclick = close;
  root.querySelector('#cancelBtn').onclick = close;
  root.querySelector('.modal-overlay').addEventListener('click', e=>{ if(e.target.classList.contains('modal-overlay')) close(); });

  function applyTemplate(){
    const key = root.querySelector('#e_template').value;
    const t = EMAIL_TEMPLATES[key];
    root.querySelector('#e_subject').value = t.subject(contact, listing);
    root.querySelector('#e_body').value = t.body(contact, listing, myName);
  }
  root.querySelector('#e_template').onchange = applyTemplate;
  applyTemplate();

  root.querySelector('#copyBtn').onclick = async ()=>{
    const text = `Subject: ${root.querySelector('#e_subject').value}\n\n${root.querySelector('#e_body').value}`;
    try{
      await navigator.clipboard.writeText(text);
      toast('Copied to clipboard');
    }catch(e){ toast('Could not copy — select and copy manually'); }
  };
  root.querySelector('#mailBtn').onclick = ()=>{
    const to = encodeURIComponent(root.querySelector('#e_to').value.trim());
    const subject = encodeURIComponent(root.querySelector('#e_subject').value);
    const body = encodeURIComponent(root.querySelector('#e_body').value);
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  };
}

/* ---------- Activity Log ---------- */
function renderActivity(){
  const view = document.getElementById('view');
  view.className = 'view';
  const q = currentSearch.toLowerCase();
  let items = state.activities;
  if(q) items = items.filter(a=>a.description.toLowerCase().includes(q));
  view.innerHTML = `
    <div class="page-head"><div><h1>Activity Log</h1><p>${items.length} events</p></div></div>
    <div class="panel"><div class="panel-body">
      <div class="timeline">
        ${items.length? items.map(a=>`
          <div class="tl-item">
            <div class="tl-time">${fmtDateTime(a.timestamp)}</div>
            <div class="tl-text">${a.description}</div>
          </div>`).join('') : '<div class="empty">No activity recorded yet. Log a call or update a deal to see it here.</div>'}
      </div>
    </div></div>
  `;
}

/* ---------- Search ---------- */
document.getElementById('globalSearch').addEventListener('input', e=>{
  currentSearch = e.target.value;
  navigate();
});

/* ---------- Export / Import (JSON) / Seed / Wipe ---------- */
document.getElementById('exportBtn').onclick = ()=>{
  const blob = new Blob([JSON.stringify(state, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `cre-crm-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

async function importJsonBackup(data){
  const contactIdMap = {};
  for(const c of (data.contacts||[])){
    const row = contactToRow(c);
    row.owner_email = c.ownerEmail || currentUserEmail();
    const { data:inserted, error } = await supabaseClient.from('contacts').insert(row).select().single();
    if(!error && inserted) contactIdMap[c.id] = inserted.id;
  }
  const dealIdMap = {};
  for(const d of (data.deals||[])){
    const row = dealToRow(d);
    row.contact_id = contactIdMap[d.contactId] || null;
    row.owner_email = d.ownerEmail || currentUserEmail();
    const { data:inserted, error } = await supabaseClient.from('deals').insert(row).select().single();
    if(!error && inserted) dealIdMap[d.id] = inserted.id;
  }
  for(const call of (data.calls||[])){
    const contactId = contactIdMap[call.contactId];
    if(!contactId) continue;
    await supabaseClient.from('calls').insert({ contact_id:contactId, timestamp:call.timestamp, outcome:call.outcome, notes:call.notes||null, logged_by: call.loggedBy || currentUserEmail() });
  }
  for(const a of (data.activities||[])){
    await supabaseClient.from('activities').insert({
      type:a.type, description:a.description,
      contact_id: contactIdMap[a.contactId]||null,
      deal_id: dealIdMap[a.dealId]||null,
      timestamp:a.timestamp,
    });
  }
}

document.getElementById('importInput').addEventListener('change', e=>{
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try{
      const data = JSON.parse(reader.result);
      if(!data.contacts) throw new Error('unrecognized file format');
      toast('Importing…');
      await importJsonBackup(data);
      await loadAllData();
      toast('Data imported');
      navigate();
    }catch(err){ toast('Import failed: ' + err.message); }
  };
  reader.readAsText(file);
  e.target.value = '';
});

document.getElementById('wipeBtn').onclick = async ()=>{
  if(confirm('This will permanently delete all contacts, deals, calls, and activity for your WHOLE TEAM. Continue?')){
    await supabaseClient.from('calls').delete().not('id','is',null);
    await supabaseClient.from('activities').delete().not('id','is',null);
    await supabaseClient.from('deals').delete().not('id','is',null);
    await supabaseClient.from('contacts').delete().not('id','is',null);
    await loadAllData();
    toast('All data cleared'); navigate();
  }
};

document.getElementById('seedBtn').onclick = async ()=>{
  if(state.contacts.length && !confirm('This adds sample contacts and deals to your shared workspace. Continue?')) return;
  await seedSampleData();
  await loadAllData();
  toast('Sample data loaded'); navigate();
};

async function seedSampleData(){
  const names = [
    ['Marcus Alden','Alden Property Group','Office'],
    ['Priya Nair','Nair Capital Partners','Industrial'],
    ['Ted Brancusi','Brancusi Retail Holdings','Retail'],
    ['Sofia Reyes','Reyes Multifamily LLC','Multifamily'],
    ['Dan Whitfield','Whitfield Land Co','Land'],
    ['Grace Kim','Kim Medical Properties','Medical'],
    ['Owen Bishop','Bishop Hospitality Group','Hospitality'],
    ['Lena Fischer','Fischer Mixed-Use Dev','Mixed-Use'],
  ];
  const contactRows = names.map(([name,company,type],i)=>({
    name, company, property_type:type,
    phone: `(555) ${String(100+i).padStart(3,'0')}-${String(1000+i*7).slice(-4)}`,
    email: name.toLowerCase().replace(' ','.')+'@example.com',
    status: STATUSES[i%STATUSES.length],
    source: ['Referral','LoopNet','CoStar','Cold Outreach','Networking Event'][i%5],
    address: `${100+i*11} Market St, Springfield`,
    notes: 'Interested in expanding portfolio this year.',
    next_follow_up: new Date(Date.now() + (i-3)*86400000).toISOString().slice(0,10),
    owner_email: currentUserEmail(),
  }));
  const { data: insertedContacts, error } = await supabaseClient.from('contacts').insert(contactRows).select();
  if(error){ toast('Seed failed: '+error.message); return; }
  const dealTitles = ['Downtown Office Sale','Industrial Park Lease','Strip Mall Acquisition','Apartment Complex Refi','Vacant Lot Sale'];
  const dealRows = insertedContacts.slice(0,5).map((c,i)=>({
    title: dealTitles[i], property_address: c.address,
    value: [1500000,3200000,875000,5400000,620000][i],
    commission_pct: [3,2.5,4,2,5][i],
    stage: STAGES[i%STAGES.length],
    close_date: new Date(Date.now()+(i+2)*7*86400000).toISOString().slice(0,10),
    contact_id: c.id, owner_email: currentUserEmail(),
  }));
  await supabaseClient.from('deals').insert(dealRows);
  await logActivity('contact','Loaded sample data set');
}

/* ---------- Auth ---------- */
function renderAuthScreen(mode){
  mode = mode || 'signin';
  const root = document.getElementById('authRoot');
  document.getElementById('app').style.display = 'none';
  root.innerHTML = `
    <div class="auth-wrap">
      <div class="auth-card">
        <div class="auth-brand"><div class="brand-mark">NP</div><div class="brand-name">NAI Pfefferle<span>CRM</span></div></div>
        <h2>${mode==='signup' ? 'Create your account' : 'Sign in'}</h2>
        <p>${mode==='signup' ? "Set up your own login for your team's shared CRM." : 'Shared CRM for the team — sign in with your account.'}</p>
        <div class="auth-error" id="authError"></div>
        <div class="auth-form">
          <label>Email<input type="email" id="authEmail" placeholder="you@naipfefferle.com" autocomplete="email"></label>
          <label>Password<input type="password" id="authPassword" placeholder="••••••••" autocomplete="${mode==='signup'?'new-password':'current-password'}"></label>
          <button class="btn gold auth-submit" id="authSubmitBtn">${mode==='signup' ? 'Create Account' : 'Sign In'}</button>
        </div>
        <div class="auth-footnote">
          ${mode==='signup'
            ? `Already have an account? <a href="#" id="toSignIn">Sign in</a>`
            : `New here? <a href="#" id="toSignUp">Create an account</a>`}
        </div>
      </div>
    </div>`;
  const submit = async ()=>{
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    const errEl = document.getElementById('authError');
    errEl.classList.remove('show');
    if(!email || !password){ errEl.textContent = 'Enter your email and password.'; errEl.classList.add('show'); return; }
    const btn = document.getElementById('authSubmitBtn');
    btn.disabled = true; btn.textContent = mode==='signup' ? 'Creating…' : 'Signing in…';
    const { error } = mode==='signup'
      ? await supabaseClient.auth.signUp({ email, password })
      : await supabaseClient.auth.signInWithPassword({ email, password });
    if(error){
      errEl.textContent = error.message;
      errEl.classList.add('show');
      btn.disabled = false; btn.textContent = mode==='signup' ? 'Create Account' : 'Sign In';
      return;
    }
    if(mode==='signup'){
      const { data } = await supabaseClient.auth.getSession();
      if(!data.session){
        errEl.textContent = 'Account created — check your email to confirm, then sign in.';
        errEl.classList.add('show');
        btn.disabled = false; btn.textContent = 'Create Account';
      }
    }
  };
  document.getElementById('authSubmitBtn').onclick = submit;
  root.querySelector('#authPassword').addEventListener('keydown', e=>{ if(e.key==='Enter') submit(); });
  const toggle = root.querySelector('#toSignUp') || root.querySelector('#toSignIn');
  if(toggle) toggle.onclick = e=>{ e.preventDefault(); renderAuthScreen(mode==='signup'?'signin':'signup'); };
}

async function showApp(){
  document.getElementById('authRoot').innerHTML = '';
  document.getElementById('app').style.display = '';
  document.getElementById('whoami').textContent = 'Signed in as ' + currentUserEmail();
  const ok = await loadAllData();
  subscribeRealtime();
  if(ok) navigate();
}

document.getElementById('signOutBtn').onclick = async ()=>{
  await supabaseClient.auth.signOut();
};

supabaseClient.auth.onAuthStateChange((_event, session)=>{
  if(session && session.user){
    currentUser = session.user;
    showApp();
  } else {
    currentUser = null;
    renderAuthScreen('signin');
  }
});

supabaseClient.auth.getSession().then(({data})=>{
  if(data.session && data.session.user){
    currentUser = data.session.user;
    showApp();
  } else {
    renderAuthScreen('signin');
  }
});
