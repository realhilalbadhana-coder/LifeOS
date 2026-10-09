/* ==========================================================================
   LifeOS — the 12 tools (all real, all offline: jsPDF + pdf-lib + qrcode + jsQR)
   ========================================================================== */
var L = window.L;

function pdfLib() { return window.PDFLib; }
function jsPDFCtor() { return (window.jspdf || {}).jsPDF; }

/* ---------------- 1. PDF Maker (text -> PDF) ---------------- */
L.register('tool-pdf-maker', {
  title: 'PDF Maker', sub: 'Text to PDF',
  render: function (root) {
    L.toolShell(root, 'PDF Maker', 'Type or paste text and export a clean PDF',
      '<div class="card">' +
        '<input class="field" id="pm-name" placeholder="File name" value="document">' +
        '<textarea class="field" id="pm-text" style="min-height:38vh" placeholder="Type your text here\u2026"></textarea>' +
        '<div class="row" style="gap:10px"><select class="field grow" id="pm-size" style="margin:0"><option>A4</option><option>Letter</option></select>' +
        '<select class="field grow" id="pm-font" style="margin:0"><option value="12">12 pt</option><option value="14">14 pt</option><option value="16">16 pt</option></select></div>' +
        '<button class="btn block mt" id="pm-go">' + L.icon('pdf') + ' Create PDF</button>' +
      '</div>');
    L.$('#pm-go', root).onclick = function () {
      var jsPDF = jsPDFCtor(); if (!jsPDF) return L.toast('PDF library unavailable', 'err');
      var text = L.$('#pm-text', root).value;
      if (!text.trim()) return L.toast('Write some content first');
      var name = (L.$('#pm-name', root).value.trim() || 'document') + '.pdf';
      var size = L.$('#pm-size', root).value, fs = +L.$('#pm-font', root).value;
      try {
        var doc = new jsPDF({ unit: 'pt', format: size.toLowerCase() });
        var W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 48;
        doc.setFontSize(fs);
        var lines = doc.splitTextToSize(text, W - M * 2), y = M;
        lines.forEach(function (line) {
          if (y > H - M) { doc.addPage(); y = M; }
          doc.text(line, M, y); y += fs * 1.5;
        });
        L.saveBlob(doc.output('blob'), name);
        L.toast('PDF created', 'ok');
      } catch (e) { L.toast('Failed: ' + e.message, 'err'); }
    };
  }
});

/* ---------------- 2. PDF Merge ---------------- */
L.register('tool-pdf-merge', {
  title: 'PDF Merge', sub: 'Combine PDF files',
  render: function (root) {
    L.toolShell(root, 'PDF Merge', 'Select two or more PDFs and merge them in order',
      '<div class="card"><button class="btn block" id="mg-pick">' + L.icon('plus') + ' Select PDF files</button>' +
      '<div class="list mt" id="mg-list"></div>' +
      '<button class="btn block mt hide" id="mg-go">' + L.icon('layers') + ' Merge &amp; Save</button></div>');
    var files = [], listEl = L.$('#mg-list', root);
    function redraw() {
      listEl.innerHTML = files.map(function (f, i) {
        return '<div class="item-card"><span class="ico-badge">' + L.icon('pdf') + '</span>' +
          '<div class="grow" style="min-width:0"><div style="font-weight:600" class="ellipsis">' + L.esc(f.name) + '</div><div class="muted tiny">' + L.fmtBytes(f.size) + '</div></div>' +
          '<div class="row" style="gap:4px"><button class="iconbtn" data-up="' + i + '" style="width:34px;height:34px">' + L.icon('chev', 'ic') + '</button>' +
          '<button class="iconbtn" data-rm="' + i + '" style="width:34px;height:34px">' + L.icon('x') + '</button></div></div>';
      }).join('');
      L.$$('[data-rm]', listEl).forEach(function (b) { b.onclick = function () { files.splice(+b.dataset.rm, 1); redraw(); }; });
      L.$$('[data-up]', listEl).forEach(function (b) {
        b.onclick = function () { var i = +b.dataset.up; if (i > 0) { var t = files[i - 1]; files[i - 1] = files[i]; files[i] = t; redraw(); } };
      });
      L.$('#mg-go', root).classList.toggle('hide', files.length < 2);
    }
    L.$('#mg-pick', root).onclick = function () { L.pickFiles('application/pdf', true).then(function (p) { files = files.concat(p); redraw(); }); };
    L.$('#mg-go', root).onclick = function () {
      var PDFLib = pdfLib(); if (!PDFLib) return L.toast('PDF library unavailable', 'err');
      L.busy(true);
      PDFLib.PDFDocument.create().then(function (out) {
        return files.reduce(function (chain, f) {
          return chain.then(function () {
            return L.readArrayBuffer(f).then(function (buf) {
              return PDFLib.PDFDocument.load(buf, { ignoreEncryption: true }).then(function (src) {
                return out.copyPages(src, src.getPageIndices()).then(function (pages) { pages.forEach(function (p) { out.addPage(p); }); });
              });
            });
          });
        }, Promise.resolve()).then(function () { return out.save(); });
      }).then(function (bytes) {
        L.busy(false); L.saveBlob(new Blob([bytes], { type: 'application/pdf' }), 'merged.pdf');
        L.toast('Merged ' + files.length + ' files', 'ok');
      }).catch(function (e) { L.busy(false); L.toast('Merge failed: ' + e.message, 'err'); });
    };
    redraw();
  }
});

/* ---------------- 3. Image to PDF ---------------- */
L.register('tool-img-pdf', {
  title: 'Image to PDF', sub: 'Images to document',
  render: function (root) {
    L.toolShell(root, 'Image to PDF', 'Select images, reorder, and export as a PDF',
      '<div class="card"><button class="btn block" id="ip-pick">' + L.icon('image') + ' Select images</button>' +
      '<div class="list mt" id="ip-list"></div>' +
      '<button class="btn block mt hide" id="ip-go">' + L.icon('pdf') + ' Create PDF</button></div>');
    var imgs = [], listEl = L.$('#ip-list', root);
    function redraw() {
      listEl.innerHTML = imgs.map(function (f, i) {
        return '<div class="item-card"><img src="' + f._url + '" alt="" style="width:44px;height:44px;object-fit:cover;border-radius:11px">' +
          '<div class="grow" style="min-width:0"><div style="font-weight:600" class="ellipsis">' + L.esc(f.name) + '</div><div class="muted tiny">' + L.fmtBytes(f.size) + '</div></div>' +
          '<div class="row" style="gap:4px"><button class="iconbtn" data-up="' + i + '" style="width:34px;height:34px">' + L.icon('chev', 'ic') + '</button>' +
          '<button class="iconbtn" data-rm="' + i + '" style="width:34px;height:34px">' + L.icon('x') + '</button></div></div>';
      }).join('');
      L.$$('[data-rm]', listEl).forEach(function (b) { b.onclick = function () { imgs.splice(+b.dataset.rm, 1); redraw(); }; });
      L.$$('[data-up]', listEl).forEach(function (b) { b.onclick = function () { var i = +b.dataset.up; if (i > 0) { var t = imgs[i - 1]; imgs[i - 1] = imgs[i]; imgs[i] = t; redraw(); } }; });
      L.$('#ip-go', root).classList.toggle('hide', !imgs.length);
    }
    L.$('#ip-pick', root).onclick = function () {
      L.pickFiles('image/*', true).then(function (picked) {
        Promise.all(picked.map(function (f) { return L.readDataURL(f).then(function (u) { f._url = u; return f; }); }))
          .then(function (p) { imgs = imgs.concat(p); redraw(); });
      });
    };
    L.$('#ip-go', root).onclick = function () {
      var jsPDF = jsPDFCtor(); if (!jsPDF) return L.toast('PDF library unavailable', 'err');
      L.busy(true);
      (function () {
        var doc = null;
        return imgs.reduce(function (chain, f) {
          return chain.then(function () {
            return L.readDataURL(f).then(function (u) { return L.loadImage(u); }).then(function (img) {
              var orient = img.width > img.height ? 'l' : 'p';
              if (!doc) doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: orient });
              else doc.addPage('a4', orient);
              var W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 24;
              var scale = Math.min((W - M * 2) / img.width, (H - M * 2) / img.height);
              var w = img.width * scale, h = img.height * scale;
              doc.addImage(u, 'JPEG', (W - w) / 2, (H - h) / 2, w, h);
            });
          });
        }, Promise.resolve()).then(function () { return doc; });
      })().then(function (doc) {
        L.busy(false); L.saveBlob(doc.output('blob'), 'images.pdf');
        L.toast('PDF created from ' + imgs.length + ' images', 'ok');
      }).catch(function (e) { L.busy(false); L.toast('Failed: ' + e.message, 'err'); });
    };
    redraw();
  }
});

/* ---------------- 4. PDF Split ---------------- */
function parseRange(str, max) {
  var set = {};
  str.split(',').forEach(function (part) {
    part = part.trim(); if (!part) return;
    var m = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) { var a = +m[1], b = +m[2]; if (a > b) { var t = a; a = b; b = t; } for (var i = a; i <= b; i++) if (i >= 1 && i <= max) set[i - 1] = 1; }
    else if (/^\d+$/.test(part)) { var n = +part; if (n >= 1 && n <= max) set[n - 1] = 1; }
  });
  return Object.keys(set).map(Number).sort(function (a, b) { return a - b; });
}
L.register('tool-pdf-split', {
  title: 'PDF Split', sub: 'Separate pages',
  render: function (root) {
    L.toolShell(root, 'PDF Split', 'Select a PDF, choose pages, export a new PDF',
      '<div class="card"><button class="btn block" id="sp-pick">' + L.icon('pdf') + ' Select a PDF</button>' +
      '<div id="sp-info" class="mt"></div></div>');
    var file = null, count = 0;
    L.$('#sp-pick', root).onclick = function () {
      L.pickFiles('application/pdf', false).then(function (picked) {
        if (!picked.length) return;
        file = picked[0];
        var PDFLib = pdfLib();
        L.readArrayBuffer(file).then(function (buf) { return PDFLib.PDFDocument.load(buf, { ignoreEncryption: true }); })
          .then(function (doc) {
            count = doc.getPageCount();
            L.$('#sp-info', root).innerHTML = '<div class="item-card"><span class="ico-badge">' + L.icon('pdf') + '</span>' +
              '<div class="grow" style="min-width:0"><div style="font-weight:600" class="ellipsis">' + L.esc(file.name) + '</div>' +
              '<div class="muted tiny">' + count + ' pages \u00b7 ' + L.fmtBytes(file.size) + '</div></div></div>' +
              '<span class="lbl">Pages to extract (e.g. 1-3,5)</span>' +
              '<input class="field" id="sp-range" value="1-' + count + '">' +
              '<button class="btn block" id="sp-go">' + L.icon('split') + ' Extract &amp; Save</button>';
            L.$('#sp-go', root).onclick = function () {
              var idx = parseRange(L.$('#sp-range', root).value, count);
              if (!idx.length) return L.toast('Enter valid pages');
              L.busy(true);
              L.readArrayBuffer(file).then(function (buf) { return PDFLib.PDFDocument.load(buf, { ignoreEncryption: true }); })
                .then(function (src) {
                  return PDFLib.PDFDocument.create().then(function (out) {
                    return out.copyPages(src, idx).then(function (pages) { pages.forEach(function (p) { out.addPage(p); }); return out.save(); });
                  });
                })
                .then(function (bytes) { L.busy(false); L.saveBlob(new Blob([bytes], { type: 'application/pdf' }), 'extracted.pdf'); L.toast('Exported ' + idx.length + ' pages', 'ok'); })
                .catch(function (e) { L.busy(false); L.toast('Failed: ' + e.message, 'err'); });
            };
          })
          .catch(function (e) { L.toast('Could not read PDF: ' + e.message, 'err'); });
      });
    };
  }
});

/* ---------------- 5. PDF Compressor ---------------- */
L.register('tool-pdf-compress', {
  title: 'PDF Compressor', sub: 'Reduce PDF size',
  render: function (root) {
    L.toolShell(root, 'PDF Compressor', 'Re-optimises the file and reports the real size change',
      '<div class="card"><button class="btn block" id="cp-pick">' + L.icon('pdf') + ' Select a PDF</button>' +
      '<div id="cp-info" class="mt"></div></div>');
    var file = null;
    L.$('#cp-pick', root).onclick = function () {
      L.pickFiles('application/pdf', false).then(function (picked) {
        if (!picked.length) return;
        file = picked[0];
        L.$('#cp-info', root).innerHTML = '<div class="item-card"><span class="ico-badge">' + L.icon('pdf') + '</span>' +
          '<div class="grow" style="min-width:0"><div style="font-weight:600" class="ellipsis">' + L.esc(file.name) + '</div>' +
          '<div class="muted tiny">Original: ' + L.fmtBytes(file.size) + '</div></div></div>' +
          '<button class="btn block mt" id="cp-go">' + L.icon('wand') + ' Compress</button>';
        L.$('#cp-go', root).onclick = function () {
          var PDFLib = pdfLib(); if (!PDFLib) return L.toast('PDF library unavailable', 'err');
          L.busy(true);
          L.readArrayBuffer(file).then(function (buf) { return PDFLib.PDFDocument.load(buf, { ignoreEncryption: true, updateMetadata: false }); })
            .then(function (doc) { return doc.save({ useObjectStreams: true, addDefaultPage: false }); })
            .then(function (bytes) {
              L.busy(false);
              var saved = file.size - bytes.byteLength;
              L.$('#cp-info', root).innerHTML = '<div class="card"><div class="row between"><span class="muted sm">Original</span><b>' + L.fmtBytes(file.size) + '</b></div>' +
                '<div class="row between mt"><span class="muted sm">Optimised</span><b>' + L.fmtBytes(bytes.byteLength) + '</b></div>' +
                '<div class="divider"></div><div class="center ' + (saved > 0 ? '' : 'muted') + ' sm">' +
                (saved > 0 ? 'Saved ' + L.fmtBytes(saved) + ' (' + Math.round(saved / file.size * 100) + '% smaller)' : 'This PDF is already optimised \u2014 it could not be made smaller.') + '</div>' +
                '<button class="btn block mt" id="cp-save">' + L.icon('download') + ' Save optimised PDF</button></div>';
              L.$('#cp-save', root).onclick = function () { L.saveBlob(new Blob([bytes], { type: 'application/pdf' }), file.name.replace(/\.pdf$/i, '') + '-optimised.pdf'); };
            })
            .catch(function (e) { L.busy(false); L.toast('Failed: ' + e.message, 'err'); });
        };
      });
    };
  }
});

/* ---------------- 6 & 7. Image Compressor / Resizer (Canvas) ---------------- */
function imageTool(root, mode) {
  var resize = mode === 'tool-img-resize';
  L.toolShell(root, resize ? 'Image Resizer' : 'Image Compressor',
    resize ? 'Change width and height, then export' : 'Reduce file size with a quality slider',
    '<div class="card"><button class="btn block" id="im-pick">' + L.icon('image') + ' Choose an image</button>' +
    '<div id="im-controls"></div><p class="muted tiny mt">Processing happens on this device using Canvas. Your image is never uploaded.</p></div>');
  L.$('#im-pick', root).onclick = function () {
    L.pickFiles('image/*', false).then(function (picked) {
      if (!picked.length) return;
      var file = picked[0];
      L.readDataURL(file).then(function (u) { return L.loadImage(u); }).then(function (img) {
        var c = L.$('#im-controls', root);
        if (resize) {
          c.innerHTML = '<span class="lbl">Width (px)</span><input class="field" id="im-w" type="number" min="1" max="12000" value="' + img.naturalWidth + '">' +
            '<span class="lbl">Height (px)</span><input class="field" id="im-h" type="number" min="1" max="12000" value="' + img.naturalHeight + '">' +
            '<div class="row between" style="margin:2px 2px 14px"><span class="sm muted">Keep aspect ratio</span><span class="switch on" id="im-ratio"><i></i></span></div>';
          var keep = true;
          L.$('#im-ratio', root).onclick = function () { keep = !keep; L.$('#im-ratio', root).classList.toggle('on', keep); };
          var go = L.h('<button class="btn block" id="im-go">' + L.icon('download') + ' Resize &amp; Save</button>');
          c.appendChild(go);
          go.onclick = function () {
            var w = Math.max(1, Math.min(12000, +L.$('#im-w', root).value || 1));
            var h = Math.max(1, Math.min(12000, +L.$('#im-h', root).value || 1));
            if (keep) { var ratio = img.naturalWidth / img.naturalHeight; if (w / img.naturalWidth < h / img.naturalHeight) h = Math.round(w / ratio); else w = Math.round(h * ratio); }
            draw(img, w, h, 0.92, file.name, '-resized');
          };
        } else {
          c.innerHTML = '<span class="lbl">JPEG quality <span id="im-qv">75%</span></span><input class="field" id="im-q" type="range" min="20" max="95" value="75">';
          L.$('#im-q', root).oninput = function (e) { L.$('#im-qv', root).textContent = e.target.value + '%'; };
          var go2 = L.h('<button class="btn block" id="im-go">' + L.icon('download') + ' Compress &amp; Save</button>');
          c.appendChild(go2);
          go2.onclick = function () { draw(img, img.naturalWidth, img.naturalHeight, (+L.$('#im-q', root).value) / 100, file.name, '-compressed'); };
        }
      }).catch(function () { L.toast('Could not read that image', 'err'); });
    });
  };
  function draw(img, w, h, q, name, suffix) {
    var canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
    canvas.toBlob(function (blob) {
      if (!blob) return L.toast('Could not process this image', 'err');
      L.saveBlob(blob, name.replace(/\.[^.]+$/, '') + suffix + '.jpg');
      L.toast('Image ready', 'ok');
    }, 'image/jpeg', q);
  }
}
L.register('tool-img-compress', { title: 'Image Compressor', sub: 'Smaller image files', render: function (root) { imageTool(root, 'tool-img-compress'); } });
L.register('tool-img-resize', { title: 'Image Resizer', sub: 'Change dimensions', render: function (root) { imageTool(root, 'tool-img-resize'); } });

/* ---------------- 8. QR Scanner (jsQR + camera) ---------------- */
L.register('tool-qr-scan', {
  title: 'QR Scanner', sub: 'Scan a QR code',
  render: function (root) {
    L.toolShell(root, 'QR Scanner', 'Point the camera at a QR code',
      '<div class="card">' +
        '<div style="position:relative">' +
          '<video class="qr" id="qs-video" playsinline muted></video>' +
          '<div style="position:absolute;inset:16%;border:3px solid var(--lime);border-radius:20px;box-shadow:0 0 0 100vmax rgba(0,0,0,.35);pointer-events:none"></div>' +
        '</div>' +
        '<button class="btn block mt" id="qs-start">' + L.icon('camera') + ' Start camera</button>' +
        '<button class="btn ghost block mt hide" id="qs-stop">Stop</button>' +
        '<div id="qs-result" class="mt"></div>' +
        '<p class="muted tiny mt">LifeOS asks for camera access only while this screen is open.</p>' +
      '</div>');
    var video = L.$('#qs-video', root), stream = null, raf = null;
    var canvas = document.createElement('canvas'), ctx = canvas.getContext('2d', { willReadFrequently: true });
    function stop() {
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
      if (root.querySelector('#qs-stop')) { L.$('#qs-stop', root).classList.add('hide'); L.$('#qs-start', root).classList.remove('hide'); }
    }
    L._cleanup = stop;
    function show(data) {
      var isUrl = /^https?:\/\//i.test(data);
      L.$('#qs-result', root).innerHTML = '<div class="divider"></div><span class="lbl">Scanned content</span>' +
        '<div class="card raised" style="word-break:break-all;font-weight:600">' + L.esc(data) + '</div>' +
        '<div class="row mt" style="gap:10px"><button class="btn ghost grow sm" id="qs-copy">Copy</button>' +
        (isUrl ? '<button class="btn grow sm" id="qs-open">Open link</button>' : '') + '</div>';
      L.$('#qs-copy', root).onclick = function () { if (navigator.clipboard) navigator.clipboard.writeText(data); L.toast('Copied', 'ok'); };
      if (isUrl) L.$('#qs-open', root).onclick = function () { window.open(data, '_blank'); };
    }
    function tick() {
      if (!stream) return;
      if (video.readyState === video.HAVE_ENOUGH_DATA && window.jsQR) {
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        var d = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var code = window.jsQR(d.data, d.width, d.height, { inversionAttempts: 'dontInvert' });
        if (code && code.data) { show(code.data); stop(); return; }
      }
      raf = requestAnimationFrame(tick);
    }
    L.$('#qs-start', root).onclick = function () {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return L.toast('Camera is not available here', 'err');
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(function (s) {
        stream = s; video.srcObject = s; return video.play();
      }).then(function () {
        L.$('#qs-stop', root).classList.remove('hide'); L.$('#qs-start', root).classList.add('hide');
        raf = requestAnimationFrame(tick);
      }).catch(function (e) { L.toast('Camera unavailable: ' + (e.message || e.name), 'err'); });
    };
    L.$('#qs-stop', root).onclick = stop;
  }
});

/* ---------------- 9. QR Generator ---------------- */
L.register('tool-qr-gen', {
  title: 'QR Generator', sub: 'Create a QR code',
  render: function (root) {
    L.toolShell(root, 'QR Generator', 'Create a QR code from any text or link',
      '<div class="card"><textarea class="field" id="qg-text" style="min-height:90px" placeholder="Text or URL\u2026"></textarea>' +
      '<button class="btn block" id="qg-go">' + L.icon('qr') + ' Generate</button>' +
      '<div id="qg-out" class="center mt"></div></div>');
    var blob = null;
    L.$('#qg-go', root).onclick = function () {
      var text = L.$('#qg-text', root).value.trim(); if (!text) return L.toast('Enter text or a link');
      if (!window.QRCodeLib) return L.toast('QR library unavailable', 'err');
      var canvas = document.createElement('canvas');
      window.QRCodeLib.toCanvas(canvas, text, { width: 260, margin: 2, color: { dark: '#0A0B00', light: '#FFFFFF' } })
        .then(function () {
          var url = canvas.toDataURL('image/png');
          L.$('#qg-out', root).innerHTML = '<img class="qr" src="' + url + '" alt="QR code">' +
            '<div class="row mt" style="gap:10px"><button class="btn ghost grow sm" id="qg-dl">' + L.icon('download') + ' Save</button>' +
            '<button class="btn grow sm" id="qg-sh">' + L.icon('share') + ' Share</button></div>';
          canvas.toBlob(function (b) { blob = b; }, 'image/png');
          L.$('#qg-dl', root).onclick = function () { if (blob) L.saveBlob(blob, 'qrcode.png'); };
          L.$('#qg-sh', root).onclick = function () { if (blob) L.shareBlob(blob, 'qrcode.png'); };
          L.toast('QR generated', 'ok');
        })
        .catch(function (e) { L.toast('Failed: ' + e.message, 'err'); });
    };
  }
});

/* ---------------- 10. Unit Converter ---------------- */
L.register('tool-unit-convert', {
  title: 'Unit Converter', sub: 'Length, mass, temperature',
  render: function (root) {
    L.toolShell(root, 'Unit Converter', 'Convert length, weight and temperature',
      '<div class="card">' +
      '<select class="field" id="uc-type"><option value="length">Length</option><option value="mass">Mass / weight</option><option value="temp">Temperature</option></select>' +
      '<div class="row" style="gap:10px"><input class="field grow" id="uc-val" type="number" value="1" style="margin:0">' +
      '<select class="field grow" id="uc-from" style="margin:0"></select></div>' +
      '<span class="lbl">Convert to</span><select class="field" id="uc-to"></select>' +
      '<div class="card flat"><span class="lbl" style="margin-top:0">Result</span><div id="uc-out" style="font-size:28px;font-weight:820;letter-spacing:-1px;overflow-wrap:anywhere">\u2014</div></div>' +
      '</div>');
    var sets = {
      length: { m: 1, km: 1000, cm: .01, mm: .001, mi: 1609.344, ft: .3048, in: .0254 },
      mass: { kg: 1, g: .001, mg: .000001, lb: .45359237, oz: .028349523125 },
      temp: { C: 1, F: 1, K: 1 }
    };
    var labels = { m: 'Meters', km: 'Kilometers', cm: 'Centimeters', mm: 'Millimeters', mi: 'Miles', ft: 'Feet', in: 'Inches', kg: 'Kilograms', g: 'Grams', mg: 'Milligrams', lb: 'Pounds', oz: 'Ounces', C: 'Celsius', F: 'Fahrenheit', K: 'Kelvin' };
    function opts() {
      var type = L.$('#uc-type', root).value, keys = Object.keys(sets[type]);
      L.$('#uc-from', root).innerHTML = keys.map(function (k) { return '<option value="' + k + '">' + labels[k] + '</option>'; }).join('');
      L.$('#uc-to', root).innerHTML = keys.map(function (k) { return '<option value="' + k + '">' + labels[k] + '</option>'; }).join('');
      L.$('#uc-to', root).value = type === 'length' ? 'cm' : type === 'mass' ? 'g' : 'F';
      calc();
    }
    function toC(v, u) { return u === 'C' ? v : u === 'F' ? (v - 32) * 5 / 9 : v - 273.15; }
    function fromC(v, u) { return u === 'C' ? v : u === 'F' ? v * 9 / 5 + 32 : v + 273.15; }
    function calc() {
      var v = Number(L.$('#uc-val', root).value), a = L.$('#uc-from', root).value, b = L.$('#uc-to', root).value, type = L.$('#uc-type', root).value;
      var r;
      if (!Number.isFinite(v)) r = 'Enter a number';
      else if (type === 'temp') r = fromC(toC(v, a), b);
      else r = v * sets[type][a] / sets[type][b];
      L.$('#uc-out', root).textContent = (typeof r === 'number') ? Number(r.toPrecision(8)).toString() + ' ' + labels[b] : r;
    }
    L.$('#uc-type', root).onchange = opts;
    ['uc-val', 'uc-from', 'uc-to'].forEach(function (id) { L.$('#' + id, root).oninput = calc; L.$('#' + id, root).onchange = calc; });
    opts();
  }
});

/* ---------------- 11. Stopwatch ---------------- */
var sw = { t: null, start: 0, elapsed: 0, laps: [] };
function fmtSw(ms) {
  ms = Math.max(0, Math.floor(ms));
  var h = Math.floor(ms / 3600000), m = Math.floor(ms % 3600000 / 60000), s = Math.floor(ms % 60000 / 1000), cs = Math.floor(ms % 1000 / 10);
  return L.pad(h) + ':' + L.pad(m) + ':' + L.pad(s) + '.' + L.pad(cs);
}
L.register('tool-stopwatch', {
  title: 'Stopwatch', sub: 'Track elapsed time',
  render: function (root) {
    sw.t = null; sw.elapsed = 0; sw.laps = [];
    L.toolShell(root, 'Stopwatch', 'Track elapsed time with laps',
      '<div class="card"><div id="sw-d" class="mono" style="font-size:clamp(30px,10vw,46px);text-align:center;padding:22px 0">00:00:00.00</div>' +
      '<div class="row" style="gap:10px"><button class="btn grow" id="sw-go">' + L.icon('play') + ' Start</button>' +
      '<button class="btn ghost" id="sw-lap">' + L.icon('flag') + '</button>' +
      '<button class="btn ghost" id="sw-reset">' + L.icon('reset') + '</button></div>' +
      '<div class="list mt" id="sw-laps"></div></div>');
    function paintLaps() {
      L.$('#sw-laps', root).innerHTML = sw.laps.map(function (l, i) {
        return '<div class="item-card"><span class="pill">#' + (i + 1) + '</span><div class="grow mono" style="font-weight:600">' + fmtSw(l) + '</div></div>';
      }).join('');
    }
    function stopTicker() { if (sw.t) { clearInterval(sw.t); sw.t = null; } }
    L._cleanup = stopTicker;
    function render2() { L.$('#sw-d', root).textContent = fmtSw(sw.elapsed + (sw.t ? performance.now() - sw.start : 0)); }
    L.$('#sw-go', root).onclick = function () {
      if (sw.t) { stopTicker(); sw.elapsed += performance.now() - sw.start; L.$('#sw-go', root).innerHTML = L.icon('play') + ' Resume'; }
      else { sw.start = performance.now(); sw.t = setInterval(render2, 40); L.$('#sw-go', root).innerHTML = L.icon('pause') + ' Pause'; }
    };
    L.$('#sw-lap', root).onclick = function () { sw.laps.push(sw.elapsed + (sw.t ? performance.now() - sw.start : 0)); paintLaps(); };
    L.$('#sw-reset', root).onclick = function () { stopTicker(); sw.elapsed = 0; sw.laps = []; render2(); paintLaps(); L.$('#sw-go', root).innerHTML = L.icon('play') + ' Start'; };
    render2();
  }
});

/* ---------------- 12. Countdown Timer ---------------- */
var cd = { t: null, end: 0, remain: 0 };
function beep() {
  try {
    var Ctx = window.AudioContext || window.webkitAudioContext; if (!Ctx) return;
    var ac = new Ctx(), o = ac.createOscillator(), g = ac.createGain();
    o.connect(g); g.connect(ac.destination); o.type = 'sine'; o.frequency.value = 880;
    g.gain.setValueAtTime(0.001, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.25, ac.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.9);
    o.start(); o.stop(ac.currentTime + 0.95);
  } catch (e) { }
}
L.register('tool-timer', {
  title: 'Countdown Timer', sub: 'Count down to zero',
  render: function (root) {
    cd.t = null; cd.remain = 0;
    L.toolShell(root, 'Countdown Timer', 'Set a duration and count down',
      '<div class="card"><div class="row" style="gap:10px"><div class="grow"><span class="lbl">Minutes</span><input class="field" id="cd-m" type="number" min="0" max="999" value="5"></div>' +
      '<div class="grow"><span class="lbl">Seconds</span><input class="field" id="cd-s" type="number" min="0" max="59" value="0"></div></div>' +
      '<div id="cd-d" class="mono" style="font-size:clamp(36px,13vw,56px);text-align:center;padding:18px 0">05:00</div>' +
      '<div class="row" style="gap:10px"><button class="btn grow" id="cd-go">' + L.icon('play') + ' Start</button>' +
      '<button class="btn ghost" id="cd-reset">' + L.icon('reset') + ' Reset</button></div></div>');
    function readInputs() { return Math.max(0, +L.$('#cd-m', root).value || 0) * 60000 + Math.min(59, Math.max(0, +L.$('#cd-s', root).value || 0)) * 1000; }
    function draw() { var s = Math.ceil(cd.remain / 1000); L.$('#cd-d', root).textContent = L.pad(Math.floor(s / 60)) + ':' + L.pad(s % 60); }
    function stopTicker() { if (cd.t) { clearInterval(cd.t); cd.t = null; } }
    L._cleanup = stopTicker;
    L.$('#cd-go', root).onclick = function () {
      if (cd.t) { stopTicker(); L.$('#cd-go', root).innerHTML = L.icon('play') + ' Resume'; return; }
      if (cd.remain <= 0) cd.remain = readInputs();
      if (cd.remain <= 0) return L.toast('Set a time greater than zero');
      cd.end = Date.now() + cd.remain;
      L.$('#cd-go', root).innerHTML = L.icon('pause') + ' Pause';
      cd.t = setInterval(function () {
        cd.remain = cd.end - Date.now(); draw();
        if (cd.remain <= 0) { stopTicker(); cd.remain = 0; draw(); L.$('#cd-go', root).innerHTML = L.icon('play') + ' Start'; beep(); L.notify('Timer finished', 'Your countdown has ended'); L.toast('Time\u2019s up', 'ok'); }
      }, 100);
    };
    L.$('#cd-reset', root).onclick = function () { stopTicker(); cd.remain = readInputs(); draw(); L.$('#cd-go', root).innerHTML = L.icon('play') + ' Start'; };
    draw();
  }
});

/* ==========================================================================
   Boot — run after every screen/tool has registered
   ========================================================================== */
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', L.boot);
else L.boot();
