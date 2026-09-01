(()=>{'use strict';
const $=s=>document.querySelector(s),N=v=>Number(v||0),W=v=>(N(v)/1e8).toLocaleString('ko-KR',{minimumFractionDigits:1,maximumFractionDigits:1}),P=v=>Number.isFinite(v)?(v*100).toFixed(1)+'%':'-';
const STORE='sales_forecast_v16';
const DEFAULT_S={'2026-04':['2026-04-21','2026-04-24'],'2026-05':['2026-05-20','2026-05-26'],'2026-06':['2026-06-19','2026-06-24'],'2026-07':['2026-07-22','2026-07-27'],'2026-08':['2026-08-20','2026-08-25']};
function state(){try{const z=JSON.parse(localStorage.getItem(STORE)||localStorage.getItem('sales_forecast_v15')||'{}');return{mbo:z.mbo||{},sched:Object.assign({},DEFAULT_S,z.sched||{}),up:z.up||z.uploadRows||z.uploads||[]}}catch(e){return{mbo:{},sched:{...DEFAULT_S},up:window.__SF_SHARED_UPLOADS||[]}}}
function seed(){return(window.SEED_DATA?.dailyRecords||[]).map(r=>({d:r.date,a:N(r.amount)}))}
function all(){const z=state(),up=(z.up||[]).map(r=>({d:r.d||r.date,a:N(r.a??r.amount)})),rep=new Set(up.map(r=>r.d));return seed().filter(r=>!rep.has(r.d)).concat(up)}
const rows=m=>all().filter(r=>r.d&&r.d.slice(0,7)===m),sum=a=>a.reduce((s,r)=>s+N(r.a),0),total=m=>sum(rows(m));
function daily(m){const o={};rows(m).forEach(r=>o[r.d]=(o[r.d]||0)+N(r.a));return o}
function latest(m){return Object.keys(daily(m)).sort().at(-1)||null}
function biz(m){const[y,mo]=m.split('-').map(Number),a=[];for(let d=new Date(y,mo-1,1);d.getMonth()===mo-1;d.setDate(d.getDate()+1))if(d.getDay()!=0&&d.getDay()!=6)a.push(`${y}-${String(mo).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);return a}
function cum(m,d){let s=0;Object.entries(daily(m)).forEach(([x,v])=>{if(x<=d)s+=v});return s}
function months(){return[...new Set(all().map(r=>r.d?.slice(0,7)).filter(Boolean))].sort()}
function histMonths(cur){return months().filter(m=>m<cur&&total(m)>0).slice(-5)}
function posIndex(m,date){const b=biz(m);return Math.max(0,b.filter(x=>x<=date).length-1)}
function schedIndex(m,date){if(!date)return null;const b=biz(m),n=b.filter(x=>x<=date).length;return Math.max(0,Math.min(b.length-1,n-1))}
function inferredBounds(cur,hist,sched){const b=biz(cur),den=Math.max(1,b.length-1),ratios=[[],[]];hist.forEach(m=>{const hb=biz(m),s=sched[m]||[];[0,1].forEach(k=>{const ix=schedIndex(m,s[k]);if(ix!=null&&hb.length>1)ratios[k].push(ix/(hb.length-1))})});const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;let r1=avg(ratios[0]),r2=avg(ratios[1]);if(r1==null)r1=.55;if(r2==null)r2=.75;let a=Math.round(den*r1),c=Math.round(den*r2);a=Math.max(1,Math.min(b.length-3,a));c=Math.max(a+1,Math.min(b.length-2,c));return[a,c]}
function bounds(m,hist,sched){const b=biz(m),s=sched[m]||[],a=schedIndex(m,s[0]),c=schedIndex(m,s[1]);if(a!=null&&c!=null&&c>a)return[a,c];return inferredBounds(m,hist,sched)}
function phaseWithBounds(m,date,bnd){const b=biz(m),i=posIndex(m,date),a=bnd[0],c=bnd[1];return i<=a?[0,a?i/a:0]:i<=c?[1,(i-a)/Math.max(1,c-a)]:[2,(i-c)/Math.max(1,b.length-1-c)]}
function eqByPhase(m,ph,bnd){const b=biz(m),a=bnd[0],c=bnd[1];let i=ph[0]===0?Math.round(a*ph[1]):ph[0]===1?Math.round(a+(c-a)*ph[1]):Math.round(c+(b.length-1-c)*ph[1]);return b[Math.max(0,Math.min(b.length-1,i))]}
function progress(cur,date){if(!cur||!date)return 0;const z=state(),hist=histMonths(cur);if(!hist.length)return 0;const ph=phaseWithBounds(cur,date,bounds(cur,hist,z.sched)),vals=[];hist.forEach(h=>{const f=total(h);if(!f)return;const cut=eqByPhase(h,ph,bounds(h,hist,z.sched)),r=cum(h,cut)/f;if(Number.isFinite(r)&&r>=0&&r<1.4)vals.push(r)});return vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:0}
function cardMap(){const o={};document.querySelectorAll('#cards .card').forEach(c=>{const l=c.querySelector('.label')?.textContent?.trim();if(l)o[l]=c});return o}
function setCard(c,val,sub,cls){if(!c)return;const v=c.querySelector('.value'),s=c.querySelector('.sub');if(v){v.textContent=val;v.classList.remove('good','warn','bad','info');if(cls)v.classList.add(cls)}if(s&&sub!=null)s.textContent=sub}
let busy=false;
function patch(){if(busy)return;busy=true;try{const m=$('#month')?.value||'',d=latest(m);if(!m||!d)return;const z=state(),M=z.mbo[m]==null?N($('#mbo')?.value)*1e8:N(z.mbo[m])*1e8,cur=total(m);if(!M)return;const p=progress(m,d);if(!(p>0))return;const goal=M*p,fc=cur/p,cm=cardMap();
setCard(cm['기준일 목표 누계'],W(goal)+'억','4~8월 확정 실적의 동일 수금 진행위치 평균','info');setCard(cm['기준일 달성률'],P(cur/goal),'실제 누계 ÷ 기준 목표',cur>=goal?'good':'bad');setCard(cm['기준일 부족액'],W(Math.max(0,goal-cur))+'억',cur<goal?'추가 필요':'기준 이상',cur>=goal?'good':'bad');setCard(cm['예상 마감'],W(fc)+'억','4~8월 동일 수금 진행위치 기준','good');setCard(cm['예상 MBO 달성률'],P(fc/M),'예상마감 ÷ MBO',fc>=M?'good':'warn');
const dt=$('#dailyTable');if(dt){dt.querySelectorAll('tbody tr').forEach(tr=>{const td=tr.children;if(td.length<6)return;const day=td[0].textContent.trim(),pp=progress(m,day);if(!(pp>0))return;const g=M*pp,actual=Number(String(td[2].textContent).replace(/,/g,''))*1e8;if(Number.isFinite(actual)){td[3].textContent=W(g);td[4].textContent=P(actual/g);const gap=g-actual;td[5].className=gap>0?'bad':'good';td[5].textContent=gap>0?'부족 '+W(gap):'초과 '+W(Math.abs(gap))}})}
window.__SF_FORECAST_V81={month:m,date:d,progress:p,goal,forecast:fc,historicalMonths:histMonths(m)};window.dispatchEvent(new CustomEvent('sf-forecast-v81-updated',{detail:window.__SF_FORECAST_V81}));
}catch(e){console.error('forecast-progress-v81',e)}finally{busy=false}}
const obs=new MutationObserver(()=>setTimeout(patch,0));function start(){const c=$('#cards');if(!c)return setTimeout(start,100);obs.observe(c,{childList:true,subtree:true,characterData:true});const d=$('#dailyTable');if(d)obs.observe(d,{childList:true,subtree:true,characterData:true});patch()}start();document.addEventListener('change',e=>{if(['month','mbo','first','second'].includes(e.target?.id))setTimeout(patch,30)});document.addEventListener('input',e=>{if(['mbo','first','second'].includes(e.target?.id))setTimeout(patch,30)});setTimeout(patch,800);setTimeout(patch,1800);
})();