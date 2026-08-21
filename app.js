(() => {
  'use strict';
  const DB_NAME='scm_sales_dashboard_v2';
  const DB_STORE='dashboard';
  const DB_KEY='main';
  const clone=o=>JSON.parse(JSON.stringify(o));
  let state=clone(window.SEED_DATA);
  state.mboByMonth = state.mboByMonth || {};
  ensureStateDefaults();
  const charts={};
  const $=s=>document.querySelector(s);
  const fmtEok=n=>(Number(n||0)/1e8).toLocaleString('ko-KR',{minimumFractionDigits:1,maximumFractionDigits:1});
  const fmtPct=n=>Number.isFinite(n)?(n*100).toFixed(1)+'%':'-';
  const monthLabel=m=>{const [y,mm]=m.split('-');return `${y}.${mm}`};
  const norm=s=>String(s||'').replace(/\s|\(주\)|주식회사/g,'').toLowerCase();
  const managerRule=name=>{const s=String(name||''); if(s.includes('백제')&&(s.includes('원주')||s.includes('영남')))return '임인숙'; if(s.includes('유진약품')||s.includes('아이팜'))return '정직한'; return '배영훈';};
  const regionRule=(name,r='')=>{const map={'백제약품영등포지점':'수도권2,3','백제약품(주)영남본부':'경남','대전백제약품':'충청','백제약품(주)원주지점':'강원','(주)인천약품':'수도권1','(주)복산나이스':'수도권4,부산','유진약품(주)':'전라','아이팜코리아(주)':'대구'}; if(map[name])return map[name]; const s=String(r||''); if(/서울|경기|인천/.test(s))return '수도권'; if(/강원/.test(s))return '강원'; if(/충북|충남|대전|세종/.test(s))return '충청'; if(/전북|전남|광주/.test(s))return '전라'; if(/부산|울산|경남/.test(s))return '부산/경남'; if(/대구|경북/.test(s))return '대구/경북'; if(/제주/.test(s))return '제주'; return '권역외';};

  function ensureStateDefaults(){
    state.collectionSchedule=state.collectionSchedule||clone((window.SEED_DATA&&window.SEED_DATA.collectionSchedule)||{});
    state.customHolidaysByMonth=state.customHolidaysByMonth||{};
    state.krHolidays2026=state.krHolidays2026||clone((window.SEED_DATA&&window.SEED_DATA.krHolidays2026)||{});
    state.version=Math.max(Number(state.version||0),3);
  }
  function isoDate(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
  function parseHolidayTokens(month,text){
    const [y,m]=month.split('-').map(Number),out=[];
    String(text||'').split(/[,;\s]+/).map(x=>x.trim()).filter(Boolean).forEach(t=>{let mm,dd,yy=y,mt=t.match(/^(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})$/);if(mt){yy=Number(mt[1]);mm=Number(mt[2]);dd=Number(mt[3]);}else{mt=t.match(/^(\d{1,2})[-/.](\d{1,2})$/);if(mt){mm=Number(mt[1]);dd=Number(mt[2]);}}if(mm&&dd&&yy===y&&mm===m)out.push(`${yy}-${String(mm).padStart(2,'0')}-${String(dd).padStart(2,'0')}`);});
    return [...new Set(out)].sort();
  }
  function holidaySet(month){const set=new Set();Object.keys(state.krHolidays2026||{}).filter(x=>x.startsWith(month)).forEach(x=>set.add(x));(state.customHolidaysByMonth?.[month]||[]).forEach(x=>set.add(x));return set;}
  function isBusinessDayDate(d,month){const ds=isoDate(d);return d.getDay()!==0&&d.getDay()!==6&&!holidaySet(month||ds.slice(0,7)).has(ds)}
  function businessDates(month){const [y,m]=month.split('-').map(Number),out=[];for(let d=new Date(y,m-1,1);d.getMonth()===m-1;d.setDate(d.getDate()+1)){if(isBusinessDayDate(d,month))out.push(isoDate(d));}return out;}
  function businessDaysInMonth(month){return businessDates(month).length;}
  function businessDayIndex(dateStr){if(!dateStr)return 0;const month=dateStr.slice(0,7);return businessDates(month).filter(x=>x<=dateStr).length;}
  function scheduleFor(month){return state.collectionSchedule?.[month]||{};}
  function phasePosition(month,dateStr){const days=businessDates(month);if(!days.length)return {phase:0,ratio:0};const s=scheduleFor(month),idx=Math.max(0,days.filter(x=>x<=dateStr).length-1),firstIdx=s.first?Math.max(0,days.filter(x=>x<=s.first).length-1):Math.floor(days.length*.55),secondIdx=s.second?Math.max(firstIdx+1,days.filter(x=>x<=s.second).length-1):Math.floor(days.length*.75);if(idx<=firstIdx)return {phase:0,ratio:firstIdx>0?idx/firstIdx:0};if(idx<=secondIdx)return {phase:1,ratio:(idx-firstIdx)/Math.max(1,secondIdx-firstIdx)};return {phase:2,ratio:(idx-secondIdx)/Math.max(1,(days.length-1)-secondIdx)};}
  function equivalentDate(month,phase,ratio){const days=businessDates(month);if(!days.length)return null;const s=scheduleFor(month),firstIdx=s.first?Math.max(0,days.filter(x=>x<=s.first).length-1):Math.floor(days.length*.55),secondIdx=s.second?Math.max(firstIdx+1,days.filter(x=>x<=s.second).length-1):Math.floor(days.length*.75);let idx=0;if(phase===0)idx=Math.round(firstIdx*ratio);else if(phase===1)idx=Math.round(firstIdx+(secondIdx-firstIdx)*ratio);else idx=Math.round(secondIdx+((days.length-1)-secondIdx)*ratio);idx=Math.max(0,Math.min(days.length-1,idx));return days[idx];}
  function cumulativeAt(month,dateStr,records){const by=groupByDate(records||[]);let cum=0;Object.keys(by).sort().forEach(ds=>{if(ds<=dateStr)cum+=by[ds]});return cum;}
  function progressMeta(month,dateStr){if(!dateStr)return {progress:0,source:'데이터 없음',samples:0,phase:0,ratio:0};const pos=phasePosition(month,dateStr),hist=[];for(const pm of months().filter(pm=>pm<month&&scheduleFor(pm).first&&scheduleFor(pm).second)){const dr=state.dailyRecords.filter(x=>x.date.startsWith(pm)&&inFilter(x));if(!dr.length)continue;const final=monthlyAmountForFilters(pm);if(!final)continue;const eq=equivalentDate(pm,pos.phase,pos.ratio);if(!eq)continue;const pv=cumulativeAt(pm,eq,dr)/final;if(pv>0&&pv<1.4)hist.push(pv);}if(hist.length>=2)return {progress:hist.reduce((x,y)=>x+y,0)/hist.length,source:`수금 이벤트 정렬 ${hist.length}개월`,samples:hist.length,...pos};const idx=businessDayIndex(dateStr),total=businessDaysInMonth(month);return {progress:Math.min(1,Math.max(.01,idx/Math.max(1,total))),source:'공휴일 제외 영업일 경과율',samples:hist.length,...pos};}
  function expectedProgress(month,dateStr){return progressMeta(month,dateStr).progress;}
  function eventLabel(month,dateStr){const s=scheduleFor(month);if(dateStr===s.first)return '1차 수금';if(dateStr===s.second)return '2차 수금';return '';}
  function syncCalendarInputs(){const m=activeMonth(),s=scheduleFor(m);$('#collection1Input').value=s.first||'';$('#collection2Input').value=s.second||'';$('#customHolidayInput').value=(state.customHolidaysByMonth?.[m]||[]).join(', ');}
  function renderCalendarInfo(){const m=activeMonth(),s=scheduleFor(m),auto=Object.entries(state.krHolidays2026||{}).filter(([d])=>d.startsWith(m)&&new Date(d+'T00:00:00').getDay()!==0&&new Date(d+'T00:00:00').getDay()!==6),custom=state.customHolidaysByMonth?.[m]||[];const parts=[`영업일 ${businessDaysInMonth(m)}일`,`1차 ${s.first||'미입력'}`,`2차 ${s.second||'미입력'}`];if(auto.length)parts.push(`자동 제외 ${auto.map(([d,n])=>`${Number(d.slice(8))}일 ${n}`).join(' · ')}`);if(custom.length)parts.push(`추가 제외 ${custom.map(d=>Number(d.slice(8))+'일').join(', ')}`);$('#calendarInfo').textContent=parts.join('  |  ');}
  function monthlyAmountForFilters(month){
    const mgr=activeManager(),ven=activeVendor();
    const detailed=state.monthlyRecords.filter(x=>x.month===month&&(mgr==='ALL'||x.manager===mgr)&&(ven==='ALL'||x.vendor===ven));
    if(detailed.length)return detailed.reduce((a,b)=>a+b.amount,0);
    if(ven!=='ALL'||mgr!=='ALL')return state.legacyMonthly.filter(x=>x.month===month&&(mgr==='ALL'||x.manager===mgr)&&(ven==='ALL'||x.vendor===ven)).reduce((a,b)=>a+b.amount,0);
    const t=state.legacyTotals.find(x=>x.month===month);return t?t.amount:0;
  }
  function groupByDate(arr){const o={};arr.forEach(x=>o[x.date]=(o[x.date]||0)+x.amount);return o;}
  function monthMbo(month){return Number((state.mboByMonth||{})[month] ?? state.mboTotal ?? 0);}
  function targetForFilter(month){
    const base=monthMbo(month);
    if(activeVendor()==='ALL'&&activeManager()==='ALL')return base;
    const prev=prevMonth(month); const denom=monthlyAmountUnfiltered(prev); const numer=monthlyAmountForFilters(prev); return denom>0?base*numer/denom:base;
  }
  function monthlyAmountUnfiltered(month){const d=state.monthlyRecords.filter(x=>x.month===month); if(d.length)return d.reduce((a,b)=>a+b.amount,0); const t=state.legacyTotals.find(x=>x.month===month);if(t)return t.amount;return state.legacyMonthly.filter(x=>x.month===month).reduce((a,b)=>a+b.amount,0)}
  function prevMonth(m){const [y,mm]=m.split('-').map(Number);const d=new Date(y,mm-2,1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}

  function initFilters(){
    const ms=months(); $('#monthFilter').innerHTML=ms.map(m=>`<option value="${m}">${monthLabel(m)}</option>`).join(''); $('#monthFilter').value=ms.at(-1);
    const managers=['배영훈','임인숙','정직한']; $('#managerFilter').innerHTML='<option value="ALL">전체</option>'+managers.map(x=>`<option>${x}</option>`).join('');
    updateVendorOptions(); $('#mboInput').value=(monthMbo($('#monthFilter').value)/1e8).toFixed(1); syncCalendarInputs();
  }
  function allVendors(){const map=new Map();[...state.monthlyRecords,...state.legacyMonthly,...state.dailyRecords].forEach(x=>{if(x.vendor)map.set(x.vendor,x.manager||managerRule(x.vendor))});return [...map.entries()].sort((a,b)=>a[0].localeCompare(b[0],'ko'))}
  function updateVendorOptions(){const mgr=activeManager();const current=$('#vendorFilter').value;const vs=allVendors().filter(([v,m])=>mgr==='ALL'||m===mgr);$('#vendorFilter').innerHTML='<option value="ALL">전체</option>'+vs.map(([v])=>`<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('');if(vs.some(([v])=>v===current))$('#vendorFilter').value=current;}

  function render(){
    const m=activeMonth(), ld=latestDate(m), current=monthlyAmount(m), target=targetForFilter(m), prog=expectedProgress(m,ld), forecast=prog>0?current/prog:0, need=target*prog, purity=need>0?current/need:0, gap=target-forecast, prev=monthlyAmount(prevMonth(m)), mom=prev?current/prev-1:null;
    $('#heroTitle').textContent=`${m.slice(0,4)}년 ${Number(m.slice(5))}월 매출 진행 현황`;
    $('#asOfBadge').textContent=ld?`${Number(ld.slice(5,7))}/${Number(ld.slice(8))} 기준`:'월 마감 기준';
    const meta=progressMeta(m,ld); const days=ld?businessDates(m).filter(ds=>ds>ld).length:0; const dailyNeed=days>0?Math.max(0,target-current)/days:0;
    const detail=monthlyDetailed(m); const pg=groupSum(detail,'productGroup'); const mat=groupSum(detail,'material'); const top3=detail.length?groupSum(detail,'vendor').slice(0,3).reduce((a,b)=>a+b[1],0)/Math.max(1,current):0; const neg=detail.filter(x=>x.amount<0).reduce((a,b)=>a+b.amount,0);
    const cards=[
      ['현재 누계',`${fmtEok(current)}억`,ld?'당월 일자별/월별 EXPORT 현수준':'월 마감 실적','info'],
      ['MBO 목표',`${fmtEok(target)}억`,'전체 MBO 또는 전월 비중 배분 목표',''],
      ['예상 마감',`${fmtEok(forecast)}억`,forecast>=target?'MBO 초과 예상':'현재 pace 기준','good'],
      ['순도',fmtPct(purity),`기준일 필요 누계 ${fmtEok(need)}억`,purity>=1?'good':purity>=.9?'warn':'bad'],
      ['예측 기준',`${(prog*100).toFixed(1)}%`,`${meta.source} · 잔여 영업일 ${days}일`,'info'],
      ['MBO 예상 GAP',`${gap>=0?'-':'+'}${fmtEok(Math.abs(gap))}억`,gap>0?'예상 마감 기준 부족':'예상 마감 기준 초과',gap>0?'bad':'good'],
      ['MBO 잔여액',`${fmtEok(Math.max(0,target-current))}억`,'현재 누계 기준 목표까지 남은 금액',current>=target?'good':'warn'],
      ['잔여 영업일 일평균 필요',`${fmtEok(dailyNeed)}억`,`${days} 영업일 남음`,'warn'],
      ['전월 대비',mom===null?'-':`${mom>=0?'+':''}${fmtPct(mom)}`,`전월 ${fmtEok(prev)}억 대비`,mom!==null&&mom>=0?'good':''],
      ['제품 믹스 TOP',pg.length?pg[0][0]:'-',pg.length?`${fmtEok(pg[0][1])}억 · ${(pg[0][1]/Math.max(1,current)*100).toFixed(1)}%`:'과거 EXPORT 업로드 시 표시',''],
      ['자재 TOP',mat.length?mat[0][0]:'-',mat.length?`${fmtEok(mat[0][1])}억`:'과거 EXPORT 업로드 시 표시',''],
      ['TOP3 업체 집중도',detail.length?fmtPct(top3):'-','선택 범위 내 상위 3개 업체 비중',''],
      ['마이너스 매출 품목',`${fmtEok(neg)}억`,'반품 등으로 실매출액이 음수인 합계',neg<0?'bad':''],
      ['업체 수',`${new Set(detail.map(x=>x.vendor)).size||new Set(state.legacyMonthly.filter(x=>x.month===m&&inFilter(x)).map(x=>x.vendor)).size}개`,'현재 선택 범위의 거래 업체','']
    ];
    $('#kpiGrid').innerHTML=cards.map(c=>`<article class="panel kpi ${c[3]}"><div class="label">${escapeHtml(c[0])}</div><div class="value">${escapeHtml(c[1])}</div><div class="sub">${escapeHtml(c[2])}</div></article>`).join('');
    renderCalendarInfo(); drawMonthlyChart(m,target); drawDailyChart(m,target); drawBar('productGroupChart',pg.slice(0,10),'제품군'); drawBar('materialChart',mat.slice(0,10),'자재'); renderVendorTable(m,prog); renderDailyTable(m,target); renderProductTable(detail,current);
  }

  function drawMonthlyChart(m,target){const ms=months().filter(x=>x<=m);const vals=ms.map(x=>monthlyAmount(x)/1e8);const mbo=ms.map(x=>targetForFilter(x)/1e8);makeChart('monthlyChart',{type:'line',data:{labels:ms.map(monthLabel),datasets:[{label:'매출(억)',data:vals,borderColor:'#66a7ff',backgroundColor:'rgba(102,167,255,.14)',fill:true,tension:.28,pointRadius:4},{label:'MBO(억)',data:mbo,borderColor:'#ffb454',borderDash:[6,5],pointRadius:0}]},options:baseOpts('억')});}
  function drawDailyChart(m,target){const dr=dailyFiltered(m), by=groupByDate(dr), dates=Object.keys(by).sort();let cum=0;const actual=[],required=[];dates.forEach(ds=>{cum+=by[ds];actual.push(cum/1e8);required.push(target*expectedProgress(m,ds)/1e8)});makeChart('dailyChart',{type:'line',data:{labels:dates.map(x=>`${Number(x.slice(5,7))}/${Number(x.slice(8))}`),datasets:[{label:'실제 누계(억)',data:actual,borderColor:'#4fd1c5',backgroundColor:'rgba(79,209,197,.12)',fill:true,tension:.25},{label:'필요 누계(억)',data:required,borderColor:'#ffb454',borderDash:[5,4],tension:.2}]},options:baseOpts('억')});}
  function drawBar(id,pairs,label){makeChart(id,{type:'bar',data:{labels:pairs.map(x=>x[0]),datasets:[{label:`${label} 매출(억)`,data:pairs.map(x=>x[1]/1e8),backgroundColor:'rgba(102,167,255,.72)',borderRadius:7}]},options:{...baseOpts('억'),indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#8fa8c3'},grid:{color:'rgba(63,91,118,.18)'}},y:{ticks:{color:'#b9cce0',font:{size:10}},grid:{display:false}}}}});}
  function baseOpts(){return {responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#9fb6cc',boxWidth:12,usePointStyle:true}}},scales:{x:{ticks:{color:'#8fa8c3'},grid:{color:'rgba(63,91,118,.14)'}},y:{ticks:{color:'#8fa8c3'},grid:{color:'rgba(63,91,118,.16)'}}}}}
  function makeChart(id,cfg){if(charts[id])charts[id].destroy();charts[id]=new Chart(document.getElementById(id),cfg)}

  function vendorRows(m,prog){
    const prev=prevMonth(m); const currArr=state.monthlyRecords.filter(x=>x.month===m); const prevDen=monthlyAmountUnfiltered(prev)||1; const map=new Map();
    const vendors=new Set([...currArr.map(x=>x.vendor),...state.legacyMonthly.filter(x=>x.month===m||x.month===prev).map(x=>x.vendor)]);
    vendors.forEach(v=>{
      const rec=currArr.filter(x=>x.vendor===v); const cur=rec.reduce((a,b)=>a+b.amount,0); const prevVal=state.monthlyRecords.some(x=>x.month===prev)?state.monthlyRecords.filter(x=>x.month===prev&&x.vendor===v).reduce((a,b)=>a+b.amount,0):state.legacyMonthly.filter(x=>x.month===prev&&x.vendor===v).reduce((a,b)=>a+b.amount,0);
      const sample=rec[0]||state.legacyMonthly.find(x=>x.vendor===v)||{}; const manager=sample.manager||managerRule(v); if(activeManager()!=='ALL'&&manager!==activeManager())return; if(activeVendor()!=='ALL'&&v!==activeVendor())return;
      const alloc=monthMbo(m)*(prevVal/prevDen); map.set(v,{vendor:v,region:sample.region||regionRule(v),manager,prev:prevVal,current:cur,forecast:prog?cur/prog:cur,target:alloc,mom:prevVal?cur/prevVal-1:null});
    }); return [...map.values()].sort((a,b)=>b.current-a.current);
  }
  function renderVendorTable(m,prog){const rows=vendorRows(m,prog);const hs=['권역','업체명','담당자',`${prevMonth(m).slice(5)}월`,`당월 현수준`,'예상 마감','MBO 배분','예상 달성률','전월비'];$('#vendorTable').innerHTML='<thead><tr>'+hs.map(x=>`<th>${x}</th>`).join('')+'</tr></thead><tbody>'+rows.map(r=>`<tr><td>${escapeHtml(r.region)}</td><td>${escapeHtml(r.vendor)}</td><td>${escapeHtml(r.manager)}</td><td>${fmtEok(r.prev)}</td><td>${fmtEok(r.current)}</td><td>${fmtEok(r.forecast)}</td><td>${fmtEok(r.target)}</td><td class="${r.forecast>=r.target?'pos':'neg'}">${fmtPct(r.target?r.forecast/r.target:0)}</td><td class="${r.mom>=0?'pos':'neg'}">${r.mom===null?'-':fmtPct(r.mom)}</td></tr>`).join('')+'</tbody>';}
  function renderDailyTable(m,target){const by=groupByDate(dailyFiltered(m));const dates=Object.keys(by).sort();let cum=0,prevNeed=0;const rows=dates.map(ds=>{cum+=by[ds];const p=expectedProgress(m,ds),need=target*p,dayNeed=Math.max(0,need-prevNeed);prevNeed=need;return [ds,eventLabel(m,ds),businessDayIndex(ds),by[ds],cum,dayNeed,need,need?cum/need:0]});$('#dailyTable').innerHTML='<thead><tr><th>일자</th><th>구분</th><th>영업일차</th><th>당일 매출(억)</th><th>누계(억)</th><th>당일 필요(억)</th><th>필요 누계(억)</th><th>순도</th></tr></thead><tbody>'+rows.reverse().map(r=>`<tr><td>${r[0]}</td><td>${r[1]?`<span class="event-pill">${r[1]}</span>`:'-'}</td><td>${r[2]}</td><td>${fmtEok(r[3])}</td><td>${fmtEok(r[4])}</td><td>${fmtEok(r[5])}</td><td>${fmtEok(r[6])}</td><td class="${r[7]>=1?'pos':'neg'}">${fmtPct(r[7])}</td></tr>`).join('')+'</tbody>';}
  function renderProductTable(detail,current){const pg=groupSum(detail,'productGroup');$('#productTable').innerHTML='<thead><tr><th>제품군</th><th>매출(억)</th><th>비중</th></tr></thead><tbody>'+pg.slice(0,50).map(r=>`<tr><td>${escapeHtml(r[0])}</td><td>${fmtEok(r[1])}</td><td>${fmtPct(r[1]/Math.max(1,current))}</td></tr>`).join('')+'</tbody>';}

  async function parseFiles(files,type){if(!window.XLSX){setStatus('Excel 파서 로딩에 실패했습니다. 인터넷 연결 후 다시 시도해 주세요.',true);return} for(const file of files){setStatus(`${file.name} 분석 중...`);const buf=await file.arrayBuffer();const wb=XLSX.read(buf,{type:'array',cellDates:true});const ws=wb.Sheets[wb.SheetNames[0]];const rows=XLSX.utils.sheet_to_json(ws,{defval:null,raw:true}); if(!rows.length)continue; if(type==='monthly')ingestMonthly(rows,file.name);else ingestDaily(rows,file.name);} saveState();initFilters();render();setStatus(`${files.length}개 파일 반영 완료 · 브라우저에 저장되었습니다.`)}
  function ingestMonthly(rows,source){const monthsIn=new Set();rows.forEach(r=>{if(r['년월'])monthsIn.add(String(r['년월']).replace('.','-'))});state.monthlyRecords=state.monthlyRecords.filter(x=>!monthsIn.has(x.month));const map=new Map();for(const r of rows){if(!r['년월']||!r['판매처명'])continue;const month=String(r['년월']).replace('.','-'),vendor=String(r['판매처명']),region=regionRule(vendor,r['지역명']),manager=managerRule(vendor),pg=String(r['제품계층구조2 명']||'미분류'),material=String(r['자재명']||'미분류'),vendorCode=String(r['판매처']||''),bizNo=String(r['사업자번호']||'');const k=[month,vendor,region,manager,pg,material,vendorCode,bizNo].join('|');if(!map.has(k))map.set(k,{month,vendor,region,manager,productGroup:pg,material,vendorCode,bizNo,amount:0,sales:0,returns:0,source});const o=map.get(k);o.amount+=Number(r['실매출액']||0);o.sales+=Number(r['매출금액']||0);o.returns+=Number(r['반품금액']||0);}state.monthlyRecords.push(...map.values());state.sources=[...new Set([...(state.sources||[]),source])];}
  function ingestDaily(rows,source){const monthsIn=new Set();rows.forEach(r=>{const d=parseDate(r['일자']);if(d)monthsIn.add(d.slice(0,7))});state.dailyRecords=state.dailyRecords.filter(x=>!monthsIn.has(x.date.slice(0,7)));const map=new Map();for(const r of rows){const date=parseDate(r['일자']);if(!date||!r['판매처명'])continue;const vendor=String(r['판매처명']),region=regionRule(vendor,r['지역명']),manager=managerRule(vendor),pg=String(r['제품계층구조2 명']||'미분류'),material=String(r['자재명']||'미분류'),vendorCode=String(r['판매처']||''),bizNo=String(r['사업자번호']||'');const k=[date,vendor,region,manager,pg,material,vendorCode,bizNo].join('|');if(!map.has(k))map.set(k,{date,vendor,region,manager,productGroup:pg,material,vendorCode,bizNo,amount:0,source});map.get(k).amount+=Number(r['실매출액']||0);}state.dailyRecords.push(...map.values());state.sources=[...new Set([...(state.sources||[]),source])];}
  function parseDate(v){if(v instanceof Date&&!isNaN(v))return `${v.getFullYear()}-${String(v.getMonth()+1).padStart(2,'0')}-${String(v.getDate()).padStart(2,'0')}`;const s=String(v||'');const m=s.match(/(20\d{2})[.\/-](\d{1,2})[.\/-](\d{1,2})/);return m?`${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`:null;}
  function escapeHtml(s){return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
  function download(name,text,type='application/json'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
  function csvVendor(){const m=activeMonth(),ld=latestDate(m),p=expectedProgress(m,ld);const rows=vendorRows(m,p);const h=['권역','업체명','담당자','전월매출(억)','당월현수준(억)','예상마감(억)','MBO배분(억)','예상달성률'];const body=rows.map(r=>[r.region,r.vendor,r.manager,fmtEok(r.prev),fmtEok(r.current),fmtEok(r.forecast),fmtEok(r.target),fmtPct(r.target?r.forecast/r.target:0)]);download(`업체별_매출_${m}.csv`,[h,...body].map(r=>r.map(x=>'"'+String(x).replaceAll('"','""')+'"').join(',')).join('\n'),'text/csv;charset=utf-8');}

  $('#managerFilter').addEventListener('change',()=>{updateVendorOptions();render()}); $('#vendorFilter').addEventListener('change',render); $('#monthFilter').addEventListener('change',()=>{$('#mboInput').value=(monthMbo(activeMonth())/1e8).toFixed(1);syncCalendarInputs();render()}); $('#mboInput').addEventListener('change',e=>{state.mboByMonth=state.mboByMonth||{};state.mboByMonth[activeMonth()]=Number(e.target.value||0)*1e8;saveState();render()});
  $('#collection1Input').addEventListener('change',e=>{const m=activeMonth();state.collectionSchedule[m]=state.collectionSchedule[m]||{};state.collectionSchedule[m].first=e.target.value||null;saveState();render();});
  $('#collection2Input').addEventListener('change',e=>{const m=activeMonth();state.collectionSchedule[m]=state.collectionSchedule[m]||{};state.collectionSchedule[m].second=e.target.value||null;saveState();render();});
  $('#customHolidayInput').addEventListener('change',e=>{const m=activeMonth();state.customHolidaysByMonth[m]=parseHolidayTokens(m,e.target.value);syncCalendarInputs();saveState();render();});
  $('#monthlyUpload').addEventListener('change',e=>parseFiles([...e.target.files],'monthly')); $('#dailyUpload').addEventListener('change',e=>parseFiles([...e.target.files],'daily'));
  $('#backupBtn').addEventListener('click',()=>download(`SCM_SALES_BACKUP_${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(state,null,2)));
  $('#restoreInput').addEventListener('change',async e=>{try{state=JSON.parse(await e.target.files[0].text());saveState();initFilters();render();setStatus('JSON 백업을 복원했습니다.')}catch(err){setStatus('백업 파일 형식을 확인해 주세요.',true)}});
  $('#resetBtn').addEventListener('click',()=>{if(confirm('브라우저에 누적한 데이터를 지우고 4~7월 + 8/21 초기 내장 데이터로 복원할까요?')){state=clone(window.SEED_DATA);saveState();initFilters();render();setStatus('초기 데이터로 복원했습니다.')}});
  $('#vendorCsvBtn').addEventListener('click',csvVendor);

  initFilters(); render(); loadPersistedState();
})();
