(()=>{
  const AUTH_VIEWER_NAMES=new Set([
    '세일즈 포스','세일즈포스',
    '협력 도매사 물동량 관리','협력도매사 물동량 관리',
    '협력사 물동량 관리'
  ].map(v=>v.replace(/\s+/g,'').toLowerCase()));
  const normalize=v=>(v||'').replace(/\s+/g,'').toLowerCase();

  function patchViewer(){
    const viewer=document.querySelector('.viewer');
    if(!viewer)return;
    const title=viewer.querySelector('header strong')?.textContent?.trim()||'';
    if(!AUTH_VIEWER_NAMES.has(normalize(title)))return;

    const frame=viewer.querySelector('iframe');
    if(frame){
      frame.removeAttribute('sandbox');
      frame.removeAttribute('referrerpolicy');
      frame.setAttribute('allow','clipboard-read; clipboard-write; fullscreen');
      frame.dataset.authViewer='true';
    }

    const back=viewer.querySelector('header button.secondary');
    if(back){
      back.setAttribute('aria-label','MY HUB로 돌아가기');
      const textNode=[...back.childNodes].find(n=>n.nodeType===Node.TEXT_NODE);
      if(textNode)textNode.nodeValue=' MY HUB로 돌아가기';
      else back.append(document.createTextNode(' MY HUB로 돌아가기'));
    }

    const note=viewer.querySelector('.viewer-note');
    if(note)note.textContent='로그인과 업무 작업을 이 화면에서 진행할 수 있습니다. 상단의 ‘MY HUB로 돌아가기’로 언제든 허브로 복귀하세요.';
    viewer.dataset.authViewer='true';
  }

  const observer=new MutationObserver(patchViewer);
  observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
  window.addEventListener('focus',patchViewer);
  document.addEventListener('click',()=>queueMicrotask(patchViewer),true);
  patchViewer();
})();
;(()=>{
  const ORDER_KEY='yhbae106.myhub.order.v1';
  let mode=false,dragKey='',pointer=null,blockClickUntil=0,scheduled=false;
  const keyOf=card=>{
    const href=card?.querySelector('.card-footer a[href]')?.getAttribute('href')||'';
    try{const u=new URL(href,location.href);u.hash='';return u.href.replace(/\/$/,'');}catch{return href;}
  };
  const getCards=()=>[...document.querySelectorAll('.work-section .cards > article.card')];
  const read=()=>{try{const v=JSON.parse(localStorage.getItem(ORDER_KEY)||'[]');return Array.isArray(v)?v:[];}catch{return[];}};
  const write=v=>{try{localStorage.setItem(ORDER_KEY,JSON.stringify(v));}catch{}};
  const orderNow=()=>{
    const keys=getCards().map(keyOf).filter(Boolean),saved=read().filter(k=>keys.includes(k));
    keys.forEach(k=>{if(!saved.includes(k))saved.push(k);});
    return saved;
  };
  const apply=()=>{
    const order=read(),pos=new Map(order.map((k,i)=>[k,i]));
    getCards().forEach((card,i)=>{const k=keyOf(card);card.style.order=String(pos.has(k)?pos.get(k):1000+i);card.dataset.reorderKey=k;});
    const add=document.querySelector('.work-section .cards > .add-card');if(add)add.style.order='99999';
  };
  const move=(source,target,after)=>{
    if(!source||!target||source===target)return;
    const order=orderNow(),from=order.indexOf(source);if(from<0)return;
    order.splice(from,1);let at=order.indexOf(target)+(after?1:0);if(at<0)at=order.length;order.splice(at,0,source);write(order);apply();
  };
  const afterPoint=(card,x,y)=>{
    const r=card.getBoundingClientRect();
    return window.innerWidth>760?x>r.left+r.width/2:y>r.top+r.height/2;
  };
  const clearMarks=()=>getCards().forEach(c=>c.classList.remove('reorder-dragging','reorder-drop-target'));
  const targetAt=(x,y)=>document.elementFromPoint(x,y)?.closest?.('.work-section .cards > article.card')||null;
  function ensureHandle(card){
    let h=card.querySelector(':scope > .reorder-handle');
    if(!h){
      h=document.createElement('button');h.type='button';h.className='reorder-handle';h.hidden=true;
      h.setAttribute('aria-label','업무 카드 순서 이동');h.innerHTML='<span aria-hidden="true">⠿</span><em>이동</em>';
      card.prepend(h);
      h.addEventListener('pointerdown',e=>{
        if(!mode||e.button>0)return;const k=keyOf(card);if(!k)return;
        pointer={key:k,card,id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};
        card.classList.add('reorder-dragging');try{h.setPointerCapture(e.pointerId);}catch{}e.preventDefault();
      });
    }
    h.hidden=!mode;card.draggable=mode;
  }
  function resetFiltersForReorder(){
    const all=[...document.querySelectorAll('.work-section .tabs button')].find(b=>b.textContent?.trim()==='전체');
    if(all&&!all.classList.contains('selected'))all.click();
    const search=document.querySelector('.work-section .search input');
    if(search&&search.value){const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;set?.call(search,'');search.dispatchEvent(new Event('input',{bubbles:true}));}
    const sel=document.querySelector('.work-section .filter-inputs select');
    if(sel&&sel.value!=='전체 상태'){const set=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value')?.set;set?.call(sel,'전체 상태');sel.dispatchEvent(new Event('change',{bubbles:true}));}
  }
  function ensureUi(){
    const tools=document.querySelector('.work-section .section-title .tools');if(!tools)return;
    let btn=tools.querySelector('.reorder-toggle');
    if(!btn){
      btn=document.createElement('button');btn.type='button';btn.className='reorder-toggle';btn.innerHTML='<span>↕</span><span>배치 변경</span>';
      btn.addEventListener('click',()=>{
        mode=!mode;if(mode)resetFiltersForReorder();
        document.body.classList.toggle('myhub-reorder-mode',mode);btn.classList.toggle('active',mode);
        btn.lastElementChild.textContent=mode?'배치 완료':'배치 변경';setup();
      });tools.prepend(btn);
    }
    let tip=document.querySelector('.work-section .reorder-tip');
    if(!tip){tip=document.createElement('p');tip.className='reorder-tip';tip.textContent='이동 손잡이를 누른 채 원하는 위치로 끌어 놓으세요. 변경 순서는 이 브라우저에 저장됩니다.';document.querySelector('.work-section .filterbar')?.insertAdjacentElement('afterend',tip);}
    tip.hidden=!mode;
  }
  function setup(){ensureUi();getCards().forEach(ensureHandle);apply();}
  document.addEventListener('dragstart',e=>{
    if(!mode)return;const card=e.target instanceof Element?e.target.closest('.work-section .cards > article.card'):null;if(!card)return;
    dragKey=keyOf(card);if(!dragKey)return;card.classList.add('reorder-dragging');if(e.dataTransfer){e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',dragKey);}
  },true);
  document.addEventListener('dragover',e=>{
    if(!mode||!dragKey)return;const t=e.target instanceof Element?e.target.closest('.work-section .cards > article.card'):null;if(!t||keyOf(t)===dragKey)return;
    e.preventDefault();getCards().forEach(c=>c.classList.toggle('reorder-drop-target',c===t));
  },true);
  document.addEventListener('drop',e=>{
    if(!mode||!dragKey)return;const t=e.target instanceof Element?e.target.closest('.work-section .cards > article.card'):null;if(!t)return;
    e.preventDefault();move(dragKey,keyOf(t),afterPoint(t,e.clientX,e.clientY));
  },true);
  document.addEventListener('dragend',()=>{dragKey='';clearMarks();},true);
  document.addEventListener('pointermove',e=>{
    if(!pointer||e.pointerId!==pointer.id)return;
    if(!pointer.moved&&Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y)<7)return;pointer.moved=true;
    const t=targetAt(e.clientX,e.clientY);getCards().forEach(c=>c.classList.toggle('reorder-drop-target',c===t&&c!==pointer.card));
    if(t&&t!==pointer.card)move(pointer.key,keyOf(t),afterPoint(t,e.clientX,e.clientY));e.preventDefault();
  },{passive:false});
  const end=e=>{
    if(!pointer||e.pointerId!==pointer.id)return;const moved=pointer.moved;clearMarks();pointer=null;if(moved)blockClickUntil=Date.now()+500;e.preventDefault();
  };
  document.addEventListener('pointerup',end,{passive:false});document.addEventListener('pointercancel',end,{passive:false});
  document.addEventListener('click',e=>{if(Date.now()<blockClickUntil&&e.target instanceof Element&&e.target.closest('article.card')){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();}},true);
  const style=document.createElement('style');
  style.textContent=[
    '.reorder-toggle{display:inline-flex!important;align-items:center;gap:5px}',
    '.reorder-toggle.active{background:#eaf1ff!important;color:#315b98!important;border-color:#aebfdd!important;font-weight:700}',
    '.reorder-tip{margin:10px 0 2px;padding:10px 13px;border:1px dashed #b9c7dc;border-radius:10px;background:#f5f8fd;color:#61718a;font-size:12px}',
    '.reorder-handle{position:absolute;z-index:4;top:10px;left:10px;display:flex;align-items:center;gap:4px;border:1px solid #cdd7e6;border-radius:9px;background:#fff;color:#50647f;padding:5px 8px;box-shadow:0 3px 10px rgba(31,50,80,.12);cursor:grab;touch-action:none}',
    '.reorder-handle span{font-size:20px;line-height:14px;letter-spacing:-3px}.reorder-handle em{font-style:normal;font-size:11px;font-weight:700}',
    '.myhub-reorder-mode .cards>article.card{position:relative;outline:1px dashed #c8d3e2;cursor:grab;transition:transform .14s ease,box-shadow .14s ease,opacity .14s ease}',
    '.myhub-reorder-mode .cards>article.card .card-head{padding-top:28px}',
    '.myhub-reorder-mode .cards>article.card.reorder-dragging{opacity:.55;transform:scale(.98);cursor:grabbing}',
    '.myhub-reorder-mode .cards>article.card.reorder-drop-target{outline:2px solid #4e77b6;box-shadow:0 0 0 4px rgba(78,119,182,.12)}',
    '@media(max-width:700px){.reorder-handle{top:8px;left:8px;padding:7px 9px}.reorder-tip{font-size:11px;line-height:1.45}.myhub-reorder-mode .cards>article.card{user-select:none;-webkit-user-select:none}}'
  ].join('\n');document.head.appendChild(style);
  const ob=new MutationObserver(()=>{if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;setup();});});
  ob.observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('storage',e=>{if(e.key===ORDER_KEY)apply();});window.addEventListener('focus',setup);setup();
})();