/* LifeOS — Calendar */
var L = window.L;
const calState = { y: new Date().getFullYear(), m: new Date().getMonth(), sel: L.todayYmd(), view: 'month' };

function eventsOn(ymd) { return L.store.data.events.filter(e => e.date === ymd).sort((a, b) => (a.time || '').localeCompare(b.time || '')); }

L.register('calendar', {
  title: 'Calendar',
  sub: () => new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }),
  bar: () => [
    { id: 'today', icon: 'target', label: 'Today', on: () => { const d = new Date(); calState.y = d.getFullYear(); calState.m = d.getMonth(); calState.sel = L.todayYmd(); L.refresh(); } },
    { id: 'add', icon: 'plus', label: 'Add event', on: () => L.eventSheet() },
  ],
  render(root) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    root.innerHTML = `
      <div class="card raised">
        <div class="row between" style="margin-bottom:10px">
          <button class="iconbtn" data-prev>${L.icon('back')}</button>
          <div style="font-weight:700;font-size:16px">${months[calState.m]} ${calState.y}</div>
          <button class="iconbtn" data-next style="transform:rotate(180deg)">${L.icon('back')}</button>
        </div>
        <div class="grid7" id="grid"></div>
      </div>
      <div class="seg" style="margin-bottom:14px">
        <button class="${calState.view === 'day' ? 'active' : ''}" data-v="day">Day</button>
        <button class="${calState.view === 'month' ? 'active' : ''}" data-v="month">Month</button>
        <button class="${calState.view === 'agenda' ? 'active' : ''}" data-v="agenda">Agenda</button>
      </div>
      <div id="detail"></div>
      <button class="fab" data-add>${L.icon('plus')}</button>`;

    L.$('[data-prev]', root).onclick = () => { calState.m--; if (calState.m < 0) { calState.m = 11; calState.y--; } L.refresh(); };
    L.$('[data-next]', root).onclick = () => { calState.m++; if (calState.m > 11) { calState.m = 0; calState.y++; } L.refresh(); };
    L.$$('[data-v]', root).forEach(b => b.onclick = () => { calState.view = b.dataset.v; L.refresh(); });
    L.$('[data-add]', root).onclick = () => L.eventSheet(calState.sel);

    /* month grid */
    const grid = L.$('#grid', root);
    const first = L.startDOW(calState.y, calState.m);
    const days = L.daysInMonth(calState.y, calState.m);
    let cells = '';
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(d => cells += `<div class="dow">${d}</div>`);
    const prevDays = L.daysInMonth(calState.y, calState.m === 0 ? 11 : calState.m - 1);
    for (let i = first - 1; i >= 0; i--) cells += `<div class="day out">${prevDays - i}</div>`;
    for (let d = 1; d <= days; d++) {
      const ymd = `${calState.y}-${L.pad(calState.m + 1)}-${L.pad(d)}`;
      const has = eventsOn(ymd).length > 0;
      cells += `<div class="day ${ymd === calState.sel ? 'sel' : ''} ${ymd === L.todayYmd() ? 'today' : ''}" data-day="${ymd}">${d}${has ? '<span class="mk"></span>' : ''}</div>`;
    }
    grid.innerHTML = cells;
    L.$$('[data-day]', grid).forEach(c => c.onclick = () => { calState.sel = c.dataset.day; L.refresh(); });

    /* detail area */
    const det = L.$('#detail', root);
    if (calState.view === 'agenda') {
      const up = L.store.data.events.filter(e => e.date >= L.todayYmd()).sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
      det.innerHTML = `<div class="sec-title"><h2>Upcoming Events</h2></div>` + (up.length ? `<div class="list">${up.map(eventCard).join('')}</div>` : emptyEvent('No upcoming events'));
      wireEvents(det);
    } else if (calState.view === 'day') {
      const ev = eventsOn(calState.sel);
      det.innerHTML = `<div class="sec-title"><h2>${L.relDay(calState.sel)}</h2></div>` +
        (ev.length ? `<div class="list">${ev.map(eventCard).join('')}</div>` : emptyEvent('No events on this day'));
      wireEvents(det);
    } else {
      const ev = eventsOn(calState.sel);
      det.innerHTML = `<div class="sec-title"><h2>${L.relDay(calState.sel)}</h2><span class="link" data-add2>+ Event</span></div>` +
        (ev.length ? `<div class="list">${ev.map(eventCard).join('')}</div>` : emptyEvent('No events on this day'));
      wireEvents(det);
      L.$('[data-add2]', det).onclick = () => L.eventSheet(calState.sel);
    }
  }
});

function emptyEvent(t) { return `<div class="card flat center muted sm">${t}</div>`; }

function eventCard(e) {
  const ic = e.type === 'exam' ? 'book' : e.type === 'deadline' ? 'flag' : e.type === 'assignment' ? 'notes' : 'calendar';
  const cls = e.type === 'deadline' ? 'r' : e.type === 'exam' ? '' : 'g';
  return `<div class="item-card" data-ev="${e.id}">
    <span class="ico-badge ${cls}">${L.icon(ic)}</span>
    <div class="grow"><div style="font-weight:600" class="ellipsis">${L.esc(e.title)}</div>
    <div class="muted tiny">${L.relDay(e.date)}${e.time ? ' · ' + L.esc(e.time) : ''}${e.type ? ' · ' + L.esc(e.type) : ''}</div></div>
    <button class="iconbtn" data-eedit style="width:34px;height:34px">${L.icon('edit')}</button>
  </div>`;
}
function wireEvents(root) {
  L.$$('[data-ev]', root).forEach(row => {
    const id = row.dataset.ev;
    L.$('[data-eedit]', row).onclick = (ev) => { ev.stopPropagation(); L.eventSheet(null, id); };
    row.onclick = () => L.eventDetail(id);
  });
}

L.eventSheet = (date, id) => {
  const e = id ? L.store.get('events', id) : null;
  L.sheet(e ? 'Edit Event' : 'New Event', `
    <input class="field" id="ev-t" placeholder="Event title" value="${e ? L.esc(e.title) : ''}" autofocus>
    <div class="row" style="gap:10px">
      <input class="field grow" type="date" id="ev-d" value="${e ? e.date : (date || L.todayYmd())}">
      <input class="field grow" type="time" id="ev-time" value="${e ? (e.time || '') : ''}">
    </div>
    <select class="field" id="ev-type">
      ${['event', 'exam', 'assignment', 'deadline'].map(t => `<option value="${t}" ${e && e.type === t ? 'selected' : ''}>${t[0].toUpperCase() + t.slice(1)}</option>`).join('')}
    </select>
    <textarea class="field" id="ev-n" placeholder="Notes (optional)">${e ? L.esc(e.notes || '') : ''}</textarea>
    <div class="row" style="gap:10px">
      <button class="btn ghost grow" id="ev-cancel">Cancel</button>
      <button class="btn grow" id="ev-save">${e ? 'Save' : 'Add Event'}</button>
    </div>
    ${e ? `<button class="btn danger block mt" id="ev-del">Delete Event</button>` : ''}`, (ov, close) => {
    L.$('#ev-cancel', ov).onclick = close;
    L.$('#ev-save', ov).onclick = () => {
      const title = L.$('#ev-t', ov).value.trim();
      if (!title) return L.toast('Enter a title');
      const payload = { title, date: L.$('#ev-d', ov).value, time: L.$('#ev-time', ov).value, type: L.$('#ev-type', ov).value, notes: L.$('#ev-n', ov).value.trim() };
      if (e) L.store.update('events', id, payload); else L.store.add('events', payload);
      close(); L.refresh(); L.toast(e ? 'Event updated' : 'Event added', 'ok');
    };
    if (e) L.$('#ev-del', ov).onclick = () => L.confirm('Delete this event?', () => { L.store.remove('events', id); close(); L.refresh(); });
  });
};

L.eventDetail = (id) => {
  const e = L.store.get('events', id); if (!e) return;
  L.sheet(e.title, `
    <div class="row" style="gap:10px;margin-bottom:12px"><span class="pill hi">${L.esc(e.type || 'event')}</span><span class="pill">${L.relDay(e.date)}${e.time ? ' · ' + L.esc(e.time) : ''}</span></div>
    ${e.notes ? `<p class="sm muted" style="margin-bottom:14px">${L.esc(e.notes)}</p>` : ''}
    <div class="row" style="gap:10px"><button class="btn ghost grow" id="d-edit">Edit</button>
    <button class="btn danger grow" id="d-del">Delete</button></div>`, (ov, close) => {
    L.$('#d-edit', ov).onclick = () => { close(); L.eventSheet(null, id); };
    L.$('#d-del', ov).onclick = () => L.confirm('Delete this event?', () => { L.store.remove('events', id); close(); L.refresh(); });
  });
};
