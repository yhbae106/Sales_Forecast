(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root){root.SFDataReliability=api;if(root.document)api.install(root);}
})(typeof window==='undefined'?null:window,function(){
  'use strict';
  const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
  const clone=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v));
  const dateOf=r=>String(r.d||r.date||'');
  const amountOf=r=>r.a??r.amount;
  const validDate=d=>/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;
  function same(a,b){
    if(a===b)return true;
    if(Array.isArray(a)&&Array.isArray(b))return a.length===b.length&&a.every((v,i)=>same(v,b[i]));
    if(object(a)&&object(b)){const ak=Object.keys(a),bk=Object.keys(b);return ak.length===bk.length&&ak.every(k=>Object.hasOwn(b,k)&&same(a[k],b[k]));}
    return false;
  }
  function monthSummary(shared,month){
    const rows=(shared.uploads||[]).filter(r=>!month||dateOf(r).slice(0,7)===month);
    const dates=[...new Set(rows.map(dateOf))].sort();
    return {first:dates[0]||'',last:dates.at(-1)||'',total:rows.reduce((s,r)=>s+Number(amountOf(r)),0),dateCount:dates.length,rowCount:rows.length};
  }
  function lastDataDate(shared){return monthSummary(shared||{}).last;}
  function koreaDate(value=Date.now()){
    try{
      const d=new Date(value);if(!Number.isFinite(d.getTime()))return'';
      const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
      const out=parts.year+'-'+parts.month+'-'+parts.day;return validDate(out)?out:'';
    }catch(e){return''}
  }
  function fileDate(fileName){
    const m=String(fileName||'').trim().match(/^(\d{2})(\d{2})(\d{2})(?:\D|$)/);if(!m)return'';
    const out='20'+m[1]+'-'+m[2]+'-'+m[3];return validDate(out)?out:'';
  }
  function sourceAsOfDate(shared,month,fallback=''){
    const m=month||String(fallback||'').slice(0,7),last=fallback||monthSummary(shared||{},m).last;if(!m)return last||'';
    const sources=(shared?.sourceFiles||[]).filter(s=>(s.month||String(s.lastDate||s.date||'').slice(0,7))===m);
    if(!sources.length)return last||'';
    const rank=s=>String(s.uploadDate||fileDate(s.fileName)||koreaDate(s.uploadedAt)||s.lastDate||s.date||'');
    const source=sources.slice().sort((a,b)=>rank(b).localeCompare(rank(a)))[0];
    const candidate=source.uploadDate||fileDate(source.fileName)||koreaDate(source.uploadedAt)||'';
    return validDate(candidate)&&candidate.slice(0,7)===m&&(!last||candidate>=last)?candidate:(last||candidate);
  }
  function validateShared(shared){
    if(!object(shared)||!Array.isArray(shared.uploads))throw new Error('공용 매출 자료의 형식이 올바르지 않습니다.');
    if(shared.sourceFiles!==undefined&&!Array.isArray(shared.sourceFiles))throw new Error('원본 파일 목록의 형식이 올바르지 않습니다.');
    for(const key of ['mbo','gmbo','sched','closedVendors','uiText'])if(shared[key]!==undefined&&!object(shared[key]))throw new Error('공용 설정의 형식이 올바르지 않습니다: '+key);
    for(const [i,row] of shared.uploads.entries()){
      const amount=object(row)?amountOf(row):undefined;
      if(!object(row)||!validDate(dateOf(row))||!String(row.v||row.vendor||'').trim()||amount===null||amount===undefined||String(amount).trim()===''||!Number.isFinite(Number(amount)))throw new Error('공용 매출 자료 '+(i+1)+'행의 일자·판매처·금액을 확인해 주세요.');
    }
    const latest=new Map();
    for(const src of shared.sourceFiles||[]){
      if(!object(src))throw new Error('원본 파일 정보의 형식이 올바르지 않습니다.');
      if(src.uploadDate!==undefined&&!validDate(String(src.uploadDate)))throw new Error('원본 파일 업로드 기준일의 형식이 올바르지 않습니다.');
      if(src.month&&(!latest.has(src.month)||String(src.lastDate||src.date||'')>=String(latest.get(src.month).lastDate||latest.get(src.month).date||'')))latest.set(src.month,src);
    }
    for(const [month,src] of latest){
      const summary=monthSummary(shared,month);
      if(src.total!==undefined&&(!Number.isFinite(Number(src.total))||Math.abs(summary.total-Number(src.total))>.5))throw new Error('공용 데이터 무결성 오류: '+month+' 누계 불일치');
      if(src.lastDate&&summary.last!==src.lastDate)throw new Error('공용 데이터 무결성 오류: '+month+' 실적 기준일 불일치');
      if(src.dateCount!==undefined&&summary.dateCount!==Number(src.dateCount))throw new Error('공용 데이터 무결성 오류: '+month+' 수록 일자 수 불일치');
    }
    return shared;
  }
  async function requestJson(url,init={},options={}){
    const controller=new AbortController(),external=init.signal,timeoutMs=options.timeoutMs??12000;
    let timer,onAbort;
    const stopped=new Promise((_,reject)=>{
      onAbort=()=>{controller.abort();const e=new Error('자료 확인이 취소되었습니다.');e.name='AbortError';reject(e);};
      if(external?.aborted)onAbort();else external?.addEventListener('abort',onAbort,{once:true});
      timer=setTimeout(()=>{controller.abort();const e=new Error('서버 응답 시간이 초과되었습니다. 다시 확인해 주세요.');e.name='TimeoutError';reject(e);},timeoutMs);
    });
    try{
      if(external?.aborted)return await stopped;
      const work=(async()=>{
        const response=await (options.fetch||fetch)(url,{...init,signal:controller.signal});
        let body;try{body=await response.json();}catch(e){if(response.ok)throw new Error('서버가 읽을 수 없는 자료를 반환했습니다.');}
        if(!response.ok){const error=new Error('공용 저장소 요청 실패 (HTTP '+response.status+')');error.httpStatus=response.status;throw error;}
        return body;
      })();
      return await Promise.race([work,stopped]);
    }finally{clearTimeout(timer);external?.removeEventListener('abort',onAbort);}
  }
  function changes(base,next,path=[]){
    if(same(base,next))return [];
    if(object(base)&&object(next))return [...new Set([...Object.keys(base),...Object.keys(next)])].flatMap(k=>changes(base[k],next[k],[...path,k]));
    return [{path,before:clone(base),after:clone(next)}];
  }
  function applyChanges(latest,patch,check=true){
    let result=clone(latest);
    for(const {path,before,after} of patch){
      if(path.some(k=>['__proto__','constructor','prototype'].includes(k)))throw new Error('설정 이름을 확인해 주세요.');
      let current=result;for(const k of path)current=current?.[k];
      if(check&&!same(current,before)&&!same(current,after))throw new Error('다른 사용자가 같은 설정을 변경했습니다. 새로고침 후 다시 저장해 주세요.');
      if(!path.length){result=clone(after);continue;}
      let target=result;for(const k of path.slice(0,-1)){if(!object(target[k]))target[k]={};target=target[k];}
      if(after===undefined)delete target[path.at(-1)];else target[path.at(-1)]=clone(after);
    }
    return result;
  }
  function rowsForMonth(rows,month){
    return (rows||[]).filter(r=>dateOf(r).slice(0,7)===month).map(r=>[dateOf(r),String(r.v||r.vendor||''),String(r.g||r.productGroup||'미분류'),String(r.m||r.material||'미분류'),Number(amountOf(r))]).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
  }
  function mergeUpload(previous,payload,sourceFiles){
    if(!Array.isArray(payload.baseUploads)||!Array.isArray(payload.up)||!Array.isArray(sourceFiles)||!sourceFiles.length)throw new Error('업로드 기준 자료가 없습니다. 새로고침 후 파일을 다시 선택해 주세요.');
    const months=new Set(sourceFiles.map(s=>s.month));
    for(const month of months){
      if(!/^\d{4}-\d{2}$/.test(month)||!same(rowsForMonth(previous.uploads,month),rowsForMonth(payload.baseUploads,month)))throw new Error('업로드 중 해당 월의 공용 매출이 변경되었습니다. 새로고침 후 파일을 다시 선택해 주세요.');
    }
    return {...previous,uploads:[...previous.uploads.filter(r=>!months.has(dateOf(r).slice(0,7))),...payload.up.filter(r=>months.has(dateOf(r).slice(0,7)))],sourceFiles:[...(previous.sourceFiles||[]).filter(s=>!months.has(s.month||String(s.date||'').slice(0,7))),...sourceFiles]};
  }
  function createWriter({readSnapshot,putSnapshot,readLatest,isActive=()=>true,onState=()=>{},pause=ms=>new Promise(resolve=>setTimeout(resolve,ms))}){
    let queue=Promise.resolve();
    const requireActive=()=>{if(!isActive()){const error=new Error('마스터 모드가 종료되어 이전 저장 처리를 취소했습니다.');error.name='AbortError';throw error;}};
    return function write(build,message){
      const operation=queue.then(async()=>{
        try{
          requireActive();onState('saving');
          for(let attempt=0;attempt<2;attempt++){
            requireActive();
            const snapshot=await readSnapshot();
            requireActive();
            if(!snapshot?.sha)throw new Error('공용 파일의 저장 버전을 확인하지 못했습니다.');
            const previous=validateShared(snapshot.data),next=validateShared(await build(clone(previous)));
            requireActive();
            let uncertain=false;
            try{await putSnapshot({sha:snapshot.sha,data:next,message});}
            catch(error){
              requireActive();
              if(error.httpStatus===409&&attempt===0)continue;
              if(error.httpStatus)throw error;
              // A timed-out PUT may already have committed. Never replay it blindly.
              uncertain=true;
            }
            requireActive();
            for(let check=0;check<3;check++){
              try{const got=validateShared(await readLatest());requireActive();if(same(got,next)){onState('saved',got);return got;}}catch(error){requireActive();}
              if(check<2)await pause(300*(check+1));
              requireActive();
            }
            throw new Error(uncertain?'저장 응답을 확인하지 못했습니다. 새로고침하여 결과를 확인한 뒤 다시 시도해 주세요.':'저장 후 공용 자료가 달라졌거나 확인이 지연됩니다. 새로고침하여 결과를 확인해 주세요.');
          }
          throw new Error('동시에 다른 저장이 진행되었습니다. 새로고침 후 다시 시도해 주세요.');
        }catch(error){if(isActive())onState('error',null,error);throw error;}
      });
      queue=operation.catch(()=>{});
      return operation;
    };
  }
  const view={kind:'loading',shared:null,checkedAt:'',message:'',saveState:''};
  let browser=null;
  function setView(update){Object.assign(view,update);renderProof();return {...view};}
  function stamp(iso){try{return new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',dateStyle:'short',timeStyle:'short'}).format(new Date(iso));}catch(e){return '확인되지 않음';}}
  function renderProof(){
    if(!browser)return;
    const doc=browser.document,anchor=doc.getElementById('status');if(!anchor)return;
    let box=doc.getElementById('sfDataProof');
    if(!box){
      const style=doc.createElement('style');style.textContent='#sfDataProof{margin-top:12px;padding:10px 12px;border:1px solid var(--line,#31506b);border-radius:10px;color:var(--text,#cfe4f4);font-size:11px;line-height:1.6}#sfDataProof summary{cursor:pointer;font-weight:700}#sfDataProof[data-state="cached"],#sfDataProof[data-state="unavailable"],#sfDataProof[data-state="error"]{border-color:#ca8f40}#sfDataProof p{margin:7px 0 0}#sfDataProof button{margin-top:8px;padding:6px 10px;border:1px solid currentColor;border-radius:6px;background:transparent;color:inherit;cursor:pointer}';doc.head.appendChild(style);
      box=doc.createElement('details');box.id='sfDataProof';box.append(doc.createElement('summary'),doc.createElement('div'));anchor.insertAdjacentElement('afterend',box);
    }
    const shared=view.shared||{uploads:[]},month=doc.getElementById('month')?.value||'';
    const uploads=shared.uploads||[],replaced=new Set(uploads.map(dateOf)),seed=browser.SEED_DATA?.dailyRecords||[];
    const combined={uploads:[...seed.filter(row=>!replaced.has(dateOf(row))),...uploads]};
    const summary=monthSummary(combined,month),cutoff=summary.last;
    const sources=(shared.sourceFiles||[]).filter(s=>!month||s.month===month).sort((a,b)=>String(b.uploadDate||fileDate(b.fileName)||b.lastDate||b.date||'').localeCompare(String(a.uploadDate||fileDate(a.fileName)||a.lastDate||a.date||'')));
    const source=sources[0],asOf=source?sourceAsOfDate(shared,month,cutoff):cutoff,basis=source?'업로드 기준':'실적 기준';
    const asof=doc.getElementById('asof');if(asof&&asOf)asof.textContent=Number(asOf.slice(5,7))+'/'+Number(asOf.slice(8))+' '+basis;
    const label={loading:'공용 자료 확인 중',live:'공용 자료 확인 완료',cached:'이전 저장 자료 · 최신 확인 실패',unavailable:'내장 기준자료 · 최신 확인 실패'}[view.kind]||'자료 확인 필요';
    box.dataset.state=view.saveState==='error'?'error':view.kind;
    box.querySelector('summary').textContent=(asOf?basis+' '+asOf:'기준일 확인 필요')+' · '+label+(view.saveState==='saving'?' · 저장 중':view.saveState==='error'?' · 저장 확인 필요':'');
    const body=box.querySelector('div');body.replaceChildren();
    const line=text=>{const p=doc.createElement('p');p.textContent=text;body.appendChild(p);};
    line(source?'원본 파일: '+(source.fileName||'파일명 기록 없음')+' · 실적 수록 '+(source.firstDate||summary.first||'시작일 확인 필요')+' ~ '+(source.lastDate||source.date||cutoff||'마지막 실적일 확인 필요'):'원본 파일: '+(view.kind==='cached'?'이 브라우저에 이전 저장된 자료와 내장 기준자료입니다.':seed.length?'이 월은 내장 기준자료를 포함합니다. 별도 원본 파일 기록은 없습니다.':'이 자료에는 원본 파일 기록이 없습니다.'));
    if(source?.mergeMode)line('파일 반영: '+(source.mergeMode==='date-patch'?'수록 일자 추가·교체':'월 자료 교체')+(source.inputFirstDate?' · 파일 수록 '+source.inputFirstDate+' ~ '+(source.inputLastDate||source.inputFirstDate):''));
    line((month?month+' · ':'')+summary.rowCount.toLocaleString('ko-KR')+'개 매출 행 · '+summary.dateCount+'개 수록 일자'+(source&&source.total!==undefined&&Math.abs(summary.total-Number(source.total))<=.5?' · 저장된 월 누계 대조 완료':''));
    if(view.checkedAt)line('마지막 공용 자료 확인: '+stamp(view.checkedAt)+' (한국시간)');
    if(shared.updatedAt)line('공용 자료·설정 저장: '+stamp(shared.updatedAt)+' (한국시간) · 업로드 기준일과 별도입니다.');
    if(source)line('업로드 기준일 '+asOf+'까지 신규 매출이 없으면 마지막 실적일 이후 구간은 0매출로 반영해 진행률을 계산합니다.');
    line('현재 매출은 업로드된 실적 합계입니다. 월말 예상과 추가 매출은 과거 수금 단계·영업일·업체 마감을 반영한 추정값입니다. 운영 범위 230~270억 및 이월 가능성은 기존 산정 기준을 따릅니다.');
    if(view.message)line(view.message);
    if(view.kind==='cached'||view.kind==='unavailable'||view.saveState==='error'){const retry=doc.createElement('button');retry.type='button';retry.textContent='새로고침하여 다시 확인';retry.onclick=()=>browser.location.reload();body.appendChild(retry);}
  }
  function install(win){browser=win;win.addEventListener('sf-core-ready',renderProof);win.addEventListener('sf-data-refreshed',()=>queueMicrotask(renderProof));win.document.addEventListener('change',e=>{if(e.target?.id==='month')queueMicrotask(renderProof);});renderProof();}
  return {requestJson,validateShared,monthSummary,lastDataDate,sourceAsOfDate,koreaDate,same,changes,applyChanges,mergeUpload,createWriter,setView,getView:()=>({...view}),install,renderProof,validDate};
});
