# Rent vs Invest

An interactive model for deciding whether a rental property beats the stock market once tax is counted, and whether cash damming is worth setting up. Supports Canada (BC tax defaults) and Vietnam.

Live: https://opflep.github.io/renting-model

## What it does

**Rental** — monthly cashflow before and after tax, cash-on-cash, cap rate, after-tax IRR, equity build-up, return composition, and what you would walk away with if you sold in any year (selling costs, mortgage payout, capital gains tax, CCA recapture).

**Rental vs Stocks** — an equal-cash comparison. The stock investor puts in exactly what the landlord does: down payment and closing costs on day one, plus every top-up the rental needs. Rental surplus goes into a taxable side account so no money sits idle. Every path is shown after tax, as if liquidated that year, along with IRR and the break-even stock return.

| Option | Tax treatment modelled |
|---|---|
| Rental (CA) | Net rental income (rent − expenses − interest − CCA) taxed yearly at your marginal rate; losses offset other income. On sale: capital gains at the inclusion rate, CCA recaptured as income. |
| Non-registered | Dividends taxed yearly at the eligible-dividend rate; growth deferred until sale, then taxed at the inclusion rate. |
| TFSA | Tax-free. Capped by contribution room; any excess overflows to non-registered. |
| RRSP | Contribution refund reinvested (gross-up), withdrawals taxed at your expected retirement rate. Capped by room. |
| GIC / savings | Interest fully taxed yearly. |
| Rental (VN) | 10% (5% VAT + 5% PIT) on gross rent above 100M VND/yr; 2% of sale price on transfer. |
| Stocks (VN) | 5% on cash dividends, 0.1% of sale value. |
| Savings (VN) | Bank interest exempt from PIT. |

**Cash damming** (Canada) — compares two otherwise identical households. With damming, all rent prepays the non-deductible home mortgage and all rental expenses are drawn from a re-advanceable HELOC whose interest is deductible (optionally capitalized). Shows years to mortgage-free, cumulative tax saved, debt mix over time and the net-worth gain.

**Saved houses** — save any number of properties per market (rename, duplicate, delete), compare them side by side, and export/import them as JSON. Property-specific inputs are stored per house; your tax situation, stock assumptions and home/HELOC details are shared across houses. Everything is kept in your browser's localStorage.

**Google Sheets link** — keep your houses in a Google Sheet, one tab per house. Column A holds field labels (`Purchase price`, `Down payment (%)`, `Monthly rent`, `Strata / mo`, … in English or Vietnamese), column B the values (`530000`, `20%`, `2.9k`, `4 tỷ`, `15 tr` all work). Share the sheet as *Anyone with the link → Viewer*, paste the link, and every tab becomes a house. Linked houses re-sync when the app opens or when you press Sync; the sheet wins over local edits, missing rows use defaults, and houses whose tab was deleted are kept as local copies. The browser downloads the sheet directly from Google's export endpoint, so no API key or sign-in is needed. A template (.xlsx) can be downloaded from the dialog, and local .xlsx files can be imported too.

The model uses simple constant rates of return (no volatility). It is educational, not financial or tax advice.

## Project layout

```
src/lib/finance.js     pure financial engine (mortgage, rental, accounts, IRR, cash damming)
src/lib/store.js       saved-house profiles, persistence, import/export, sheet sync
src/lib/sheets.js      Google Sheets / .xlsx parsing and template
src/lib/defaults.js    default assumptions per market
src/lib/i18n.js        English / Vietnamese strings
src/components/        UI (inputs panel, tabs, profile bar)
```

## Development

```bash
npm install
npm run dev      # http://localhost:5173/renting-model/
npm test         # vitest unit tests for the engine and store
npm run lint
npm run deploy   # build and publish to GitHub Pages
```
