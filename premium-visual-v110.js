(()=>{'use strict';
if(document.getElementById('sfPremiumVisualV110Style'))return;
const css=[
':root{--sf-lux-bg:rgba(7,15,27,.72);--sf-lux-line:rgba(148,163,184,.16)}',
'#cards .card{isolation:isolate;transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease!important}',
'#cards .card:hover{transform:translateY(-2px);box-shadow:0 15px 38px rgba(2,6,23,.28),inset 0 1px rgba(255,255,255,.035)!important}',
'#cards .card:after{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(circle at 88% 15%,rgba(255,255,255,.055),transparent 34%);opacity:.9}',
'#cards .card.sf-card-tone-positive:after{background:radial-gradient(circle at 88% 12%,rgba(52,211,153,.16),transparent 35%)}',
'#cards .card.sf-card-tone-caution:after{background:radial-gradient(circle at 88% 12%,rgba(250,204,21,.13),transparent 35%)}',
'#cards .card.sf-card-tone-warning:after{background:radial-gradient(circle at 88% 12%,rgba(251,146,60,.14),transparent 35%)}',
'#cards .card.sf-card-tone-negative:after{background:radial-gradient(circle at 88% 12%,rgba(251,113,133,.16),transparent 35%)}',
'#cards .card.sf-card-tone-info:after{background:radial-gradient(circle at 88% 12%,rgba(96,165,250,.13),transparent 35%)}',
'.sf-premium-card-top{position:absolute;right:13px;top:12px;display:flex;align-items:center;gap:5px;z-index:2}',
'.sf-premium-status{display:inline-flex;align-items:center;gap:5px;padding:4px 7px;border-radius:999px;border:1px solid rgba(148,163,184,.16);background:rgba(8,15,27,.62);backdrop-filter:blur(8px);font-size:8.5px;font-weight:900;letter-spacing:.02em;color:#94A3B8;box-shadow:0 5px 16px rgba(2,6,23,.16)}',
'.sf-premium-status i{display:grid;place-items:center;width:13px;height:13px;border-radius:50%;font-style:normal;font-size:7px;font-weight:950;background:rgba(148,163,184,.10)}',
'.sf-premium-status.positive{color:#A7F3D0;border-color:rgba(52,211,153,.22);background:rgba(6,45,39,.55)}.sf-premium-status.positive i{background:rgba(52,211,153,.18);color:#6EE7B7}',
'.sf-premium-status.caution{color:#FEF08A;border-color:rgba(250,204,21,.23);background:rgba(54,43,8,.54)}.sf-premium-status.caution i{background:rgba(250,204,21,.15);color:#FDE047}',
'.sf-premium-status.warning{color:#FED7AA;border-color:rgba(251,146,60,.24);background:rgba(59,34,13,.55)}.sf-premium-status.warning i{background:rgba(251,146,60,.16);color:#FDBA74}',
'.sf-premium-status.negative{color:#FECDD3;border-color:rgba(251,113,133,.25);background:rgba(61,23,35,.55)}.sf-premium-status.negative i{background:rgba(251,113,133,.17);color:#FDA4AF}',
'.sf-premium-status.info{color:#BFDBFE;border-color:rgba(96,165,250,.23);background:rgba(20,43,77,.53)}.sf-premium-status.info i{background:rgba(96,165,250,.16);color:#93C5FD}',
'#cards .card .value{padding-right:66px;position:relative;z-index:1;font-variant-numeric:tabular-nums lining-nums}',
'.sf-premium-meter{position:absolute;left:18px;right:18px;bottom:12px;height:3px;border-radius:999px;background:rgba(148,163,184,.10);overflow:hidden;opacity:.92}',
'.sf-premium-meter>i{display:block;height:100%;width:var(--sf-meter,0%);border-radius:inherit;background:#64748B;box-shadow:0 0 10px currentColor;transition:width .35s ease}',
'.sf-card-tone-positive .sf-premium-meter>i{background:#34D399}.sf-card-tone-caution .sf-premium-meter>i{background:#FACC15}.sf-card-tone-warning .sf-premium-meter>i{background:#FB923C}.sf-card-tone-negative .sf-premium-meter>i{background:#FB7185}.sf-card-tone-info .sf-premium-meter>i{background:#60A5FA}',
'#cards .card:has(.sf-premium-meter){padding-bottom:24px!important}',
'.table td.sf-tone-positive,.table td.sf-tone-caution,.table td.sf-tone-warning,.table td.sf-tone-negative{position:relative;padding-left:25px!important;font-variant-numeric:tabular-nums}',
'.table td.sf-tone-positive:before,.table td.sf-tone-negative:before,.table td.sf-tone-caution:before,.table td.sf-tone-warning:before{position:absolute;left:8px;top:50%;transform:translateY(-50%);display:grid;place-items:center;width:12px;height:12px;border-radius:4px;font-size:7px;font-weight:950;line-height:1}',
'.table td.sf-tone-positive:before{content:"▲";color:#6EE7B7;background:rgba(52,211,153,.11)}',
'.table td.sf-tone-negative:before{content:"▼";color:#FDA4AF;background:rgba(251,113,133,.11)}',
'.table td.sf-tone-caution:before{content:"•";color:#FDE047;background:rgba(250,204,21,.10)}',
'.table td.sf-tone-warning:before{content:"!";color:#FDBA74;background:rgba(251,146,60,.11)}',
'.table td.sf-tone-info{font-variant-numeric:tabular-nums}',
'.kpi-flow-row{position:relative;overflow:hidden!important;background:linear-gradient(135deg,rgba(15,23,42,.76),rgba(11,24,39,.86))!important;border-color:rgba(148,163,184,.14)!important;box-shadow:inset 0 1px rgba(255,255,255,.025),0 7px 20px rgba(2,6,23,.10)}',
'.kpi-flow-row:after{content:"";position:absolute;right:-25px;top:-35px;width:110px;height:110px;border-radius:50%;background:radial-gradient(circle,rgba(56,189,248,.08),transparent 66%);pointer-events:none}',
'.kpi-flow-main strong{display:inline-flex;align-items:center;gap:5px;padding:2px 6px;border-radius:6px;background:rgba(15,23,42,.46)}',
'.kpi-flow-main strong.sf-tone-positive:before{content:"▲";font-size:8px}.kpi-flow-main strong.sf-tone-negative:before{content:"▼";font-size:8px}.kpi-flow-main strong.sf-tone-caution:before{content:"●";font-size:6px}.kpi-flow-main strong.sf-tone-warning:before{content:"!";font-size:8px}',
'.sf-radar-kpi{position:relative;overflow:hidden;background:linear-gradient(145deg,rgba(15,23,42,.58),rgba(11,23,38,.74))!important;box-shadow:inset 0 1px rgba(255,255,255,.025)}',
'.sf-radar-kpi:after{content:"";position:absolute;right:-22px;top:-26px;width:88px;height:88px;border-radius:50%;background:radial-gradient(circle,rgba(96,165,250,.09),transparent 65%);pointer-events:none}',
'.sf-radar-kpi .v{display:flex;align-items:center;gap:7px}.sf-radar-kpi .v.sf-tone-positive:before{content:"▲";font-size:9px}.sf-radar-kpi .v.sf-tone-negative:before{content:"▼";font-size:9px}.sf-radar-kpi .v.sf-tone-caution:before{content:"●";font-size:7px}.sf-radar-kpi .v.sf-tone-warning:before{content:"!";font-size:9px}',
'.sf-radar-signal{box-shadow:inset 0 0 0 1px rgba(255,255,255,.025),0 4px 11px rgba(2,6,23,.12)}',
'.sf-semantic-legend{padding:6px 8px;border:1px solid rgba(148,163,184,.10);border-radius:10px;background:linear-gradient(90deg,rgba(15,23,42,.18),rgba(15,23,42,.38));backdrop-filter:blur(8px)}',
'.sf-semantic-chip{transition:transform .15s ease,border-color .15s ease}.sf-semantic-chip:hover{transform:translateY(-1px);border-color:rgba(148,163,184,.25)}',
'@media(max-width:1100px){#cards .card .value{padding-right:54px}.sf-premium-status{font-size:8px;padding:3px 6px}.sf-premium-status i{width:12px;height:12px}}',
'@media(max-width:650px){.sf-premium-card-top{right:10px;top:10px}.sf-premium-status span{display:none}#cards .card .value{padding-right:28px}.sf-premium-meter{left:14px;right:14px}.table td.sf-tone-positive,.table td.sf-tone-caution,.table td.sf-tone-warning,.table td.sf-tone-negative{padding-left:22px!important}}'
].join('');
const style=document.createElement('style');style.id='sfPremiumVisualV110Style';style.textContent=css;document.head.appendChild(style);

const toneOf=el=>['positive','caution','warning','negative','info','neutral'].find(t=>el?.classList?.contains('sf-tone-'+t))||'neutral';
const status={positive:['▲','양호'],caution:['•','주의'],warning:['!','경고'],negative:['▼','위험'],info:['◆','기준'],neutral:['·','중립']};
function num(text){const m=String(text||'').replace(/,/g,'').match(/[+-]?\d+(?:\.\d+)?/);return m?Number(m[0]):null}
function pct(text){return String(text||'').includes('%')?num(text):null}
function enrichCards(){
 const cards=[...document.querySelectorAll('#cards .card')];
 const values={};cards.forEach(c=>{values[c.dataset.kpiKey||c.querySelector('.label')?.textContent?.trim()]=num(c.querySelector('.value')?.textContent)});
 const mbo=values.mbo??values['MBO 목표'],pace=values.paceTarget??values['기준일 목표 누계'];
 cards.forEach(c=>{
   const v=c.querySelector('.value');if(!v)return;const tone=toneOf(v),pair=status[tone]||status.neutral;
   let top=c.querySelector('.sf-premium-card-top');if(!top){top=document.createElement('div');top.className='sf-premium-card-top';c.appendChild(top)}
   top.innerHTML='<span class="sf-premium-status '+tone+'"><i>'+pair[0]+'</i><span>'+pair[1]+'</span></span>';
   const key=c.dataset.kpiKey||c.querySelector('.label')?.textContent?.trim()||'',pv=pct(v.textContent);let meter=null;
   if(pv!=null)meter=Math.max(0,Math.min(100,pv));
   else if(key==='current'||key==='현재 누계'){const x=num(v.textContent);if(Number.isFinite(x)&&Number.isFinite(mbo)&&mbo>0)meter=Math.min(100,x/mbo*100)}
   else if(key==='forecast'||key==='예상 마감'){const x=num(v.textContent);if(Number.isFinite(x)&&Number.isFinite(mbo)&&mbo>0)meter=Math.min(100,x/mbo*100)}
   else if(key==='mboGap'||key==='MBO Gap'){const x=num(v.textContent);if(Number.isFinite(x)&&Number.isFinite(mbo)&&mbo>0)meter=Math.max(0,100-Math.min(100,x/mbo*100))}
   else if(key==='paceGap'||key==='기준일 Gap'){const x=num(v.textContent);if(Number.isFinite(x)&&Number.isFinite(pace)&&pace>0)meter=Math.max(0,100-Math.min(100,x/pace*100))}
   let bar=c.querySelector('.sf-premium-meter');
   if(meter==null){bar?.remove()}else{if(!bar){bar=document.createElement('div');bar.className='sf-premium-meter';bar.innerHTML='<i></i>';c.appendChild(bar)}bar.style.setProperty('--sf-meter',meter.toFixed(1)+'%')}
 })
}
function refineLegend(){const l=document.getElementById('sfSemanticLegend');if(!l||l.dataset.premium==='1')return;l.dataset.premium='1';const ttl=l.querySelector('.ttl');if(ttl)ttl.textContent='STATUS SIGNAL'}
function apply(){enrichCards();refineLegend()}
let pending=false;function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;apply()})}
const obs=new MutationObserver(schedule);const boot=()=>{if(!document.body)return setTimeout(boot,50);obs.observe(document.body,{subtree:true,childList:true,characterData:true});schedule()};boot();
['sf-core-ready','sf-kpi-layout-updated','sf-settings-committed','sf-data-refreshed','sf-v61-ready','sf-radar-rendered','sf-group-mbo-committed','sf-vendor-gap-updated'].forEach(e=>window.addEventListener(e,schedule));
document.addEventListener('change',e=>{if(['month','mbo','groupMbo','groupTarget'].includes(e.target?.id))setTimeout(schedule,40)},true);
setTimeout(schedule,250);setTimeout(schedule,1000);window.__SF_PREMIUM_VISUAL_V110=true;
})();