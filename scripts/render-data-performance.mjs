import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const root=fileURLToPath(new URL('../',import.meta.url));
const storeKey='sales_forecast_v16',legacyKey='sales_forecast_v15';
const vendor='백제약품영등포지점',group='제품군 테스트',month='2026-11';
const read=(dir,file)=>fs.readFileSync(path.join(dir,file),'utf8');
const row=(d,a)=>({d,v:vendor,g:group,m:'SKU',a});
const serialize=value=>JSON.parse(JSON.stringify(value));

function loadRuntime(dir,seed,initial){
  const events=new Map(),stored=new Map(),calls={reads:0,largeParses:0};
  const nodes={'#month':{value:month},'#groupTarget':{value:group},'#groupMbo':{value:''},
    '#groupTargetTable':{closest:()=>null,style:{},dataset:{},innerHTML:''},
    '#decisionRadarV93':{querySelector:()=>null,innerHTML:'',dataset:{}},
    '#decisionRadarV93Style':{},'#decisionRadarV105Style':{}};
  let failWrites=false;
  const window={SEED_DATA:seed,__SF_SHARED_LAST:'2026-11-10',
    __sfVendorPaceContext:(m,hist)=>({month:m,available:hist.length>0,
      cuts:Object.fromEntries(hist.map(h=>[h,h+'-10']))}),
    addEventListener(name,fn){if(!events.has(name))events.set(name,[]);events.get(name).push(fn);},
    dispatchEvent(event){for(const fn of events.get(event.type)||[])fn(event);}};
  const context=vm.createContext({window,
    document:{querySelector:selector=>nodes[selector]||null,addEventListener(){}},
    localStorage:{
      getItem(key){if(key===storeKey||key===legacyKey)calls.reads++;return stored.get(key)||null;},
      setItem(key,value){if(failWrites)throw new Error('storage full');stored.set(key,value);}
    },
    JSON:{parse(raw){if(raw.length>100000)calls.largeParses++;return JSON.parse(raw);},stringify:JSON.stringify},
    setTimeout:()=>0,clearTimeout(){},requestAnimationFrame:()=>0,Event
  });
  const set=(state,key=storeKey)=>stored.set(key,JSON.stringify(state));
  if(initial)set(initial);
  vm.runInContext(read(root,'sales-pace.js'),context);
  vm.runInContext(read(root,'data-reliability.js'),context);
  vm.runInContext(read(root,'boundary-forecast-v113.js'),context);
  const inject=(file,body)=>{
    let source=read(dir,file);
    if(file==='decision-radar-v93.js')source=source.replace('render();setTimeout(render,700);','');
    const end=source.lastIndexOf('})();');
    assert.ok(end>0);
    vm.runInContext(source.slice(0,end)+body+source.slice(end),context,{filename:file});
  };
  inject('unified-final-v73.js',`window.unifiedTest={metrics,saveMbo,getState:state,
    mboTable(){renderMbo();return $('#groupTargetTable').innerHTML}};`);
  inject('decision-radar-v93.js',`window.radarTest={analyze,trendSvg,
    radarPanel(){render();return $('#decisionRadarV93').innerHTML}};`);
  return{window,nodes,stored,calls,set,failWrites:()=>{failWrites=true;},
    unified:window.unifiedTest,radar:window.radarTest,
    select(mstr,g){nodes['#month'].value=mstr;nodes['#groupTarget'].value=g;}};
}

function testChanges(){
  const seed={dailyRecords:[
    {date:'2026-10-02',vendor,productGroup:group,material:'SKU',amount:2e8},
    {date:'2026-11-10',vendor,productGroup:group,material:'replaced',amount:20e8}
  ]};
  const initial={up:[row('2026-11-10',3e8)],gmbo:{[month]:{[group]:10}}};
  const fixture=loadRuntime(root,seed,initial);
  const check=(value,target)=>{
    const {rows}=fixture.unified.metrics('g',vendor);
    assert.equal(rows[0].now,value);
    assert.equal(fixture.unified.metrics('m',vendor).rows.length,1,'the upload replaces all seed rows on its date');
    assert.equal(fixture.radar.analyze().current,value);
    assert.match(fixture.unified.mboTable(),new RegExp(target.toFixed(1)));
  };
  check(3e8,7);
  assert.match(fixture.radar.radarPanel(),/실적 기준 2026-11-10/);
  fixture.window.__sfSharedMeta={sourceFiles:[{month,uploadDate:'2026-11-12'}]};
  assert.match(fixture.radar.radarPanel(),/업로드 기준 2026-11-12 · 실적 2026-11-10까지/);
  fixture.set({up:[row('2026-11-10',8e8)],gmbo:{[month]:{[group]:14}}});
  check(8e8,6);

  fixture.stored.delete(storeKey);
  fixture.set({uploadRows:[{date:'2026-11-10',vendor,productGroup:group,material:'SKU',amount:9e8}],
    groupMbo:{[month]:{[group]:12}}},legacyKey);
  check(9e8,3);
  fixture.set({gmbo:{[month]:{[group]:11}}});
  fixture.window.__SF_SHARED_UPLOADS=[row('2026-11-10',7e8)];
  check(7e8,4);
  fixture.window.__SF_SHARED_UPLOADS[0].a=6e8;
  fixture.window.dispatchEvent(new Event('sf-data-refreshed'));
  check(6e8,5);

  fixture.nodes['#groupMbo'].value='15';
  fixture.unified.saveMbo();
  assert.equal(fixture.unified.getState().gmbo[month][group],15);
  fixture.failWrites();
  fixture.nodes['#groupMbo'].value='16';
  fixture.unified.saveMbo();
  assert.equal(fixture.unified.getState().gmbo[month][group],15,'failed writes must not change cached settings');
  console.log('RENDER DATA OK: seed replacement, legacy/fallback data, same-size corrections, target saves, refresh and date labels.');
}

function testRadarStates(){
  const fixture=loadRuntime(root,{dailyRecords:[]},{up:[row('2026-04-30',8e8),row('2026-11-10',2e8)],mbo:{[month]:10}});
  const card=(label,value)=>new RegExp(label+'</div><div class="v [^"]*">'+value+'</div>');
  const panel=()=>fixture.radar.radarPanel();
  assert.match(panel(),card('남은 MBO','8.0억'));
  assert.match(panel(),/sf-radar-main-svg/);

  const dataset=fixture.nodes['#decisionRadarV93'].dataset;
  dataset.trendViewMonth=month;
  fixture.select('2026-04',group);
  const noHistory=panel();
  assert.match(noHistory,/2026년 4월 · 이전 확정월 자료가 없어/);
  assert.doesNotMatch(noHistory,/sf-radar-kpis|sf-radar-main-svg|관리업체 전체 현황|2026-11-10/);
  assert.equal(dataset.trendViewMonth,undefined);
  fixture.select('2026-12',group);
  assert.match(panel(),/2026년 12월 · 선택한 기준월에 확인할 실적 자료가 없습니다/);

  fixture.select(month,group);
  assert.match(panel(),/2026-11-10/);
  assert.match(panel(),/sf-radar-main-svg/);
  fixture.set({up:[row('2026-04-30',8e8),row('2026-11-10',2e8)]});
  const missing=panel();
  assert.match(missing,card('남은 MBO','목표 미입력'));
  assert.match(missing,card('잔여 영업일 필요 일평균','목표 미입력'));
  assert.equal(fixture.radar.analyze().remain,0);
  assert.equal(fixture.radar.analyze().needDaily,0);
  fixture.set({up:[row('2026-04-30',8e8),row('2026-11-10',2e8)],mbo:{[month]:0}});
  assert.match(panel(),card('남은 MBO','0.0억'));
  assert.match(panel(),card('잔여 영업일 필요 일평균','0.0억'));
  console.log('RENDER DATA OK: radar clears unavailable months, restores comparison months and distinguishes an unset target.');
}

function loadRealData(){
  const seedContext={window:{}};
  vm.runInNewContext(read(root,'data.js'),seedContext);
  const shared=JSON.parse(read(root,'shared-data/sales-history.json'));
  const initial={mbo:shared.mbo,gmbo:shared.gmbo,sched:shared.sched,up:shared.uploads,sourceFiles:shared.sourceFiles};
  const foundMonths=[...new Set(shared.uploads.map(r=>(r.d||r.date).slice(0,7)))].sort().slice(-3);
  const scopes=['','권역 외 업체',vendor];
  const scenarios=foundMonths.flatMap(mstr=>{
    const groups=Object.keys(shared.gmbo?.[mstr]||{});
    const sample=shared.uploads.find(r=>(r.d||r.date).startsWith(mstr));
    const selectedGroup=groups[0]||sample.g||sample.productGroup;
    if(!groups.length){initial.gmbo={...initial.gmbo,[mstr]:{[selectedGroup]:20}};}
    return scopes.map(scope=>({mstr,selectedGroup,scope}));
  });
  return{seed:seedContext.window.SEED_DATA,initial,shared,scenarios};
}

function realRuntime(dir,{seed,initial,shared}){
  const fixture=loadRuntime(dir,seed,initial);
  fixture.window.__sfSharedMeta=shared;
  fixture.window.__SF_SHARED_UPLOADS=shared.uploads;
  fixture.window.__SF_SHARED_CLOSED=shared.closedVendors;
  return fixture;
}

function inspect(fixture,scenario){
  const {mstr,selectedGroup,scope}=scenario;
  fixture.select(mstr,selectedGroup);
  const groups=fixture.unified.metrics('g',scope),sku=fixture.unified.metrics('m',scope),target=fixture.unified.mboTable();
  const radar=fixture.radar.analyze(),chart=radar&&fixture.radar.trendSvg(radar);
  return{groups,sku,target,radar,chart};
}

function benchmark(fixture,scenarios,count){
  const samples=[];
  for(let i=0;i<count;i++){
    const start=performance.now();
    inspect(fixture,scenarios[i%scenarios.length]);
    samples.push(performance.now()-start);
  }
  const cold=samples.shift(),warm=samples.sort((a,b)=>a-b);
  return{coldMs:Number(cold.toFixed(1)),warmMedianMs:Number(warm[Math.floor(warm.length/2)].toFixed(1)),
    warmP90Ms:Number(warm[Math.ceil(warm.length*.9)-1].toFixed(1)),...fixture.calls};
}

testChanges();
testRadarStates();
const real=loadRealData(),runtime=realRuntime(root,real);
for(const scenario of [real.scenarios[0],real.scenarios.at(-1)])inspect(runtime,scenario);
assert.equal(runtime.calls.largeParses,2,'each renderer parses the unchanged large storage value once');
console.log('RENDER DATA OK: two unchanged-storage views parse the large value once per renderer.');

const baselineAt=process.argv.indexOf('--baseline');
if(baselineAt!==-1){
  const baseline=path.resolve(process.argv[baselineAt+1]);
  const previous=realRuntime(baseline,real),current=realRuntime(root,real);
  for(const scenario of real.scenarios){
    assert.deepEqual(serialize(inspect(current,scenario)),serialize(inspect(previous,scenario)));
  }
  console.log('RENDER DATA OK: output matches baseline for '+real.scenarios.length+' month/vendor scenarios, including radar chart HTML.');
  const count=18;
  const operations=['product-group metrics by vendor','all-product SKU metrics by vendor','selected-product MBO table HTML',
    'decision radar analysis','decision radar trend SVG'];
  console.log('RENDER DATA BENCH:',JSON.stringify({operations,runs:count,storageBytes:Buffer.byteLength(JSON.stringify(real.initial)),
    seedRows:real.seed.dailyRecords.length,uploadRows:real.initial.up.length,
    baseline:benchmark(realRuntime(baseline,real),real.scenarios,count),
    updated:benchmark(realRuntime(root,real),real.scenarios,count)}));
}
