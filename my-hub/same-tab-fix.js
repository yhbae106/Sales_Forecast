(()=>{
  const SAME_TAB_NAMES=new Set([
    'VC 평가현황',
    'VC평가현황',
    'EPM 작성',
    '세일즈 포스',
    '세일즈포스',
    '협력 도매사 물동량 관리',
    '협력도매사 물동량 관리'
  ].map(v=>v.replace(/\s+/g,'').toLowerCase()));

  const normalize=v=>(v||'').replace(/\s+/g,'').toLowerCase();
  const shouldUseSameTab=name=>SAME_TAB_NAMES.has(normalize(name));

  document.addEventListener('click',e=>{
    const target=e.target instanceof Element?e.target:null;
    if(!target)return;

    const card=target.closest('article.card');
    if(!card)return;

    const heading=card.querySelector('h3 button');
    const name=heading?.textContent?.trim()||'';
    if(!shouldUseSameTab(name))return;

    const openButton=target.closest('h3 button, .card-footer > button');
    if(!openButton)return;

    const href=card.querySelector('.card-footer a[href]')?.getAttribute('href');
    if(!href)return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    window.location.assign(href);
  },true);
})();