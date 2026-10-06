import { useState } from 'react';
import { Building2, ChevronDown, Landmark, LineChart, Percent, Receipt, RotateCcw, TrendingUp, Wallet, Home } from 'lucide-react';
import { Card, Group, NumberField, Toggle } from './ui';
import { tr } from '../lib/i18n';

export default function InputsPanel({ p, set, t, fmt, tab, onReset, initialCash }) {
  const isVN = p.market === 'VN';
  // VN: price in tỷ, other money in triệu. CA: dollars.
  const big = isVN ? { scale: 1e9, unit: 'tỷ', step: 0.05 } : { unit: '$', step: 5000 };
  const small = isVN ? { scale: 1e6, unit: 'tr', step: 0.5 } : { unit: '$', step: 50 };
  const f = (key, props) => <NumberField key={key} label={t[key.split('.').pop()]} value={get(p, key)} onChange={(v) => set(key, v)} {...props} />;
  const P = { unit: '%', step: 0.1 };
  const [mobileOpen, setMobileOpen] = useState(false);
  const shared = (title) => (
    <span className="inline-flex items-center gap-1.5">
      {title}
      <span title={t.sharedTip} className="rounded-full bg-blue-50 px-1.5 py-px text-[9px] font-semibold normal-case tracking-normal text-blue-700">{t.sharedBadge}</span>
    </span>
  );

  return (
    <Card className="p-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
      <div className="flex items-center justify-between mb-1">
        <button type="button" onClick={() => setMobileOpen(!mobileOpen)} className="inline-flex items-center gap-1.5 lg:pointer-events-none" aria-expanded={mobileOpen}>
          <h2 className="text-sm font-semibold text-slate-900">{t.inputs}</h2>
          <ChevronDown className={`w-4 h-4 text-slate-400 lg:hidden transition-transform ${mobileOpen ? 'rotate-180' : ''}`} />
          <span className="sr-only lg:hidden">{mobileOpen ? t.hideInputs : t.showInputs}</span>
        </button>
        <button type="button" onClick={onReset} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900">
          <RotateCcw className="w-3.5 h-3.5" /> {t.resetHouse}
        </button>
      </div>
      <div className={mobileOpen ? '' : 'hidden lg:block'}>

      {tab === 'damming' && !isVN && (
        <Group title={shared(t.gDamming)} icon={Home}>
          {f('damming.homeValue', big)}
          {f('damming.homeGrowth', P)}
          {f('damming.homeBalance', big)}
          {f('damming.homeRate', P)}
          {f('damming.homeAmort', { unit: t.years })}
          {f('damming.helocRate', P)}
          {f('damming.helocLTV', { unit: '%' })}
          {f('damming.totalLTV', { unit: '%' })}
          <Toggle label={t.capitalize} checked={p.damming.capitalize} onChange={(v) => set('damming.capitalize', v)} />
        </Group>
      )}

      {tab === 'compare' && (
        <Group title={shared(t.gStocks)} icon={LineChart}>
          {f('stocks.stockReturn', { ...P, tip: t.stockReturnTip })}
          {f('stocks.dividendYield', P)}
          {f('stocks.fee', { unit: '%', step: 0.05 })}
          {f('stocks.depositRate', P)}
          {!isVN && f('stocks.tfsaRoom', { ...big, tip: t.roomTip })}
          {!isVN && f('stocks.rrspRoom', { ...big, tip: t.roomTip })}
        </Group>
      )}

      <Group title={t.gProperty} icon={Building2}>
        {f('price', big)}
        {f('downPct', { unit: '%', step: 1, hint: tr(t.committedCash, { v: fmt.short(initialCash) }) })}
        {f('closingPct', { ...P, tip: t.closingTip })}
      </Group>

      <Group title={t.gMortgage} icon={Percent}>
        {f('rate', P)}
        {f('amort', { unit: t.years })}
      </Group>

      <Group title={t.gIncome} icon={Wallet}>
        {f('rent', small)}
        {f('vacancy', { unit: '%', step: 1 })}
      </Group>

      <Group title={t.gExpenses} icon={Receipt}>
        {f('propTax', small)}
        {f('insurance', small)}
        {f('strata', small)}
        {f('other', { ...small, tip: t.otherTip })}
      </Group>

      <Group title={t.gGrowth} icon={TrendingUp}>
        {f('appreciation', P)}
        {f('rentGrowth', P)}
        {f('expInflation', P)}
        {f('sellingPct', { ...P, tip: t.sellingTip })}
        {f('horizon', { unit: t.years })}
      </Group>

      <Group title={shared(t.gTax)} icon={Landmark}>
        {isVN ? (
          <>
            {f('tax.vnRentalRate', P)}
            {f('tax.vnSaleRate', P)}
            {f('tax.vnDividend', P)}
            {f('tax.vnSale', { unit: '%', step: 0.05 })}
          </>
        ) : (
          <>
            {f('tax.marginal', { ...P, tip: t.marginalTip })}
            {f('tax.dividend', { ...P, tip: t.dividendTip })}
            {f('tax.cgInclusion', { unit: '%', step: 1 })}
            {f('tax.retirement', { ...P, tip: t.retirementTip })}
            <Toggle label={t.lossOffset} checked={p.tax.lossOffset} onChange={(v) => set('tax.lossOffset', v)} />
            <Toggle label={t.claimCCA} checked={p.claimCCA} onChange={(v) => set('claimCCA', v)} />
            {p.claimCCA && f('buildingPct', { unit: '%', step: 5 })}
          </>
        )}
      </Group>
      </div>
    </Card>
  );
}

const get = (obj, path) => path.split('.').reduce((o, k) => o?.[k], obj);
