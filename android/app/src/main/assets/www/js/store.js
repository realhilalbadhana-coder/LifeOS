/* LifeOS — persistence. All data lives in localStorage on the device. */
var L = window.L;
const KEY = 'lifeos.v1';

const DEFAULTS = {
  settings: { name: 'Alex Cole', theme: 'dark', notif: true, remindersNotify: true, onboarded: true },
  events: [],     // {id,title,date:'YYYY-MM-DD',time,notes,type}
  notes: [],      // {id,title,body,checklist:[],folder,pinned,fav,created,updated}
  reminders: [],  // {id,title,desc,datetime,repeat,priority,done}
  habits: [],     // {id,name,icon,goal,created,log:{'YYYY-MM-DD':1}}
  tasks: [],      // {id,title,done,date,priority}
  alarms: [],     // {id,time:'HH:MM',label,days:[0..6],on}
  study: {},      // {'YYYY-MM-DD': minutes}
  workouts: [],   // {id,type,duration,date}
  goals: [],      // {id,name,target,unit,progress}
  recentTools: [],
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return JSON.parse(JSON.stringify(DEFAULTS));
    const data = JSON.parse(raw);
    return Object.assign(JSON.parse(JSON.stringify(DEFAULTS)), data);
  } catch (e) {
    console.warn('store load failed', e);
    return JSON.parse(JSON.stringify(DEFAULTS));
  }
}

const S = {
  data: load(),
  subs: [],
  save() {
    try { localStorage.setItem(KEY, JSON.stringify(this.data)); }
    catch (e) { L.toast('Storage full', 'err'); }
    this.subs.forEach(f => { try { f(this.data); } catch (e) { } });
  },
  on(fn) { this.subs.push(fn); return () => { this.subs = this.subs.filter(f => f !== fn); }; },
  export() { return JSON.stringify(this.data, null, 2); },
  import(json) {
    const d = JSON.parse(json);
    if (!d || typeof d !== 'object') throw new Error('bad file');
    this.data = Object.assign(JSON.parse(JSON.stringify(DEFAULTS)), d);
    this.save();
  },
  reset() { this.data = JSON.parse(JSON.stringify(DEFAULTS)); this.save(); },
  /* generic collection helpers */
  add(coll, obj) { obj.id = obj.id || L.uid(); this.data[coll].unshift(obj); this.save(); return obj; },
  update(coll, id, patch) { const it = this.data[coll].find(x => x.id === id); if (it) { Object.assign(it, patch); this.save(); } return it; },
  remove(coll, id) { this.data[coll] = this.data[coll].filter(x => x.id !== id); this.save(); },
  get(coll, id) { return this.data[coll].find(x => x.id === id); },
};
L.store = S;
window.S = S;
