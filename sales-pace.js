(() => {
  'use strict';

  // A worksheet stores percentage points, as in the existing SKU (%) column.
  // Retain more digits only when rounding would put a result on the wrong side of 100.
  function displayDigits(points) {
    let digits = 1;
    while (digits < 10 && points < 100 && Number(points.toFixed(digits)) === 100) digits++;
    return digits;
  }

  function cell(rate, view, title = '') {
    const available = Number.isFinite(rate);
    const vendor = view === 'vendor';
    let tone = vendor ? 'v39-rate-neutral' : 'v61-neutral';
    let label = '—';
    if (available) {
      tone = vendor ? (rate >= 1 ? 'v39-rate-good' : 'v39-rate-bad') : (rate >= 1 ? 'v61-pos' : 'v61-neg');
      const points = rate * 100;
      const number = points.toFixed(displayDigits(points));
      label = points < 100 && Number(number) === 100 ? '100% 미만' : number + '%';
      if (view !== 'sku') label = '(' + label + ')';
    }
    if (vendor || view === 'group') {
      const width = available ? Math.max(0, Math.min(1, rate / 1.4)) * 100 : 0;
      label = '<span class="sf-ratebar" style="--rate:' + width.toFixed(1) + '%"><i></i><b>' + label + '</b></span>';
    }
    const tooltip = title ? ' title="' + title + '"' : '';
    return '<td class="' + tone + '" data-sf-rate="' + (available ? rate : '') + '"' + tooltip + '>' + label + '</td>';
  }

  function readCell(element) {
    const raw = element.dataset?.sfRate;
    if (raw === undefined) return undefined;
    return raw === '' ? null : Number(raw) * 100;
  }

  function formatWorksheet(sheet, headers, xlsx) {
    const col = headers.findIndex(header => String(header).includes('기준일 대비 매출률'));
    if (col < 0 || !sheet['!ref']) return;
    const last = xlsx.utils.decode_range(sheet['!ref']).e.r;
    for (let row = 1; row <= last; row++) {
      const entry = sheet[xlsx.utils.encode_cell({r: row, c: col})];
      if (entry?.t !== 'n') continue;
      const digits = displayDigits(entry.v);
      if (entry.v < 100 && Number(entry.v.toFixed(digits)) === 100) {
        entry.z = '[Red]"100% 미만"';
      } else {
        const pattern = '0.' + '0'.repeat(digits) + '"%"';
        entry.z = '[Green][>=100]' + pattern + ';[Red]' + pattern;
      }
    }
  }

  window.SFSalesPace = {cell, readCell, formatWorksheet};
})();
