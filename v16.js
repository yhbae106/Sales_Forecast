(() => {
  'use strict';
  const V='134';
  const bundled = window.__sfBundledScripts;
  const requests = new Map();

  window.__sfShowLoadError = message => {
    window.__sfBootFailed = true;
    document.documentElement.classList.add('sf-booting');
    const box = document.querySelector('#sfLoaderV74 .box');
    if (!box) return;
    const title = document.createElement('strong');
    title.textContent = '매출 대시보드를 불러오지 못했습니다.';
    const detail = document.createElement('p');
    detail.textContent = message;
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.textContent = '다시 불러오기';
    retry.onclick = () => location.reload();
    box.replaceChildren(title, detail, retry);
    box.setAttribute('role', 'alert');
  };

  function fetchScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const finish = error => {
        clearTimeout(timer);
        script.onload = script.onerror = null;
        if (error) { script.remove(); reject(error); } else resolve();
      };
      const timer = setTimeout(() => finish(new Error('파일 응답이 지연됩니다. 다시 불러와 주세요.')), 20000);
      script.async = false;
      script.src = src;
      script.onload = () => finish();
      script.onerror = () => finish(new Error('파일을 불러오지 못했습니다. ' + src.split('?')[0]));
      document.body.appendChild(script);
    });
  }

  window.__sfLoadScript = src => {
    const name = src.split('?')[0];
    if (!requests.has(src)) {
      const run = bundled && Object.hasOwn(bundled, name) ? bundled[name] : null;
      const task = run ? Promise.resolve().then(run) : fetchScript(src);
      requests.set(src, task.catch(error => { requests.delete(src); throw error; }));
    }
    return requests.get(src);
  };
  Promise.all([window.__sfLoadScript('sales-pace.js?v=' + V), window.__sfLoadScript('data-reliability.js?v=' + V)])
    .then(() => window.__sfLoadScript('bootstrap-v36.js?v=' + V))
    .catch(error => window.__sfShowLoadError(error.message));
})();
