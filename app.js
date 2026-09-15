const LS_SESS='fl-sessions', LS_SET='fl-settings';
let settings=JSON.parse(localStorage.getItem(LS_SET)||'null') || {focus:25, break:5, longBreak:15, longEvery:4, auto:false, sound:true, notify:true, preset:'25/5'};
let sessions=JSON.parse(localStorage.getItem(LS_SESS)||'null') || seed();

function seed(){
  const now=Date.now();
  const arr=[];
  const days=[6,5,4,3,2,1,0];
  const presets=['25/5','50/10','25/5','45/15'];
  days.forEach((d,i)=>{
    const n = i===0?2 : i%2===0?3:2;
    for(let j=0;j<n;j++){
      const start=new Date(); start.setDate(start.getDate()-d); start.setHours(9 + j*2 + Math.floor(Math.random()*2), Math.floor(Math.random()*60),0,0);
      const dur=[25,50,45,25][Math.floor(Math.random()*4)];
      const interruptions=Math.random()<0.6? 0 : Math.ceil(Math.random()*3);
      const focus= interruptions===0? 4+Math.floor(Math.random()*2) : 2+Math.floor(Math.random()*3);
      arr.push({id:uid(), task:['SAT reading','Math drills','Essay draft','Vocab review'][j%4], tag:['SAT','Deep Work','SAT','Other'][j%4], date:start.toISOString().slice(0,10), startTime:start.toISOString(), endTime:new Date(start.getTime()+dur*60000).toISOString(), duration:dur, planned:dur, interruptions, focus, status:'completed', type:'work', preset: presets[j%4]});
    }
  });
  return arr;
}
function uid(){return Math.random().toString(36).slice(2,9)}
function saveAll(){ localStorage.setItem(LS_SESS, JSON.stringify(sessions)); localStorage.setItem(LS_SET, JSON.stringify(settings)); }

// --- Timer ---
let remaining=settings.focus*60, total=settings.focus*60, mode='focus', cycle=1, timerId=null, running=false, intThis=0, startedAt=null;
let currentPreset=settings.preset;

function presets(){
  return [
    {id:'25/5', label:'25 / 5', f:25,b:5, lb:15},
    {id:'50/10', label:'50 / 10', f:50,b:10, lb:20},
    {id:'45/15', label:'45 / 15', f:45,b:15, lb:25},
    {id:'90/20', label:'90 / 20 Flow', f:90,b:20, lb:30},
  ];
}
function renderPresets(){
  const el=document.getElementById('presets');
  el.innerHTML=presets().map(p=>`<button class="preset ${currentPreset===p.id?'active':''}" onclick="applyPreset('${p.id}')">${p.label}</button>`).join('') + `<button class="preset ${currentPreset==='custom'?'active':''}" onclick="applyPreset('custom')">Custom</button>`;
}
function applyPreset(id){
  currentPreset=id;
  if(id==='custom'){ settings.preset='custom'; }
  else {
    const p=presets().find(x=>x.id===id);
    settings.focus=p.f; settings.break=p.b; settings.longBreak=p.lb; settings.preset=id;
    saveAll();
    if(mode==='focus'){ remaining=settings.focus*60; total=remaining; updateDisplay(); }
  }
  renderPresets(); updateStats();
}
function updateDisplay(){
  const m=Math.floor(remaining/60).toString().padStart(2,'0');
  const s=(remaining%60).toString().padStart(2,'0');
  document.getElementById('timeDisplay').textContent=`${m}:${s}`;
  document.getElementById('modeLabel').textContent= mode==='focus'? 'FOCUS' : (cycle % settings.longEvery===0? 'LONG BREAK' : 'BREAK');
  document.getElementById('cycleLabel').textContent=`#${cycle} • ${mode==='focus' ? 'Focus' : 'Break'}`;
  const circ=2*Math.PI*88, pct= 1 - remaining/total;
  document.getElementById('progress').style.strokeDashoffset= circ - circ*pct;
  document.getElementById('progress').style.stroke = mode==='focus'? '#5b5bd6' : '#059669';
  document.getElementById('startBtn').textContent = running? '⏸ Pause' : '▶ Start';
}
function toggleTimer(){
  if(document.getElementById('ratingBox').style.display==='block'){ return; }
  if(running){ pause(); } else { start(); }
}
function start(){
  if(!document.getElementById('taskInput').value.trim() && mode==='focus'){
    // allow empty but nudge
  }
  running=true;
  startedAt=startedAt||new Date();
  timerId=setInterval(tick,1000);
  updateDisplay();
  if(window.Notification && settings.notify && Notification.permission==='default'){ Notification.requestPermission(); }
}
function pause(){ running=false; clearInterval(timerId); updateDisplay(); }
function resetTimer(){
  pause();
  remaining = (mode==='focus'? settings.focus : (cycle%settings.longEvery===0? settings.longBreak: settings.break))*60;
  total=remaining; intThis=0; document.getElementById('intCount').textContent='0'; document.getElementById('ratingBox').style.display='none'; startedAt=null; updateDisplay();
}
function skip(){
  // complete early as if finished
  remaining=0; tick();
}
function tick(){
  if(remaining>0){ remaining--; updateDisplay(); return; }
  // finished
  pause();
  beep();
  notify(`${mode==='focus'?'Focus done':'Break over'} — ${document.getElementById('taskInput').value||'Session'} finished`);
  if(mode==='focus'){
    // ask for rating
    document.getElementById('ratingBox').style.display='block';
    renderStars(0);
  } else {
    // break finished -> next focus
    cycle++;
    mode='focus';
    remaining=settings.focus*60; total=remaining; intThis=0; document.getElementById('intCount').textContent='0'; startedAt=null;
    updateDisplay();
    if(settings.auto) start();
  }
}
function beep(){
  if(!settings.sound) return;
  try{
    const ctx=new (window.AudioContext||window.webkitAudioContext)();
    const o=ctx.createOscillator(), g=ctx.createGain();
    o.type='sine'; o.frequency.value=880; o.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.2, ctx.currentTime);
    o.start(); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime+0.6); o.stop(ctx.currentTime+0.6);
  }catch(e){}
}
function notify(msg){
  if(settings.notify && window.Notification && Notification.permission==='granted'){ new Notification('Focus Lab', {body: msg}); }
}
function addInterruption(){ if(mode!=='focus') return; intThis++; document.getElementById('intCount').textContent=intThis; }
let chosenFocus=0;
function renderStars(v){
  chosenFocus=v;
  document.getElementById('stars').innerHTML=[1,2,3,4,5].map(n=>`<div class="star ${v>=n?'active':''}" onclick="renderStars(${n})">${n}</div>`).join('');
}
function saveSession(){
  if(!chosenFocus){ alert('Pick a focus rating 1-5'); return; }
  const task=document.getElementById('taskInput').value.trim()||'Untitled';
  const tag=document.getElementById('tagInput').value.trim();
  const dur=Math.round((total - remaining)/60) || settings.focus;
  // we saved remaining=0, so total is planned. For early skip, use elapsed
  const elapsed = Math.max(1, Math.round((total - remaining)/60) || total/60 );
  // actually for completed, duration = planned focus minutes (if finished) else elapsed
  const planned=settings.focus;
  const duration = remaining===0? planned : Math.max(1, planned - Math.ceil(remaining/60));
  const now=new Date();
  sessions.unshift({id:uid(), task, tag, date: now.toISOString().slice(0,10), startTime: (startedAt||now).toISOString(), endTime: now.toISOString(), duration: duration, planned, interruptions: intThis, focus: chosenFocus, status:'completed', type:'work', preset: currentPreset});
  saveAll();
  // reset for next
  document.getElementById('ratingBox').style.display='none';
  intThis=0; document.getElementById('intCount').textContent='0'; chosenFocus=0; startedAt=null;
  cycle++;
  mode='break';
  const breakDur = cycle % settings.longEvery===0 ? settings.longBreak : settings.break;
  remaining=breakDur*60; total=remaining; updateDisplay();
  if(settings.auto) start();
  renderAll();
}
function discardSession(){
  document.getElementById('ratingBox').style.display='none';
  intThis=0; document.getElementById('intCount').textContent='0'; chosenFocus=0; startedAt=null;
  // go to break
  mode='break';
  const breakDur = cycle % settings.longEvery===0 ? settings.longBreak : settings.break;
  remaining=breakDur*60; total=remaining; updateDisplay();
}

function switchTab(id){
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelector(`[data-tab="${id}"]`).classList.add('active');
  if(id==='analytics') renderAnalytics();
  if(id==='sessions') renderSessions();
  if(id==='report') prepareReport();
}
function openSettings(){
  document.getElementById('sFocusMin').value=settings.focus;
  document.getElementById('sBreakMin').value=settings.break;
  document.getElementById('sLongMin').value=settings.longBreak;
  document.getElementById('sLongEvery').value=settings.longEvery;
  document.getElementById('sAuto').checked=settings.auto;
  document.getElementById('sSound').checked=settings.sound;
  document.getElementById('sNotify').checked=settings.notify;
  document.getElementById('settingsModal').style.display='grid';
}
function closeSettings(){ document.getElementById('settingsModal').style.display='none'; }
function saveSettings(){
  settings.focus=parseInt(document.getElementById('sFocusMin').value)||25;
  settings.break=parseInt(document.getElementById('sBreakMin').value)||5;
  settings.longBreak=parseInt(document.getElementById('sLongMin').value)||15;
  settings.longEvery=parseInt(document.getElementById('sLongEvery').value)||4;
  settings.auto=document.getElementById('sAuto').checked;
  settings.sound=document.getElementById('sSound').checked;
  settings.notify=document.getElementById('sNotify').checked;
  settings.preset=currentPreset;
  saveAll();
  remaining=settings.focus*60; total=remaining; updateDisplay(); updateStats(); closeSettings();
}
function updateStats(){
  const today=new Date().toISOString().slice(0,10);
  const todayM=sessions.filter(s=> s.date===today && s.type==='work').reduce((a,s)=>a+s.duration,0);
  document.getElementById('timerStats').innerHTML=`
    <div class="stat"><small>Today focus</small><b>${todayM} min</b><div style="font-size:11px;color:#6b7280">${sessions.filter(s=>s.date===today).length} sessions</div></div>
    <div class="stat"><small>Avg focus</small><b>${avgFocus().toFixed(1)}/5</b><div style="font-size:11px;color:#6b7280">last ${Math.min(sessions.length,10)} sessions</div></div>
    <div class="stat"><small>Streak</small><b>${streak()} days</b><div style="font-size:11px;color:#6b7280">with ≥1 session</div></div>
  `;
}
function avgFocus(){ if(!sessions.length) return 0; return sessions.slice(0,20).reduce((a,s)=>a+s.focus,0)/Math.min(sessions.length,20); }
function streak(){
  const dates=[...new Set(sessions.map(s=>s.date))].sort().reverse();
  let c=0; let cur=new Date();
  for(let i=0;i<30;i++){
    const d=cur.toISOString().slice(0,10);
    if(dates.includes(d)){ c++; cur.setDate(cur.getDate()-1); } else break;
  }
  return c;
}

// Analytics
function inRange(d, days){
  if(days===0) return true;
  const now=new Date(); const from=new Date(); from.setDate(now.getDate()-days+1);
  return new Date(d) >= new Date(from.toISOString().slice(0,10));
}
function filteredByRange(){
  const days=parseInt(document.getElementById('range').value);
  return sessions.filter(s=> s.type==='work' && inRange(s.date, days));
}
function renderAnalytics(){
  const range=parseInt(document.getElementById('range').value);
  const data=filteredByRange();
  const totalM=data.reduce((a,s)=>a+s.duration,0);
  const avgF=data.length? (data.reduce((a,s)=>a+s.focus,0)/data.length).toFixed(1): '—';
  const intRate=data.length? (data.reduce((a,s)=>a+s.interruptions,0)/data.length).toFixed(1): '—';
  const deep=data.filter(s=> s.duration>=25 && s.interruptions===0 && s.focus>=4).length;
  const deepPct=data.length? Math.round(deep/data.length*100):0;
  document.getElementById('kpis').innerHTML=`
    <div class="kpi"><small>Total focus</small><b>${totalM} min</b><div style="font-size:11px;color:#6b7280">${data.length} sessions</div></div>
    <div class="kpi"><small>Avg focus</small><b>${avgF}/5</b><div style="font-size:11px;color:#6b7280">deep ${deepPct}%</div></div>
    <div class="kpi"><small>Interruptions</small><b>${intRate}/sess</b><div style="font-size:11px;color:#6b7280">total ${data.reduce((a,s)=>a+s.interruptions,0)}</div></div>
    <div class="kpi"><small>Streak</small><b>${streak()} days</b><div style="font-size:11px;color:#6b7280">consistency</div></div>
  `;
  // daily
  const days=range===0? 14 : range;
  const now=new Date();
  const daily=[];
  for(let i=days-1;i>=0;i--){ const d=new Date(now); d.setDate(now.getDate()-i); const k=d.toISOString().slice(0,10); daily.push({label: d.toLocaleDateString('en',{month:'short',day:'numeric'}), m: data.filter(s=>s.date===k).reduce((a,s)=>a+s.duration,0)}); }
  const maxD=Math.max(1,...daily.map(d=>d.m));
  document.getElementById('dailyChart').innerHTML=daily.map(d=>`<div class="bar-row"><span>${d.label}</span><div class="bar"><div class="bar-fill" style="width:${d.m/maxD*100}%"></div></div><span style="font-weight:700">${d.m}m</span></div>`).join('');

  // hourly
  const hours=Array.from({length:24},(_,h)=>({h, m: data.filter(s=> new Date(s.startTime).getHours()===h).reduce((a,s)=>a+s.duration,0), c: data.filter(s=> new Date(s.startTime).getHours()===h).length, f: data.filter(s=> new Date(s.startTime).getHours()===h).reduce((a,s)=>a+s.focus,0)}));
  const maxH=Math.max(1,...hours.map(x=>x.m));
  document.getElementById('hourChart').innerHTML=hours.filter(x=>x.m>0).slice(0,12).map(x=>`<div class="bar-row"><span>${String(x.h).padStart(2,'0')}:00</span><div class="bar"><div class="bar-fill" style="width:${x.m/maxH*100}%"></div></div><span style="font-weight:700">${x.m}m • ${x.c? (x.f/x.c).toFixed(1):'-'}</span></div>`).join('') || '<div style="font-size:12px;color:#6b7280">No data for this range.</div>';

  // technique
  const presetsList=[...new Set(data.map(s=>s.preset))];
  const byTech=presetsList.map(p=>{ const arr=data.filter(s=>s.preset===p); return {p, avg: arr.reduce((a,s)=>a+s.focus,0)/arr.length, m: Math.round(arr.reduce((a,s)=>a+s.duration,0)/arr.length), n:arr.length}; });
  const maxT=Math.max(1,...byTech.map(x=>x.avg));
  document.getElementById('techChart').innerHTML=byTech.map(x=>`<div class="bar-row"><span>${x.p} • ${x.n}</span><div class="bar"><div class="bar-fill" style="width:${x.avg/maxT*100}%"></div></div><span style="font-weight:700">${x.avg.toFixed(1)} • ${x.m}m</span></div>`).join('') || '<div style="font-size:12px;color:#6b7280">Use different presets to compare.</div>';

  // scatter interruptions vs focus
  const sc=document.getElementById('scatter');
  sc.innerHTML='';
  const W=sc.clientWidth||320, H=160, pad=20;
  // axes
  const dotSize=6;
  // grid
  const xMax=Math.max(3, ...data.map(d=>d.interruptions));
  const yMax=5;
  data.slice(0,80).forEach(d=>{
    const x= pad + (d.interruptions/xMax)*(W-pad*2);
    const y= H-pad - (d.focus/yMax)*(H-pad*2);
    const dot=document.createElement('div');
    dot.style.position='absolute'; dot.style.left=x+'px'; dot.style.top=y+'px'; dot.style.width=dotSize+'px'; dot.style.height=dotSize+'px'; dot.style.borderRadius='999px'; dot.style.background=d.focus>=4? '#059669' : d.interruptions>1 ? '#dc2626' : '#5b5bd6'; dot.style.opacity='.9'; dot.title=`${d.task} • ${d.interruptions} int • ${d.focus}/5`;
    sc.appendChild(dot);
  });
  // insights
  const ins=[];
  if(data.length>=5){
    const noIntAvg=data.filter(s=>s.interruptions===0).reduce((a,s)=>a+s.focus,0)/ (data.filter(s=>s.interruptions===0).length||1);
    const intAvg=data.filter(s=>s.interruptions>0).reduce((a,s)=>a+s.focus,0)/ (data.filter(s=>s.interruptions>0).length||1);
    if(noIntAvg && intAvg) ins.push(`Sessions with 0 interruptions score <b>${(noIntAvg - intAvg).toFixed(1)} higher</b> on average (${noIntAvg.toFixed(1)} vs ${intAvg.toFixed(1)}).`);
    const byHour=hours.filter(x=>x.c>=2).sort((a,b)=> (b.f/b.c)-(a.f/a.c));
    if(byHour[0]) ins.push(`Peak focus window: <b>${String(byHour[0].h).padStart(2,'0')}:00</b> (avg ${ (byHour[0].f/byHour[0].c).toFixed(1)}/5, ${byHour[0].c} sessions).`);
    const bestTech=byTech.sort((a,b)=>b.avg-a.avg)[0];
    if(bestTech && byTech.length>1) ins.push(`Best technique for you: <b>${bestTech.p}</b> (avg ${bestTech.avg.toFixed(1)}/5). Try it for deep work.`);
    if(deepPct<20) ins.push(`Only <b>${deepPct}% deep work</b> (≥25m, 0 interruptions, ≥4/5). Aim to block notifications for one daily deep block.`);
    else ins.push(`Strong deep work: <b>${deepPct}%</b> of sessions are deep — keep protecting that block!`);
  } else {
    ins.push('Log at least 5 focus sessions to unlock insights. Samples are preloaded — try your own.');
  }
  document.getElementById('insights').innerHTML=ins.map(i=>`<li>${i}</li>`).join('');
}

function renderSessions(){
  const q=document.getElementById('sQ').value.toLowerCase();
  const type=document.getElementById('sType').value;
  const minF=parseInt(document.getElementById('sFocus').value);
  let list=[...sessions];
  list=list.filter(s=>{
    if(q && !(s.task.toLowerCase().includes(q) || (s.tag||'').toLowerCase().includes(q))) return false;
    if(type!=='all' && s.type!==type) return false;
    if(s.focus < minF) return false;
    return true;
  });
  const tb=document.getElementById('sessBody');
  tb.innerHTML='';
  list.slice(0,100).forEach(s=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${s.date}<div style="font-size:11px;color:#6b7280">${new Date(s.startTime).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div></td><td><b>${s.task}</b><div style="font-size:11px;color:#6b7280">${s.tag||''}</div></td><td>${s.preset}</td><td>${s.duration}m</td><td>${s.interruptions}</td><td>${s.focus}/5</td><td>${s.status}</td><td><button class="btn" onclick="delSession('${s.id}')">Delete</button></td>`;
    tb.appendChild(tr);
  });
  document.getElementById('sessMeta').textContent=`${list.length} sessions • Showing ${Math.min(list.length,100)}`;
}

function delSession(id){ if(confirm('Delete session?')){ sessions=sessions.filter(s=>s.id!==id); saveAll(); renderAll(); } }
function clearAll(){ if(confirm('Clear ALL sessions?')){ sessions=[]; saveAll(); renderAll(); } }
function addSample(){
  const now=new Date();
  sessions.unshift({id:uid(), task:'Sample deep work', tag:'Other', date: now.toISOString().slice(0,10), startTime: now.toISOString(), endTime: new Date(now.getTime()+25*60000).toISOString(), duration:25, planned:25, interruptions:0, focus:5, status:'completed', type:'work', preset:'25/5'});
  saveAll(); renderAll();
}
function exportCSV(){
  if(!sessions.length){ alert('No data'); return; }
  const h=['date','task','tag','preset','duration','planned','interruptions','focus','status','type','startTime','endTime'];
  let csv=h.join(',')+'\n';
  sessions.forEach(s=>{ csv+= h.map(k=>`"${String(s[k]??'').replace(/"/g,'""')}"`).join(',')+'\n';});
  const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='focus_sessions.csv'; a.click(); URL.revokeObjectURL(url);
}
function exportJSON(){
  const data={settings, sessions, exportedAt:new Date().toISOString()};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='focus-lab_backup.json'; a.click(); URL.revokeObjectURL(url);
}
function importJSON(e){
  const f=e.target.files[0]; if(!f) return;
  const r=new FileReader(); r.onload=()=>{
    try{
      const j=JSON.parse(r.result);
      if(j.sessions) sessions=j.sessions;
      if(j.settings) settings=j.settings;
      saveAll(); renderAll(); alert('Imported');
    }catch(err){ alert('Invalid JSON');}
  }; r.readAsText(f); e.target.value='';
}
function prepareReport(){
  const range=parseInt(document.getElementById('range').value);
  const data=filteredByRange();
  const totalM=data.reduce((a,s)=>a+s.duration,0);
  const avgF=data.length? (data.reduce((a,s)=>a+s.focus,0)/data.length).toFixed(1):'—';
  const intAvg=data.length? (data.reduce((a,s)=>a+s.interruptions,0)/data.length).toFixed(1):'—';
  document.getElementById('reportArea').innerHTML=`
    <div class="report-header"><div><h2>Focus Lab — Research Report</h2><div style="font-size:11px;color:#6b7280">Period: ${range===0?'All time':`Last ${range} days`} • Generated ${new Date().toLocaleDateString('en-GB')}</div></div><div style="text-align:right;font-size:11px;color:#6b7280">Sessions: <b style="color:#0f172a">${data.length}</b> • Focus: <b>${avgF}/5</b></div></div>
    <div style="padding:14px 20px;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;background:#f8f9ff">
      <div><b>Total focus:</b> ${totalM} min</div><div><b>Avg interruptions:</b> ${intAvg}/sess</div><div><b>Deep work:</b> ${data.filter(s=>s.duration>=25&&s.interruptions===0&&s.focus>=4).length} sessions</div>
    </div>
    <div style="padding:14px 20px">
      <h4>Insights</h4><ul style="margin:6px 0 0 18px;font-size:12px">${document.getElementById('insights').innerHTML}</ul>
      <h4 style="margin-top:12px">Sessions (filtered)</h4>
      <table class="print-table" style="width:100%;font-size:11px;margin-top:6px;border:1px solid #e6e7ef"><thead><tr><th>Date</th><th>Task</th><th>Preset</th><th>Min</th><th>Int</th><th>Focus</th></tr></thead><tbody>${data.slice(0,50).map(s=>`<tr><td>${s.date}</td><td>${s.task}</td><td>${s.preset}</td><td>${s.duration}</td><td>${s.interruptions}</td><td>${s.focus}</td></tr>`).join('') || '<tr><td colspan="6" style="text-align:center;padding:12px;color:#6b7280">No data</td></tr>'}</tbody></table>
      <div style="margin-top:12px;padding:10px;background:#f8f9ff;border:1px solid #e6e7ef;border-radius:10px;font-size:11px;color:#6b7280"><b>Methodology:</b> Each focus session logs task, planned vs actual minutes, interruptions (self-counted), and 1-5 focus rating. Deep work = ≥25m + 0 interruptions + ≥4/5. Data is local (localStorage), no tracking. Compare techniques by switching presets.</div>
    </div>
  `;
}

function renderAll(){ renderPresets(); updateDisplay(); updateStats(); renderAnalytics(); renderSessions(); prepareReport(); }
renderAll();
