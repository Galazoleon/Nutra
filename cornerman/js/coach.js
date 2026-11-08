/* CornerMan offline coach. Rule-based, runs on the device, no AI key.
   coachReply(msg, ctx) -> {text, chips?, action?}. ctx = {S, now, next, est, fmtItem, save}.
   Safety checks always run first. */
(function(CM){
"use strict";
const E=()=>CM.engine;
const RED=/chest pain|chest tight|faint|passed out|dizz|light.?headed|short(ness)? of breath|can'?t breathe|sharp pain|numb|tingl|blackout|heart (race|racing|pound)|concuss|knocked out|blacked out/;
const ED=/starv|purg|binge|laxative|not eat|skip(ping)? meals|hate my body|anorex|bulim|throw up|crash diet|eat nothing|under ?eat/;
const CUT=/weight cut|make weight|cutting weight|water cut|sauna suit|dehydrat/;
const PARTS={knee:'knee',shoulder:'shoulder','low back':'lowback',lowback:'lowback',back:'lowback',wrist:'wrist',neck:'neck',elbow:'elbow',hip:'hip',ankle:'ankle'};
function words(s){return s.toLowerCase().split(/[^a-z]+/).filter(x=>x.length>3);}
function setOrig(s){if(!s.orig)s.orig=JSON.parse(JSON.stringify(s.items));}

function coachReply(msg,ctx){
  const S=ctx.S,m=msg.toLowerCase(),ns=ctx.next(),P=S.profile,main=CM.SPM[P.sports[0]],en=E();
  if(RED.test(m))return {text:'That sounds like something to take seriously. Stop training now and get medical help. If you have chest pain, trouble breathing, fainting or a head injury, call your local emergency number. For new or lasting dizziness or sharp pain, see a doctor before you train again. I cannot diagnose what is going on, and I would rather you get checked.'};
  if(ED.test(m))return {text:'Thank you for telling me. I will not give calorie or weight targets, because what you describe can be hard on your body and mind. Please consider talking with a doctor, a dietitian or a therapist who works with eating concerns. Your doctor can point you to local help. If you feel unsafe right now, call your local emergency number. I am glad to keep helping with training that feels good whenever you want.'};
  if(CUT.test(m))return {text:'Keep any weight change small and slow, over weeks. Never use dehydration, saunas, sweat suits, laxatives or diuretics. Pick a division you can make by eating and training normally, and talk with your coach and a doctor well before weigh-ins. I will not write a water-cut protocol.'};

  /* journal: "log: ..." or "I learned ..." saves a note */
  const lg=msg.match(/^\s*(?:log|note|journal)\s*[:\-]\s*(.+)$/i)||msg.match(/^\s*(?:today )?i learned\s+(.+)$/i);
  if(lg){S.journal.unshift({id:Math.random().toString(36).slice(2,9),kind:'note',date:en.ymd(ctx.now),ts:+ctx.now,sport:P.sports[0],text:lg[1].trim()});ctx.save();
    return {text:'Saved to your journal: "'+lg[1].trim()+'". Add a video or details from the Journal tab.',chips:['Open my journal']};}
  if(/open (my )?journal|training journal|sparring log/.test(m))return {text:'Opening your journal.',action:'journal'};

  if(/check.?in|how am i doing|adjust (my )?plan|weekly review/.test(m)){
    const due=en.checkinDue(S,ctx.now);
    return {text:due?'Your week '+due+' check-in is ready. It takes about a minute and I will adjust next week from your answers.':'You are not due for a check-in yet, but you can do one now if your week changed.',action:'checkin'};
  }

  if(/compet|tournament|fight (is|in|on)|my fight|race day|countdown|event|meet\b/.test(m)){
    const ev=en.nextEvent(S.events,ctx.now);
    if(!ev)return {text:'Add your event date and I will run a countdown with phases: base, build, sharpen, taper, the day before and recovery. Sessions in the last 7 days are cut by about 40 percent so you arrive fresh.',action:'event'};
    const ph=en.phaseFor(ev.days);
    return {text:(ev.days>0?ev.days+' days until '+ev.name+'.':ev.days===0?ev.name+' is today.':ev.name+' was '+(-ev.days)+' days ago.')+(ph?' Phase: '+ph.name+'. '+ph.focus:''),chips:['What is next?']};
  }

  /* chains: "what comes after knee cut", "chain for back", "system" */
  if(/chain|system|what comes|comes after|\blinks?\b|\bafter\b/.test(m)){
    const ch=en.allChains(S);let best=null,bs=0,bi=-1;
    ch.forEach(c=>{
      const s=words(c.name).filter(x=>m.includes(x)).length;if(s>bs){bs=s;best=c;bi=-1;}
      c.steps.forEach((st,i)=>{const t=words(st.move+' '+st.pos).filter(x=>m.includes(x)).length;if(t>bs){bs=t;best=c;bi=i;}});
    });
    if(best&&bs>=(/chain|system/.test(m)?1:2)){
      if(bi>=0&&/after|next/.test(m)&&best.steps[bi+1]){const nx=best.steps[bi+1];return {text:'In the '+best.name+', after "'+best.steps[bi].move+'" comes "'+nx.move+'". Cue: '+(nx.cue||'drill it slowly first')+(nx.if&&nx.if[0]?' If '+nx.if[0][0].toLowerCase()+': '+nx.if[0][1].toLowerCase()+'.':''),action:'chain:'+best.id};}
      return {text:best.name+':\n'+best.steps.map((s,i)=>(i+1)+'. '+s.move).join('\n')+'\nDrill one link until it is automatic, test it in positional sparring, then live.',action:'chain:'+best.id};
    }
    const mine=ch.filter(c=>c.sports.some(s=>P.sports.includes(s)));
    if(mine.length&&/chain|system/.test(m))return {text:'Chains for your sports:\n'+mine.map(c=>'• '+c.name).join('\n'),action:'chains'};
  }

  const av=m.match(/avoid (knee|shoulder|low back|lowback|back|wrist|neck|elbow|hip|ankle)/);
  if(av&&/rebuild|plan|exercise/.test(m)){const part=PARTS[av[1]];if(!P.injuries.includes(part))P.injuries.push(part);S.plan=en.genPlan(P,ctx.now);S.done={};ctx.save();return {text:'Done. I rebuilt your four weeks without exercises that load your '+av[1]+'. Your history is kept, and session checkmarks started fresh. If the pain is sharp, getting worse or lasting more than a few days, please have a doctor look at it.'};}
  const part=Object.keys(PARTS).find(k=>new RegExp('\\b'+k+'\\b').test(m));
  if(/pain|hurt|injur|strain|sprain|tweak/.test(m)){
    if(part)return {text:'Sorry to hear that. I can rebuild your plan to leave out exercises that load your '+part+'. That does not replace a checkup. Pain that is sharp, worsening or lasting more than a few days should be seen by a doctor.',chips:['Rebuild my plan to avoid '+part]};
    return {text:'Sorry to hear that. Where does it hurt: knee, shoulder, low back, wrist, neck, elbow, hip or ankle? If the pain is sharp or came on suddenly, stop training and see a doctor.'};
  }
  if(/restore|undo|full session|original/.test(m)){if(ns&&ns.orig){ns.items=ns.orig;delete ns.orig;ctx.save();return {text:'Restored your full '+ns.name+' session.'};}return {text:'Your next session has no changes to undo.'};}
  if(/swap|replace|substitute|instead|can'?t do|don'?t like|change the/.test(m)){
    if(!ns)return {text:'Your plan is complete, so there is nothing left to swap.'};
    let idx=-1,best=0;ns.items.forEach((it,i)=>{const sc=words(CM.EXM[it.id].name).filter(x=>m.includes(x)).length;if(sc>best){best=sc;idx=i;}});
    if(idx<0)return {text:'Which move do you want to swap? Your next session has these:',chips:ns.items.map(it=>'Swap '+CM.EXM[it.id].name)};
    const old=CM.EXM[ns.items[idx].id],used=new Set(ns.items.map(x=>x.id)),n=en.pick(old.pat,ns.sport,used,Date.now()%7,P);
    if(!n)return {text:'I could not find a safe alternative to '+old.name+' with your gear and limits.'};
    setOrig(ns);ns.items[idx]=Object.assign({id:n.id},en.rx(n,P,ns.wk,idx,false,ns.type));ctx.save();
    return {text:'Swapped '+old.name+' for '+n.name+' in '+ns.name+'. Cue: '+n.cue+'.',chips:['Restore my full next session']};
  }
  const tm=m.match(/(\d+)\s*-?\s*(min|minute)/);
  if(tm||/\bshort(en)?\b|quick|not much time|pressed for time|busy/.test(m)){
    if(!ns)return {text:'Your plan is complete, so there is no next session to shorten.'};
    const mins=tm?en.clamp(+tm[1],15,120):30,n=Math.max(3,Math.round(mins/8));setOrig(ns);ns.items=ns.orig.slice(0,n);ctx.save();
    return {text:'Shortened '+ns.name+' to the first '+ns.items.length+' moves, about '+ctx.est(ns)+' minutes.',chips:['Restore my full next session','What is next?']};
  }
  if(/sore|tired|fatigue|exhaust|beat up|no energy|low energy|run down/.test(m)){
    if(!ns)return {text:'Your plan is complete. Take it easy and keep moving gently.'};
    setOrig(ns);ns.items=ns.orig.map(it=>Object.assign({},it,{sets:Math.max(1,it.sets-(it.sets>1?1:0)),rpe:Math.max(5,it.rpe-1)}));ctx.save();
    return {text:'Eased off. I removed a set from each move and dropped the effort target by 1 for '+ns.name+'. Sleep, water and protein help most with soreness. If this keeps happening, your weekly check-in will ease the whole week.',chips:['Restore my full next session','Do my check-in']};
  }
  if(/goal|life plan|long.?term|milestone/.test(m))return {text:'Goals live in the Progress tab. Write the big one ("Compete at a local tournament", "Run a 10k", "Earn my next stripe"), add a date if you have one, and break it into 3 to 5 milestones. If it has a date, add it as an event too and I will count down to it.',action:'goals'};
  if(/lose weight|fat loss|calorie|diet|lose fat/.test(m))return {text:'Aim for a modest deficit you can keep for months, roughly a pound or less a week for most people. Lift two or three days, walk daily, eat protein at each meal and sleep enough. Skip crash diets and extreme restriction.'};
  if(/deload|recovery week|week 4/.test(m))return {text:'Week 4 is a recovery week. It has fewer sets and easier effort so your body can absorb the work. You come back stronger in the next block.'};
  if(/next|today|what.*plan/.test(m)&&!/cue/.test(m)){
    if(!ns)return {text:'You finished every session. Build your next block from the Today tab.'};
    const ef=en.effectiveItems(S,ns,ctx.now);
    return {text:'Next up is '+ns.name+' in week '+ns.wk+(ef.taper?' (tapered for your event)':'')+':\n'+ef.items.map(it=>'• '+CM.EXM[it.id].name+' '+ctx.fmtItem(it)).join('\n')};
  }
  if(/cue|technique|form|tip|how (do|to)/.test(m)){
    let best=null,bs=0;CM.EX.forEach(e=>{const sc=words(e.name).filter(x=>m.includes(x)).length;if(sc>bs){bs=sc;best=e;}});
    if(best)return {text:best.name+': '+best.cue+'. Common error: '+best.err+'. Easier: '+best.reg+'.'+(best.prog?' Harder: '+best.prog+'.':'')};
    const sp=CM.SP.find(s=>m.includes(s.name.toLowerCase())||m.includes(s.id))||main;return {text:sp.name+': '+sp.cue};
  }
  return {text:'I can help with these:\n• Shorten your next session ("I have 30 minutes")\n• Swap an exercise ("swap push-up")\n• Ease off when you are sore\n• Technique cues ("cue for squat") from 250+ exercises\n• Technique chains ("what comes after knee cut")\n• Your weekly check-in and event countdown\n• Save a note ("log: kept my elbows tight in guard")',chips:['What is next?','Do my check-in','Show my chains']};
}
CM.coachReply=coachReply;
})(globalThis.CM=globalThis.CM||{});
