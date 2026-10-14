import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardHeader, ChartTooltip, LegendRow } from './ui';
import { INK, SERIES, axisProps } from '../lib/theme';
import { analyzeTaxCases } from '../lib/store';
import { describeTax } from '../lib/taxcases';
import { tr } from '../lib/i18n';

// After-tax outcome of one house vs the best stock option under three
// marginal-rate paths: unchanged, drop in year 5, drop in year 10.
export default function TaxPathCard({ p, shared, scenario, stockScenario, t, fmt }) {
  const cases = shared.taxCases;
  const paths = useMemo(() => analyzeTaxCases(p, cases, scenario, stockScenario), [p, cases, scenario, stockScenario]);
  if (p.market !== 'CA') return null;
  const n = p.horizon;

  const rows = cases.map((c) => {
    const { compare } = paths[c.id];
    const [bestKind, best] = Object.entries(compare.accounts).reduce((a, b) => (b[1].values[n] > a[1].values[n] ? b : a));
    return {
      id: c.id,
      label: c.name,
      desc: describeTax(c.tax, t),
      cashIn: compare.totalContributed,
      rental: compare.rental.wealth[n],
      rentalIrr: compare.rental.irr,
      stock: best.values[n],
      stockIrr: best.irr,
      stockKind: t[`o_${bestKind}`],
      active: c.id === shared.activeTaxCase,
    };
  });

  return (
    <Card className="p-5">
      <CardHeader title={t.tcCardTitle} subtitle={tr(t.tcCardSub, { n })} />
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <div className="xl:col-span-2 h-56">
          <LegendRow items={[{ label: t.tpRental, color: SERIES[0] }, { label: t.tpStock, color: SERIES[1] }]} />
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={rows} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={2}>
              <CartesianGrid vertical={false} stroke={INK.grid} />
              <XAxis dataKey="label" {...axisProps} interval={0} tick={{ ...axisProps.tick, fontSize: 10 }} />
              <YAxis tickFormatter={fmt.short} {...axisProps} width={56} />
              <Tooltip content={<ChartTooltip fmt={fmt.short} />} cursor={{ fill: '#f1f5f9' }} />
              <Bar dataKey="rental" name={t.tpRental} fill={SERIES[0]} radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="stock" name={t.tpStock} fill={SERIES[1]} radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="xl:col-span-3 overflow-x-auto">
          <table className="min-w-full text-sm tabular-nums">
            <thead className="text-xs text-slate-500 border-b border-slate-200">
              <tr className="text-right [&>th]:px-3 [&>th]:py-2 [&>th]:font-medium [&>th]:whitespace-nowrap">
                <th className="text-left">{t.scLabel}</th>
                <th>{t.hCashIn}</th>
                <th>{t.tpRental}</th>
                <th>{t.thIrr}</th>
                <th>{t.tpStock}</th>
                <th>{t.thIrr}</th>
                <th>{t.tpGap}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => {
                const gap = r.rental - r.stock;
                return (
                  <tr key={r.id} className={`text-right [&>td]:px-3 [&>td]:py-2 [&>td]:whitespace-nowrap ${r.active ? 'bg-blue-50/40' : ''}`}>
                    <td className="text-left font-medium text-slate-800">
                      {r.label}
                      <span className="block text-[10px] font-normal text-slate-400">{r.desc}</span>
                    </td>
                    <td className="text-slate-500">{fmt.short(r.cashIn)}</td>
                    <td className="font-semibold text-slate-900">{fmt.short(r.rental)}</td>
                    <td>{fmt.pct(r.rentalIrr)}</td>
                    <td>
                      {fmt.short(r.stock)}
                      <span className="block text-[10px] text-slate-400">{r.stockKind}</span>
                    </td>
                    <td>{fmt.pct(r.stockIrr)}</td>
                    <td className={gap >= 0 ? 'text-emerald-700' : 'text-rose-600'}>{(gap >= 0 ? '+' : '') + fmt.short(gap)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">{t.tcCardNote}</p>
        </div>
      </div>
    </Card>
  );
}
