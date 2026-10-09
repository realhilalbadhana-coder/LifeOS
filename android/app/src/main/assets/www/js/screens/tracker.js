/* LifeOS — Tracker */
var L = window.L;
const trkState = { tab: 'habits' };

function last7() { const a = []; const d = new Date(); for (let i = 6; i >= 0; i--) { const x = new Date(d); x.setDate(d.getDate() - i); a.push(L.ymd(x)); } return a; }
function habitStreak(h) { let s = 0; const d = new Date(); for (; ;) { const k = L.ymd(d); if (h.log && h.log[k]) { s++; d.setDate(d.getDate() - 1); } else break; if (s > 4000) break; } return s; }
function studyWeek() { const w = last7(); return w.map(k => ({ k, v: L.store.data.study[k] || 0 })); }
function workoutWeek() { const w = last7(); return w.map(k => ({ k, v: L.store.data.workouts.filter(x => x.date === k).reduce((a, b) => a + (+b.duration || 0), 0) })); }

function barChart(data, unit) {
  const max = Math.max(1, ...data.map(d => d.v));
  return `<div class="row" style="align-items:flex-end;gap:8px;height:110px;margin-top:8px">${data.map(d => {
    const h = Math.round(d.v / max * 88);
    return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;justify-content:flex-end;height:100%">
      <div class="tiny muted">${d.v || ''}</div>
      <div style="width:100%;max-width:26px;height:${Math.max(4, h)}px;border-radius:8px;background:${d.v ? 'linear-gradient(180deg,#EAFF55,#b9d43f)' : 'var(--surface-3)'}"></div>
      <div class="tiny muted">${new Date(d.k + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'narrow' })}</div>
    </div>`;
  }).join('')}</div>`;
}

L.register('tracker', {
  title: 'Tracker',
  sub: () => 'Habits · Study · Workouts · Goals',
  bar: () => [{ id: 'add', icon: 'plus', label: 'Add', on: () => trkAdd() }],
  render(root) {
    root.innerHTML = `
      <div class="seg" style="margin-bottom:14px">
        ${[['habits', 'Habits'], ['study', 'Study'], ['workout', 'Workout'], ['goals', 'Goals']].map(([id, l]) => `<button class="${trkState.tab === id ? 'active' : ''}" data-t="${id}">${l}</button>`).join('')}
      </div>
      <div id="tab"></div>
      <button class="fab" data-add>${L.icon('plus')}</button>`;
    L.$$('[data-t]', root).forEach(b => b.onclick = () => { trkState.tab = b.dataset.t; L.refresh(); });
    L.$('[data-add]', root).onclick = () => trkAdd();
    const tab = L.$('#tab', root);
    if (trkState.tab === 'habits') renderHabits(tab);
    else if (trkState.tab === 'study') renderStudy(tab);
    else if (trkState.tab === 'workout') renderWorkout(tab);
    else renderGoals(tab);
  }
});

function renderHabits(root) {
  const habits = L.store.data.habits;
  const week = last7();
  root.innerHTML = habits.length ? habits.map(h => {
    const doneToday = h.log && h.log[L.todayYmd()];
    return `<div class="card">
      <div class="row between">
        <div class="row"><span class="ico-badge">${L.icon(h.icon || 'check')}</span>
        <div><div style="font-weight:700">${L.esc(h.name)}</div>
        <div class="muted tiny">${habitStreak(h)} day streak · goal ${h.goal || 30}d</div></div></div>
        <button class="btn ${doneToday ? 'soft' : ''} sm" data-h="${h.id}">${doneToday ? 'Done ✓' : 'Mark'}</button>
      </div>
      <div class="row" style="gap:6px;margin-top:12px">${week.map(k => `<div style="flex:1;text-align:center">
        <div style="height:26px;border-radius:8px;background:${h.log && h.log[k] ? 'var(--accent)' : 'var(--surface-3)'}"></div>
        <div class="tiny muted" style="margin-top:4px">${new Date(k + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'narrow' })}</div>
      </div>`).join('')}</div>
      <div class="row between mt"><div class="grow"><div class="bar"><i style="width:${Math.min(100, Math.round(habitStreak(h) / (h.goal || 30) * 100))}%"></i></div></div>
      <button class="iconbtn" data-del style="width:34px;height:34px;margin-left:10px">${L.icon('trash')}</button></div>
    </div>`;
  }).join('') : `<div class="card flat center muted sm">No habits yet — tap + to add one</div>`;

  L.$$('[data-h]', root).forEach(b => b.onclick = () => { const h = L.store.get('habits', b.dataset.h); h.log = h.log || {}; const k = L.todayYmd(); if (h.log[k]) delete h.log[k]; else h.log[k] = 1; L.store.save(); L.refresh(); });
  L.$$('[data-del]', root).forEach(b => b.onclick = () => { const card = b.closest('.card'); const name = L.$('[style*="font-weight:700"]', card).textContent; const h = L.store.data.habits.find(x => x.name === name); L.confirm('Delete this habit?', () => { L.store.remove('habits', h.id); L.refresh(); }); });
}

function renderStudy(root) {
  const today = L.store.data.study[L.todayYmd()] || 0;
  const week = studyWeek(); const total = week.reduce((a, b) => a + b.v, 0);
  root.innerHTML = `
    <div class="card raised center">
      <div class="muted sm">Studied today</div>
      <div class="big" style="margin:6px 0">${Math.floor(today / 60)}h ${today % 60}m</div>
      <div class="row" style="gap:8px;justify-content:center;margin-top:6px">
        ${[15, 30, 60].map(m => `<button class="chip" data-add="${m}">+${m}m</button>`).join('')}
        <button class="chip" data-reset>Reset</button>
      </div>
    </div>
    <div class="card"><div class="row between"><div style="font-weight:700">This week</div><span class="pill hi">${Math.floor(total / 60)}h ${total % 60}m</span></div>${barChart(week)}</div>
    <div class="stats"><div class="stat"><div class="n">${Math.round(total / 7)}<span class="sm muted"> min</span></div><div class="l">Daily average</div></div>
    <div class="stat"><div class="n">${week.filter(w => w.v > 0).length}<span class="sm muted"> / 7</span></div><div class="l">Days studied</div></div></div>`;
  L.$$('[data-add]', root).forEach(b => b.onclick = () => { const k = L.todayYmd(); L.store.data.study[k] = (L.store.data.study[k] || 0) + (+b.dataset.add); L.store.save(); L.refresh(); });
  L.$('[data-reset]', root).onclick = () => { L.store.data.study[L.todayYmd()] = 0; L.store.save(); L.refresh(); };
}

function renderWorkout(root) {
  const week = workoutWeek(); const total = week.reduce((a, b) => a + b.v, 0);
  const list = L.store.data.workouts.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  root.innerHTML = `
    <div class="card"><div class="row between"><div style="font-weight:700">Active minutes this week</div><span class="pill hi">${total} min</span></div>${barChart(week)}</div>
    <button class="btn block" id="w-add">${L.icon('dumbbell')} Log a workout</button>
    <div class="sec-title"><h2>Recent</h2></div>
    <div class="list">${list.length ? list.map(w => `<div class="item-card" data-w="${w.id}"><span class="ico-badge">${L.icon('dumbbell')}</span>
      <div class="grow"><div style="font-weight:600">${L.esc(w.type)}</div><div class="muted tiny">${L.relDay(w.date)} · ${w.duration} min</div></div>
      <button class="iconbtn" data-del style="width:34px;height:34px">${L.icon('trash')}</button></div>`).join('') : '<div class="card flat center muted sm">No workouts logged</div>'}</div>`;
  L.$('#w-add', root).onclick = () => L.sheet('Log Workout', `
    <select class="field" id="w-t">${['Walking', 'Running', 'Gym', 'Cycling', 'Yoga', 'Swimming', 'Sports', 'Other'].map(t => `<option>${t}</option>`).join('')}</select>
    <input class="field" id="w-d" type="number" placeholder="Duration (minutes)" value="30">
    <input class="field" id="w-date" type="date" value="${L.todayYmd()}">
    <button class="btn block" id="w-save">Save Workout</button>`, (ov, close) => {
    L.$('#w-save', ov).onclick = () => { const dur = +L.$('#w-d', ov).value || 0; if (dur <= 0) return L.toast('Enter minutes'); L.store.add('workouts', { type: L.$('#w-t', ov).value, duration: dur, date: L.$('#w-date', ov).value }); close(); L.refresh(); L.toast('Workout logged', 'ok'); };
  });
  L.$$('[data-w]', root).forEach(r => L.$('[data-del]', r).onclick = () => { L.store.remove('workouts', r.dataset.w); L.refresh(); });
}

function renderGoals(root) {
  const goals = L.store.data.goals;
  root.innerHTML = (goals.length ? goals.map(g => {
    const pct = Math.min(100, Math.round((g.progress || 0) / (g.target || 1) * 100));
    return `<div class="card"><div class="row between"><div style="font-weight:700">${L.esc(g.name)}</div><span class="pill ${pct >= 100 ? 'hi' : ''}">${g.progress || 0}/${g.target} ${L.esc(g.unit || '')}</span></div>
      <div class="bar mt"><i style="width:${pct}%"></i></div>
      <div class="row" style="gap:8px;margin-top:12px"><button class="btn soft sm" data-inc="${g.id}">+1</button>
      <button class="btn ghost sm" data-dec="${g.id}">−1</button>
      <button class="btn ghost sm grow" data-edit="${g.id}">Edit</button>
      <button class="btn danger sm" data-del="${g.id}">${L.icon('trash')}</button></div></div>`;
  }).join('') : '<div class="card flat center muted sm">No goals yet — tap + to add one</div>');
  L.$$('[data-inc]', root).forEach(b => b.onclick = () => { const g = L.store.get('goals', b.dataset.inc); L.store.update('goals', g.id, { progress: (g.progress || 0) + 1 }); L.refresh(); });
  L.$$('[data-dec]', root).forEach(b => b.onclick = () => { const g = L.store.get('goals', b.dataset.dec); L.store.update('goals', g.id, { progress: Math.max(0, (g.progress || 0) - 1) }); L.refresh(); });
  L.$$('[data-edit]', root).forEach(b => b.onclick = () => goalSheet(b.dataset.edit));
  L.$$('[data-del]', root).forEach(b => b.onclick = () => L.confirm('Delete this goal?', () => { L.store.remove('goals', b.dataset.del); L.refresh(); }));
}

function trkAdd() {
  if (trkState.tab === 'habits') return habitSheet();
  if (trkState.tab === 'study') return L.toast('Use the +buttons to log study time');
  if (trkState.tab === 'workout') return L.$('#w-add') && L.$('#w-add').click();
  if (trkState.tab === 'goals') return goalSheet();
}

function habitSheet() {
  const icons = ['check', 'fire', 'drop', 'book', 'dumbbell', 'heart', 'moon', 'target'];
  L.sheet('New Habit', `
    <input class="field" id="h-n" placeholder="Habit name (e.g. Drink water)" autofocus>
    <label class="lbl">Icon</label>
    <div class="chips" id="h-ic" style="margin-bottom:12px">${icons.map((i, x) => `<button class="chip ${x === 0 ? 'active' : ''}" data-i="${i}">${L.icon(i)}</button>`).join('')}</div>
    <input class="field" id="h-g" type="number" placeholder="Goal (days)" value="30">
    <button class="btn block" id="h-save">Create Habit</button>`, (ov, close) => {
    let icon = 'check';
    L.$$('[data-i]', ov).forEach(b => b.onclick = () => { L.$$('[data-i]', ov).forEach(x => x.classList.remove('active')); b.classList.add('active'); icon = b.dataset.i; });
    L.$('#h-save', ov).onclick = () => {
      const name = L.$('#h-n', ov).value.trim(); if (!name) return L.toast('Enter a name');
      L.store.add('habits', { name, icon, goal: +L.$('#h-g', ov).value || 30, created: Date.now(), log: {} });
      close(); L.refresh(); L.toast('Habit created', 'ok');
    };
  });
}

function goalSheet(id) {
  const g = id ? L.store.get('goals', id) : null;
  L.sheet(g ? 'Edit Goal' : 'New Goal', `
    <input class="field" id="g-n" placeholder="Goal name" value="${g ? L.esc(g.name) : ''}" autofocus>
    <div class="row" style="gap:10px">
      <input class="field grow" id="g-t" type="number" placeholder="Target" value="${g ? g.target : 100}">
      <input class="field grow" id="g-u" placeholder="Unit (pages, ₹…)" value="${g ? L.esc(g.unit || '') : ''}">
    </div>
    <input class="field" id="g-p" type="number" placeholder="Current progress" value="${g ? (g.progress || 0) : 0}">
    <button class="btn block" id="g-save">${g ? 'Save' : 'Create Goal'}</button>`, (ov, close) => {
    L.$('#g-save', ov).onclick = () => {
      const name = L.$('#g-n', ov).value.trim(); if (!name) return L.toast('Enter a name');
      const payload = { name, target: +L.$('#g-t', ov).value || 1, unit: L.$('#g-u', ov).value.trim(), progress: +L.$('#g-p', ov).value || 0 };
      if (g) L.store.update('goals', id, payload); else L.store.add('goals', payload);
      close(); L.refresh(); L.toast('Goal saved', 'ok');
    };
  });
}
