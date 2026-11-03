(()=>{'use strict';
// Historical progress is aligned to collection-statement dates and Korean business days
// by forecast-progress-v81.js. This layer models the operating close policy, not booked sales.
const EOK=1e8,MAX_CLOSE=300*EOK;
const N=v=>Number.isFinite(Number(v))?Number(v):0;
const mean=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:0;
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
function median(a){const x=a.filter(Number.isFinite).slice().sort((p,q)=>p-q);const n=x.length;return n?(n%2?x[(n-1)/2]:(x[n/2-1]+x[n/2])/2):0}
function quantile(a,p){const x=a.filter(Number.isFinite).slice().sort((v,w)=>v-w);if(!x.length)return 0;const k=(x.length-1)*clamp(p,0,1),i=Math.floor(k);return x[i]+(x[Math.min(i+1,x.length-1)]-x[i])*(k-i)}
function robust(a){const x=(a||[]).filter(Number.isFinite).filter(v=>v>=0&&v<1.4).sort((p,q)=>p-q);if(!x.length)return 0;if(x.length>=5)return mean(x.slice(1,-1));if(x.length>=3)return median(x);return mean(x)}
function conditionalProgress(vals,observedRatio){
 const x=(vals||[]).filter(Number.isFinite).filter(v=>v>=0&&v<1.4).sort((a,b)=>a-b);
 if(x.length<4)return robust(x);
 let gap=0,at=-1;for(let i=0;i<x.length-1;i++){const g=x[i+1]-x[i];if(g>gap){gap=g;at=i}}
 const base=robust(x);if(at<0||gap<Math.max(.035,base*.35))return base;
 const lo=x.slice(0,at+1),hi=x.slice(at+1),lm=mean(lo),hm=mean(hi);
 return Math.abs(observedRatio-lm)<=Math.abs(observedRatio-hm)?lm:hm;
}
function adjust(a){
 const current=Math.max(0,N(a.current)),mbo=Math.max(0,N(a.mbo)),recent=N(a.recentAvg);
 const rawProgress=N(a.rawProgress),hist=(a.histProgress||[]).filter(Number.isFinite);
 const rawForecast=rawProgress>0?current/rawProgress:0;
 // Include all positive completed historical months; a prior lower bound would bias the baseline.
 const samples=(a.historySamples||[]).filter(s=>Number.isFinite(Number(s.close))&&N(s.close)>0);
 const historicalCenter=median(samples.map(s=>N(s.close)));
 const recentClose=recent>0?recent:0;
 const historicalAnchor=historicalCenter&&recentClose?historicalCenter*.7+recentClose*.3:(historicalCenter||recentClose);
 const mboAnchor=mbo>0?mbo:0;
 let anchor=historicalAnchor&&mboAnchor?historicalAnchor*.7+mboAnchor*.3:(historicalAnchor||mboAnchor||Math.max(current,rawForecast));
 if(!(anchor>0))anchor=Math.max(current,rawForecast,1);
 const elapsed=Math.max(1,N(a.elapsedBiz)||1),totalBiz=Math.max(elapsed,N(a.totalBiz)||elapsed);
 const remaining=Math.max(0,totalBiz-elapsed),early=elapsed<=3,late=remaining<=1;
 const observedRatio=anchor>0?current/anchor:0;
 let goalProgress=early?conditionalProgress(hist,observedRatio):robust(hist);
 if(!(goalProgress>0))goalProgress=rawProgress;
 let trust=elapsed<=1?.05:elapsed===2?.16:elapsed===3?.34:Math.min(.96,.42+.52*(elapsed/Math.max(1,totalBiz)));
 const expected=anchor*goalProgress,anomaly=expected>0?current/expected:1;
 const priorClose=N(a.prevMonthClose),nearPriorCeiling=priorClose>=MAX_CLOSE*.96&&priorClose<=MAX_CLOSE*1.04;
 const carryInPossible=early&&nearPriorCeiling&&anomaly>1.22;
 if(early&&(anomaly>1.25||anomaly<.75))trust*=.55;
 const bounded=rawForecast>0?clamp(rawForecast,anchor*(early?.78:.68),anchor*(early?1.25:1.42)):anchor;
 let grossForecast=anchor*(1-trust)+bounded*trust;
 // Same collection-stage residual sales capture late invoice and month-end spikes.
 const futureSales=samples.map(s=>Math.max(0,N(s.remaining))).filter(Number.isFinite);
 const typicalRemaining=median(futureSales);
 if(futureSales.length>=2&&!early&&remaining>0){
   const weight=remaining<=2?.50:.20;
   grossForecast=grossForecast*(1-weight)+(current+typicalRemaining)*weight;
 }
 let forecast=Math.max(current,grossForecast),rolloverPotential=0,ruleApplied='normal';
 if(a.allClosed||remaining===0){
   forecast=current;ruleApplied=a.allClosed?'closed':'end-of-business-month';
 }else if(current>MAX_CLOSE){
   // Already-booked sales are facts; never clip or move them into another month.
   forecast=current;ruleApplied='actual-above-ceiling';
 }else if(forecast>MAX_CLOSE){
   // Hypothetical demand beyond the 300eok planning ceiling may move to the next month.
   // This is a forecasting scenario only, not an order or sales-data mutation.
   rolloverPotential=forecast-MAX_CLOSE;
   forecast=MAX_CLOSE;ruleApplied='possible-next-month-rollover';
 }
 let effectiveCurrent=current,paceTrust=1;
 if(early&&expected>0){
   paceTrust=elapsed===1?.16:elapsed===2?.38:.62;
   if(anomaly>1.25||anomaly<.75)paceTrust*=.75;
   effectiveCurrent=expected+(current-expected)*paceTrust;
 }
 const confidence=early?(elapsed===1?'낮음':elapsed===2?'보통-':'보통'):(late?'높음':'보통+');
 return{forecast,rawForecast,grossForecast,anchor,rawProgress,progressForGoal:goalProgress,
  effectiveCurrent,observedCurrent:current,expectedBoundary:expected,anomaly,trust,paceTrust,
  early,late,remaining,elapsed,totalBiz,carryInPossible,rolloverPotential,
  operatingMax:MAX_CLOSE,ruleApplied,
  historicalCenter,historicalRemainder:typicalRemaining,historicalSampleCount:samples.length,
  boundarySignal:carryInPossible?'carry-in-possible':(early?'boundary':'normal'),confidence};
}
window.__sfBoundaryAdjust=adjust;
window.__SF_BOUNDARY_MODEL_META={version:114,method:'collection-stage historical pace + robust close anchor + 300eok planning ceiling + optional next-month rollover',operatingMax:MAX_CLOSE,rollover:'forecast-only scenario, not booked sales or confirmed orders'};
})();
