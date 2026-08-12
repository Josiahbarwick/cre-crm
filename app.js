/* ---------- Supabase client ---------- */
const SUPABASE_URL = 'https://akfdtbfbjzwlginrwrad.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrZmR0YmZianp3bGdpbnJ3cmFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0Njc0NzUsImV4cCI6MjEwMjA0MzQ3NX0.Sr6UDUjxjHRd1kRejHwQSzsB6Ci9rPsBzaZosi3J-G0';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let currentUser = null;
function currentUserEmail(){ return (currentUser && currentUser.email) || ''; }
function currentUserId(){ return currentUser && currentUser.id; }

let state = { contacts:[], deals:[], calls:[], activities:[], listings:[], listingInterests:[], todos:[], goals:[], marketComps:[], meetings:[] };

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
    clientContactId:r.client_contact_id||null, brokerEmails:r.broker_emails||[],
    notes:r.notes||'', ownerEmail:r.owner_email||'', createdAt:r.created_at, updatedAt:r.updated_at };
}
function listingToRow(l){
  return { address:l.address, listing_type:l.listingType||'Lease', property_type:l.propertyType||null,
    status:l.status||'Active', price:l.price||0, square_feet:l.squareFeet||0, price_per_sf:l.pricePerSf||0,
    commission_pct:l.commissionPct||0, expiration_date:l.expirationDate||null, owner_contact_id:l.ownerContactId||null,
    client_contact_id:l.clientContactId||null, broker_emails:l.brokerEmails||[],
    notes:l.notes||null, owner_email:l.ownerEmail||null };
}
function listingInterestFromRow(r){
  return { id:r.id, listingId:r.listing_id, contactId:r.contact_id, notes:r.notes||'', createdAt:r.created_at };
}
function todoFromRow(r){
  return { id:r.id, userId:r.user_id, title:r.title, dueDate:r.due_date||'', done:!!r.done, createdAt:r.created_at };
}
function goalFromRow(r){
  return { id:r.id, label:r.label, metric:r.metric||'Custom', period:r.period||'Weekly', target:r.target||0,
    manualProgress:r.manual_progress||0, ownerEmail:r.owner_email||'', createdAt:r.created_at };
}
function goalToRow(g){
  return { label:g.label, metric:g.metric||'Custom', period:g.period||'Weekly', target:Number(g.target)||0,
    manual_progress:Number(g.manualProgress)||0, owner_email:g.ownerEmail||null };
}
function marketCompFromRow(r){
  return { id:r.id, address:r.address, submarket:r.submarket||'', propertyType:r.property_type||'',
    transactionType:r.transaction_type||'Sale', price:r.price||0, squareFeet:r.square_feet||0,
    pricePerSf:r.price_per_sf||0, capRate:r.cap_rate||'', transactionDate:r.transaction_date||'',
    source:r.source||'', notes:r.notes||'', ownerEmail:r.owner_email||'', createdAt:r.created_at };
}
function marketCompToRow(c){
  return { address:c.address, submarket:c.submarket||null, property_type:c.propertyType||null,
    transaction_type:c.transactionType||'Sale', price:c.price||0, square_feet:c.squareFeet||0,
    price_per_sf:c.pricePerSf||0, cap_rate:c.capRate===''?null:Number(c.capRate), transaction_date:c.transactionDate||null,
    source:c.source||null, notes:c.notes||null, owner_email:c.ownerEmail||null };
}
function meetingFromRow(r){
  return { id:r.id, title:r.title, meetingDate:r.meeting_date||'', meetingTime:r.meeting_time||'',
    notes:r.notes||'', ownerEmail:r.owner_email||'', createdAt:r.created_at };
}
function meetingToRow(m){
  return { title:m.title, meeting_date:m.meetingDate||null, meeting_time:m.meetingTime||null,
    notes:m.notes||null, owner_email:m.ownerEmail||null };
}
function dealFromRow(r){
  return { id:r.id, title:r.title, propertyAddress:r.property_address||'', value:r.value||0,
    commissionPct:r.commission_pct||0, stage:r.stage, closeDate:r.close_date||'', contactId:r.contact_id||null,
    coBrokePct:r.co_broke_pct||0, coBrokeName:r.co_broke_name||'', agentSplitPct:r.agent_split_pct==null?100:r.agent_split_pct,
    notes:r.notes||'', ownerEmail:r.owner_email||'', createdAt:r.created_at, updatedAt:r.updated_at };
}
function dealToRow(d){
  return { title:d.title, property_address:d.propertyAddress||null, value:d.value||0, commission_pct:d.commissionPct||0,
    stage:d.stage, close_date:d.closeDate||null, contact_id:d.contactId||null, notes:d.notes||null,
    co_broke_pct:Number(d.coBrokePct)||0, co_broke_name:d.coBrokeName||null, agent_split_pct:d.agentSplitPct==null||d.agentSplitPct===''?100:Number(d.agentSplitPct),
    owner_email:d.ownerEmail||null };
}
function computeCommissionBreakdown(deal){
  const value = Number(deal.value)||0;
  const commissionPct = Number(deal.commissionPct)||0;
  const coBrokePct = Number(deal.coBrokePct)||0;
  const agentSplitPct = deal.agentSplitPct==null||deal.agentSplitPct===''? 100 : Number(deal.agentSplitPct);
  const totalCommission = value * commissionPct/100;
  const coBrokeAmount = totalCommission * coBrokePct/100;
  const ourFirmAmount = totalCommission - coBrokeAmount;
  const agentAmount = ourFirmAmount * agentSplitPct/100;
  const houseAmount = ourFirmAmount - agentAmount;
  return { value, commissionPct, coBrokePct, agentSplitPct, totalCommission, coBrokeAmount, ourFirmAmount, agentAmount, houseAmount };
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
const GOAL_METRICS = ['Calls Logged','New Listings','Deals Closed','Commission Earned','Custom'];
const GOAL_PERIODS = ['Daily','Weekly','Monthly'];
const COMP_TRANSACTION_TYPES = ['Sale','Lease'];
const PLANET_COLORS = ['#5b8def','#e2703a','#3aa655','#c74fc0','#e0b23a','#4fc3c7','#e05a6e','#8a6fe0'];

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
function knownStaffEmails(){
  const set = new Set();
  state.contacts.forEach(c=>c.ownerEmail && set.add(c.ownerEmail));
  state.deals.forEach(d=>d.ownerEmail && set.add(d.ownerEmail));
  state.listings.forEach(l=>l.ownerEmail && set.add(l.ownerEmail));
  state.calls.forEach(c=>c.loggedBy && set.add(c.loggedBy));
  if(currentUserEmail()) set.add(currentUserEmail());
  return [...set].sort();
}
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
function daysUntil(d){
  if(!d) return null;
  const target = new Date(d); target.setHours(0,0,0,0);
  const now = new Date(); now.setHours(0,0,0,0);
  return Math.round((target - now) / 86400000);
}
function periodRange(period){
  const now = new Date();
  if(period==='Daily'){
    const start = new Date(now); start.setHours(0,0,0,0);
    const end = new Date(now); end.setHours(23,59,59,999);
    return { start, end };
  }
  if(period==='Weekly'){
    const start = new Date(now);
    const day = start.getDay();
    const diff = (day===0 ? -6 : 1) - day;
    start.setDate(start.getDate()+diff); start.setHours(0,0,0,0);
    const end = new Date(start); end.setDate(end.getDate()+6); end.setHours(23,59,59,999);
    return { start, end };
  }
  if(period==='Monthly'){
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth()+1, 0, 23,59,59,999);
    return { start, end };
  }
  return { start:new Date(0), end:new Date(8640000000000000) };
}
function computeGoalProgress(goal){
  if(goal.metric==='Custom') return Number(goal.manualProgress)||0;
  const { start, end } = periodRange(goal.period);
  const inRange = (d) => { const t = new Date(d).getTime(); return t>=start.getTime() && t<=end.getTime(); };
  if(goal.metric==='Calls Logged'){
    return state.calls.filter(c => c.loggedBy===goal.ownerEmail && inRange(c.timestamp)).length;
  }
  if(goal.metric==='New Listings'){
    return state.listings.filter(l => l.ownerEmail===goal.ownerEmail && inRange(l.createdAt)).length;
  }
  if(goal.metric==='Deals Closed'){
    return state.deals.filter(d => d.ownerEmail===goal.ownerEmail && d.stage==='Closed Won' && inRange(d.updatedAt)).length;
  }
  if(goal.metric==='Commission Earned'){
    return state.deals.filter(d => d.ownerEmail===goal.ownerEmail && d.stage==='Closed Won' && inRange(d.updatedAt))
      .reduce((s,d)=> s + dealCommission(d), 0);
  }
  return 0;
}
function dealCommission(d){ return (Number(d.value)||0) * ((Number(d.commissionPct)||0)/100); }
function niceMax(n){
  if(n<=0) return 10;
  const mag = Math.pow(10, Math.floor(Math.log10(n)));
  const norm = n / mag;
  const step = norm<=1?1:norm<=2?2:norm<=5?5:10;
  return step * mag;
}
function computeEarningsSeries(goal){
  const { start, end } = periodRange(goal.period);
  const cappedEnd = new Date(Math.min(end.getTime(), Date.now()));
  const dayMs = 86400000;
  const deals = state.deals.filter(d=>d.ownerEmail===goal.ownerEmail && d.stage==='Closed Won')
    .map(d=>({ date: new Date(d.updatedAt), amount: dealCommission(d) }))
    .filter(d=> d.date.getTime()>=start.getTime() && d.date.getTime()<=cappedEnd.getTime())
    .sort((a,b)=>a.date-b.date);
  const totalDays = Math.max(1, Math.round((cappedEnd-start)/dayMs));
  const points = [];
  let cumulative = 0, dealIdx = 0;
  for(let i=0;i<=totalDays;i++){
    const dayStart = new Date(start.getTime() + i*dayMs);
    const dayEnd = new Date(dayStart.getTime() + dayMs - 1);
    while(dealIdx < deals.length && deals[dealIdx].date.getTime()<=dayEnd.getTime()){
      cumulative += deals[dealIdx].amount;
      dealIdx++;
    }
    points.push({ date: dayStart, value: cumulative });
  }
  return points;
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

/* ---------- Show Math (transparency) ---------- */
function showMathModal(title, steps, note){
  const html = `
    <div class="modal-overlay">
      <div class="modal">
        <div class="modal-head"><h3>🧮 ${esc(title)}</h3><button class="modal-close">&times;</button></div>
        <div class="modal-body">
          <div class="math-steps">
            ${steps.map(s=>`
              <div class="math-step">
                <div class="math-label">${esc(s.label)}</div>
                <div class="math-formula">${esc(s.formula)}</div>
                ${s.result!=null? `<div class="math-result">${esc(s.result)}</div>`:''}
              </div>`).join('')}
          </div>
          ${note? `<p class="cell-sub" style="margin-top:14px;">${esc(note)}</p>`:''}
        </div>
        <div class="modal-foot"><button class="btn outline" id="cancelBtn">Close</button></div>
      </div>
    </div>`;
  const root = document.getElementById('modalRoot');
  root.innerHTML = html;
  const close = ()=>root.innerHTML='';
  root.querySelector('.modal-close').onclick = close;
  root.querySelector('#cancelBtn').onclick = close;
  root.querySelector('.modal-overlay').addEventListener('click', e=>{ if(e.target.classList.contains('modal-overlay')) close(); });
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

  const [todosRes, goalsRes] = await Promise.all([
    supabaseClient.from('todos').select('*').order('due_date',{ascending:true, nullsFirst:false}),
    supabaseClient.from('goals').select('*').order('created_at',{ascending:false}),
  ]);
  todosGoalsSchemaReady = !todosRes.error && !goalsRes.error;
  state.todos = todosGoalsSchemaReady ? (todosRes.data||[]).map(todoFromRow) : [];
  state.goals = todosGoalsSchemaReady ? (goalsRes.data||[]).map(goalFromRow) : [];

  const compsRes = await supabaseClient.from('market_comps').select('*').order('transaction_date',{ascending:false, nullsFirst:false});
  marketCompsSchemaReady = !compsRes.error;
  state.marketComps = marketCompsSchemaReady ? (compsRes.data||[]).map(marketCompFromRow) : [];

  const meetingsRes = await supabaseClient.from('meetings').select('*').order('meeting_date',{ascending:true});
  meetingsSchemaReady = !meetingsRes.error;
  state.meetings = meetingsSchemaReady ? (meetingsRes.data||[]).map(meetingFromRow) : [];
  return true;
}
let todosGoalsSchemaReady = true;
let marketCompsSchemaReady = true;
let listingsSchemaReady = true;
let meetingsSchemaReady = true;

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
    .on('postgres_changes', { event:'*', schema:'public', table:'todos' }, onRemoteChange)
    .on('postgres_changes', { event:'*', schema:'public', table:'goals' }, onRemoteChange)
    .on('postgres_changes', { event:'*', schema:'public', table:'market_comps' }, onRemoteChange)
    .on('postgres_changes', { event:'*', schema:'public', table:'meetings' }, onRemoteChange)
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
function rowsToContacts(rows){
  if(!rows.length) return [];
  const headers = rows[0].map(h=>normalizeHeader(String(h==null?'':h)));
  const idx = {};
  headers.forEach((h,i)=>{ if(CSV_HEADER_MAP[h] && !(CSV_HEADER_MAP[h] in idx)) idx[CSV_HEADER_MAP[h]] = i; });
  const out = [];
  for(let r=1;r<rows.length;r++){
    const row = rows[r];
    if(!row) continue;
    const get = key => idx[key]!=null && row[idx[key]]!=null ? String(row[idx[key]]).trim() : '';
    const name = get('name') || String(row[0]==null?'':row[0]).trim();
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
function csvToContacts(text){
  return rowsToContacts(parseCSV(text));
}
function xlsxToContacts(arrayBuffer){
  const wb = XLSX.read(arrayBuffer, { type:'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header:1, raw:false, defval:'' });
  return rowsToContacts(rows);
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
const routes = { dashboard: renderDashboard, prospects: renderProspects, coldcall: renderColdCall, deals: renderDeals, commissions: renderCommissions, listings: renderListings, goals: renderGoals, news: renderNews, individuals: renderIndividuals, activity: renderActivity };
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
function todoItemHtml(item){
  const dLeft = item.dueDate ? daysUntil(item.dueDate) : null;
  const overdue = dLeft!==null && dLeft<0;
  const dueLabel = item.dueDate ? (dLeft===0?'Today':overdue?`${Math.abs(dLeft)}d overdue`:fmtDate(item.dueDate)) : '';
  if(item.kind==='todo'){
    return `<div class="todo-row" data-kind="todo" data-id="${item.id}">
      <input type="checkbox" class="todo-check">
      <span class="todo-label">${esc(item.label)}</span>
      ${dueLabel? `<span class="todo-due ${overdue?'overdue':''}">${esc(dueLabel)}</span>`:''}
      <button class="icon-btn todo-del" title="Delete"><svg viewBox="0 0 24 24"><path d="M6 7h12l-1 14H7L6 7zm3-3h6l1 2H8l1-2z"/></svg></button>
    </div>`;
  }
  const icon = item.kind==='callback' ? '📞' : '🏢';
  return `<div class="todo-row" data-kind="${item.kind}" data-id="${item.id}">
    <span class="todo-icon">${icon}</span>
    <span class="todo-label">${esc(item.label)}</span>
    <span class="todo-due ${overdue?'overdue':''}">${esc(dueLabel)}</span>
  </div>`;
}

function formatTime(t){
  if(!t) return '';
  const [h,m] = t.split(':').map(Number);
  if(isNaN(h)) return '';
  const period = h>=12 ? 'PM' : 'AM';
  const h12 = h%12===0 ? 12 : h%12;
  return `${h12}:${String(m||0).padStart(2,'0')} ${period}`;
}
function meetingRowHtml(m){
  const timeLabel = formatTime(m.meetingTime);
  return `<div class="row-item" data-id="${m.id}">
    <div class="avatar">${esc(initials(m.title))}</div>
    <div class="row-main">
      <div class="row-title">${esc(m.title)}</div>
      <div class="row-sub">${fmtDate(m.meetingDate)}${timeLabel? ' · '+esc(timeLabel):''}${m.notes? ' — '+esc(m.notes):''}</div>
    </div>
    <span class="owner-tag"><span class="owner-dot">${esc(initials(ownerLabel(m.ownerEmail)))}</span>${esc(ownerLabel(m.ownerEmail))}</span>
    <button class="icon-btn meetingDelBtn" title="Delete" style="margin-left:8px;"><svg viewBox="0 0 24 24"><path d="M6 7h12l-1 14H7L6 7zm3-3h6l1 2H8l1-2z"/></svg></button>
  </div>`;
}

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

  const myTodos = state.todos.filter(t=>!t.done);
  const myCallbacks = state.contacts.filter(c=>c.ownerEmail===currentUserEmail() && c.nextFollowUp && daysUntil(c.nextFollowUp)<=3);
  const myExpiring = state.listings.filter(l=>(l.ownerEmail===currentUserEmail()||(l.brokerEmails||[]).includes(currentUserEmail())) && l.expirationDate && daysUntil(l.expirationDate)<=14);
  const todoItems = [
    ...myTodos.map(t=>({ kind:'todo', id:t.id, label:t.title, dueDate:t.dueDate, sortDate:t.dueDate||'9999-99-99' })),
    ...myCallbacks.map(c=>({ kind:'callback', id:c.id, label:`Call back: ${c.name}`, dueDate:c.nextFollowUp, sortDate:c.nextFollowUp })),
    ...myExpiring.map(l=>({ kind:'listing', id:l.id, label:`Listing expiring: ${l.address}`, dueDate:l.expirationDate, sortDate:l.expirationDate })),
  ].sort((a,b)=> (a.sortDate||'9999').localeCompare(b.sortDate||'9999'));

  const weekRange = periodRange('Weekly');
  const weekMeetings = state.meetings.filter(m=>{
    if(!m.meetingDate) return false;
    const t = new Date(m.meetingDate+'T00:00:00').getTime();
    return t>=weekRange.start.getTime() && t<=weekRange.end.getTime();
  }).sort((a,b)=> `${a.meetingDate} ${a.meetingTime||''}`.localeCompare(`${b.meetingDate} ${b.meetingTime||''}`));

  view.innerHTML = `
    <div class="page-head">
      <div><h1>Dashboard</h1><p>Your team's book of business at a glance</p></div>
      <a href="#coldcall" class="btn gold">Start Cold Calling</a>
    </div>
    <div class="panel" style="margin-bottom:20px;">
      <div class="panel-head"><h3>My To-Do</h3><span class="cell-sub">${myTodos.length} task${myTodos.length===1?'':'s'} · ${todoItems.length-myTodos.length} reminder${(todoItems.length-myTodos.length)===1?'':'s'}</span></div>
      <div class="panel-body">
        ${!todosGoalsSchemaReady ? `<div class="empty">Run <code>schema_v5.sql</code> to enable your personal to-do list.</div>` : `
        <div id="myTodoList" class="todo-list">
          ${todoItems.length? todoItems.map(todoItemHtml).join('') : '<div class="empty">Nothing on your list — add something below.</div>'}
        </div>
        <div class="todo-add-row">
          <input type="text" id="newTodoText" placeholder="Add a to-do…">
          <input type="date" id="newTodoDate" title="Optional due date">
          <button class="btn gold sm" id="addTodoBtn">Add</button>
        </div>`}
      </div>
    </div>
    <div class="panel" style="margin-bottom:20px;">
      <div class="panel-head"><h3>This Week's Meetings</h3><span class="cell-sub">Keep each other accountable</span></div>
      <div class="panel-body">
        ${!meetingsSchemaReady ? `<div class="empty">Run <code>schema_v7.sql</code> to enable meetings.</div>` : `
        <div id="meetingsList" class="row-list">
          ${weekMeetings.length? weekMeetings.map(meetingRowHtml).join('') : '<div class="empty">No meetings on the calendar this week.</div>'}
        </div>
        <div class="todo-add-row">
          <input type="text" id="newMeetingTitle" placeholder="Meeting title…">
          <input type="date" id="newMeetingDate">
          <input type="time" id="newMeetingTime">
          <button class="btn gold sm" id="addMeetingBtn">Add</button>
        </div>`}
      </div>
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

  if(todosGoalsSchemaReady){
    document.querySelectorAll('#myTodoList .todo-row').forEach(row=>{
      const kind = row.dataset.kind, id = row.dataset.id;
      if(kind==='todo'){
        row.querySelector('.todo-check').onchange = async ()=>{
          const { error } = await supabaseClient.from('todos').update({ done:true }).eq('id', id);
          if(error){ toast('Failed: '+error.message); return; }
          await loadAllData(); renderDashboard();
        };
        row.querySelector('.todo-del').onclick = async ()=>{
          const { error } = await supabaseClient.from('todos').delete().eq('id', id);
          if(error){ toast('Failed: '+error.message); return; }
          await loadAllData(); renderDashboard();
        };
      } else if(kind==='callback'){
        row.onclick = ()=>{ coldCallActiveId = id; location.hash = '#coldcall'; };
      } else if(kind==='listing'){
        row.onclick = ()=>openListingModal(listingById(id));
      }
    });
    document.getElementById('addTodoBtn').onclick = async ()=>{
      const textEl = document.getElementById('newTodoText');
      const title = textEl.value.trim();
      if(!title) return;
      const dueDate = document.getElementById('newTodoDate').value || null;
      const btn = document.getElementById('addTodoBtn');
      btn.disabled = true;
      const { error } = await supabaseClient.from('todos').insert({ user_id: currentUserId(), title, due_date: dueDate });
      if(error){ toast('Failed to add: '+error.message); btn.disabled=false; return; }
      await loadAllData();
      renderDashboard();
    };
    document.getElementById('newTodoText').addEventListener('keydown', e=>{
      if(e.key==='Enter') document.getElementById('addTodoBtn').click();
    });
  }

  if(meetingsSchemaReady){
    document.querySelectorAll('#meetingsList .row-item').forEach(row=>{
      const id = row.dataset.id;
      row.querySelector('.meetingDelBtn').onclick = async ()=>{
        const { error } = await supabaseClient.from('meetings').delete().eq('id', id);
        if(error){ toast('Failed: '+error.message); return; }
        await loadAllData();
        toast('Meeting removed');
        renderDashboard();
      };
    });
    document.getElementById('addMeetingBtn').onclick = async ()=>{
      const titleEl = document.getElementById('newMeetingTitle');
      const title = titleEl.value.trim();
      const meetingDate = document.getElementById('newMeetingDate').value;
      if(!title || !meetingDate){ toast('Enter a title and date'); return; }
      const meetingTime = document.getElementById('newMeetingTime').value || null;
      const btn = document.getElementById('addMeetingBtn');
      btn.disabled = true;
      const { error } = await supabaseClient.from('meetings').insert(
        meetingToRow({ title, meetingDate, meetingTime, ownerEmail: currentUserEmail() })
      );
      if(error){ toast('Failed to add: '+error.message); btn.disabled=false; return; }
      await loadAllData();
      renderDashboard();
    };
    document.getElementById('newMeetingTitle').addEventListener('keydown', e=>{
      if(e.key==='Enter') document.getElementById('addMeetingBtn').click();
    });
  }
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
        <input type="file" id="csvImportInput" accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" hidden>
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
    const isExcel = /\.xlsx?$/i.test(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      try{
        const contacts = isExcel ? xlsxToContacts(reader.result) : csvToContacts(reader.result);
        openCsvImportModal(contacts);
      }catch(err){ toast("Couldn't read that file: " + err.message); }
    };
    if(isExcel) reader.readAsArrayBuffer(file); else reader.readAsText(file);
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
      <td class="cell-name cell-name-link" style="cursor:pointer;">${esc(c.name)}</td>
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
  tr.querySelector('.cell-name-link').onclick = ()=>openContactViewModal(contactById(id));
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
    if(q && !(`${c.name} ${c.company} ${c.email} ${c.address}`.toLowerCase().includes(q))) return false;
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

function openContactViewModal(contact){
  if(!contact) return;
  const html = `
    <div class="modal-overlay">
      <div class="modal">
        <div class="modal-head"><h3>${esc(contact.name)}</h3><button class="modal-close">&times;</button></div>
        <div class="modal-body">
          <div class="owner-tag" style="margin-bottom:16px;"><span class="owner-dot">${esc(initials(ownerLabel(contact.ownerEmail)))}</span>Owned by ${esc(ownerLabel(contact.ownerEmail))} · added ${fmtDate(contact.createdAt)}</div>
          <div class="view-detail-grid">
            <div><div class="ik">Company</div><div class="iv">${esc(contact.company||'—')}</div></div>
            <div><div class="ik">Phone</div><div class="iv">${esc(contact.phone||'—')}</div></div>
            <div><div class="ik">Email</div><div class="iv">${esc(contact.email||'—')}</div></div>
            <div><div class="ik">Status</div><div class="iv"><span class="badge ${contact.status.toLowerCase()}">${esc(contact.status)}</span></div></div>
            <div><div class="ik">Property Type</div><div class="iv">${esc(contact.propertyType||'—')}</div></div>
            <div><div class="ik">Looking to</div><div class="iv">${txnBadge(contact.transactionType)}</div></div>
            <div><div class="ik">Source</div><div class="iv">${esc(contact.source||'—')}</div></div>
            <div><div class="ik">Next Follow-up</div><div class="iv">${contact.nextFollowUp? fmtDate(contact.nextFollowUp):'—'}</div></div>
            <div><div class="ik">Last Contacted</div><div class="iv">${contact.lastContactedAt? fmtDate(contact.lastContactedAt):'Never'}</div></div>
          </div>
          <div class="field-label">Property Address</div>
          <div style="font-size:13.5px;margin-bottom:16px;">${esc(contact.address||'—')}</div>
          <div class="field-label">Notes</div>
          <div style="background:var(--bg);border-radius:9px;padding:10px 12px;font-size:13px;min-height:20px;">${contact.notes? esc(contact.notes) : '<span class="cell-sub">No notes yet.</span>'}</div>
        </div>
        <div class="modal-foot">
          <button class="btn outline" id="viewCallBtn">Call</button>
          <button class="btn outline" id="viewEmailBtn">Email</button>
          <button class="btn outline" id="viewEditBtn">Edit</button>
          <button class="btn gold" id="cancelBtn">Close</button>
        </div>
      </div>
    </div>`;
  const root = document.getElementById('modalRoot');
  root.innerHTML = html;
  const close = ()=>root.innerHTML='';
  root.querySelector('.modal-close').onclick = close;
  root.querySelector('#cancelBtn').onclick = close;
  root.querySelector('.modal-overlay').addEventListener('click', e=>{ if(e.target.classList.contains('modal-overlay')) close(); });
  root.querySelector('#viewCallBtn').onclick = ()=>{ close(); coldCallActiveId = contact.id; location.hash = '#coldcall'; };
  root.querySelector('#viewEmailBtn').onclick = ()=>{ close(); openEmailComposer(contact); };
  root.querySelector('#viewEditBtn').onclick = ()=>{ close(); openContactModal(contact); };
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
function myCallGoals(){
  return state.goals.filter(g=>g.ownerEmail===currentUserEmail() && g.metric==='Calls Logged' && (g.period==='Daily'||g.period==='Weekly'));
}
function callGoalWidgetHtml(){
  if(!todosGoalsSchemaReady) return '';
  const goals = myCallGoals();
  if(!goals.length){
    return `<div class="panel" style="margin-bottom:16px;">
      <div class="panel-body" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
        <div class="cell-sub">Set a daily or weekly call goal to track your progress here.</div>
        <div style="display:flex;gap:8px;align-items:center;">
          <input type="number" id="quickCallGoal" placeholder="e.g. 20" style="width:90px;">
          <select id="quickCallPeriod"><option>Daily</option><option>Weekly</option></select>
          <button class="btn outline sm" id="quickCallGoalBtn">Set Goal</button>
        </div>
      </div>
    </div>`;
  }
  return `<div class="stat-grid" style="margin-bottom:16px;">${goals.map(goalCardHtml).join('')}</div>`;
}

function renderColdCall(){
  const view = document.getElementById('view');
  view.className = 'view';
  const q = currentSearch.toLowerCase();
  let queue = state.contacts.filter(c=>c.status!=='Client' && c.status!=='Dead');
  if(q) queue = queue.filter(c=>`${c.name} ${c.company} ${c.address}`.toLowerCase().includes(q));
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
    ${callGoalWidgetHtml()}
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
  if(todosGoalsSchemaReady){
    if(myCallGoals().length){
      wireGoalCards(renderColdCall);
    } else {
      const quickBtn = document.getElementById('quickCallGoalBtn');
      if(quickBtn) quickBtn.onclick = async ()=>{
        const target = Number(document.getElementById('quickCallGoal').value)||0;
        if(!target){ toast('Enter a target number first'); return; }
        const period = document.getElementById('quickCallPeriod').value;
        const { error } = await supabaseClient.from('goals').insert(goalToRow({
          label: `${period} Call Goal`, metric:'Calls Logged', period, target, manualProgress:0, ownerEmail: currentUserEmail(),
        }));
        if(error){ toast('Failed: '+error.message); return; }
        await loadAllData();
        toast('Goal set');
        renderColdCall();
      };
    }
  }
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
        if(newStage==='Closed Won') celebrateDealWon();
      }
      renderDeals();
    });
  });
}

let dealModalTab = 'details';
function openDealModal(deal, defaultStage){
  const isEdit = !!deal;
  const d = deal || { title:'', propertyAddress:'', value:'', commissionPct:3, stage: defaultStage||STAGES[0], closeDate:'', contactId:'', notes:'', coBrokePct:0, coBrokeName:'', agentSplitPct:100 };
  dealModalTab = 'details';
  const fs = {
    title:d.title||'', propertyAddress:d.propertyAddress||'', value:d.value||'', commissionPct:d.commissionPct||'',
    stage:d.stage||STAGES[0], closeDate:d.closeDate||'', contactId:d.contactId||'', notes:d.notes||'',
    coBrokePct:d.coBrokePct||0, coBrokeName:d.coBrokeName||'', agentSplitPct: d.agentSplitPct==null?100:d.agentSplitPct,
  };
  const contactOptions = () => state.contacts.map(c=>`<option value="${c.id}" ${c.id===fs.contactId?'selected':''}>${esc(c.name)}</option>`).join('');

  function detailsTabHtml(){
    return `
      <div class="form-grid">
        <label class="full">Deal title<input type="text" id="d_title" value="${esc(fs.title)}" placeholder="123 Main St — Office Sale"></label>
        <label class="full">Property address<input type="text" id="d_address" value="${esc(fs.propertyAddress)}" placeholder="123 Main St, City"></label>
        <label>Deal value<input type="number" id="d_value" value="${fs.value}" placeholder="1500000"></label>
        <label>Commission %<input type="number" step="0.1" id="d_comm" value="${fs.commissionPct}" placeholder="3"></label>
        <label>Stage<select id="d_stage">${STAGES.map(s=>`<option ${s===fs.stage?'selected':''}>${s}</option>`).join('')}</select></label>
        <label>Expected close date<input type="date" id="d_close" value="${fs.closeDate}"></label>
        <label class="full">Linked contact<select id="d_contact"><option value="">— None —</option>${contactOptions()}</select></label>
        <label class="full">Notes<textarea id="d_notes" placeholder="Deal terms, contingencies…">${esc(fs.notes)}</textarea></label>
      </div>
    `;
  }

  function previewHtml(){
    const b = computeCommissionBreakdown(fs);
    return `
      <div class="commission-summary" id="splitPreview">
        <div><div class="ik">Total Commission</div><div class="iv">${fullMoney(b.totalCommission)}</div></div>
        <div><div class="ik">Co-Broke</div><div class="iv">${fullMoney(b.coBrokeAmount)}</div></div>
        <div><div class="ik">Our Firm</div><div class="iv">${fullMoney(b.ourFirmAmount)}</div></div>
        <div><div class="ik">Agent</div><div class="iv">${fullMoney(b.agentAmount)}</div></div>
        <div><div class="ik">House</div><div class="iv">${fullMoney(b.houseAmount)}</div></div>
      </div>
    `;
  }
  function refreshPreview(root){
    const el = root.querySelector('#splitPreview');
    if(el) el.outerHTML = previewHtml();
  }

  function coBrokeTabHtml(){
    return `
      <p class="hint" style="color:var(--text-dim);font-size:12.5px;margin-top:0;">What share of the total commission goes to an outside co-operating broker/brokerage, if any.</p>
      <div class="form-grid">
        <label class="full">Co-Broke firm / agent name<input type="text" id="d_cobroke_name" value="${esc(fs.coBrokeName)}" placeholder="e.g. Cushman &amp; Wakefield / Jane Doe"></label>
        <label class="full">Co-Broke % of total commission<input type="number" step="1" min="0" max="100" id="d_cobroke_pct" value="${fs.coBrokePct}" placeholder="0"></label>
      </div>
      <div class="split-preset-row">
        ${[0,25,50,100].map(p=>`<button type="button" class="split-preset-btn" data-cobroke="${p}">${p}%</button>`).join('')}
      </div>
      ${previewHtml()}
    `;
  }

  function houseSplitTabHtml(){
    return `
      <p class="hint" style="color:var(--text-dim);font-size:12.5px;margin-top:0;">Of our firm's share (after any co-broke split), what percent does the agent keep vs. the house?</p>
      <div class="form-grid">
        <label class="full">Agent % of our firm's share<input type="number" step="1" min="0" max="100" id="d_agent_pct" value="${fs.agentSplitPct}" placeholder="70"></label>
      </div>
      <div class="split-preset-row">
        ${[[100,'100 / 0'],[80,'80 / 20'],[70,'70 / 30'],[60,'60 / 40'],[50,'50 / 50']].map(([p,label])=>`<button type="button" class="split-preset-btn" data-agent="${p}">${label}</button>`).join('')}
      </div>
      ${previewHtml()}
    `;
  }

  function renderModalBody(root){
    const body = root.querySelector('#dealModalBody');
    body.innerHTML = dealModalTab==='details' ? detailsTabHtml() : dealModalTab==='cobroke' ? coBrokeTabHtml() : houseSplitTabHtml();
    if(dealModalTab==='details'){
      const bind = (id, key) => {
        const el = root.querySelector('#'+id);
        el.addEventListener('input', ()=>{ fs[key] = el.value; });
        el.addEventListener('change', ()=>{ fs[key] = el.value; });
      };
      bind('d_title','title'); bind('d_address','propertyAddress'); bind('d_value','value');
      bind('d_comm','commissionPct'); bind('d_stage','stage'); bind('d_close','closeDate');
      bind('d_contact','contactId'); bind('d_notes','notes');
    } else if(dealModalTab==='cobroke'){
      root.querySelector('#d_cobroke_name').addEventListener('input', e=>{ fs.coBrokeName = e.target.value; });
      root.querySelector('#d_cobroke_pct').addEventListener('input', e=>{ fs.coBrokePct = e.target.value; refreshPreview(root); });
      root.querySelectorAll('[data-cobroke]').forEach(btn=>{
        btn.onclick = ()=>{
          fs.coBrokePct = Number(btn.dataset.cobroke);
          root.querySelector('#d_cobroke_pct').value = fs.coBrokePct;
          refreshPreview(root);
        };
      });
    } else {
      root.querySelector('#d_agent_pct').addEventListener('input', e=>{ fs.agentSplitPct = e.target.value; refreshPreview(root); });
      root.querySelectorAll('[data-agent]').forEach(btn=>{
        btn.onclick = ()=>{
          fs.agentSplitPct = Number(btn.dataset.agent);
          root.querySelector('#d_agent_pct').value = fs.agentSplitPct;
          refreshPreview(root);
        };
      });
    }
  }

  const tabs = [['details','Details'],['cobroke','Co-Broke'],['housesplit','House Split']];
  const html = `
    <div class="modal-overlay">
      <div class="modal">
        <div class="modal-head"><h3>${isEdit?'Edit Deal':'Add Deal'}</h3><button class="modal-close">&times;</button></div>
        <div class="modal-body">
          ${isEdit? `<div class="owner-tag" style="margin-bottom:14px;"><span class="owner-dot">${esc(initials(ownerLabel(d.ownerEmail)))}</span>Owned by ${esc(ownerLabel(d.ownerEmail))} · created ${fmtDate(d.createdAt)}</div>`:''}
          <div class="modal-tabs">${tabs.map(([key,label],i)=>`<button type="button" class="modal-tab ${i===0?'active':''}" data-tab="${key}">${label}</button>`).join('')}</div>
          <div id="dealModalBody"></div>
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
  root.querySelectorAll('.modal-tab').forEach(btn=>{
    btn.onclick = ()=>{
      dealModalTab = btn.dataset.tab;
      root.querySelectorAll('.modal-tab').forEach(b=>b.classList.toggle('active', b===btn));
      renderModalBody(root);
    };
  });
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
  renderModalBody(root);

  root.querySelector('#saveDealBtn').onclick = async ()=>{
    const title = fs.title.trim();
    if(!title){ toast('Deal title is required'); return; }
    const data = {
      title,
      propertyAddress: fs.propertyAddress.trim(),
      value: Number(fs.value)||0,
      commissionPct: Number(fs.commissionPct)||0,
      stage: fs.stage,
      closeDate: fs.closeDate,
      contactId: fs.contactId || null,
      notes: fs.notes.trim(),
      coBrokePct: Number(fs.coBrokePct)||0,
      coBrokeName: fs.coBrokeName.trim(),
      agentSplitPct: fs.agentSplitPct==null||fs.agentSplitPct===''? 100 : Number(fs.agentSplitPct),
    };
    const btn = document.getElementById('saveDealBtn');
    btn.disabled = true;
    const justWon = data.stage==='Closed Won' && (!isEdit || deal.stage!=='Closed Won');
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
    if(justWon) celebrateDealWon();
  };
}

/* ---------- Commissions ---------- */
function showCommissionMath(deal){
  const b = computeCommissionBreakdown(deal);
  const steps = [
    { label:'Deal Value', formula: fullMoney(b.value) },
    { label:'Total Commission', formula:`${fullMoney(b.value)} × ${b.commissionPct}%`, result: fullMoney(b.totalCommission) },
    { label:'Co-Broke'+(deal.coBrokeName?` (${deal.coBrokeName})`:''), formula:`${fullMoney(b.totalCommission)} × ${b.coBrokePct}%`, result: fullMoney(b.coBrokeAmount) },
    { label:"Our Firm's Share", formula:`${fullMoney(b.totalCommission)} − ${fullMoney(b.coBrokeAmount)}`, result: fullMoney(b.ourFirmAmount) },
    { label:'Agent Split', formula:`${fullMoney(b.ourFirmAmount)} × ${b.agentSplitPct}%`, result: fullMoney(b.agentAmount) },
    { label:'House Split', formula:`${fullMoney(b.ourFirmAmount)} − ${fullMoney(b.agentAmount)}`, result: fullMoney(b.houseAmount) },
  ];
  showMathModal(`Commission Math — ${deal.title}`, steps, deal.coBrokePct||deal.agentSplitPct!==100 ? 'Edit these splits from the deal\'s Co-Broke / House Split tabs.' : null);
}

function commissionRowHtml(deal){
  const b = computeCommissionBreakdown(deal);
  const stageCls = deal.stage==='Closed Won' ? 'client' : deal.stage==='Closed Lost' ? 'dead' : 'warm';
  return `
    <tr data-id="${deal.id}">
      <td class="cell-name">${esc(deal.title)}</td>
      <td><span class="badge ${stageCls}">${esc(deal.stage)}</span></td>
      <td>${fullMoney(b.value)}</td>
      <td>${b.commissionPct}%</td>
      <td>${fullMoney(b.totalCommission)}</td>
      <td>${b.coBrokePct? `${b.coBrokePct}% — ${fullMoney(b.coBrokeAmount)}` : '—'}</td>
      <td>${fullMoney(b.ourFirmAmount)}</td>
      <td>${fullMoney(b.agentAmount)}</td>
      <td>${fullMoney(b.houseAmount)}</td>
      <td>
        <div class="actions-cell">
          <button class="icon-btn editSplitsBtn" title="Edit Splits"><svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg></button>
          <button class="btn outline sm showMathBtn">🧮 Show Math</button>
        </div>
      </td>
    </tr>
  `;
}

function renderCommissionsTable(){
  const body = document.getElementById('commissionsBody');
  if(!body) return;
  const stageF = document.getElementById('filterCommStage').value;
  const q = currentSearch.toLowerCase();
  let deals = state.deals.filter(d=>{
    if(stageF && d.stage!==stageF) return false;
    if(q && !(`${d.title} ${d.propertyAddress}`.toLowerCase().includes(q))) return false;
    return true;
  }).sort((a,b)=> new Date(b.createdAt)-new Date(a.createdAt));
  if(!deals.length){ body.innerHTML = `<tr><td colspan="10"><div class="empty">No deals to show.</div></td></tr>`; return; }
  body.innerHTML = deals.map(commissionRowHtml).join('');
  body.querySelectorAll('tr').forEach(tr=>{
    const id = tr.dataset.id;
    const deal = dealById(id);
    tr.querySelector('.editSplitsBtn').onclick = ()=>openDealModal(deal);
    tr.querySelector('.showMathBtn').onclick = ()=>showCommissionMath(deal);
  });
}

function renderCommissions(){
  const view = document.getElementById('view');
  view.className = 'view';
  const totalCommissionAll = state.deals.reduce((s,d)=>s+computeCommissionBreakdown(d).totalCommission,0);
  const agentTotal = state.deals.reduce((s,d)=>s+computeCommissionBreakdown(d).agentAmount,0);
  view.innerHTML = `
    <div class="page-head">
      <div><h1>Commissions</h1><p>${state.deals.length} deals · ${fullMoney(totalCommissionAll)} total commission · ${fullMoney(agentTotal)} to agents</p></div>
    </div>
    <div class="filters-row">
      <select id="filterCommStage"><option value="">All stages</option>${STAGES.map(s=>`<option value="${s}">${s}</option>`).join('')}</select>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Deal</th><th>Stage</th><th>Value</th><th>Comm %</th><th>Total Commission</th><th>Co-Broke</th><th>Our Firm</th><th>Agent</th><th>House</th><th></th></tr></thead>
        <tbody id="commissionsBody"></tbody>
      </table>
    </div>
  `;
  document.getElementById('filterCommStage').onchange = renderCommissionsTable;
  renderCommissionsTable();
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
        <thead><tr><th>Address</th><th>Type</th><th>Property Type</th><th>Price</th><th>SF</th><th>$/SF</th><th>Expires</th><th>Status</th><th>Broker(s)</th><th>Added by</th><th></th></tr></thead>
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

  if(!list.length){ body.innerHTML = `<tr><td colspan="11"><div class="empty">No listings yet. Add your first active listing.</div></td></tr>`; return; }

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
      <td>${(l.brokerEmails&&l.brokerEmails.length)? esc(l.brokerEmails.map(ownerLabel).join(', ')) : '<span class="cell-sub">Unassigned</span>'}</td>
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
  const l = listing || { address:'', listingType:'Lease', propertyType:PROPERTY_TYPES[0], status:'Active', price:'', squareFeet:'', pricePerSf:'', commissionPct:'', expirationDate:'', ownerContactId:prefillOwnerContactId||'', clientContactId:'', notes:'', brokerEmails:[] };
  listingModalTab = 'details';
  const fs = {
    address:l.address||'', listingType:l.listingType||'Lease', propertyType:l.propertyType||PROPERTY_TYPES[0],
    status:l.status||'Active', expirationDate:l.expirationDate||'', price:l.price||'', squareFeet:l.squareFeet||'',
    pricePerSf:l.pricePerSf||'', commissionPct:l.commissionPct||'', ownerContactId:l.ownerContactId||'',
    clientContactId:l.clientContactId||'', notes:l.notes||'', brokerEmails:[...(l.brokerEmails||[])],
  };
  let knownBrokers = knownStaffEmails();
  fs.brokerEmails.forEach(e=>{ if(!knownBrokers.includes(e)) knownBrokers.push(e); });
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

  function brokerTabHtml(){
    return `
      <p class="hint" style="color:var(--text-dim);font-size:12.5px;margin-top:0;">Who's the broker (or co-brokers) on this listing?</p>
      <div id="brokerCheckList" style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px;">
        ${knownBrokers.length? knownBrokers.map(email=>`
          <label style="display:flex;align-items:center;gap:8px;font-weight:500;font-size:13.5px;color:var(--text);">
            <input type="checkbox" class="brokerCheck" value="${esc(email)}" ${fs.brokerEmails.includes(email)?'checked':''}>
            <span class="owner-tag"><span class="owner-dot">${esc(initials(ownerLabel(email)))}</span>${esc(ownerLabel(email))}</span>
          </label>`).join('') : '<div class="empty" style="text-align:left;padding:0;">No known team members yet.</div>'}
      </div>
      <div class="add-linked-row">
        <input type="text" id="addBrokerEmail" placeholder="another.broker@naipfefferle.com">
        <button type="button" class="btn outline sm" id="addBrokerBtn">+ Add</button>
      </div>
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
    body.innerHTML = listingModalTab==='details' ? detailsTabHtml() : listingModalTab==='notes' ? notesTabHtml() : listingModalTab==='broker' ? brokerTabHtml() : clientsTabHtml();
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
    } else if(listingModalTab==='broker'){
      root.querySelectorAll('.brokerCheck').forEach(cb=>{
        cb.addEventListener('change', ()=>{
          if(cb.checked){ if(!fs.brokerEmails.includes(cb.value)) fs.brokerEmails.push(cb.value); }
          else { fs.brokerEmails = fs.brokerEmails.filter(e=>e!==cb.value); }
        });
      });
      root.querySelector('#addBrokerBtn').onclick = ()=>{
        const input = root.querySelector('#addBrokerEmail');
        const email = input.value.trim();
        if(!email) return;
        if(!knownBrokers.includes(email)) knownBrokers.push(email);
        if(!fs.brokerEmails.includes(email)) fs.brokerEmails.push(email);
        renderModalBody(root);
      };
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
    ? [['details','Details'],['notes','Notes'],['broker','Broker'],['clients','Potential Clients']]
    : [['details','Details'],['notes','Notes'],['broker','Broker']];
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
      brokerEmails: fs.brokerEmails,
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

/* ---------- Goals ---------- */
function smoothLinePath(pts){
  if(!pts.length) return '';
  if(pts.length===1) return `M ${pts[0].x} ${pts[0].y} L ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for(let i=0;i<pts.length-1;i++){
    const xc = (pts[i].x+pts[i+1].x)/2;
    const yc = (pts[i].y+pts[i+1].y)/2;
    d += ` Q ${pts[i].x} ${pts[i].y} ${xc} ${yc}`;
  }
  const last = pts[pts.length-1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

const CHART_VW=640, CHART_VH=220, CHART_ML=58, CHART_MR=16, CHART_MT=24, CHART_MB=28;

function moneyGoalChartHtml(goal){
  const points = computeEarningsSeries(goal);
  const target = Number(goal.target)||0;
  const current = points.length ? points[points.length-1].value : 0;
  const maxVal = Math.max(target, ...points.map(p=>p.value), 1);
  const yMax = niceMax(maxVal*1.05);
  const PW = CHART_VW-CHART_ML-CHART_MR, PH = CHART_VH-CHART_MT-CHART_MB;
  const n = points.length;
  const xAt = i => CHART_ML + (n>1 ? (i/(n-1))*PW : PW/2);
  const yAt = v => CHART_MT + PH - (v/yMax)*PH;
  const coords = points.map((p,i)=>({ x:xAt(i), y:yAt(p.value) }));
  const linePath = smoothLinePath(coords);
  const areaPath = coords.length ? `${linePath} L ${coords[coords.length-1].x} ${CHART_MT+PH} L ${coords[0].x} ${CHART_MT+PH} Z` : '';
  const targetY = yAt(Math.min(target, yMax));
  const gradId = 'mgGrad'+goal.id.replace(/[^a-zA-Z0-9]/g,'');
  const gridLines = [0,0.25,0.5,0.75,1].map(f=>{
    const v = yMax*f, y = yAt(v);
    return `<line x1="${CHART_ML}" y1="${y}" x2="${CHART_VW-CHART_MR}" y2="${y}" stroke="var(--slate-100)" stroke-width="1"/>
      <text x="${CHART_ML-8}" y="${y+4}" text-anchor="end" font-size="10" fill="var(--text-dim)">${money(v)}</text>`;
  }).join('');
  const last = coords[coords.length-1];
  const pct = target>0 ? Math.min(100, Math.round(current/target*100)) : 0;
  const dateLabel = d => d.toLocaleDateString('en-US',{month:'short',day:'numeric'});
  return `
    <div class="goal-card money-goal-card" data-id="${goal.id}">
      <div class="gh"><span>${esc(goal.label)}</span><span class="gv">${fullMoney(current)} / ${fullMoney(target)} <span style="${pct>=100?'color:var(--teal);font-weight:800;':''}">(${pct}%)</span></span></div>
      <div class="cell-sub" style="margin-bottom:8px;display:flex;align-items:center;gap:6px;">${esc(goal.metric)} · ${esc(goal.period)} <span class="owner-tag"><span class="owner-dot">${esc(initials(ownerLabel(goal.ownerEmail)))}</span>${esc(ownerLabel(goal.ownerEmail))}</span></div>
      <div class="money-chart-wrap" data-id="${goal.id}">
        <svg viewBox="0 0 ${CHART_VW} ${CHART_VH}" class="money-chart-svg" style="width:100%;height:auto;display:block;">
          <defs>
            <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="var(--red)" stop-opacity="0.22"/>
              <stop offset="100%" stop-color="var(--red)" stop-opacity="0"/>
            </linearGradient>
          </defs>
          ${gridLines}
          ${target>0? `<line x1="${CHART_ML}" y1="${targetY}" x2="${CHART_VW-CHART_MR}" y2="${targetY}" stroke="var(--navy-950)" stroke-width="1.5" stroke-dasharray="5,4"/>
            <text x="${CHART_VW-CHART_MR}" y="${targetY-6}" text-anchor="end" font-size="10" font-weight="700" fill="var(--navy-950)">Goal ${money(target)}</text>`:''}
          ${areaPath? `<path d="${areaPath}" fill="url(#${gradId})" stroke="none"/>`:''}
          ${linePath? `<path d="${linePath}" fill="none" stroke="var(--red)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`:''}
          ${last? `<circle cx="${last.x}" cy="${last.y}" r="5" fill="var(--red)" stroke="#fff" stroke-width="2"/>
            <text x="${Math.min(last.x, CHART_VW-CHART_MR-70)}" y="${Math.max(last.y-12, CHART_MT+10)}" font-size="11" font-weight="800" fill="var(--text)">${money(current)}</text>`:''}
          <line class="crosshair" x1="0" y1="${CHART_MT}" x2="0" y2="${CHART_MT+PH}" stroke="var(--slate-400)" stroke-width="1" style="display:none;"/>
          <text x="${CHART_ML}" y="${CHART_VH-8}" font-size="10" fill="var(--text-dim)">${points.length?dateLabel(points[0].date):''}</text>
          <text x="${CHART_VW-CHART_MR}" y="${CHART_VH-8}" text-anchor="end" font-size="10" fill="var(--text-dim)">${points.length?dateLabel(points[points.length-1].date):''}</text>
        </svg>
        <div class="money-chart-tooltip" style="display:none;"></div>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:6px;margin-top:8px;">
        <button class="icon-btn goalEdit" title="Edit"><svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg></button>
        <button class="icon-btn goalDel" title="Delete"><svg viewBox="0 0 24 24"><path d="M6 7h12l-1 14H7L6 7zm3-3h6l1 2H8l1-2z"/></svg></button>
      </div>
    </div>
  `;
}

function wireMoneyGoalCharts(afterChange){
  document.querySelectorAll('.money-goal-card').forEach(card=>{
    const id = card.dataset.id;
    const goal = state.goals.find(g=>g.id===id);
    if(!goal) return;
    card.querySelector('.goalEdit').onclick = ()=>openGoalModal(goal);
    card.querySelector('.goalDel').onclick = async ()=>{
      if(confirm('Delete this goal?')){
        const { error } = await supabaseClient.from('goals').delete().eq('id', id);
        if(error){ toast('Delete failed: '+error.message); return; }
        await loadAllData(); toast('Goal deleted'); afterChange();
      }
    };
  });
  document.querySelectorAll('.money-chart-wrap').forEach(wrap=>{
    const goalId = wrap.dataset.id;
    const goal = state.goals.find(g=>g.id===goalId);
    if(!goal) return;
    const points = computeEarningsSeries(goal);
    if(!points.length) return;
    const svg = wrap.querySelector('.money-chart-svg');
    const crosshair = svg.querySelector('.crosshair');
    const tooltip = wrap.querySelector('.money-chart-tooltip');
    const PW = CHART_VW-CHART_ML-CHART_MR;
    const n = points.length;
    svg.addEventListener('mousemove', e=>{
      const rect = svg.getBoundingClientRect();
      const svgX = (e.clientX - rect.left) * (CHART_VW/rect.width);
      let idx = Math.round(((svgX-CHART_ML)/PW) * (n-1));
      idx = Math.max(0, Math.min(n-1, idx));
      const p = points[idx];
      const x = CHART_ML + (n>1 ? (idx/(n-1))*PW : PW/2);
      crosshair.setAttribute('x1', x); crosshair.setAttribute('x2', x);
      crosshair.style.display = '';
      tooltip.style.display = '';
      tooltip.style.left = (x/CHART_VW*100)+'%';
      tooltip.textContent = `${p.date.toLocaleDateString('en-US',{month:'short',day:'numeric'})}: ${fullMoney(p.value)}`;
    });
    svg.addEventListener('mouseleave', ()=>{
      crosshair.style.display = 'none';
      tooltip.style.display = 'none';
    });
  });
}

function goalCardHtml(goal){
  const progress = computeGoalProgress(goal);
  const target = Number(goal.target)||0;
  const pct = target>0 ? Math.min(100, Math.round(progress/target*100)) : 0;
  const complete = target>0 && progress>=target;
  return `
    <div class="goal-card" data-id="${goal.id}">
      <div class="gh"><span>${esc(goal.label)}</span><span class="gv">${Math.round(progress*100)/100} / ${target}</span></div>
      <div class="cell-sub">${esc(goal.metric)}${goal.metric!=='Custom'?' · '+esc(goal.period):''}</div>
      <div class="goal-bar-track"><div class="goal-bar-fill ${complete?'complete':''}" style="width:${pct}%;"></div></div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;">
        <span class="owner-tag"><span class="owner-dot">${esc(initials(ownerLabel(goal.ownerEmail)))}</span>${esc(ownerLabel(goal.ownerEmail))}</span>
        <div class="actions-cell">
          ${goal.metric==='Custom'? `<button class="icon-btn goalMinus" title="-1"><svg viewBox="0 0 24 24"><path d="M5 11h14v2H5z"/></svg></button><button class="icon-btn goalPlus" title="+1"><svg viewBox="0 0 24 24"><path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z"/></svg></button>`:''}
          <button class="icon-btn goalEdit" title="Edit"><svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg></button>
          <button class="icon-btn goalDel" title="Delete"><svg viewBox="0 0 24 24"><path d="M6 7h12l-1 14H7L6 7zm3-3h6l1 2H8l1-2z"/></svg></button>
        </div>
      </div>
    </div>
  `;
}

function wireGoalCards(afterChange){
  document.querySelectorAll('.goal-card:not(.money-goal-card)').forEach(card=>{
    const id = card.dataset.id;
    const goal = state.goals.find(g=>g.id===id);
    if(!goal) return;
    card.querySelector('.goalEdit').onclick = ()=>openGoalModal(goal);
    card.querySelector('.goalDel').onclick = async ()=>{
      if(confirm('Delete this goal?')){
        const { error } = await supabaseClient.from('goals').delete().eq('id', id);
        if(error){ toast('Delete failed: '+error.message); return; }
        await loadAllData(); toast('Goal deleted'); afterChange();
      }
    };
    const plus = card.querySelector('.goalPlus');
    const minus = card.querySelector('.goalMinus');
    if(plus) plus.onclick = async ()=>{
      const { error } = await supabaseClient.from('goals').update({ manual_progress: (Number(goal.manualProgress)||0)+1 }).eq('id', id);
      if(error){ toast('Failed: '+error.message); return; }
      await loadAllData(); afterChange();
    };
    if(minus) minus.onclick = async ()=>{
      const { error } = await supabaseClient.from('goals').update({ manual_progress: Math.max(0,(Number(goal.manualProgress)||0)-1) }).eq('id', id);
      if(error){ toast('Failed: '+error.message); return; }
      await loadAllData(); afterChange();
    };
  });
}

function renderGoals(){
  const view = document.getElementById('view');
  view.className = 'view';
  if(!todosGoalsSchemaReady){
    view.innerHTML = `<div class="panel"><div class="panel-body">
      <h3 style="margin-top:0;">Setup needed</h3>
      <p style="color:var(--text-dim);font-size:13.5px;">Goals need one more database update. Run <code>schema_v5.sql</code> in your Supabase project's SQL editor, then reload this page.</p>
    </div></div>`;
    return;
  }
  const mine = state.goals.filter(g=>g.ownerEmail===currentUserEmail());
  const others = state.goals.filter(g=>g.ownerEmail!==currentUserEmail());
  const sectionHtml = (title, goals) => {
    if(!goals.length) return '';
    const money = goals.filter(g=>g.metric==='Commission Earned');
    const rest = goals.filter(g=>g.metric!=='Commission Earned');
    return `<h3 style="font-size:12px;color:var(--text-dim);text-transform:uppercase;letter-spacing:.5px;margin:0 0 10px;">${title}</h3>
      ${money.length? `<div class="money-goals-list">${money.map(moneyGoalChartHtml).join('')}</div>`:''}
      ${rest.length? `<div class="stat-grid" style="margin-bottom:24px;">${rest.map(goalCardHtml).join('')}</div>`:''}`;
  };
  view.innerHTML = `
    <div class="page-head">
      <div><h1>Goals</h1><p>${state.goals.length} goal${state.goals.length===1?'':'s'} tracked across the team</p></div>
      <button class="btn gold" id="addGoalBtn">+ Add Goal</button>
    </div>
    ${sectionHtml('My Goals', mine)}
    ${sectionHtml('Team Goals', others)}
    ${!state.goals.length? `<div class="panel"><div class="panel-body"><div class="empty">No goals yet. Set one to start tracking progress.</div></div></div>`:''}
  `;
  document.getElementById('addGoalBtn').onclick = ()=>openGoalModal();
  wireGoalCards(renderGoals);
  wireMoneyGoalCharts(renderGoals);
}

function openGoalModal(goal){
  const isEdit = !!goal;
  const g = goal || { label:'', metric:'Calls Logged', period:'Daily', target:10, manualProgress:0, ownerEmail:currentUserEmail() };
  const staffOptions = (selected) => {
    const emails = knownStaffEmails();
    if(selected && !emails.includes(selected)) emails.push(selected);
    return emails.map(e=>`<option value="${esc(e)}" ${e===selected?'selected':''}>${esc(ownerLabel(e))}</option>`).join('');
  };
  const html = `
    <div class="modal-overlay">
      <div class="modal">
        <div class="modal-head"><h3>${isEdit?'Edit Goal':'Add Goal'}</h3><button class="modal-close">&times;</button></div>
        <div class="modal-body">
          <div class="form-grid">
            <label class="full">Label<input type="text" id="g_label" value="${esc(g.label)}" placeholder="e.g. Cold calls per day"></label>
            <label>Metric<select id="g_metric">${GOAL_METRICS.map(m=>`<option ${m===g.metric?'selected':''}>${m}</option>`).join('')}</select></label>
            <label id="g_period_wrap">Period<select id="g_period">${GOAL_PERIODS.map(p=>`<option ${p===g.period?'selected':''}>${p}</option>`).join('')}</select></label>
            <label>Target<input type="number" id="g_target" value="${g.target}" placeholder="20"></label>
            <label id="g_manual_wrap" style="${g.metric==='Custom'?'':'display:none;'}">Current Progress<input type="number" id="g_manual" value="${g.manualProgress}"></label>
            <label class="full">Whose goal<select id="g_owner">${staffOptions(g.ownerEmail)}</select></label>
          </div>
        </div>
        <div class="modal-foot">
          ${isEdit? '<button class="btn danger" id="deleteGoalBtn" style="margin-right:auto;">Delete</button>':''}
          <button class="btn outline" id="cancelBtn">Cancel</button>
          <button class="btn gold" id="saveGoalBtn">${isEdit?'Save Changes':'Add Goal'}</button>
        </div>
      </div>
    </div>`;
  const root = document.getElementById('modalRoot');
  root.innerHTML = html;
  const close = ()=>root.innerHTML='';
  root.querySelector('.modal-close').onclick = close;
  root.querySelector('#cancelBtn').onclick = close;
  root.querySelector('.modal-overlay').addEventListener('click', e=>{ if(e.target.classList.contains('modal-overlay')) close(); });
  const metricSel = root.querySelector('#g_metric');
  const periodWrap = root.querySelector('#g_period_wrap');
  const manualWrap = root.querySelector('#g_manual_wrap');
  periodWrap.style.display = g.metric==='Custom' ? 'none' : '';
  metricSel.addEventListener('change', ()=>{
    const isCustom = metricSel.value==='Custom';
    periodWrap.style.display = isCustom? 'none':'';
    manualWrap.style.display = isCustom? '':'none';
  });
  if(isEdit){
    root.querySelector('#deleteGoalBtn').onclick = async ()=>{
      if(confirm('Delete this goal?')){
        const { error } = await supabaseClient.from('goals').delete().eq('id', g.id);
        if(error){ toast('Delete failed: '+error.message); return; }
        await loadAllData(); toast('Goal deleted'); close(); navigate();
      }
    };
  }
  root.querySelector('#saveGoalBtn').onclick = async ()=>{
    const label = root.querySelector('#g_label').value.trim();
    if(!label){ toast('Label is required'); return; }
    const data = {
      label,
      metric: metricSel.value,
      period: root.querySelector('#g_period').value,
      target: Number(root.querySelector('#g_target').value)||0,
      manualProgress: Number(root.querySelector('#g_manual').value)||0,
      ownerEmail: root.querySelector('#g_owner').value,
    };
    const btn = root.querySelector('#saveGoalBtn');
    btn.disabled = true;
    if(isEdit){
      const { error } = await supabaseClient.from('goals').update(goalToRow(data)).eq('id', g.id);
      if(error){ toast('Save failed: '+error.message); btn.disabled=false; return; }
      toast('Goal updated');
    } else {
      const { error } = await supabaseClient.from('goals').insert(goalToRow(data));
      if(error){ toast('Save failed: '+error.message); btn.disabled=false; return; }
      toast('Goal added');
    }
    await loadAllData();
    close();
    if(document.getElementById('addGoalBtn')) renderGoals();
    if(location.hash==='#coldcall') renderColdCall();
  };
}

/* ---------- News & Updates ---------- */
const NEWS_FEEDS = [
  { name:'REBusinessOnline', url:'https://rebusinessonline.com/feed/', tag:'National CRE' },
  { name:'Bisnow', url:'https://www.bisnow.com/rss/all', tag:'National CRE' },
  { name:'Connect CRE', url:'https://www.connectcre.com/feed/', tag:'National CRE' },
  { name:'WisBusiness', url:'https://wisbusiness.com/feed/', tag:'Wisconsin' },
  { name:'Urban Milwaukee', url:'https://urbanmilwaukee.com/feed/', tag:'Wisconsin' },
  { name:'NPR News', url:'https://feeds.npr.org/1001/rss.xml', tag:'US News' },
];
const RSS2JSON_API_KEY = '';
const NEWS_CACHE_KEY = 'cre_crm_news_cache_v1';
let newsFetchInFlight = false;

async function fetchNewsFeeds(force){
  if(!force){
    try{
      const cached = JSON.parse(localStorage.getItem(NEWS_CACHE_KEY)||'null');
      if(cached && Date.now()-cached.fetchedAt < 60*60*1000) return cached;
    }catch(e){}
  }
  if(newsFetchInFlight) return null;
  newsFetchInFlight = true;
  try{
    const results = await Promise.all(NEWS_FEEDS.map(async feed=>{
      try{
        const keyParam = RSS2JSON_API_KEY ? `&api_key=${RSS2JSON_API_KEY}` : '';
        const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}${keyParam}`);
        const data = await res.json();
        if(data.status !== 'ok') return [];
        return (data.items||[]).slice(0,8).map(item=>({
          title:item.title, link:item.link, pubDate:item.pubDate, source:feed.name, tag:feed.tag,
        }));
      }catch(e){ return []; }
    }));
    const items = results.flat().sort((a,b)=> new Date(b.pubDate)-new Date(a.pubDate));
    const cache = { items, fetchedAt: Date.now() };
    try{ localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify(cache)); }catch(e){}
    return cache;
  } finally {
    newsFetchInFlight = false;
  }
}

function renderNewsFeedBody(cache){
  const body = document.getElementById('newsFeedBody');
  if(!body) return;
  if(!RSS2JSON_API_KEY){
    body.innerHTML = `<div class="empty">News feed isn't configured yet — waiting on an rss2json.com API key.</div>`;
    return;
  }
  if(!cache || !cache.items || !cache.items.length){
    body.innerHTML = `<div class="empty">Couldn't load headlines right now. Try Refresh, or check back later.</div>`;
    return;
  }
  body.innerHTML = `
    <div class="cell-sub" style="margin-bottom:10px;">Updated ${timeAgo(new Date(cache.fetchedAt).toISOString())}</div>
    <div class="news-list">
      ${cache.items.slice(0,30).map(item=>`
        <a class="news-row" href="${esc(item.link)}" target="_blank" rel="noopener noreferrer">
          <span class="badge ${item.tag==='Wisconsin'?'client':item.tag==='US News'?'warm':'cold'}">${esc(item.tag)}</span>
          <span class="news-title">${esc(item.title)}</span>
          <span class="cell-sub" style="flex-shrink:0;">${esc(item.source)} · ${item.pubDate? fmtDate(item.pubDate):''}</span>
        </a>`).join('')}
    </div>
  `;
}

async function loadNewsIntoView(){
  const btn = document.getElementById('refreshNewsBtn');
  if(btn) btn.onclick = async ()=>{
    document.getElementById('newsFeedBody').innerHTML = '<div class="empty">Refreshing…</div>';
    renderNewsFeedBody(await fetchNewsFeeds(true));
  };
  if(!RSS2JSON_API_KEY){ renderNewsFeedBody(null); return; }
  renderNewsFeedBody(await fetchNewsFeeds(false));
}

function renderCompStats(){
  const el = document.getElementById('compStats');
  if(!el) return;
  if(!marketCompsSchemaReady){
    el.innerHTML = `<div class="panel" style="grid-column:1/-1;"><div class="panel-body"><div class="empty">Run <code>schema_v6.sql</code> to enable market comps tracking.</div></div></div>`;
    return;
  }
  const byType = {};
  state.marketComps.forEach(c=>{
    if(!c.propertyType || !c.pricePerSf) return;
    (byType[c.propertyType] = byType[c.propertyType]||[]).push(c);
  });
  const cards = Object.entries(byType).map(([type, comps])=>{
    const avg = comps.reduce((a,c)=>a+c.pricePerSf,0)/comps.length;
    return `<div class="stat-card" data-comp-type="${esc(type)}">
      <div class="label">${esc(type)} Avg $/SF</div><div class="value">${fmtPerSf(avg)}</div>
      <div class="sub">${comps.length} comp${comps.length===1?'':'s'}</div>
      <button class="btn outline sm showCompsMathBtn" style="margin-top:8px;">🧮 Show Math</button>
    </div>`;
  });
  el.innerHTML = cards.length ? cards.join('') : `<div class="panel" style="grid-column:1/-1;"><div class="panel-body"><div class="empty">Log a few comps to see average $/SF by property type.</div></div></div>`;
  el.querySelectorAll('.showCompsMathBtn').forEach(btn=>{
    btn.onclick = ()=>{
      const type = btn.closest('[data-comp-type]').dataset.compType;
      const comps = byType[type];
      const sum = comps.reduce((a,c)=>a+c.pricePerSf,0);
      const avg = sum/comps.length;
      const steps = [
        ...comps.map(c=>({ label:c.address, formula: fmtPerSf(c.pricePerSf) })),
        { label:'Sum', formula: comps.map(c=>c.pricePerSf.toFixed(2)).join(' + '), result: fmtPerSf(sum) },
        { label:`Average (÷ ${comps.length})`, formula: `${fmtPerSf(sum)} ÷ ${comps.length}`, result: fmtPerSf(avg) },
      ];
      showMathModal(`${type} — Avg $/SF Math`, steps, 'Only comps with both a property type and a $/SF value are counted.');
    };
  });
}

function renderCompsTable(){
  const body = document.getElementById('compsBody');
  if(!body) return;
  if(!marketCompsSchemaReady){ body.innerHTML = `<tr><td colspan="10"><div class="empty">Run <code>schema_v6.sql</code> to enable market comps tracking.</div></td></tr>`; return; }
  const list = state.marketComps.slice().sort((a,b)=> new Date(b.transactionDate||b.createdAt) - new Date(a.transactionDate||a.createdAt));
  if(!list.length){ body.innerHTML = `<tr><td colspan="10"><div class="empty">No comps logged yet. Add the first one your team has seen close.</div></td></tr>`; return; }
  body.innerHTML = list.map(c=>`
    <tr data-id="${c.id}">
      <td class="cell-name">${esc(c.address)}</td>
      <td>${esc(c.propertyType||'—')}</td>
      <td><span class="badge ${c.transactionType==='Lease'?'client':'cold'}">${esc(c.transactionType)}</span></td>
      <td>${c.price?fullMoney(c.price):'—'}</td>
      <td>${fmtSf(c.squareFeet)}</td>
      <td>${fmtPerSf(c.pricePerSf)}</td>
      <td>${c.capRate!==''&&c.capRate!=null? c.capRate+'%':'—'}</td>
      <td>${c.transactionDate?fmtDate(c.transactionDate):'—'}</td>
      <td>${esc(c.source||'—')}</td>
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
    tr.querySelector('.editBtn').onclick = ()=>openCompModal(state.marketComps.find(c=>c.id===id));
    tr.querySelector('.delBtn').onclick = async ()=>{
      if(confirm('Delete this comp?')){
        const { error } = await supabaseClient.from('market_comps').delete().eq('id', id);
        if(error){ toast('Delete failed: '+error.message); return; }
        await loadAllData(); toast('Comp deleted'); renderCompStats(); renderCompsTable();
      }
    };
  });
}

function openCompModal(comp){
  const isEdit = !!comp;
  const c = comp || { address:'', submarket:'', propertyType:PROPERTY_TYPES[0], transactionType:'Sale', price:'', squareFeet:'', pricePerSf:'', capRate:'', transactionDate:'', source:'', notes:'' };
  const html = `
    <div class="modal-overlay">
      <div class="modal">
        <div class="modal-head"><h3>${isEdit?'Edit Comp':'Log Market Comp'}</h3><button class="modal-close">&times;</button></div>
        <div class="modal-body">
          <div class="form-grid">
            <label class="full">Address<input type="text" id="mc_address" value="${esc(c.address)}" placeholder="123 Main St, City, WI"></label>
            <label>Submarket<input type="text" id="mc_submarket" value="${esc(c.submarket)}" placeholder="e.g. Waukesha, Menomonee Falls"></label>
            <label>Property Type<select id="mc_ptype">${PROPERTY_TYPES.map(t=>`<option ${t===c.propertyType?'selected':''}>${t}</option>`).join('')}</select></label>
            <label>Deal Type<select id="mc_ttype">${COMP_TRANSACTION_TYPES.map(t=>`<option ${t===c.transactionType?'selected':''}>${t}</option>`).join('')}</select></label>
            <label>Date<input type="date" id="mc_date" value="${c.transactionDate||''}"></label>
            <label>Price<input type="number" id="mc_price" value="${c.price}" placeholder="1500000"></label>
            <label>Square Feet<input type="number" id="mc_sf" value="${c.squareFeet}" placeholder="15000"></label>
            <label>Price / SF<input type="number" step="0.01" id="mc_persf" value="${c.pricePerSf}" placeholder="105.00"></label>
            <label>Cap Rate %<input type="number" step="0.01" id="mc_cap" value="${c.capRate}" placeholder="6.5"></label>
            <label>Source<input type="text" id="mc_source" value="${esc(c.source)}" placeholder="Public record, CoStar, broker call…"></label>
            <label class="full">Notes<textarea id="mc_notes" placeholder="Anything else worth remembering about this deal…">${esc(c.notes)}</textarea></label>
          </div>
        </div>
        <div class="modal-foot">
          ${isEdit? '<button class="btn danger" id="deleteCompBtn" style="margin-right:auto;">Delete</button>':''}
          <button class="btn outline" id="cancelBtn">Cancel</button>
          <button class="btn gold" id="saveCompBtn">${isEdit?'Save Changes':'Log Comp'}</button>
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
    root.querySelector('#deleteCompBtn').onclick = async ()=>{
      if(confirm('Delete this comp?')){
        const { error } = await supabaseClient.from('market_comps').delete().eq('id', c.id);
        if(error){ toast('Delete failed: '+error.message); return; }
        await loadAllData(); toast('Comp deleted'); close(); renderCompStats(); renderCompsTable();
      }
    };
  }
  root.querySelector('#saveCompBtn').onclick = async ()=>{
    const address = document.getElementById('mc_address').value.trim();
    if(!address){ toast('Address is required'); return; }
    const data = {
      address,
      submarket: document.getElementById('mc_submarket').value.trim(),
      propertyType: document.getElementById('mc_ptype').value,
      transactionType: document.getElementById('mc_ttype').value,
      transactionDate: document.getElementById('mc_date').value,
      price: Number(document.getElementById('mc_price').value)||0,
      squareFeet: Number(document.getElementById('mc_sf').value)||0,
      pricePerSf: Number(document.getElementById('mc_persf').value)||0,
      capRate: document.getElementById('mc_cap').value,
      source: document.getElementById('mc_source').value.trim(),
      notes: document.getElementById('mc_notes').value.trim(),
    };
    const btn = document.getElementById('saveCompBtn');
    btn.disabled = true;
    if(isEdit){
      const { error } = await supabaseClient.from('market_comps').update(marketCompToRow({ ...data, ownerEmail:c.ownerEmail })).eq('id', c.id);
      if(error){ toast('Save failed: '+error.message); btn.disabled=false; return; }
      toast('Comp updated');
    } else {
      const row = marketCompToRow({ ...data, ownerEmail: currentUserEmail() });
      const { error } = await supabaseClient.from('market_comps').insert(row);
      if(error){ toast('Save failed: '+error.message); btn.disabled=false; return; }
      await logActivity('comp', `Logged market comp <b>${esc(address)}</b> <span class="cell-sub">(by ${esc(ownerLabel(currentUserEmail()))})</span>`);
      toast('Comp logged');
    }
    await loadAllData();
    close();
    if(document.getElementById('compsBody')){ renderCompStats(); renderCompsTable(); }
  };
}

function renderNews(){
  const view = document.getElementById('view');
  view.className = 'view';
  view.innerHTML = `
    <div class="page-head">
      <div><h1>News &amp; Updates</h1><p>Real estate trends, Wisconsin news, and your team's SE Wisconsin market comps</p></div>
    </div>
    <div class="panel" style="margin-bottom:26px;">
      <div class="panel-head"><h3>Real Estate &amp; Wisconsin News</h3><button class="btn sm outline" id="refreshNewsBtn">Refresh</button></div>
      <div class="panel-body" id="newsFeedBody"><div class="empty">Loading headlines…</div></div>
    </div>
    <div class="page-head" style="margin-bottom:14px;">
      <div><h2 style="font-size:16px;margin:0;">SE Wisconsin Market Comps</h2><p style="margin:2px 0 0;color:var(--text-dim);font-size:13px;">Deals your team has logged — sales, leases, and pricing seen in the market</p></div>
      <button class="btn gold" id="addCompBtn">+ Log Comp</button>
    </div>
    <div id="compStats" class="stat-grid" style="margin-bottom:16px;"></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Address</th><th>Type</th><th>Deal</th><th>Price</th><th>SF</th><th>$/SF</th><th>Cap Rate</th><th>Date</th><th>Source</th><th></th></tr></thead>
        <tbody id="compsBody"></tbody>
      </table>
    </div>
  `;
  document.getElementById('addCompBtn').onclick = ()=>openCompModal();
  renderCompStats();
  renderCompsTable();
  loadNewsIntoView();
}

/* ---------- Individuals (solar system) ---------- */
function renderIndividuals(){
  const view = document.getElementById('view');
  view.className = 'view view-space';
  const emails = knownStaffEmails();
  const baseRadius = 80, radiusStep = 64, baseDuration = 26, durationStep = 12;
  view.innerHTML = `
    <div class="page-head">
      <div><h1>Individuals</h1><p>Hover a planet to see who it is — click to open their goals &amp; to-do list</p></div>
    </div>
    <div class="solar-system" id="solarSystem">
      <div class="sun" title="NAI Pfefferle"></div>
      ${emails.length? emails.map((email,i)=>{
        const r = baseRadius + i*radiusStep;
        const dur = baseDuration + i*durationStep;
        const color = PLANET_COLORS[i % PLANET_COLORS.length];
        const isMe = email===currentUserEmail();
        const label = ownerLabel(email);
        const nice = label.charAt(0).toUpperCase()+label.slice(1) + (isMe?' (You)':'');
        return `
        <div class="orbit-ring" style="--r:${r}px;">
          <div class="orbit-pivot" style="animation-duration:${dur}s;">
            <div class="planet-anchor">
              <div class="planet-body${isMe?' is-me':''}" data-email="${esc(email)}" data-tooltip="${esc(nice)}" style="background:${color};color:#fff;animation-duration:${dur}s;">${esc(initials(label))}</div>
            </div>
          </div>
        </div>`;
      }).join('') : ''}
    </div>
  `;
  view.querySelectorAll('.planet-body').forEach(p=>{
    p.onclick = ()=>openProfilePopup(p.dataset.email);
  });
}

function renderProfileTodos(root, containerId){
  const container = root.querySelector('#'+containerId);
  if(!container) return;
  const myTodos = state.todos.filter(t=>!t.done);
  container.innerHTML = myTodos.length
    ? myTodos.map(t=>todoItemHtml({ kind:'todo', id:t.id, label:t.title, dueDate:t.dueDate, sortDate:t.dueDate||'9999-99-99' })).join('')
    : '<div class="empty">Nothing on your list — add something below.</div>';
  container.querySelectorAll('.todo-row').forEach(row=>{
    const id = row.dataset.id;
    row.querySelector('.todo-check').onchange = async ()=>{
      const { error } = await supabaseClient.from('todos').update({ done:true }).eq('id', id);
      if(error){ toast('Failed: '+error.message); return; }
      await loadAllData();
      renderProfileTodos(root, containerId);
    };
    row.querySelector('.todo-del').onclick = async ()=>{
      const { error } = await supabaseClient.from('todos').delete().eq('id', id);
      if(error){ toast('Failed: '+error.message); return; }
      await loadAllData();
      renderProfileTodos(root, containerId);
    };
  });
}

function openProfilePopup(email){
  const isMe = email===currentUserEmail();
  const label = ownerLabel(email);
  const nice = label.charAt(0).toUpperCase()+label.slice(1);
  const idx = knownStaffEmails().indexOf(email);
  const color = PLANET_COLORS[Math.max(0,idx) % PLANET_COLORS.length];
  const goals = state.goals.filter(g=>g.ownerEmail===email);
  const moneyGoals = goals.filter(g=>g.metric==='Commission Earned');
  const otherGoals = goals.filter(g=>g.metric!=='Commission Earned');

  const html = `
    <div class="modal-overlay">
      <div class="modal">
        <div class="modal-head">
          <h3 style="display:flex;align-items:center;gap:10px;">
            <span style="width:26px;height:26px;border-radius:50%;background:${color};box-shadow:0 0 12px ${color};display:inline-block;"></span>
            ${esc(nice)}${isMe?' (You)':''}
          </h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="field-label" style="margin-top:0;">Goals</div>
          ${moneyGoals.length? `<div class="money-goals-list" style="margin-bottom:16px;">${moneyGoals.map(moneyGoalChartHtml).join('')}</div>`:''}
          ${otherGoals.length? `<div class="stat-grid" style="margin-bottom:16px;">${otherGoals.map(goalCardHtml).join('')}</div>` : (moneyGoals.length? '' : '<div class="empty" style="text-align:left;padding:6px 0 16px;">No goals set yet.</div>')}

          <div class="field-label" style="margin-top:18px;">To-Do List</div>
          ${isMe? `
            <div id="profileTodoList" class="todo-list"></div>
            <div class="todo-add-row">
              <input type="text" id="profileNewTodoText" placeholder="Add a to-do…">
              <input type="date" id="profileNewTodoDate">
              <button class="btn gold sm" id="profileAddTodoBtn">Add</button>
            </div>
          ` : `<div class="empty" style="text-align:left;padding:6px 0;">To-do lists are private — only ${esc(nice)} can see this one.</div>`}
        </div>
        <div class="modal-foot"><button class="btn outline" id="cancelBtn">Close</button></div>
      </div>
    </div>`;
  const root = document.getElementById('modalRoot');
  root.innerHTML = html;
  const close = ()=>root.innerHTML='';
  root.querySelector('.modal-close').onclick = close;
  root.querySelector('#cancelBtn').onclick = close;
  root.querySelector('.modal-overlay').addEventListener('click', e=>{ if(e.target.classList.contains('modal-overlay')) close(); });

  if(otherGoals.length) wireGoalCards(()=>openProfilePopup(email));
  if(moneyGoals.length) wireMoneyGoalCharts(()=>openProfilePopup(email));

  if(isMe){
    renderProfileTodos(root, 'profileTodoList');
    root.querySelector('#profileAddTodoBtn').onclick = async ()=>{
      const textEl = root.querySelector('#profileNewTodoText');
      const title = textEl.value.trim();
      if(!title) return;
      const dueDate = root.querySelector('#profileNewTodoDate').value || null;
      const { error } = await supabaseClient.from('todos').insert({ user_id: currentUserId(), title, due_date: dueDate });
      if(error){ toast('Failed to add: '+error.message); return; }
      await loadAllData();
      renderProfileTodos(root, 'profileTodoList');
      textEl.value = '';
      root.querySelector('#profileNewTodoDate').value = '';
    };
    root.querySelector('#profileNewTodoText').addEventListener('keydown', e=>{
      if(e.key==='Enter') root.querySelector('#profileAddTodoBtn').click();
    });
  }
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
        <div class="auth-brand"><div class="auth-logo-wrap" data-tooltip="Make Wally happy"><img src="logo.svg" alt="NAI Pfefferle" class="auth-logo"></div><span class="brand-suffix">CRM</span></div>
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

let welcomeShown = false;
function showWelcomePopup(){
  if(welcomeShown) return;
  welcomeShown = true;
  const name = ownerLabel(currentUserEmail());
  const nice = name.charAt(0).toUpperCase()+name.slice(1);
  const el = document.createElement('div');
  el.className = 'welcome-popup';
  el.innerHTML = `<span class="wp-icon">👋</span><span>Welcome back, ${esc(nice)}!</span>`;
  document.body.appendChild(el);
  requestAnimationFrame(()=>el.classList.add('show'));
  setTimeout(()=>{
    el.classList.remove('show');
    setTimeout(()=>el.remove(), 300);
  }, 3000);
}

function celebrateDealWon(){
  const colors = ['#c94b3f','#e0b23a','#3aa655','#5b8def','#c74fc0','#4fc3c7'];
  const container = document.createElement('div');
  container.className = 'confetti-container';
  for(let i=0;i<90;i++){
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    const color = colors[Math.floor(Math.random()*colors.length)];
    const left = Math.random()*100;
    const delay = Math.random()*0.4;
    const duration = 2.2 + Math.random()*1.4;
    const rotate = Math.round(Math.random()*360);
    const drift = Math.round((Math.random()-0.5)*160);
    const size = 6 + Math.random()*6;
    piece.style.cssText = `left:${left}%;background:${color};animation-delay:${delay}s;animation-duration:${duration}s;width:${size}px;height:${size*0.4}px;--drift:${drift}px;--rot:${rotate}deg;`;
    container.appendChild(piece);
  }
  document.body.appendChild(container);

  const banner = document.createElement('div');
  banner.className = 'welcome-popup';
  banner.style.top = '90px';
  banner.innerHTML = `<span class="wp-icon">🎉</span><span>Deal closed — nice work!</span>`;
  document.body.appendChild(banner);
  requestAnimationFrame(()=>banner.classList.add('show'));
  setTimeout(()=>{
    banner.classList.remove('show');
    setTimeout(()=>banner.remove(), 300);
  }, 3200);
  setTimeout(()=>container.remove(), 4000);
}

function maybeShowInactivityNudge(){
  const nudgeKey = 'cre_crm_last_nudge_' + (currentUserId()||currentUserEmail());
  const today = new Date().toISOString().slice(0,10);
  try{ if(localStorage.getItem(nudgeKey) === today) return; }catch(e){}
  const myContacts = state.contacts.filter(c=>c.ownerEmail===currentUserEmail());
  const mostRecent = myContacts.reduce((latest,c)=>{
    const t = new Date(c.createdAt).getTime();
    return t>latest ? t : latest;
  }, 0);
  const hoursSince = mostRecent ? (Date.now()-mostRecent)/3600000 : Infinity;
  if(hoursSince < 24) return;
  try{ localStorage.setItem(nudgeKey, today); }catch(e){}
  const el = document.createElement('div');
  el.className = 'welcome-popup';
  el.style.top = '90px';
  el.innerHTML = `<span class="wp-icon">🔥</span><span>No new contacts added today — lock in and get to grinding!</span>`;
  document.body.appendChild(el);
  requestAnimationFrame(()=>el.classList.add('show'));
  setTimeout(()=>{
    el.classList.remove('show');
    setTimeout(()=>el.remove(), 300);
  }, 5000);
}

async function showApp(){
  document.getElementById('authRoot').innerHTML = '';
  document.getElementById('app').style.display = '';
  document.getElementById('whoami').textContent = 'Signed in as ' + currentUserEmail();
  showWelcomePopup();
  const ok = await loadAllData();
  subscribeRealtime();
  if(ok){
    navigate();
    setTimeout(maybeShowInactivityNudge, 3500);
  }
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
