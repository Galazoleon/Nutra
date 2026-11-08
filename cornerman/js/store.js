/* CornerMan storage. App state lives in localStorage (small JSON). Video files people attach to
   their journal live in IndexedDB on this device. Nothing is sent anywhere. */
(function(CM){
"use strict";
const KEY='cornerman.v1';
function blank(){return {v:2,profile:null,plan:null,done:{},hist:[],videos:[],checks:{},chat:[],
  comm:{mine:[],follow:[],blocked:[],reported:[]},
  checkins:[],events:[],camp:{},journal:[],chainStatus:{},myChains:[],goals:[],
  set:{theme:'auto',units:'lb',sound:false,lowbw:false,pub:false,bannerOff:false,installOff:false}};}
function load(){
  try{const r=localStorage.getItem(KEY);if(r){const o=JSON.parse(r),b=blank();
    return Object.assign(b,o,{set:Object.assign(b.set,o.set||{}),comm:Object.assign(b.comm,o.comm||{})});}}catch(e){}
  return blank();
}
function save(S){if(S.set.pub)return true;try{localStorage.setItem(KEY,JSON.stringify(S));return true;}catch(e){return false;}}
function clear(){try{localStorage.removeItem(KEY);}catch(e){}}
/* Restore from a backup file. Keeps only known top-level keys. */
function fromBackup(text){
  const o=JSON.parse(text),b=blank();
  if(!o||typeof o!=='object'||!('profile' in o))throw new Error('Not a CornerMan backup');
  Object.keys(b).forEach(k=>{if(k in o)b[k]=o[k];});
  b.set=Object.assign(blank().set,o.set||{});b.comm=Object.assign(blank().comm,o.comm||{});b.v=2;
  return b;
}

/* ---- videos in IndexedDB ---- */
const mem=new Map();let dbp=null;
function db(){
  if(dbp)return dbp;
  dbp=new Promise((res,rej)=>{
    try{const r=indexedDB.open('cornerman',1);
      r.onupgradeneeded=()=>{r.result.createObjectStore('videos');};
      r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);}catch(e){rej(e);}
  });
  return dbp;
}
function tx(mode,fn){return db().then(d=>new Promise((res,rej)=>{const t=d.transaction('videos',mode),st=t.objectStore('videos');const r=fn(st);t.oncomplete=()=>res(r&&r.result);t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error);}));}
function vidPut(id,blob,pub){if(pub){mem.set(id,blob);return Promise.resolve(id);}return tx('readwrite',st=>st.put(blob,id)).then(()=>id);}
function vidGet(id){if(mem.has(id))return Promise.resolve(mem.get(id));return tx('readonly',st=>st.get(id)).catch(()=>null);}
function vidDel(id){mem.delete(id);return tx('readwrite',st=>st.delete(id)).catch(()=>{});}
function vidClear(){mem.clear();return tx('readwrite',st=>st.clear()).catch(()=>{});}
async function storageInfo(){
  const out={persisted:false,usage:0,quota:0};
  try{if(navigator.storage){if(navigator.storage.persisted)out.persisted=await navigator.storage.persisted();
    if(navigator.storage.estimate){const e=await navigator.storage.estimate();out.usage=e.usage||0;out.quota=e.quota||0;}}}catch(e){}
  return out;
}
async function askPersist(){try{return navigator.storage&&navigator.storage.persist?await navigator.storage.persist():false;}catch(e){return false;}}

CM.store={KEY,blank,load,save,clear,fromBackup,vidPut,vidGet,vidDel,vidClear,storageInfo,askPersist};
})(globalThis.CM=globalThis.CM||{});
