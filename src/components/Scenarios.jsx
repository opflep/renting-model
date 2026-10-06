import { Building2, LineChart, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { Card, CardHeader } from './ui';
import { RENTAL_FIELDS, SCENARIOS, STOCK_FIELDS } from '../lib/scenarios';
import { tr } from '../lib/i18n';

const SCENARIO_META = {
  bear: { icon: TrendingDown, on: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200', text: 'text-rose-700' },
  base: { icon: Minus, on: 'bg-white text-slate-900 shadow-sm', text: 'text-slate-700' },
  bull: { icon: TrendingUp, on: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', text: 'text-emerald-700' },
};

const KIND_ICON = { rental: Building2, stocks: LineChart };

export function ScenarioSwitch({ kind, value, onChange, t }) {
  const KindIcon = KIND_ICON[kind];
  return (
    <div className="inline-flex items-center rounded-xl bg-slate-100 p-1" role="radiogroup" aria-label={t[`scKind_${kind}`]}>
      <span className="inline-flex items-center gap-1 pl-2 pr-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        <KindIcon className="w-3.5 h-3.5" />
        {t[`scKind_${kind}`]}
      </span>
      {SCENARIOS.map((name) => {
        const { icon: Icon, on } = SCENARIO_META[name];
        return (
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={value === name}
            onClick={() => onChange(name)}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-medium transition ${value === name ? on : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Icon className="w-4 h-4" />
            {t[`sc_${name}`]}
          </button>
        );
      })}
    </div>
  );
}

const signed = (v) => `${v > 0 ? '+' : v < 0 ? '−' : '±'}${Math.abs(v)}`;

// One-line summary of what the active scenarios change.
export function ScenarioBanner({ rental, stocks, scenarios, t }) {
  const part = (kind, name, fields) => {
    if (name === 'base') return null;
    const shifts = scenarios[name] || {};
    const items = fields.filter((k) => Number(shifts[k])).map((k) => `${t[`scf_${k}`]} ${signed(shifts[k])} ${t.scPts}`);
    return (
      <span key={kind} className="block">
        <strong className={`font-semibold ${SCENARIO_META[name].text}`}>
          {t[`scKind_${kind}`]} · {t[`sc_${name}`]}:
        </strong>{' '}
        {items.join(' · ') || '—'}
      </span>
    );
  };
  const parts = [part('rental', rental, RENTAL_FIELDS), part('stocks', stocks, STOCK_FIELDS)].filter(Boolean);
  if (!parts.length) return null;
  return (
    <div className="mb-5 rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-xs text-slate-600 space-y-0.5">
      {parts}
      <span className="block text-slate-400">{t.scBannerTail}</span>
    </div>
  );
}

// Editable bear/bull shifts, shown in the assumptions panel.
export function ScenarioEditor({ scenarios, set, t }) {
  return (
    <div className="col-span-2">
      <div className="grid grid-cols-[1fr_4.5rem_4.5rem] gap-x-2 gap-y-1.5 items-center text-xs">
        <span />
        <span className="text-center font-medium text-rose-700">{t.sc_bear}</span>
        <span className="text-center font-medium text-emerald-700">{t.sc_bull}</span>
        {[
          ['rental', RENTAL_FIELDS],
          ['stocks', STOCK_FIELDS],
        ].map(([kind, fields]) => [
          <span key={kind} className="col-span-3 pt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {t[`scKind_${kind}`]}
          </span>,
          ...fields.map((k) => (
            <ScenarioRow key={k} label={t[`scf_${k}`]} bear={scenarios.bear[k]} bull={scenarios.bull[k]} onBear={(v) => set(`scenarios.bear.${k}`, v)} onBull={(v) => set(`scenarios.bull.${k}`, v)} />
          )),
        ])}
      </div>
      <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">{t.scEditorNote}</p>
    </div>
  );
}

function ScenarioRow({ label, bear, bull, onBear, onBull }) {
  const input = (value, onChange, aria) => (
    <input
      type="number"
      step="0.5"
      aria-label={aria}
      defaultValue={value}
      key={value}
      onBlur={(e) => onChange(parseFloat(e.target.value) || 0)}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      className="w-full rounded-md border border-slate-200 bg-slate-50/60 px-1.5 py-1 text-right tabular-nums focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
    />
  );
  return (
    <>
      <span className="text-slate-600 truncate">{label}</span>
      {input(bear, onBear, `${label} bear`)}
      {input(bull, onBull, `${label} bull`)}
    </>
  );
}

// Key outcomes for one house under all three rental scenarios, against the
// selected stock scenario.
export function ScenarioTable({ all, active, stockScenario, t, fmt, horizon }) {
  const rows = SCENARIOS.map((name) => {
    const { rental, compare } = all[name];
    const n = rental.rows.length;
    const best = Object.entries(compare.accounts).reduce((a, [k, v]) => (v.values[n] > a.value ? { kind: k, value: v.values[n] } : a), { value: -Infinity });
    return {
      name,
      cf: rental.rows[0].cashflow / 12,
      irr: compare.rental.irr,
      wealth: compare.rental.wealth[n],
      best,
      gap: compare.rental.wealth[n] - best.value,
      breakEven: compare.breakEven,
    };
  });
  const tone = (v) => (v >= 0 ? 'text-emerald-700' : 'text-rose-600');
  return (
    <Card className="overflow-hidden">
      <div className="p-5 pb-3">
        <CardHeader title={t.scTitle} subtitle={tr(t.scSub, { n: horizon, s: t[`sc_${stockScenario}`] })} />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm tabular-nums">
          <thead className="bg-slate-50 text-xs text-slate-500 border-y border-slate-200">
            <tr className="text-right [&>th]:px-4 [&>th]:py-2.5 [&>th]:font-medium [&>th]:whitespace-nowrap">
              <th className="text-left">{t.scCase}</th>
              <th>{t.kAfterTax}</th>
              <th>{t.kIrr}</th>
              <th>{t.hWealth}</th>
              <th>{t.kBestStock}</th>
              <th>{t.thVsRental}</th>
              <th>{t.kBreakEven}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => {
              const { icon: Icon, text } = SCENARIO_META[r.name];
              return (
                <tr key={r.name} className={`text-right [&>td]:px-4 [&>td]:py-2.5 [&>td]:whitespace-nowrap ${r.name === active ? 'bg-blue-50/40' : ''}`}>
                  <td className={`text-left font-medium ${text}`}>
                    <span className="inline-flex items-center gap-1.5">
                      <Icon className="w-4 h-4" />
                      {t[`sc_${r.name}`]}
                    </span>
                  </td>
                  <td className={tone(r.cf)}>{fmt.short(r.cf)}</td>
                  <td className="font-semibold text-slate-900">{fmt.pct(r.irr)}</td>
                  <td>{fmt.short(r.wealth)}</td>
                  <td>
                    {fmt.short(r.best.value)}
                    <span className="block text-[10px] text-slate-400">{t[`o_${r.best.kind}`]}</span>
                  </td>
                  <td className={tone(r.gap)}>{(r.gap >= 0 ? '+' : '') + fmt.short(r.gap)}</td>
                  <td>{fmt.pct(r.breakEven)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// Rental scenario × stock scenario: how far the rental ends ahead of (or
// behind) the best stock option. Click a cell to switch to that combination.
export function ScenarioGrid({ grid, rental, stocks, onPick, t, fmt, horizon }) {
  const cell = (r, s) => {
    const { compare } = grid[r][s];
    const n = compare.rental.wealth.length - 1;
    const bestStock = Math.max(...Object.values(compare.accounts).map((a) => a.values[n]));
    const bestIrr = Math.max(...Object.values(compare.accounts).map((a) => a.irr ?? -Infinity));
    return { gap: compare.rental.wealth[n] - bestStock, rIrr: compare.rental.irr, sIrr: bestIrr };
  };
  const head = (name) => {
    const { icon: Icon, text } = SCENARIO_META[name];
    return (
      <span className={`inline-flex items-center gap-1 ${text}`}>
        <Icon className="w-3.5 h-3.5" />
        {t[`sc_${name}`]}
      </span>
    );
  };
  return (
    <Card className="p-5">
      <CardHeader title={t.scGridTitle} subtitle={tr(t.scGridSub, { n: horizon })} />
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm tabular-nums border-separate border-spacing-1.5">
          <thead>
            <tr className="text-xs">
              <th className="text-left font-medium text-slate-400 align-bottom">
                <span className="block">↓ {t.scKind_rental}</span>
                <span className="block">→ {t.scKind_stocks}</span>
              </th>
              {SCENARIOS.map((s) => (
                <th key={s} className="font-medium px-2">{head(s)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SCENARIOS.map((r) => (
              <tr key={r}>
                <th className="text-left text-xs font-medium pr-2 whitespace-nowrap">{head(r)}</th>
                {SCENARIOS.map((s) => {
                  const c = cell(r, s);
                  const activeCell = r === rental && s === stocks;
                  const ahead = c.gap >= 0;
                  return (
                    <td key={s} className="p-0">
                      <button
                        type="button"
                        onClick={() => onPick(r, s)}
                        aria-pressed={activeCell}
                        className={`w-full min-w-[8.5rem] rounded-xl px-3 py-2.5 text-right transition ${
                          ahead ? 'bg-emerald-50 hover:bg-emerald-100' : 'bg-rose-50 hover:bg-rose-100'
                        } ${activeCell ? 'ring-2 ring-blue-500' : ''}`}
                      >
                        <span className={`block text-base font-semibold ${ahead ? 'text-emerald-800' : 'text-rose-700'}`}>
                          {(ahead ? '+' : '') + fmt.short(c.gap)}
                        </span>
                        <span className="block text-[11px] text-slate-500">
                          {t.scKind_rental} {fmt.pct(c.rIrr)} · {t.scKind_stocks} {fmt.pct(c.sIrr)}
                        </span>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-slate-400">{t.scGridNote}</p>
    </Card>
  );
}
