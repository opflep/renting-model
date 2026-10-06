import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, Info } from 'lucide-react';
import { Card, CardHeader, ChartTooltip, Kpi, LegendRow } from './ui';
import { INK, SERIES, axisProps } from '../lib/theme';
import { tr } from '../lib/i18n';
import { ScenarioTable } from './Scenarios';

// Fixed color per option (follows the entity, not its rank).
const COLOR = { rental: SERIES[0], nonreg: SERIES[1], vnstock: SERIES[1], tfsa: SERIES[2], rrsp: SERIES[3], deposit: SERIES[4] };

export default function CompareTab({ p, rental, compare, all, scenario, t, fmt }) {
  const n = p.horizon;
  const isVN = p.market === 'VN';
  const kinds = Object.keys(compare.accounts);
  const rentalFinal = compare.rental.wealth[n];

  const options = [
    { key: 'rental', label: t.oRental, final: rentalFinal, irr: compare.rental.irr },
    ...kinds.map((k) => ({ key: k, label: t[`o_${k}`], final: compare.accounts[k].values[n], irr: compare.accounts[k].irr })),
  ];
  const best = options.slice(1).reduce((a, b) => (b.final > a.final ? b : a));
  const rank = [...options].sort((a, b) => b.final - a.final);

  const vars = {
    m: p.tax.marginal,
    d: p.tax.dividend,
    inc: p.tax.cgInclusion,
    r: p.tax.retirement,
    g: (1 / (1 - p.tax.marginal / 100)).toFixed(2),
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600 leading-relaxed max-w-4xl">{t.cmpIntro}</p>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <Kpi label={t.kRentalWealth} value={fmt.short(rentalFinal)} sub={tr(t.kRentalWealthSub, { v: fmt.pct(compare.rental.irr) })} />
        <Kpi label={t.kBestStock} value={fmt.short(best.final)} sub={`${best.label} · IRR ${fmt.pct(best.irr)}`} tone={best.final > rentalFinal ? 'good' : 'neutral'} />
        <Kpi label={t.kBreakEven} value={compare.breakEven == null ? '—' : fmt.pct(compare.breakEven)} sub={isVN ? t.kBreakEvenSubVN : t.kBreakEvenSub} desc={t.kBreakEvenDesc} formulaLabel={t.formula} />
        <Kpi label={t.kContributed} value={fmt.short(compare.totalContributed)} sub={tr(t.kContributedSub, { v: fmt.short(rental.initialCash) })} />
      </div>

      <Card className="p-5">
        <CardHeader title={t.cWealth} subtitle={t.cWealthSub} />
        <LegendRow items={[
          ...options.map((o) => ({ label: o.label, color: COLOR[o.key], line: true })),
          { label: t.sContributed, color: INK.muted, dashed: true },
        ]} />
        <div className="h-80">
          <ResponsiveContainer>
            <LineChart data={compare.series} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={INK.grid} />
              <XAxis dataKey="year" {...axisProps} />
              <YAxis tickFormatter={fmt.short} {...axisProps} width={64} />
              <Tooltip content={<ChartTooltip fmt={fmt.short} labelFmt={(l) => `${t.tYear} ${l}`} />} />
              <Line dataKey="contributed" name={t.sContributed} stroke={INK.muted} strokeDasharray="4 4" strokeWidth={1.5} dot={false} type="stepAfter" />
              {kinds.map((k) => (
                <Line key={k} dataKey={k} name={t[`o_${k}`]} stroke={COLOR[k]} strokeWidth={2} dot={false} type="monotone" />
              ))}
              <Line dataKey="rental" name={t.oRental} stroke={COLOR.rental} strokeWidth={3} dot={false} type="monotone" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <table className="min-w-full text-sm tabular-nums">
          <thead className="bg-slate-50 text-xs text-slate-500 border-b border-slate-200">
            <tr className="[&>th]:px-4 [&>th]:py-2.5 [&>th]:font-medium text-right">
              <th className="text-left">{t.thOption}</th>
              <th>{tr(t.thWealth, { n })}</th>
              <th>{t.thIrr}</th>
              <th>{t.thMultiple}</th>
              <th>{t.thVsRental}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rank.map((o) => {
              const diff = o.final - rentalFinal;
              return (
                <tr key={o.key} className={`text-right [&>td]:px-4 [&>td]:py-2.5 ${o.key === 'rental' ? 'bg-blue-50/40' : ''}`}>
                  <td className="text-left">
                    <span className="inline-flex items-center gap-2 font-medium text-slate-800">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLOR[o.key] }} />
                      {o.label}
                    </span>
                  </td>
                  <td className="font-semibold text-slate-900">{fmt.short(o.final)}</td>
                  <td>{fmt.pct(o.irr)}</td>
                  <td>{(o.final / compare.totalContributed).toFixed(2)}×</td>
                  <td className={o.key === 'rental' ? 'text-slate-400' : diff >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                    {o.key === 'rental' ? '—' : (diff >= 0 ? '+' : '') + fmt.short(diff)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <ScenarioTable all={all} active={scenario} t={t} fmt={fmt} horizon={n} />

      <div>
        <h3 className="text-[15px] font-semibold text-slate-900 mb-3">{t.taxHow}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {options.map((o) => {
            const overflow = compare.accounts[o.key]?.overflow || 0;
            const roomKey = { tfsa: 'tfsaRoom', rrsp: 'rrspRoom' }[o.key];
            return (
              <Card key={o.key} className="p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLOR[o.key] }} />
                  <span className="text-sm font-semibold text-slate-900">{o.label}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {tr(t[`tax_${o.key}`] || '', { ...vars, room: roomKey ? fmt.short(p.stocks[roomKey]) : '' })}
                </p>
                {overflow > 0 && (
                  <p className="mt-2 flex gap-1.5 text-[11px] text-amber-800 bg-amber-50 rounded-lg p-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
                    {tr(t.roomWarn, { over: fmt.short(overflow), need: fmt.short(compare.totalContributed) })}
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      <p className="flex gap-2 text-xs text-slate-500 leading-relaxed">
        <Info className="w-4 h-4 shrink-0 text-slate-400" />
        {t.cmpCaveat}
      </p>
    </div>
  );
}
