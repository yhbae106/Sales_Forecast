import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=name=>fs.readFileSync(new URL('../'+name,import.meta.url),'utf8');
let checks=0;
function test(name,run){run();checks++;console.log('NAVIGATION OK:',name);}

function layoutRuntime(){
  const handlers={},events={},rows=['릭시아나군','펙수클루군','ABC군'].map(name=>({dataset:{v61Group:name},hidden:false}));
  const input={value:'',focus:()=>{}},count={textContent:''},clear={hidden:true},note={hidden:true,textContent:''};
  const nodes={'#sfGroupSearch':input,'#sfGroupSearchCount':count,'#sfGroupSearchClear':clear,'#sfGroupSearchEmpty':note};
  const document={querySelector:s=>nodes[s]||null,querySelectorAll:s=>s==='#groupTable tbody tr[data-v61-group]'?rows:[],addEventListener:(name,fn)=>(handlers[name]||(handlers[name]=[])).push(fn)};
  const window={addEventListener:(name,fn)=>(events[name]||(events[name]=[])).push(fn),matchMedia:()=>({matches:true})};
  vm.runInNewContext(read('final-layout-v53.js'),{window,document,requestAnimationFrame:fn=>fn(),Event:class{constructor(type){this.type=type}}});
  return{input,count,clear,note,rows,nodes,handlers,events,type:value=>{input.value=value;handlers.input.forEach(fn=>fn({target:{id:'sfGroupSearch'}}));},click:target=>handlers.click.forEach(fn=>fn({target}))};
}

test('product search filters displayed names while preserving underlying rows',()=>{
  const r=layoutRuntime();r.type('릭시아나');
  assert.deepEqual(r.rows.map(x=>x.hidden),[false,true,true]);
  assert.match(r.count.textContent,/1 \/ 3개 제품군/);
  assert.equal(r.rows.length,3);assert.equal(r.clear.hidden,false);
  r.type(' ａｂｃ ');assert.deepEqual(r.rows.map(x=>x.hidden),[true,true,false]);
});

test('no-match search is explained and clearing restores all groups',()=>{
  const r=layoutRuntime();r.type('없는제품군');
  assert.equal(r.note.hidden,false);assert.match(r.note.textContent,/검색 결과가 없습니다/);
  r.click({closest:s=>s==='#sfGroupSearchClear'?{}:null});
  assert.equal(r.input.value,'');assert.ok(r.rows.every(x=>!x.hidden));
  assert.equal(r.note.hidden,true);assert.equal(r.clear.hidden,true);
});

test('search is reapplied when the product renderer replaces rows after sorting',()=>{
  const r=layoutRuntime();r.type('릭시아나');
  r.rows[0]={dataset:{v61Group:'펙수클루군'},hidden:false};
  r.rows[1]={dataset:{v61Group:'릭시아나군'},hidden:false};
  r.nodes['#groupTable']={closest:()=>({querySelector:()=>({})})};
  r.events['sf-product-table-rendered'].forEach(fn=>fn());
  assert.deepEqual(r.rows.map(x=>x.hidden),[true,false,true]);
});

test('SKU shortcut scrolls and transfers keyboard focus while respecting reduced motion',()=>{
  const r=layoutRuntime();let scroll,focus;
  r.nodes['#v51CompareTable']={closest:()=>({scrollIntoView:o=>scroll=o,focus:o=>focus=o})};
  r.click({closest:s=>s==='[data-sf-jump]'?{dataset:{sfJump:'sku'}}:null});
  assert.equal(scroll.behavior,'auto');assert.equal(scroll.block,'start');assert.equal(focus.preventScroll,true);
});

function exporter(){
  const window={},document={querySelector:()=>null,querySelectorAll:()=>[],getElementById:()=>null,head:{appendChild:()=>{}},createElement:()=>({}),body:{}};
  const source=read('export-v21.js').replace(/\n\}\)\(\);\s*$/,'\nwindow.testTableAOA=tableAOA;\n})();');
  vm.runInNewContext(source,{window,document,MutationObserver:class{observe(){}},setTimeout:()=>1,clearTimeout:()=>{}});
  return window.testTableAOA;
}
const row=(name,hidden=false,searchHidden)=>({hidden,dataset:searchHidden===undefined?{}:{sfSearchHidden:searchHidden},cells:[{innerText:name},{innerText:'1.5'}]});
test('Excel uses the visible product search result and retains numeric cells',()=>{
  const result=exporter()({rows:[row('제품군'),row('릭시아나군',false,'false'),row('펙수클루군',true,'true')]});
  assert.equal(result.length,2);assert.equal(result[1][0],'릭시아나군');assert.equal(result[1][1],1.5);
});
test('collapsed SKU vendor details are still included in Excel',()=>{
  const result=exporter()({rows:[row('SKU 소계'),row('접힌 업체 상세',true)]});
  assert.equal(result.length,2);assert.equal(result[1][0],'접힌 업체 상세');
});
console.log(`Navigation and export regressions passed (${checks} scenarios).`);
