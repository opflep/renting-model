export function makeFormatters(market) {
  const isVN = market === 'VN';
  const locale = isVN ? 'vi-VN' : 'en-CA';
  const currency = isVN ? 'VND' : 'CAD';

  const money = (v) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(v || 0);

  const short = (v) => {
    if (v == null || !isFinite(v)) return '—';
    const a = Math.abs(v);
    const sign = v < 0 ? '-' : '';
    if (isVN) {
      if (a >= 1e9) return sign + (a / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + ' tỷ';
      if (a >= 1e6) return sign + (a / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' tr';
      return sign + Math.round(a).toLocaleString('vi-VN') + ' đ';
    }
    if (a >= 1e6) return sign + '$' + (a / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M';
    if (a >= 1e4) return sign + '$' + (a / 1e3).toFixed(0) + 'k';
    if (a >= 1e3) return sign + '$' + (a / 1e3).toFixed(1) + 'k';
    return sign + '$' + Math.round(a);
  };

  const pct = (v, digits = 1) =>
    v == null || !isFinite(v) ? '—' : `${v.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;

  return { money, short, pct, locale };
}
