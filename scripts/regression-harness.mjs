import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const read = p => fs.readFileSync(p, 'utf8');
const fail = m => { console.error('HARNESS FAIL:', m); process.exitCode = 1; };
const ok = m => console.log('HARNESS OK:', m);

const shared = JSON.parse(read('shared-data/sales-history.json'));
const uploads = Array.isArray(shared.uploads) ? shared.uploads : [];
const sources = Array.isArray(shared.sourceFiles) ? shared.sourceFiles : [];

if (!uploads.length) fail('shared uploads is empty');
if (!sources.length) fail('sourceFiles is empty');

const byMonth = new Map();
for (const r of uploads) {
  const d = String(r.d ?? r.date ?? '');
  const a = Number(r.a ?? r.amount);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) fail('invalid upload date: ' + d);
  if (!Number.isFinite(a)) fail('invalid amount at ' + d);
  const month = d.slice(0, 7);
  if (!byMonth.has(month)) byMonth.set(month, {dates:new Set(), total:0});
  const x = byMonth.get(month);
  x.dates.add(d);
  x.total += a;
}

for (const src of sources) {
  const month = src.month;
  const x = byMonth.get(month);
  if (!x) { fail('source month missing in uploads: ' + month); continue; }
  const dates = [...x.dates].sort();
  const last = dates.at(-1) || '';
  if (last !== (src.lastDate || src.date)) fail(month + ' latest date mismatch: uploads=' + last + ' source=' + (src.lastDate || src.date));
  if (dates.length !== Number(src.dateCount)) fail(month + ' dateCount mismatch: uploads=' + dates.length + ' source=' + src.dateCount);
  if (Math.abs(x.total - Number(src.total || 0)) > 0.5) fail(month + ' total mismatch: uploads=' + x.total + ' source=' + src.total);
}

const latestUpload = uploads.map(r => String(r.d ?? r.date ?? '')).filter(Boolean).sort().at(-1) || '';
const latestSource = sources.map(r => String(r.lastDate || r.date || '')).filter(Boolean).sort().at(-1) || '';
if (latestUpload !== latestSource) fail('latest shared date mismatch: uploads=' + latestUpload + ' sourceFiles=' + latestSource);
else ok('latest shared date ' + latestUpload);

const index = read('index.html');
const v16 = read('v16.js');
const bootstrap = read('bootstrap-v36.js');
const exportLoader = read('export-v19.js');
const unifiedLoader = read('unified-loader-v74.js');

const m = index.match(/v16\.js\?v=(\d+)/);
if (!m) fail('index runtime version not found');
const version = m?.[1] || '';
const required = [
  ['index bootstrap', index, new RegExp('bootstrap-v36\\.js\\?v=' + version)],
  ['index export', index, new RegExp('export-v19\\.js\\?v=' + version)],
  ['v16 version', v16, new RegExp("const V='" + version + "'")],
  ['bootstrap legacy', bootstrap, new RegExp('v16-legacy\\.js\\?v=' + version)],
  ['bootstrap shared', bootstrap, new RegExp('shared-v31\\.js\\?v=' + version)],
  ['bootstrap upload', bootstrap, new RegExp('master-upload-v34\\.js\\?v=' + version)],
  ['export loader version', exportLoader, new RegExp("const V='" + version + "'")],
  ['unified final version', unifiedLoader, new RegExp('unified-final-v73\\.js\\?v=' + version)]
];
for (const [name, text, re] of required) {
  if (!re.test(text)) fail(name + ' is not aligned to v' + version);
}
ok('runtime asset version v' + version + ' aligned');

if (!bootstrap.includes("cache:'no-store'")) fail('shared bootstrap fetch must use no-store');
if (!bootstrap.includes("?t='+Date.now()")) fail('shared bootstrap fetch must use cache-busting timestamp');
ok('shared data fetch cache guards present');


const unifiedFinal = read('unified-final-v73.js');
const exportV21 = read('export-v21.js');
const vendorExcel = read('vendor-excel-format-v48.js');
const vendorGap = read('vendor-mbo-gap-v43.js');
const vendorClose = read('vendor-close-ui-v67.js');

for (const [name, text] of [
  ['unified-final-v73.js', unifiedFinal],
  ['export-v21.js', exportV21],
  ['vendor-excel-format-v48.js', vendorExcel],
  ['vendor-mbo-gap-v43.js', vendorGap],
  ['vendor-close-ui-v67.js', vendorClose]
]) {
  if (!text.includes('window.__SF_SHARED_CLOSED')) fail(name + ' must consume shared closedVendors state');
}
if (!unifiedFinal.includes('isClosed=closed.has(k),add=isClosed?0')) fail('product-group UI must force closed vendor need to zero');
for (const [name, text] of [['export-v21.js', exportV21], ['vendor-excel-format-v48.js', vendorExcel]]) {
  if (!text.includes('open=KEY.filter(v=>!closed.has(v))')) fail(name + ' must allocate product-group need only to open vendors');
  if (!text.includes('KEY.forEach(v=>gap[v]=0)')) fail(name + ' must initialize every managed vendor need to zero');
}
ok('closed vendor product-group MBO exclusion guards present');

const testKey = ['A','B','C'];
const testAvg = {A:50,B:30,C:20};
const testClosed = new Set(['B']);
const testNeed = 100;
const open = testKey.filter(v=>!testClosed.has(v));
const testGap = Object.fromEntries(testKey.map(v=>[v,0]));
const openAvg = open.reduce((s,v)=>s+testAvg[v],0);
let remain = testNeed;
open.forEach((v,i)=>{
  const share = openAvg ? testAvg[v]/openAvg : 1/open.length;
  const add = i===open.length-1 ? remain : Math.round(testNeed*share);
  testGap[v]=add;
  if(i!==open.length-1) remain-=add;
});
if (testGap.B !== 0) fail('closed vendor regression model allocated product-group need');
if (open.reduce((s,v)=>s+testGap[v],0) !== testNeed) fail('open vendor product-group need no longer reconciles to total need');
ok('closed vendor allocation regression model');


const runtimeJs = [
  'v16.js','bootstrap-v36.js','v16-legacy.js','shared-v31.js','master-upload-v34.js',
  'upper-history-v39.js','vendor-mbo-gap-v43.js','vendor-close-ui-v67.js',
  'export-v19.js','export-v21.js','ui-streamline-v46.js','detail-shell-v61.js',
  'final-layout-v53.js','unified-loader-v74.js','unified-final-v73.js',
  'group-info-no-mbo-v82.js','group-no-mbo-final-v87.js','vendor-excel-format-v48.js'
];
for (const file of runtimeJs) {
  try {
    execFileSync(process.execPath, ['--check', file], {stdio:'pipe'});
  } catch (e) {
    fail(file + ' JavaScript syntax check failed: ' + String(e.stderr || e.message).trim());
  }
  if (read(file).includes('\\nfunction')) fail(file + ' contains a literal \\n before function declaration');
}
ok('runtime JavaScript syntax checks');

const currentMonth = latestUpload.slice(0,7);
const currentRows = uploads.filter(r => String(r.d ?? r.date ?? '').slice(0,7) === currentMonth);
const skuNames = new Set(currentRows.map(r => String(r.m ?? r.material ?? '')).filter(Boolean));
if (!skuNames.size) fail('current month has no SKU/material data for drilldown');
else ok('current month SKU data available: ' + skuNames.size);

const legacy = read('v16-legacy.js');
const upperHistory = read('upper-history-v39.js');
const detailShell = read('detail-shell-v61.js');
const unified = read('unified-final-v73.js');
if (!legacy.includes('if(window.__SF_UNIFIED_FINAL_ACTIVE)return')) fail('legacy product-group renderer is not gated by unified renderer');
if (!upperHistory.includes('if(!window.__SF_UNIFIED_FINAL_ACTIVE)renderGroup()')) fail('upper-history can still overwrite unified product-group table');
if (!upperHistory.includes('sf-vendor-scope-change')) fail('vendor scope handoff event is missing');
if (!unified.includes('window.__SF_UNIFIED_FINAL_ACTIVE=true')) fail('unified renderer activation flag is missing');
if (!unified.includes("window.addEventListener('sf-vendor-scope-change'")) fail('unified renderer does not consume vendor scope handoff');
if (!unified.includes("window.addEventListener('sf-detail-shell-ready'")) fail('SKU renderer does not recover when detail shell becomes ready');
if (!detailShell.includes("window.dispatchEvent(new Event('sf-detail-shell-ready'))")) fail('detail shell ready event is missing');
if (!detailShell.includes("r.d?.slice(0,7)<=m")) fail('SKU product-group options are limited to current month instead of comparison history');
for (const label of ['확정월 평균','진행월 현재','직전월 대비 현재 증감','확정월 평균 대비 현재 증감','확정월 평균 대비 현재 매출율','업체 목표','추가 필요']) {
  if (!unified.includes(label)) fail('unified product-group MBO table missing column: ' + label);
}
ok('unified product-group MBO and SKU drilldown guards present');

if (process.exitCode) process.exit(process.exitCode);
console.log('HARNESS PASS');
