import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=name=>fs.readFileSync(new URL('../'+name,import.meta.url),'utf8');
const VENDOR='백제약품영등포지점';
const classes=(initial=[])=>{const values=new Set(initial);return{add:(...items)=>items.forEach(x=>values.add(x)),remove:(...items)=>items.forEach(x=>values.delete(x)),contains:x=>values.has(x),toggle:(x,on)=>{if(on===undefined)on=!values.has(x);on?values.add(x):values.delete(x);return on;}};};
const cell=text=>{const node={nodeType:3,nodeValue:String(text)};return{get textContent(){return node.nodeValue;},firstChild:node,childNodes:[node],classList:classes(),appendChild:()=>{}};};
let checks=0;
function test(name,run){run();checks++;console.log('MBO DISPLAY OK:',name);}
function runtime({input='',finalReady=false}={}){
  const timers=[],listeners={},panelText={textContent:''},scroller={scrollLeft:0,scrollWidth:1000};
  const table={innerHTML:'before',style:{},dataset:{},closest:s=>s==='.table'?scroller:{querySelector:()=>panelText}};
  const nodes={'#groupTarget':{value:'테스트군',options:[{},{}]},'#groupMbo':{value:input},'#groupTargetTable':table,'#month':{value:'2026-10'},'#groupCurrent':{textContent:'before'},'#groupRate':{textContent:'before',classList:classes(['warn','sf-tone-negative'])},'#groupNeed':{textContent:'before',classList:classes(['good','sf-tone-positive'])}};
  const source=[...Array.from({length:6},(_,i)=>({date:`2026-${String(i+4).padStart(2,'0')}-15`,vendor:VENDOR,productGroup:'테스트군',amount:2e8})),{date:'2026-10-20',vendor:VENDOR,productGroup:'테스트군',amount:3e8}];
  const window={SEED_DATA:{dailyRecords:source},__SF_NO_MBO_FINAL_V88:finalReady,addEventListener:(name,fn)=>(listeners[name]||(listeners[name]=[])).push(fn)};
  const document={querySelector:s=>nodes[s]||null,addEventListener:()=>{},createElement:()=>({}),head:{appendChild:()=>{}}};
  const context=vm.createContext({window,document,localStorage:{getItem:()=>null,setItem:()=>assert.fail('Display renderer must not save data')},setTimeout:(fn,ms)=>{timers.push({fn,ms});return timers.length;},clearTimeout:()=>{},setInterval:()=>1,clearInterval:()=>{},requestAnimationFrame:fn=>fn()});
  return{nodes,table,window,context,panelText,timers,load:name=>vm.runInContext(read(name),context),flush:()=>{let i=0;while(timers.length){assert.ok(++i<100,'timer queue must settle');timers.shift().fn();}}};
}

test('unset product target preserves complete sales history and labels unknown target measures',()=>{
  const r=runtime();r.load('group-no-mbo-final-v87.js');
  assert.equal(r.window.__sfRenderGroupWithoutMbo(),true);
  assert.equal(r.nodes['#groupCurrent'].textContent,'3.0억');
  assert.equal(r.nodes['#groupRate'].textContent,'목표 미입력');
  assert.equal(r.nodes['#groupNeed'].textContent,'—');
  assert.ok(r.nodes['#groupNeed'].classList.contains('sf-tone-neutral'));
  assert.equal(r.nodes['#groupNeed'].classList.contains('sf-tone-positive'),false);
  for(const m of ['26.04','26.05','26.06','26.07','26.08','26.09'])assert.ok(r.table.innerHTML.includes(m));
  assert.equal((r.table.innerHTML.match(/title="제품군 목표 입력 후 계산">—<\/td>/g)||[]).length,20);
  assert.match(r.panelText.textContent,/목표 미입력/);
  assert.doesNotMatch(r.panelText.textContent,/0\.0억 기준/);
});

test('null target is missing while an explicitly entered zero remains a defined target',()=>{
  const r=runtime({input:null});r.load('group-no-mbo-final-v87.js');
  assert.equal(r.window.__sfRenderGroupWithoutMbo(),true);
  r.nodes['#groupMbo'].value='0';r.nodes['#groupRate'].textContent='zero-target display';
  assert.equal(r.window.__sfRenderGroupWithoutMbo(),false);
  assert.equal(r.nodes['#groupRate'].textContent,'zero-target display');
  r.nodes['#groupMbo'].value='5.0';assert.equal(r.window.__sfRenderGroupWithoutMbo(),false);
  r.nodes['#groupMbo'].value='';r.nodes['#groupTarget'].value='__ALL_PRODUCTS__';
  assert.equal(r.window.__sfRenderGroupWithoutMbo(),false);
});

test('older no-MBO fallback cannot overwrite the full-history final renderer',()=>{
  const r=runtime();r.load('group-no-mbo-final-v87.js');r.window.__sfRenderGroupWithoutMbo();
  const finalTable=r.table.innerHTML;r.load('group-info-no-mbo-v82.js');r.flush();
  assert.equal(r.table.innerHTML,finalTable);
});

test('fallback renderer handles missing target without an exception before the final renderer loads',()=>{
  const r=runtime();r.load('group-info-no-mbo-v82.js');r.flush();
  assert.equal(r.nodes['#groupCurrent'].textContent,'3.0억');
  assert.equal(r.nodes['#groupRate'].textContent,'목표 미입력');
  assert.equal(r.nodes['#groupNeed'].textContent,'—');
});

function closingRuntime(input,need){
  const r=runtime({input});
  const names=['업체','확정월 평균','진행월 현재','확정월 평균 대비 현재 매출율','업체 목표','추가 필요'];
  const row={cells:[cell(VENDOR),cell('2.0'),cell('3.0'),cell('150.0%'),cell('—'),cell('—')],classList:classes()};
  r.table.tHead={rows:[{cells:names.map(cell)}]};r.table.tBodies=[{rows:[row]}];
  r.nodes['#groupNeed'].textContent=need;r.load('group-mbo-close-v70.js');r.flush();
  return{...r,row};
}

test('late close-status formatting never converts a missing goal into an apparent target',()=>{
  const r=closingRuntime('','—');
  assert.equal(r.row.cells[4].textContent,'—');assert.equal(r.row.cells[5].textContent,'—');
});

test('close allocation still handles explicit zero and positive targets with the existing arithmetic',()=>{
  const zero=closingRuntime('0','0.0억');
  assert.equal(zero.row.cells[4].textContent,'3.0');assert.equal(zero.row.cells[5].textContent,'0.0');
  const positive=closingRuntime('5.0','2.0억');
  assert.equal(positive.row.cells[4].textContent,'5.0');assert.equal(positive.row.cells[5].textContent,'2.0');
});

console.log(`MBO display regressions passed (${checks} scenarios).`);
