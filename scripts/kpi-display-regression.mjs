import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../kpi-layout-v37.js',import.meta.url),'utf8');
const keys=['mbo','current','mboRate','mboGap','paceTarget','paceGap','forecast','forecastRate'];
const labels=['MBO 목표','현재 누계','현재 MBO 달성률','예상 마감','예상 MBO 달성률','기준일 목표 누계','기준일 달성률','기준일 부족액'];
function fixture(initial={}){
  const elements=new Map(),timers=[],events=[],observers=[];
  let notifications=0,replacements=0;
  const changed=()=>observers.forEach(fn=>fn());
  class Node{
    constructor(tag='div'){this.tagName=tag;this.dataset={};this.style={};this.children=[];this.fields={};this._text='';this._html='';const classes=new Set();this.classList={add:(...v)=>v.forEach(x=>classes.add(x)),remove:(...v)=>v.forEach(x=>classes.delete(x)),contains:v=>classes.has(v)};}
    set textContent(v){this._text=String(v);changed();}get textContent(){return this._text;}
    set innerHTML(v){this._html=String(v);if(this.className==='card')for(const [selector,className]of [['.label','label'],['.value','value'],['.sub','sub']]){const match=this._html.match(new RegExp('<div class="'+className+'[^\"]*">(.*?)</div>'));const node=new Node();node._text=match?.[1]||'';this.fields[selector]=node;}changed();}get innerHTML(){return this._html;}
    querySelector(selector){return this.fields[selector]||null;}
    appendChild(node){this.children.push(node);if(node.id)elements.set('#'+node.id,node);return node;}
    cloneNode(){const node=new Node(this.tagName);node.dataset={...this.dataset};node.className=this.className;for(const[selector,value]of Object.entries(this.fields)){const copy=new Node();copy._text=value.textContent;node.fields[selector]=copy;}return node;}
    replaceChildren(...nodes){this.children=nodes;replacements++;changed();}
    insertAdjacentElement(position,node){elements.set('#'+node.id,node);node.nextElementSibling=null;return node;}
  }
  const cards=new Node('section');elements.set('#cards',cards);
  const month={value:initial.month||'2026-10'};elements.set('#month',month);
  const fresh=(values=['260.0억','187.7억','72.2%','270.0억','103.8%','115.3억','162.8%','0.0억'])=>{
    cards.children=labels.map((label,i)=>{const card=new Node();card.className='card';for(const [selector,text]of [['.label',label],['.value',values[i]],['.sub','engine explanation']]){card.fields[selector]=new Node();card.fields[selector]._text=text;}return card;});changed();
  };
  fresh(initial.values);
  const document={querySelector:s=>elements.get(s)||null,querySelectorAll:s=>s==='#cards .card'?cards.children:[],createElement:tag=>new Node(tag),head:new Node('head'),addEventListener:()=>{}};
  const window={addEventListener:()=>{},dispatchEvent:e=>{events.push(e.type);notifications++;}};
  const flush=()=>{let guard=500;while(timers.length&&guard--){timers.shift()();}assert.ok(guard>0,'KPI updates must settle without a MutationObserver loop');};
  const context=vm.createContext({window,document,MutationObserver:class{constructor(fn){this.fn=fn;}observe(){observers.push(this.fn);}},setTimeout:fn=>{timers.push(fn);return timers.length;},Event:class{constructor(type){this.type=type;}}});
  vm.runInContext(source,context,{filename:'kpi-layout-v37.js'});flush();
  const card=key=>cards.children.find(c=>c.dataset.kpiKey===key);
  return{cards,month,window,flush,fresh,card,value:key=>card(key)?.querySelector('.value')?.textContent,summary:()=>elements.get('#kpiFlowSummary'),notifications:()=>notifications,replacements:()=>replacements,mutate:changed};
}
let passed=0;
function test(name,fn){fn();passed++;console.log('KPI DISPLAY OK:',name);}

test('restored layout keeps engine actual and forecast values in the intended eight-card order',()=>{
  const f=fixture();assert.deepEqual(f.cards.children.map(c=>c.dataset.kpiKey),keys);
  assert.equal(f.value('current'),'187.7억');assert.equal(f.value('forecast'),'270.0억');assert.equal(f.value('forecastRate'),'103.8%');
  assert.equal(f.value('mboGap'),'72.3억');assert.equal(f.value('paceGap'),'0.0억');assert.equal(f.card('paceTarget').querySelector('.sub').textContent,'engine explanation');
  assert.equal(f.replacements(),1);assert.equal(f.notifications(),1);
});

test('the original engine Gap survives display rounding and repeated layout updates',()=>{
  const f=fixture({values:['20.0억','10.0억','50.0%','20.0억','100.0%','10.1억','99.9%','0.0억']});
  assert.equal(f.value('paceGap'),'0.0억');f.mutate();f.flush();assert.equal(f.value('paceGap'),'0.0억');
});

test('a late forecast result refreshes pace Gap from the engine boundary-adjusted current',()=>{
  const f=fixture();const original=f.card('current');
  f.window.__SF_FORECAST_V81={month:'2026-10',goal:205e8,effectiveCurrent:190e8,forecast:270e8};
  f.card('paceTarget').querySelector('.value').textContent='205.0억';f.flush();
  assert.equal(f.value('paceGap'),'15.0억');assert.equal(f.value('current'),'187.7억');assert.equal(f.card('current'),original);
  assert.match(f.summary().innerHTML,/보정 누계 190\.0억/);assert.match(f.summary().innerHTML,/92\.7%/);assert.equal(f.replacements(),1);
});

test('later current/forecast refresh updates both Gaps without changing booked actuals',()=>{
  const f=fixture();f.window.__SF_FORECAST_V81={month:'2026-10',goal:260e8,effectiveCurrent:250e8,forecast:270e8};
  f.card('current').querySelector('.value').textContent='250.0억';f.card('paceTarget').querySelector('.value').textContent='260.0억';f.flush();
  assert.equal(f.value('mboGap'),'10.0억');assert.equal(f.value('paceGap'),'10.0억');assert.equal(f.value('current'),'250.0억');assert.match(f.summary().innerHTML,/현재 250\.0억/);
});

test('a new month ignores the previous forecast result and preserves the fresh engine Gap',()=>{
  const f=fixture();f.window.__SF_FORECAST_V81={month:'2026-10',goal:260e8,effectiveCurrent:250e8,forecast:270e8};f.month.value='2026-11';
  f.fresh(['200.0억','50.0억','25.0%','240.0억','120.0%','75.0억','66.7%','25.0억']);f.flush();
  assert.equal(f.value('current'),'50.0억');assert.equal(f.value('forecast'),'240.0억');assert.equal(f.value('paceGap'),'25.0억');assert.equal(f.value('mboGap'),'150.0억');
  assert.match(f.summary().innerHTML,/75\.0억/);assert.doesNotMatch(f.summary().innerHTML,/250\.0억/);
});

test('text overrides and unchanged observer notifications preserve card identity and settle',()=>{
  const f=fixture();const card=f.card('forecast');f.card('forecast').querySelector('.label').textContent='사용자 지정 예상';f.flush();const before=f.notifications();
  for(let i=0;i<10;i++)f.mutate();f.flush();
  assert.equal(f.card('forecast'),card);assert.equal(card.querySelector('.label').textContent,'사용자 지정 예상');assert.equal(f.notifications(),before);assert.equal(f.replacements(),1);
});

test('Gap explanations continue updating after the visual layer restyles the subtext node',()=>{
  const f=fixture();const card=f.card('mboGap');card.fields['.sf-state-meta']=card.fields['.sub'];delete card.fields['.sub'];
  f.card('current').querySelector('.value').textContent='270.0억';f.flush();
  assert.equal(f.value('mboGap'),'0.0억');assert.equal(card.querySelector('.sf-state-meta').textContent,'MBO 이상 달성');
});

test('unknown targets remain pending instead of claiming that the goal is met',()=>{
  const f=fixture({values:['입력 필요','31.0억','계산 대기','계산 대기','계산 대기','계산 대기','계산 대기','계산 대기']});
  assert.equal(f.value('mboGap'),'계산 대기');assert.equal(f.value('paceGap'),'계산 대기');
  assert.doesNotMatch(f.card('mboGap').querySelector('.sub').textContent,/이상 달성/);assert.doesNotMatch(f.card('paceGap').querySelector('.sub').textContent,/이상 확보/);
});
console.log(`KPI display regressions passed (${passed} scenarios).`);
