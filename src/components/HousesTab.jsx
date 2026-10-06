import { useMemo } from 'react';
import { ArrowRight, Trophy } from 'lucide-react';
import { Card } from './ui';
import { analyzeAll, inputsFor } from '../lib/store';
import { tr } from '../lib/i18n';

// Side-by-side comparison of every saved house in the current market.
export default function HousesTab({ market, profiles, shared, activeId, scenario, t, fmt, onOpen }) {
  const rows = useMemo(
    () =>
      profiles.map((profile) => {
        const all = analyzeAll(inputsFor(market, profile, shared));
        const { safe, rental, compare, damming } = all[scenario];
        const y1 = rental.rows[0];
        const n = safe.horizon;
        const stocks = Object.values(compare.accounts).map((a) => a.values[n]);
        const bestStock = Math.max(...stocks);
        return {
          profile,
          price: safe.price,
          rent: safe.rent,
          horizon: n,
          cashIn: rental.initialCash,
          cfMonth: y1.cashflow / 12,
          capRate: safe.price > 0 ? ((y1.grossRent - y1.operatingExpenses) / safe.price) * 100 : 0,
          irr: compare.rental.irr,
          irrBear: all.bear.compare.rental.irr,
          irrBull: all.bull.compare.rental.irr,
          wealth: compare.rental.wealth[n],
          vsStock: compare.rental.wealth[n] - bestStock,
          breakEven: compare.breakEven,
          damBenefit: damming?.netBenefit,
        };
      }),
    [market, profiles, shared, scenario]
  );

  const bestIrr = Math.max(...rows.map((r) => r.irr ?? -Infinity));
  const isCA = market === 'CA';
  const tone = (v) => (v == null ? '' : v >= 0 ? 'text-emerald-700' : 'text-rose-600');

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600 leading-relaxed max-w-4xl">{t.hIntro}</p>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm tabular-nums">
            <thead className="bg-slate-50 text-xs text-slate-500 border-b border-slate-200">
              <tr className="text-right [&>th]:px-4 [&>th]:py-2.5 [&>th]:font-medium [&>th]:whitespace-nowrap">
                <th className="text-left">{t.hHouse}</th>
                <th>{t.price}</th>
                <th>{t.rent}</th>
                <th>{t.hCashIn}</th>
                <th>{t.kAfterTax}</th>
                <th>{t.kCap}</th>
                <th>{t.kIrr}</th>
                <th>{t.hIrrRange}</th>
                <th>{t.hWealth}</th>
                <th>{t.hVsStock}</th>
                <th>{t.kBreakEven}</th>
                {isCA && <th>{t.hDamming}</th>}
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr
                  key={r.profile.id}
                  className={`text-right [&>td]:px-4 [&>td]:py-3 [&>td]:whitespace-nowrap hover:bg-slate-50 ${r.profile.id === activeId ? 'bg-blue-50/40' : ''}`}
                >
                  <td className="text-left font-medium text-slate-900">
                    <span className="inline-flex items-center gap-1.5">
                      {r.irr === bestIrr && rows.length > 1 && <Trophy className="w-3.5 h-3.5 text-amber-500" aria-label={t.hBest} />}
                      {r.profile.name}
                    </span>
                    <span className="block text-[11px] font-normal text-slate-400">{tr(t.hHold, { n: r.horizon })}</span>
                  </td>
                  <td>{fmt.short(r.price)}</td>
                  <td>{fmt.short(r.rent)}</td>
                  <td>{fmt.short(r.cashIn)}</td>
                  <td className={tone(r.cfMonth)}>{fmt.short(r.cfMonth)}</td>
                  <td>{fmt.pct(r.capRate)}</td>
                  <td className="font-semibold text-slate-900">{fmt.pct(r.irr)}</td>
                  <td className="text-xs">
                    <span className="text-rose-700">{fmt.pct(r.irrBear)}</span>
                    <span className="text-slate-300"> – </span>
                    <span className="text-emerald-700">{fmt.pct(r.irrBull)}</span>
                  </td>
                  <td>{fmt.short(r.wealth)}</td>
                  <td className={tone(r.vsStock)}>{(r.vsStock >= 0 ? '+' : '') + fmt.short(r.vsStock)}</td>
                  <td>{fmt.pct(r.breakEven)}</td>
                  {isCA && <td className={tone(r.damBenefit)}>{fmt.short(r.damBenefit)}</td>}
                  <td>
                    <button
                      type="button"
                      onClick={() => onOpen(r.profile.id)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-900"
                    >
                      {t.hOpen} <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="text-xs text-slate-500">{t.hNote}</p>
    </div>
  );
}
