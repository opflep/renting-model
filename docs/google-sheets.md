# Keeping your houses in Google Sheets

Rent vs Invest can read your properties from a Google Sheet. Each tab in the sheet is one house. You edit numbers in the sheet, press **Sync** in the app (or just reopen it), and every chart updates.

- [Quick start](#quick-start)
- [Sheet layout](#sheet-layout)
- [Field reference](#field-reference)
- [Writing values](#writing-values)
- [Canada and Vietnam in one sheet](#canada-and-vietnam-in-one-sheet)
- [What is not in the sheet](#what-is-not-in-the-sheet)
- [How syncing works](#how-syncing-works)
- [Sharing and privacy](#sharing-and-privacy)
- [Troubleshooting](#troubleshooting)

## Quick start

1. **Get a starting sheet.** Either copy the sample sheet (*File → Make a copy*), or in the app open **Google Sheets → Download template (.xlsx)**, upload the file to Google Drive and open it with Google Sheets (*File → Save as Google Sheets*).
2. **Add one tab per house.** Right-click a house tab → *Duplicate*, rename the tab to the house's name, and change the values in column B.
3. **Share it for reading.** *Share → General access → Anyone with the link → Viewer*. The app can't read a sheet that is restricted to named people (see [Sharing and privacy](#sharing-and-privacy)).
4. **Link it.** In the app click **Google Sheets**, paste the sheet's link (the address bar URL is fine) and press **Link sheet**. Each tab now appears as a house in the house dropdown and in the **Saved houses** tab.

## Sheet layout

Every house tab uses the same two-column layout:

| | A — Field | B — Value | C — Unit (optional) | D — Notes (optional) |
|---|---|---|---|---|
| 1 | Field | Value | Unit | Notes |
| 2 | Market | CA | | CA or VN |
| 3 | Purchase price | 689000 | $ | |
| 4 | Down payment (%) | 20 | % | |
| 5 | Monthly rent | 2900 | $ / month | |
| … | … | … | | |

Rules:

- **The tab name is the house name.** Renaming a tab renames the house on the next sync.
- **Column A is the label, column B the value.** Only these two columns are read; use C, D and beyond for units, notes, links or formulas.
- **Order doesn't matter, and neither do blank rows.** A header row like `Field | Value` is fine — unknown labels are ignored.
- **Leave a row out to use the app's default** for that field (listed below).
- **Formulas are fine.** The app reads the calculated value, so `=B3*0.2` or a lookup from another tab works.
- **Tabs that aren't houses are skipped:** a tab named `README`, `Instructions` or `Hướng dẫn`, any tab whose name starts with `_` or `#`, and any tab with fewer than two recognised fields. Use `_Notes`, `_Data` or `#Comps` for your own working tabs.

## Field reference

Labels are matched loosely: case, accents, punctuation and anything in brackets are ignored, so `Down payment (%)`, `down payment`, `DOWN PAYMENT %` and `Vốn tự có` are all the same field. The first label in each row is the one the template uses; the others are accepted aliases.

### Property and loan

| Field | Accepted labels | Unit | Default (CA / VN) | Notes |
|---|---|---|---|---|
| Market | `Market`, `Country`, `Thị trường` | `CA` or `VN` | market you linked from | Decides currency and tax rules. Also accepts `Canada`, `BC`, `Vietnam`, `Việt Nam`. |
| Purchase price | `Purchase price`, `Price`, `Giá mua` | money | 530,000 / 4 tỷ | |
| Down payment | `Down payment (%)`, `Down`, `Vốn tự có`, `Tỉ lệ vốn tự có` | % of price | 25 / 30 | The rest is the mortgage. |
| Closing costs | `Closing costs (%)`, `Closing`, `Phí mua` | % of price | 2 / 0.5 | BC: property transfer tax + legal + inspection. Added to your cost base for capital gains. |
| Interest rate | `Interest rate (%)`, `Mortgage rate`, `Rate`, `Lãi suất vay` | % per year | 4.5 / 9 | Canada uses semi-annual compounding like a fixed Canadian mortgage. |
| Amortization | `Amortization`, `Amortization years`, `Term`, `Thời hạn vay` | years | 30 / 25 | Years to pay the loan off, not the rate term. |

### Income and expenses

| Field | Accepted labels | Unit | Default (CA / VN) | Notes |
|---|---|---|---|---|
| Monthly rent | `Monthly rent`, `Rent`, `Rent per month`, `Giá thuê / tháng`, `Tiền thuê` | money per month | 2,400 / 15 tr | Rent at the start of year 1. |
| Vacancy | `Vacancy (%)`, `Vacancy rate`, `Tỉ lệ trống` | % of the year | 2 / 5 | 4 ≈ two weeks empty a year. |
| Property tax | `Property tax / yr`, `Property tax`, `Thuế đất / năm` | money per **year** | 2,000 / 0 | |
| Insurance | `Insurance / yr`, `Insurance`, `Bảo hiểm / năm` | money per **year** | 1,200 / 0 | |
| Strata | `Strata / mo`, `Strata fee`, `HOA`, `Condo fee`, `Phí quản lý / tháng` | money per **month** | 466 / 1.5 tr | Maintenance / building fees. |
| Other | `Other / mo`, `Other expenses`, `Khác / tháng`, `Chi phí khác` | money per **month** | 100 / 0 | Repairs, property management, utilities you pay. |

### Growth and exit

| Field | Accepted labels | Unit | Default (CA / VN) | Notes |
|---|---|---|---|---|
| Appreciation | `Appreciation (%)`, `Property growth`, `Price growth`, `BĐS tăng giá` | % per year | 3 / 5 | |
| Rent growth | `Rent growth (%)`, `Rent increase`, `Tăng giá thuê` | % per year | 2 / 3 | BC caps yearly increases for existing tenants; check the current year’s cap. |
| Expense inflation | `Expense inflation (%)`, `Expense growth`, `Inflation`, `Lạm phát chi phí` | % per year | 2.5 / 3 | Applied to property tax, insurance, strata and other. |
| Selling costs | `Selling costs (%)`, `Phí bán` | % of sale price | 4 / 1 | Realtor commission + legal when you sell. |
| Hold period | `Hold period`, `Holding period`, `Horizon`, `Thời gian nắm giữ` | years | 25 / 20 | When the model assumes you sell. Between 1 and 50. |

### Canadian depreciation (optional)

| Field | Accepted labels | Unit | Default | Notes |
|---|---|---|---|---|
| Claim CCA | `Claim CCA`, `CCA` | `Yes` / `No` | No | Capital cost allowance, class 1 (4%). Can't create a rental loss; recaptured as income on sale. |
| Building share | `Building share (%)`, `Building share of cost`, `Building portion` | % of cost | 70 | Land can't be depreciated. Use your property assessment's building vs land split. |
| CCA rate | `CCA rate (%)` | % per year | 4 | Rarely needs changing. |

## Writing values

Plain numbers are safest, but the app also understands what people usually type:

| You write | Read as |
|---|---|
| `689000`, `689,000`, `$689,000` | 689,000 |
| `2.9k` | 2,900 |
| `1.2m` | 1,200,000 |
| `4 tỷ`, `4.5 tỷ`, `4,5 tỷ` | 4,000,000,000 / 4,500,000,000 |
| `15 tr`, `15 triệu` | 15,000,000 |
| `4.000.000.000` (Vietnamese thousands dots) | 4,000,000,000 |
| `4.5`, `4,5`, `4.5%` | 4.5 % |
| a cell formatted as percent showing `20%` | 20 % |
| `Yes`, `No`, `TRUE`, `FALSE`, `Có`, `Không` | on / off |

Percent fields always mean "percent", so write `20` or `20%` for twenty percent, not `0.2` (unless the cell is formatted as a percentage, in which case Google stores 0.2 and displays 20% — that works too).

## Canada and Vietnam in one sheet

Add a `Market` row (`CA` or `VN`) to each house. Houses without one use the market that was selected when you first linked the sheet. Canadian houses use dollars and Canadian tax rules; Vietnamese houses use VND and the Vietnamese rules. Switch market at the top right of the app to see each group.

## What is not in the sheet

Settings that describe **you** rather than a property live in the app and apply to every house in that market:

- **Tax:** marginal rate, dividend rate, capital-gains inclusion, RRSP withdrawal rate, whether rental losses offset other income (Canada); rental and transfer tax rates (Vietnam).
- **Stock market:** expected return, dividend yield, fees, savings rate, TFSA and RRSP room.
- **Scenarios:** the bear and bull shifts (in percentage points) applied on top of every house's numbers. Put your *base case* in the sheet; the app derives bear and bull from it.
- **Home & HELOC** for cash damming: your home's value, mortgage, HELOC rate and limits.

Set these once in the app's left panel (they're marked **all houses**).

## How syncing works

- The app reloads every linked sheet each time it opens, and whenever you press **Sync** in the Google Sheets dialog.
- **The sheet wins.** If you change a linked house in the app, the next sync puts the sheet's values back. Houses from a sheet show a green **From Sheets** badge; make lasting changes in the sheet.
- **Rows you leave out use defaults** — they don't keep values you typed into the app.
- **Renamed tab:** the old house becomes an unlinked local copy and the new name is added as a new linked house.
- **Deleted tab:** the house stays in the app as an unlinked local copy, so nothing disappears silently. Delete it from the house bar if you no longer want it.
- **Unlink** (in the dialog) stops syncing and keeps all houses as local copies.
- Duplicating a linked house in the app creates a local, unlinked house.
- The app only **reads** the sheet. It never writes to it.

## Sharing and privacy

The app runs entirely in your browser and has no server. To read a sheet without asking you to sign in, it downloads the sheet's public export link directly from Google. That requires **General access → Anyone with the link → Viewer**.

What that means:

- Anyone who has the link can view the sheet. The link is long and random and isn't listed anywhere, but treat it as semi-public.
- Don't put anything sensitive in the linked sheet — no full addresses, unit numbers, tenant names, account numbers or loan numbers. Use names like "Burnaby 2BR".
- Keep private working tabs in a **separate** sheet, or use [IMPORTRANGE](https://support.google.com/docs/answer/3093340) to pull only the numbers into the shared one.
- To stop sharing, set General access back to **Restricted**. The app keeps the last synced numbers, and Sync will show an access error.

Prefer not to share at all? Use *File → Download → Microsoft Excel (.xlsx)* and the app's **Import .xlsx file** button instead. That's a one-time import with no link.

## Troubleshooting

| Message | Fix |
|---|---|
| *Can't read this sheet* | Sharing is restricted. *Share → General access → Anyone with the link → Viewer.* |
| *Sheet not found* | The link is wrong or the sheet was deleted. Copy the URL from the browser's address bar again. |
| *No house tabs found* | Each house tab needs labels in column A and values in column B, with at least two recognised fields (e.g. `Purchase price` and `Monthly rent`). Check the tab isn't named `README` or starting with `_`. |
| *That doesn't look like a Google Sheets link* | Paste a link that contains `/spreadsheets/d/…`. A Drive folder link or an `.xlsx` file in Drive (not converted to Google Sheets) won't work — open it and choose *File → Save as Google Sheets* first. |
| A value is ignored | The label isn't recognised (check the [field reference](#field-reference)) or the value isn't a number. Text like `about 2900` or `TBD` is skipped and the default is used. |
| Numbers look 100× off | A percent field was written as a fraction (`0.2`) in a plain-number cell. Write `20` or format the cell as a percentage. |
| Vietnamese amounts look tiny | Write full VND (`15000000`) or use `tr` / `tỷ` (`15 tr`, `4 tỷ`). A bare `15` means 15 đồng. |
| Changes in the sheet don't show | Press **Sync** in the Google Sheets dialog. Google can take up to a minute to publish recent edits to the export link. |
