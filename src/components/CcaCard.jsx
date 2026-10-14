import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Sparkles } from 'lucide-react';
import { Card, CardHeader, ChartTooltip, InfoTip, LegendRow } from './ui';
import { INK, SERIES, axisProps } from '../lib/theme';
import { analyzeCcaCases } from '../lib/store';
import { bestCcaWindow } from '../lib/ccaOptimizer';
import { describeTax } from '../lib/taxcases';
import { tr } from '../lib/i18n';

// What claiming CCA does to the rental's return under each tax path.
export default function CcaCard({ p, shared, scenario, stockScenario, onApplyCca, t, fmt }) {
  const cases = shared.taxCases;
  const grid = useMemo(() => analyzeCcaCases(p, cases, scenario, stockScenario), [p, cases, scenario, stockScenario]);
  const best = useMemo(() => Object.fromEntries(cases.map((c) => [c.id, bestCcaWindow(p, c.tax)])), [p, cases]);
  if (p.market !== 'CA') return null;
  const n = p.horizon;

  const rows = cases.map((c) => {
    const pick = (key) => {
      const { rental, compare } = grid[c.id][key];
      const last = rental.rows[n - 1];
      return {
        irr: compare.rental.irr,
        cashIn: compare.totalContributed,
        profit: compare.rental.wealth[n] - compare.totalContributed,
        taxY1: rental.rows[0].taxBill / 12,
        claimed: rental.rows.reduce((a, r) => a + r.cca, 0),
        recapture: last.recaptureTax,
      };
    };
    return {
      id: c.id,
      label: c.name,
      desc: describeTax(c.tax, t),
      none: pick('none'),
      cca: pick('cca'),
      best: best[c.id].best,
      active: c.id === shared.activeTaxCase,
    };
  });
  const chart = rows.map((r) => ({ label: r.label, none: r.none.irr, cca: r.cca.irr }));
  const pctFmt = (v) => fmt.pct(v);

  return (
    <Card className="p-5">
      <CardHeader title={t.ccaTitle} subtitle={tr(t.ccaSub, { b: p.buildingPct, r: p.ccaRate, n })} />
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <div className="xl:col-span-2 h-56">
          <LegendRow items={[{ label: t.ccaOff, color: SERIES[0] }, { label: t.ccaOn, color: SERIES[2] }]} />
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={chart} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={2}>
              <CartesianGrid vertical={false} stroke={INK.grid} />
              <XAxis dataKey="label" {...axisProps} interval={0} tick={{ ...axisProps.tick, fontSize: 10 }} />
              <YAxis tickFormatter={pctFmt} {...axisProps} width={48} />
              <Tooltip content={<ChartTooltip fmt={pctFmt} />} cursor={{ fill: '#f1f5f9' }} />
              <Bar dataKey="none" name={t.ccaOff} fill={SERIES[0]} radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="cca" name={t.ccaOn} fill={SERIES[2]} radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="xl:col-span-3 overflow-x-auto">
          <table className="min-w-full text-xs tabular-nums">
            <thead className="text-slate-500 border-b border-slate-200">
              <tr className="text-right [&>th]:px-2.5 [&>th]:py-2 [&>th]:font-medium [&>th]:whitespace-nowrap">
                <th className="text-left">{t.scLabel}</th>
                <th />
                <th>{t.ccaTaxY1}</th>
                <th>{t.hCashIn}</th>
                <th>{t.ccaClaimed}</th>
                <th>{t.ccaRecapture}</th>
                <th>
                  <span className="inline-flex items-center gap-1">
                    {t.ccaProfit}
                    <InfoTip text={t.ccaProfitTip} />
                  </span>
                </th>
                <th>{t.ccaIrr}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) =>
                ['none', 'cca', 'best'].map((key, i) => {
                  if (key === 'best') {
                    const b = r.best;
                    const isCurrent = JSON.stringify(b.steps) === JSON.stringify(p.tax.ccaSteps) && r.active;
                    const label = b.from === 0 ? t.ccaBestNone : b.from === 1 && b.to === n ? t.ccaBestAll : tr(t.ccaBestWindow, { a: b.from, b: b.to });
                    return (
                      <tr key={`${r.id}-best`} className={`text-right [&>td]:px-2.5 [&>td]:py-1.5 [&>td]:whitespace-nowrap ${r.active ? 'bg-blue-50/40' : ''}`}>
                        <td />
                        <td className="text-left text-amber-700 font-medium">
                          <span className="inline-flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> {t.ccaBest}
                          </span>
                        </td>
                        <td colSpan={3} className="text-left text-slate-600">
                          {label}
                          {b.from > 0 && <span className="text-slate-400"> · {t.ccaClaimed} {fmt.short(b.claimed)}</span>}
                        </td>
                        <td>{b.from > 0 ? fmt.short(b.recaptureTax) : '—'}</td>
                        <td className="font-semibold text-slate-900">{fmt.short(b.profit)}</td>
                        <td className="font-semibold text-amber-700">
                          {fmt.pct(b.irr)}
                          <span className="block text-[10px] text-slate-400">{(b.irr - r.none.irr >= 0 ? '+' : '') + (b.irr - r.none.irr).toFixed(1)} pts</span>
                        </td>
                        <td className="text-left">
                          {onApplyCca && (
                            <button
                              type="button"
                              disabled={isCurrent}
                              onClick={() => onApplyCca(r.id, b.steps)}
                              className="rounded-md bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-40"
                            >
                              {isCurrent ? t.ccaApplied : t.ccaApply}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  }
                  const v = r[key];
                  const delta = r.cca.irr - r.none.irr;
                  return (
                    <tr
                      key={`${r.id}-${key}`}
                      className={`text-right [&>td]:px-2.5 [&>td]:py-1.5 [&>td]:whitespace-nowrap ${i === 0 ? 'border-t border-slate-100' : ''} ${r.active ? 'bg-blue-50/40' : ''}`}
                    >
                      <td className="text-left font-medium text-slate-800">
                        {i === 0 ? r.label : ''}
                        {i === 0 && <span className="block text-[10px] font-normal text-slate-400">{r.desc}</span>}
                      </td>
                      <td className={`text-left ${key === 'cca' ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>{key === 'cca' ? t.ccaOn : t.ccaOff}</td>
                      <td>{fmt.short(v.taxY1)}</td>
                      <td>{fmt.short(v.cashIn)}</td>
                      <td>{key === 'cca' ? fmt.short(v.claimed) : '—'}</td>
                      <td>{key === 'cca' ? fmt.short(v.recapture) : '—'}</td>
                      <td className="font-semibold text-slate-900">{fmt.short(v.profit)}</td>
                      <td className={key === 'cca' ? 'font-semibold text-emerald-700' : ''}>
                        {fmt.pct(v.irr)}
                        {key === 'cca' && <span className="block text-[10px] text-slate-400">{(delta >= 0 ? '+' : '') + delta.toFixed(1)} pts</span>}
                      </td>
                      <td />
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">{t.ccaNote} {t.ccaBestNote}</p>
        </div>
      </div>
    </Card>
  );
}
