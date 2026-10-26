import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Execute the shipped shell and final renderer, with browser-like select and
// event propagation. No reimplementation of the selection controller is used.
const root = new URL('../', import.meta.url);
const source = name => fs.readFileSync(new URL(name, root), 'utf8');
const A = '(주)인천약품', B = '유진약품(주)';
const G1 = '릭시아나군', G2 = '펙수클루군', G3 = '과거제품군';
const decode = value => value.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

function fixture(initial = {}) {
  const documentEvents = new Map(), windowEvents = new Map(), elements = new Map();
  const timers = new Map(); let timerId = 0, clock = 0, storageWrites = 0, inputEvents = 0;
  const local = new Map([['sales_forecast_v16', JSON.stringify({gmbo: {'2026-10': {[G1]:2.5, [G2]:5}, '2026-09': {[G1]:0}}})]]);
  const register = (map, name, fn, options) => {
    if (!map.has(name)) map.set(name, []);
    map.get(name).push({fn, capture: options === true || !!options?.capture});
  };
  class BrowserEvent {
    constructor(type, options = {}) { this.type = type; this.bubbles = !!options.bubbles; this.detail = options.detail; }
    preventDefault() { this.defaultPrevented = true; }
    stopPropagation() { this.stopped = true; }
  }
  class Element {
    constructor(tag = 'div', id = '') {
      this.tagName = tag.toUpperCase(); this.id = id; this.dataset = {}; this.style = {}; this.events = new Map();
      this.options = []; this._value = ''; this._html = ''; this.attrs = {}; this.children = [];
      const classes = new Set();
      this.classList = {add:(...names)=>names.forEach(n=>classes.add(n)),remove:(...names)=>names.forEach(n=>classes.delete(n)),contains:n=>classes.has(n),toggle:(n,on)=>{if(on??!classes.has(n))classes.add(n);else classes.delete(n);}};
    }
    get value() { return this._value; }
    set value(value) {
      const next = String(value);
      this._value = this.tagName === 'SELECT' && !this.options.some(o=>o.value===next) ? '' : next;
    }
    get innerHTML() { return this._html; }
    set innerHTML(value) {
      this._html = String(value);
      if (this.tagName === 'SELECT') {
        this.options = [...this._html.matchAll(/<option value="([^"]*)"[^>]*>(.*?)<\/option>/gs)].map(m=>({value:decode(m[1]),textContent:decode(m[2])}));
        this._value = this.options[0]?.value || '';
      }
    }
    appendChild(child) { this.children.push(child); if(this.tagName==='SELECT')this.options.push(child);if(child.id)elements.set('#'+child.id,child);return child; }
    addEventListener(name, fn, options) { register(this.events, name, fn, options); }
    dispatchEvent(event) {
      event.target = this;
      if(event.type==='input')inputEvents++;
      for(const {fn,capture} of documentEvents.get(event.type)||[])if(capture)fn(event);
      for(const {fn} of this.events.get(event.type)||[])fn(event);
      if(event.bubbles)for(const {fn,capture} of documentEvents.get(event.type)||[])if(!capture)fn(event);
      return !event.defaultPrevented;
    }
    querySelector() { return null; }
    querySelectorAll() { return []; }
    closest() { return null; }
    setAttribute(name, value) { this.attrs[name] = String(value); }
    getAttribute(name) { return this.attrs[name] ?? null; }
  }
  const add = (id, tag, options = [], value = '') => {
    const element = new Element(tag,id);element.options = options.map(v=>({value:v,textContent:v}));element.value=value;elements.set('#'+id,element);return element;
  };
  add('month','select',['2026-08','2026-09','2026-10'],initial.month||'2026-10');
  add('groupTarget','select',['',G1,G2,G3],initial.group||'');
  add('groupMbo','input');
  add('v51Group','select',['']);
  add('v51Vendor','select',['',A,B],initial.vendor||'');
  const panel = new Element();
  const tools = new Element(), wrap = new Element();
  panel.querySelector = selector => selector==='.v61-detail-tools'?tools:selector==='.v61-detail-wrap'?wrap:null;
  const detail = add('detailTable','table');detail.closest = selector=>selector==='section.panel'?panel:null;
  const compare = add('v51CompareTable','table');
  add('groupTargetTable','table');for(const id of ['groupCurrent','groupRate','groupNeed'])add(id,'div');
  const document = {
    querySelector:selector=>elements.get(selector)||null,
    querySelectorAll:()=>[], createElement:tag=>new Element(tag),
    addEventListener:(name,fn,options)=>register(documentEvents,name,fn,options),
    head:new Element('head'),
  };
  const window = {
    addEventListener:(name,fn,options)=>register(windowEvents,name,fn,options),
    dispatchEvent:event=>{for(const {fn} of windowEvents.get(event.type)||[])fn(event);},
    SEED_DATA:{dailyRecords:[
      {date:'2026-09-30',vendor:A,productGroup:G1,material:'릭시아나 30mg',amount:2e8},
      {date:'2026-09-30',vendor:A,productGroup:G1,material:'릭시아나 60mg',amount:3e8},
      {date:'2026-09-30',vendor:B,productGroup:G1,material:'릭시아나 30mg',amount:1e8},
      {date:'2026-09-30',vendor:A,productGroup:G3,material:'과거 SKU',amount:1e8},
      {date:'2026-10-18',vendor:A,productGroup:G1,material:'릭시아나 30mg',amount:1.2e8},
      {date:'2026-10-18',vendor:A,productGroup:G1,material:'릭시아나 60mg',amount:1.3e8},
      {date:'2026-10-18',vendor:B,productGroup:G1,material:'릭시아나 30mg',amount:.5e8},
      {date:'2026-10-20',vendor:B,productGroup:G2,material:'펙수클루 40mg',amount:4e8},
    ]},
  };
  if(initial.rows)window.SEED_DATA.dailyRecords.push(...initial.rows);
  const setTimeout = (fn, delay=0) => {const id=++timerId;timers.set(id,{fn,at:clock+delay});return id;};
  const context = vm.createContext({window,document,localStorage:{getItem:k=>local.get(k)||null,setItem:(k,v)=>{storageWrites++;local.set(k,v);}},Event:BrowserEvent,CustomEvent:BrowserEvent,setTimeout,clearTimeout:id=>timers.delete(id),requestAnimationFrame:fn=>setTimeout(fn,16)});
  const flush = () => {
    let limit = 1000;
    while(timers.size&&--limit){const [id,item]=[...timers].sort((a,b)=>a[1].at-b[1].at)[0];timers.delete(id);clock=item.at;item.fn();}
    assert.ok(limit>0,'events/timers must settle without a feedback loop');
  };
  vm.runInContext(source('detail-shell-v61.js'),context,{filename:'detail-shell-v61.js'});
  vm.runInContext(source('unified-final-v73.js'),context,{filename:'unified-final-v73.js'});
  flush();
  const get = id => elements.get('#'+id);
  const change = (id,value) => {const el=get(id);el.value=value;el.dispatchEvent(new BrowserEvent('change',{bubbles:true}));flush();};
  const click = target => {const e=new BrowserEvent('click',{bubbles:true});e.target=target;for(const {fn,capture} of documentEvents.get('click')||[])if(capture)fn(e);flush();};
  return {get,change,click,flush,window,compare,emit:type=>window.dispatchEvent(new BrowserEvent(type)),input:value=>{get('groupMbo').value=value;get('groupMbo').dispatchEvent(new BrowserEvent('input',{bubbles:true}));},writes:()=>storageWrites,inputs:()=>inputEvents};
}

let passed = 0;
function test(name, fn) { fn();passed++;console.log('PRODUCT SELECTION OK:',name); }

test('initial upper product selection hydrates lower SKU and the saved target',()=>{
  const f=fixture({group:G1,vendor:A});
  assert.equal(f.get('v51Group').value,G1);assert.equal(f.get('groupMbo').value,'2.5');assert.equal(f.get('v51Vendor').value,A);
  assert.match(f.compare.innerHTML,/릭시아나 30mg/);assert.doesNotMatch(f.compare.innerHTML,/펙수클루 40mg/);assert.equal(f.writes(),0);
});

test('upper dropdown updates SKU and resets an unavailable vendor',()=>{
  const f=fixture({group:G1,vendor:A});f.change('groupTarget',G2);
  assert.equal(f.get('v51Group').value,G2);assert.equal(f.get('groupMbo').value,'5');assert.equal(f.get('v51Vendor').value,'');
  assert.match(f.compare.innerHTML,/펙수클루 40mg/);assert.doesNotMatch(f.compare.innerHTML,/릭시아나 30mg/);assert.equal(f.writes(),0);
});

test('lower dropdown updates upper scope and preserves a valid vendor',()=>{
  const f=fixture({group:G2,vendor:B});f.change('v51Group',G1);
  assert.equal(f.get('groupTarget').value,G1);assert.equal(f.get('groupMbo').value,'2.5');assert.equal(f.get('v51Vendor').value,B);assert.equal(f.inputs(),0);
});

test('product-table click uses the same scope path and historical SKU data',()=>{
  const f=fixture({group:G1});const row={dataset:{v61Group:G3}};
  f.click({closest:selector=>selector==='#groupTable [data-v61-group]'?row:null});
  assert.equal(f.get('groupTarget').value,G3);assert.equal(f.get('v51Group').value,G3);assert.equal(f.get('groupMbo').value,'');
  assert.match(f.compare.innerHTML,/과거 SKU/);assert.equal(f.writes(),0);
});

test('clear product resets both controls without clearing a valid vendor',()=>{
  const f=fixture({group:G1,vendor:A});f.click({closest:selector=>selector==='[data-sf-clear-product]'?{}:null});
  assert.equal(f.get('groupTarget').value,'');assert.equal(f.get('v51Group').value,'');assert.equal(f.get('groupMbo').value,'');assert.equal(f.get('v51Vendor').value,A);
  for(const id of ['groupCurrent','groupRate','groupNeed'])assert.equal(f.get(id).textContent,'—');
  assert.equal(f.compare.classList.contains('sku-v115-single'),false);assert.equal(f.writes(),0);
});

test('month change preserves product even before its first sale and shows no results',()=>{
  const f=fixture({group:G2,vendor:B});f.change('month','2026-09');
  assert.equal(f.get('groupTarget').value,G2);assert.equal(f.get('v51Group').value,G2);assert.equal(f.get('v51Vendor').value,'');assert.equal(f.get('groupMbo').value,'');
  assert.match(f.compare.innerHTML,/선택 조건의 SKU·업체별 매출이 없습니다/);
});

test('month change hydrates explicit zero without writing a new target',()=>{
  const f=fixture({group:G1,vendor:A});f.change('month','2026-09');
  assert.equal(f.get('groupMbo').value,'0');assert.equal(f.get('v51Group').value,G1);assert.equal(f.writes(),0);
});

test('pending input timer cannot commit an old target after group navigation',()=>{
  const f=fixture({group:G1});f.input('9.9');f.change('groupTarget',G2);
  assert.equal(f.get('groupMbo').value,'5');assert.equal(f.writes(),0);assert.equal(f.inputs(),1);
});

test('all-product sentinel maps to all SKU without creating a false group',()=>{
  const f=fixture({group:G1});f.get('groupTarget').appendChild({value:'__ALL_PRODUCTS__',textContent:'전체 제품'});f.change('groupTarget','__ALL_PRODUCTS__');
  assert.equal(f.get('v51Group').value,'');assert.equal(f.get('groupMbo').value,'');assert.doesNotMatch(f.compare.innerHTML,/선택 조건의 SKU·업체별 매출이 없습니다/);
});

test('detail-shell rebuild and verified data refresh retain active scope',()=>{
  const f=fixture({group:G1,vendor:A});f.emit('sf-detail-shell-ready');f.flush();
  assert.equal(f.get('v51Vendor').value,A);assert.equal(f.get('v51Group').value,G1);
  f.window.__SF_SHARED_UPLOADS=[{d:'2026-10-21',v:A,g:'추가제품군',m:'새 SKU',a:100}];f.emit('sf-data-refreshed');f.flush();
  assert.ok(f.get('v51Group').options.some(o=>o.value==='추가제품군'));assert.equal(f.get('v51Group').value,G1);assert.equal(f.get('v51Vendor').value,A);assert.equal(f.writes(),0);
});

test('month and refresh preserve explicit SKU vendor after an earlier upper-vendor selection',()=>{
  const f=fixture({group:G1});f.window.dispatchEvent({type:'sf-vendor-scope-change',detail:{vendor:A}});f.flush();
  assert.equal(f.get('v51Vendor').value,A);f.change('v51Vendor',B);f.change('month','2026-09');
  assert.equal(f.get('v51Vendor').value,B);f.emit('sf-data-refreshed');f.flush();assert.equal(f.get('v51Vendor').value,B);
});

test('all-vendor SKU detail remains collapsed initially',()=>{
  const f=fixture({group:G1});
  assert.match(f.compare.innerHTML,/aria-expanded="false"/);assert.match(f.compare.innerHTML,/<tr hidden[^>]*class="sku-v115-detail"/);assert.equal(f.window.__SF_SKU_VENDOR_EXPORT.count,2);
  assert.ok(f.window.__SF_SKU_VENDOR_EXPORT.rows.some(r=>r[1]===A),'export includes collapsed vendor details');
});

test('single-vendor multi-SKU total has the same column count as its header',()=>{
  const f=fixture({group:G1,vendor:A});
  assert.doesNotMatch(f.compare.innerHTML,/data-sku-v115-fold|SKU 소계/);
  const header=f.compare.innerHTML.match(/<thead><tr>(.*?)<\/tr><\/thead>/s)?.[1]||'';
  const grand=f.compare.innerHTML.match(/<tr class="sku-v115-grand">(.*?)<\/tr>/s)?.[1]||'';
  assert.equal((grand.match(/<td/g)||[]).length,(header.match(/<th\b/g)||[]).length);
  assert.match(grand,/<td>제품군 합계<\/td><td>5\.00<\/td><td>5\.00<\/td><td class="sku-v115-now v61-current">2\.50<\/td>/);
});

const packs=[28,100,300].flatMap((pack,i)=>[
 {date:'2026-09-30',vendor:A,productGroup:G2,material:`펙수클루정 10밀리그램 ${pack}T`,amount:(i+1)*1e8},
 {date:'2026-10-22',vendor:A,productGroup:G2,material:`펙수클루정 10밀리그램 ${pack}T`,amount:(i+1)*1e7},
 {date:'2026-10-22',vendor:B,productGroup:G2,material:`펙수클루정 10밀리그램 ${pack}T`,amount:(i+1)*2e7},
]);
test('pack variants aggregate every month while preserving SKU/vendor exports',()=>{
 const f=fixture({group:G2,rows:packs});
 const r=f.window.__SF_SKU_VENDOR_EXPORT.rows;
 const sum=r.find(x=>x[0]==='펙수클루정 10밀리그램 합계');
 assert.deepEqual(Array.from(sum.slice(1,8)),['포장단위 합계',6,6,1.8,-4.2,-4.2,30]);
 assert.equal(r.filter(x=>x[0]==='펙수클루정 10밀리그램 합계').length,1);
 for(const pack of [28,100,300])assert.ok(r.some(x=>x[0]===`펙수클루정 10밀리그램 ${pack}T`&&x[1]===A));
 assert.match(f.compare.innerHTML,/<tr hidden[^>]*data-sku-v121-ancestors="f\d+"[^>]*class="sku-v115-subtotal"/);
 assert.equal(r.find(x=>x[0]==='제품군 합계')[4],5.8);
});
test('single vendor retains pack expansion without duplicate vendor subtotals',()=>{
 const f=fixture({group:G2,vendor:A,rows:packs});
 const sum=f.window.__SF_SKU_VENDOR_EXPORT.rows.find(x=>x[0]==='펙수클루정 10밀리그램 합계');
 assert.deepEqual(Array.from(sum.slice(1,4)),[6,6,0.6]);
 assert.match(f.compare.innerHTML,/data-sku-v115-fold="f\d+"/);
 assert.doesNotMatch(f.compare.innerHTML,/SKU 소계|data-sku-v115-fold="s/);
});
console.log(`PRODUCT SELECTION: ${passed} behavioral checks passed`);
