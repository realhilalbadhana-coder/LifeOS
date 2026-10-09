/* Exercises the Canvas image tools + QR generator with a REAL canvas backend
   (@napi-rs/canvas) in jsdom, and decodes the generated QR with jsQR. */
const { JSDOM, VirtualConsole } = require('jsdom');
const path = require('path');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const { INDEX, WWW, reporter } = require('./helpers');
const { ok, finish } = reporter('canvas/qr');
const jsQR = require(path.join(WWW, 'vendor/jsQR.js'));
const sleep = ms => new Promise(r => setTimeout(r, ms));

const vc = new VirtualConsole();
vc.on('jsdomError', e => { const m = '' + (e && e.message); if (m.indexOf('scrollTo') < 0 && m.indexOf('getContext') < 0) console.log('  (page) ' + m); });

function canvasShim(window) {
  const proto = window.HTMLCanvasElement.prototype;
  Object.defineProperty(proto, 'width', { configurable: true, get() { return this.__w == null ? 300 : this.__w; }, set(v) { this.__w = v | 0; if (this.__c) this.__c.width = this.__w; } });
  Object.defineProperty(proto, 'height', { configurable: true, get() { return this.__h == null ? 150 : this.__h; }, set(v) { this.__h = v | 0; if (this.__c) this.__c.height = this.__h; } });
  proto.getContext = function (type) {
    if (!this.__c) this.__c = createCanvas(this.width, this.height);
    this.__c.width = this.width; this.__c.height = this.height;
    return this.__c.getContext(type === 'webgl' ? '2d' : type);
  };
  proto.toBlob = function (cb, type, q) {
    if (!this.__c) this.getContext('2d');
    const fmt = (type && type.indexOf('png') >= 0) ? 'image/png' : 'image/jpeg';
    const buf = this.__c.toBuffer(fmt, q);
    const b = new window.Blob([new Uint8Array(buf)], { type: type || 'image/jpeg' });
    b.__buf = buf; cb(b);
  };
  proto.toDataURL = function (type) { if (!this.__c) this.getContext('2d'); return this.__c.toDataURL(type || 'image/png'); };
}

async function decodeQr(buf) {
  const img = await loadImage(Buffer.from(buf));
  const c = createCanvas(img.width, img.height);
  const cx = c.getContext('2d'); cx.drawImage(img, 0, 0);
  const d = cx.getImageData(0, 0, c.width, c.height);
  return jsQR(new Uint8ClampedArray(d.data), d.width, d.height, { inversionAttempts: 'attemptBoth' });
}

JSDOM.fromFile(INDEX, {
  runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
  beforeParse(window) {
    const { TextEncoder, TextDecoder } = require('util');
    window.TextEncoder = TextEncoder; window.TextDecoder = TextDecoder;
    canvasShim(window);
  },
}).then(dom => new Promise(res => dom.window.addEventListener('load', () => setTimeout(() => res(dom.window), 300))))
  .then(async window => {
    const L = window.L, doc = window.document;
    const src = createCanvas(400, 300);
    const sc = src.getContext('2d'); sc.fillStyle = '#d6ff3f'; sc.fillRect(0, 0, 400, 300); sc.fillStyle = '#0a0b00'; sc.fillRect(50, 50, 120, 120);
    const srcPng = src.toDataURL('image/png');

    L.pickFiles = () => Promise.resolve([{ name: 'photo.png', size: 1234 }]);
    L.readDataURL = () => Promise.resolve(srcPng);
    L.loadImage = async () => { const c = createCanvas(400, 300); c.getContext('2d').drawImage(src, 0, 0); c.naturalWidth = 400; c.naturalHeight = 300; return c; };
    let saved = null; L.saveBlob = (blob, name) => { saved = { blob, name }; };

    L.go('tool-img-resize');
    doc.getElementById('im-pick').click(); await sleep(120);
    doc.getElementById('im-w').value = '200'; doc.getElementById('im-h').value = '200';
    doc.getElementById('im-go').click(); await sleep(200);
    if (saved) {
      const img = await loadImage(Buffer.from(saved.blob.__buf));
      ok('Image Resizer -> real JPEG at requested size', saved.name.endsWith('-resized.jpg') && img.width === 200 && img.height === 150,
        saved.name + ' ' + img.width + 'x' + img.height + ' ' + saved.blob.size + 'B');
    } else ok('Image Resizer -> real JPEG', false, 'no output');

    saved = null;
    L.go('tool-img-compress');
    doc.getElementById('im-pick').click(); await sleep(120);
    doc.getElementById('im-q').value = '30'; doc.getElementById('im-go').click(); await sleep(200);
    if (saved) {
      const img = await loadImage(Buffer.from(saved.blob.__buf));
      ok('Image Compressor -> real full-size JPEG', saved.name.endsWith('-compressed.jpg') && img.width === 400 && img.height === 300,
        saved.name + ' ' + img.width + 'x' + img.height + ' ' + saved.blob.size + 'B');
    } else ok('Image Compressor -> real JPEG', false, 'no output');

    saved = null;
    const QR_TEXT = 'https://example.com/lifeos?ok=1';
    L.go('tool-qr-gen');
    doc.getElementById('qg-text').value = QR_TEXT;
    doc.getElementById('qg-go').click(); await sleep(600);
    const dl = doc.getElementById('qg-dl'); if (dl) dl.click(); await sleep(200);
    if (saved) {
      const img = await loadImage(Buffer.from(saved.blob.__buf));
      ok('QR Generator -> real square PNG', saved.name === 'qrcode.png' && img.width === img.height && img.width >= 200,
        saved.name + ' ' + img.width + 'x' + img.height + ' ' + saved.blob.size + 'B');
      const code = await decodeQr(saved.blob.__buf);
      ok('QR decodes back to the exact input text', !!code && code.data === QR_TEXT, code ? code.data : 'no decode');
    } else ok('QR Generator -> real PNG', false, 'no output');

    finish();
  }).catch(e => { console.error('CRASH', e); process.exit(2); });
