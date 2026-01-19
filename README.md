# Real Estate Investment Visualizer

A responsive, interactive React application for analyzing real estate investment opportunities. This tool helps investors calculate cashflow, visualize mortgage breakdowns, and project long-term equity gains.

## Features

* **Interactive Input Panel:** Real-time updates for property details, mortgage terms, rental income, and expenses.
* **Smart Calculations:**
    * **Pre-Tax vs Post-Tax Cashflow:** Distinguishes between actual liquidity and tax-adjusted returns.
    * **Mortgage Breakdown:** Splits payments into Principal (Equity) and Interest (Cost).
    * **Phantom Cashflow Detection:** Highlights when principal payments exceed cashflow, leading to tax liabilities on negative cashflow.
* **Visualizations:**
    * **Cashflow Analysis:** Stacked charts showing Income vs Expenses, Interest, and Principal.
    * **Expense Breakdown:** Pie chart detailing where every dollar goes (Tax, Strata, Interest, etc.).
    * **Equity Projection:** Area chart showing the gap between Property Value and Loan Balance over time.
* **Detailed Schedule:** Year-by-year amortization table exportable logic.

## Built With

* **React** (Vite)
* **Tailwind CSS** (Styling)
* **Recharts** (Data Visualization)
* **Lucide React** (Icons)

## Getting Started

### Prerequisites

* Node.js (v16 or higher)
* npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone [https://github.com/yourusername/renting-model.git](https://github.com/yourusername/renting-model.git)
    cd renting-model
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Start the development server:
    ```bash
    npm run dev
    ```

4.  Open your browser to `http://localhost:5173`.

## Usage Guide

1.  **Green Inputs:** Fill in the critical "Green" fields first (Purchase Price, Rent, Interest Rate).
2.  **Analyze Cashflow:** Check the "Pre-Tax Cashflow" card for your immediate monthly liquidity.
3.  **Check Tax Impact:** Click the arrow on the Pre-Tax card to reveal the "Post-Tax Cashflow" to see your true profit after income tax.
4.  **Long Term View:** Toggle the projection view at the bottom to see the full 30-year amortization schedule.

## Deployment to GitHub Pages

This project is configured for easy deployment to GitHub Pages using `gh-pages`.

### Step 1: Prepare the Repository
1.  Create a public repository on GitHub.
2.  Initialize git and point to your new repo:
    ```bash
    git init
    git remote add origin [https://github.com/yourusername/renting-model.git](https://github.com/yourusername/renting-model.git)
    ```

### Step 2: Configure for Production
Open `vite.config.js` and set the `base` path to match your repository name:

```javascript
export default defineConfig({
  plugins: [react()],
  base: '/renting-model/', // Replace with your repo name
})
```

### Step 3: Deploy
Install the deployment package (if not already installed):

```Bash

npm install gh-pages --save-dev
```
Run the deploy script:

```Bash

npm run deploy
Your app will be live at https://yourusername.github.io/renting-model/.
```