const els = {
  hh: document.getElementById('hh'),
  mm: document.getElementById('mm'),
  ss: document.getElementById('ss'),
  date: document.getElementById('todayDate'),
  go: document.getElementById('goBtn'),
  pause: document.getElementById('pauseBtn'),
  stop: document.getElementById('stopBtn'),
  oops: document.getElementById('oopsBtn'),
  connect: document.getElementById('connectBtn'),
  badge: document.getElementById('connBadge'),
  project: document.getElementById('projectSelect'),
  tToday: document.getElementById('tToday'),
  tYesterday: document.getElementById('tYesterday'),
  tDayBefore: document.getElementById('tDayBefore'),
  goalDialog: document.getElementById('goalDialog'),
  goalBtn: document.getElementById('goalBtn'),
  goalHours: document.getElementById('goalHours'),
  goalSave: document.getElementById('goalSave'),
  ring: document.querySelector('.ring .fg'),
  goalPct: document.getElementById('goalPct'),
  goalSpent: document.getElementById('goalSpent'),
  goalTarget: document.getElementById('goalTarget')
};

const API_BASE = '/api';
const RING_C = 2 * Math.PI * 50;

const pad = n => String(n).padStart(2,'0');
const fmtHMS = s => {
  const h = Math.floor(s/3600);
  const m = Math.floor((s%3600)/60);
  const sec = Math.floor(s%60);
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
};
const toHrs = s => (s/3600).toFixed(1).replace(/\.0$/,'');

let running = false;
let startTS = null;
let tickInt = null;
let todaySec = 0;
let yestSec = 0;
let dayBeforeSec = 0;
let lastSessionId = null;

function setTodayStr(){
  const d = new Date();
  els.date.textContent = d.toLocaleDateString(undefined, { weekday:'long', year:'numeric', month:'long', day:'numeric' });
}

function loadGoal(){
  const goal = Number(localStorage.getItem('weeklyGoalHours') || '0');
  const spent = Number(localStorage.getItem('weeklySpentSec') || '0');
  els.goalHours.value = goal || '';
  els.goalTarget.textContent = `${goal}h`;
  updateRing(spent, goal);
}
function saveGoal(h){
  localStorage.setItem('weeklyGoalHours', String(h));
  els.goalTarget.textContent = `${h}h`;
  const spent = Number(localStorage.getItem('weeklySpentSec') || '0');
  updateRing(spent, h);
}
function updateWeeklySpent(deltaSec){
  const cur = Number(localStorage.getItem('weeklySpentSec') || '0');
  const next = cur + deltaSec;
  localStorage.setItem('weeklySpentSec', String(next));
  const goal = Number(localStorage.getItem('weeklyGoalHours') || '0');
  updateRing(next, goal);
}
function resetWeekIfNeeded(){
  const key = 'weeklyWeekStart';
  const iso = new Date();
  const day = (iso.getDay() || 7);
  iso.setHours(0,0,0,0);
  iso.setDate(iso.getDate() - day + 1);
  const weekStart = iso.toISOString().slice(0,10);
  const saved = localStorage.getItem(key);
  if(saved !== weekStart){
    localStorage.setItem(key, weekStart);
    localStorage.setItem('weeklySpentSec','0');
  }
}
function updateRing(spentSec, goalHours){
  const targetSec = (goalHours||0) * 3600;
  const pct = targetSec ? Math.max(0, Math.min(100, Math.round(spentSec/targetSec*100))) : 0;
  const offset = RING_C * (1 - pct/100);
  els.ring.style.strokeDasharray = RING_C;
  els.ring.style.strokeDashoffset = offset;
  els.goalPct.textContent = pct;
  els.goalSpent.textContent = `${toHrs(spentSec)}h`;
}

function loadDayTotals(){
  todaySec = Number(localStorage.getItem('todaySec')||'0');
  yestSec = Number(localStorage.getItem('yestSec')||'0');
  dayBeforeSec = Number(localStorage.getItem('dayBeforeSec')||'0');
  renderDayTotals();
}
function rolloverTotalsAtMidnight(){
  const key = 'lastDate';
  const d = new Date().toISOString().slice(0,10);
  const prev = localStorage.getItem(key);
  if(prev && prev !== d){
    localStorage.setItem('dayBeforeSec', localStorage.getItem('yestSec')||'0');
    localStorage.setItem('yestSec', localStorage.getItem('todaySec')||'0');
    localStorage.setItem('todaySec','0');
    todaySec=0; yestSec=Number(localStorage.getItem('yestSec')||'0'); dayBeforeSec=Number(localStorage.getItem('dayBeforeSec')||'0');
    renderDayTotals();
  }
  localStorage.setItem(key, d);
}
function renderDayTotals(){
  els.tToday.textContent = fmtHMS(todaySec);
  els.tYesterday.textContent = fmtHMS(yestSec);
  els.tDayBefore.textContent = fmtHMS(dayBeforeSec);
}

function tick(){
  const elapsed = Math.floor((Date.now()-startTS)/1000);
  els.hh.textContent = pad(Math.floor(elapsed/3600));
  els.mm.textContent = pad(Math.floor((elapsed%3600)/60));
  els.ss.textContent = pad(Math.floor(elapsed%60));
}

async function tryJson(url, body){
  try{
    const res = await fetch(url, body ? {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(body)
    } : undefined);
    if(!res.ok) throw new Error(res.statusText);
    return await res.json();
  }catch(e){
    return null;
  }
}

async function populateProjects(){
  const data = await tryJson(`/api/projects`);
  if(!data || !Array.isArray(data)) return;
  const sel = els.project;
  for(let i = sel.options.length-1; i>=1; i--) sel.remove(i);
  data.forEach(p=>{
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name;
    sel.appendChild(opt);
  });
}

async function checkConnection(){
  const ok = await tryJson(`/api/auth-status`);
  if(ok && ok.connected){
    els.badge.textContent = 'Connected';
    els.badge.classList.remove('off'); els.badge.classList.add('on');
  }else{
    els.badge.textContent = 'Not connected';
    els.badge.classList.remove('on'); els.badge.classList.add('off');
  }
}

function startLocal(){
  startTS = Date.now();
  clearInterval(tickInt);
  tickInt = setInterval(tick, 250);
}
function pauseLocal(){
  const delta = Math.floor((Date.now()-startTS)/1000);
  clearInterval(tickInt);
  todaySec += delta;
  localStorage.setItem('todaySec', String(todaySec));
  updateWeeklySpent(delta);
  renderDayTotals();
}
function stopLocal(){
  clearInterval(tickInt);
  els.hh.textContent='00'; els.mm.textContent='00'; els.ss.textContent='00';
}

async function startSession(){
  const projectId = els.project.value;
  if(!projectId){ alert('Please choose a Project first.'); return; }
  startLocal();
  const res = await tryJson(`/api/time/start`, { projectId });
  if(res && res.sessionId){ localStorage.setItem('lastSessionId', res.sessionId); }
}
async function pauseSession(){
  const delta = Math.floor((Date.now()-startTS)/1000);
  pauseLocal();
  const id = localStorage.getItem('lastSessionId');
  if(id){ await tryJson(`/api/time/pause`, { sessionId:id, delta }); }
}
async function stopSession(){
  const delta = Math.floor((Date.now()-startTS)/1000);
  stopLocal();
  const id = localStorage.getItem('lastSessionId');
  if(id){ await tryJson(`/api/time/stop`, { sessionId:id, delta }); localStorage.removeItem('lastSessionId'); }
}
async function deleteLast(){
  const UNDO = 5*60;
  todaySec = Math.max(0, todaySec-UNDO);
  localStorage.setItem('todaySec', String(todaySec));
  updateWeeklySpent(-UNDO);
  renderDayTotals();
  await tryJson(`/api/time/delete-last`, {});
}

function wire(){
  const d = new Date();
  els.date.textContent = d.toLocaleDateString(undefined, { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  rolloverTotalsAtMidnight();
  loadDayTotals();
  resetWeekIfNeeded();
  loadGoal();

  els.go.addEventListener('click', startSession);
  els.pause.addEventListener('click', pauseSession);
  els.stop.addEventListener('click', stopSession);
  els.oops.addEventListener('click', deleteLast);

  els.goalBtn.addEventListener('click', ()=>goalDialog.showModal());
  els.goalSave.addEventListener('click', (e)=>{
    e.preventDefault();
    const v = Number(els.goalHours.value||0);
    saveGoal(v);
    goalDialog.close();
  });

  els.connect.addEventListener('click', ()=>{
    window.location.href = `/api/auth-start`;
  });

  checkConnection();
  populateProjects();
}

document.addEventListener('DOMContentLoaded', wire);
