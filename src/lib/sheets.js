// Google Sheets / Excel import. One tab = one house.
//
// Each tab holds label/value rows: column A is the field label, column B the
// value. Labels are matched loosely (case, accents, punctuation and units are
// ignored) in English or Vietnamese. The tab name becomes the house name.
//
// A sheet shared as "Anyone with the link can view" can be downloaded as
// .xlsx straight from the browser (Google sends CORS headers on the export
// endpoint), so no API key or sign-in is needed. SheetJS is loaded on demand.

import { DEFAULTS } from './defaults';

const loadXLSX = () => import('xlsx');

// ---------------------------------------------------------------------------
// Field matching
// ---------------------------------------------------------------------------

const FIELDS = {
  market: ['market', 'country', 'thi truong'],
  price: ['purchase price', 'price', 'gia mua', 'gia mua bds'],
  downPct: ['down payment', 'down payment pct', 'down', 'von tu co', 'ti le von tu co'],
  closingPct: ['closing costs', 'closing cost', 'closing', 'phi mua'],
  rate: ['interest rate', 'mortgage rate', 'rate', 'lai suat vay', 'lai suat'],
  amort: ['amortization', 'amortization years', 'amortisation', 'term', 'thoi han vay'],
  rent: ['monthly rent', 'rent', 'rent per month', 'gia thue', 'gia thue thang', 'tien thue'],
  vacancy: ['vacancy', 'vacancy rate', 'ti le trong'],
  propTax: ['property tax', 'property tax yr', 'property tax per year', 'thue dat', 'thue dat nam'],
  insurance: ['insurance', 'insurance yr', 'insurance per year', 'bao hiem', 'bao hiem nam'],
  strata: ['strata', 'strata mo', 'strata fee', 'strata maintenance', 'hoa', 'condo fee', 'phi quan ly', 'phi quan ly thang'],
  other: ['other', 'other mo', 'other expenses', 'other monthly', 'khac', 'khac thang', 'chi phi khac'],
  appreciation: ['appreciation', 'property growth', 'price growth', 'bds tang gia', 'tang gia'],
  rentGrowth: ['rent growth', 'rent increase', 'tang gia thue'],
  expInflation: ['expense inflation', 'expense growth', 'inflation', 'lam phat chi phi'],
  sellingPct: ['selling costs', 'selling cost', 'phi ban'],
  horizon: ['hold period', 'holding period', 'hold years', 'horizon', 'thoi gian nam giu'],
  claimCCA: ['claim cca', 'cca', 'claim cca depreciation'],
  buildingPct: ['building share of cost', 'building share', 'building pct', 'building portion'],
  ccaRate: ['cca rate'],
};

export const normLabel = (s) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ') // drop "(%)", "($)", "(VND)"
    .replace(/\/\s*(yr|year|mo|month|nam|thang)\b/g, ' $1')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const LOOKUP = new Map();
for (const [key, aliases] of Object.entries(FIELDS)) for (const a of aliases) LOOKUP.set(normLabel(a), key);

export const matchField = (label) => LOOKUP.get(normLabel(label)) ?? null;

const PERCENT_FIELDS = new Set(['downPct', 'closingPct', 'rate', 'vacancy', 'appreciation', 'rentGrowth', 'expInflation', 'sellingPct', 'buildingPct', 'ccaRate']);

// "4 tỷ", "15tr", "2.4k", "$530,000", "25%", 0.25 (a percent-formatted cell)
export function parseValue(field, raw, display) {
  if (field === 'market') {
    const v = normLabel(raw);
    if (['ca', 'canada', 'bc'].includes(v)) return 'CA';
    if (['vn', 'vietnam', 'viet nam'].includes(v)) return 'VN';
    return undefined;
  }
  if (field === 'claimCCA') {
    if (typeof raw === 'boolean') return raw;
    const v = normLabel(raw);
    if (['yes', 'y', 'true', '1', 'co'].includes(v)) return true;
    if (['no', 'n', 'false', '0', 'khong'].includes(v)) return false;
    return undefined;
  }
  if (typeof raw === 'number') {
    // A cell formatted as percent stores 0.25 for 25%.
    if (PERCENT_FIELDS.has(field) && typeof display === 'string' && display.trim().endsWith('%')) return raw * 100;
    return raw;
  }
  const text = String(raw ?? '').trim();
  if (!text) return undefined;
  const m = text
    .toLowerCase()
    .replace(/[$₫]|\bvnd\b|đ$/g, '')
    .replace(/\s+/g, '')
    .match(/^(-?[\d.,]+)(%|k|m|tr|trieu|triệu|ty|tỷ|b|bn)?$/);
  if (!m) return undefined;
  const num = parseLocaleNumber(m[1]);
  if (!Number.isFinite(num)) return undefined;
  const mult = { k: 1e3, m: 1e6, tr: 1e6, trieu: 1e6, 'triệu': 1e6, ty: 1e9, 'tỷ': 1e9, b: 1e9, bn: 1e9 }[m[2]] ?? 1;
  return num * mult;
}

// Accepts "530,000", "530.000", "4,5", "4.5", "1.234,5".
function parseLocaleNumber(s) {
  const commas = (s.match(/,/g) || []).length;
  const dots = (s.match(/\./g) || []).length;
  if (commas && dots) return parseFloat(s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, ''));
  if (commas > 1 || (commas === 1 && /,\d{3}$/.test(s))) return parseFloat(s.replace(/,/g, ''));
  if (dots > 1 || (dots === 1 && /\.\d{3}$/.test(s) && !/^0\./.test(s))) return parseFloat(s.replace(/\./g, ''));
  return parseFloat(s.replace(',', '.'));
}

// rows: [[label, value, displayText?], ...] for one tab.
export function parseHouseRows(rows, fallbackMarket) {
  const inputs = {};
  const unknown = [];
  let market;
  for (const [label, value, display] of rows) {
    if (label == null || String(label).trim() === '') continue;
    const field = matchField(label);
    if (!field) {
      if (value != null && value !== '') unknown.push(String(label).trim());
      continue;
    }
    const v = parseValue(field, value, display);
    if (v === undefined) continue;
    if (field === 'market') market = v;
    else inputs[field] = v;
  }
  return { market: market || fallbackMarket, inputs, matched: Object.keys(inputs).length, unknown };
}

// ---------------------------------------------------------------------------
// Workbook IO
// ---------------------------------------------------------------------------

export function parseSheetUrl(text) {
  const s = String(text || '').trim();
  const m = s.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]{20,})/);
  if (m) return m[1];
  if (/^[a-zA-Z0-9_-]{25,}$/.test(s)) return s;
  return null;
}

export const sheetUrl = (id) => `https://docs.google.com/spreadsheets/d/${id}/edit`;

export class SheetAccessError extends Error {}

export async function fetchSheet(id) {
  let res;
  try {
    res = await fetch(`https://docs.google.com/spreadsheets/d/${encodeURIComponent(id)}/export?format=xlsx`, { credentials: 'omit' });
  } catch {
    // A private sheet redirects to a sign-in page without CORS headers.
    throw new SheetAccessError('not-shared');
  }
  const type = res.headers.get('content-type') || '';
  if (!res.ok || type.includes('text/html')) throw new SheetAccessError(res.status === 404 ? 'not-found' : 'not-shared');
  return res.arrayBuffer();
}

// Returns [{ tab, market, inputs, matched, unknown }] for tabs that look like houses.
export async function parseWorkbook(buffer, fallbackMarket) {
  const XLSX = await loadXLSX();
  const wb = XLSX.read(buffer, { type: 'array' });
  const houses = [];
  for (const tab of wb.SheetNames) {
    if (/^[_#]|^(readme|instructions|huong dan|hướng dẫn)$/i.test(tab.trim())) continue;
    const ws = wb.Sheets[tab];
    if (!ws || !ws['!ref']) continue;
    const range = XLSX.utils.decode_range(ws['!ref']);
    const rows = [];
    for (let r = range.s.r; r <= range.e.r; r++) {
      const a = ws[XLSX.utils.encode_cell({ r, c: 0 })];
      const b = ws[XLSX.utils.encode_cell({ r, c: 1 })];
      rows.push([a?.v, b?.v, b?.w]);
    }
    const house = parseHouseRows(rows, fallbackMarket);
    if (house.matched >= 2) houses.push({ tab: tab.trim(), ...house });
  }
  return houses;
}

const TEMPLATE_ROWS = (m) => {
  const d = DEFAULTS[m];
  const vn = m === 'VN';
  return [
    [vn ? 'Trường' : 'Field', vn ? 'Giá trị' : 'Value', vn ? 'Ghi chú' : 'Notes'],
    ['Market', m, 'CA or VN'],
    [vn ? 'Giá mua' : 'Purchase price', d.price, vn ? 'VND, hoặc "4 tỷ"' : 'dollars'],
    [vn ? 'Vốn tự có (%)' : 'Down payment (%)', d.downPct, ''],
    [vn ? 'Phí mua (%)' : 'Closing costs (%)', d.closingPct, vn ? '' : 'transfer tax, legal'],
    [vn ? 'Lãi suất vay (%)' : 'Interest rate (%)', d.rate, ''],
    [vn ? 'Thời hạn vay' : 'Amortization', d.amort, vn ? 'năm' : 'years'],
    [vn ? 'Giá thuê / tháng' : 'Monthly rent', d.rent, vn ? 'VND, hoặc "15 tr"' : ''],
    [vn ? 'Tỉ lệ trống (%)' : 'Vacancy (%)', d.vacancy, ''],
    [vn ? 'Thuế đất / năm' : 'Property tax / yr', d.propTax, ''],
    [vn ? 'Bảo hiểm / năm' : 'Insurance / yr', d.insurance, ''],
    [vn ? 'Phí quản lý / tháng' : 'Strata / mo', d.strata, ''],
    [vn ? 'Khác / tháng' : 'Other / mo', d.other, vn ? 'sửa chữa, môi giới' : 'repairs, management'],
    [vn ? 'BĐS tăng giá (%)' : 'Appreciation (%)', d.appreciation, vn ? 'mỗi năm' : 'per year'],
    [vn ? 'Tăng giá thuê (%)' : 'Rent growth (%)', d.rentGrowth, ''],
    [vn ? 'Lạm phát chi phí (%)' : 'Expense inflation (%)', d.expInflation, ''],
    [vn ? 'Phí bán (%)' : 'Selling costs (%)', d.sellingPct, ''],
    [vn ? 'Thời gian nắm giữ' : 'Hold period', d.horizon, vn ? 'năm' : 'years'],
    ...(vn ? [] : [['Claim CCA', 'No', 'Yes / No'], ['Building share (%)', d.buildingPct, 'only used with CCA']]),
  ];
};

export async function downloadTemplate(market) {
  const XLSX = await loadXLSX();
  XLSX.writeFile(buildTemplate(XLSX, market), `rent-vs-invest-houses-${market}.xlsx`);
}

export function buildTemplate(XLSX, market) {
  const wb = XLSX.utils.book_new();
  const readme = [
    ['Rent vs Invest — house template'],
    [''],
    ['Each tab is one house; the tab name becomes the house name.'],
    ['Column A = field label, column B = value. Rows you leave out use the app defaults.'],
    ['Tabs named README or starting with _ or # are ignored.'],
    [''],
    ['To link: upload to Google Drive, open with Google Sheets,'],
    ['Share → General access → "Anyone with the link" (Viewer), then paste the link into the app.'],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(readme), 'README');
  const names = market === 'VN' ? ['Căn hộ Quận 7', 'Nhà phố Thủ Đức'] : ['Downtown condo', 'Suburb townhouse'];
  names.forEach((name, i) => {
    const rows = TEMPLATE_ROWS(market).map((r) => [...r]);
    if (i === 1) {
      rows[2][1] = market === 'VN' ? 6e9 : 849000;
      rows[7][1] = market === 'VN' ? 22e6 : 3400;
    }
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 24 }, { wch: 16 }, { wch: 28 }];
    XLSX.utils.book_append_sheet(wb, ws, name);
  });
  return wb;
}
