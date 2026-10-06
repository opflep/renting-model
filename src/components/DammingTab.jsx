import { Area, ComposedChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowRight, Info, ShieldAlert } from 'lucide-react';
import { Card, CardHeader, ChartTooltip, Kpi, LegendRow } from './ui';
import { INK, SERIES, axisProps } from '../lib/theme';
import { tr } from '../lib/i18n';

export default function DammingTab({ p, damming, t, fmt }) {
  if (!damming) {
    return (
      <Card className="p-8 text-center text-sm text-slate-600 max-w-xl mx-auto">
        <Info className="w-6 h-6 mx-auto mb-3 text-slate-400" />
        {t.dNotCA}
      </Card>
    );
  }

  const n = p.horizon;
  const { series, base, dam } = damming;
  const last = series[series.length - 1];
  const payoff = (y) => (y == null ? tr(t.kPayoffNever, { n }) : tr(t.kYears, { v: y }));
  const steps = [
    [t.step1, t.step1d],
    [t.step2, t.step2d],
    [t.step3, t.step3d],
    [t.step4, t.step4d],
  ];

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600 leading-relaxed max-w-4xl">{t.dIntro}</p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-stretch">
        {steps.map(([title, desc], i) => (
          <div key={title} className="relative rounded-xl border border-slate-200 bg-white p-3">
            <span className="text-[10px] font-semibold text-blue-700">0{i + 1}</span>
            <p className="text-sm font-semibold text-slate-900">{title}</p>
            <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
            {i < 3 && <ArrowRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-4 h-4 text-slate-300 bg-slate-50 rounded-full" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <Kpi label={t.kPayoff} value={payoff(dam.payoffYear)} sub={tr(t.kPayoffSub, { b: base.payoffYear ?? '—' })} tone="good" />
        <Kpi label={t.kTaxSaved} value={fmt.short(damming.taxSaved)} sub={tr(t.kTaxSavedSub, { n })} tone={damming.taxSaved >= 0 ? 'good' : 'bad'} />
        <Kpi label={t.kNetBenefit} value={fmt.short(damming.netBenefit)} sub={tr(t.kNetBenefitSub, { n })} tone={damming.netBenefit >= 0 ? 'good' : 'bad'} desc={t.kNetBenefitDesc} formulaLabel={t.formula} />
        <Kpi label={t.kHeloc} value={fmt.short(last.damHeloc)} sub={tr(t.kHelocSub, { v: fmt.pct(last.deductibleShare, 0) })} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card className="p-5">
          <CardHeader title={t.cDebt} subtitle={t.cDebtSub} />
          <LegendRow items={[
            { label: t.sHome, color: SERIES[1] },
            { label: t.sHeloc, color: SERIES[0] },
            { label: t.sBaseHome, color: INK.secondary, dashed: true },
          ]} />
          <div className="h-72">
            <ResponsiveContainer>
              <ComposedChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={INK.grid} />
                <XAxis dataKey="year" {...axisProps} />
                <YAxis tickFormatter={fmt.short} {...axisProps} width={64} />
                <Tooltip content={<ChartTooltip fmt={fmt.short} labelFmt={(l) => `${t.tYear} ${l}`} />} />
                <Area dataKey="damHome" name={t.sHome} stackId="d" stroke={SERIES[1]} fill={SERIES[1]} fillOpacity={0.25} strokeWidth={2} type="monotone" />
                <Area dataKey="damHeloc" name={t.sHeloc} stackId="d" stroke={SERIES[0]} fill={SERIES[0]} fillOpacity={0.25} strokeWidth={2} type="monotone" />
                <Line dataKey="baseHome" name={t.sBaseHome} stroke={INK.secondary} strokeDasharray="5 4" strokeWidth={2} dot={false} type="monotone" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <CardHeader title={t.cNet} subtitle={t.cNetSub} />
          <LegendRow items={[
            { label: t.sDamNet, color: SERIES[0], line: true },
            { label: t.sBaseNet, color: INK.secondary, dashed: true },
            { label: t.sTaxSaved, color: SERIES[2], line: true },
          ]} />
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={INK.grid} />
                <XAxis dataKey="year" {...axisProps} />
                <YAxis tickFormatter={fmt.short} {...axisProps} width={64} />
                <Tooltip content={<ChartTooltip fmt={fmt.short} labelFmt={(l) => `${t.tYear} ${l}`} />} />
                <Line dataKey="damNet" name={t.sDamNet} stroke={SERIES[0]} strokeWidth={2.5} dot={false} type="monotone" />
                <Line dataKey="baseNet" name={t.sBaseNet} stroke={INK.secondary} strokeDasharray="5 4" strokeWidth={2} dot={false} type="monotone" />
                <Line dataKey="taxSaved" name={t.sTaxSaved} stroke={SERIES[2]} strokeWidth={2} dot={false} type="monotone" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <ShieldAlert className="w-4 h-4 text-amber-600" />
          <h3 className="text-[15px] font-semibold text-slate-900">{t.dRisks}</h3>
        </div>
        <ul className="grid md:grid-cols-2 gap-x-6 gap-y-2 text-xs text-slate-600 leading-relaxed list-disc pl-4">
          <li>{t.dRisk1}</li>
          <li>{t.dRisk2}</li>
          <li>{t.dRisk3}</li>
          <li>{t.dRisk4}</li>
        </ul>
        <p className="mt-4 text-[11px] text-slate-400">
          {t.dAssume} {tr(t.dHomePayment, { v: fmt.short(damming.personalPayment) })}
        </p>
      </Card>
    </div>
  );
}
