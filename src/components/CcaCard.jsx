import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardHeader, ChartTooltip, InfoTip, LegendRow } from './ui';
import { INK, SERIES, axisProps } from '../lib/theme';
import { TAX_PATHS, analyzeCcaPaths } from '../lib/store';
import { tr } from '../lib/i18n';

// What claiming CCA does to the rental's return under each tax path.
export default function CcaCard({ p, scenario, stockScenario, t, fmt }) {
  const grid = useMemo(() => analyzeCcaPaths(p, scenario, stockScenario), [p, scenario, stockScenario]);
  if (p.market !== 'CA') return null;
  const n = p.horizon;

  const rows = TAX_PATHS.map((dropYear) => {
    const pick = (key) => {
      const { rental, compare } = grid[dropYear][key];
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
      dropYear,
      label: dropYear ? tr(t.tpDrop, { y: dropYear }) : tr(t.tpNever, { n }),
      none: pick('none'),
      cca: pick('cca'),
      active: (p.tax.dropYear || 0) === dropYear,
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
              </tr>
            </thead>
            <tbody>
              {rows.map((r) =>
                ['none', 'cca'].map((key, i) => {
                  const v = r[key];
                  const delta = r.cca.irr - r.none.irr;
                  return (
                    <tr
                      key={`${r.dropYear}-${key}`}
                      className={`text-right [&>td]:px-2.5 [&>td]:py-1.5 [&>td]:whitespace-nowrap ${i === 0 ? 'border-t border-slate-100' : ''} ${r.active ? 'bg-blue-50/40' : ''}`}
                    >
                      <td className="text-left font-medium text-slate-800">{i === 0 ? r.label : ''}</td>
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
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">{t.ccaNote}</p>
        </div>
      </div>
    </Card>
  );
}
