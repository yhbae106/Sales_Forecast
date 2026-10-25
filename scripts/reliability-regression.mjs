import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const R=require('../data-reliability.js');
const copy=value=>JSON.parse(JSON.stringify(value));
const row=(date='2026-10-20',amount=100,vendor='A')=>({d:date,v:vendor,g:'G',m:'SKU',a:amount});
const fixture=()=>({schemaVersion:6,updatedAt:'2026-10-21T01:00:00Z',uploads:[row()],sourceFiles:[{month:'2026-10',fileName:'261021.xlsx',lastDate:'2026-10-20',dateCount:1,total:100}],mbo:{'2026-10':250},gmbo:{},sched:{},closedVendors:{},uiText:{title:'Before'}});
let count=0;
async function test(name,run){await run();count++;console.log('RELIABILITY OK:',name);}
const pause=async()=>{};
await test('sales cutoff remains factual while upload date is a separate as-of basis',()=>{
  const shared=fixture();assert.equal(R.lastDataDate(shared),'2026-10-20');assert.equal(R.sourceAsOfDate(shared,'2026-10'),'2026-10-21');
  shared.updatedAt='2027-01-01T01:00:00Z';assert.equal(R.lastDataDate(shared),'2026-10-20');assert.equal(R.sourceAsOfDate(shared,'2026-10'),'2026-10-21');
  assert.deepEqual(R.monthSummary(shared,'2026-10'),{first:'2026-10-20',last:'2026-10-20',total:100,dateCount:1,rowCount:1});
});
await test('invalid amounts, impossible dates and historical month mismatch reject the whole source',()=>{
  R.validateShared(fixture());
  for(const amount of [null,'',NaN,Infinity,'not a number']){const shared=fixture();shared.uploads[0].a=amount;assert.throws(()=>R.validateShared(shared));}
  const badDate=fixture();badDate.uploads[0].d='2026-02-30';assert.throws(()=>R.validateShared(badDate));
  const historical=fixture();historical.uploads.push(row('2026-09-29',50));historical.sourceFiles.push({month:'2026-09',lastDate:'2026-09-29',total:51});assert.throws(()=>R.validateShared(historical),/누계 불일치/);
  const empty=fixture();empty.mbo={};assert.deepEqual(R.validateShared(empty).mbo,{});
});
await test('network and response-body timeouts abort requests with bounded completion',async()=>{
  let signal;
  await assert.rejects(R.requestJson('/never',{}, {timeoutMs:10,fetch:async(_url,init)=>{signal=init.signal;return new Promise(()=>{});}}),{name:'TimeoutError'});
  assert.equal(signal.aborted,true);
  await assert.rejects(R.requestJson('/slow-body',{}, {timeoutMs:10,fetch:async()=>({ok:true,json:()=>new Promise(()=>{})})}),{name:'TimeoutError'});
});
await test('explicit cancellation never accepts a late body and HTTP conflicts remain identifiable',async()=>{
  const controller=new AbortController();let release;
  const promise=R.requestJson('/cancel',{signal:controller.signal},{fetch:async()=>({ok:true,json:()=>new Promise(resolve=>{release=resolve})})});
  await Promise.resolve();controller.abort();await assert.rejects(promise,{name:'AbortError'});release({tooLate:true});
  await assert.rejects(R.requestJson('/conflict',{}, {fetch:async()=>({ok:false,status:409,json:async()=>({message:'conflict'})})}),error=>error.httpStatus===409);
});
await test('field patches retain unrelated edits, handle deletion and reject same-field conflicts',()=>{
  const base={mbo:{oct:250,sep:240},title:'A'},desired={mbo:{oct:255},title:'A'};
  const patch=R.changes(base,desired),latest={mbo:{oct:250,sep:240,nov:260},title:'B'};
  assert.deepEqual(R.applyChanges(latest,patch),{mbo:{oct:255,nov:260},title:'B'});
  assert.throws(()=>R.applyChanges({...latest,mbo:{oct:270,sep:240}},patch),/다른 사용자가 같은 설정/);
  assert.deepEqual(base,{mbo:{oct:250,sep:240},title:'A'});
});
await test('uploads only replace selected months and reject an intervening edit in those months',()=>{
  const base=fixture(),previous=fixture();previous.uploads.push(row('2026-09-29',70));previous.mbo['2026-10']=260;
  const sources=[{month:'2026-10',lastDate:'2026-10-20',dateCount:1,total:120}],payload={baseUploads:base.uploads,up:[row('2026-10-20',120)],mbo:{'2026-10':1}};
  const next=R.mergeUpload(previous,payload,sources);R.validateShared(next);
  assert.equal(next.mbo['2026-10'],260);assert.equal(R.monthSummary(next,'2026-09').total,70);assert.equal(R.monthSummary(next,'2026-10').total,120);
  const concurrent=copy(previous);concurrent.uploads[0].a=110;assert.throws(()=>R.mergeUpload(concurrent,payload,sources),/公用|공용 매출이 변경/);
});
await test('a failed authoritative read never produces a PUT and does not poison the write queue',async()=>{
  let reads=0,puts=0,stored=fixture();
  const writer=R.createWriter({readSnapshot:async()=>{if(++reads===1)throw new Error('offline');return{sha:'s1',data:stored};},putSnapshot:async({data})=>{puts++;stored=data;},readLatest:async()=>stored,pause});
  await assert.rejects(writer(s=>s,'failed'),/offline/);assert.equal(puts,0);
  await writer(s=>({...s,uiText:{title:'Saved'}}),'next');assert.equal(puts,1);assert.equal(stored.uiText.title,'Saved');
});
await test('all writes run serially and use a new authoritative snapshot for each mutation',async()=>{
  let stored=fixture(),revision=1;const history=[];
  const writer=R.createWriter({readSnapshot:async()=>{history.push('read'+revision);return{sha:String(revision),data:copy(stored)};},putSnapshot:async({sha,data})=>{assert.equal(sha,String(revision));history.push('put'+revision);stored=data;revision++;},readLatest:async()=>copy(stored),pause});
  await Promise.all([writer(s=>({...s,uiText:{title:'One'}}),'one'),writer(s=>({...s,mbo:{...s.mbo,'2026-11':260}}),'two')]);
  assert.deepEqual(history,['read1','put1','read2','put2']);assert.equal(stored.uiText.title,'One');assert.equal(stored.mbo['2026-11'],260);
});
await test('a 409 rebuilds from the new snapshot without discarding unrelated changes',async()=>{
  let stored=fixture(),puts=0,revision=1;const patch=R.changes(stored.uiText,{title:'Ours'});
  const writer=R.createWriter({readSnapshot:async()=>({sha:String(revision),data:copy(stored)}),putSnapshot:async({sha,data})=>{puts++;assert.equal(sha,String(revision));if(puts===1){stored.mbo['2026-11']=260;revision++;const error=new Error('conflict');error.httpStatus=409;throw error;}stored=data;},readLatest:async()=>stored,pause});
  const got=await writer(s=>({...s,uiText:R.applyChanges(s.uiText,patch)}),'conflict');assert.equal(puts,2);assert.equal(got.mbo['2026-11'],260);assert.equal(got.uiText.title,'Ours');
});
await test('conflicting edits to the same field cannot be replayed after a 409',async()=>{
  let stored=fixture(),puts=0;const patch=R.changes(stored.uiText,{title:'Ours'});
  const writer=R.createWriter({readSnapshot:async()=>({sha:'s',data:copy(stored)}),putSnapshot:async()=>{puts++;stored.uiText.title='Theirs';const e=new Error('conflict');e.httpStatus=409;throw e;},readLatest:async()=>stored,pause});
  await assert.rejects(writer(s=>({...s,uiText:R.applyChanges(s.uiText,patch)}),'same field'),/다른 사용자가 같은 설정/);assert.equal(puts,1);assert.equal(stored.uiText.title,'Theirs');
});
await test('an interrupted PUT is verified without replay and matching metadata alone cannot pass',async()=>{
  let stored=fixture(),puts=0;
  const writer=R.createWriter({readSnapshot:async()=>({sha:'s',data:copy(stored)}),putSnapshot:async({data})=>{puts++;stored=data;throw new Error('connection lost after commit');},readLatest:async()=>stored,pause});
  await writer(s=>({...s,uiText:{title:'Saved'}}),'uncertain');assert.equal(puts,1);
  const liar=R.createWriter({readSnapshot:async()=>({sha:'s',data:fixture()}),putSnapshot:async()=>{},readLatest:async()=>fixture(),pause});
  await assert.rejects(liar(s=>({...s,uiText:{title:'Not saved'}}),'different content'),/저장 후 공용 자료/);
});
await test('master logout during a read prevents the queued mutation',async()=>{
  let active=true,puts=0;const writer=R.createWriter({readSnapshot:async()=>{active=false;return{sha:'s',data:fixture()};},isActive:()=>active,putSnapshot:async()=>{puts++;},readLatest:async()=>fixture(),pause});
  await assert.rejects(writer(s=>s,'cancel'),/마스터 모드가 종료/);assert.equal(puts,0);
});

function storage(initial={}){const values=new Map(Object.entries(initial));return{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};}
function sharedRuntime(base,remote=base){
  let current=copy(remote),revision=1;const requests=[],views=[];
  const local=storage({sales_forecast_v16:JSON.stringify({mbo:base.mbo,gmbo:base.gmbo,sched:base.sched,up:base.uploads}),sales_forecast_vendor_closed_v66:JSON.stringify(base.closedVendors)});
  const sha=()=>String(revision).padStart(40,'a');
  const reliability={...R,setView:v=>views.push(v),requestJson:async(url,init={})=>{
    requests.push({url,method:init.method||'GET'});
    if(init.method==='PUT'){const body=JSON.parse(init.body);assert.equal(body.sha,sha());current=JSON.parse(Buffer.from(body.content,'base64').toString('utf8'));revision++;return{content:{sha:sha()}};}
    if(url.includes('/git/blobs/')){assert.equal(url.split('/').at(-1),sha());return{sha:sha(),encoding:'base64',content:Buffer.from(JSON.stringify(current)).toString('base64')};}
    if(init.headers?.Accept==='application/vnd.github.raw+json')return copy(current);
    return{sha:sha()};
  }};
  const controls={},listeners={};
  const document={querySelector:s=>controls[s]||null,addEventListener:(name,fn)=>(listeners[name]||(listeners[name]=[])).push(fn),createElement:()=>({}),head:{appendChild:()=>{}},documentElement:{dataset:{}}};
  const window={SFDataReliability:reliability,__sfSharedMeta:copy(base),__SF_SHARED_UPLOADS:copy(base.uploads),addEventListener:()=>{},dispatchEvent:()=>{}};
  const context=vm.createContext({window,document,localStorage:local,TextEncoder,TextDecoder,btoa,atob,setTimeout:()=>0,clearTimeout:()=>{},CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail;}}});
  vm.runInContext(fs.readFileSync(new URL('../shared-v31.js',import.meta.url),'utf8'),context);window.__sfMasterToken='fixture-token';
  return{window,local,requests,views,reliability,controls,listeners,current:()=>current};
}
await test('shared group selector treats null and blank as unset without losing an explicit zero target',()=>{
  const base=fixture();base.gmbo={'2026-10':{missing:null,blank:'',zero:0,positive:5}};
  const r=sharedRuntime(base);r.controls['#month']={value:'2026-10'};r.controls['#groupTarget']={value:'missing'};r.controls['#groupMbo']={value:'stale'};
  const select=group=>{r.controls['#groupTarget'].value=group;r.listeners.change.forEach(fn=>fn({target:{id:'groupTarget'}}));return r.controls['#groupMbo'].value;};
  assert.equal(select('missing'),'');assert.equal(select('blank'),'');assert.equal(select('zero'),'0');assert.equal(select('positive'),'5');assert.equal(select(''),'');assert.equal(r.requests.length,0);
});
await test('real settings publisher uses blob SHA and keeps remote text and unrelated settings',async()=>{
  const base=fixture(),remote=copy(base);remote.uiText.title='Remote';remote.mbo['2026-11']=260;
  const runtime=sharedRuntime(base,remote),local=JSON.parse(runtime.local.getItem('sales_forecast_v16'));local.mbo['2026-10']=255;runtime.local.setItem('sales_forecast_v16',JSON.stringify(local));
  const got=await runtime.window.__sfPublishSettings();assert.equal(got.mbo['2026-10'],255);assert.equal(got.mbo['2026-11'],260);assert.equal(got.uiText.title,'Remote');assert.ok(runtime.requests.some(r=>r.url.includes('/git/blobs/')));assert.equal(runtime.requests.filter(r=>r.method==='PUT').length,1);
});
await test('real upload publisher preserves authoritative settings and records the actual upload diff',async()=>{
  const base=fixture(),remote=copy(base);remote.mbo['2026-10']=270;remote.uploads.push(row('2026-09-29',70));
  const runtime=sharedRuntime(base,remote),sources=[{month:'2026-10',lastDate:'2026-10-20',dateCount:1,total:130,fileName:'test.xlsx'}];
  const got=await runtime.window.__sfPublishShared({baseUploads:base.uploads,up:[row('2026-10-20',130)],mbo:{'2026-10':1}},sources);
  assert.equal(got.mbo['2026-10'],270);assert.equal(R.monthSummary(got,'2026-09').total,70);assert.equal(got.lastUploadDiff.delta,30);assert.equal(got.lastUploadDiff.previousTotal,100);assert.equal(got.lastUploadDiff.currentTotal,130);assert.equal(runtime.window.__SF_LAST_UPLOAD_DIFF.delta,30);
});
await test('same-token re-login retires old queued writes and late verification cannot replace a newer save',async()=>{
  const runtime=sharedRuntime(fixture()),original=runtime.reliability.requestJson;let release,entered;
  const held=new Promise(resolve=>{release=resolve}),waiting=new Promise(resolve=>{entered=resolve});let holdFirst=true;
  runtime.reliability.requestJson=async(url,init={})=>{const body=await original(url,init);if(init.headers?.Accept==='application/vnd.github.raw+json'&&holdFirst){holdFirst=false;entered();await held;}return body;};
  const old=runtime.window.__sfPublishUiText({title:'Old'}).catch(error=>error),queued=runtime.window.__sfPublishUiText({title:'Queued'}).catch(error=>error);
  await waiting;runtime.window.__sfMasterToken=null;runtime.window.__sfMasterGeneration++;runtime.window.__sfMasterToken='fixture-token';
  const newer=await runtime.window.__sfPublishUiText({title:'Before',subtitle:'New'}),views=runtime.views.length;release();
  assert.equal((await old).name,'AbortError');assert.equal((await queued).name,'AbortError');assert.equal(runtime.views.length,views);assert.equal(runtime.window.__sfSharedMeta.uiText.subtitle,'New');assert.equal(runtime.window.__sfSharedMeta.updatedAt,newer.updatedAt);assert.equal(runtime.requests.filter(r=>r.method==='PUT').length,2);
});
await test('accepting an upload cannot silently rebase an unsaved setting over an unseen remote change',async()=>{
  const base=fixture(),remote=copy(base);remote.mbo['2026-10']=270;const runtime=sharedRuntime(base,remote),local=JSON.parse(runtime.local.getItem('sales_forecast_v16'));local.mbo['2026-10']=260;runtime.local.setItem('sales_forecast_v16',JSON.stringify(local));
  await runtime.window.__sfPublishShared({baseUploads:base.uploads,up:[row('2026-10-20',130)]},[{month:'2026-10',lastDate:'2026-10-20',dateCount:1,total:130}]);
  assert.equal(runtime.window.__sfSettingsBase.mbo['2026-10'],250);assert.equal(runtime.views.at(-1).saveState,'error');
  await assert.rejects(runtime.window.__sfPublishSettings(),/다른 사용자가 같은 설정/);assert.equal(runtime.current().mbo['2026-10'],270);assert.equal(runtime.requests.filter(r=>r.method==='PUT').length,1);
});
await test('service worker retires only owned caches and never intercepts data or assets',async()=>{
  const listeners={},deleted=[];let activation,claimed=false;
  const context=vm.createContext({self:{addEventListener:(name,listener)=>listeners[name]=listener,clients:{claim:async()=>{claimed=true;}}},caches:{keys:async()=>['scm-sales-forecast-pwa-v120','sales-forecast-static-old','partner-cache','unrelated'],delete:async name=>deleted.push(name)}});
  vm.runInContext(fs.readFileSync(new URL('../service-worker.js',import.meta.url),'utf8'),context);
  assert.equal(listeners.fetch,undefined,'HTTP cache must own requests without stale cache fallback');
  listeners.activate({waitUntil:p=>{activation=p;}});await activation;
  assert.deepEqual(deleted,['scm-sales-forecast-pwa-v120','sales-forecast-static-old']);assert.ok(claimed);
});
function bootstrapRuntime(request,{local={},expected=null}={}){
  const values=storage({sales_forecast_v16:JSON.stringify(local)}),session=storage(expected?{sales_forecast_expected_shared_v98:JSON.stringify(expected)}:{}),nodes={'#status':{},'#asof':{}},loaded=[];
  let view={kind:'loading',shared:null};
  const window={SFDataReliability:{...R,requestJson:request,setView:update=>view={...view,...update},getView:()=>view},SEED_DATA:{dailyRecords:[{date:'2026-04-01',vendor:'A',amount:80}]},addEventListener:()=>{},dispatchEvent:()=>{},__sfLoadScript:async src=>{loaded.push(src);},__sfShowLoadError:message=>{throw new Error(message)}};
  const document={querySelector:selector=>nodes[selector]||null,documentElement:{dataset:{}}};
  const context=vm.createContext({window,document,localStorage:values,sessionStorage:session,Storage:class{},AbortController,Event,Date,setTimeout:()=>0,setInterval,clearInterval});
  const source=fs.readFileSync(new URL('../bootstrap-v36.js',import.meta.url),'utf8').replace('(async()=>{\n  setBrand()','window.__bootstrapDone=(async()=>{\n  setBrand()');
  vm.runInContext(source,context);
  return{window,nodes,loaded,local:values,session,view:()=>view};
}
await test('real bootstrap falls back after raw failure and retains authoritative empty settings',async()=>{
  let requests=0;const shared=fixture();shared.mbo={};
  const runtime=bootstrapRuntime(async()=>{if(++requests===1)throw new Error('raw unavailable');return shared;},{local:{mbo:{'2026-10':999}}});
  await runtime.window.__bootstrapDone;
  assert.equal(requests,2);assert.equal(runtime.view().kind,'live');assert.equal(runtime.window.__SF_DISPLAY_DATE,'2026-10-21');assert.match(runtime.nodes['#asof'].textContent,/10\/21 업로드 기준/);assert.deepEqual(JSON.parse(runtime.local.getItem('sales_forecast_v16')).mbo,{});
});
await test('real bootstrap preserves a visible stale-cache state when both sources fail',async()=>{
  const runtime=bootstrapRuntime(async()=>{throw new Error('offline')},{local:{up:fixture().uploads}});await runtime.window.__bootstrapDone;
  assert.equal(runtime.view().kind,'cached');assert.equal(runtime.window.__sfSharedMeta,undefined);assert.match(runtime.nodes['#status'].textContent,/최신 공용 자료 확인에 실패/);assert.equal(runtime.window.__SF_DISPLAY_DATE,'2026-10-20');
});
await test('an older post-upload source cannot clear the expected saved version',async()=>{
  const expected={updatedAt:'2026-10-22T01:00:00Z',month:'2026-10',last:'2026-10-21',total:150};
  const runtime=bootstrapRuntime(async()=>fixture(),{expected,local:{up:fixture().uploads}});await runtime.window.__bootstrapDone;
  assert.equal(runtime.view().kind,'cached');assert.ok(runtime.session.getItem('sales_forecast_expected_shared_v98'));assert.equal(runtime.window.__sfSharedMeta,undefined);
});
await test('superseded bootstrap response cannot hydrate data or mark a stale request ready',async()=>{
  let release;const runtime=bootstrapRuntime(()=>new Promise(resolve=>{release=resolve}));runtime.window.__sfBootstrapGeneration++;release(fixture());await runtime.window.__bootstrapDone;
  assert.equal(runtime.window.__sfSharedMeta,undefined);assert.equal(runtime.window.__sfCoreReady,undefined);assert.equal(runtime.loaded.length,0);
});

function forecastRuntime(){
  const current=249.96e8,uploaded=[row('2026-10-20',current),row('2026-09-01',130e8),row('2026-09-29',120e8),row('2026-08-03',125e8),row('2026-08-31',125e8)];
  const document={querySelector:s=>s==='#month'?{value:'2026-10'}:s==='#mbo'?{value:'250'}:null,querySelectorAll:()=>[],addEventListener:()=>{}};
  const local=storage({sales_forecast_v16:JSON.stringify({up:uploaded,mbo:{'2026-10':250},sched:{}})}),window={SFDataReliability:R,__sfSharedMeta:{sourceFiles:[{month:'2026-10',fileName:'261026.xlsx',lastDate:'2026-10-20'}]},SEED_DATA:{dailyRecords:[],krHolidays2026:{'2026-10-09':'한글날'},customHolidaysByMonth:{}},addEventListener:()=>{},dispatchEvent:()=>{}};
  const context=vm.createContext({window,document,localStorage:local,setTimeout:()=>0,clearTimeout:()=>{},requestAnimationFrame:()=>{},Event});
  vm.runInContext(fs.readFileSync(new URL('../boundary-forecast-v113.js',import.meta.url),'utf8'),context);
  const radar=fs.readFileSync(new URL('../decision-radar-v93.js',import.meta.url),'utf8').replace('render();setTimeout(render,700);window.__SF_DECISION_RADAR_V94=true;','window.__radarTest={analyze,trendSvg,KEY,biz};');
  vm.runInContext(radar,context);
  const progress=fs.readFileSync(new URL('../forecast-progress-v81.js',import.meta.url),'utf8').replace('function schedule(delay=60)','window.__forecastTest=patch;function schedule(delay=60)');vm.runInContext(progress,context);
  window.__SF_SHARED_CLOSED={'2026-10':[...window.__radarTest.KEY]};
  return{window,current};
}
await test('actual radar and top forecast collapse to booked sales when all eight vendors close',()=>{
  const {window,current}=forecastRuntime();const analysis=window.__radarTest.analyze();window.__forecastTest();
  assert.equal(analysis.allClosed,true);assert.equal(analysis.last,'2026-10-26');assert.equal(analysis.salesLast,'2026-10-20');assert.equal(analysis.forecast,current);assert.equal(analysis.needDaily,0);assert.equal(window.__SF_FORECAST_V81.date,'2026-10-26');assert.equal(window.__SF_FORECAST_V81.salesLast,'2026-10-20');assert.equal(window.__SF_FORECAST_V81.forecast,current);assert.equal(window.__SF_FORECAST_V81.allClosed,true);
  assert.equal(analysis.mboMetDisplay,true);assert.equal(analysis.closeSignal,'MBO 달성');
  const chart=window.__radarTest.trendSvg(analysis);assert.ok(!chart.includes('-0.0억'),'a displayed achieved target must not show a negative zero shortfall');assert.match(chart,/최근 3개월 평균/);
  assert.ok(!window.__radarTest.biz('2026-10').includes('2026-10-09'));
});
await test('the existing operating range never reduces actuals or caps a finalized close',()=>{
  const {window}=forecastRuntime();for(const allClosed of [false,true]){const result=window.__sfBoundaryAdjust({current:280e8,mbo:250e8,rawProgress:.8,elapsedBiz:10,totalBiz:20,allClosed});assert.equal(result.forecast,280e8);assert.equal(result.operatingMin,230e8);assert.equal(result.operatingMax,270e8);}
});
console.log('RELIABILITY COMPLETE:',count,'behavioral cases');
