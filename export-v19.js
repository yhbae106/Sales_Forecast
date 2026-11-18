(() => {
  'use strict';
  const V='134';
  const files = ['export-v21.js','ui-streamline-v46.js','vendor-excel-format-v48.js',
    'detail-shell-v61.js','final-layout-v53.js','unified-loader-v74.js','visual-polish-v74.js',
    'decision-radar-v93.js','master-text-editor-v95.js'];
  let started = false;
  function reveal() {
    if (window.__sfBootFailed) return;
    document.documentElement.classList.remove('sf-booting');
    document.documentElement.classList.add('sf-ui-ready');
    document.querySelector('.wrap')?.setAttribute('aria-busy', 'false');
    document.getElementById('sfLoaderV74')?.remove();
  }
  async function loadFinal() {
    if (started || window.__sfBootFailed) return;
    started = true;
    try {
      await Promise.all(files.map(file => window.__sfLoadScript(file + '?v=' + V)));
      if (window.__SF_V73_READY || window.__SF_V61_READY) { requestAnimationFrame(reveal); return; }
      const timer = setTimeout(() => window.__sfShowLoadError('월별 상세 화면을 준비하지 못했습니다.'), 20000);
      window.addEventListener('sf-v61-ready', () => { clearTimeout(timer); requestAnimationFrame(reveal); }, {once:true});
    } catch (error) { window.__sfShowLoadError(error.message); }
  }
  if (window.__sfCoreReady) loadFinal();
  else window.addEventListener('sf-core-ready', loadFinal, {once:true});
})();
