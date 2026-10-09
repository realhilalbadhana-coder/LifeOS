/* LifeOS — Reminders & Alarm */
var L = window.L;

/* ---------------- Reminders ---------------- */
L.register('reminders', {
  title: 'Reminders',
  sub: () => `${L.store.data.reminders.filter(r => !r.done).length} active`,
  bar: () => [
    { id: 'perm', icon: 'bell2', label: 'Notifications', on: () => L.askNotify() },
    { id: 'add', icon: 'plus', label: 'New', on: () => L.reminderSheet() },
  ],
  render(root) {
    const active = L.store.data.reminders.filter(r => !r.done).sort((a, b) => a.datetime - b.datetime);
    const done = L.store.data.reminders.filter(r => r.done).sort((a, b) => b.datetime - a.datetime);
    root.innerHTML = `
      <button class="btn ghost block sm" id="r-perm" style="margin-bottom:14px">${L.icon('bell2')} Enable notifications</button>
      <div class="sec-title"><h2>Active</h2><span class="link" data-add>+ New</span></div>
      <div class="list" id="r-active"></div>
      <div class="sec-title"><h2>Completed</h2></div>
      <div class="list" id="r-done"></div>
      <button class="fab" data-add2>${L.icon('plus')}</button>`;
    L.$('#r-perm', root).onclick = () => L.askNotify();
    const row = (r, isDone) => `<div class="item-card" data-r="${r.id}">
      <span class="check ${isDone ? 'on' : ''}" data-toggle>${isDone ? L.icon('check') : ''}</span>
      <div class="grow"><div style="font-weight:600" class="ellipsis">${L.esc(r.title)}</div>
      <div class="muted tiny">${L.fmtDate(r.datetime)} · ${L.fmtTime(r.datetime)}${r.repeat && r.repeat !== 'none' ? ' · ' + L.esc(r.repeat) : ''}</div></div>
      <span class="pill ${r.priority === 'high' ? 'lo' : r.priority === 'low' ? '' : 'hi'}">${L.esc(r.priority || 'normal')}</span>
      <button class="iconbtn" data-del style="width:34px;height:34px">${L.icon('trash')}</button></div>`;
    L.$('#r-active', root).innerHTML = active.length ? active.map(r => row(r, false)).join('') : '<div class="card flat center muted sm">No active reminders</div>';
    L.$('#r-done', root).innerHTML = done.length ? done.map(r => row(r, true)).join('') : '<div class="card flat center muted sm">Nothing completed yet</div>';
    L.$$('[data-toggle]', root).forEach(c => c.onclick = () => { const id = c.closest('[data-r]').dataset.r; const r = L.store.get('reminders', id); L.store.update('reminders', id, { done: !r.done }); L.refresh(); });
    L.$$('[data-del]', root).forEach(b => b.onclick = () => { const id = b.closest('[data-r]').dataset.r; L.confirm('Delete this reminder?', () => { L.store.remove('reminders', id); L.refresh(); }); });
    L.$$('[data-r]', root).forEach(r => L.$('[style*="font-weight:600"]', r).onclick = () => L.reminderSheet(r.dataset.r));
    L.$$('[data-add]', root).concat(L.$$('[data-add2]', root)).forEach(b => b.onclick = () => L.reminderSheet());
  }
});

L.askNotify = () => {
  if (!('Notification' in window)) return L.toast('Notifications not supported here', 'err');
  Notification.requestPermission().then(p => L.toast(p === 'granted' ? 'Notifications enabled' : 'Notifications blocked', p === 'granted' ? 'ok' : 'err'));
};

L.reminderSheet = (id) => {
  const r = id ? L.store.get('reminders', id) : null;
  const dt = r ? new Date(r.datetime) : new Date(Date.now() + 3600000);
  const local = `${dt.getFullYear()}-${L.pad(dt.getMonth() + 1)}-${L.pad(dt.getDate())}T${L.pad(dt.getHours())}:${L.pad(dt.getMinutes())}`;
  L.sheet(r ? 'Edit Reminder' : 'New Reminder', `
    <input class="field" id="rm-t" placeholder="Remind me to…" value="${r ? L.esc(r.title) : ''}" autofocus>
    <input class="field" id="rm-dt" type="datetime-local" value="${local}">
    <select class="field" id="rm-rep">${['none', 'daily', 'weekly', 'monthly'].map(x => `<option value="${x}" ${r && r.repeat === x ? 'selected' : ''}>${x === 'none' ? 'One time' : x[0].toUpperCase() + x.slice(1)}</option>`).join('')}</select>
    <select class="field" id="rm-p">${['normal', 'high', 'low'].map(x => `<option value="${x}" ${r && r.priority === x ? 'selected' : ''}>${x[0].toUpperCase() + x.slice(1)} priority</option>`).join('')}</select>
    <button class="btn block" id="rm-save">${r ? 'Save' : 'Add Reminder'}</button>`, (ov, close) => {
    L.$('#rm-save', ov).onclick = () => {
      const title = L.$('#rm-t', ov).value.trim(); if (!title) return L.toast('Enter a title');
      const when = new Date(L.$('#rm-dt', ov).value).getTime();
      const payload = { title, datetime: when, repeat: L.$('#rm-rep', ov).value, priority: L.$('#rm-p', ov).value, done: false };
      if (r) L.store.update('reminders', id, payload); else L.store.add('reminders', payload);
      close(); L.refresh(); L.toast(r ? 'Updated' : 'Reminder set', 'ok');
      L.askNotify();
    };
  });
};

/* foreground reminder dispatcher */
setInterval(() => {
  const now = Date.now();
  L.store.data.reminders.forEach(r => {
    if (!r.done && !r._fired && r.datetime <= now && now - r.datetime < 120000) {
      r._fired = true; L.store.save();
      if ('Notification' in window && Notification.permission === 'granted') { try { new Notification('LifeOS Reminder', { body: r.title }); } catch (e) { } }
      L.toast('⏰ ' + r.title, 'ok');
    }
  });
}, 30000);

/* ---------------- Alarm ---------------- */
L.register('alarm', {
  title: 'Alarm',
  sub: () => `${L.store.data.alarms.filter(a => a.on).length} enabled`,
  bar: () => [{ id: 'add', icon: 'plus', label: 'New alarm', on: () => L.alarmSheet() }],
  render(root) {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    root.innerHTML = `<div class="list" id="a-list"></div><button class="fab" data-add>${L.icon('plus')}</button>`;
    const list = L.store.data.alarms.slice().sort((a, b) => a.time.localeCompare(b.time));
    L.$('#a-list', root).innerHTML = list.length ? list.map(a => `<div class="card" data-a="${a.id}">
      <div class="row between"><div><div class="big mono">${L.esc(a.time)}</div>
      <div class="muted tiny">${L.esc(a.label || 'Alarm')}</div></div>
      <span class="switch ${a.on ? 'on' : ''}" data-tog><i></i></span></div>
      <div class="row" style="gap:6px;margin-top:12px">${days.map((d, i) => `<span class="pill ${a.days && a.days.includes(i) ? 'hi' : ''}" style="flex:1;text-align:center">${d}</span>`).join('')}</div>
      <div class="row mt" style="gap:10px"><button class="btn ghost sm grow" data-edit>Edit</button><button class="btn danger sm" data-del>${L.icon('trash')}</button></div>
    </div>`).join('') : '<div class="card flat center muted sm">No alarms — tap + to add one</div>';
    L.$$('[data-tog]', root).forEach(s => s.onclick = () => { const id = s.closest('[data-a]').dataset.a; const a = L.store.get('alarms', id); L.store.update('alarms', id, { on: !a.on }); L.refresh(); });
    L.$$('[data-edit]', root).forEach(b => b.onclick = () => L.alarmSheet(b.closest('[data-a]').dataset.a));
    L.$$('[data-del]', root).forEach(b => b.onclick = () => { const id = b.closest('[data-a]').dataset.a; L.confirm('Delete this alarm?', () => { L.store.remove('alarms', id); L.refresh(); }); });
    L.$('[data-add]', root).onclick = () => L.alarmSheet();
  }
});

L.alarmSheet = (id) => {
  const a = id ? L.store.get('alarms', id) : null;
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  L.sheet(a ? 'Edit Alarm' : 'New Alarm', `
    <input class="field" id="al-time" type="time" value="${a ? a.time : '07:00'}" style="font-size:22px;text-align:center">
    <input class="field" id="al-label" placeholder="Label (optional)" value="${a ? L.esc(a.label || '') : ''}">
    <label class="lbl">Repeat</label>
    <div class="chips" id="al-days" style="margin-bottom:14px">${days.map((d, i) => `<button class="chip ${a && a.days && a.days.includes(i) ? 'active' : ''}" data-d="${i}">${d}</button>`).join('')}</div>
    <button class="btn block" id="al-save">${a ? 'Save' : 'Create Alarm'}</button>`, (ov, close) => {
    const sel = new Set(a ? (a.days || []) : []);
    L.$$('[data-d]', ov).forEach(b => b.onclick = () => { const i = +b.dataset.d; if (sel.has(i)) sel.delete(i); else sel.add(i); b.classList.toggle('active'); });
    L.$('#al-save', ov).onclick = () => {
      const payload = { time: L.$('#al-time', ov).value, label: L.$('#al-label', ov).value.trim(), days: [...sel].sort(), on: true };
      if (a) L.store.update('alarms', id, payload); else L.store.add('alarms', payload);
      close(); L.refresh(); L.toast(a ? 'Alarm updated' : 'Alarm set', 'ok'); L.askNotify();
    };
  });
};

/* foreground alarm dispatcher */
let lastAlarmMin = '';
setInterval(() => {
  const now = new Date(); const hhmm = L.pad(now.getHours()) + ':' + L.pad(now.getMinutes());
  if (hhmm === lastAlarmMin) return;
  L.store.data.alarms.forEach(a => {
    if (a.on && a.time === hhmm && (!a.days || !a.days.length || a.days.includes(now.getDay()))) {
      lastAlarmMin = hhmm;
      if ('Notification' in window && Notification.permission === 'granted') { try { new Notification('LifeOS Alarm', { body: a.label || 'Alarm' }); } catch (e) { } }
      L.toast('⏰ Alarm: ' + (a.label || a.time), 'ok');
      if (navigator.vibrate) navigator.vibrate([400, 200, 400, 200, 400]);
    }
  });
}, 20000);
