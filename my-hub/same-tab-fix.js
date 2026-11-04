(()=>{
  const STORAGE_KEY='yhbae106.myhub.v2';
  const NAMES=[
    'VC 평가현황','VC평가현황',
    'EPM 작성','EPM 작성하기'
  ];
  const normalize=v=>(v||'').replace(/\s+/g,'').toLowerCase();
  const SAME_TAB=new Set(NAMES.map(normalize));
  let boards=new Map();

  function addBoard(row){
    if(!row||row.deleted===true||typeof row.name!=='string'||typeof row.url!=='string')return;
    try{
      const u=new URL(row.url,location.href);
      if(!['http:','https:'].includes(u.protocol))return;
      boards.set(normalize(row.name),u.href);
    }catch{}
  }

  function loadLocal(){
    try{
      const raw=localStorage.getItem(STORAGE_KEY);
      if(!raw)return;
      const data=JSON.parse(raw);
      if(data?.version===2&&Array.isArray(data.entries))data.entries.forEach(addBoard);
    }catch{}
  }

  async function refreshBoards(){
    boards=new Map();
    try{
      const r=await fetch('./catalog.json',{cache:'no-store'});
      if(r.ok){
        const rows=await r.json();
        if(Array.isArray(rows))rows.forEach(addBoard);
      }
    }catch{}
    loadLocal();
  }

  function nameFrom(el){
    const card=el.closest('article.card');
    if(card)return card.querySelector('h3 button')?.textContent?.trim()||'';
    const recent=el.closest('.recent-row');
    if(recent)return recent.querySelector('strong')?.textContent?.trim()||'';
    return '';
  }

  function shouldHandle(el){
    if(el.closest('a[target="_blank"], .icon-button, .favorite, [aria-label*="수정"], [aria-label*="즐겨찾기"]'))return false;
    return !!el.closest('article.card h3 button, article.card .card-footer > button, .recent-row');
  }

  function resolveUrl(name,el){
    const card=el.closest('article.card');
    const direct=card?.querySelector('.card-footer a[href]')?.getAttribute('href');
    if(direct){
      try{return new URL(direct,location.href).href;}catch{}
    }
    return boards.get(normalize(name))||'';
  }

  document.addEventListener('click',e=>{
    const target=e.target instanceof Element?e.target:null;
    if(!target||!shouldHandle(target))return;
    const name=nameFrom(target);
    if(!SAME_TAB.has(normalize(name)))return;
    const href=resolveUrl(name,target);
    if(!href)return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    try{sessionStorage.setItem('myhub.lastSameTab',JSON.stringify({name,href,at:Date.now()}));}catch{}
    window.location.assign(href);
  },true);

  window.addEventListener('storage',e=>{if(e.key===STORAGE_KEY)refreshBoards();});
  window.addEventListener('focus',refreshBoards);
  refreshBoards();
})();