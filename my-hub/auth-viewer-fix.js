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