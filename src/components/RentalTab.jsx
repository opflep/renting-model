import { useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChevronDown } from 'lucide-react';
import { Card, CardHeader, ChartTooltip, Kpi, LegendRow } from './ui';
import { INK, SERIES, axisProps } from '../lib/theme';
import { tr } from '../lib/i18n';

export default function RentalTab({ p, rental, compare, t, fmt }) {
  const [showAll, setShowAll] = useState(false);
  const rows = rental.rows;
  const y1 = rows[0];
  const last = rows[rows.length - 1];
  const isVN = p.market === 'VN';
  const visible = showAll ? rows : rows.slice(0, 10);

  const coc = rental.initialCash > 0 ? (y1.cashflow / rental.initialCash) * 100 : 0;
  const capRate = p.price > 0 ? ((y1.grossRent - y1.operatingExpenses) / p.price) * 100 : 0;
  const tone = (v) => (v >= 0 ? 'good' : 'bad');

  const chartRows = visible.map((r) => ({ ...r, negTax: Math.max(0, r.taxBill) }));

  const outflows = [
    { label: t.sInterest, value: y1.interest, color: SERIES[2] },
    { label: t.sPrincipal, value: y1.principal, color: SERIES[3] },
    { label: t.strata.split(' /')[0], value: y1.breakdown.strata, color: SERIES[1] },
    { label: t.propTax.split(' /')[0], value: y1.breakdown.propTax, color: SERIES[1] },
    { label: t.insurance.split(' /')[0], value: y1.breakdown.insurance, color: SERIES[1] },
    { label: t.other.split(' /')[0], value: y1.breakdown.other, color: SERIES[1] },
    { label: t.sTax, value: y1.breakdown.incomeTax, color: SERIES[4] },
  ].filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
  const maxOut = Math.max(y1.grossRent, ...outflows.map((d) => d.value));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <Kpi label={t.kPreTax} value={fmt.short(y1.cashflowPreTax / 12)} sub={t.kPreTaxSub} tone={tone(y1.cashflowPreTax)} desc={t.kPreTaxDesc} formulaLabel={t.formula} />
        <Kpi label={t.kAfterTax} value={fmt.short(y1.cashflow / 12)} sub={tr(t.kAfterTaxSub, { v: fmt.short(y1.taxBill / 12) })} tone={tone(y1.cashflow)} desc={isVN ? t.kAfterTaxDescVN : t.kAfterTaxDescCA} formulaLabel={t.formula} />
        <Kpi label={t.kCoC} value={fmt.pct(coc)} sub={tr(t.kCoCSub, { v: fmt.short(rental.initialCash) })} tone={tone(coc)} desc={t.kCoCDesc} formulaLabel={t.formula} />
        <Kpi label={t.kCap} value={fmt.pct(capRate)} sub={t.kCapSub} desc={t.kCapDesc} formulaLabel={t.formula} />
        <Kpi label={t.kPayment} value={fmt.short(rental.payment)} sub={tr(t.kPaymentSub, { i: fmt.short(y1.interest / 12), p: fmt.short(y1.principal / 12) })} desc={t.kPaymentDesc} formulaLabel={t.formula} />
        <Kpi label={t.kIrr} value={fmt.pct(compare.rental.irr)} sub={tr(t.kIrrSub, { n: p.horizon })} tone={tone(compare.rental.irr ?? 0)} desc={t.kIrrDesc} formulaLabel={t.formula} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <Card className="p-5 xl:col-span-3">
          <CardHeader title={t.cCashflow} subtitle={t.cCashflowSub} />
          <LegendRow items={[
            { label: t.sRent, color: SERIES[0] },
            { label: t.sOpex, color: SERIES[1] },
            { label: t.sInterest, color: SERIES[2] },
            { label: t.sPrincipal, color: SERIES[3] },
            { label: t.sTax, color: SERIES[4] },
            { label: t.sNet, color: INK.primary, line: true },
          ]} />
          <div className="h-72">
            <ResponsiveContainer>
              <ComposedChart data={chartRows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}>
                <CartesianGrid vertical={false} stroke={INK.grid} />
                <XAxis dataKey="year" {...axisProps} />
                <YAxis tickFormatter={fmt.short} {...axisProps} width={64} />
                <Tooltip content={<ChartTooltip fmt={fmt.short} labelFmt={(l) => `${t.tYear} ${l}`} />} cursor={{ fill: '#f1f5f9' }} />
                <ReferenceLine y={0} stroke={INK.muted} />
                <Bar dataKey="grossRent" name={t.sRent} fill={SERIES[0]} radius={[4, 4, 0, 0]} maxBarSize={18} />
                <Bar dataKey="operatingExpenses" name={t.sOpex} stackId="c" fill={SERIES[1]} stroke="#fff" strokeWidth={1} maxBarSize={18} />
                <Bar dataKey="interest" name={t.sInterest} stackId="c" fill={SERIES[2]} stroke="#fff" strokeWidth={1} maxBarSize={18} />
                <Bar dataKey="principal" name={t.sPrincipal} stackId="c" fill={SERIES[3]} stroke="#fff" strokeWidth={1} maxBarSize={18} />
                <Bar dataKey="negTax" name={t.sTax} stackId="c" fill={SERIES[4]} stroke="#fff" strokeWidth={1} radius={[4, 4, 0, 0]} maxBarSize={18} />
                <Line dataKey="cashflow" name={t.sNet} stroke={INK.primary} strokeWidth={2} dot={{ r: 3, strokeWidth: 0, fill: INK.primary }} type="monotone" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 xl:col-span-2">
          <CardHeader title={t.cOutflows} subtitle={t.cOutflowsSub} />
          <div className="space-y-2.5">
            <BarRow label={t.sRent} value={y1.grossRent} max={maxOut} color={SERIES[0]} fmt={fmt} strong />
            <div className="border-t border-dashed border-slate-200" />
            {outflows.map((d) => (
              <BarRow key={d.label} label={d.label} value={d.value} max={maxOut} color={d.color} fmt={fmt} share={d.value / y1.grossRent} />
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card className="p-5">
          <CardHeader title={t.cEquity} />
          <LegendRow items={[
            { label: t.sValue, color: SERIES[0], line: true },
            { label: t.sEquity, color: SERIES[2], line: true },
            { label: t.sLoan, color: SERIES[1], dashed: true },
          ]} />
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={visible} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={SERIES[0]} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={SERIES[0]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={INK.grid} />
                <XAxis dataKey="year" {...axisProps} />
                <YAxis tickFormatter={fmt.short} {...axisProps} width={64} />
                <Tooltip content={<ChartTooltip fmt={fmt.short} labelFmt={(l) => `${t.tYear} ${l}`} />} />
                <Area dataKey="propertyValue" name={t.sValue} stroke={SERIES[0]} fill="url(#gVal)" strokeWidth={2} type="monotone" />
                <Area dataKey="equity" name={t.sEquity} stroke={SERIES[2]} fill="transparent" strokeWidth={2} type="monotone" />
                <Area dataKey="loanBalance" name={t.sLoan} stroke={SERIES[1]} fill="transparent" strokeWidth={2} strokeDasharray="5 4" type="monotone" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <CardHeader title={t.cGain} subtitle={t.cGainSub} />
          <LegendRow items={[
            { label: t.sNet, color: SERIES[0] },
            { label: t.sPrincipal, color: SERIES[3] },
            { label: t.sAppreciation, color: SERIES[2] },
          ]} />
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={visible} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} stackOffset="sign">
                <CartesianGrid vertical={false} stroke={INK.grid} />
                <XAxis dataKey="year" {...axisProps} />
                <YAxis tickFormatter={fmt.short} {...axisProps} width={64} />
                <Tooltip content={<ChartTooltip fmt={fmt.short} labelFmt={(l) => `${t.tYear} ${l}`} />} cursor={{ fill: '#f1f5f9' }} />
                <ReferenceLine y={0} stroke={INK.muted} />
                <Bar dataKey="cashflow" name={t.sNet} stackId="g" fill={SERIES[0]} stroke="#fff" strokeWidth={1} maxBarSize={22} />
                <Bar dataKey="principal" name={t.sPrincipal} stackId="g" fill={SERIES[3]} stroke="#fff" strokeWidth={1} maxBarSize={22} />
                <Bar dataKey="appreciation" name={t.sAppreciation} stackId="g" fill={SERIES[2]} stroke="#fff" strokeWidth={1} radius={[4, 4, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <ExitCard p={p} last={last} t={t} fmt={fmt} />

      <Card className="overflow-hidden">
        <div className="p-5 pb-3 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-slate-900">{t.table}</h3>
          {rows.length > 10 && (
            <button type="button" onClick={() => setShowAll(!showAll)} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700">
              {showAll ? t.showLess : tr(t.showAll, { n: rows.length })}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAll ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs tabular-nums">
            <thead className="bg-slate-50 text-slate-500 border-y border-slate-200">
              <tr className="text-right [&>th]:px-4 [&>th]:py-2.5 [&>th]:font-medium">
                <th className="text-left">{t.tYear}</th>
                <th>{t.tRent}</th>
                <th>{t.tCosts}</th>
                <th>{t.tInterest}</th>
                <th>{t.tPrincipal}</th>
                <th>{t.tTax}</th>
                <th>{t.tCashflow}</th>
                <th>{t.tEquity}</th>
                <th>{t.tExit}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((r) => (
                <tr key={r.year} className="text-right hover:bg-slate-50 [&>td]:px-4 [&>td]:py-2">
                  <td className="text-left font-medium text-slate-700">{r.year}</td>
                  <td>{fmt.short(r.grossRent)}</td>
                  <td className="text-slate-500">{fmt.short(-r.operatingExpenses)}</td>
                  <td className="text-slate-500">{fmt.short(-r.interest)}</td>
                  <td className="text-slate-500">{fmt.short(-r.principal)}</td>
                  <td className="text-slate-500">{fmt.short(-r.taxBill)}</td>
                  <td className={`font-medium ${r.cashflow >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>{fmt.short(r.cashflow)}</td>
                  <td>{fmt.short(r.equity)}</td>
                  <td className="font-semibold text-slate-900">{fmt.short(r.netSaleProceeds)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function BarRow({ label, value, max, color, fmt, share, strong }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr_4.5rem] items-center gap-3 text-xs">
      <span className={`truncate ${strong ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>{label}</span>
      <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: color }} />
      </div>
      <span className="text-right tabular-nums text-slate-900">
        {fmt.short(value)}
        {share != null && <span className="block text-[10px] text-slate-400">{Math.round(share * 100)}%</span>}
      </span>
    </div>
  );
}

function ExitCard({ p, last, t, fmt }) {
  const isVN = p.market === 'VN';
  const lines = [
    { label: t.exitPrice, value: last.propertyValue },
    { label: t.exitSelling, value: -last.sellingCosts, note: `${p.sellingPct}%` },
    { label: t.exitLoan, value: -last.loanBalance },
    {
      label: t.exitCG,
      value: -last.capitalGainsTax,
      note: isVN ? t.exitCGNoteVN : tr(t.exitCGNote, { inc: p.tax.cgInclusion, m: p.tax.marginal }),
    },
  ];
  if (!isVN && p.claimCCA) lines.push({ label: t.exitRecapture, value: -last.recaptureTax });
  return (
    <Card className="p-5">
      <CardHeader title={tr(t.cExit, { n: last.year })} />
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {lines.map((l) => (
          <div key={l.label} className="rounded-xl bg-slate-50 p-3">
            <p className="text-[11px] text-slate-500">{l.label}</p>
            <p className={`text-base font-semibold tabular-nums ${l.value < 0 ? 'text-slate-700' : 'text-slate-900'}`}>{fmt.short(l.value)}</p>
            {l.note && <p className="text-[10px] text-slate-400 mt-0.5">{l.note}</p>}
          </div>
        ))}
        <div className="rounded-xl bg-blue-50 p-3 ring-1 ring-blue-100">
          <p className="text-[11px] text-blue-700">{t.exitNet}</p>
          <p className="text-base font-semibold tabular-nums text-blue-900">{fmt.short(last.netSaleProceeds)}</p>
        </div>
      </div>
    </Card>
  );
}
