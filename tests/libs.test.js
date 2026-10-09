/* Direct tests of the vendored engines in Node (no browser needed). */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { WWW, reporter } = require('./helpers');
const { ok, finish } = reporter('libraries');

(async () => {
  const PDFLib = require(path.join(WWW, 'vendor/pdf-lib.min.js'));

  const a = await PDFLib.PDFDocument.create();
  a.addPage([300, 400]); a.addPage([300, 400]);
  const aBytes = await a.save();
  ok('pdf-lib create + save', aBytes.byteLength > 100, aBytes.byteLength + 'B');

  ok('pdf-lib reload page count = 2', (await PDFLib.PDFDocument.load(aBytes)).getPageCount() === 2);

  const merged = await PDFLib.PDFDocument.create();
  for (const src of [aBytes, aBytes]) {
    const s = await PDFLib.PDFDocument.load(src);
    (await merged.copyPages(s, s.getPageIndices())).forEach(p => merged.addPage(p));
  }
  ok('pdf-lib merge -> 4 pages', (await PDFLib.PDFDocument.load(await merged.save())).getPageCount() === 4);

  const split = await PDFLib.PDFDocument.create();
  const srcDoc = await PDFLib.PDFDocument.load(aBytes);
  (await split.copyPages(srcDoc, [1])).forEach(p => split.addPage(p));
  ok('pdf-lib split -> 1 page', (await PDFLib.PDFDocument.load(await split.save())).getPageCount() === 1);

  const jsQR = require(path.join(WWW, 'vendor/jsQR.js'));
  ok('jsQR exported as a function', typeof jsQR === 'function');

  const dom = new JSDOM('<!doctype html><body></body>', { runScripts: 'outside-only' });
  const { TextEncoder, TextDecoder } = require('util');
  dom.window.TextEncoder = TextEncoder; dom.window.TextDecoder = TextDecoder;
  dom.window.eval(fs.readFileSync(path.join(WWW, 'vendor/qrcode.min.js'), 'utf8'));
  let svg = dom.window.QRCodeLib.toString('https://example.com', { type: 'svg' });
  if (svg && typeof svg.then === 'function') svg = await svg;
  ok('qrcode -> svg string', typeof svg === 'string' && svg.indexOf('<svg') >= 0);

  finish();
})().catch(e => { console.error('CRASH', e); process.exit(2); });
