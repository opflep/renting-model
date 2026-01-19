import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ComposedChart, Line, PieChart, Pie, Cell, LabelList } from 'recharts';
import { Calculator, TrendingUp, DollarSign, Home, Percent, PieChart as PieIcon, Info, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';

// Updated Card to accept ...props (like onClick)
const Card = ({ children, className = "", ...props }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 ${className}`} {...props}>
    {children}
  </div>
);

const SectionTitle = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2 mb-4 text-slate-800 font-semibold border-b pb-2">
    <Icon className="w-5 h-5 text-emerald-600" />
    <span>{title}</span>
  </div>
);

const InputField = ({ label, value, onChange, unit = "", step = "1", type = "number", tooltip = "", highlight = false, subLabel = "" }) => (
  <div className="mb-3">
    <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide flex justify-between items-end">
      <span>{label}</span>
      {tooltip && <span className="text-slate-400 cursor-help" title={tooltip}>(?)</span>}
    </label>
    <div className="relative rounded-md shadow-sm">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        step={step}
        className={`block w-full rounded-md border-slate-300 pl-3 pr-8 py-2 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-600 focus:outline-none sm:text-sm sm:leading-6 transition-colors ${highlight ? 'bg-emerald-100 border-emerald-400' : 'bg-slate-50'}`}
      />
      {unit && (
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <span className="text-slate-500 sm:text-sm">{unit}</span>
        </div>
      )}
    </div>
    {subLabel && <div className="text-right text-xs text-emerald-600 font-medium mt-1">{subLabel}</div>}
  </div>
);

// Helper component for KPI Cards with Tooltips
const KPICard = ({ title, value, subtext, description, borderColor = "border-slate-200", valueColor = "text-slate-800", isHighlighted = false, onClick, clickable = false, isOpen = false }) => {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <Card 
      // Applied shadow-none for flat design
      // Removed hover:shadow-md from clickable state to maintain flat look
      className={`p-4 border-l-4 ${borderColor} shadow-none relative overflow-visible transition-all duration-200 ${isHighlighted ? 'ring-1 ring-amber-200' : ''} ${clickable ? 'cursor-pointer hover:bg-slate-50' : ''}`}
      onClick={onClick ? (e) => {
          // Prevent clicking info icon from triggering card click
          if (e.target.closest('.info-trigger')) return;
          onClick();
      } : undefined}
    >
      <div className="flex justify-between items-start mb-1">
        <div className="flex items-center gap-1">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{title}</p>
          {clickable && (
              isOpen ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />
          )}
        </div>
        <div className="relative info-trigger">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowInfo(!showInfo);
            }}
            className="focus:outline-none"
          >
            <Info className={`w-4 h-4 transition-colors ${showInfo ? 'text-emerald-500' : 'text-slate-300 hover:text-slate-500'}`} />
          </button>
          
          {/* Tooltip - Now controlled by click state instead of hover */}
          {showInfo && (
            <div className="absolute right-0 top-6 w-56 bg-slate-800 text-white text-xs rounded p-3 z-50 shadow-xl">
              <div className="font-semibold mb-1 text-emerald-400">Formula:</div>
              {description}
              {/* Small arrow */}
              <div className="absolute -top-1 right-0.5 w-2 h-2 bg-slate-800 rotate-45"></div>
            </div>
          )}
        </div>
      </div>
      <p className={`text-2xl font-bold ${valueColor}`}>
        {value}
      </p>
      <div className="flex justify-between items-end">
          <p className="text-xs text-slate-400 mt-1">{subtext}</p>
          {clickable && !isOpen && (
              <span className="text-xs font-medium text-emerald-600 flex items-center mt-1">
                  See Tax Impact <ChevronRight className="w-3 h-3 ml-0.5" />
              </span>
          )}
      </div>
    </Card>
  );
};

export default function RealEstateCalculator() {
  // --- State: Inputs ---
  const [propertyPrice, setPropertyPrice] = useState(530000);
  const [downPaymentPercent, setDownPaymentPercent] = useState(25);
  const [mortgageRate, setMortgageRate] = useState(4.5);
  const [mortgageTerm, setMortgageTerm] = useState(30);
  
  // Expenses & Income
  const [monthlyRent, setMonthlyRent] = useState(2400); 
  const [monthlyStrata, setMonthlyStrata] = useState(466); 
  const [annualPropertyTax, setAnnualPropertyTax] = useState(2000);
  const [annualInsurance, setAnnualInsurance] = useState(1200);
  const [monthlyOther, setMonthlyOther] = useState(0); 
  const [vacancyRate, setVacancyRate] = useState(0); 
  
  // Growth & Inflation
  const [annualAppreciation, setAnnualAppreciation] = useState(3.0); 
  const [annualRentIncrease, setAnnualRentIncrease] = useState(0.0); 
  const [expenseInflation, setExpenseInflation] = useState(2.0); 
  const [incomeTaxRate, setIncomeTaxRate] = useState(54); 
  
  // View State
  const [showFullSchedule, setShowFullSchedule] = useState(false);
  const [showPostTax, setShowPostTax] = useState(false);

  // --- Calculations ---
  const results = useMemo(() => {
    const loanAmount = propertyPrice * (1 - downPaymentPercent / 100);
    const monthlyRate = mortgageRate / 100 / 12;
    const numberOfPayments = mortgageTerm * 12;
    
    // Monthly Mortgage Payment Formula
    const monthlyMortgage = 
      monthlyRate === 0 
        ? loanAmount / numberOfPayments 
        : (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

    const data = [];
    let currentLoanBalance = loanAmount;
    let currentPropertyValue = propertyPrice;
    let currentMonthlyRent = monthlyRent;
    let currentAnnualTax = annualPropertyTax;
    let currentAnnualIns = annualInsurance;
    let currentMonthlyStrata = monthlyStrata;
    let currentMonthlyOther = monthlyOther;

    let cumulativeCashflow = 0;

    for (let year = 1; year <= mortgageTerm; year++) {
      let annualInterest = 0;
      let annualPrincipal = 0;
      
      // Calculate monthly amortization for the year
      for (let m = 0; m < 12; m++) {
        if (currentLoanBalance <= 0) break;
        const interestPayment = currentLoanBalance * monthlyRate;
        const principalPayment = monthlyMortgage - interestPayment;
        
        annualInterest += interestPayment;
        annualPrincipal += principalPayment;
        currentLoanBalance -= principalPayment;
      }
      if (currentLoanBalance < 0) currentLoanBalance = 0;

      // Annual Totals
      const grossRent = currentMonthlyRent * 12 * (1 - vacancyRate/100);
      
      // Calculate total operating expenses (annualized monthly costs + annual costs)
      const operatingExpenses = (currentMonthlyStrata * 12) + currentAnnualTax + currentAnnualIns + (currentMonthlyOther * 12);
      
      const mortgagePaymentAnnual = annualInterest + annualPrincipal;
      const totalExpenses = operatingExpenses + mortgagePaymentAnnual;
      
      const cashflowPreTax = grossRent - totalExpenses;
      
      // Taxable Income = Rent - Op Expenses - Interest
      const taxableIncome = grossRent - operatingExpenses - annualInterest;
      const estimatedTax = taxableIncome > 0 ? taxableIncome * (incomeTaxRate / 100) : 0;
      const cashflowPostTax = cashflowPreTax - estimatedTax;

      cumulativeCashflow += cashflowPostTax;

      // Appreciation
      const startValue = currentPropertyValue;
      currentPropertyValue = currentPropertyValue * (1 + annualAppreciation / 100);
      const annualAppreciationAmount = currentPropertyValue - startValue;

      // Equity
      const equity = currentPropertyValue - currentLoanBalance;
      
      // Total Return
      const totalGain = cashflowPostTax + annualPrincipal + annualAppreciationAmount;

      data.push({
        year,
        propertyValue: Math.round(currentPropertyValue),
        loanBalance: Math.round(currentLoanBalance),
        equity: Math.round(equity),
        grossRent: Math.round(grossRent),
        operatingExpenses: Math.round(operatingExpenses),
        mortgagePayment: Math.round(mortgagePaymentAnnual),
        interest: Math.round(annualInterest),
        principal: Math.round(annualPrincipal),
        cashflow: Math.round(cashflowPostTax),
        cashflowPreTax: Math.round(cashflowPreTax),
        totalGain: Math.round(totalGain),
        appreciation: Math.round(annualAppreciationAmount),
        // Breakdown for Pie Chart (Year 1 only really used)
        breakdown: {
            strata: currentMonthlyStrata * 12,
            tax: currentAnnualTax,
            insurance: currentAnnualIns,
            other: currentMonthlyOther * 12,
            interest: annualInterest
        }
      });

      // Inflate variables
      currentMonthlyRent *= (1 + annualRentIncrease / 100);
      currentAnnualTax *= (1 + expenseInflation / 100);
      currentAnnualIns *= (1 + expenseInflation / 100);
      currentMonthlyStrata *= (1 + expenseInflation / 100);
      currentMonthlyOther *= (1 + expenseInflation / 100);
    }

    return {
      monthlyMortgage,
      loanAmount,
      initialCashInvested: (propertyPrice * (downPaymentPercent / 100)),
      schedule: data
    };
  }, [
    propertyPrice, downPaymentPercent, mortgageRate, mortgageTerm,
    monthlyRent, monthlyStrata, annualPropertyTax, annualInsurance, monthlyOther, vacancyRate,
    annualAppreciation, annualRentIncrease, expenseInflation, incomeTaxRate
  ]);

  const stats = results.schedule[0] || {};
  
  // Filter for Display
  const visibleSchedule = useMemo(() => {
    return showFullSchedule ? results.schedule : results.schedule.slice(0, 10);
  }, [results.schedule, showFullSchedule]);

  // Formatters
  const fmt = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  const fmtPct = (val) => new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 2 }).format(val);
  const fmtK = (val) => (val / 1000).toFixed(0) + 'k'; // Simplified Kilo formatter

  // KPIs
  const cashOnCash = results.initialCashInvested > 0 ? (stats.cashflow / results.initialCashInvested) : 0;
  const noi = stats.grossRent - stats.operatingExpenses;
  const capRate = propertyPrice > 0 ? noi / propertyPrice : 0;

  // Data for Expense Pie Chart (Year 1)
  const expenseData = stats.breakdown ? [
    { name: 'Interest', value: stats.breakdown.interest, color: '#f97316' }, // Orange
    { name: 'Strata/Maint', value: stats.breakdown.strata, color: '#ef4444' }, // Red
    { name: 'Prop Tax', value: stats.breakdown.tax, color: '#f43f5e' }, // Rose
    { name: 'Insurance', value: stats.breakdown.insurance, color: '#ec4899' }, // Pink
    { name: 'Other', value: stats.breakdown.other, color: '#94a3b8' }, // Slate
  ].filter(d => d.value > 0) : [];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Real Estate Investment Model</h1>
          <p className="text-slate-600">Quickly calculate cashflow and visualize the "True Cost" of your mortgage.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: INPUTS */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="p-5 bg-white sticky top-6">
              <h2 className="text-lg font-bold mb-4 text-slate-900">Inputs</h2>
              
              <SectionTitle icon={Home} title="Property (Green)" />
              <InputField label="Purchase Price" value={propertyPrice} onChange={setPropertyPrice} unit="$" step="10000" highlight />
              <InputField 
                label="Down Payment %" 
                value={downPaymentPercent} 
                onChange={setDownPaymentPercent} 
                unit="%" 
                highlight
                subLabel={`Committed Cash: ${fmt(results.initialCashInvested)}`} 
              />
              
              <SectionTitle icon={Percent} title="Mortgage" />
              <InputField label="Interest Rate" value={mortgageRate} onChange={setMortgageRate} unit="%" step="0.1" highlight />
              <InputField label="Amortization" value={mortgageTerm} onChange={setMortgageTerm} unit="Years" />

              <SectionTitle icon={DollarSign} title="Income" />
              <InputField label="Monthly Rent" value={monthlyRent} onChange={setMonthlyRent} unit="$" step="100" highlight />
              <InputField label="Vacancy Rate" value={vacancyRate} onChange={setVacancyRate} unit="%" />

              <SectionTitle icon={Calculator} title="Expenses" />
              <InputField label="Property Tax (Yr)" value={annualPropertyTax} onChange={setAnnualPropertyTax} unit="$" step="100" />
              <InputField label="Insurance (Yr)" value={annualInsurance} onChange={setAnnualInsurance} unit="$" />
              <InputField label="Strata/Maint (Mo)" value={monthlyStrata} onChange={setMonthlyStrata} unit="$" step="10" />
              <InputField label="Other Expenses (Mo)" value={monthlyOther} onChange={setMonthlyOther} unit="$" step="10" tooltip="Management fees, repairs, etc." />

              <SectionTitle icon={TrendingUp} title="Projections" />
              <InputField label="Prop Growth %" value={annualAppreciation} onChange={setAnnualAppreciation} unit="%" step="0.1" />
              <InputField label="Rent Increase %" value={annualRentIncrease} onChange={setAnnualRentIncrease} unit="%" step="0.1" />
              <InputField 
                label="Exp Inflation %" 
                value={expenseInflation} 
                onChange={setExpenseInflation} 
                unit="%" 
                step="0.1" 
                tooltip="Annual increase for Strata, Tax, Insurance & Other expenses."
              />
              <InputField label="Tax Rate %" value={incomeTaxRate} onChange={setIncomeTaxRate} unit="%" />
            </Card>
          </div>

          {/* RIGHT COLUMN: DASHBOARD */}
          <div className="lg:col-span-9 space-y-6">
            
            {/* KPI Cards */}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${showPostTax ? 'xl:grid-cols-5' : 'xl:grid-cols-4'} gap-4 transition-all duration-300 ease-in-out`}>
              
              <KPICard
                title="Pre-Tax Cashflow (Mo)"
                value={stats.cashflowPreTax ? fmt(stats.cashflowPreTax / 12) : '$0'}
                subtext="Actual Liquidity"
                borderColor="border-slate-400"
                valueColor={stats.cashflowPreTax >= 0 ? 'text-slate-700' : 'text-rose-600'}
                description="Rent - (Op Expenses + Mortgage Payment)"
                clickable={true}
                onClick={() => setShowPostTax(!showPostTax)}
                isOpen={showPostTax}
              />

              {showPostTax && (
                <div className="animate-in fade-in zoom-in-95 duration-200">
                    <KPICard
                        title="Post-Tax Cashflow (Mo)"
                        value={stats.cashflow ? fmt(stats.cashflow / 12) : '$0'}
                        subtext="After Estimated Tax"
                        borderColor="border-emerald-500"
                        valueColor={stats.cashflow >= 0 ? 'text-emerald-600' : 'text-rose-600'}
                        description="Pre-Tax Cashflow - (Taxable Income * Tax Rate)"
                    />
                </div>
              )}
              
              <KPICard
                title="Cash on Cash"
                value={fmtPct(cashOnCash)}
                subtext={`Return on ${fmt(results.initialCashInvested)}`}
                borderColor="border-blue-500"
                description="Annual Post-Tax Cashflow / Initial Cash Invested"
              />
              
              <KPICard
                title="Cap Rate (Y1)"
                value={fmtPct(capRate)}
                subtext="NOI / Price"
                borderColor="border-purple-500"
                description="Net Operating Income / Purchase Price"
              />
              
              <KPICard
                title="Mortgage Payment"
                value={fmt(results.monthlyMortgage)}
                subtext={`Int: ${fmt(stats.interest/12)} | Prin: ${fmt(stats.principal/12)}`}
                borderColor="border-amber-500"
                isHighlighted={true}
                description="Interest (Cost) + Principal (Equity)"
              />
              
            </div>

            {/* TOGGLE BUTTON */}
            <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                <span className="text-sm text-slate-500 font-medium">Viewing Projection:</span>
                <button 
                  onClick={() => setShowFullSchedule(!showFullSchedule)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-md transition-colors"
                >
                  {showFullSchedule ? (
                    <>
                      <span>Show Less (10 Years)</span>
                      <ChevronUp className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>Show All ({mortgageTerm} Years)</span>
                      <ChevronDown className="w-4 h-4" />
                    </>
                  )}
                </button>
            </div>

            {/* CHART ROW 1 */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              
              {/* Chart 1: Cashflow Stacked */}
              <Card className="p-6">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Cashflow Analysis</h3>
                        <p className="text-xs text-slate-500">Principal is Equity (Savings), Interest & Expenses are Costs.</p>
                    </div>
                </div>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={visibleSchedule} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                      <YAxis tickFormatter={fmtK} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} width={35} />
                      <Tooltip formatter={(value) => fmt(value)} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend iconType="circle" />
                      {/* Positive Cashflow items */}
                      <Bar dataKey="grossRent" name="Rent Income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                      
                      {/* Negative items stacked */}
                      <Bar dataKey="operatingExpenses" name="Op. Expenses" stackId="cost" fill="#ef4444" />
                      <Bar dataKey="interest" name="Interest" stackId="cost" fill="#f97316" />
                      <Bar dataKey="principal" name="Principal (Equity)" stackId="cost" fill="#3b82f6" radius={[4, 4, 0, 0]} />

                      <Line 
                        type="monotone" 
                        dataKey="cashflowPreTax" 
                        name="Net Cashflow" 
                        stroke="#1e293b" 
                        strokeWidth={2} 
                        dot={{r: 3}} 
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Chart 2: Expense Breakdown Pie */}
              <Card className="p-6 flex flex-col">
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-800">Where does the money go? (Year 1)</h3>
                    <p className="text-xs text-slate-500">Breakdown of all outflows (Expenses + Interest).</p>
                </div>
                <div className="flex-1 flex items-center justify-center min-h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${fmt(value)}`} 
                      >
                        {expenseData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => fmt(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>

            </div>

            {/* CHART ROW 2 */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Chart 3: Equity */}
                <Card className="p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Equity & Loan</h3>
                    <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={visibleSchedule} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                        <YAxis tickFormatter={fmtK} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} width={35} />
                        <Tooltip formatter={(value) => fmt(value)} />
                        <Area type="monotone" dataKey="propertyValue" name="Property Value" stroke="#059669" fill="url(#colorValue)" strokeWidth={2} />
                        <Area type="monotone" dataKey="loanBalance" name="Loan Balance" stroke="#ef4444" fill="transparent" strokeDasharray="5 5" strokeWidth={2} />
                        <Area type="monotone" dataKey="equity" name="Net Equity" stroke="#3b82f6" fill="transparent" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                    </div>
                </Card>

                {/* Chart 4: Total Gains Stacked */}
                <Card className="p-6 flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Total Gain Composition</h3>
                    <p className="text-sm text-slate-500 mb-4">Gain = Cashflow + Principal Paydown + Appreciation</p>
                    <div className="h-64 w-full mb-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={visibleSchedule} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} stacked>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="year" axisLine={false} tickLine={false} />
                            <YAxis tickFormatter={fmtK} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} width={35} />
                            <Tooltip formatter={(value) => fmt(value)} cursor={{fill: '#f1f5f9'}} />
                            <Legend />
                            <Bar dataKey="cashflow" name="Cashflow" stackId="a" fill="#3b82f6" />
                            <Bar dataKey="principal" name="Principal Paydown" stackId="a" fill="#8b5cf6" />
                            <Bar dataKey="appreciation" name="Appreciation" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Tax Impact Explanation */}
                    <div className="mt-auto bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-600 flex items-start gap-2">
                        <Info className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <p>
                            <strong>How Tax Rate Affects Total Gain:</strong> High taxes reduce your "Cashflow" (Blue bar), which is part of your Total Gain. 
                            However, Principal Paydown (Purple) and Appreciation (Green) are usually tax-deferred until you sell the property, so they remain unaffected in this annual view.
                        </p>
                    </div>
                </Card>
            </div>

            {/* DATA TABLE */}
            <Card className="overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">Yearly Breakdown</h3>
                <span className="text-sm text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                    {showFullSchedule ? `Full ${mortgageTerm} Year Projection` : 'First 10 Years'}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-right">
                  <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left">Year</th>
                      <th className="px-4 py-3">Rent</th>
                      <th className="px-4 py-3">Expenses</th>
                      <th className="px-4 py-3">Interest</th>
                      <th className="px-4 py-3 text-blue-600">Principal</th>
                      <th className="px-4 py-3 text-emerald-600">Cashflow</th>
                      <th className="px-4 py-3 font-bold text-slate-800">Total Gain</th>
                      <th className="px-4 py-3">Equity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleSchedule.map((row) => (
                      <tr key={row.year} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-left font-medium text-slate-700">{row.year}</td>
                        <td className="px-4 py-3">{fmt(row.grossRent)}</td>
                        <td className="px-4 py-3 text-rose-500">-{fmt(row.operatingExpenses)}</td>
                        <td className="px-4 py-3 text-orange-500">-{fmt(row.interest)}</td>
                        <td className="px-4 py-3 text-blue-600">-{fmt(row.principal)}</td>
                        <td className={`px-4 py-3 font-medium ${row.cashflow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {fmt(row.cashflow)}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-800 bg-slate-50/50">{fmt(row.totalGain)}</td>
                        <td className="px-4 py-3 text-slate-600">{fmt(row.equity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}