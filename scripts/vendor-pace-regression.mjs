import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const BK='백제약품영등포지점', NEW='신규업체';
const row=(d,v,a)=>({date:d,vendor:v,amount:a});
const historic=[row('2026-10-02',BK,40e8),row('2026-10-09',BK,40e8),row('2026-10-19',BK,50e8),row('2026-10-30',BK,70e8)];
const current=[row('2026-11-02',BK,35e8),row('2026-11-04',BK,25e8),row('2026-11-04',NEW,2e8)];
const month={value:'2026-11'},paragraph={innerHTML:''},scroller={scrollLeft:0,scrollWidth:1800};
const table={innerHTML:'',dataset:{},classList:{add(){}},style:{setProperty(){}},closest:q=>q==='.table'?scroller:{querySelector:()=>paragraph}};
const document={querySelector:q=>q==='#month'?month:q==='#vendorTable'?table:null,addEventListener(){}};
const window={SEED_DATA:{dailyRecords:[...historic,...current],krHolidays2026:{'2026-11-06':'Test holiday'},customHolidaysByMonth:{}},
 SFDataReliability:{sourceAsOfDate:()=> '2026-11-09'},__sfSharedMeta:{sourceFiles:[{month:'2026-11',uploadDate:'2026-11-09'}]},
 addEventListener(){},dispatchEvent(){}};
const localStorage={getItem:()=>null};
const code=fs.readFileSync(new URL('../upper-history-v39.js',import.meta.url),'utf8').replace('setTimeout(render,650);','window.__testRenderVendor=renderVendor;window.__testSigned=signed;window.__testDeltaTone=deltaTone;');
vm.runInNewContext(fs.readFileSync(new URL('../sales-pace.js',import.meta.url),'utf8'),{window});
vm.runInNewContext(code,{document,window,localStorage,setTimeout(){},requestAnimationFrame:fn=>fn(),Date,Math,Number,String,JSON,Set,Map,Object,Array,Intl,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail}}});
const hist=['2026-10'],ctx=window.__sfVendorPaceContext('2026-11',hist),metrics=window.__sfVendorPaceMetrics;
assert.equal(ctx.asOf,'2026-11-09','must use upload date even when latest sale is earlier');
assert.equal(ctx.last,'2026-11-04');
assert.equal(ctx.elapsed,5,'Nov 6 holiday and weekend must be excluded');
assert.ok(ctx.cuts['2026-10'].startsWith('2026-10-'),'historical cutoff must be a matching working day');
assert.equal(window.__sfVendorPaceContext('2026-11',hist),ctx,'identical contexts must be cached');
const x=metrics(BK,'2026-11',hist,hist,ctx);
assert.equal(x.now,60e8);assert.equal(x.avg,200e8,'confirmed-month full average must remain intact');
assert.ok(x.expected>0&&x.expected<200e8,'the reference must be a historical same-progress cumulative, not the final close');
assert.equal(x.rate,x.now/x.expected);assert.equal(x.prevDiff,x.now-x.expected);
assert.equal(x.avgDiff,x.now-x.expected);
assert.ok(x.rate>=1,'a good current-period pace must be green, despite full-month ratio being below 100%');
const newbie=metrics('신규업체','2026-11',hist,hist,ctx);
assert.equal(newbie.rate,null,'no historical benchmark must be neutral, not fake 0/100 percent');
assert.equal(metrics(BK,'2026-11',[],[],window.__sfVendorPaceContext('2026-11',[])).rate,null,'no history must be neutral');
window.__testRenderVendor();
assert.match(table.innerHTML,/기준일 대비 매출률/);
assert.match(table.innerHTML,/기준일 기대 누계/);
assert.match(table.innerHTML,/전월 동일시점 대비 증감/);
assert.match(table.innerHTML,/확정월 동일시점 대비 증감/);
assert.match(table.innerHTML,/v39-rate-good/);
assert.match(table.innerHTML,/v39-rate-neutral/);
assert.match(paragraph.innerHTML,/2026\.11\.09/);
const pace = window.SFSalesPace;
for (const view of ['vendor','group','noTarget','sku']) {
  for (const [rate,label,tone] of [[.9996,'99.96%','bad'],[.99999,'99.999%','bad'],[.9994,'99.9%','bad'],[0,'0.0%','bad'],[1,'100.0%','good'],[1.001,'100.1%','good'],[null,'—','neutral']]) {
    const html=pace.cell(rate,view);
    const expected=view==='vendor'?'v39-rate-'+tone:{bad:'v61-neg',good:'v61-pos',neutral:'v61-neutral'}[tone];
    assert.ok(html.includes(expected) && html.includes(label),view+' '+rate+' '+html);
    const raw=/data-sf-rate="([^"]*)"/.exec(html)[1];
    assert.equal(pace.readCell({dataset:{sfRate:raw}}),rate==null?null:rate*100);
  }
}
assert.equal(pace.readCell({dataset:{}}),undefined,'ordinary worksheet cells keep their own units');
const sheet={'!ref':'A1:A4',A2:{t:'n',v:99.96},A3:{t:'n',v:100},A4:{t:'n',v:99.9999}};
pace.formatWorksheet(sheet,['기준일 대비 매출률 (%)'],{utils:{decode_range:()=>({e:{r:3}}),encode_cell:({r})=>'A'+(r+1)}});
assert.equal(sheet.A2.v,99.96);
assert.match(sheet.A2.z,/0\.00"%"/);
assert.match(sheet.A3.z,/\[Green\]\[>=100\]0\.0"%"[^;]*;\[Red\]/);
assert.match(sheet.A4.z,/0\.0000"%"/);
assert.equal(window.__testSigned(-0.01e8),'0.0','no negative zero');
assert.equal(window.__testDeltaTone(-0.01e8),'v39-rate-neutral','rounded-zero differences must stay neutral');
const total=metrics('','2026-11',hist,hist,ctx),subtotal=metrics('백제약품 전체 합계','2026-11',hist,hist,ctx);
assert.equal(total.now,62e8);assert.equal(subtotal.now,60e8);
assert.equal(total.expected,subtotal.expected,'outside vendor with no historic sales must not distort historical expectation');
console.log('VENDOR PACE PASS: cutoff, holidays, same-stage baseline, signs, zero history, totals, UI');