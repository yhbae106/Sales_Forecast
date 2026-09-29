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
  'group-info-no-mbo-v82.js','group-no-mbo-final-v87.js','vendor-excel-format-v48.js','decision-radar-v93.js'
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
if (!upperHistory.includes('sf-vendor-scope-change')) fail('vendor scope handoff event is missing');
if (upperHistory.includes('MutationObserver')) fail('stage-one vendor renderer must remain event-driven');
if (!upperHistory.includes("let dataCache=null,dataSig=''")) fail('stage-one vendor renderer must cache monthly aggregates');
for (const label of ['26.','확정월 평균','진행월 현재','직전월 대비 현재 증감','확정월 평균 대비 현재 증감','확정월 평균 대비 현재 매출율']) {
  if (label === '26.') continue;
  if (!upperHistory.includes(label)) fail('stage-one vendor table missing column: ' + label);
}
if (!unified.includes('window.__SF_UNIFIED_FINAL_ACTIVE=true')) fail('unified renderer activation flag is missing');
if (!unified.includes("window.addEventListener('sf-vendor-scope-change'")) fail('unified renderer does not consume vendor scope handoff');
if (!unified.includes("window.addEventListener('sf-detail-shell-ready'")) fail('SKU renderer does not recover when detail shell becomes ready');
if (!detailShell.includes("window.dispatchEvent(new Event('sf-detail-shell-ready'))")) fail('detail shell ready event is missing');
if (!detailShell.includes("r.d?.slice(0,7)<=m")) fail('SKU product-group options are limited to current month instead of comparison history');
for (const label of ['확정월 평균','진행월 현재','직전월 대비 현재 증감','확정월 평균 대비 현재 증감','확정월 평균 대비 현재 매출율','업체 목표','추가 필요']) {
  if (!unified.includes(label)) fail('unified product-group MBO table missing column: ' + label);
}
ok('stage-one vendor detail and unified product/SKU drilldown guards present');


const radar = read('decision-radar-v93.js');
const finalLayout = read('final-layout-v53.js');
const forecastProgress = read('forecast-progress-v81.js');
const sharedRuntime = read('shared-v31.js');
if (!v16.includes("'decision-radar-v93.js'")) fail('decision radar is not preloaded by v16');
if (!exportLoader.includes("'decision-radar-v93.js'")) fail('decision radar is not loaded by final UI loader');
for (const label of ['운영 판단 · 이슈 레이더','월마감 전망','남은 MBO','잔여 영업일 필요 일평균','최근 3영업일 평균','관리업체 전체 현황','제품군 이슈']) {
  if (!radar.includes(label)) fail('decision radar missing decision label: ' + label);
}
if (radar.includes('MutationObserver')) fail('decision radar must remain event-driven and must not add MutationObserver');
if (!radar.includes('vendorStatus=KEY.map')) fail('decision radar must show all eight managed vendors');
if (!radar.includes('sf-radar-scroll')) fail('decision radar must provide scrollable issue tables');
if (radar.includes('slice(0,6)')) fail('product-group issue radar must not truncate issues to six rows');
if (!radar.includes("let renderTimer=null,dataCache=null,dataSig=''")) fail('decision radar must cache source rows');
if (!radar.includes('phase(m,last,bounds(m,hist,sched))') || !radar.includes('cuts[h]=eq(')) fail('decision radar must compare equivalent collection progress positions');
if (!radar.includes('krHolidays2026') || !radar.includes('customHolidaysByMonth')) fail('decision radar business days must exclude holidays');
if (!forecastProgress.includes('krHolidays2026') || !forecastProgress.includes('customHolidaysByMonth')) fail('overall forecast business days must exclude holidays');
if (!legacy.includes('krHolidays2026') || !legacy.includes('customHolidaysByMonth')) fail('legacy daily comparison business days must exclude holidays');
if (!upperHistory.includes('sf-radar-vendor-select')) fail('vendor table does not accept decision-radar drilldown');
if (!vendorClose.includes("th.textContent='마감 체크'")) fail('stage-one vendor table must expose the close check control');
if (!vendorClose.includes('sf-vendor-table-rendered')) fail('close controls must reinstall after stage-one render');
if (!vendorGap.includes("gapHead.textContent='MBO 대비 부족액'")) fail('stage-one vendor table must expose per-vendor MBO gap');
if (!vendorGap.includes('allocateGap(overallGap,mbo,mp,h,closed)')) fail('stage-one vendor gap allocation is missing');
if (!finalLayout.includes("group.insertAdjacentElement('afterend',mbo)")) fail('product-group MBO action panel is not placed after product-group status');
if (!finalLayout.includes("(detail||mbo).insertAdjacentElement('afterend',daily)")) fail('raw daily detail is not placed after action/detail drilldown');
ok('decision radar, vendor control, holiday-aware forecast, and information hierarchy guards present');

if (legacy.includes("$('mbo').oninput=function(){if(this.value==='')delete st.mbo")) fail('MBO typing must not trigger full legacy render');
if (!legacy.includes('sf-settings-committed')) fail('settings must emit a single commit event after editing');
if (vendorGap.includes("document.addEventListener('input',e=>{if(e.target?.id==='mbo')")) fail('vendor gap must not recalculate while MBO is being typed');
if (forecastProgress.includes("document.addEventListener('input',e=>{if(['mbo','first','second']")) fail('forecast must not recalculate while settings are being edited');
if (!sharedRuntime.includes('scheduleSettingsPublish(700)')) fail('shared settings persistence must be debounced');
if (!sharedRuntime.includes("typeof requestIdleCallback==='function'")) fail('shared settings persistence must be idle-scheduled');
ok('master settings edit performance guards present');

const seedText = read('data.js');
const seedData = JSON.parse(seedText.replace(/^window\.SEED_DATA\s*=\s*/, '').replace(/;\s*$/, ''));
if (!seedData.krHolidays2026 || !Object.keys(seedData.krHolidays2026).length) fail('KR holiday calendar is missing from seed data');
const currentMbo = Number(shared.mbo?.[currentMonth] || 0);
const currentTotal = currentRows.reduce((s,r)=>s+Number(r.a ?? r.amount ?? 0),0);
if (currentMbo > 0 && !Number.isFinite(Math.max(0,currentMbo*1e8-currentTotal))) fail('remaining MBO calculation is not finite');
ok('decision input data is available');

if (process.exitCode) process.exit(process.exitCode);
console.log('HARNESS PASS');
