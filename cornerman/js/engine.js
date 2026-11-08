/* CornerMan engine: plan generation, weekly check-in adaptation, competition phases, taper and
   journal stats. Pure functions over plain data so they can be tested in Node (tests/). */
(function(CM){
"use strict";
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const ymd=d=>{const x=d||new Date();return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');};
const parseYmd=s=>{const p=String(s).split('-').map(Number);return new Date(p[0],p[1]-1,p[2]);};
const daysBetween=(a,b)=>Math.round((parseYmd(b)-parseYmd(a))/86400000);
const addDays=(s,n)=>{const d=parseYmd(s);d.setDate(d.getDate()+n);return ymd(d);};
const clone=o=>JSON.parse(JSON.stringify(o));

const STR=new Set(['squat','hinge','push','pull','lunge','core','grip']);
const TYPES={
 full:{n:'Full body',s:['squat','push','hinge','pull','lunge','core','push','pull']},
 upper:{n:'Upper body',s:['push','pull','push','pull','core','push']},
 lower:{n:'Lower body',s:['squat','hinge','lunge','hinge','core','squat']},
 push:{n:'Push day',s:['push','push','push','push','core']},
 pull:{n:'Pull day',s:['pull','pull','pull','pull','grip','core']},
 legs:{n:'Leg day',s:['squat','hinge','lunge','squat','core']},
 cond:{n:'Conditioning',s:['cardio','core','cardio','mobility']},
 long:{n:'Long aerobic day',s:['cardio','mobility']},
 skill:{n:'Skill and drills',s:['drill','drill','drill','drill','cardio','mobility']},
 mob:{n:'Mobility and recovery',s:['mobility','mobility','mobility','core']}
};
const GRAPPLE={2:['skill','full'],3:['skill','full','cond'],4:['skill','lower','cond','upper'],5:['skill','lower','cond','upper','skill'],6:['skill','lower','cond','upper','skill','mob']};
const WK={
 bodybuilding:{2:['full','full'],3:['push','pull','legs'],4:['upper','lower','upper','lower'],5:['push','pull','legs','upper','lower'],6:['push','pull','legs','push','pull','legs']},
 weightloss:{2:['full','cond'],3:['full','cond','full'],4:['full','cond','full','long'],5:['full','cond','full','cond','long'],6:['full','cond','full','cond','full','long']},
 mma:GRAPPLE,wrestling:GRAPPLE,
 bjj:{2:['skill','full'],3:['skill','full','mob'],4:['skill','upper','skill','lower'],5:['skill','upper','cond','lower','skill'],6:['skill','upper','cond','lower','skill','mob']},
 boxing:{2:['skill','full'],3:['skill','lower','cond'],4:['skill','lower','skill','cond'],5:['skill','lower','cond','upper','skill'],6:['skill','lower','cond','upper','skill','mob']},
 running:{2:['cond','full'],3:['cond','lower','long'],4:['cond','lower','cond','long'],5:['cond','lower','cond','mob','long'],6:['cond','lower','cond','upper','mob','long']},
 powerlifting:{2:['full','full'],3:['lower','upper','full'],4:['lower','upper','lower','upper'],5:['lower','upper','full','lower','upper'],6:['lower','upper','legs','push','pull','full']},
 calisthenics:{2:['full','full'],3:['push','pull','legs'],4:['upper','lower','push','pull'],5:['push','pull','legs','upper','mob'],6:['push','pull','legs','push','pull','mob']},
 chess:{2:['full','cond'],3:['full','cond','mob'],4:['full','cond','mob','cond'],5:['full','cond','mob','cond','full'],6:['full','cond','mob','cond','full','mob']}
};
const DRILL=new Set(['mma','bjj','boxing','wrestling']);
const NECK=new Set(['mma','bjj','wrestling']);
const NB={30:4,45:5,60:6,90:8};
const WKNAME=['Learn the moves','Add a rep or a little weight','Add a set to the first moves','Recovery week'];
const WKHINT=['Leave 2 or 3 reps in the tank on every set.','Beat last week by a rep or a small jump in weight.','Same moves with one more set on the first two.','Fewer sets and easier effort so you come back stronger.'];
const MAXD={beginner:1,intermediate:2,advanced:3};

function availSet(P){const s=new Set(['bw']);if(P.equip.includes('gym'))['db','band','bar','gym'].forEach(x=>s.add(x));else P.equip.forEach(x=>s.add(x));return s;}
function elig(e,sp){return e.all||e.sp.includes(sp)||STR.has(e.pat);}
function pick(pat,sport,used,seed,P){
  const av=availSet(P),md=MAXD[P.level]||1;
  const base=CM.EX.filter(e=>e.pat===pat&&elig(e,sport)&&!used.has(e.id)&&!e.avoid.some(a=>P.injuries.includes(a)));
  let pool=base.filter(e=>av.has(e.eq)&&e.d<=md);
  if(!pool.length)pool=base.filter(e=>av.has(e.eq)&&e.d<=md+1);
  if(!pool.length)pool=base.filter(e=>av.has(e.eq));
  if(!pool.length)return null;
  const pref=e=>e.sp.includes(sport)?1:0,mx=Math.max.apply(null,pool.map(pref));
  pool=pool.filter(e=>pref(e)===mx);
  return pool[Math.abs(seed)%pool.length];
}
function rx(e,P,w,k,fin,type){
  const L={beginner:0,intermediate:1,advanced:2}[P.level]||0;
  let sets=3,tgt='10-12',rest=75,rpe=7;
  if(e.u==='r'){
    const heavy=['squat','hinge','push','pull'].includes(e.pat);
    if(P.goal==='build'){sets=L?4:3;tgt='8-12';rest=90;rpe=8;}
    else if(P.goal==='lose'){sets=3;tgt='12-15';rest=60;rpe=7;}
    else if(P.goal==='compete'){sets=heavy?4:3;tgt=heavy?'5-8':'8-10';rest=heavy?120:75;rpe=7.5;}
    if(e.pat==='neck'){sets=2;tgt='12-15';rest=45;rpe=6;}
    if(L===0)rpe=Math.min(rpe,7);
    if(w===3&&k<2)sets=Math.min(5,sets+1);
    if(w===4)sets=Math.max(2,sets-1);
  }else if(e.u==='t'){sets=w===4?2:3;tgt=[30,40,50][L]+' sec';rest=30;rpe=6;}
  else if(e.pat==='drill'){sets=L>1?4:3;if(w===4)sets=Math.max(2,sets-1);tgt='3 min';rest=60;rpe=6;}
  else{sets=1;rest=0;rpe=6;let m=fin?8:(type==='long'?[30,40,55][L]:[12,15,20][L]);if(w===3)m+=3;if(w===4)m=Math.max(5,m-4);tgt=m+' min';}
  if(w===2||w===3)rpe+=0.5;
  if(w===4)rpe=Math.max(5,rpe-1.5);
  return {sets:sets,tgt:tgt,rest:rest,rpe:rpe};
}
/* w = week the session belongs to (ids), rxW = week whose targets to use (repeat a week = rxW<w). */
function mkSession(type,sport,i,w,P,rxW){
  const T=TYPES[type],rw=rxW||w;let slots=T.s.slice();
  if(!['cond','long','mob'].includes(type))slots=slots.slice(0,NB[P.minutes]||5);
  if(NECK.has(sport)&&['upper','pull','full'].includes(type)){const c=slots.lastIndexOf('core');if(c>=0)slots[c]='neck';}
  const fin=P.goal==='lose'&&!['cond','long','mob','skill'].includes(type);
  const seed0=((P.block||1)-1)*3;
  const used=new Set(),items=[];
  slots.forEach((pat,k)=>{
    let e=null;
    if(type==='long'&&k===0){const c=CM.EXM[sport==='running'?'longrun':'brisk'];if(c&&!c.avoid.some(a=>P.injuries.includes(a)))e=c;}
    if(!e)e=pick(pat,sport,used,seed0+i+k,P);
    if(!e&&pat==='neck')e=pick('core',sport,used,seed0+i+k,P);
    if(e){used.add(e.id);items.push(Object.assign({id:e.id},rx(e,P,rw,k,false,type)));}
  });
  if(fin){const e=pick('cardio',sport,used,seed0+i,P);if(e){const it=Object.assign({id:e.id},rx(e,P,rw,9,true,type));it.fin=true;items.push(it);}}
  const nm=type==='skill'?CM.SPM[sport].name+' skill and drills':T.n+(sport!==P.sports[0]?' · '+CM.SPM[sport].name:'');
  return {id:'w'+w+'s'+(i+1),wk:w,name:nm,type:type,sport:sport,items:items};
}
function altType(s){return DRILL.has(s)?'skill':(s==='running'||s==='chess'||s==='weightloss')?'cond':'full';}
function genWeek(P,w,rxW){
  const main=P.sports[0],days=clamp(P.days,2,6),tpl=(WK[main]||WK.bodybuilding)[days],ex=P.sports.slice(1);
  return {n:w,sessions:tpl.map((t,i)=>{
    let type=t,sport=main;
    if(ex[0]&&days>=3&&i===tpl.length-1){sport=ex[0];type=altType(sport);}
    if(ex[1]&&days>=5&&i===tpl.length-2){sport=ex[1];type=altType(sport);}
    return mkSession(type,sport,i,w,P,rxW);
  })};
}
function genPlan(P,now){
  const weeks=[];for(let w=1;w<=4;w++)weeks.push(genWeek(P,w));
  return {weeks:weeks,made:ymd(now),block:P.block||1};
}
/* Rebuild weeks >= from, keeping earlier weeks and their done marks. */
function regenFrom(S,from){
  for(let w=from;w<=4;w++){
    S.plan.weeks[w-1].sessions.forEach(s=>{delete S.done[s.id];});
    S.plan.weeks[w-1]=genWeek(S.profile,w);
  }
}
function adjustWeek(week,dSets,dRpe,firstOnly){
  week.sessions.forEach(s=>s.items.forEach((it,k)=>{
    const e=CM.EXM[it.id];if(!e)return;
    const isTime=e.u==='m'&&e.pat!=='drill';
    if(!isTime&&(!firstOnly||k<2))it.sets=clamp(it.sets+dSets,1,5);
    it.rpe=clamp(it.rpe+dRpe,5,9);
  }));
}

/* ---------- weekly check-in ---------- */
function weekSessions(S,w){return S.plan&&S.plan.weeks[w-1]?S.plan.weeks[w-1].sessions:[];}
function checkinDue(S,now){
  if(!S.plan||!S.profile)return 0;
  const block=S.plan.block||1,t=ymd(now),age=daysBetween(S.plan.made,t);
  for(let w=1;w<=4;w++){
    if((S.checkins||[]).some(c=>c.block===block&&c.week===w))continue;
    const ss=weekSessions(S,w),allDone=ss.length&&ss.every(s=>S.done[s.id]);
    return (allDone||age>=7*w)?w:0;
  }
  return 0;
}
/* answers: feel easy|right|hard, sleep poor|ok|good, body fresh|normal|beat, pain [parts],
   life normal|busy|more|travel, days 2..6, note. Mutates S, returns a list of plain-language changes. */
function applyCheckin(S,w,a,now){
  const P=S.profile,changes=[],next=w+1,ss=weekSessions(S,w);
  const doneN=ss.filter(s=>S.done[s.id]).length,ratio=ss.length?doneN/ss.length:1;
  const fatigue=(a.feel==='hard')+(a.sleep==='poor')+(a.body==='beat');
  let rebuilt=false;
  const pain=(a.pain||[]).filter(p=>!P.injuries.includes(p));
  if(pain.length){P.injuries=P.injuries.concat(pain);changes.push('Left out exercises that load your '+pain.map(p=>p==='lowback'?'low back':p).join(', ')+' for the rest of this block. If pain is sharp, getting worse or lasts more than a few days, see a doctor.');rebuilt=true;}
  const days=clamp(+a.days||P.days,2,6);
  if(days!==P.days){changes.push('Changed to '+days+' training days a week, starting next week.');P.days=days;rebuilt=true;}
  if(next<=4&&rebuilt)regenFrom(S,next);
  if(next<=4&&a.life==='travel'){
    const tP=Object.assign({},P,{equip:[]});
    S.plan.weeks[next-1].sessions.forEach(s=>{delete S.done[s.id];});
    S.plan.weeks[next-1]=genWeek(tP,next);S.plan.weeks[next-1].travel=true;
    changes.push('Next week uses bodyweight moves only, so you can train wherever you are.');
  }
  if(next<=4){
    const W=S.plan.weeks[next-1];
    if(fatigue>=2||(a.life==='busy'&&fatigue>=1)){adjustWeek(W,-1,-1,false);W.adapt='eased';changes.push('Eased next week: one less set per move and effort down a notch. Sleep and food do the rest.');}
    else if(ratio<0.5&&!rebuilt&&a.life!=='travel'){
      const keep=S.plan.weeks[next-1].travel;S.plan.weeks[next-1]=genWeek(P,next,w);S.plan.weeks[next-1].adapt='repeat';if(keep)S.plan.weeks[next-1].travel=true;
      changes.push('You got '+doneN+' of '+ss.length+' sessions in. Next week repeats this week\'s targets instead of moving up. That is normal, not a setback.');
    }
    else if(a.feel==='easy'&&a.body!=='beat'&&ratio>=0.8){
      if(next===4)changes.push('Training felt easy. Week 4 stays a recovery week on purpose; you will move up in the next block.');
      else{adjustWeek(W,1,0.5,true);W.adapt='harder';changes.push('Training felt easy, so next week adds a set to the first two moves of each session.');}
    }
    else if(!changes.length)changes.push('Kept next week as written. You are on track.');
  }else{
    changes.push('Block complete. Build your next four weeks when you are ready.');
  }
  if(a.life==='more'&&P.days<6&&days===P.days)changes.push('You said you have more time. You can raise your training days in the next check-in or in Settings.');
  S.checkins=S.checkins||[];
  S.checkins.push({week:w,block:S.plan.block||1,date:ymd(now),answers:clone(a),done:doneN,planned:ss.length,changes:changes});
  return changes;
}
function suggestLevelUp(S){
  const P=S.profile;if(!P||P.level==='advanced')return false;
  const easy=(S.checkins||[]).filter(c=>c.block===(S.plan&&S.plan.block||1)&&c.answers.feel==='easy').length;
  return easy>=2;
}
function newBlock(S,levelUp,now){
  const P=S.profile;P.block=(P.block||1)+1;
  if(levelUp)P.level=P.level==='beginner'?'intermediate':'advanced';
  S.plan=genPlan(P,now);S.done={};
}

/* ---------- competition countdown ---------- */
const PHASES=[
 {id:'after',from:-7,to:-1,name:'Recover',focus:'Easy movement for a few days. Write a debrief in your journal while it is fresh.',camp:['Wrote my debrief in the journal','Easy movement only today','Slept 8 hours']},
 {id:'day',from:0,to:0,name:'Event day',focus:'Warm up the way you practiced. Trust your training. Nothing new today.',camp:['Ate a familiar meal','Warmed up the way I practiced','Wrote one line about how it went']},
 {id:'eve',from:1,to:1,name:'Day before',focus:'Light movement, familiar food, pack your bag and get to bed early.',camp:['Packed gear, ID and registration','Ate familiar meals','10 minutes of light movement']},
 {id:'taper',from:2,to:7,name:'Taper',focus:'Volume is cut so you arrive fresh. Keep a little speed. No new techniques.',camp:['Short, sharp session or full rest','Slept 8 hours','Checked my gear and the event rules']},
 {id:'sharpen',from:8,to:21,name:'Sharpen',focus:'Rehearse your game plan at event pace. Keep quality high and volume moderate.',camp:['Rehearsed my A-game chain','Did event-length rounds or pieces','Slept 8 hours']},
 {id:'build',from:22,to:56,name:'Build',focus:'Raise sport-specific intensity: harder rounds and conditioning that matches the event.',camp:['Hard rounds at event pace','Slept 7 or more hours','Reviewed one clip or journal note']},
 {id:'base',from:57,to:100000,name:'Base',focus:'Build your engine and your skills. Train the plan as written.',camp:['Trained or rested as planned','Slept 7 or more hours','Drilled one chain for 10 minutes']}
];
function nextEvent(events,now){
  const t=ymd(now);
  const list=(events||[]).map(e=>Object.assign({},e,{days:daysBetween(t,e.date)})).filter(e=>e.days>=-7).sort((a,b)=>a.days-b.days);
  const up=list.filter(e=>e.days>=0);
  return up[0]||list[list.length-1]||null;
}
function phaseFor(days){return PHASES.find(p=>days>=p.from&&days<=p.to)||null;}
/* During the 7 days before an event, sessions are tapered: about 40 percent less volume, effort capped. */
function taperItems(items){
  return items.map(it=>{
    const e=CM.EXM[it.id],o=Object.assign({},it);
    if(e&&e.u==='m'&&e.pat!=='drill'){const m=parseInt(it.tgt,10)||10;o.tgt=Math.max(5,Math.round(m*0.6))+' min';}
    else o.sets=Math.max(1,Math.round(it.sets*0.6));
    o.rpe=Math.min(it.rpe,7);return o;
  });
}
function effectiveItems(S,sess,now){
  const ev=nextEvent(S.events,now);
  if(ev&&ev.days>=1&&ev.days<=7)return {items:taperItems(sess.items),taper:true,event:ev};
  return {items:sess.items,taper:false,event:ev};
}

/* ---------- journal ---------- */
function weekStart(s){const d=parseYmd(s),k=(d.getDay()+6)%7;d.setDate(d.getDate()-k);return ymd(d);}
function journalStats(J,now,weeks){
  const n=weeks||8,t=ymd(now),start=weekStart(t),buckets=[];
  for(let i=n-1;i>=0;i--){const ws=addDays(start,-7*i);buckets.push({start:ws,l:(+ws.slice(5,7))+'/'+(+ws.slice(8)),v:0,now:i===0});}
  let subsFor=0,subsAgainst=0,rounds=0,sessions=0,intensity=0,inN=0;const worked={},struggled={};
  (J||[]).forEach(e=>{
    if(e.kind!=='session')return;sessions++;
    rounds+=+e.rounds||0;subsFor+=+e.subsFor||0;subsAgainst+=+e.subsAgainst||0;
    if(e.intensity){intensity+=+e.intensity;inN++;}
    const b=buckets.find(b=>b.start===weekStart(e.date));if(b)b.v+=+e.rounds||0;
    (e.worked||[]).forEach(x=>{const k=x.toLowerCase();worked[k]=(worked[k]||0)+1;});
    (e.struggled||[]).forEach(x=>{const k=x.toLowerCase();struggled[k]=(struggled[k]||0)+1;});
  });
  const top=o=>Object.entries(o).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,5);
  return {weeks:buckets,subsFor:subsFor,subsAgainst:subsAgainst,rounds:rounds,sessions:sessions,avgIntensity:inN?intensity/inN:0,topWorked:top(worked),topStruggled:top(struggled)};
}
const tags=s=>String(s||'').split(/[,;\n]/).map(x=>x.trim()).filter(Boolean).slice(0,12);

/* ---------- chains ---------- */
function allChains(S){return CM.CHAINS.concat((S.myChains||[]).map(c=>Object.assign({mine:true},c)));}
function chainProgress(S,c){
  const st=S.chainStatus||{};let sum=0;c.steps.forEach((x,i)=>{sum+=st[c.id+':'+i]||0;});
  return {score:sum,max:c.steps.length*3,live:c.steps.filter((x,i)=>(st[c.id+':'+i]||0)>=3).length};
}
function parseChainSteps(text){
  return String(text||'').split('\n').map(l=>l.trim()).filter(Boolean).slice(0,12).map(l=>{
    const parts=l.split(/\s*(?:->|→|>)\s*/);
    return parts.length>1?{pos:parts[0],move:parts.slice(1).join(' then '),cue:'',if:[]}:{pos:'',move:l,cue:'',if:[]};
  });
}

CM.engine={clamp,ymd,parseYmd,daysBetween,addDays,TYPES,WK,WKNAME,WKHINT,DRILL,availSet,pick,rx,mkSession,genWeek,genPlan,regenFrom,adjustWeek,
  checkinDue,applyCheckin,suggestLevelUp,newBlock,PHASES,nextEvent,phaseFor,taperItems,effectiveItems,weekStart,journalStats,tags,allChains,chainProgress,parseChainSteps};
})(globalThis.CM=globalThis.CM||{});
