/* CornerMan app: views, actions and wiring. State is S (saved), UI is screen state (not saved).
   Every view is a function that returns HTML; clicks go through data-act -> A[name]. */
(function(CM){
'use strict';
const En=CM.engine,St=CM.store,EXM=CM.EXM,SPM=CM.SPM;
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Math.random().toString(36).slice(2,9);
const today=()=>En.ymd(new Date());
const clamp=En.clamp;
const DOW=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const PARTS=[['knee','Knee'],['shoulder','Shoulder'],['lowback','Low back'],['wrist','Wrist'],['neck','Neck'],['elbow','Elbow'],['hip','Hip'],['ankle','Ankle']];
const JTYPES=[['class','Class'],['sparring','Sparring or rolling'],['openmat','Open mat'],['competition','Competition'],['solo','Solo drilling'],['other','Other training']];
const JT=Object.fromEntries(JTYPES.concat([['note','Note']]));
const WHY=[['compete','Compete'],['health','Fit and healthy for life'],['learn','Learn a martial art'],['comeback','Come back after time off'],['look','Look and feel better'],['job','Ready for a physical job']];
const RHYTHM=[['regular','Regular week'],['shift','Shift work or a changing schedule'],['parent','Parent with little free time'],['student','Student'],['travel','I travel often']];
const RTIP={regular:'Same days each week works best. Your plan follows the order of sessions, not the calendar.',shift:'Sessions are not tied to weekdays. Do the next one whenever your shifts allow.',parent:'Short on time today? Tell the coach "I have 20 minutes" and it trims the session.',student:'Exams or a busy stretch coming? Pick fewer days in your next check-in.',travel:'On the road next week? Choose "Travelling" in your check-in for a bodyweight-only week.'};
const EVTYPES=[['competition','Competition or tournament'],['fight','Fight'],['race','Race'],['grading','Belt test or grading'],['other','Other date']];

let S=St.load();migrate();
function migrate(){
  if(S.profile){S.profile.block=S.profile.block||1;S.profile.why=S.profile.why||[];S.profile.rhythm=S.profile.rhythm||'regular';S.profile.dow=S.profile.dow||[];}
  if(S.plan&&!S.plan.block)S.plan.block=S.profile?S.profile.block:1;
}
const freshUI=()=>({tab:'today',sub:null,week:null,sport:null,skills:'chains',chain:null,jseg:'journal',jf:{type:'',sp:''},lib:'sports',f:{q:'',sp:'',eq:'',d:'',pat:''},pm:'vol',pex:'',vsport:'',confirm:null,clip:{url:'',file:null,notes:[],a:null,b:null,loop:false},ob:null,player:null,settings:false,copybox:null,landing:true,sheet:null,restore:null});
let UI=freshUI();
const save=()=>{if(!St.save(S))toast('This browser is full or blocking storage. Back up your data from Settings.');};

/* ---------------- helpers ---------------- */
const IC={
 today:'<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/>',
 plan:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
 skills:'<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
 journal:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
 progress:'<path d="M3 3v18h18"/><path d="m7 15 4-5 3 3 5-7"/>',
 coach:'<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
 gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>'
};
const ic=k=>'<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">'+IC[k]+'</svg>';
const TABS=[['today','Today'],['plan','Plan'],['skills','Skills'],['journal','Journal'],['progress','Progress'],['coach','Coach']];
const chip=id=>{const s=SPM[id];return s?'<span class="chip"><i style="background:'+s.color+'"></i>'+esc(s.name)+'</span>':'';};
const sportOpts=sel=>CM.SP.map(s=>'<option value="'+s.id+'" '+(s.id===sel?'selected':'')+'>'+esc(s.name)+'</option>').join('');
const opts=(arr,sel)=>arr.map(a=>'<option value="'+esc(a[0])+'" '+(String(sel)===String(a[0])?'selected':'')+'>'+esc(a[1])+'</option>').join('');
function toast(t){const el=$('#toast');el.innerHTML='<div class="toast">'+esc(t)+'</div>';clearTimeout(toast.t);toast.t=setTimeout(()=>{el.innerHTML='';},2800);}
async function copyText(t){try{await navigator.clipboard.writeText(t);toast('Copied to clipboard');}catch(e){UI.copybox=t;renderOverlay();}}
function allSessions(){return S.plan?S.plan.weeks.reduce((a,w)=>a.concat(w.sessions),[]):[];}
const nextSession=()=>allSessions().find(s=>!S.done[s.id]);
const findSession=id=>allSessions().find(s=>s.id===id);
const fmtRpe=r=>Number.isInteger(r)?String(r):r.toFixed(1);
function fmtItem(it){const e=EXM[it.id];if(!e)return '';return(e.u==='m'&&e.pat!=='drill')?it.tgt:it.sets+' × '+it.tgt;}
function est(s){let m=5;s.items.forEach(it=>{const e=EXM[it.id];if(!e)return;if(e.u==='r')m+=it.sets*(0.75+it.rest/60);else if(e.u==='t')m+=it.sets*(parseInt(it.tgt,10)/60+it.rest/60);else if(e.pat==='drill')m+=it.sets*(3+it.rest/60);else m+=parseInt(it.tgt,10);});return Math.max(5,Math.round(m/5)*5);}
function lastSet(id){for(let i=S.hist.length-1;i>=0;i--){const r=S.hist[i].sets.filter(x=>x.ex===id);if(r.length)return r[r.length-1];}return null;}
const volOf=h=>h.sets.reduce((a,s)=>{const e=EXM[s.ex];return a+(e&&e.u==='r'?(s.w||0)*(s.r||0):0);},0);
function streak(){const ds=new Set(S.hist.map(h=>h.date));let d=new Date(),n=0;if(!ds.has(En.ymd(d)))d.setDate(d.getDate()-1);while(ds.has(En.ymd(d))){n++;d.setDate(d.getDate()-1);}return n;}
const fmtDate=s=>{try{return En.parseYmd(s).toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'});}catch(e){return s;}};
const plural=(n,w)=>n+' '+w+(n===1?'':'s');
function dowLabel(i){const d=(S.profile&&S.profile.dow||[]).slice().sort((a,b)=>((a+6)%7)-((b+6)%7));return d.length?DOW[d[i%d.length]]:'';}
const sechead=(h,p)=>'<div class="sechead"><h1>'+h+'</h1>'+(p?'<p class="muted">'+p+'</p>':'')+'</div>';

/* ---------------- install and offline ---------------- */
let deferredPrompt=null;
const standalone=()=>{try{return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;}catch(e){return false;}};
const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const offlineReady=()=>!!(navigator.serviceWorker&&navigator.serviceWorker.controller);
function installHTML(compact){
  if(standalone())return compact?'':'<p class="ok"><b>Installed.</b> CornerMan is running as an app.</p>';
  if(deferredPrompt)return '<div class="row"><button class="btn sm" data-act="install">Install CornerMan</button><span class="muted">Adds it to your home screen and works offline.</span></div>';
  if(isIOS)return '<p>On iPhone or iPad: open this page in Safari, tap <b>Share</b>, then <b>Add to Home Screen</b>.</p>';
  if(compact)return '';
  return '<p class="muted">To install, open CornerMan from its own web address in Chrome, Edge or Safari. Previews inside other apps cannot install.</p>';
}

/* ---------------- views ---------------- */
const logo=()=>'<span class="logo"><b></b>CORNERMAN</span>';
function topbar(){return '<div class="top"><div class="brandm">'+logo()+'</div><button class="iconbtn" data-act="settings" aria-label="Open settings">'+ic('gear')+'</button></div>';}
function topbarPublic(){return '<div class="top"><div>'+logo()+'</div><button class="btn sm ghost" data-act="landing-home">Home</button></div>';}
function sideHTML(){return logo()+TABS.map(t=>'<button data-act="tab" data-v="'+t[0]+'" class="'+(UI.tab===t[0]?'on':'')+'">'+ic(t[0])+t[1]+'</button>').join('')+'<div style="flex:1"></div><button data-act="settings">'+ic('gear')+'Settings</button>';}
function tabsHTML(){return TABS.map(t=>'<button data-act="tab" data-v="'+t[0]+'" class="'+(UI.tab===t[0]?'on':'')+'" aria-label="'+t[1]+'">'+ic(t[0])+t[1]+'</button>').join('');}

const SECTIONS=[
 ['Today','Your next session, your weekly check-in and your event countdown, all on one screen.'],
 ['Plan','Four weeks built around your sport, gear, time and injuries. Weeks 1 to 3 build, week 4 recovers.'],
 ['Skills','Technique chains for jiu-jitsu, MMA, wrestling and boxing, plus 10 sports and a library of '+CM.EX.length+' exercises.'],
 ['Journal','Log classes and sparring, write what you learned, and attach your own clips. Track rounds and what is working.'],
 ['Progress','Charts, your long-term goals with milestones, skill checklists and your check-in history.'],
 ['Coach','An offline coach that shortens, swaps or eases a session and answers technique questions.']
];
function viewLanding(){
  return '<div class="top"><div>'+logo()+'</div><button class="btn sm ghost" data-act="settings">Settings</button></div>'+
  '<section class="hero"><div class="eyebrow">Free training coach · works offline · no account</div><h1>Train smarter in your own corner</h1>'+
  '<p>CornerMan builds a four-week plan around your sport, your gear and your life, then adjusts it every week from a one-minute check-in.</p>'+
  '<div class="row"><button class="btn" data-act="landing-start">Build my plan</button><button class="btn ghost" data-act="landing-browse">Browse the sports</button></div></section>'+
  '<section class="sec"><h2>What you are signing up for</h2><p class="muted">Six sections. Each one does one job.</p><div class="grid">'+SECTIONS.map((s,i)=>'<div class="card"><div class="eyebrow">'+(i+1)+' · '+s[0]+'</div><p>'+esc(s[1])+'</p></div>').join('')+'</div></section>'+
  '<section class="sec"><h2>How it works</h2><div class="grid">'+
  [['Set up in about 2 minutes','Five short steps: sports, goal and time, your life, gear and limits, then a quick health check.'],['Train','Open Today, start the workout, log your sets. The rest timer and your last weights are built in.'],['Check in each week','One minute of questions. Your next week gets easier, harder, shorter or bodyweight-only to fit your life.'],['Start a new block','After four weeks, build the next block. Your history, journal and goals carry over.']].map((s,i)=>'<div class="card"><div class="eyebrow">Step '+(i+1)+'</div><h3>'+s[0]+'</h3><p class="muted">'+s[1]+'</p></div>').join('')+'</div></section>'+
  '<section class="grid"><div class="card"><div class="eyebrow">Safety and scope</div><p>General fitness guidance, not medical advice. Stop and see a doctor for chest pain, dizziness or sharp pain. No crash diets, no dangerous weight cuts.</p></div>'+
  '<div class="card"><div class="eyebrow">Your data</div><p>Everything stays on this device: no account, tracking or ads. Back it up to a file from Settings whenever you like.</p></div>'+
  '<div class="card"><div class="eyebrow">Works offline</div><p>Install it to your home screen and it opens like an app, with or without a signal.</p></div></section>'+
  '<section class="sec"><h2>Ten sports, one coach format</h2><div class="grid">'+CM.SP.map(s=>'<div class="card"><div class="row between"><h3>'+esc(s.name)+'</h3>'+chip(s.id)+'</div><p class="muted">'+esc(s.phil.split('. ')[0])+'.</p></div>').join('')+'</div></section>';
}

function viewOb(){
  const o=UI.ob,st=o.step,N=5;
  const pillbar='<div class="steps" aria-label="Step '+(st+1)+' of '+N+'">'+Array.from({length:N},(x,i)=>'<i class="'+(i<=st?'on':'')+'"></i>').join('')+'</div>';
  const og=(key,list)=>'<div class="opts">'+list.map(x=>'<button class="opt '+(String(o[key])===String(x[0])?'on':'')+'" aria-pressed="'+(String(o[key])===String(x[0]))+'" data-act="ob-set" data-k="'+key+'" data-v="'+x[0]+'">'+x[1]+'</button>').join('')+'</div>';
  const multi=(key,list)=>'<div class="opts">'+list.map(x=>'<button class="opt '+(o[key].includes(x[0])?'on':'')+'" aria-pressed="'+o[key].includes(x[0])+'" data-act="ob-tog" data-k="'+key+'" data-v="'+x[0]+'">'+x[1]+'</button>').join('')+'</div>';
  let body='';
  if(st===0){
    body='<div class="eyebrow">Step 1 of 5 · Sports</div><h1>Pick your sports</h1><p class="muted">Choose up to three. The first one you tap is your main sport.</p><div class="opts">'+CM.SP.map(s=>{const k=o.sports.indexOf(s.id);return '<button class="opt '+(k>=0?'on':'')+'" aria-pressed="'+(k>=0)+'" data-act="ob-sport" data-v="'+s.id+'">'+(k>=0?'<span class="n">'+(k+1)+'</span>':'')+esc(s.name)+'</button>';}).join('')+'</div>';
  }else if(st===1){
    body='<div class="eyebrow">Step 2 of 5 · Goal and time</div><h1>Your goal and time</h1><div class="sec"><div class="eyebrow">Main goal</div>'+og('goal',[['build','Build muscle'],['lose','Lose fat'],['compete','Compete or perform'],['general','General fitness']])+'</div>'+
    '<div class="sec"><div class="eyebrow">Experience</div>'+og('level',[['beginner','Beginner'],['intermediate','Intermediate'],['advanced','Advanced']])+'</div>'+
    '<div class="sec"><div class="eyebrow">Training days per week</div>'+og('days',[[2,'2'],[3,'3'],[4,'4'],[5,'5'],[6,'6']])+'</div>'+
    '<div class="sec"><div class="eyebrow">Time per session</div>'+og('minutes',[[30,'30 min'],[45,'45 min'],[60,'60 min'],[90,'90 min']])+'</div>';
  }else if(st===2){
    body='<div class="eyebrow">Step 3 of 5 · Your life</div><h1>Your bigger picture</h1><p class="muted">All optional. It helps CornerMan fit around your life instead of the other way round.</p>'+
    '<div class="sec"><div class="eyebrow">What is this for? Pick any</div>'+multi('why',WHY)+'</div>'+
    '<div class="sec"><div class="eyebrow">Your week looks like</div>'+og('rhythm',RHYTHM)+'</div>'+
    '<div class="sec"><div class="eyebrow">Days you usually train</div><div class="opts">'+[1,2,3,4,5,6,0].map(d=>'<button class="opt '+(o.dow.includes(d)?'on':'')+'" aria-pressed="'+o.dow.includes(d)+'" data-act="ob-dow" data-v="'+d+'">'+DOW[d]+'</button>').join('')+'</div></div>'+
    '<div class="sec"><div class="eyebrow">Training for an event?</div><div class="grid"><div class="field"><label for="obevn">Event name</label><input type="text" id="obevn" data-in="obevn" value="'+esc(o.evName)+'" placeholder="Spring open, first fight, 10k"></div><div class="field"><label for="obevd">Date</label><input type="date" id="obevd" data-in="obevd" value="'+esc(o.evDate)+'" min="'+today()+'"></div></div><p class="muted">Adds a countdown with phases and a taper in the final week.</p></div>';
  }else if(st===3){
    body='<div class="eyebrow">Step 4 of 5 · Gear and limits</div><h1>Gear and limits</h1><div class="sec"><div class="eyebrow">Equipment you have (bodyweight is always included)</div><div class="opts">'+[['db','Dumbbells'],['band','Resistance bands'],['bar','Pull-up bar'],['gym','Full gym']].map(x=>'<button class="opt '+(o.equip.includes(x[0])?'on':'')+'" aria-pressed="'+o.equip.includes(x[0])+'" data-act="ob-tog" data-k="equip" data-v="'+x[0]+'">'+x[1]+'</button>').join('')+'</div></div>'+
    '<div class="sec"><div class="eyebrow">Injuries or areas to protect</div>'+multi('injuries',PARTS)+'<p class="muted">Exercises that load these areas are left out of your plan.</p></div>';
  }else{
    const q=['I have no chest pain, fainting or unexplained shortness of breath when I exercise.','A doctor has not told me to avoid exercise.','I understand CornerMan gives general fitness guidance, not medical advice.','I will stop and get medical help if I feel chest pain, dizziness or sharp pain.'];
    const gl={build:'build muscle',lose:'lose fat',compete:'compete or perform',general:'general fitness'}[o.goal];
    body='<div class="eyebrow">Step 5 of 5 · Review</div><h1>Here is what you get</h1>'+
    '<div class="card"><ul class="mini">'+
      '<li><span>Sports</span><span>'+esc(o.sports.map(s=>SPM[s].name).join(', '))+'</span></li>'+
      '<li><span>Goal</span><span>'+esc(gl)+' · '+esc(o.level)+'</span></li>'+
      '<li><span>Schedule</span><span>'+o.days+' days × '+o.minutes+' min'+(o.dow.length?' · '+o.dow.slice().sort((a,b)=>((a+6)%7)-((b+6)%7)).map(d=>DOW[d]).join(' '):'')+'</span></li>'+
      '<li><span>Gear</span><span>'+esc(o.equip.length?o.equip.join(', '):'bodyweight')+'</span></li>'+
      '<li><span>Protecting</span><span>'+esc(o.injuries.length?o.injuries.map(p=>p==='lowback'?'low back':p).join(', '):'nothing')+'</span></li>'+
      (o.evDate?'<li><span>Event</span><span>'+esc(o.evName||'My event')+' · '+esc(fmtDate(o.evDate))+'</span></li>':'')+
    '</ul><p>A four-week plan, a one-minute check-in at the end of each week that adjusts the next one, and a new block every four weeks. You can change any of this later in Settings.</p></div>'+
    '<h2>Quick health check</h2><p class="muted">Confirm all four to finish.</p><div class="card">'+q.map((t,i)=>'<label class="check"><input type="checkbox" id="ok'+i+'" data-act="ob-ok" data-v="'+i+'" '+(o.ok[i]?'checked':'')+'><span>'+t+'</span></label>').join('')+'</div><p class="muted">If you answered no to the first two, check with a doctor before starting.</p>';
  }
  const can=st===0?o.sports.length>0:st===4?o.ok.every(Boolean):true;
  return '<div class="top"><div>'+logo()+'</div></div>'+pillbar+'<div class="sec">'+body+'</div><div class="row"><button class="btn ghost" data-act="ob-back">Back</button>'+(st<4?'<button class="btn" data-act="ob-next" '+(can?'':'disabled')+'>Next</button>':'<button class="btn" data-act="ob-finish" '+(can?'':'disabled')+'>Build my plan</button>')+'</div>';
}

function countdownCard(compact){
  const ev=En.nextEvent(S.events,new Date());
  if(!ev)return compact?'':'<div class="card"><div class="eyebrow">Countdown</div><p>Training for a competition, fight, race or belt test? Add the date and CornerMan runs a countdown with phases and tapers your final week.</p><div class="row"><button class="btn sm ghost" data-act="event-open">Add an event</button></div></div>';
  const ph=En.phaseFor(ev.days),order=['base','build','sharpen','taper','eve','day'],pi=order.indexOf(ph?ph.id:'');
  const camp=S.camp[today()]||{};
  const big=ev.days>0?'<span class="big mono">'+ev.days+'</span><span><b>'+plural(ev.days,'day').replace(/^\d+ /,'')+' to go</b><br><span class="muted">'+esc(fmtDate(ev.date))+'</span></span>':ev.days===0?'<span class="big">Today</span>':'<span class="big mono">'+(-ev.days)+'</span><span><b>'+plural(-ev.days,'day').replace(/^\d+ /,'')+' since</b><br><span class="muted">'+esc(fmtDate(ev.date))+'</span></span>';
  return '<section class="card next"><div class="tape"></div><div class="pad"><div class="row between"><div class="eyebrow">'+esc(ev.name)+'</div>'+chip(ev.sport)+'</div><div class="countdown">'+big+'</div>'+
  (ph&&ph.id!=='after'?'<div class="phasebar" aria-hidden="true">'+order.map((x,i)=>'<i class="'+(i===pi?'on':i<pi?'past':'')+'"></i>').join('')+'</div>':'')+
  (ph?'<h3>'+esc(ph.name)+'</h3><p>'+esc(ph.focus)+'</p>':'')+
  (ph?'<div class="sec"><div class="eyebrow">Today\'s camp checklist</div>'+ph.camp.map((t,i)=>'<label class="check"><input type="checkbox" id="camp'+i+'" data-act="camp" data-i="'+i+'" '+(camp[ph.id+i]?'checked':'')+'><span>'+esc(t)+'</span></label>').join('')+'</div>':'')+
  '<div class="row"><button class="btn sm ghost" data-act="event-open" data-id="'+ev.id+'">Edit event</button>'+(ev.days<0?'<button class="btn sm ghost" data-act="jlog-open">Write my debrief</button>':'')+'</div></div></section>';
}
function viewToday(){
  const P=S.profile,main=SPM[P.sports[0]],ns=nextSession(),sess=allSessions(),now=new Date();
  const doneN=sess.filter(s=>S.done[s.id]).length;
  const wk=ns?ns.wk:4,ws=sess.filter(s=>s.wk===wk),wd=ws.filter(s=>S.done[s.id]).length,W=S.plan.weeks[wk-1];
  const dt=now.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'});
  const due=En.checkinDue(S,now);
  let rhythm='';
  if(P.dow&&P.dow.length){const td=now.getDay();rhythm=P.dow.includes(td)?'Training day in your rhythm.':'Rest day in your rhythm. Training today is fine too.';}
  let hero;
  if(ns){
    const ef=En.effectiveItems(S,ns,now),view={items:ef.items};
    hero='<section class="card next"><div class="tape"></div><div class="pad"><div class="eyebrow">Next · Week '+ns.wk+' · '+En.WKNAME[ns.wk-1]+'</div><h1>'+esc(ns.name)+'</h1><div class="row">'+chip(ns.sport)+(ef.taper?'<span class="chip">Tapered for '+esc(ef.event.name)+'</span>':'')+'<span class="mono muted">'+ef.items.length+' moves · about '+est(view)+' min</span></div><ul class="mini">'+ef.items.slice(0,4).map(it=>'<li><span>'+esc(EXM[it.id].name)+'</span><span>'+fmtItem(it)+'</span></li>').join('')+(ef.items.length>4?'<li><span class="muted">and '+(ef.items.length-4)+' more</span><span></span></li>':'')+'</ul><div class="row"><button class="btn" data-act="start" data-id="'+ns.id+'">Start workout</button><button class="btn ghost" data-act="tab" data-v="plan">See full plan</button></div></div></section>';
  }else{
    const lv=En.suggestLevelUp(S);
    hero='<section class="card"><div class="eyebrow">Block '+(S.plan.block||1)+' complete</div><h1>Four weeks done</h1><p>You finished all '+sess.length+' sessions. Your history, journal and goals carry into the next block.</p>'+
    (lv?'<label class="check"><input type="checkbox" id="lvup" checked><span>Move me up to '+(P.level==='beginner'?'intermediate':'advanced')+'. Two check-ins this block said training felt easy.</span></label>':'')+
    '<div class="row"><button class="btn" data-act="newblock">Build my next block</button></div></section>';
  }
  const ci=due?'<section class="card next"><div class="tape"></div><div class="pad"><div class="eyebrow">Week '+due+' check-in · about 1 minute</div><h2>How did the week go?</h2><p>Answer five quick questions and CornerMan adjusts next week: easier, harder, fewer days or bodyweight-only.</p><div class="row"><button class="btn" data-act="checkin-open">Start check-in</button></div></div></section>':'';
  const banner=S.set.bannerOff?'':'<div class="banner"><p><b>Your data stays on this device.</b> No account needed. Back it up to a file in Settings.</p><button class="btn sm ghost" data-act="banner-off">Got it</button></div>';
  const inst=(!S.set.installOff&&!standalone()&&(deferredPrompt||isIOS))?'<div class="banner"><div class="sec">'+installHTML(true)+'</div><button class="btn sm ghost" data-act="install-off">Not now</button></div>':'';
  const adaptNote=W&&(W.adapt||W.travel)?'<p class="muted">Adjusted after your check-in: '+[W.adapt==='eased'?'eased off':W.adapt==='harder'?'a little harder':W.adapt==='repeat'?'repeating last week\'s targets':'',W.travel?'bodyweight only':''].filter(Boolean).join(', ')+'.</p>':'';
  return topbar()+'<div class="sec"><div class="eyebrow">'+esc(dt)+'</div>'+(rhythm?'<p class="muted">'+rhythm+'</p>':'')+'</div>'+banner+inst+
  '<div class="cols"><div class="sec">'+ci+hero+'<div class="stats"><div class="stat"><span class="eyebrow">Streak</span><b>'+streak()+'</b><span class="muted">days</span></div><div class="stat"><span class="eyebrow">This week</span><b>'+wd+'/'+ws.length+'</b><span class="muted">sessions</span></div><div class="stat"><span class="eyebrow">Block</span><b>'+doneN+'</b><span class="muted">of '+sess.length+'</span></div></div></div>'+
  '<div class="sec">'+countdownCard(false)+
  '<div class="card"><div class="row between"><div class="eyebrow">Coaching cue</div>'+chip(main.id)+'</div><p style="font-size:18px">'+esc(main.cue)+'</p></div>'+
  '<div class="card"><div class="eyebrow">Week '+wk+' focus</div><p>'+En.WKHINT[wk-1]+'</p>'+adaptNote+'<p class="muted">'+esc(RTIP[P.rhythm]||RTIP.regular)+'</p></div>'+
  '<form class="card composer" data-submit="quick-note"><div class="eyebrow">Journal</div><label for="qnote"><b>What did you learn today?</b></label><textarea id="qnote" placeholder="Kept my elbows tight in closed guard and hit the hip bump twice"></textarea><div class="row"><button class="btn sm" type="submit">Save note</button><button class="btn sm ghost" type="button" data-act="tab" data-v="journal">Open journal</button></div></form>'+
  '</div></div>';
}

function sessionCard(s,i,now){
  const dn=S.done[s.id],ef=En.effectiveItems(S,s,now),d=dowLabel(i);
  return '<article class="card sess"><div class="row between"><h3>'+esc(s.name)+'</h3>'+(dn?'<span class="done-badge">DONE '+esc(dn)+'</span>':(d?'<span class="weekday muted">'+d+'</span>':''))+'</div><div class="row">'+chip(s.sport)+(ef.taper&&!dn?'<span class="chip">Tapered</span>':'')+'<span class="mono muted">about '+est({items:ef.items})+' min</span></div><ul class="mini">'+ef.items.map(it=>'<li><span>'+esc(EXM[it.id].name)+(it.fin?' <span class="chip">finisher</span>':'')+'</span><span>'+fmtItem(it)+' · RPE '+fmtRpe(it.rpe)+'</span></li>').join('')+'</ul><div class="row"><button class="btn sm" data-act="start" data-id="'+s.id+'">'+(dn?'Do it again':'Start')+'</button><button class="btn sm ghost" data-act="share" data-id="'+s.id+'">Share to community</button></div></article>';
}
function viewPlan(){
  const now=new Date(),wk=UI.week||(nextSession()?nextSession().wk:1),W=S.plan.weeks[wk-1],P=S.profile;
  const tags=[W.adapt==='eased'?'Eased after check-in':W.adapt==='harder'?'Harder after check-in':W.adapt==='repeat'?'Repeats last week\'s targets':'',W.travel?'Bodyweight only (travel)':''].filter(Boolean);
  const cis=(S.checkins||[]).filter(c=>c.block===(S.plan.block||1));
  return topbar()+sechead('Your plan','Block '+(S.plan.block||1)+' · '+P.days+' days a week · '+P.minutes+' min. Weeks 1 to 3 build and week 4 recovers. A check-in after each week adjusts the next one.')+
  '<div class="row"><button class="btn sm" data-act="checkin-open">Check in now</button><button class="btn sm ghost" data-act="community">Community routines</button></div>'+
  '<div class="week" role="tablist">'+S.plan.weeks.map(w=>'<button class="opt '+(w.n===wk?'on':'')+'" role="tab" aria-selected="'+(w.n===wk)+'" data-act="week" data-v="'+w.n+'">Week '+w.n+(w.n===4?' · Recovery':'')+'</button>').join('')+'</div>'+
  '<div class="banner"><p><b>'+En.WKNAME[wk-1]+'.</b> '+En.WKHINT[wk-1]+(tags.length?'<br><span class="muted">'+esc(tags.join(' · '))+'</span>':'')+'</p></div><div class="grid">'+W.sessions.map((s,i)=>sessionCard(s,i,now)).join('')+'</div>'+
  (cis.length?'<details class="ex"><summary><b>Check-ins this block ('+cis.length+')</b><span class="chip">history</span></summary><div class="body">'+cis.map(c=>'<div class="sec"><div class="eyebrow">Week '+c.week+' · '+esc(fmtDate(c.date))+' · '+c.done+'/'+c.planned+' sessions</div><ul class="list-plain">'+c.changes.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div>').join('')+'</div></details>':'')+
  '<div class="row"><button class="btn ghost" data-act="copyplan">Copy plan as text</button><button class="btn ghost '+(UI.confirm==='regen'?'danger':'')+'" data-act="regen">'+(UI.confirm==='regen'?'Tap again to rebuild (resets checkmarks)':'Regenerate plan')+'</button></div>';
}

/* ---- skills: chains, sports, exercise library ---- */
function chainCard(c){
  const pr=En.chainProgress(S,c);
  return '<button class="card" style="text-align:left;cursor:pointer" data-act="chain-open" data-v="'+esc(c.id)+'"><div class="row between"><h3>'+esc(c.name)+'</h3><span class="chip">'+esc(c.level)+'</span></div><div class="row">'+c.sports.map(chip).join('')+'</div><p class="muted">'+esc(c.goal)+'</p><div class="meter" aria-hidden="true"><i style="width:'+Math.round(100*pr.score/pr.max)+'%"></i></div><span class="mono muted">'+pr.live+' of '+c.steps.length+' links hit live</span></button>';
}
function viewChain(id){
  const c=En.allChains(S).find(x=>x.id===id);if(!c){UI.chain=null;return viewSkills();}
  const st=S.chainStatus||{},pr=En.chainProgress(S,c);
  return topbar()+'<button class="btn sm ghost" data-act="chain-close">All chains</button><div class="row between"><h1>'+esc(c.name)+'</h1><span class="chip">'+esc(c.level)+'</span></div><div class="row">'+c.sports.map(chip).join('')+'</div><p>'+esc(c.goal)+'</p>'+
  (c.safety?'<div class="banner warn"><p><b>Safety.</b> '+esc(c.safety)+'</p></div>':'')+
  '<div class="card"><div class="eyebrow">How to learn a chain</div><p>One link at a time. <b>Drill</b> it with a cooperative partner until it is automatic, then hit it in <b>positional</b> sparring from that start position, then <b>live</b>. Mark each link as you go. Your journal can update these too.</p><div class="meter" aria-hidden="true"><i style="width:'+Math.round(100*pr.score/pr.max)+'%"></i></div><span class="mono muted">'+pr.live+' of '+c.steps.length+' links hit live</span></div>'+
  '<div class="card chain">'+c.steps.map((s,i)=>{const v=st[c.id+':'+i]||0,dr=s.drill&&EXM[s.drill];
    return '<div class="link"><div class="dot2 s'+v+'" aria-hidden="true">'+(v>=3?'✓':i+1)+'</div><div class="what">'+(s.pos?'<div class="eyebrow">From: '+esc(s.pos)+'</div>':'')+'<h3>'+esc(s.move)+'</h3>'+(s.cue?'<p>'+esc(s.cue)+'</p>':'')+
    (s.if||[]).map(x=>'<p class="ifthen"><b>If '+esc(x[0].charAt(0).toLowerCase()+x[0].slice(1))+':</b> '+esc(x[1])+'</p>').join('')+
    (dr?'<p class="muted">Drill: '+esc(dr.name)+'</p>':'')+
    '<div class="lvls" role="group" aria-label="Status for link '+(i+1)+'">'+CM.LEVELS.map((l,k)=>'<button class="'+(v===k?'on':'')+'" aria-pressed="'+(v===k)+'" data-act="lvl" data-c="'+esc(c.id)+'" data-i="'+i+'" data-v="'+k+'">'+l+'</button>').join('')+'</div></div></div>';}).join('')+'</div>'+
  '<div class="row"><button class="btn" data-act="chain-drills" data-v="'+esc(c.id)+'">Add these drills to my next session</button><button class="btn ghost" data-act="jlog-open" data-chain="'+esc(c.id)+'">Log a session with this chain</button>'+(c.mine?'<button class="btn ghost '+(UI.confirm==='chdel'?'danger':'')+'" data-act="chain-del" data-v="'+esc(c.id)+'">'+(UI.confirm==='chdel'?'Tap again to delete':'Delete my chain')+'</button>':'')+'</div>';
}
function sportHTML(id){
  const s=SPM[id],P=S.profile,days=clamp(P?P.days:3,2,6),tpl=(En.WK[id]||En.WK.bodybuilding)[days];
  const own=CM.EX.filter(e=>e.sp.includes(id)).slice(0,12),ch=CM.CHAINS.filter(c=>c.sports.includes(id));
  return '<button class="btn sm ghost" data-act="sport-close">All sports</button><div class="row between"><h1>'+esc(s.name)+'</h1>'+chip(id)+'</div><div class="card"><div class="eyebrow">Philosophy</div><p>'+esc(s.phil)+'</p></div><div class="card"><div class="eyebrow">Technique cue</div><p style="font-size:18px">'+esc(s.cue)+'</p></div>'+
  '<div class="cols"><div class="card"><div class="eyebrow">Sample week ('+days+' days)</div><ul class="mini">'+tpl.map((t,i)=>'<li><span>Day '+(i+1)+'</span><span>'+En.TYPES[t].n+'</span></li>').join('')+'</ul></div><div class="card"><div class="eyebrow">Skill checklist</div><ul>'+s.check.map(c=>'<li class="check"><span>'+esc(c)+'</span></li>').join('')+'</ul><p class="muted">Tick these off in the Progress tab.</p></div></div>'+
  (ch.length&&S.profile?'<div class="card"><div class="eyebrow">Technique chains</div><ul class="mini">'+ch.map(c=>'<li><span>'+esc(c.name)+'</span><span><button class="btn sm ghost" data-act="chain-open" data-v="'+c.id+'">Open</button></span></li>').join('')+'</ul></div>':'')+
  (own.length?'<div class="card"><div class="eyebrow">Signature drills and lifts</div><ul class="mini">'+own.map(e=>'<li><span>'+esc(e.name)+'</span><span>'+esc(e.mus)+'</span></li>').join('')+'</ul></div>':'')+
  (S.profile?'<button class="btn" data-act="mainsport" data-v="'+id+'">Make '+esc(s.name)+' my main sport</button>':'<button class="btn" data-act="landing-start">Build my plan</button>');
}
function exListHTML(){
  const f=UI.f,q=f.q.trim().toLowerCase();
  const list=CM.EX.filter(e=>(!q||(e.name+' '+e.mus).toLowerCase().includes(q))&&(!f.sp||e.sp.includes(f.sp)||(e.all&&!e.sp.length))&&(!f.eq||e.eq===f.eq)&&(!f.d||e.d===+f.d)&&(!f.pat||e.pat===f.pat));
  const url=e=>'https://www.youtube.com/results?search_query='+encodeURIComponent(e.name+' form tutorial');
  return '<p class="muted mono">'+list.length+' of '+CM.EX.length+' exercises</p>'+(list.length?list.map(e=>'<details class="ex"><summary><span><b>'+esc(e.name)+'</b><br><span class="muted">'+esc(e.mus)+'</span></span><span class="chip">'+['','easy','medium','hard'][e.d]+'</span></summary><div class="body"><dl class="kv"><dt>Cue</dt><dd>'+esc(e.cue)+'</dd><dt>Common error</dt><dd>'+esc(e.err)+'</dd><dt>Easier</dt><dd>'+esc(e.reg)+'</dd>'+(e.prog?'<dt>Harder</dt><dd>'+esc(e.prog)+'</dd>':'')+'<dt>Gear</dt><dd>'+({bw:'Bodyweight',db:'Dumbbells',band:'Bands',bar:'Pull-up bar',gym:'Gym equipment'})[e.eq]+'</dd><dt>Avoid if</dt><dd>'+(e.avoid.length?esc(e.avoid.join(', ')+' pain'):'No common flags')+'</dd></dl><a class="btn sm ghost" href="'+url(e)+'" target="_blank" rel="noopener noreferrer">Find a form video</a></div></details>').join(''):'<div class="card"><p>No exercises match. Clear a filter to see more.</p></div>');
}
function viewSkills(){
  if(UI.chain)return viewChain(UI.chain);
  if(UI.sport)return topbar()+sportHTML(UI.sport);
  const seg='<div class="seg" role="tablist"><button class="'+(UI.skills==='chains'?'on':'')+'" data-act="skills-seg" data-v="chains">Chains</button><button class="'+(UI.skills==='sports'?'on':'')+'" data-act="skills-seg" data-v="sports">Sports</button><button class="'+(UI.skills==='ex'?'on':'')+'" data-act="skills-seg" data-v="ex">Exercises</button></div>';
  let b;
  if(UI.skills==='chains'){
    const all=En.allChains(S),mySports=S.profile.sports,mine=all.filter(c=>!c.mine&&c.sports.some(s=>mySports.includes(s))),other=all.filter(c=>!c.mine&&!c.sports.some(s=>mySports.includes(s))),custom=all.filter(c=>c.mine);
    b=(mine.length?'<h2>For your sports</h2><div class="grid">'+mine.map(chainCard).join('')+'</div>':'<div class="card"><p>None of the built-in chains match your sports yet. They cover jiu-jitsu, MMA, wrestling and boxing. You can build your own below.</p></div>')+
    '<div class="row between"><h2>Your own chains</h2><button class="btn sm" data-act="chainform-open">Build a chain</button></div>'+(custom.length?'<div class="grid">'+custom.map(chainCard).join('')+'</div>':'<p class="muted">Write down a system your coach teaches, one link per line, and track it like the built-in ones.</p>')+
    (other.length?'<details class="ex"><summary><b>Other chains ('+other.length+')</b><span class="chip">more</span></summary><div class="body"><div class="grid">'+other.map(chainCard).join('')+'</div></div></details>':'');
  }else if(UI.skills==='sports')b='<div class="grid">'+CM.SP.map(s=>'<button class="card" style="text-align:left;cursor:pointer" data-act="sport-open" data-v="'+s.id+'"><div class="row between"><h3>'+esc(s.name)+'</h3>'+chip(s.id)+'</div><p class="muted">'+esc(s.phil.split('. ')[0])+'.</p></button>').join('')+'</div>';
  else{
    const f=UI.f;
    b='<div class="grid"><div class="field"><label for="fq">Search</label><input type="search" id="fq" data-in="fq" value="'+esc(f.q)+'" placeholder="Squat, shoulders, jab"></div>'+
    '<div class="field"><label for="fsp">Sport</label><select id="fsp" data-in="fsp"><option value="">All sports</option>'+opts(CM.SP.map(s=>[s.id,s.name]),f.sp)+'</select></div>'+
    '<div class="field"><label for="feq">Equipment</label><select id="feq" data-in="feq"><option value="">Any</option>'+opts([['bw','Bodyweight'],['db','Dumbbells'],['band','Bands'],['bar','Pull-up bar'],['gym','Gym']],f.eq)+'</select></div>'+
    '<div class="field"><label for="fd">Difficulty</label><select id="fd" data-in="fd"><option value="">Any</option>'+opts([[1,'Easy'],[2,'Medium'],[3,'Hard']],f.d)+'</select></div>'+
    '<div class="field"><label for="fpat">Type</label><select id="fpat" data-in="fpat"><option value="">Any</option>'+opts([['squat','Squat'],['lunge','Lunge'],['hinge','Hinge'],['push','Push'],['pull','Pull'],['core','Core'],['grip','Grip'],['neck','Neck'],['cardio','Cardio'],['mobility','Mobility'],['drill','Sport drill']],f.pat)+'</select></div></div><div class="sec" id="exlist">'+exListHTML()+'</div>';
  }
  return topbar()+sechead('Skills','Technique chains, the ten sports and the full exercise library.')+seg+b;
}

/* ---- journal and film room ---- */
const VQ={bodybuilding:['hypertrophy training explained','proper squat form','chest and back workout'],weightloss:['beginner fat loss strength workout','walking for weight loss','healthy habits for fat loss'],mma:['MMA conditioning workout','takedown defense basics','MMA striking fundamentals'],bjj:['BJJ guard retention concepts','BJJ passing fundamentals','BJJ back control details'],boxing:['boxing footwork drills','boxing jab fundamentals','boxing heavy bag workout'],wrestling:['wrestling stance and motion','wrestling single leg finishes','wrestling conditioning'],running:['easy run pace explained','running form basics','strength for runners'],powerlifting:['squat bench deadlift technique','powerlifting bracing','powerlifting programming basics'],calisthenics:['pull-up progression','push-up progression','pistol squat progression'],chess:['posture exercises for desk work','breathing for focus','cardio for focus and stamina']};
function entryHTML(e){
  const chain=e.chain&&En.allChains(S).find(c=>c.id===e.chain);
  const bits=[];if(e.minutes)bits.push(e.minutes+' min');if(e.rounds)bits.push(plural(+e.rounds,'round'));if(e.intensity)bits.push('intensity '+e.intensity+'/5');if(e.subsFor||e.subsAgainst)bits.push('subs '+(e.subsFor||0)+' for, '+(e.subsAgainst||0)+' against');
  return '<article class="card entry"><div class="meta"><span class="mono muted">'+esc(fmtDate(e.date))+'</span><span class="chip">'+esc(JT[e.type||'note']||'Note')+'</span>'+chip(e.sport)+'</div>'+
  (bits.length?'<p class="mono muted">'+esc(bits.join(' · '))+'</p>':'')+
  (e.text?'<p class="txt">'+esc(e.text)+'</p>':'')+
  (e.worked&&e.worked.length?'<div class="taglist"><span class="lab">Worked</span>'+e.worked.map(t=>'<span class="chip">'+esc(t)+'</span>').join('')+'</div>':'')+
  (e.struggled&&e.struggled.length?'<div class="taglist"><span class="lab">To work on</span>'+e.struggled.map(t=>'<span class="chip">'+esc(t)+'</span>').join('')+'</div>':'')+
  (chain?'<p class="muted">Chain: <button class="btn sm ghost" data-act="chain-open" data-v="'+esc(chain.id)+'">'+esc(chain.name)+'</button>'+(e.chainStep!=null&&chain.steps[e.chainStep]?' · reached "'+esc(chain.steps[e.chainStep].move)+'" ('+esc(CM.LEVELS[e.chainLevel]||'')+')':'')+'</p>':'')+
  (e.videoId?'<video data-vid="'+esc(e.videoId)+'" controls playsinline preload="metadata" aria-label="Your clip"></video>':'')+
  (e.url?'<a class="btn sm ghost" href="'+esc(e.url)+'" target="_blank" rel="noopener noreferrer">Watch linked video</a>':'')+
  '<div class="row"><button class="btn sm ghost '+(UI.confirm==='jdel:'+e.id?'danger':'')+'" data-act="j-del" data-id="'+esc(e.id)+'">'+(UI.confirm==='jdel:'+e.id?'Tap again to delete':'Delete')+'</button></div></article>';
}
function barChart(data,label){
  const W=480,H=220,L=46,R=8,T=14,B=28,mx=Math.max.apply(null,[0].concat(data.map(d=>d.v))),sc=scale(mx),pw=W-L-R,ph=H-T-B,bw=pw/data.length;
  let g='';
  sc.t.forEach(v=>{const y=T+ph-(v/sc.top)*ph;g+='<line class="gl" x1="'+L+'" x2="'+(W-R)+'" y1="'+y+'" y2="'+y+'"/><text class="tx" x="'+(L-6)+'" y="'+(y+4)+'" text-anchor="end">'+fmtN(v)+'</text>';});
  data.forEach((d,i)=>{const h=(d.v/sc.top)*ph,x=L+i*bw+bw*0.18;if(d.v>0)g+='<rect class="bar '+(d.now?'now':'')+'" x="'+x+'" y="'+(T+ph-h)+'" width="'+(bw*0.64)+'" height="'+h+'" rx="2"/>';if(data.length<=8||i%2===0||i===data.length-1)g+='<text class="tx" x="'+(L+i*bw+bw/2)+'" y="'+(H-8)+'" text-anchor="middle">'+d.l+'</text>';});
  return '<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+esc(label)+'">'+g+'</svg>';
}
function sparringPanel(){
  const js=En.journalStats(S.journal,new Date(),8);
  if(!js.sessions)return '';
  return '<section class="card"><div class="row between"><h3>Sparring and class progress</h3><span class="mono muted">last 8 weeks</span></div><div class="kpis"><div class="stat"><span class="eyebrow">Sessions</span><b>'+js.sessions+'</b></div><div class="stat"><span class="eyebrow">Rounds</span><b>'+js.rounds+'</b></div><div class="stat"><span class="eyebrow">Subs for</span><b>'+js.subsFor+'</b></div><div class="stat"><span class="eyebrow">Subs against</span><b>'+js.subsAgainst+'</b></div></div>'+
  barChart(js.weeks,'Bar chart of rounds logged per week for the last 8 weeks')+
  '<div class="cols"><div class="sec"><div class="eyebrow">What is working</div>'+(js.topWorked.length?'<ul class="mini">'+js.topWorked.map(t=>'<li><span>'+esc(t[0])+'</span><span>'+t[1]+'×</span></li>').join('')+'</ul>':'<p class="muted">Add "worked" tags when you log a session.</p>')+'</div><div class="sec"><div class="eyebrow">To work on</div>'+(js.topStruggled.length?'<ul class="mini">'+js.topStruggled.map(t=>'<li><span>'+esc(t[0])+'</span><span>'+t[1]+'×</span></li>').join('')+'</ul>':'<p class="muted">Nothing tagged yet.</p>')+'</div></div></section>';
}
function viewJournal(){
  const seg='<div class="seg" role="tablist"><button class="'+(UI.jseg==='journal'?'on':'')+'" data-act="jseg" data-v="journal">Journal</button><button class="'+(UI.jseg==='film'?'on':'')+'" data-act="jseg" data-v="film">Film room</button></div>';
  if(UI.jseg==='film')return topbar()+sechead('Journal','Your training diary and film room. Everything stays on this device.')+seg+filmHTML();
  const f=UI.jf,list=S.journal.filter(e=>(!f.type||(e.type||'note')===f.type)&&(!f.sp||e.sport===f.sp));
  return topbar()+sechead('Journal','Your training diary. Post what you learned, log classes and sparring, and attach your own clips. Everything stays on this device.')+seg+
  '<form class="card composer" data-submit="j-post"><label for="jtext"><b>What did you learn today?</b></label><textarea id="jtext" placeholder="Today I learned to frame on the hip before I shrimp."></textarea>'+
  '<div class="grid"><div class="field"><label for="jsport">Sport</label><select id="jsport">'+sportOpts(S.profile.sports[0])+'</select></div><div class="field"><label for="jvid">Attach a clip (optional)</label><input type="file" id="jvid" accept="video/*"></div></div>'+
  '<div class="row"><button class="btn" type="submit">Post</button><button class="btn ghost" type="button" data-act="jlog-open">Log a class or sparring session</button></div><p class="muted">Clips are saved on this device only. Long clips use a lot of space; trim them on your phone first.</p></form>'+
  sparringPanel()+
  '<div class="row between"><h2>Entries</h2><div class="row"><select id="jft" data-in="jft" aria-label="Filter by type" style="width:auto"><option value="">All types</option>'+opts([['note','Notes']].concat(JTYPES),f.type)+'</select><select id="jfs" data-in="jfs" aria-label="Filter by sport" style="width:auto"><option value="">All sports</option>'+opts(CM.SP.map(s=>[s.id,s.name]),f.sp)+'</select></div></div>'+
  (list.length?'<div class="feed">'+list.map(entryHTML).join('')+'</div>':'<div class="card"><p>'+(S.journal.length?'No entries match these filters.':'No entries yet. Post your first note above. One line after each session adds up fast.')+'</p></div>');
}
function filmHTML(){
  const vs=UI.vsport,list=vs?S.videos.filter(v=>v.sport===vs):S.videos,find=vs||S.profile.sports[0];
  const sel='<select id="vsel" data-in="vsport" aria-label="Sport filter" style="width:auto"><option value="">All sports</option>'+sportOpts(vs)+'</select>';
  return '<form class="card" data-submit="v-add"><h3>Save a video link</h3><div class="field"><label for="vurl">YouTube or Vimeo link</label><input type="url" id="vurl" placeholder="https://www.youtube.com/watch?v=..." required></div><div class="grid"><div class="field"><label for="vtitle">Title (optional)</label><input type="text" id="vtitle"></div><div class="field"><label for="vsp">Sport</label><select id="vsp">'+sportOpts(find)+'</select></div></div><div class="field"><label for="vnote">Notes</label><input type="text" id="vnote" placeholder="What to watch for"></div><div class="row"><button class="btn" type="submit">Save link</button><span class="muted">Secure links only. Videos open on their own site.</span></div></form>'+
  '<div class="row between"><h2>Saved videos</h2>'+sel+'</div>'+
  (list.length?'<div class="grid">'+list.map(v=>'<div class="card"><div class="row between"><b style="overflow-wrap:anywhere">'+esc(v.title)+'</b>'+chip(v.sport)+'</div>'+(v.note?'<p class="muted">'+esc(v.note)+'</p>':'')+'<div class="row"><a class="btn sm" href="'+esc(v.url)+'" target="_blank" rel="noopener noreferrer">Watch on '+esc(v.host)+'</a><button class="btn sm ghost" data-act="v-del" data-id="'+v.id+'">Remove</button></div></div>').join('')+'</div>':'<div class="card"><p>No saved videos yet. Paste a link above or use the searches below to find one.</p></div>')+
  '<section class="card"><h3>Find videos for '+esc(SPM[find].name)+'</h3><div class="row">'+VQ[find].map(q=>'<a class="btn sm ghost" target="_blank" rel="noopener noreferrer" href="https://www.youtube.com/results?search_query='+encodeURIComponent(q)+'">'+esc(q)+'</a>').join('')+'</div></section>'+
  '<section class="card"><h3>Review a clip from this device</h3><p class="muted">Pick a video file. Slow it down, step frame by frame, loop a section and add notes at moments. Save it to your journal to keep it.</p><input type="file" accept="video/*" id="clipfile" data-in="clipfile" aria-label="Choose a video file"><div id="clipbox" '+(UI.clip.url?'':'hidden')+' class="sec"><video id="clipv" controls playsinline style="width:100%;max-height:60vh;background:#000;border-radius:8px"></video>'+
  '<div class="row"><span class="lab">Speed</span>'+[0.25,0.5,1,1.5,2].map(x=>'<button class="btn sm ghost" data-act="clip-speed" data-v="'+x+'">'+x+'x</button>').join('')+'</div>'+
  '<div class="row"><button class="btn sm ghost" data-act="clip-step" data-v="-1">Back 1 frame</button><button class="btn sm ghost" data-act="clip-step" data-v="1">Forward 1 frame</button><button class="btn sm ghost" data-act="clip-a">Set A</button><button class="btn sm ghost" data-act="clip-b">Set B</button><button class="btn sm ghost" id="cliploop" data-act="clip-loop">Loop A-B: '+(UI.clip.loop?'on':'off')+'</button></div>'+
  '<form class="row" data-submit="clip-note"><input type="text" id="cnote" placeholder="Note at this moment" style="flex:1;min-width:160px"><button class="btn sm" type="submit">Add note</button></form><ul class="mini" id="clipnotes"></ul><button class="btn" data-act="clip-save">Save clip and notes to my journal</button></div></section>';
}

/* ---- progress ---- */
function lineChart(pts){
  const W=480,H=220,L=46,R=14,T=18,B=28,mx=Math.max.apply(null,pts.map(p=>p.v)),sc=scale(mx),pw=W-L-R,ph=H-T-B;
  let g='';
  sc.t.forEach(v=>{const y=T+ph-(v/sc.top)*ph;g+='<line class="gl" x1="'+L+'" x2="'+(W-R)+'" y1="'+y+'" y2="'+y+'"/><text class="tx" x="'+(L-6)+'" y="'+(y+4)+'" text-anchor="end">'+fmtN(v)+'</text>';});
  const X=i=>L+(pts.length===1?pw/2:(i/(pts.length-1))*pw),Y=v=>T+ph-(v/sc.top)*ph;
  g+='<polyline class="ln" points="'+pts.map((p,i)=>X(i)+','+Y(p.v)).join(' ')+'"/>';
  pts.forEach((p,i)=>{g+='<circle class="dot" cx="'+X(i)+'" cy="'+Y(p.v)+'" r="'+(i===pts.length-1?5:3)+'"/>';});
  const last=pts[pts.length-1];g+='<text class="tx" x="'+Math.min(X(pts.length-1),W-R-14)+'" y="'+(Y(last.v)-10)+'" text-anchor="middle" style="fill:var(--ink)">'+Math.round(last.v)+'</text>';
  g+='<text class="tx" x="'+X(0)+'" y="'+(H-8)+'" text-anchor="'+(pts.length===1?'middle':'start')+'">'+pts[0].l+'</text>';
  if(pts.length>1)g+='<text class="tx" x="'+X(pts.length-1)+'" y="'+(H-8)+'" text-anchor="end">'+last.l+'</text>';
  return '<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Line chart of estimated one-rep max over time">'+g+'</svg>';
}
function scale(max){if(max<=0)return {top:1,t:[0,1]};const raw=max/4,p=Math.pow(10,Math.floor(Math.log10(raw))),n=raw/p,step=(n<=1?1:n<=2?2:n<=2.5?2.5:n<=5?5:10)*p,top=Math.ceil(max/step)*step,t=[];for(let v=0;v<=top+1e-9;v+=step)t.push(+v.toFixed(2));return {top:top,t:t};}
function fmtN(v){return v>=1000?(v/1000).toFixed(v%1000?1:0)+'k':String(v);}
function goalsHTML(){
  const G=S.goals||[];
  return '<section class="card"><div class="row between"><h3>Goals and life plan</h3><button class="btn sm" data-act="goal-open">Add a goal</button></div>'+
  (G.length?G.map(g=>{const done=g.ms.filter(m=>m.done).length,left=g.by?En.daysBetween(today(),g.by):null;
    return '<div class="sec" style="border-top:1px solid var(--line);padding-top:10px"><div class="row between"><b>'+esc(g.text)+'</b>'+(left!=null?'<span class="mono muted">'+(left>=0?plural(left,'day')+' left':'date passed')+'</span>':'')+'</div>'+
    (g.ms.length?'<div class="meter" aria-hidden="true"><i style="width:'+Math.round(100*done/g.ms.length)+'%"></i></div>'+g.ms.map((m,i)=>'<label class="check"><input type="checkbox" id="gm-'+g.id+'-'+i+'" data-act="goal-ms" data-id="'+g.id+'" data-i="'+i+'" '+(m.done?'checked':'')+'><span>'+esc(m.t)+'</span></label>').join(''):'')+
    '<div class="row"><button class="btn sm ghost '+(UI.confirm==='gdel:'+g.id?'danger':'')+'" data-act="goal-del" data-id="'+g.id+'">'+(UI.confirm==='gdel:'+g.id?'Tap again to remove':'Remove')+'</button></div></div>';}).join(''):'<p class="muted">Write the big thing you are working toward, like "Compete at a local tournament" or "Run a 10k", and break it into a few milestones. Goals with a date can also get a countdown.</p>')+'</section>';
}
function checklists(){
  return '<section class="card"><h3>Skill checklists</h3>'+S.profile.sports.map(id=>{const s=SPM[id],c=S.checks[id]||{};return '<div class="sec"><div class="row between"><b>'+esc(s.name)+'</b><span class="mono muted">'+Object.values(c).filter(Boolean).length+'/'+s.check.length+'</span></div>'+s.check.map((t,i)=>'<label class="check"><input type="checkbox" id="ck-'+id+'-'+i+'" data-act="check" data-s="'+id+'" data-i="'+i+'" '+(c[i]?'checked':'')+'><span>'+esc(t)+'</span></label>').join('')+'</div>';}).join('')+'</section>';
}
function viewProgress(){
  const H=S.hist,head=topbar()+sechead('Progress','Your numbers, your long-term goals and your skill checklists.');
  if(!H.length)return head+'<div class="card"><h3>Nothing logged yet</h3><p>Finish a workout and your totals, volume chart and strength trend appear here. Want to see how it looks first?</p><div class="row"><button class="btn" data-act="demo">Load example history</button><button class="btn ghost" data-act="tab" data-v="today">Go to Today</button></div></div>'+goalsHTML()+sparringPanel()+checklists();
  const sets=H.reduce((a,h)=>a+h.sets.length,0),vol=H.reduce((a,h)=>a+volOf(h),0),demo=H.some(h=>h.demo);
  const days=[];for(let i=13;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);days.push(d);}
  const data=days.map((d,i)=>{const key=En.ymd(d),hs=H.filter(h=>h.date===key);return {l:(d.getMonth()+1)+'/'+d.getDate(),v:UI.pm==='vol'?hs.reduce((a,h)=>a+volOf(h),0):hs.reduce((a,h)=>a+h.sets.length,0),now:i===13};});
  const w=new Set();H.forEach(h=>h.sets.forEach(s=>{const e=EXM[s.ex];if(e&&e.u==='r'&&s.w>0)w.add(s.ex);}));
  const wl=[...w];if(!UI.pex||!w.has(UI.pex))UI.pex=wl[0]||'';
  let line='<p class="muted">Log a lift with weight to see your strength trend.</p>';
  if(UI.pex){const byd={};H.forEach(h=>h.sets.forEach(s=>{if(s.ex===UI.pex&&s.w>0&&s.r>0&&s.r<=12){const e1=s.w*(1+s.r/30);byd[h.date]=Math.max(byd[h.date]||0,e1);}}));
    const pts=Object.keys(byd).sort().map(k=>({l:k.slice(5).replace('-','/').replace(/^0/,''),v:byd[k]}));
    line=pts.length?lineChart(pts)+(pts.length<2?'<p class="muted">Log this lift in one more session to see a trend.</p>':''):line;}
  return head+(demo?'<div class="banner warn"><p><b>Example data is loaded.</b> Remove it in Settings when you are done exploring.</p></div>':'')+
  '<div class="stats"><div class="stat"><span class="eyebrow">Sessions</span><b>'+H.length+'</b></div><div class="stat"><span class="eyebrow">Sets</span><b>'+sets+'</b></div><div class="stat"><span class="eyebrow">Volume</span><b>'+fmtN(Math.round(vol))+'</b><span class="muted">'+S.set.units+' × reps</span></div></div>'+
  '<div class="cols"><section class="card"><div class="row between"><h3>Last 14 days</h3><div class="seg"><button class="'+(UI.pm==='vol'?'on':'')+'" data-act="pm" data-v="vol">Volume</button><button class="'+(UI.pm==='sets'?'on':'')+'" data-act="pm" data-v="sets">Sets</button></div></div>'+barChart(data,'Bar chart of daily totals for the last 14 days')+'</section>'+
  '<section class="card"><div class="row between"><h3>Strength trend</h3>'+(wl.length?'<select id="pex" data-in="pex" aria-label="Exercise" style="width:auto">'+wl.map(id=>'<option value="'+id+'" '+(id===UI.pex?'selected':'')+'>'+esc(EXM[id].name)+'</option>').join('')+'</select>':'')+'</div>'+line+'<p class="muted">Estimated one-rep max, best set per day.</p></section></div>'+
  goalsHTML()+sparringPanel()+checklists()+
  '<section class="card"><h3>Recent sessions</h3><ul class="mini">'+H.slice(-6).reverse().map(h=>'<li><span>'+esc(h.name)+(h.demo?' <span class="chip">example</span>':'')+'</span><span>'+esc(h.date)+' · '+h.sets.length+' sets</span></li>').join('')+'</ul></section>';
}

/* ---- coach ---- */
function viewCoach(){
  if(!S.chat.length)S.chat.push({from:'coach',text:'I am your offline coach. I can shorten your next session, swap an exercise, ease off when you are sore, give technique cues, walk you through a technique chain, run your weekly check-in, or save a note to your journal. I follow set rules and I am not a live AI.',chips:['Shorten my next session to 30 minutes','I am sore today','Show my chains','What is next?']});
  const last=S.chat[S.chat.length-1];
  return topbar()+sechead('Coach','Ask for changes to your next session, technique help or a check-in. General fitness guidance only, not medical advice.')+'<div class="chat" id="chat">'+S.chat.map(m=>'<div class="bubble '+(m.from==='me'?'me':'')+'">'+esc(m.text)+'</div>').join('')+
  (last.from==='coach'&&(last.chips||last.go)?'<div class="row">'+(last.go?'<button class="btn sm" data-act="'+esc(last.go.act)+'" data-v="'+esc(last.go.v||'')+'">'+esc(last.go.label)+'</button>':'')+(last.chips||[]).map(c=>'<button class="btn sm ghost" data-act="chip" data-v="'+esc(c)+'">'+esc(c)+'</button>').join('')+'</div>':'')+'</div>'+
  '<form class="row" data-submit="chat-send"><input type="text" id="cmsg" placeholder="Ask your coach" style="flex:1;min-width:180px" autocomplete="off" aria-label="Message"><button class="btn" type="submit">Send</button></form>';
}
const SAMPLES=[
 {id:'c1',by:'@sample_lifter',name:'Garage upper day',sport:'bodybuilding',items:['pushup','dbrow','dbpress','bandrow','pushdown','plank']},
 {id:'c2',by:'@sample_grappler',name:'Grappler hips and grip',sport:'bjj',items:['shrimp','techstand','bridgeroll','farmer','hollow']},
 {id:'c3',by:'@sample_runner',name:'Runner strength in 30',sport:'running',items:['revlunge','slrdl','sideplank','bridge']},
 {id:'c4',by:'@sample_desk',name:'Desk-worker reset',sport:'chess',items:['catcow','wallangel','chintuck','thoracic']},
 {id:'c5',by:'@sample_boxer',name:'No-bag boxing burner',sport:'boxing',items:['shadow','footwork','jumprope','mtnclimb']},
 {id:'c6',by:'@sample_wrestler',name:'Wrestler neck and hips',sport:'wrestling',items:['stance','sprawl','neckiso','copenhagen','suitcase']}
];
function viewComm(){
  const C=S.comm,vis=SAMPLES.filter(r=>!C.blocked.includes(r.by)&&!C.reported.includes(r.id));
  const card=(r,mine)=>'<article class="card"><div class="row between"><h3>'+esc(r.name)+'</h3>'+chip(r.sport)+'</div><p class="muted mono">'+esc(mine?'You · this device only':r.by+' · sample')+'</p><ul class="mini">'+r.items.map(id=>'<li><span>'+esc(EXM[id].name)+'</span><span></span></li>').join('')+'</ul><div class="row"><button class="btn sm" data-act="clone" data-id="'+r.id+'">Clone into my plan</button>'+(mine?'':'<button class="btn sm ghost" data-act="follow" data-v="'+r.by+'">'+(C.follow.includes(r.by)?'Following':'Follow')+'</button><button class="btn sm ghost" data-act="report" data-id="'+r.id+'">Report</button><button class="btn sm ghost" data-act="block" data-v="'+r.by+'">Block</button>')+'</div></article>';
  return topbar()+'<button class="btn sm ghost" data-act="tab" data-v="plan">Back to plan</button><h1>Community</h1><div class="banner"><p>These are example routines and example accounts that live on this device. Nothing you share leaves your phone or computer. Real sharing needs accounts and moderation first.</p></div>'+
  (C.mine.length?'<h2>Yours</h2><div class="grid">'+C.mine.map(r=>card(r,true)).join('')+'</div>':'')+
  '<h2>Sample routines</h2>'+(vis.length?'<div class="grid">'+vis.map(r=>card(r,false)).join('')+'</div>':'<div class="card"><p>Nothing to show. You reported or blocked every sample.</p><button class="btn sm" data-act="unhide">Show hidden samples</button></div>');
}

/* ---------------- overlays: player, sheets, settings, copy ---------------- */
function renderOverlay(){
  const o=$('#overlay');let h='';
  if(UI.copybox!=null)h=copyHTML();else if(UI.player)h=playerHTML();else if(UI.sheet)h=sheetHTML();else if(UI.settings)h=settingsHTML();
  const wasOpen=!o.hidden;
  o.hidden=!h;o.innerHTML=h?'<div class="sheet" role="dialog" aria-modal="true"><div class="sheet-in">'+h+'</div></div>':'';
  if(h){const t=$('#overlay textarea[readonly]');if(t){t.focus();t.select();}if(!wasOpen){const sh=$('#overlay .sheet');if(sh)sh.scrollTop=0;}}
  if(h)hydrateVideos($('#overlay'));
}
function copyHTML(){return '<h2>Copy this text</h2><p class="muted">Your browser blocked direct copying. Select all and copy.</p><textarea id="copyta" readonly>'+esc(UI.copybox)+'</textarea><button class="btn" data-act="copy-close">Close</button>';}
function sheetHTML(){
  const sh=UI.sheet,close='<button class="btn sm ghost" data-act="sheet-close">Close</button>';
  const og=(key,list,obj)=>'<div class="opts">'+list.map(x=>'<button type="button" class="opt '+(String(obj[key])===String(x[0])?'on':'')+'" aria-pressed="'+(String(obj[key])===String(x[0]))+'" data-act="sh-set" data-k="'+key+'" data-v="'+x[0]+'">'+x[1]+'</button>').join('')+'</div>';
  if(sh.kind==='checkin'){
    const c=sh.data,ss=S.plan.weeks[c.w-1].sessions,dn=ss.filter(s=>S.done[s.id]).length;
    if(c.result)return '<div class="row between"><h2>Week '+c.w+' check-in</h2>'+close+'</div><div class="card"><div class="eyebrow">What changed</div><ul class="list-plain">'+c.result.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div>'+
      (c.w===4?'<label class="check"><input type="checkbox" id="lvup2" '+(En.suggestLevelUp(S)?'checked':'')+'><span>Move me up a level for the next block</span></label><div class="row"><button class="btn" data-act="newblock">Build my next block</button><button class="btn ghost" data-act="sheet-close">Later</button></div>':'<button class="btn" data-act="sheet-close">Done</button>');
    return '<div class="row between"><h2>Week '+c.w+' check-in</h2>'+close+'</div><p class="muted">You did '+dn+' of '+ss.length+' sessions this week. Five quick questions, then CornerMan adjusts next week.</p>'+
    '<div class="sec"><div class="eyebrow">1 · How did training feel?</div>'+og('feel',[['easy','Too easy'],['right','About right'],['hard','Too hard']],c)+'</div>'+
    '<div class="sec"><div class="eyebrow">2 · Sleep this week</div>'+og('sleep',[['poor','Poor'],['ok','OK'],['good','Good']],c)+'</div>'+
    '<div class="sec"><div class="eyebrow">3 · How does your body feel?</div>'+og('body',[['fresh','Fresh'],['normal','Normal soreness'],['beat','Beat up']],c)+'</div>'+
    '<div class="sec"><div class="eyebrow">Any pain? (optional)</div><div class="opts">'+PARTS.map(p=>'<button type="button" class="opt '+(c.pain.includes(p[0])?'on':'')+'" aria-pressed="'+c.pain.includes(p[0])+'" data-act="ci-pain" data-v="'+p[0]+'">'+p[1]+'</button>').join('')+'</div></div>'+
    '<div class="sec"><div class="eyebrow">4 · Next week in your life</div>'+og('life',[['normal','Normal'],['busy','Busy'],['more','More free time'],['travel','Travelling']],c)+'</div>'+
    '<div class="sec"><div class="eyebrow">5 · Days you can train next week</div>'+og('days',[[2,'2'],[3,'3'],[4,'4'],[5,'5'],[6,'6']],c)+'</div>'+
    '<div class="field"><label for="cinote">Anything else? (optional)</label><textarea id="cinote" data-in="ci-note" placeholder="New job shifts start Monday">'+esc(c.note)+'</textarea></div>'+
    '<button class="btn" data-act="ci-submit">Adjust my plan</button>';
  }
  if(sh.kind==='event'){
    const e=sh.data;
    return '<div class="row between"><h2>'+(e.id?'Edit event':'Add an event')+'</h2>'+close+'</div><form class="sec" data-submit="ev-save">'+
    '<div class="field"><label for="evn">Name</label><input type="text" id="evn" required value="'+esc(e.name)+'" placeholder="Spring open"></div>'+
    '<div class="grid"><div class="field"><label for="evd">Date</label><input type="date" id="evd" required value="'+esc(e.date)+'"></div><div class="field"><label for="evs">Sport</label><select id="evs">'+sportOpts(e.sport)+'</select></div><div class="field"><label for="evt">Type</label><select id="evt">'+opts(EVTYPES,e.kind)+'</select></div></div>'+
    '<p class="muted">The countdown moves through base, build, sharpen, taper, the day before and recovery. Sessions in the final 7 days are cut by about 40 percent. CornerMan never gives weight-cut plans: pick a division you can make by eating and training normally.</p>'+
    '<div class="row"><button class="btn" type="submit">Save event</button>'+(e.id?'<button class="btn ghost '+(UI.confirm==='evdel'?'danger':'')+'" type="button" data-act="ev-del" data-id="'+e.id+'">'+(UI.confirm==='evdel'?'Tap again to remove':'Remove event')+'</button>':'')+'</div></form>';
  }
  if(sh.kind==='goal'){
    const sug={bjj:['Earn my next stripe','Compete at a local tournament','Hit my back attack chain live'],mma:['Take my first amateur fight','Hit a takedown from my striking every class'],wrestling:['Make varsity','Win a match at my next tournament'],boxing:['Spar 3 rounds with clean defense','Enter a novice bout'],running:['Run a 5k without walking','Run a 10k'],bodybuilding:['Add 10 lb to my bench','Train 4 days a week for 3 months'],weightloss:['Walk every day for a month','Feel good in my clothes again'],powerlifting:['Compete at my first meet','Deadlift twice my bodyweight'],calisthenics:['First strict pull-up','10 push-ups in a row'],chess:['Stay sharp through a weekend tournament','Walk between every game']}[S.profile.sports[0]]||[];
    return '<div class="row between"><h2>Add a goal</h2>'+close+'</div><form class="sec" data-submit="goal-save">'+
    '<div class="field"><label for="gt">Your goal</label><input type="text" id="gt" required placeholder="Compete at a local tournament"></div>'+
    (sug.length?'<div class="row">'+sug.map(s=>'<button type="button" class="btn sm ghost" data-act="goal-sug" data-v="'+esc(s)+'">'+esc(s)+'</button>').join('')+'</div>':'')+
    '<div class="field"><label for="gd">Target date (optional)</label><input type="date" id="gd"></div>'+
    '<div class="field"><label for="gm">Milestones, one per line (optional)</label><textarea id="gm" placeholder="Train 3 days a week for a month&#10;Do 5 positional rounds a week&#10;Sign up for the event"></textarea></div>'+
    '<label class="check"><input type="checkbox" id="gev"><span>Also add the date as an event countdown</span></label>'+
    '<button class="btn" type="submit">Save goal</button></form>';
  }
  if(sh.kind==='chainform'){
    return '<div class="row between"><h2>Build a chain</h2>'+close+'</div><form class="sec" data-submit="chain-save">'+
    '<div class="grid"><div class="field"><label for="chn">Name</label><input type="text" id="chn" required placeholder="My half guard system"></div><div class="field"><label for="chs">Sport</label><select id="chs">'+sportOpts(S.profile.sports[0])+'</select></div></div>'+
    '<div class="field"><label for="chg">What it is for (optional)</label><input type="text" id="chg" placeholder="Get to the back from half guard"></div>'+
    '<div class="field"><label for="cht">Links, one per line. Put → or -> between the position and the move.</label><textarea id="cht" required style="min-height:160px" placeholder="Half guard bottom → get the underhook&#10;Underhook → come up to my knees&#10;Knees → take the back"></textarea></div>'+
    '<button class="btn" type="submit">Save chain</button></form>';
  }
  if(sh.kind==='jlog'){
    const d=sh.data,ch=En.allChains(S),c=ch.find(x=>x.id===d.chain);
    return '<div class="row between"><h2>Log a session</h2>'+close+'</div><form class="sec" data-submit="jlog-save">'+
    '<div class="grid"><div class="field"><label for="jd">Date</label><input type="date" id="jd" value="'+today()+'" max="'+today()+'"></div><div class="field"><label for="jty">Type</label><select id="jty">'+opts(JTYPES,d.type)+'</select></div><div class="field"><label for="jsp">Sport</label><select id="jsp">'+sportOpts(d.sport)+'</select></div></div>'+
    '<div class="grid"><div class="field"><label for="jmin">Minutes</label><input type="number" id="jmin" inputmode="numeric" min="0" max="600" placeholder="60"></div><div class="field"><label for="jr">Rounds</label><input type="number" id="jr" inputmode="numeric" min="0" max="60" placeholder="5"></div><div class="field"><label for="jsf">Subs or points for</label><input type="number" id="jsf" inputmode="numeric" min="0" max="99"></div><div class="field"><label for="jsa">Subs or points against</label><input type="number" id="jsa" inputmode="numeric" min="0" max="99"></div></div>'+
    '<div class="sec"><div class="eyebrow">Intensity</div>'+og('intensity',[[1,'1 easy'],[2,'2'],[3,'3'],[4,'4'],[5,'5 all out']],d)+'</div>'+
    '<div class="field"><label for="jw">What worked (comma separated)</label><input type="text" id="jw" placeholder="knee cut, back take"></div>'+
    '<div class="field"><label for="js">What to work on (comma separated)</label><input type="text" id="js" placeholder="guard retention, grip fighting"></div>'+
    '<div class="grid"><div class="field"><label for="jch">Technique chain (optional)</label><select id="jch" data-in="jch"><option value="">None</option>'+opts(ch.map(x=>[x.id,x.name]),d.chain)+'</select></div>'+
    (c?'<div class="field"><label for="jst">Furthest link you reached</label><select id="jst">'+opts(c.steps.map((s,i)=>[i,(i+1)+'. '+s.move]),0)+'</select></div><div class="field"><label for="jlv">Where you hit it</label><select id="jlv">'+opts([[1,'Drilling'],[2,'Positional sparring'],[3,'Live']],2)+'</select></div>':'')+'</div>'+
    '<div class="field"><label for="jn">Notes</label><textarea id="jn" placeholder="Who you rolled with, what you noticed, what the coach said"></textarea></div>'+
    '<div class="field"><label for="jv">Attach a clip (optional, stays on this device)</label><input type="file" id="jv" accept="video/*"></div>'+
    '<button class="btn" type="submit">Save to journal</button></form>';
  }
  return '';
}
function settingsHTML(){
  const s=S.set,seg=(k,list)=>'<div class="seg">'+list.map(x=>'<button class="'+(s[k]===x[0]?'on':'')+'" data-act="set" data-k="'+k+'" data-v="'+x[0]+'">'+x[1]+'</button>').join('')+'</div>';
  const tog=(k,l,d)=>'<label class="check"><input type="checkbox" id="t-'+k+'" data-act="toggle" data-k="'+k+'" '+(s[k]?'checked':'')+'><span><b>'+l+'</b><br><span class="muted">'+d+'</span></span></label>';
  const evs=(S.events||[]).slice().sort((a,b)=>a.date.localeCompare(b.date));
  return '<div class="row between"><h2>Settings</h2><button class="btn sm" data-act="settings-close">Done</button></div>'+
  '<div class="card"><div class="eyebrow">App</div>'+installHTML(false)+'<p class="offline-pill">'+(offlineReady()?'Offline ready':'Offline mode turns on after the first visit from its own web address')+'</p></div>'+
  '<div class="sec"><div class="eyebrow">Appearance</div>'+seg('theme',[['auto','Auto'],['light','Light'],['dark','Dark']])+'</div>'+
  '<div class="sec"><div class="eyebrow">Weight units</div>'+seg('units',[['lb','lb'],['kg','kg']])+'</div>'+
  tog('sound','Rest timer sound','A short beep when rest ends. Off by default.')+
  tog('lowbw','Low-bandwidth mode','Turns off animations. Nothing autoplays in CornerMan either way.')+
  tog('pub','Using a public computer','Stops saving to this browser and clears what is saved now. Your data lasts until you close the page.')+
  (S.profile?'<div class="sec"><div class="eyebrow">Events and countdowns</div>'+(evs.length?'<ul class="mini">'+evs.map(e=>'<li><span>'+esc(e.name)+'</span><span>'+esc(fmtDate(e.date))+' <button class="btn sm ghost" data-act="event-open" data-id="'+e.id+'">Edit</button></span></li>').join('')+'</ul>':'<p class="muted">No events yet.</p>')+'<div class="row"><button class="btn sm ghost" data-act="event-open">Add an event</button></div></div>':'')+
  '<div class="sec"><div class="eyebrow">Your data</div><p class="muted">Everything lives in this browser on this device. Back it up to a file now and then, especially before clearing your browser. Clips are not included in the backup.</p>'+
  '<div class="row"><button class="btn sm" data-act="backup">Download a backup</button><label class="btn sm ghost" for="restorefile" style="cursor:pointer">Restore from a backup</label><input type="file" id="restorefile" data-in="restore" accept="application/json,.json" hidden></div>'+
  (UI.restore?'<div class="banner warn"><p>Restore the backup from <b>'+esc(UI.restore.date)+'</b>? It replaces everything currently in CornerMan on this device.</p><button class="btn sm" data-act="restore-go">Replace my data</button></div>':'')+
  '<div class="row"><button class="btn sm ghost" data-act="persist">Protect my data from cleanup</button><span class="muted" id="storeinfo"></span></div>'+
  '<div class="row"><button class="btn sm ghost" data-act="copydata">Copy my data as JSON</button>'+(S.hist.some(h=>h.demo)?'<button class="btn sm ghost" data-act="undemo">Remove example history</button>':'<button class="btn sm ghost" data-act="demo">Load example history</button>')+(S.profile?'<button class="btn sm ghost" data-act="redo">Redo setup</button>':'')+'</div>'+
  '<button class="btn danger" data-act="wipe">'+(UI.confirm==='wipe'?'Tap again to delete everything, clips included':'Delete all my data')+'</button></div>'+
  '<div class="card"><div class="eyebrow">What needs a server</div><p>This version runs entirely on your device. Accounts, syncing between phone and computer, sharing clips with a coach, a real community feed and a live AI coach all need a server, which this version does not have.</p></div>'+
  '<div class="card"><div class="eyebrow">About</div><p>CornerMan gives general fitness guidance, not medical advice. '+CM.EX.length+' exercises, '+CM.CHAINS.length+' technique chains, '+CM.SP.length+' sports.</p></div>';
}
function playerHTML(){
  const p=UI.player,s=findSession(p.sid);
  if(p.sum){const v=volOf(p.sum);return '<div class="eyebrow">Workout saved</div><h1>Nice work</h1><div class="stats"><div class="stat"><span class="eyebrow">Sets</span><b>'+p.sum.sets.length+'</b></div><div class="stat"><span class="eyebrow">Minutes</span><b>'+p.sum.mins+'</b></div><div class="stat"><span class="eyebrow">Volume</span><b>'+fmtN(Math.round(v))+'</b></div></div><p class="muted">Next time, each set starts from the weights you just used.</p>'+
    '<form class="card composer" data-submit="p-note"><label for="pnote"><b>One line for your journal?</b></label><textarea id="pnote" placeholder="Felt strong on the squats. Left knee a little stiff."></textarea><button class="btn sm" type="submit">Save note</button></form><button class="btn" data-act="p-done">Back to Today</button>';}
  const it=p.items[p.i],e=EXM[it.id];ensureRows(p,it);
  const rows=p.rows[p.i],timeUnit=e.u==='t'?'sec':e.u==='m'?'min':'reps',showW=e.u==='r';
  const rest=p.rest?'<div class="card" style="align-items:center"><svg class="ring" viewBox="0 0 120 120" role="img" aria-label="Rest timer"><circle class="rtrack" cx="60" cy="60" r="52"/><circle class="rbar" id="ringc" cx="60" cy="60" r="52" stroke-dasharray="326.7" stroke-dashoffset="'+(326.7*(1-p.rest.left/p.rest.total)).toFixed(1)+'" transform="rotate(-90 60 60)"/><text class="rtxt" id="rtxt" x="60" y="69" text-anchor="middle">'+mmss(p.rest.left)+'</text></svg><div class="row"><button class="btn sm ghost" data-act="p-plus">+15 sec</button><button class="btn sm" data-act="p-skip">Skip rest</button></div></div>':'';
  return '<div class="row between"><button class="btn sm ghost" data-act="p-close">Leave</button><span class="mono muted">Move '+(p.i+1)+' of '+p.items.length+'</span></div><div class="eyebrow">'+esc(s.name)+(p.taper?' · tapered':'')+'</div>'+
  '<div class="card"><h1 style="font-size:40px">'+esc(e.name)+'</h1><div class="row"><span class="chip">Target '+fmtItem(it)+'</span><span class="chip">RPE '+fmtRpe(it.rpe)+'</span></div><dl class="kv"><dt>Cue</dt><dd>'+esc(e.cue)+'</dd><dt>Avoid</dt><dd>'+esc(e.err)+'</dd></dl></div>'+rest+
  '<div class="card">'+rows.map((r,j)=>'<div class="setrow '+(showW?'':'nw')+' '+(r.done?'done':'')+'"><span class="sn">Set '+(j+1)+'</span>'+(showW?'<div class="field"><label class="lab" for="pw'+j+'">'+S.set.units+'</label><input id="pw'+j+'" type="number" inputmode="decimal" step="any" min="0" data-in="pw" data-j="'+j+'" value="'+esc(r.w)+'" '+(r.done?'disabled':'')+'></div>':'')+'<div class="field"><label class="lab" for="pr'+j+'">'+timeUnit+'</label><input id="pr'+j+'" type="number" inputmode="numeric" min="0" data-in="pr" data-j="'+j+'" value="'+esc(r.r)+'" '+(r.done?'disabled':'')+'></div><div class="field"><label class="lab" for="pe'+j+'">RPE</label><select id="pe'+j+'" data-in="pe" data-j="'+j+'" '+(r.done?'disabled':'')+'>'+[5,5.5,6,6.5,7,7.5,8,8.5,9,9.5,10].map(x=>'<option '+(+r.rpe===x?'selected':'')+'>'+x+'</option>').join('')+'</select></div>'+(r.done?'<span class="done-badge" style="padding-bottom:12px">LOGGED</span>':'<button class="btn sm" data-act="p-log" data-j="'+j+'">Log</button>')+'</div>').join('')+'<button class="btn sm ghost" data-act="p-addset">Add a set</button></div>'+
  (p.empty?'<div class="banner warn"><p>No sets are logged yet. Log at least one set to save this workout.</p><button class="btn sm ghost" data-act="p-close">Leave without saving</button></div>':'')+
  '<div class="row"><button class="btn ghost" data-act="p-prev" '+(p.i===0?'disabled':'')+'>Previous</button><button class="btn ghost" data-act="p-next" '+(p.i===p.items.length-1?'disabled':'')+'>Next move</button><button class="btn ghost" data-act="p-swap">Swap move</button></div><button class="btn" data-act="p-finish">Finish workout</button>';
}
const mmss=n=>Math.floor(n/60)+':'+String(n%60).padStart(2,'0');
function ensureRows(p,it){
  if(p.rows[p.i])return;const e=EXM[it.id],ls=lastSet(it.id),rows=[];
  const n=(e.u==='m'&&e.pat!=='drill')?1:it.sets;
  for(let j=0;j<n;j++)rows.push({w:ls&&e.u==='r'&&ls.w?ls.w:'',r:parseInt(it.tgt,10)||'',rpe:Math.round(it.rpe*2)/2,done:false});
  p.rows[p.i]=rows;
}

/* ---------------- render ---------------- */
function render(){
  const ob=!S.profile||UI.ob;
  document.body.classList.toggle('onb',!!ob||(!S.profile&&UI.landing));
  document.body.classList.toggle('lowbw',!!S.set.lowbw);
  $('#side').innerHTML=ob?'':sideHTML();$('#tabs').innerHTML=ob?'':tabsHTML();
  let v;
  if(!S.profile&&UI.landing&&!UI.ob&&!UI.sport&&!UI.browse)v=viewLanding();
  else if(!S.profile&&UI.sport&&!UI.ob)v=topbarPublic()+sportHTML(UI.sport);
  else if(!S.profile&&UI.browse&&!UI.ob)v=topbarPublic()+'<h1>The sports</h1><div class="grid">'+CM.SP.map(s=>'<button class="card" style="text-align:left;cursor:pointer" data-act="sport-open" data-v="'+s.id+'"><div class="row between"><h3>'+esc(s.name)+'</h3>'+chip(s.id)+'</div><p class="muted">'+esc(s.phil.split('. ')[0])+'.</p></button>').join('')+'</div><button class="btn" data-act="landing-start">Build my plan</button>';
  else if(ob){if(!UI.ob)UI.ob=newOb();v=viewOb();}
  else if(UI.sub==='community')v=viewComm();
  else v=({today:viewToday,plan:viewPlan,skills:viewSkills,journal:viewJournal,progress:viewProgress,coach:viewCoach})[UI.tab]();
  $('#view').innerHTML=v;
  afterRender();renderOverlay();
}
const vidUrls=new Map();
function hydrateVideos(root){
  (root||document).querySelectorAll('video[data-vid]').forEach(v=>{
    const id=v.dataset.vid;if(vidUrls.has(id)){v.src=vidUrls.get(id);return;}
    St.vidGet(id).then(b=>{if(!b){const p=document.createElement('p');p.className='muted';p.textContent='This clip is not on this device (it may have been cleared, or this data came from a backup).';v.replaceWith(p);return;}
      const u=URL.createObjectURL(b);vidUrls.set(id,u);v.src=u;});
  });
}
function afterRender(){
  const v=$('#clipv');
  if(v&&UI.clip.url){v.src=UI.clip.url;v.onerror=()=>toast('This viewer blocked local video playback.');v.ontimeupdate=()=>{const c=UI.clip;if(c.loop&&c.a!=null&&c.b!=null&&c.b>c.a&&v.currentTime>=c.b)v.currentTime=c.a;};drawNotes();}
  const ch=$('#chat');if(ch&&UI.tab==='coach'){const l=ch.lastElementChild;if(l)l.scrollIntoView({block:'nearest'});}
  hydrateVideos($('#view'));
}
function drawNotes(){const el=$('#clipnotes');if(!el)return;el.innerHTML=UI.clip.notes.length?UI.clip.notes.map(n=>'<li><span>'+esc(n.t)+'</span><span><button class="btn sm ghost" data-act="clip-go" data-v="'+n.s+'">'+mmss(Math.floor(n.s))+'</button></span></li>').join(''):'<li><span class="muted">No notes yet. Pause on a moment and add one.</span><span></span></li>';}
function confirmTap(key,cb,overlay){
  if(UI.confirm!==key){UI.confirm=key;overlay?renderOverlay():render();clearTimeout(confirmTap.t);confirmTap.t=setTimeout(()=>{if(UI.confirm===key){UI.confirm=null;overlay?renderOverlay():render();}},4000);return;}
  UI.confirm=null;cb();
}

/* ---------------- actions ---------------- */
const A={};
const top0=()=>window.scrollTo(0,0);
A.tab=d=>{UI.tab=d.v;UI.sub=null;UI.sport=null;UI.chain=null;render();top0();};
const newOb=()=>({step:0,sports:[],goal:'build',level:'beginner',days:3,minutes:45,equip:[],injuries:[],why:[],rhythm:'regular',dow:[],evName:'',evDate:'',ok:[false,false,false,false]});
A['landing-start']=()=>{UI.ob=newOb();UI.sport=null;UI.browse=false;render();top0();};
A['landing-browse']=()=>{UI.browse=true;render();top0();};
A['landing-home']=()=>{UI.browse=false;UI.sport=null;render();top0();};
A['ob-sport']=d=>{const o=UI.ob,k=o.sports.indexOf(d.v);if(k>=0)o.sports.splice(k,1);else if(o.sports.length<3)o.sports.push(d.v);else toast('Pick up to three sports');render();};
A['ob-set']=d=>{UI.ob[d.k]=isNaN(+d.v)?d.v:+d.v;render();};
A['ob-tog']=d=>{const a=UI.ob[d.k],k=a.indexOf(d.v);k>=0?a.splice(k,1):a.push(d.v);render();};
A['ob-dow']=d=>{const a=UI.ob.dow,v=+d.v,k=a.indexOf(v);k>=0?a.splice(k,1):a.push(v);render();};
A['ob-ok']=(d,b)=>{UI.ob.ok[+d.v]=b.checked;const f=$('[data-act="ob-finish"]');if(f)f.disabled=!UI.ob.ok.every(Boolean);};
A['ob-next']=()=>{UI.ob.step++;render();top0();};
A['ob-back']=()=>{if(UI.ob.step===0){UI.ob=null;if(!S.profile)UI.landing=true;}else UI.ob.step--;render();top0();};
A['ob-finish']=()=>{
  const o=UI.ob;if(!o.ok.every(Boolean))return;
  const prev=S.profile;
  S.profile={done:true,sports:o.sports,goal:o.goal,level:o.level,days:o.days,minutes:o.minutes,equip:o.equip,injuries:o.injuries,why:o.why,rhythm:o.rhythm,dow:o.dow,block:prev?prev.block:1};
  S.plan=En.genPlan(S.profile,new Date());S.done={};if(!prev)S.chat=[];
  if(o.evDate&&En.daysBetween(today(),o.evDate)>=0)S.events.push({id:uid(),name:o.evName.trim()||'My event',date:o.evDate,sport:o.sports[0],kind:'competition'});
  UI.ob=null;UI.tab='today';UI.week=null;save();render();top0();toast('Your 4-week plan is ready');
};
A['banner-off']=()=>{S.set.bannerOff=true;save();render();};
A['install-off']=()=>{S.set.installOff=true;save();render();};
A.install=async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();try{await deferredPrompt.userChoice;}catch(e){}deferredPrompt=null;render();};
A.week=d=>{UI.week=+d.v;render();};
A.regen=()=>{if(!nextSession()){S.plan=En.genPlan(S.profile,new Date());S.done={};save();render();return;}confirmTap('regen',()=>{S.plan=En.genPlan(S.profile,new Date());S.done={};UI.week=null;save();render();toast('Plan rebuilt');});};
A.newblock=()=>{const c=$('#lvup')||$('#lvup2'),lv=!!(c&&c.checked);En.newBlock(S,lv,new Date());UI.sheet=null;UI.week=null;UI.tab='today';save();render();top0();toast('Block '+S.plan.block+' is ready'+(lv?' at '+S.profile.level+' level':''));};
A.copyplan=()=>{const t=['CornerMan plan · block '+(S.plan.block||1)].concat(S.plan.weeks.map(w=>'\nWeek '+w.n+' ('+En.WKNAME[w.n-1]+')\n'+w.sessions.map((s,i)=>'  Session '+(i+1)+': '+s.name+'\n'+s.items.map(it=>'    - '+EXM[it.id].name+': '+fmtItem(it)+(EXM[it.id].u==='r'?', rest '+it.rest+'s':'')+', RPE '+fmtRpe(it.rpe)).join('\n')).join('\n'))).join('\n');copyText(t);};
A.share=d=>{const s=findSession(d.id);S.comm.mine.push({id:'m'+uid(),by:'You',name:s.name,sport:s.sport,items:s.items.map(i=>i.id)});save();toast('Saved to your community list on this device');};
A.community=()=>{UI.sub='community';render();top0();};
A.clone=d=>{const r=SAMPLES.concat(S.comm.mine).find(x=>x.id===d.id);if(!r)return;const ns=nextSession(),wk=ns?ns.wk:4,W=S.plan.weeks[wk-1];const sess={id:'cl'+uid(),wk:wk,name:'Clone: '+r.name,type:'clone',sport:r.sport,items:r.items.map((id,k)=>Object.assign({id:id},En.rx(EXM[id],S.profile,wk,k,false,'clone')))};const at=ns?W.sessions.indexOf(ns):W.sessions.length;W.sessions.splice(at<0?W.sessions.length:at,0,sess);save();toast('Added to week '+wk);};
A.follow=d=>{const f=S.comm.follow,k=f.indexOf(d.v);k>=0?f.splice(k,1):f.push(d.v);save();render();};
A.report=d=>{S.comm.reported.push(d.id);save();render();toast('Reported and hidden');};
A.block=d=>{S.comm.blocked.push(d.v);save();render();toast('Blocked '+d.v);};
A.unhide=()=>{S.comm.reported=[];S.comm.blocked=[];save();render();};
A['sport-open']=d=>{UI.sport=d.v;UI.chain=null;if(S.profile)UI.tab='skills';render();top0();};
A['sport-close']=()=>{UI.sport=null;render();};
A.mainsport=d=>{const P=S.profile;P.sports=[d.v].concat(P.sports.filter(x=>x!==d.v)).slice(0,3);S.plan=En.genPlan(P,new Date());S.done={};UI.sport=null;UI.tab='plan';UI.week=null;save();render();toast('Plan rebuilt around '+SPM[d.v].name);};
A['skills-seg']=d=>{UI.skills=d.v;UI.chain=null;UI.sport=null;render();};
A.lib=A['skills-seg'];
A['chain-open']=d=>{UI.sheet=null;UI.tab='skills';UI.sub=null;UI.sport=null;UI.chain=d.v;render();top0();};
A['chain-close']=()=>{UI.chain=null;render();};
A['skills-chains']=()=>{UI.tab='skills';UI.skills='chains';UI.chain=null;UI.sport=null;UI.sub=null;render();top0();};
A.lvl=d=>{S.chainStatus[d.c+':'+d.i]=+d.v;save();render();};
A['chain-drills']=d=>{
  const c=En.allChains(S).find(x=>x.id===d.v);if(!c)return;
  const ids=[...new Set(c.steps.map(s=>s.drill).filter(x=>x&&EXM[x]&&!EXM[x].avoid.some(a=>S.profile.injuries.includes(a))))];
  if(!ids.length){toast(c.mine?'Your own chains have no linked drills. Practice them in your skill sessions.':'These drills conflict with the areas you are protecting.');return;}
  const left=allSessions().filter(s=>!S.done[s.id]);if(!left.length){toast('Your plan is complete. Build your next block first.');return;}
  const t=left.find(s=>s.type==='skill'&&c.sports.includes(s.sport))||left.find(s=>s.type==='skill')||left[0];
  const have=new Set(t.items.map(i=>i.id));let n=0;
  ids.forEach((id,k)=>{if(!have.has(id)){t.items.push(Object.assign({id:id},En.rx(EXM[id],S.profile,t.wk,k,false,'skill')));n++;}});
  save();toast(n?'Added '+plural(n,'drill')+' to '+t.name:'Those drills are already in '+t.name);
};
A['chain-del']=d=>confirmTap('chdel',()=>{S.myChains=S.myChains.filter(c=>c.id!==d.v);Object.keys(S.chainStatus).forEach(k=>{if(k.startsWith(d.v+':'))delete S.chainStatus[k];});UI.chain=null;save();render();toast('Chain deleted');});
A['chainform-open']=()=>{UI.sheet={kind:'chainform'};renderOverlay();};
A['chain-save']=()=>{
  const steps=En.parseChainSteps($('#cht').value);if(!steps.length){toast('Add at least one link');return;}
  const c={id:'my-'+uid(),sports:[$('#chs').value],name:$('#chn').value.trim().slice(0,80)||'My chain',level:'Custom',goal:$('#chg').value.trim()||'Your own chain.',steps:steps};
  S.myChains.push(c);save();UI.sheet=null;UI.tab='skills';UI.chain=c.id;render();top0();toast('Chain saved');
};
A['v-del']=d=>{S.videos=S.videos.filter(v=>v.id!==d.id);save();render();};
A.pm=d=>{UI.pm=d.v;render();};
A.check=(d,b)=>{const c=S.checks[d.s]||(S.checks[d.s]={});c[d.i]=b.checked;save();const t=b.closest('.sec').querySelector('.mono');if(t)t.textContent=Object.values(c).filter(Boolean).length+'/'+SPM[d.s].check.length;};
A.camp=(d,b)=>{const ev=En.nextEvent(S.events,new Date()),ph=ev&&En.phaseFor(ev.days);if(!ph)return;const t=today(),c=S.camp[t]||(S.camp[t]={});c[ph.id+d.i]=b.checked;
  const keys=Object.keys(S.camp).sort();if(keys.length>120)keys.slice(0,keys.length-120).forEach(k=>delete S.camp[k]);save();};
A.chip=d=>{sendChat(d.v);};
A.demo=()=>{const ids=['goblet','pushup','dbrow','rdl','bwsquat','plank'],t=new Date();for(let k=0;k<9;k++){const dt=new Date(t);dt.setDate(t.getDate()-(k*3+1));const sets=[];ids.forEach((id,j)=>{const e=EXM[id];for(let n=0;n<3;n++)sets.push({ex:id,w:e.eq==='db'?Math.round((20+(8-k)*1.5+j)/2.5)*2.5:0,r:e.u==='t'?40:10-(n?1:0),rpe:7});});S.hist.push({id:uid(),date:En.ymd(dt),ts:+dt,sid:'demo',name:'Example full body',sets:sets,mins:42,demo:true});}S.hist.sort((a,b)=>a.ts-b.ts);save();render();toast('Example history loaded');};
A.undemo=()=>{S.hist=S.hist.filter(h=>!h.demo);save();render();toast('Example history removed');};
A.settings=()=>{UI.settings=true;renderOverlay();showStorage();};
A['settings-close']=()=>{UI.settings=false;UI.confirm=null;UI.restore=null;render();};
A.set=d=>{S.set[d.k]=d.v;save();if(d.k==='theme')applyTheme();renderOverlay();};
A.toggle=(d,b)=>{S.set[d.k]=b.checked;if(d.k==='pub'&&b.checked){St.clear();toast('Saved data cleared. Nothing is stored from now on.');}else save();document.body.classList.toggle('lowbw',!!S.set.lowbw);};
A.copydata=()=>copyText(JSON.stringify(S,null,2));
A.backup=()=>{
  const txt=JSON.stringify(Object.assign({app:'CornerMan',exported:new Date().toISOString()},S),null,2);
  try{const b=new Blob([txt],{type:'application/json'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='cornerman-backup-'+today()+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000);toast('Backup downloaded');}
  catch(e){copyText(txt);}
};
A['restore-go']=()=>{if(!UI.restore)return;S=UI.restore.data;migrate();UI.restore=null;UI.settings=false;UI.tab='today';save();applyTheme();render();top0();toast('Backup restored');};
A.persist=async()=>{const ok=await St.askPersist();toast(ok?'Your browser will keep CornerMan data unless you clear it yourself.':'Your browser decides on its own. Installing the app and backing up both help.');showStorage();};
A.redo=()=>{const P=S.profile;UI.settings=false;UI.ob={step:0,sports:P.sports.slice(),goal:P.goal,level:P.level,days:P.days,minutes:P.minutes,equip:P.equip.slice(),injuries:P.injuries.slice(),why:(P.why||[]).slice(),rhythm:P.rhythm||'regular',dow:(P.dow||[]).slice(),evName:'',evDate:'',ok:[false,false,false,false]};render();top0();};
A.wipe=()=>confirmTap('wipe',()=>{S=St.blank();St.clear();St.vidClear();vidUrls.forEach(u=>URL.revokeObjectURL(u));vidUrls.clear();UI=freshUI();applyTheme();render();top0();toast('All data deleted');},true);
A['copy-close']=()=>{UI.copybox=null;renderOverlay();};
A['sheet-close']=()=>{UI.sheet=null;UI.confirm=null;render();};
A['sh-set']=d=>{const o=UI.sheet.data;o[d.k]=isNaN(+d.v)?d.v:+d.v;
  if(UI.sheet.kind==='jlog'){document.querySelectorAll('[data-act="sh-set"][data-k="'+d.k+'"]').forEach(b=>{const on=b.dataset.v===d.v;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on);});return;}
  renderOverlay();};
/* check-in */
A['checkin-open']=()=>{const due=En.checkinDue(S,new Date()),ns=nextSession(),w=due||(ns?ns.wk:4);UI.sheet={kind:'checkin',data:{w:w,feel:'right',sleep:'ok',body:'normal',pain:[],life:'normal',days:S.profile.days,note:''}};renderOverlay();};
A['ci-pain']=d=>{const a=UI.sheet.data.pain,k=a.indexOf(d.v);k>=0?a.splice(k,1):a.push(d.v);renderOverlay();};
A['ci-submit']=()=>{const c=UI.sheet.data;S.checkins=(S.checkins||[]).filter(x=>!(x.block===(S.plan.block||1)&&x.week===c.w));c.result=En.applyCheckin(S,c.w,c,new Date());save();render();};
/* events */
A['event-open']=d=>{const e=d&&d.id?S.events.find(x=>x.id===d.id):null;UI.sheet={kind:'event',data:e?Object.assign({},e):{name:'',date:'',sport:S.profile.sports[0],kind:'competition'}};renderOverlay();};
A['ev-save']=()=>{const e=UI.sheet.data,n={id:e.id||uid(),name:$('#evn').value.trim().slice(0,80)||'My event',date:$('#evd').value,sport:$('#evs').value,kind:$('#evt').value};
  if(!/^\d{4}-\d{2}-\d{2}$/.test(n.date)){toast('Pick a date');return;}
  S.events=S.events.filter(x=>x.id!==n.id).concat(n);save();UI.sheet=null;render();toast(En.daysBetween(today(),n.date)>=0?'Countdown set: '+plural(En.daysBetween(today(),n.date),'day')+' to go':'Event saved');};
A['ev-del']=d=>confirmTap('evdel',()=>{S.events=S.events.filter(x=>x.id!==d.id);save();UI.sheet=null;render();toast('Event removed');},true);
/* goals */
A['goal-open']=()=>{UI.sheet={kind:'goal'};renderOverlay();};
A['goal-sug']=d=>{const i=$('#gt');if(i){i.value=d.v;i.focus();}};
A['goal-save']=()=>{const t=$('#gt').value.trim();if(!t)return;const by=$('#gd').value||'',ms=$('#gm').value.split('\n').map(x=>x.trim()).filter(Boolean).slice(0,10).map(x=>({t:x,done:false}));
  S.goals.push({id:uid(),text:t.slice(0,120),by:by,ms:ms,made:today()});
  if(by&&$('#gev').checked&&En.daysBetween(today(),by)>=0)S.events.push({id:uid(),name:t.slice(0,80),date:by,sport:S.profile.sports[0],kind:'other'});
  save();UI.sheet=null;render();toast('Goal saved');};
A['goal-ms']=(d,b)=>{const g=S.goals.find(x=>x.id===d.id);if(!g)return;g.ms[+d.i].done=b.checked;save();render();};
A['goal-del']=d=>confirmTap('gdel:'+d.id,()=>{S.goals=S.goals.filter(x=>x.id!==d.id);save();render();});
/* journal */
async function storeClip(file){
  if(!file)return null;
  if(file.size>300*1024*1024){toast('That clip is over 300 MB. Trim it on your phone first.');return false;}
  const id='v'+uid()+Date.now().toString(36);
  try{await St.vidPut(id,file,S.set.pub);return id;}catch(e){toast('Could not save the clip on this device. Storage may be full.');return false;}
}
A['quick-note']=()=>{const t=$('#qnote').value.trim();if(!t){toast('Write a line first');return;}S.journal.unshift({id:uid(),kind:'note',type:'note',date:today(),ts:Date.now(),sport:S.profile.sports[0],text:t.slice(0,4000)});save();render();toast('Saved to your journal');};
A['j-post']=async()=>{
  const t=$('#jtext').value.trim(),f=$('#jvid').files&&$('#jvid').files[0];
  if(!t&&!f){toast('Write something or attach a clip');return;}
  const btn=$('[data-submit="j-post"] button[type=submit]');if(btn)btn.disabled=true;
  const vid=await storeClip(f);if(vid===false){if(btn)btn.disabled=false;return;}
  S.journal.unshift({id:uid(),kind:'note',type:'note',date:today(),ts:Date.now(),sport:$('#jsport').value,text:t.slice(0,4000),videoId:vid||undefined});save();render();toast('Posted to your journal');
};
A['jlog-open']=d=>{const ev=En.nextEvent(S.events,new Date());UI.sheet={kind:'jlog',data:{type:ev&&ev.days<0?'competition':'class',sport:S.profile.sports[0],intensity:3,chain:(d&&d.chain)||''}};renderOverlay();};
A['jlog-save']=async()=>{
  const d=UI.sheet.data,num=id=>{const v=parseInt($(id).value,10);return isNaN(v)?0:Math.max(0,v);};
  const f=$('#jv').files&&$('#jv').files[0],btn=$('[data-submit="jlog-save"] button[type=submit]');if(btn)btn.disabled=true;
  const vid=await storeClip(f);if(vid===false){if(btn)btn.disabled=false;return;}
  const e={id:uid(),kind:'session',type:$('#jty').value,date:$('#jd').value||today(),ts:Date.now(),sport:$('#jsp').value,minutes:num('#jmin'),rounds:num('#jr'),subsFor:num('#jsf'),subsAgainst:num('#jsa'),intensity:d.intensity,
    worked:En.tags($('#jw').value),struggled:En.tags($('#js').value),text:$('#jn').value.trim().slice(0,4000),videoId:vid||undefined};
  const ch=$('#jch').value;
  if(ch&&$('#jst')){e.chain=ch;e.chainStep=+$('#jst').value;e.chainLevel=+$('#jlv').value;
    for(let i=0;i<=e.chainStep;i++){const k=ch+':'+i;S.chainStatus[k]=Math.max(S.chainStatus[k]||0,e.chainLevel);}}
  S.journal.unshift(e);S.journal.sort((a,b)=>b.date.localeCompare(a.date)||b.ts-a.ts);save();UI.sheet=null;UI.tab='journal';UI.jseg='journal';render();top0();toast('Session logged');
};
A['j-del']=d=>confirmTap('jdel:'+d.id,()=>{const e=S.journal.find(x=>x.id===d.id);if(e&&e.videoId){St.vidDel(e.videoId);if(vidUrls.has(e.videoId)){URL.revokeObjectURL(vidUrls.get(e.videoId));vidUrls.delete(e.videoId);}}S.journal=S.journal.filter(x=>x.id!==d.id);save();render();});
A.jseg=d=>{UI.jseg=d.v;render();};
/* clip tools */
const cv=()=>$('#clipv');
A['clip-speed']=d=>{if(cv())cv().playbackRate=+d.v;};
A['clip-step']=d=>{const v=cv();if(!v)return;v.pause();v.currentTime=Math.max(0,v.currentTime+(+d.v)/30);};
A['clip-a']=()=>{if(cv()){UI.clip.a=cv().currentTime;toast('A set at '+mmss(Math.floor(UI.clip.a)));}};
A['clip-b']=()=>{if(cv()){UI.clip.b=cv().currentTime;toast('B set at '+mmss(Math.floor(UI.clip.b)));}};
A['clip-loop']=(d,b)=>{UI.clip.loop=!UI.clip.loop;b.textContent='Loop A-B: '+(UI.clip.loop?'on':'off');};
A['clip-go']=d=>{if(cv())cv().currentTime=+d.v;};
A['clip-save']=async()=>{
  const c=UI.clip;if(!c.file){toast('Pick a clip first');return;}
  const vid=await storeClip(c.file);if(!vid)return;
  S.journal.unshift({id:uid(),kind:'note',type:'note',date:today(),ts:Date.now(),sport:S.profile.sports[0],text:(c.file.name?'Film review: '+c.file.name+'\n':'Film review\n')+c.notes.map(n=>mmss(Math.floor(n.s))+' '+n.t).join('\n'),videoId:vid});
  save();UI.jseg='journal';render();top0();toast('Clip saved to your journal');
};
/* submits */
A['v-add']=()=>{
  const url=$('#vurl').value.trim();let u;try{u=new URL(url);}catch(e){toast('That does not look like a link');return;}
  const host=u.hostname.replace(/^www\.|^m\./,'');
  if(u.protocol!=='https:'){toast('Use a secure https link');return;}
  if(!['youtube.com','youtu.be','vimeo.com'].includes(host)){toast('Only YouTube and Vimeo links are supported');return;}
  S.videos.unshift({id:uid(),url:u.href,host:host==='vimeo.com'?'Vimeo':'YouTube',title:$('#vtitle').value.trim()||'Saved '+(host==='vimeo.com'?'Vimeo':'YouTube')+' video',sport:$('#vsp').value,note:$('#vnote').value.trim()});
  save();render();toast('Video saved');
};
A['clip-note']=()=>{const v=cv(),i=$('#cnote');if(!v||!i.value.trim())return;UI.clip.notes.push({t:i.value.trim(),s:v.currentTime});UI.clip.notes.sort((a,b)=>a.s-b.s);i.value='';drawNotes();};
const GO={checkin:{act:'checkin-open',label:'Start check-in'},event:{act:'event-open',label:'Add an event'},journal:{act:'tab',v:'journal',label:'Open journal'},chains:{act:'skills-chains',label:'Open chains'},goals:{act:'tab',v:'progress',label:'Open goals'}};
function sendChat(t){t=t.trim();if(!t)return;S.chat.push({from:'me',text:t});
  const r=CM.coachReply(t,{S:S,now:new Date(),next:nextSession,est:est,fmtItem:fmtItem,save:save});
  let go=null;if(r.action){if(r.action.startsWith('chain:'))go={act:'chain-open',v:r.action.slice(6),label:'Open this chain'};else go=GO[r.action]||null;}
  S.chat.push({from:'coach',text:r.text,chips:r.chips,go:go});if(S.chat.length>60)S.chat=S.chat.slice(-60);save();UI.tab='coach';render();}
A['chat-send']=()=>{const i=$('#cmsg');const t=i.value;i.value='';sendChat(t);const n=$('#cmsg');if(n)n.focus();};
/* player */
A.start=d=>{const s=findSession(d.id);if(!s)return;const ef=En.effectiveItems(S,s,new Date());UI.player={sid:d.id,i:0,items:JSON.parse(JSON.stringify(ef.items)),taper:ef.taper,rows:{},logs:[],t0:Date.now(),rest:null,sum:null,empty:false};renderOverlay();};
A['p-close']=()=>{stopRest();UI.player=null;render();};
A['p-done']=()=>{UI.player=null;UI.tab='today';UI.sub=null;render();top0();};
A['p-note']=()=>{const t=$('#pnote').value.trim(),p=UI.player;if(t){const s=findSession(p.sid);S.journal.unshift({id:uid(),kind:'note',type:'note',date:today(),ts:Date.now(),sport:s?s.sport:S.profile.sports[0],text:(s?s.name+': ':'')+t.slice(0,4000)});save();toast('Saved to your journal');}A['p-done']();};
A['p-next']=()=>{UI.player.i++;stopRest();renderOverlay();};
A['p-prev']=()=>{UI.player.i--;stopRest();renderOverlay();};
A['p-addset']=()=>{const p=UI.player,rows=p.rows[p.i],l=rows[rows.length-1];rows.push({w:l.w,r:l.r,rpe:l.rpe,done:false});renderOverlay();};
A['p-log']=d=>{
  const p=UI.player,it=p.items[p.i],r=p.rows[p.i][+d.j],e=EXM[it.id];
  r.done=true;p.logs.push({ex:it.id,w:+r.w||0,r:+r.r||0,rpe:+r.rpe||0});p.empty=false;
  const nxt=p.rows[p.i][+d.j+1];if(nxt&&e.u==='r'&&!nxt.w&&r.w)nxt.w=r.w;
  const last=p.rows[p.i].every(x=>x.done),isEnd=last&&p.i===p.items.length-1;
  renderOverlay();
  if(!isEnd&&!last)startRest(e.u==='r'?it.rest:30);
  else if(last&&!isEnd)toast('Move complete. Tap Next move.');
};
A['p-swap']=()=>{const p=UI.player,s=findSession(p.sid),old=EXM[p.items[p.i].id],used=new Set(p.items.map(x=>x.id)),n=En.pick(old.pat,s.sport,used,Date.now()%7,S.profile);if(!n){toast('No safe alternative found');return;}
  const ni=Object.assign({id:n.id},En.rx(n,S.profile,s.wk,p.i,false,s.type));
  if(s.items[p.i]&&s.items[p.i].id===old.id)s.items[p.i]=JSON.parse(JSON.stringify(ni));
  p.items[p.i]=p.taper?En.taperItems([ni])[0]:ni;delete p.rows[p.i];save();stopRest();renderOverlay();toast('Swapped for '+n.name);};
A['p-finish']=()=>{
  const p=UI.player,s=findSession(p.sid);stopRest();
  if(!p.logs.length){p.empty=true;renderOverlay();return;}
  const rec={id:uid(),date:today(),ts:Date.now(),sid:s.id,name:s.name,sets:p.logs.slice(),mins:Math.max(1,Math.round((Date.now()-p.t0)/60000))};
  S.hist.push(rec);S.done[s.id]=today();save();p.sum=rec;renderOverlay();
};
A['p-skip']=()=>{stopRest();renderOverlay();};
A['p-plus']=()=>{const p=UI.player;if(p&&p.rest){p.rest.end+=15000;p.rest.total+=15;tickRest();}};
function startRest(sec){const p=UI.player;stopRest();p.rest={end:Date.now()+sec*1000,total:sec,left:sec};p.timer=setInterval(tickRest,250);renderOverlay();}
function stopRest(){const p=UI.player;if(p){clearInterval(p.timer);p.rest=null;}}
function tickRest(){
  const p=UI.player;if(!p||!p.rest)return;
  const left=Math.max(0,Math.ceil((p.rest.end-Date.now())/1000));p.rest.left=left;
  const c=$('#ringc'),t=$('#rtxt');
  if(c)c.setAttribute('stroke-dashoffset',(326.7*(1-left/p.rest.total)).toFixed(1));if(t)t.textContent=mmss(left);
  if(left<=0){clearInterval(p.timer);p.rest=null;beep();renderOverlay();toast('Rest over. Next set.');}
}
function beep(){try{if(S.set.sound){const c=new (window.AudioContext||window.webkitAudioContext)(),o=c.createOscillator(),g=c.createGain();o.frequency.value=880;g.gain.value=0.08;o.connect(g);g.connect(c.destination);o.start();setTimeout(()=>{o.stop();c.close();},180);}if(navigator.vibrate)navigator.vibrate(150);}catch(e){}}
function applyTheme(){const t=S.set.theme,r=document.documentElement;if(t==='auto')r.removeAttribute('data-theme');else r.setAttribute('data-theme',t);}
async function showStorage(){const el=$('#storeinfo');if(!el)return;const i=await St.storageInfo();const el2=$('#storeinfo');if(!el2)return;el2.textContent=(i.usage?'Using '+(i.usage/1048576).toFixed(1)+' MB. ':'')+(i.persisted?'Protected from automatic cleanup.':'');}
/* inputs */
const IN={
 pw:t=>{UI.player.rows[UI.player.i][+t.dataset.j].w=t.value;},
 pr:t=>{UI.player.rows[UI.player.i][+t.dataset.j].r=t.value;},
 pe:t=>{UI.player.rows[UI.player.i][+t.dataset.j].rpe=+t.value;},
 fq:t=>{UI.f.q=t.value;$('#exlist').innerHTML=exListHTML();},
 fsp:t=>{UI.f.sp=t.value;$('#exlist').innerHTML=exListHTML();},
 feq:t=>{UI.f.eq=t.value;$('#exlist').innerHTML=exListHTML();},
 fd:t=>{UI.f.d=t.value;$('#exlist').innerHTML=exListHTML();},
 fpat:t=>{UI.f.pat=t.value;$('#exlist').innerHTML=exListHTML();},
 pex:t=>{UI.pex=t.value;render();},
 vsport:t=>{UI.vsport=t.value;render();},
 jft:t=>{UI.jf.type=t.value;render();},
 jfs:t=>{UI.jf.sp=t.value;render();},
 obevn:t=>{UI.ob.evName=t.value;},
 obevd:t=>{UI.ob.evDate=t.value;},
 'ci-note':t=>{UI.sheet.data.note=t.value;},
 jch:t=>{const keep={};['jd','jty','jsp','jmin','jr','jsf','jsa','jw','js','jn'].forEach(id=>{const el=$('#'+id);if(el)keep[id]=el.value;});UI.sheet.data.chain=t.value;renderOverlay();Object.keys(keep).forEach(id=>{const el=$('#'+id);if(el)el.value=keep[id];});},
 restore:t=>{const f=t.files&&t.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const data=St.fromBackup(String(r.result));UI.restore={data:data,date:(JSON.parse(String(r.result)).exported||'').slice(0,10)||f.name};renderOverlay();}catch(e){toast('That file is not a CornerMan backup');}};r.readAsText(f);},
 clipfile:t=>{const f=t.files&&t.files[0];if(!f)return;try{if(UI.clip.url)URL.revokeObjectURL(UI.clip.url);UI.clip={url:URL.createObjectURL(f),file:f,notes:[],a:null,b:null,loop:false};const box=$('#clipbox');box.hidden=false;const v=cv();v.src=UI.clip.url;v.onerror=()=>toast('This viewer blocked local video playback.');drawNotes();}catch(e){toast('Could not open that file');}}
};
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b||b.tagName==='INPUT')return;const f=A[b.dataset.act];if(f){f(b.dataset,b,e);}});
document.addEventListener('change',e=>{const t=e.target;if(t.tagName==='INPUT'&&t.type==='checkbox'&&t.dataset.act&&A[t.dataset.act]){A[t.dataset.act](t.dataset,t,e);return;}const k=t.dataset&&t.dataset.in;if(k&&IN[k]&&(t.type==='file'||t.tagName==='SELECT'||t.type==='date'))IN[k](t);});
document.addEventListener('input',e=>{const t=e.target,k=t.dataset&&t.dataset.in;if(k&&IN[k]&&t.type!=='file'&&t.tagName!=='SELECT')IN[k](t);});
document.addEventListener('submit',e=>{const f=e.target.dataset&&e.target.dataset.submit;if(f&&A[f]){e.preventDefault();A[f](e.target);}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(UI.copybox!=null){UI.copybox=null;renderOverlay();}else if(UI.sheet){A['sheet-close']();}else if(UI.settings){A['settings-close']();}}});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;render();});
window.addEventListener('appinstalled',()=>{deferredPrompt=null;toast('CornerMan is installed');render();});
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')){
  window.addEventListener('load',()=>{navigator.serviceWorker.register('sw.js').then(()=>{if(UI.settings)renderOverlay();}).catch(()=>{});});
}
CM.app={get state(){return S;},render:render};
applyTheme();render();
})(globalThis.CM=globalThis.CM||{});
