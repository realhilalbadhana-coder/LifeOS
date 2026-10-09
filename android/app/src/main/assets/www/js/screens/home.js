/* LifeOS — Home dashboard */
var L = window.L;

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

function todayTasks() { const t = L.todayYmd(); return L.store.data.tasks.filter(x => x.date === t || (!x.date && !x.done)); }
function todayHabits() { return L.store.data.habits; }
function habitDone(h) { return !!(h.log && h.log[L.todayYmd()]); }
function streak(h) {
  let s = 0; const d = new Date();
  for (; ;) {
    const k = L.ymd(d);
    if (h.log && h.log[k]) { s++; d.setDate(d.getDate() - 1); } else break;
    if (s > 4000) break;
  }
  return s;
}

function progress() {
  const t = todayTasks(), h = todayHabits();
  const total = t.length + h.length;
  const done = t.filter(x => x.done).length + h.filter(habitDone).length;
  return { total, done, pct: total ? Math.round(done / total * 100) : 0 };
}

L.register('home', {
  title: () => greeting() + ', ' + (L.store.data.settings.name || '').split(' ')[0],
  sub: () => new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }),
  bar: () => [
    { id: 'bell', icon: 'bell2', label: 'Reminders', on: () => L.go('reminders') },
    { id: 'set', icon: 'settings', label: 'Settings', on: () => L.go('settings') },
  ],
  render(root) {
    const p = progress();
    const t = todayTasks();
    const habits = todayHabits();
    const upcoming = L.store.data.events
      .filter(e => e.date >= L.todayYmd())
      .sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')))
      .slice(0, 4);
    const rem = L.store.data.reminders.filter(r => !r.done && r.datetime >= Date.now()).sort((a, b) => a.datetime - b.datetime).slice(0, 3);

    root.innerHTML = `
      <!-- overview -->
      <div class="card raised">
        <div class="row">
          <div class="ring" style="--p:${p.pct}"><span>${p.pct}%</span></div>
          <div class="grow">
            <div style="font-weight:700;font-size:15px">Today's Progress</div>
            <div class="muted sm" style="margin-top:3px">${p.done} of ${p.total} done${p.total === 0 ? ' — add a habit or task' : ''}</div>
            <div class="bar mt" style="margin-top:10px"><i style="width:${p.pct}%"></i></div>
          </div>
        </div>
      </div>

      <!-- quick tools -->
      <div class="scroll-x" id="quick"></div>

      <!-- tasks -->
      <div class="sec-title"><h2>Today's Tasks</h2><span class="link" data-add-task>+ Add</span></div>
      <div class="list" id="tasklist"></div>

      <!-- habits -->
      <div class="sec-title"><h2>Habits</h2><span class="link" data-go="tracker">See all</span></div>
      <div class="scroll-x" id="habitrow"></div>

      <!-- upcoming -->
      <div class="sec-title"><h2>Upcoming</h2><span class="link" data-go="calendar">Calendar</span></div>
      <div class="list" id="uplist"></div>

      <!-- reminders -->
      ${rem.length ? `<div class="sec-title"><h2>Reminders</h2><span class="link" data-go="reminders">All</span></div><div class="list" id="remlist"></div>` : ''}
      <div style="height:8px"></div>`;

    /* quick tools */
    const quick = [
      { id: 'calendar', label: 'Calendar', icon: 'calendar' },
      { id: 'notes', label: 'Notes', icon: 'notes' },
      { id: 'reminders', label: 'Reminders', icon: 'bell2' },
      { id: 'alarm', label: 'Alarm', icon: 'alarm' },
      { id: 'stopwatch', label: 'Timer', icon: 'timer' },
    ];
    L.$('#quick', root).innerHTML = quick.map(q => `
      <button class="card" style="margin:0;min-width:78px;display:flex;flex-direction:column;align-items:center;gap:8px;padding:14px 10px" data-q="${q.id}">
        <span class="ico-badge">${L.icon(q.icon)}</span><span class="tiny" style="font-weight:600">${q.label}</span>
      </button>`).join('');
    L.$$('[data-q]', root).forEach(b => b.onclick = () => {
      const q = b.dataset.q;
      if (q === 'calendar' || q === 'notes') L.go(q);
      else L.openTool(q);
    });

    /* task list */
    const tl = L.$('#tasklist', root);
    if (!t.length) tl.innerHTML = emptyRow('notes', 'No tasks yet', 'Tap + Add to plan your day');
    else tl.innerHTML = t.map(taskRow).join('');
    wireTasks(root);

    /* habits */
    const hr = L.$('#habitrow', root);
    if (!habits.length) hr.innerHTML = emptyRow('tracker', 'No habits yet', 'Add habits in the Tracker');
    else hr.innerHTML = habits.map(h => {
      const on = habitDone(h);
      const st = streak(h);
      return `<button class="card" style="margin:0;min-width:150px;text-align:left" data-habit="${h.id}">
        <div class="row between"><span class="ico-badge ${on ? '' : 'r'}">${L.icon(h.icon || 'check')}</span>
        <span class="pill ${on ? 'hi' : ''}">${st}🔥</span></div>
        <div style="font-weight:700;margin-top:10px" class="ellipsis">${L.esc(h.name)}</div>
        <div class="muted tiny" style="margin-top:2px">${on ? 'Done today' : 'Tap to mark done'}</div>
      </button>`;
    }).join('');
    L.$$('[data-habit]', root).forEach(b => b.onclick = () => {
      const h = L.store.get('habits', b.dataset.habit);
      h.log = h.log || {}; const k = L.todayYmd();
      if (h.log[k]) delete h.log[k]; else h.log[k] = 1;
      L.store.save(); L.refresh();
    });

    /* upcoming */
    const ul = L.$('#uplist', root);
    if (!upcoming.length) ul.innerHTML = emptyRow('calendar', 'Nothing scheduled', 'Add events in the Calendar');
    else ul.innerHTML = upcoming.map(e => `
      <div class="item-card" data-go="calendar">
        <span class="ico-badge">${L.icon(e.type === 'exam' ? 'book' : e.type === 'deadline' ? 'flag' : 'calendar')}</span>
        <div class="grow"><div style="font-weight:600" class="ellipsis">${L.esc(e.title)}</div>
        <div class="muted tiny">${L.relDay(e.date)}${e.time ? ' · ' + L.esc(e.time) : ''}</div></div>
        ${L.icon('chev', 'muted')}
      </div>`).join('');

    /* reminders */
    if (rem.length) {
      L.$('#remlist', root).innerHTML = rem.map(r => `
        <div class="item-card"><span class="ico-badge ${r.priority === 'high' ? 'r' : ''}">${L.icon('bell2')}</span>
        <div class="grow"><div style="font-weight:600" class="ellipsis">${L.esc(r.title)}</div>
        <div class="muted tiny">${L.fmtDate(r.datetime)} · ${L.fmtTime(r.datetime)}</div></div>
        <span class="pill ${r.priority === 'high' ? 'lo' : ''}">${L.esc(r.priority || 'normal')}</span></div>`).join('');
    }

    L.$$('[data-go]', root).forEach(b => b.onclick = () => L.go(b.dataset.go));
    L.$('[data-add-task]', root).onclick = () => L.addTaskSheet();
  }
});

function emptyRow(icon, t, s) {
  return `<div class="card flat center"><div class="muted" style="display:flex;flex-direction:column;align-items:center;gap:6px">${L.icon(icon)}<div style="font-weight:600;color:var(--text)">${t}</div><div class="tiny">${s}</div></div></div>`;
}

function taskRow(t) {
  return `<div class="item-card" data-task="${t.id}">
    <span class="check ${t.done ? 'on' : ''}" data-toggle>${t.done ? L.icon('check') : ''}</span>
    <div class="grow"><div style="font-weight:600;${t.done ? 'text-decoration:line-through;opacity:.55' : ''}" class="ellipsis">${L.esc(t.title)}</div>
    ${t.priority && t.priority !== 'normal' ? `<div class="tiny muted">${L.esc(t.priority)} priority</div>` : ''}</div>
    <button class="iconbtn" data-del style="width:34px;height:34px">${L.icon('trash')}</button>
  </div>`;
}

function wireTasks(root) {
  L.$$('[data-task]', root).forEach(row => {
    const id = row.dataset.task;
    L.$('[data-toggle]', row).onclick = () => { const t = L.store.get('tasks', id); L.store.update('tasks', id, { done: !t.done }); L.refresh(); };
    L.$('[data-del]', row).onclick = () => { L.store.remove('tasks', id); L.refresh(); };
  });
}

L.addTaskSheet = () => {
  L.sheet('New Task', `
    <input class="field" id="tk-t" placeholder="What needs doing?" autofocus>
    <div class="row" style="gap:10px">
      <select class="field grow" id="tk-p"><option value="normal">Normal</option><option value="high">High priority</option><option value="low">Low priority</option></select>
      <input class="field grow" type="date" id="tk-d" value="${L.todayYmd()}">
    </div>
    <button class="btn block" id="tk-save">Add Task</button>`, (ov, close) => {
    L.$('#tk-save', ov).onclick = () => {
      const title = L.$('#tk-t', ov).value.trim();
      if (!title) return L.toast('Enter a task');
      L.store.add('tasks', { title, done: false, priority: L.$('#tk-p', ov).value, date: L.$('#tk-d', ov).value });
      close(); L.refresh(); L.toast('Task added', 'ok');
    };
  });
};
