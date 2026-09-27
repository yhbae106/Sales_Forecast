const { test, expect } = require('@playwright/test');

test('dashboard boots and keeps core regression contracts', async ({ page }) => {
  const pageErrors = [];
  const local404s = [];

  page.on('pageerror', err => pageErrors.push(err.message));
  page.on('response', response => {
    const u = new URL(response.url());
    if (u.origin === 'http://127.0.0.1:4173' && response.status() >= 400) {
      local404s.push(response.status() + ' ' + u.pathname);
    }
  });

  await page.route('**/shared-data/sales-history.json*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        updatedAt: '2026-09-23T05:00:00.000Z',
        sourceFiles: [{ lastDate: '2026-09-22' }],
        uploads: [],
        mbo: {},
        gmbo: {},
        sched: {},
        closedVendors: {}
      })
    });
  });

  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__sfCoreReady === true, null, { timeout: 20000 });

  await expect(page.locator('#status')).not.toContainText(/대시보드 로딩 오류|새 부트스트랩 로딩 실패|공용 데이터 연결 오류/);
  await expect(page.locator('#asof')).toContainText('9/23 기준');

  for (const selector of [
    '#vendorTable','#groupTable','#dailyTable','#detailTable','#compareTable',
    '#groupTarget','#groupMbo','#groupNeed'
  ]) {
    await expect(page.locator(selector)).toHaveCount(1);
  }

  expect(local404s, 'local asset 4xx responses').toEqual([]);
  expect(pageErrors, 'uncaught browser errors').toEqual([]);
});
