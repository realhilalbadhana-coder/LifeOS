/* ==========================================================================
   LifeOS — screens: Home, Calendar, Notes, Tracker, Tools hub, Reminders, Settings
   ========================================================================== */
var L = window.L;

/* ---------- the 12 tools (hub metadata) ---------- */
L.TOOLS = [
  { id: 'pdf-maker', name: 'PDF Maker', desc: 'Turn text into a PDF', icon: 'pdf', cat: 'PDF', screen: 'tool-pdf-maker' },
  { id: 'pdf-merge', name: 'PDF Merge', desc: 'Combine PDFs into one', icon: 'layers', cat: 'PDF', screen: 'tool-pdf-merge' },
  { id: 'img-pdf', name: 'Image to PDF', desc: 'Photos into a PDF', icon: 'image', cat: 'PDF', screen: 'tool-img-pdf' },
  { id: 'pdf-split', name: 'PDF Split', desc: 'Extract page ranges', icon: 'split', cat: 'PDF', screen: 'tool-pdf-split' },
  { id: 'pdf-compress', name: 'PDF Compressor', desc: 'Shrink a PDF file', icon: 'wand', cat: 'PDF', screen: 'tool-pdf-compress' },
  { id: 'img-compress', name: 'Image Compressor', desc: 'Reduce image size', icon: 'image', cat: 'Image', screen: 'tool-img-compress' },
  { id: 'img-resize', name: 'Image Resizer', desc: 'Resize by width / height', icon: 'layers', cat: 'Image', screen: 'tool-img-resize' },
  { id: 'qr-scan', name: 'QR Scanner', desc: 'Scan codes with the camera', icon: 'camera', cat: 'QR', screen: 'tool-qr-scan' },
  { id: 'qr-gen', name: 'QR Generator', desc: 'Make a QR code', icon: 'qr', cat: 'QR', screen: 'tool-qr-gen' },
  { id: 'unit-convert', name: 'Unit Converter', desc: 'Length, weight, temperature', icon: 'convert', cat: 'Utility', screen: 'tool-unit-convert' },
  { id: 'stopwatch', name: 'Stopwatch', desc: 'Time with laps', icon: 'clock', cat: 'Utility', screen: 'tool-stopwatch' },
  { id: 'timer', name: 'Countdown Timer', desc: 'Count down to zero', icon: 'timer', cat: 'Utility', screen: 'tool-timer' }
];
L.openTool = function (id) {
  var t = L.TOOLS.find(function (x) { return x.id === id; });
  if (!t) return;
  var r = L.store.data.recentTools.filter(function (x) { return x !== id; });
  r.unshift(id);
  L.store.data.recentTools = r.slice(0, 4); L.store.save();
  L.go(t.screen, {});
};
/* shared helper used by every tool screen */
L.toolShell = function (root, title, subtitle, body) {
  root.innerHTML =
    '<button class="btn ghost sm" id="t-back" style="margin-bottom:14px">' + L.icon('back') + ' All tools</button>' +
    '<div class="card raised"><div style="font-weight:750;font-size:16px">' + L.esc(title) + '</div>' +
    '<div class="muted sm" style="margin-top:3px">' + L.esc(subtitle || '') + '</div></div>' + body;
  L.$('#t-back', root).onclick = function () { L.go('tools'); };
};

/* ---------- shared habit helpers ---------- */
function habitDone(h, ymd) { return !!(h.log && h.log[ymd]); }
function habitStreak(h) {
  var s = 0, d = new Date();
  for (; ;) {
    var key = L.ymd(d);
    if (h.log && h.log[key]) { s++; d.setDate(d.getDate() - 1); } else break;
    if (s > 3650) break;
  }
  return s;
}
function last7(h) {
  var out = [], d = new Date();
  d.setDate(d.getDate() - 6);
  for (var i = 0; i < 7; i++) { out.push(habitDone(h, L.ymd(d))); d.setDate(d.getDate() + 1); }
  return out;
}

/* ==========================================================================
   HOME
   ========================================================================== */
function greeting() {
  var h = new Date().getHours();
  if (h < 5) return 'Still up?';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}
L.register('home', {
  title: function () {
    var n = (L.store.data.settings.name || '').trim();
    return n ? 'Hi, ' + n : greeting();
  },
  sub: function () { return new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }); },
  bar: function () {
    return [
      { id: 'bell', icon: 'bell', label: 'Reminders', on: function () { L.go('reminders'); } },
      { id: 'set', icon: 'settings', label: 'Settings', on: function () { L.go('settings'); } }
    ];
  },
  render: function (root) {
    var d = L.store.data;
    var today = L.todayYmd();
    var done = d.habits.filter(function (h) { return habitDone(h, today); }).length;
    var pct = d.habits.length ? Math.round(done / d.habits.length * 100) : 0;
    var openTasks = d.tasks.filter(function (t) { return !t.done; }).slice(0, 4);
    var upcoming = d.reminders.filter(function (r) { return !r.done && r.datetime >= Date.now() - 60000; })
      .sort(function (a, b) { return a.datetime - b.datetime; }).slice(0, 3);

    root.innerHTML =
      '<section class="hero">' +
        '<div class="eyebrow"><span class="livedot"></span> YOUR PERSONAL OPERATING SYSTEM</div>' +
        '<h1>Make today<br><span class="accent">count.</span></h1>' +
        '<p>A little better, every single day.</p>' +
        '<div class="progress"><div class="bar"><i style="width:' + pct + '%"></i></div>' +
        '<div class="meta"><span>' + done + ' of ' + d.habits.length + ' habits</span><span>' + pct + '% complete</span></div></div>' +
      '</section>' +

      '<div class="sec-title"><h2>Overview</h2><span class="link" data-go="tracker">Tracker</span></div>' +
      '<div class="stats">' +
        '<div class="card stat"><span class="k">' + L.icon('check') + 'Habits done</span><span class="v">' + done + '<small> / ' + d.habits.length + '</small></span></div>' +
        '<div class="card stat"><span class="k">' + L.icon('notes') + 'Notes</span><span class="v">' + d.notes.length + '</span></div>' +
        '<div class="card stat"><span class="k">' + L.icon('bell') + 'Reminders</span><span class="v">' + d.reminders.filter(function (r) { return !r.done; }).length + '</span></div>' +
        '<div class="card stat"><span class="k">' + L.icon('calendar') + 'Events</span><span class="v">' + d.events.filter(function (e) { return e.date === today; }).length + '</span></div>' +
      '</div>' +

      (openTasks.length ?
        '<div class="sec-title"><h2>Today\u2019s tasks</h2><span class="link" data-add-task>+ Add</span></div>' +
        '<div class="list">' + openTasks.map(function (t) {
          return '<div class="item-card" data-task="' + t.id + '"><span class="check" data-tick>' + L.icon('check') + '</span>' +
            '<div class="grow ellipsis" style="font-weight:600">' + L.esc(t.title) + '</div></div>';
        }).join('') + '</div>' :
        '<div class="sec-title"><h2>Today\u2019s tasks</h2><span class="link" data-add-task>+ Add</span></div>' +
        '<div class="empty">Nothing on the list. Tap + Add to plan your day.</div>') +

      (upcoming.length ?
        '<div class="sec-title"><h2>Upcoming</h2><span class="link" data-go="reminders">All</span></div>' +
        '<div class="list">' + upcoming.map(function (r) {
          return '<div class="item-card"><span class="ico-badge">' + L.icon('bell') + '</span>' +
            '<div class="grow"><div style="font-weight:600" class="ellipsis">' + L.esc(r.title) + '</div>' +
            '<div class="muted tiny">' + L.fmtDate(r.datetime) + ' \u00b7 ' + L.fmtTime(r.datetime) + '</div></div></div>';
        }).join('') + '</div>' : '') +

      '<div class="sec-title"><h2>Quick access</h2></div>' +
      '<div class="quick">' +
        '<button data-go="calendar"><span class="ico-badge">' + L.icon('calendar') + '</span><b>Calendar</b><small>Plan your days</small></button>' +
        '<button data-add-note><span class="ico-badge">' + L.icon('notes') + '</span><b>Quick note</b><small>Capture a thought</small></button>' +
        '<button data-go="reminders"><span class="ico-badge">' + L.icon('bell') + '</span><b>Reminders</b><small>Never forget</small></button>' +
        '<button data-go="tools"><span class="ico-badge">' + L.icon('tools') + '</span><b>12 tools</b><small>Useful utilities</small></button>' +
      '</div>';

    L.$$('[data-go]', root).forEach(function (b) { b.onclick = function () { L.go(b.dataset.go); }; });
    L.$('[data-add-note]', root).onclick = function () { L.go('notes'); setTimeout(function () { L.noteSheet(); }, 240); };
    L.$('[data-add-task]', root).onclick = function () { L.taskSheet(); };
    L.$$('[data-task]', root).forEach(function (r) {
      L.$('[data-tick]', r).onclick = function () {
        L.store.update('tasks', r.dataset.task, { done: true }); L.haptic(); L.refresh();
      };
    });
  }
});

L.taskSheet = function () {
  L.sheet('New task', '<input class="field" id="tk-t" placeholder="What needs doing?">' +
    '<button class="btn block" id="tk-save">Add task</button>', function (ov, close) {
    L.$('#tk-t', ov).focus();
    L.$('#tk-save', ov).onclick = function () {
      var v = L.$('#tk-t', ov).value.trim(); if (!v) return L.toast('Enter a task');
      L.store.add('tasks', { title: v, done: false, date: L.todayYmd() });
      close(); L.refresh(); L.toast('Task added', 'ok');
    };
  });
};

/* ==========================================================================
   CALENDAR
   ========================================================================== */
var calState = { view: null, selected: null };
L.register('calendar', {
  title: 'Calendar', sub: function () { return L.store.data.events.length + ' events'; },
  bar: function () { return [{ id: 'add', icon: 'plus', label: 'New event', on: function () { L.eventSheet(); } }]; },
  render: function (root) {
    if (!calState.view) calState.view = new Date();
    if (!calState.selected) calState.selected = L.todayYmd();
    root.innerHTML =
      '<div class="card">' +
        '<div class="cal-head"><button class="iconbtn" id="c-prev" aria-label="Previous month">' + L.icon('back') + '</button>' +
        '<h2 id="c-title"></h2>' +
        '<button class="iconbtn" id="c-next" aria-label="Next month">' + L.icon('chev') + '</button></div>' +
        '<div class="dow"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div>' +
        '<div class="days" id="c-days"></div>' +
      '</div>' +
      '<div class="sec-title"><h2 id="c-daylabel">Events</h2><span class="link" id="c-add">+ Event</span></div>' +
      '<div class="list" id="c-events"></div>';
    L.$('#c-prev', root).onclick = function () { calState.view = new Date(calState.view.getFullYear(), calState.view.getMonth() - 1, 1); draw(); };
    L.$('#c-next', root).onclick = function () { calState.view = new Date(calState.view.getFullYear(), calState.view.getMonth() + 1, 1); draw(); };
    L.$('#c-add', root).onclick = function () { L.eventSheet(null, calState.selected); };
    draw();
    function draw() {
      var v = calState.view, y = v.getFullYear(), m = v.getMonth();
      L.$('#c-title', root).textContent = v.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      var first = new Date(y, m, 1);
      var start = (first.getDay() + 6) % 7; // Monday-first
      var daysInMonth = new Date(y, m + 1, 0).getDate();
      var prevDays = new Date(y, m, 0).getDate();
      var html = '';
      for (var i = 0; i < 42; i++) {
        var day, dt, other = false;
        if (i < start) { day = prevDays - start + i + 1; dt = new Date(y, m - 1, day); other = true; }
        else if (i >= start + daysInMonth) { day = i - (start + daysInMonth) + 1; dt = new Date(y, m + 1, day); other = true; }
        else { day = i - start + 1; dt = new Date(y, m, day); }
        var iso = L.ymd(dt);
        var has = L.store.data.events.some(function (e) { return e.date === iso; });
        var cls = 'day' + (other ? ' other' : '') + (iso === L.todayYmd() ? ' today' : '') + (iso === calState.selected ? ' sel' : '');
        html += '<button class="' + cls + '" data-date="' + iso + '">' + day + (has ? '<span class="dot"></span>' : '') + '</button>';
      }
      L.$('#c-days', root).innerHTML = html;
      L.$$('[data-date]', root).forEach(function (b) {
        b.onclick = function () { calState.selected = b.dataset.date; var dd = new Date(b.dataset.date + 'T12:00:00'); calState.view = new Date(dd.getFullYear(), dd.getMonth(), 1); draw(); };
      });
      L.$('#c-daylabel', root).textContent = L.relDay(calState.selected);
      var evs = L.store.data.events.filter(function (e) { return e.date === calState.selected; })
        .sort(function (a, b) { return (a.time || '').localeCompare(b.time || ''); });
      L.$('#c-events', root).innerHTML = evs.length ? evs.map(function (e) {
        return '<div class="item-card" data-ev="' + e.id + '"><span class="ico-badge">' + L.icon(e.type === 'exam' ? 'book' : e.type === 'deadline' ? 'flag' : 'calendar') + '</span>' +
          '<div class="grow"><div style="font-weight:600" class="ellipsis">' + L.esc(e.title) + '</div>' +
          '<div class="muted tiny">' + (e.time ? L.esc(e.time) + ' \u00b7 ' : '') + L.esc(e.type || 'event') + (e.notes ? ' \u00b7 ' + L.esc(e.notes) : '') + '</div></div>' +
          '<button class="iconbtn" data-del style="width:36px;height:36px">' + L.icon('trash') + '</button></div>';
      }).join('') : '<div class="empty">No events on ' + L.esc(L.relDay(calState.selected)) + '. Tap + Event to add one.</div>';
      L.$$('[data-del]', root).forEach(function (b) {
        b.onclick = function () { var id = b.closest('[data-ev]').dataset.ev; L.confirm('Delete this event?', function () { L.store.remove('events', id); draw(); }); };
      });
      L.$$('[data-ev]', root).forEach(function (r) {
        L.$('.grow', r).onclick = function () { L.eventSheet(r.dataset.ev); };
      });
    }
  }
});

L.eventSheet = function (id, date) {
  var e = id ? L.store.get('events', id) : null;
  var d = e ? e.date : (date || L.todayYmd());
  L.sheet(e ? 'Edit event' : 'New event',
    '<input class="field" id="ev-t" placeholder="Event title" value="' + (e ? L.esc(e.title) : '') + '">' +
    '<input class="field" id="ev-d" type="date" value="' + d + '">' +
    '<input class="field" id="ev-time" type="time" value="' + (e && e.time ? e.time : '') + '">' +
    '<select class="field" id="ev-type">' + ['event', 'exam', 'assignment', 'deadline'].map(function (t) {
      return '<option value="' + t + '"' + (e && e.type === t ? ' selected' : '') + '>' + t[0].toUpperCase() + t.slice(1) + '</option>';
    }).join('') + '</select>' +
    '<input class="field" id="ev-n" placeholder="Notes (optional)" value="' + (e ? L.esc(e.notes || '') : '') + '">' +
    '<button class="btn block" id="ev-save">' + (e ? 'Save changes' : 'Add event') + '</button>',
    function (ov, close) {
      L.$('#ev-t', ov).focus();
      L.$('#ev-save', ov).onclick = function () {
        var title = L.$('#ev-t', ov).value.trim(); if (!title) return L.toast('Enter a title');
        var payload = { title: title, date: L.$('#ev-d', ov).value || L.todayYmd(), time: L.$('#ev-time', ov).value, type: L.$('#ev-type', ov).value, notes: L.$('#ev-n', ov).value.trim() };
        if (e) L.store.update('events', id, payload); else L.store.add('events', payload);
        close(); L.refresh(); L.toast(e ? 'Event updated' : 'Event added', 'ok');
      };
    });
};

/* ==========================================================================
   NOTES
   ========================================================================== */
var noteQuery = '';
L.register('notes', {
  title: 'Notes', sub: function () { return L.store.data.notes.length + ' saved'; },
  bar: function () { return [{ id: 'add', icon: 'plus', label: 'New note', on: function () { L.noteSheet(); } }]; },
  render: function (root) {
    root.innerHTML =
      '<div style="position:relative;margin-bottom:8px">' +
        '<input class="field" id="n-q" placeholder="Search your notes\u2026" value="' + L.esc(noteQuery) + '" style="padding-left:44px">' +
        '<span style="position:absolute;left:15px;top:16px;color:var(--muted)">' + L.icon('search') + '</span>' +
      '</div><div class="list" id="n-list"></div><button class="fab" id="n-add">' + L.icon('plus') + '</button>';
    L.$('#n-add', root).onclick = function () { L.noteSheet(); };
    L.$('#n-q', root).oninput = function (e) { noteQuery = e.target.value; draw(); };
    draw();
    function draw() {
      var q = noteQuery.toLowerCase().trim();
      var list = L.store.data.notes.filter(function (n) { return !q || (n.title + ' ' + n.body).toLowerCase().indexOf(q) >= 0; });
      list.sort(function (a, b) { return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (b.updated || 0) - (a.updated || 0); });
      L.$('#n-list', root).innerHTML = list.length ? list.map(function (n) {
        return '<div class="item-card" data-note="' + n.id + '" style="align-items:flex-start">' +
          '<div class="grow" style="min-width:0"><div class="row between" style="gap:8px"><div style="font-weight:700" class="ellipsis">' + L.esc(n.title || 'Untitled note') + '</div>' +
          (n.pinned ? '<span class="pill hi">Pinned</span>' : '') + '</div>' +
          (n.body ? '<div class="muted sm" style="margin-top:5px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">' + L.esc(n.body) + '</div>' : '') +
          '<div class="muted tiny" style="margin-top:7px">' + L.esc(n.updated ? L.fmtDate(n.updated) : '') + '</div></div>' +
          '<button class="iconbtn" data-del style="width:36px;height:36px">' + L.icon('trash') + '</button></div>';
      }).join('') : '<div class="empty">' + (q ? 'No notes match \u201c' + L.esc(noteQuery) + '\u201d' : 'No notes yet. Tap + to write one.') + '</div>';
      L.$$('[data-note]', root).forEach(function (r) {
        L.$('.grow', r).onclick = function () { L.noteSheet(r.dataset.note); };
        L.$('[data-del]', r).onclick = function (ev) {
          ev.stopPropagation();
          L.confirm('Delete this note?', function () { L.store.remove('notes', r.dataset.note); draw(); });
        };
      });
    }
  }
});

L.noteSheet = function (id) {
  var n = id ? L.store.get('notes', id) : null;
  L.sheet(n ? 'Edit note' : 'New note',
    '<input class="field" id="no-t" placeholder="Title" value="' + (n ? L.esc(n.title) : '') + '">' +
    '<textarea class="field" id="no-b" placeholder="Write whatever is on your mind\u2026">' + (n ? L.esc(n.body) : '') + '</textarea>' +
    '<div class="row between" style="margin:4px 2px 14px"><span class="sm muted">Pin to top</span>' +
    '<span class="switch ' + (n && n.pinned ? 'on' : '') + '" id="no-pin"><i></i></span></div>' +
    '<button class="btn block" id="no-save">' + (n ? 'Save changes' : 'Save note') + '</button>',
    function (ov, close) {
      var pin = !!(n && n.pinned);
      L.$('#no-pin', ov).onclick = function () { pin = !pin; L.$('#no-pin', ov).classList.toggle('on', pin); };
      L.$('#no-t', ov).focus();
      L.$('#no-save', ov).onclick = function () {
        var title = L.$('#no-t', ov).value.trim(), body = L.$('#no-b', ov).value.trim();
        if (!title && !body) return L.toast('Add a title or some text');
        var payload = { title: title, body: body, pinned: pin, updated: Date.now() };
        if (n) L.store.update('notes', id, payload); else L.store.add('notes', Object.assign({ created: Date.now() }, payload));
        close(); L.refresh(); L.toast(n ? 'Note updated' : 'Note saved', 'ok');
      };
    });
};

/* ==========================================================================
   TRACKER
   ========================================================================== */
var habitIcons = ['target', 'drop', 'book', 'dumbbell', 'heart', 'fire', 'check', 'clock'];
L.register('tracker', {
  title: 'Tracker', sub: function () { return L.store.data.habits.length + ' habits'; },
  bar: function () { return [{ id: 'add', icon: 'plus', label: 'New habit', on: function () { L.habitSheet(); } }]; },
  render: function (root) {
    var d = L.store.data, today = L.todayYmd();
    var done = d.habits.filter(function (h) { return habitDone(h, today); }).length;
    var pct = d.habits.length ? Math.round(done / d.habits.length * 100) : 0;
    root.innerHTML =
      '<div class="card raised"><div class="row between"><div><span class="lbl" style="margin:0">Today\u2019s progress</span>' +
      '<div style="font-size:30px;font-weight:820;letter-spacing:-1.5px;margin-top:6px">' + done + ' / ' + d.habits.length + '</div>' +
      '<div class="muted sm" style="margin-top:4px">Every check is a vote for your future self.</div></div>' +
      '<div class="ring" id="t-ring"><b>' + pct + '%</b></div></div></div>' +
      '<div class="sec-title"><h2>Daily routine</h2><span class="link" id="t-reset">Reset today</span></div>' +
      '<div class="list" id="t-list"></div><button class="fab" id="t-add">' + L.icon('plus') + '</button>';
    L.$('#t-ring', root).style.background = 'conic-gradient(var(--lime) ' + (pct * 3.6) + 'deg, #262C19 0deg)';
    L.$('#t-reset', root).onclick = function () {
      L.confirm('Clear all of today\u2019s habit checks?', function () {
        d.habits.forEach(function (h) { if (h.log) delete h.log[today]; });
        L.store.save(); L.refresh(); L.toast('Today reset');
      }, 'Reset');
    };
    L.$('#t-add', root).onclick = function () { L.habitSheet(); };
    L.$('#t-list', root).innerHTML = d.habits.length ? d.habits.map(function (h) {
      var on = habitDone(h, today);
      var wk = last7(h);
      return '<div class="item-card" data-h="' + h.id + '" style="align-items:flex-start">' +
        '<span class="check ' + (on ? 'on' : '') + '" data-tick>' + L.icon('check') + '</span>' +
        '<div class="grow" style="min-width:0"><div class="row between" style="gap:8px"><div style="font-weight:650" class="ellipsis">' + L.esc(h.name) + '</div>' +
        '<span class="pill' + (habitStreak(h) > 0 ? ' hi' : '') + '">' + L.icon('fire', 'ic') + ' ' + habitStreak(h) + '</span></div>' +
        '<div class="streak" style="margin-top:9px">' + wk.map(function (v) { return '<i class="' + (v ? 'on' : '') + '"></i>'; }).join('') + '</div></div>' +
        '<button class="iconbtn" data-del style="width:36px;height:36px">' + L.icon('trash') + '</button></div>';
    }).join('') : '<div class="empty">No habits yet. Tap + to build your first routine.</div>';
    L.$$('[data-h]', root).forEach(function (r) {
      var id = r.dataset.h;
      L.$('[data-tick]', r).onclick = function () {
        var h = L.store.get('habits', id); h.log = h.log || {};
        if (h.log[today]) delete h.log[today]; else h.log[today] = 1;
        L.store.save(); L.haptic(); L.refresh();
      };
      L.$('[data-del]', r).onclick = function () { L.confirm('Delete this habit?', function () { L.store.remove('habits', id); L.refresh(); }); };
    });
  }
});

L.habitSheet = function () {
  L.sheet('New habit',
    '<input class="field" id="hb-n" placeholder="e.g. Read 10 pages">' +
    '<span class="lbl">Icon</span><div class="chips" id="hb-icons">' + habitIcons.map(function (ic, i) {
      return '<button class="chip' + (i === 0 ? ' active' : '') + '" data-ic="' + ic + '">' + L.icon(ic, 'ic') + '</button>';
    }).join('') + '</div>' +
    '<button class="btn block mt" id="hb-save">Add habit</button>', function (ov, close) {
    var icon = habitIcons[0];
    L.$$('[data-ic]', ov).forEach(function (b) {
      b.onclick = function () { icon = b.dataset.ic; L.$$('[data-ic]', ov).forEach(function (x) { x.classList.toggle('active', x === b); }); };
    });
    L.$('#hb-n', ov).focus();
    L.$('#hb-save', ov).onclick = function () {
      var name = L.$('#hb-n', ov).value.trim(); if (!name) return L.toast('Name your habit');
      L.store.add('habits', { name: name, icon: icon, created: Date.now(), log: {} });
      close(); L.refresh(); L.toast('Habit added', 'ok');
    };
  });
};

/* ==========================================================================
   TOOLS HUB
   ========================================================================== */
var toolsQuery = '';
L.register('tools', {
  title: 'Tools', sub: function () { return '12 multitools'; },
  bar: function () { return [{ id: 'set', icon: 'settings', label: 'Settings', on: function () { L.go('settings'); } }]; },
  render: function (root) {
    var recent = L.store.data.recentTools.map(function (id) { return L.TOOLS.find(function (t) { return t.id === id; }); }).filter(Boolean);
    root.innerHTML =
      '<div style="position:relative;margin-bottom:8px">' +
        '<input class="field" id="tl-q" placeholder="Search tools\u2026" value="' + L.esc(toolsQuery) + '" style="padding-left:44px">' +
        '<span style="position:absolute;left:15px;top:16px;color:var(--muted)">' + L.icon('search') + '</span></div>' +
      (recent.length && !toolsQuery ? '<div class="sec-title"><h2>Recent</h2></div><div class="scroll-x" id="tl-recent"></div>' : '') +
      '<div class="sec-title"><h2>All tools</h2></div><div class="toolgrid" id="tl-grid"></div>';
    if (recent.length && !toolsQuery) {
      L.$('#tl-recent', root).innerHTML = recent.map(function (t) {
        return '<button class="card" style="margin:0;min-width:118px;text-align:left;padding:14px" data-t="' + t.id + '"><span class="ico-badge">' + L.icon(t.icon) + '</span><div style="font-weight:700;margin-top:9px;font-size:13px">' + t.name + '</div></button>';
      }).join('');
    }
    L.$('#tl-q', root).oninput = function (e) { toolsQuery = e.target.value; drawGrid(root); };
    drawGrid(root);
  }
});
function drawGrid(root) {
  var q = toolsQuery.toLowerCase().trim();
  var list = L.TOOLS.filter(function (t) { return !q || (t.name + ' ' + t.desc + ' ' + t.cat).toLowerCase().indexOf(q) >= 0; });
  var grid = L.$('#tl-grid', root);
  grid.innerHTML = list.length ? list.map(function (t) {
    return '<button class="tool" data-t="' + t.id + '"><span class="ico-badge">' + L.icon(t.icon) + '</span><span class="t">' + t.name + '</span><span class="d">' + t.desc + '</span></button>';
  }).join('') : '<div class="empty" style="grid-column:1/-1">No tools match \u201c' + L.esc(toolsQuery) + '\u201d</div>';
  L.$$('[data-t]', grid).forEach(function (b) { b.onclick = function () { L.openTool(b.dataset.t); }; });
  L.$$('#tl-recent [data-t]', root).forEach(function (b) { b.onclick = function () { L.openTool(b.dataset.t); }; });
}

/* ==========================================================================
   REMINDERS
   ========================================================================== */
L.register('reminders', {
  title: 'Reminders', sub: function () { return L.store.data.reminders.filter(function (r) { return !r.done; }).length + ' active'; },
  bar: function () {
    return [
      { id: 'perm', icon: 'bell', label: 'Notifications', on: function () { L.askNotify(); } },
      { id: 'add', icon: 'plus', label: 'New reminder', on: function () { L.reminderSheet(); } }
    ];
  },
  render: function (root) {
    var active = L.store.data.reminders.filter(function (r) { return !r.done; }).sort(function (a, b) { return a.datetime - b.datetime; });
    var done = L.store.data.reminders.filter(function (r) { return r.done; }).sort(function (a, b) { return b.datetime - a.datetime; });
    root.innerHTML =
      '<button class="btn ghost block sm" id="rm-perm" style="margin-bottom:14px">' + L.icon('bell') + ' Enable notifications</button>' +
      '<div class="sec-title"><h2>Active</h2></div><div class="list" id="rm-a"></div>' +
      '<div class="sec-title"><h2>Completed</h2></div><div class="list" id="rm-d"></div>' +
      '<button class="fab" id="rm-add">' + L.icon('plus') + '</button>';
    L.$('#rm-perm', root).onclick = function () { L.askNotify(); };
    L.$('#rm-add', root).onclick = function () { L.reminderSheet(); };
    function row(r, isDone) {
      return '<div class="item-card" data-r="' + r.id + '">' +
        '<span class="check ' + (isDone ? 'on' : '') + '" data-toggle>' + (isDone ? L.icon('check') : '') + '</span>' +
        '<div class="grow" style="min-width:0"><div style="font-weight:600" class="ellipsis">' + L.esc(r.title) + '</div>' +
        '<div class="muted tiny">' + L.fmtDate(r.datetime) + ' \u00b7 ' + L.fmtTime(r.datetime) + (r.repeat && r.repeat !== 'none' ? ' \u00b7 ' + L.esc(r.repeat) : '') + '</div></div>' +
        '<span class="pill ' + (r.priority === 'high' ? 'lo' : r.priority === 'low' ? '' : 'hi') + '">' + L.esc(r.priority || 'normal') + '</span>' +
        '<button class="iconbtn" data-del style="width:36px;height:36px">' + L.icon('trash') + '</button></div>';
    }
    L.$('#rm-a', root).innerHTML = active.length ? active.map(function (r) { return row(r, false); }).join('') : '<div class="empty">No active reminders.</div>';
    L.$('#rm-d', root).innerHTML = done.length ? done.map(function (r) { return row(r, true); }).join('') : '<div class="empty">Nothing completed yet.</div>';
    L.$$('[data-toggle]', root).forEach(function (c) {
      c.onclick = function () { var id = c.closest('[data-r]').dataset.r; var r = L.store.get('reminders', id); L.store.update('reminders', id, { done: !r.done }); L.haptic(); L.refresh(); };
    });
    L.$$('[data-del]', root).forEach(function (b) {
      b.onclick = function () { var id = b.closest('[data-r]').dataset.r; L.confirm('Delete this reminder?', function () { L.store.remove('reminders', id); L.refresh(); }); };
    });
    L.$$('[data-r]', root).forEach(function (r) {
      L.$('.grow', r).onclick = function () { L.reminderSheet(r.dataset.r); };
    });
  }
});

L.reminderSheet = function (id) {
  var r = id ? L.store.get('reminders', id) : null;
  var dt = r ? new Date(r.datetime) : new Date(Date.now() + 3600000);
  var local = dt.getFullYear() + '-' + L.pad(dt.getMonth() + 1) + '-' + L.pad(dt.getDate()) + 'T' + L.pad(dt.getHours()) + ':' + L.pad(dt.getMinutes());
  L.sheet(r ? 'Edit reminder' : 'New reminder',
    '<input class="field" id="rs-t" placeholder="Remind me to\u2026" value="' + (r ? L.esc(r.title) : '') + '">' +
    '<input class="field" id="rs-dt" type="datetime-local" value="' + local + '">' +
    '<select class="field" id="rs-rep">' + ['none', 'daily', 'weekly', 'monthly'].map(function (x) {
      return '<option value="' + x + '"' + (r && r.repeat === x ? ' selected' : '') + '>' + (x === 'none' ? 'One time' : x[0].toUpperCase() + x.slice(1)) + '</option>';
    }).join('') + '</select>' +
    '<select class="field" id="rs-p">' + ['normal', 'high', 'low'].map(function (x) {
      return '<option value="' + x + '"' + (r && r.priority === x ? ' selected' : '') + '>' + x[0].toUpperCase() + x.slice(1) + ' priority</option>';
    }).join('') + '</select>' +
    '<button class="btn block" id="rs-save">' + (r ? 'Save changes' : 'Add reminder') + '</button>',
    function (ov, close) {
      L.$('#rs-t', ov).focus();
      L.$('#rs-save', ov).onclick = function () {
        var title = L.$('#rs-t', ov).value.trim(); if (!title) return L.toast('Enter a title');
        var when = new Date(L.$('#rs-dt', ov).value).getTime();
        if (!when) return L.toast('Pick a date and time');
        var payload = { title: title, datetime: when, repeat: L.$('#rs-rep', ov).value, priority: L.$('#rs-p', ov).value, done: false };
        if (r) L.store.update('reminders', id, payload); else L.store.add('reminders', payload);
        close(); L.refresh(); L.toast(r ? 'Reminder updated' : 'Reminder set', 'ok');
        L.askNotify();
      };
    });
};

/* foreground reminder dispatcher */
L.startDispatchers = function () {
  setInterval(function () {
    var now = Date.now();
    L.store.data.reminders.forEach(function (r) {
      if (!r.done && !r._fired && r.datetime <= now && now - r.datetime < 120000) {
        r._fired = true; L.store.save();
        L.notify('LifeOS reminder', r.title);
        L.toast('Reminder: ' + r.title, 'ok');
      }
    });
  }, 20000);
};

/* ==========================================================================
   SETTINGS
   ========================================================================== */
L.register('settings', {
  title: 'Settings', sub: function () { return 'Your LifeOS, your way'; },
  bar: function () { return [{ id: 'back', icon: 'back', label: 'Back', on: function () { L.back(); } }]; },
  render: function (root) {
    var s = L.store.data.settings;
    root.innerHTML =
      '<div class="card"><span class="lbl" style="margin-top:0">Your name</span>' +
      '<input class="field" id="st-name" placeholder="Add your name" value="' + L.esc(s.name || '') + '">' +
      '<div class="settings-row"><span>Reminder notifications</span><span class="switch ' + (s.remindersNotify ? 'on' : '') + '" id="st-notif"><i></i></span></div>' +
      '<div class="settings-row"><span>Haptic feedback</span><span class="switch ' + (s.haptics ? 'on' : '') + '" id="st-hap"><i></i></span></div>' +
      '</div>' +
      '<div class="sec-title"><h2>Data</h2></div>' +
      '<div class="card">' +
      '<div class="settings-row"><span>Saved notes</span><b>' + L.store.data.notes.length + '</b></div>' +
      '<div class="settings-row"><span>Habits</span><b>' + L.store.data.habits.length + '</b></div>' +
      '<div class="settings-row"><span>Reminders</span><b>' + L.store.data.reminders.length + '</b></div>' +
      '<div class="settings-row"><span>Storage</span><b>On this device</b></div>' +
      '<div class="row" style="gap:10px;margin-top:14px"><button class="btn ghost grow sm" id="st-export">' + L.icon('download') + ' Export</button>' +
      '<button class="btn ghost grow sm" id="st-import">' + L.icon('share') + ' Import</button></div>' +
      '<button class="btn danger block sm mt" id="st-clear">' + L.icon('trash') + ' Clear all local data</button>' +
      '</div>' +
      '<div class="sec-title"><h2>Permissions</h2></div>' +
      '<div class="card"><div class="muted sm" style="line-height:1.6">LifeOS asks for the camera only when you open the QR Scanner, and for notifications only when you set a reminder. Everything you create stays on this device \u2014 nothing is uploaded anywhere.</div></div>' +
      '<div class="sec-title"><h2>About</h2></div>' +
      '<div class="card"><div class="row between"><span class="muted sm">LifeOS</span><b>v2.0</b></div>' +
      '<div class="muted tiny" style="margin-top:10px">A premium, offline-first personal operating system for Android.</div></div>';
    L.$('#st-name', root).onchange = function (e) { s.name = e.target.value.trim(); L.store.save(); };
    L.$('#st-notif', root).onclick = function () { s.remindersNotify = !s.remindersNotify; L.$('#st-notif', root).classList.toggle('on', s.remindersNotify); L.store.save(); };
    L.$('#st-hap', root).onclick = function () { s.haptics = !s.haptics; L.$('#st-hap', root).classList.toggle('on', s.haptics); L.store.save(); };
    L.$('#st-export', root).onclick = function () {
      L.saveBlob(new Blob([L.store.exportJSON()], { type: 'application/json' }), 'lifeos-backup.json');
    };
    L.$('#st-import', root).onclick = function () {
      L.pickFiles('application/json,.json', false).then(function (files) {
        if (!files.length) return;
        var r = new FileReader();
        r.onload = function () { try { L.store.importJSON(r.result); L.refresh(); L.toast('Backup imported', 'ok'); } catch (e) { L.toast('Invalid backup file', 'err'); } };
        r.readAsText(files[0]);
      });
    };
    L.$('#st-clear', root).onclick = function () {
      L.confirm('Delete all notes, habits, events and reminders saved on this device?', function () {
        L.store.reset(); L.toast('Local data cleared'); L.go('home');
      }, 'Clear everything');
    };
  }
});
