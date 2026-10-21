(()=>{'use strict';
const $=s=>document.querySelector(s);
function addStyle(){if($('#kpiLayoutV37Style'))return;const s=document.createElement('style');s.id='kpiLayoutV37Style';s.textContent=`#cards{grid-template-columns:repeat(4,1fr)}.kpi-flow-summary{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:14px 16px;margin-top:-2px}.kpi-flow-row{background:#081827;border:1px solid #203a55;border-radius:11px;padding:12px 14px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}.kpi-flow-title{font-size:12px;font-weight:800;color:#4fd1c5;min-width:120px}.kpi-flow-main{font-size:14px;color:#eef6ff;line-height:1.55}.kpi-flow-main strong{font-size:16px;color:#fff}.kpi-flow-gap{margin-left:auto;font-size:13px;color:#91a9c1}.kpi-flow-gap strong{color:#ffb454;font-size:15px}@media(max-width:900px){#cards{grid-template-columns:repeat(2,minmax(0,1fr))}.kpi-flow-summary{grid-template-columns:1fr}.kpi-flow-gap{margin-left:0}}@media(max-width:650px){#cards{grid-template-columns:1fr}}`;document.head.appendChild(s)}
function num(txt){const m=String(txt||'').replace(/,/g,'').match(/-?[\d.]+/);return m?Number(m[0]):null}
const CARD_KEYS={'MBO 목표':'mbo','현재 누계':'current','현재 MBO 달성률':'mboRate','예상 마감':'forecast','예상 MBO 달성률':'forecastRate','기준일 목표 누계':'paceTarget','기준일 달성률':'paceRate','기준일 부족액':'paceBaseGap'};
function cardMap(){const o={};document.querySelectorAll('#cards .card').forEach(c=>{const l=c.querySelector('.label')?.textContent?.trim(),k=c.dataset.kpiKey||CARD_KEYS[l];if(k)o[k]=c;if(l)o[l]=c});return o}
function cloneCard(c,key,label,sub){if(!c)return null;const x=c.cloneNode(true);x.dataset.kpiKey=key;if(label)x.querySelector('.label').textContent=label;const description=x.querySelector('.sub')||x.querySelector('.sf-state-meta');if(sub!=null&&description)description.textContent=sub;return x}
function makeGapCard(key,label,value,sub,good){const c=document.createElement('div');c.className='card';c.dataset.kpiKey=key;c.innerHTML=`<div class="label">${label}</div><div class="value ${good?'good':'bad'}">${value}</div><div class="sub">${sub}</div>`;return c}
let busy=false,queued=false,engineGapBasis=null;
function text(el,value){if(!el)return false;const next=String(value);if(el.textContent===next)return false;el.textContent=next;return true}
function gapCard(card,value,sub){if(!card)return false;const v=card.querySelector('.value');let changed=text(v,value==null?'계산 대기':value.toFixed(1)+'억');changed=text(card.querySelector('.sub')||card.querySelector('.sf-state-meta'),sub)||changed;if(v){v.classList.remove('good','bad','warn','info');v.classList.add(value==null?'info':value===0?'good':'bad')}return changed}
function measures(m){
 const mbo=num(m.mbo.querySelector('.value')?.textContent),cur=num(m.current.querySelector('.value')?.textContent);
 const forecast=window.__SF_FORECAST_V81,month=$('#month')?.value;
 // The forecast engine owns collection/holiday/boundary calculations. Reuse its
 // completed result after its asynchronous update; this module only presents it.
 const hasForecast=forecast?.month===month&&Number.isFinite(forecast.goal)&&forecast.goal>0;
 const target=hasForecast?forecast.goal/1e8:num(m.paceTarget.querySelector('.value')?.textContent);
 const paceCurrent=hasForecast&&Number.isFinite(forecast.effectiveCurrent)?forecast.effectiveCurrent/1e8:cur;
 const mboGap=mbo!=null&&cur!=null?Math.max(0,mbo-cur):null;
 const basisKey=[month,cur,target].join('|');
 if(m.paceBaseGap)engineGapBasis={key:basisKey,gap:num(m.paceBaseGap.querySelector('.value')?.textContent)};
 const baseGap=engineGapBasis?.key===basisKey?engineGapBasis.gap:null;
 const paceGap=hasForecast&&paceCurrent!=null?Math.max(0,target-paceCurrent):baseGap!=null?baseGap:target!=null&&cur!=null?Math.max(0,target-cur):null;
 return{mbo,cur,target,paceCurrent,mboGap,paceGap,mboRate:mbo&&cur!=null?(cur/mbo*100).toFixed(1)+'%':'-',paceRate:target&&paceCurrent!=null?(paceCurrent/target*100).toFixed(1)+'%':'-'};
}
function apply(){
 if(busy)return;const cards=$('#cards');if(!cards)return;let m=cardMap();
 if(!m.mbo||!m.current||!m.mboRate||!m.forecast||!m.forecastRate||!m.paceTarget)return;
 const fresh=!!(m.paceRate&&m.paceBaseGap);
 if(!fresh&&(!m.mboGap||!m.paceGap))return;
 busy=true;
 try{
  const a=measures(m),{mbo,cur,target,paceCurrent,mboGap,paceGap,mboRate,paceRate}=a;let changed=false;
  const mboSub=mboGap==null?'목표·실적 확인 후 계산':mboGap>0?'현재 누계 대비 부족액':'MBO 이상 달성';
  const paceSub=paceGap==null?'기준 목표·실적 확인 후 계산':paceGap>0?'기준 누계 대비 부족액':'기준 이상 확보';
  if(fresh){
   const order=[cloneCard(m.mbo,'mbo'),cloneCard(m.current,'current'),cloneCard(m.mboRate,'mboRate'),makeGapCard('mboGap','MBO Gap',mboGap==null?'계산 대기':mboGap.toFixed(1)+'억',mboSub,mboGap===0),cloneCard(m.paceTarget,'paceTarget'),makeGapCard('paceGap','기준일 Gap',paceGap==null?'계산 대기':paceGap.toFixed(1)+'억',paceSub,paceGap===0),cloneCard(m.forecast,'forecast'),cloneCard(m.forecastRate,'forecastRate')].filter(Boolean);
   cards.replaceChildren(...order);m=cardMap();changed=true;
  }
  changed=gapCard(m.mboGap,mboGap,mboSub)||changed;changed=gapCard(m.paceGap,paceGap,paceSub)||changed;
  let sum=$('#kpiFlowSummary');if(!sum){sum=document.createElement('section');sum.id='kpiFlowSummary';sum.className='panel kpi-flow-summary';cards.insertAdjacentElement('afterend',sum);changed=true}
  const signature=JSON.stringify(a);
  if(sum.dataset.kpiSignature!==signature){
   sum.dataset.kpiSignature=signature;
   const adjusted=paceCurrent!=null&&cur!=null&&Math.abs(paceCurrent-cur)>.05;
   sum.innerHTML=`<div class="kpi-flow-row"><span class="kpi-flow-title">MBO 기준</span><span class="kpi-flow-main">${mbo==null?'-':mbo.toFixed(1)+'억'} → 현재 ${cur==null?'-':cur.toFixed(1)+'억'} → <strong>${mboRate}</strong></span><span class="kpi-flow-gap">Gap <strong>${mboGap==null?'-':mboGap.toFixed(1)+'억'}</strong></span></div><div class="kpi-flow-row"><span class="kpi-flow-title">오늘 기준 순도 목표</span><span class="kpi-flow-main">${target==null?'-':target.toFixed(1)+'억'} → ${adjusted?'보정 누계':'현재'} ${paceCurrent==null?'-':paceCurrent.toFixed(1)+'억'} → <strong>${paceRate}</strong></span><span class="kpi-flow-gap">Gap <strong>${paceGap==null?'-':paceGap.toFixed(1)+'억'}</strong></span></div>`;
   changed=true;
  }
  const oldHelp=sum.nextElementSibling;if(oldHelp?.querySelector?.('.help'))oldHelp.style.display='none';
  if(changed)window.dispatchEvent(new Event('sf-kpi-layout-updated'));
 }finally{busy=false}
}
function schedule(){if(queued)return;queued=true;setTimeout(()=>{queued=false;apply()},0)}
addStyle();const obs=new MutationObserver(schedule);const start=()=>{const c=$('#cards');if(c){obs.observe(c,{childList:true,subtree:true,characterData:true});apply()}else setTimeout(start,100)};
start();document.addEventListener('change',e=>{if(e.target?.id==='month')setTimeout(apply,30)});window.addEventListener('sf-settings-committed',()=>setTimeout(apply,30));
})();
