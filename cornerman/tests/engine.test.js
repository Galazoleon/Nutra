/* Run: node --test tests/  (from the cornerman folder) */
const test=require('node:test'),assert=require('node:assert');
['data/sports','data/exercises','data/chains','engine','coach','store'].forEach(f=>require('../js/'+f+'.js'));
const CM=globalThis.CM,En=CM.engine;
const D=s=>En.parseYmd(s);
const prof=o=>Object.assign({sports:['bjj'],goal:'general',level:'beginner',days:3,minutes:45,equip:[],injuries:[],block:1},o||{});
const state=P=>{const S=CM.store.blank();S.profile=P;S.plan=En.genPlan(P,D('2026-11-02'));return S;};

test('library has 200+ valid, unique exercises',()=>{
  assert.ok(CM.EX.length>=200,'only '+CM.EX.length);
  assert.strictEqual(new Set(CM.EX.map(e=>e.id)).size,CM.EX.length);
  const pats=new Set(['squat','lunge','hinge','push','pull','grip','core','cardio','mobility','drill','neck']);
  for(const e of CM.EX){
    assert.ok(pats.has(e.pat),e.id+' pattern '+e.pat);
    assert.ok(['bw','db','band','bar','gym'].includes(e.eq),e.id+' equipment');
    assert.ok([1,2,3].includes(e.d),e.id+' difficulty');
    assert.ok(['r','t','m'].includes(e.u),e.id+' unit');
    assert.ok(e.name&&e.cue&&e.err&&e.reg,e.id+' text fields');
    e.sp.forEach(s=>assert.ok(CM.SPM[s],e.id+' sport '+s));
  }
});

test('every chain step is complete and its drill exists',()=>{
  assert.ok(CM.CHAINS.length>=12);
  const ids=new Set();
  for(const c of CM.CHAINS){
    assert.ok(!ids.has(c.id));ids.add(c.id);
    c.sports.forEach(s=>assert.ok(CM.SPM[s],c.id+' sport'));
    assert.ok(c.steps.length>=4,c.id);
    c.steps.forEach(s=>{assert.ok(s.pos&&s.move&&s.cue,c.id);if(s.drill)assert.ok(CM.EXM[s.drill],c.id+' drill '+s.drill);});
  }
  for(const s of ['bjj','mma','wrestling','boxing'])assert.ok(CM.CHAINS.some(c=>c.sports.includes(s)),'no chain for '+s);
});

test('plans build for every sport, day count and gear, and respect injuries',()=>{
  for(const sp of CM.SP)for(const days of [2,3,4,5,6])for(const equip of [[],['gym']])for(const injuries of [[],['knee','lowback','shoulder']]){
    const P=prof({sports:[sp.id],days,equip,injuries,minutes:60});
    const plan=En.genPlan(P,D('2026-11-02'));
    assert.strictEqual(plan.weeks.length,4);
    plan.weeks.forEach(w=>{assert.strictEqual(w.sessions.length,days);w.sessions.forEach(s=>{
      assert.ok(s.items.length>0,sp.id+' '+s.name+' empty');
      s.items.forEach(it=>{const e=CM.EXM[it.id];assert.ok(e);assert.ok(!e.avoid.some(a=>injuries.includes(a)),sp.id+' '+e.id+' loads an injury');
        if(!equip.includes('gym'))assert.ok(e.eq==='bw',sp.id+' '+e.id+' needs '+e.eq);});
    });});
  }
});

test('grapplers get neck work on upper and full days',()=>{
  const plan=En.genPlan(prof({sports:['wrestling'],days:4,equip:['band']}),D('2026-11-02'));
  const upper=plan.weeks[0].sessions.find(s=>s.type==='upper');
  assert.ok(upper.items.some(it=>CM.EXM[it.id].pat==='neck'));
});

test('check-in is due when a week is done or 7 days pass',()=>{
  const S=state(prof());
  assert.strictEqual(En.checkinDue(S,D('2026-11-04')),0);
  S.plan.weeks[0].sessions.forEach(s=>{S.done[s.id]='2026-11-04';});
  assert.strictEqual(En.checkinDue(S,D('2026-11-04')),1);
  En.applyCheckin(S,1,{feel:'right',sleep:'ok',body:'normal',pain:[],life:'normal',days:3},D('2026-11-04'));
  assert.strictEqual(En.checkinDue(S,D('2026-11-05')),0);
  assert.strictEqual(En.checkinDue(S,D('2026-11-16')),2);
});

test('check-in: tired and sore eases next week',()=>{
  const S=state(prof({goal:'build'})),before=JSON.stringify(S.plan.weeks[1]);
  S.plan.weeks[0].sessions.forEach(s=>{S.done[s.id]='x';});
  const ch=En.applyCheckin(S,1,{feel:'hard',sleep:'poor',body:'normal',pain:[],life:'normal',days:3},D('2026-11-08'));
  assert.match(ch.join(' '),/Eased/);
  const a=JSON.parse(before).sessions[1].items,b=S.plan.weeks[1].sessions[1].items;
  assert.ok(b[0].sets<=a[0].sets&&b[0].rpe<a[0].rpe);
  assert.strictEqual(S.plan.weeks[1].adapt,'eased');
});

test('check-in: easy week adds sets; missed week repeats targets',()=>{
  let S=state(prof({goal:'build',sports:['bodybuilding'],equip:['gym']}));
  S.plan.weeks[0].sessions.forEach(s=>{S.done[s.id]='x';});
  const s0=S.plan.weeks[1].sessions[0].items[0].sets;
  En.applyCheckin(S,1,{feel:'easy',sleep:'good',body:'fresh',pain:[],life:'normal',days:3},D('2026-11-08'));
  assert.strictEqual(S.plan.weeks[1].sessions[0].items[0].sets,Math.min(5,s0+1));
  S=state(prof({goal:'build',sports:['bodybuilding'],equip:['gym']}));
  const ch=En.applyCheckin(S,1,{feel:'right',sleep:'ok',body:'normal',pain:[],life:'normal',days:3},D('2026-11-09'));
  assert.match(ch.join(' '),/repeats/);
  assert.strictEqual(S.plan.weeks[1].adapt,'repeat');
  assert.deepStrictEqual(S.plan.weeks[1].sessions.map(s=>s.items.map(i=>i.sets)),S.plan.weeks[0].sessions.map(s=>s.items.map(i=>i.sets)));
});

test('check-in: pain, fewer days and travel rebuild the right weeks',()=>{
  const S=state(prof({equip:['gym'],days:4}));
  S.plan.weeks[0].sessions.forEach(s=>{S.done[s.id]='x';});
  const ch=En.applyCheckin(S,1,{feel:'right',sleep:'ok',body:'normal',pain:['knee'],life:'travel',days:3},D('2026-11-08'));
  assert.ok(S.profile.injuries.includes('knee'));
  assert.strictEqual(S.profile.days,3);
  assert.strictEqual(S.plan.weeks[0].sessions.length,4,'finished week kept');
  for(let w=1;w<4;w++){assert.strictEqual(S.plan.weeks[w].sessions.length,3);
    S.plan.weeks[w].sessions.forEach(s=>s.items.forEach(it=>assert.ok(!CM.EXM[it.id].avoid.includes('knee'))));}
  assert.ok(S.plan.weeks[1].travel);
  S.plan.weeks[1].sessions.forEach(s=>s.items.forEach(it=>assert.strictEqual(CM.EXM[it.id].eq,'bw')));
  assert.ok(S.plan.weeks[2].sessions.some(s=>s.items.some(it=>CM.EXM[it.id].eq!=='bw')),'week 3 back to gym');
  assert.strictEqual(ch.length>=3,true);
  assert.ok(S.done[S.plan.weeks[0].sessions[0].id],'done marks kept');
});

test('week 4 check-in ends the block and new block levels up',()=>{
  const S=state(prof());
  S.checkins=[{week:1,block:1,answers:{feel:'easy'}},{week:2,block:1,answers:{feel:'easy'}}];
  assert.ok(En.suggestLevelUp(S));
  const ch=En.applyCheckin(S,4,{feel:'easy',sleep:'good',body:'fresh',pain:[],life:'normal',days:3},D('2026-11-30'));
  assert.match(ch.join(' '),/Block complete/);
  En.newBlock(S,true,D('2026-12-01'));
  assert.strictEqual(S.profile.block,2);assert.strictEqual(S.plan.block,2);assert.strictEqual(S.profile.level,'intermediate');
  assert.deepStrictEqual(S.done,{});
});

test('countdown phases and taper',()=>{
  const ev=[{id:'a',name:'Open',date:'2026-12-01',sport:'bjj'}];
  const n=En.nextEvent(ev,D('2026-11-26'));
  assert.strictEqual(n.days,5);assert.strictEqual(En.phaseFor(n.days).id,'taper');
  assert.strictEqual(En.phaseFor(60).id,'base');assert.strictEqual(En.phaseFor(30).id,'build');
  assert.strictEqual(En.phaseFor(10).id,'sharpen');assert.strictEqual(En.phaseFor(1).id,'eve');
  assert.strictEqual(En.phaseFor(0).id,'day');assert.strictEqual(En.phaseFor(-3).id,'after');
  assert.strictEqual(En.nextEvent(ev,D('2026-12-20')),null);
  const S=state(prof({goal:'build',equip:['gym']}));S.events=ev;
  const s=S.plan.weeks[0].sessions[1],ef=En.effectiveItems(S,s,D('2026-11-26'));
  assert.ok(ef.taper);
  ef.items.forEach((it,i)=>{assert.ok(it.rpe<=7);const e=CM.EXM[it.id];if(!(e.u==='m'&&e.pat!=='drill'))assert.ok(it.sets<=s.items[i].sets);});
  assert.ok(!En.effectiveItems(S,s,D('2026-11-01')).taper);
  assert.ok(!En.effectiveItems(S,s,D('2026-12-01')).taper,'no taper on event day');
});

test('journal stats count rounds per week and tags',()=>{
  const J=[
    {kind:'session',date:'2026-11-03',rounds:5,subsFor:2,subsAgainst:1,intensity:3,worked:['Knee cut','back take'],struggled:['guard retention']},
    {kind:'session',date:'2026-11-05',rounds:4,subsFor:1,subsAgainst:3,intensity:4,worked:['knee cut']},
    {kind:'note',date:'2026-11-06',text:'learned a thing'}];
  const st=En.journalStats(J,D('2026-11-08'),8);
  assert.strictEqual(st.sessions,2);assert.strictEqual(st.rounds,9);assert.strictEqual(st.subsFor,3);assert.strictEqual(st.subsAgainst,4);
  assert.strictEqual(st.weeks.length,8);assert.strictEqual(st.weeks[7].v,9);
  assert.deepStrictEqual(st.topWorked[0],['knee cut',2]);
  assert.deepStrictEqual(En.tags('a, b;c\n d,,'),['a','b','c','d']);
});

test('custom chains parse arrows',()=>{
  const s=En.parseChainSteps('Half guard -> underhook\nKnees → back take\njust a move');
  assert.strictEqual(s.length,3);assert.strictEqual(s[0].pos,'Half guard');assert.strictEqual(s[1].move,'back take');assert.strictEqual(s[2].move,'just a move');
});

test('coach: safety first, then intents',()=>{
  const S=state(prof({sports:['bjj']}));S.journal=[];
  const ctx={S,now:D('2026-11-04'),next:()=>S.plan.weeks[0].sessions.find(s=>!S.done[s.id]),est:()=>30,fmtItem:it=>it.tgt,save:()=>{}};
  assert.match(CM.coachReply('I have chest pain and want to do my check-in',ctx).text,/medical help/);
  assert.match(CM.coachReply('how do I make weight with a sauna suit',ctx).text,/never use dehydration|Never use dehydration/i);
  assert.strictEqual(CM.coachReply('do my check-in',ctx).action,'checkin');
  assert.strictEqual(CM.coachReply('add my competition',ctx).action,'event');
  const r=CM.coachReply('what comes after knee cut',ctx);assert.strictEqual(r.action,'chain:bjj-pass');assert.match(r.text,/Side control/);
  CM.coachReply('log: frame before you shrimp',ctx);assert.strictEqual(S.journal[0].text,'frame before you shrimp');
  assert.ok(!/chain/i.test(CM.coachReply('I am sore after training',ctx).action||''));
  assert.match(CM.coachReply('cue for nordic hamstring curl',ctx).text,/Nordic/);
});

test('backup restore keeps known keys only',()=>{
  const S=CM.store.blank();S.profile=prof();S.journal=[{id:'x'}];
  const back=CM.store.fromBackup(JSON.stringify(Object.assign({app:'CornerMan',evil:1},S)));
  assert.strictEqual(back.journal.length,1);assert.ok(!('evil' in back));
  assert.throws(()=>CM.store.fromBackup('{"a":1}'));
});
