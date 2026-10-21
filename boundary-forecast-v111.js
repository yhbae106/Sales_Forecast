(()=>{'use strict';
const N=v=>Number(v||0),mean=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:0,clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
function robust(a){const x=(a||[]).filter(Number.isFinite).filter(v=>v>=0&&v<1.4).sort((p,q)=>p-q);if(!x.length)return 0;if(x.length>=5)return mean(x.slice(1,-1));if(x.length>=3)return x[Math.floor(x.length/2)];return mean(x)}
function conditionalProgress(vals,observedRatio){
 const x=(vals||[]).filter(Number.isFinite).filter(v=>v>=0&&v<1.4).sort((a,b)=>a-b);if(x.length<4)return robust(x);
 let gap=0,at=-1;for(let i=0;i<x.length-1;i++){const g=x[i+1]-x[i];if(g>gap){gap=g;at=i}}
 const base=robust(x);if(at<0||gap<Math.max(.035,base*.35))return base;
 const lo=x.slice(0,at+1),hi=x.slice(at+1),lm=mean(lo),hm=mean(hi);
 return Math.abs(observedRatio-lm)<=Math.abs(observedRatio-hm)?lm:hm;
}
function adjust(a){
 const current=N(a.current),mbo=N(a.mbo),recent=N(a.recentAvg),rawProgress=N(a.rawProgress),hist=(a.histProgress||[]).filter(Number.isFinite);
 const rawForecast=rawProgress>0?current/rawProgress:0;
 let anchor=mbo>0&&recent>0?mbo*.75+recent*.25:(mbo>0?mbo:(recent>0?recent:rawForecast));
 if(!(anchor>0))anchor=Math.max(current,rawForecast,1);
 const elapsed=Math.max(1,N(a.elapsedBiz)||1),totalBiz=Math.max(elapsed,N(a.totalBiz)||elapsed),remaining=Math.max(0,totalBiz-elapsed);
 const early=elapsed<=3,late=remaining<=1,observedRatio=anchor>0?current/anchor:0;
 let goalProgress=early?conditionalProgress(hist,observedRatio):robust(hist);
 if(!(goalProgress>0))goalProgress=rawProgress;
 let trust;if(elapsed<=1)trust=.05;else if(elapsed===2)trust=.16;else if(elapsed===3)trust=.34;else trust=Math.min(.92,.42+.5*(elapsed/Math.max(1,totalBiz)));
 const expected=anchor*goalProgress,anomaly=expected>0?current/expected:1;
 const prevClose=N(a.prevCloseRatio);
 const boundarySignal=early&&prevClose>.97&&prevClose<1.04&&(anomaly>1.22?'carry-in':anomaly<.78?'pull-forward':'boundary');
 if(early&&(anomaly>1.25||anomaly<.75))trust*=.55;
 let bounded=rawForecast>0?clamp(rawForecast,anchor*(early?.78:.68),anchor*(early?1.25:1.42)):anchor;
 let forecast=anchor*(1-trust)+bounded*trust;
 if(late&&mbo>0){
   const hit=current/mbo;
   if(hit>=.995)forecast=current;
   else if(hit>=.97)forecast=Math.max(current,Math.min(forecast,mbo*1.01));
   else forecast=Math.max(current,anchor*.32+bounded*.68);
 }
 forecast=Math.max(current,forecast);
 if(a.allClosed)forecast=current;
 let effectiveCurrent=current,paceTrust=1;
 if(early&&expected>0){
   paceTrust=elapsed===1?.16:elapsed===2?.38:.62;
   if(anomaly>1.25||anomaly<.75)paceTrust*=.75;
   effectiveCurrent=expected+(current-expected)*paceTrust;
 }
 const confidence=early?(elapsed===1?'낮음':elapsed===2?'보통-':'보통'):(late?'높음':'보통+');
 return{forecast,rawForecast,anchor,rawProgress,progressForGoal:goalProgress,effectiveCurrent,observedCurrent:current,expectedBoundary:expected,anomaly,trust,paceTrust,early,late,remaining,elapsed,totalBiz,boundarySignal,confidence,training:'2026-04~2026-09'};
}
window.__sfBoundaryAdjust=adjust;
window.__SF_BOUNDARY_MODEL_META={version:111,training:'2026-04~2026-09',method:'month-boundary shrinkage + regime progress + MBO/recent-close anchor',earlyWeights:[.05,.16,.34],mboWeight:.75,recentCloseWeight:.25};
})();