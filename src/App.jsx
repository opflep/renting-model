import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ComposedChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Calculator, TrendingUp, DollarSign, Home, Percent, Info, ChevronDown, ChevronUp, ChevronRight, MapPin } from 'lucide-react';

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

const KPICard = ({ title, value, subtext, description, borderColor = "border-slate-200", valueColor = "text-slate-800", isHighlighted = false, onClick, clickable = false, isOpen = false, t }) => {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <Card 
      className={`p-4 border-l-4 ${borderColor} shadow-none relative overflow-visible transition-all duration-200 ${isHighlighted ? 'ring-1 ring-amber-200' : ''} ${clickable ? 'cursor-pointer hover:bg-slate-50' : ''}`}
      onClick={onClick ? (e) => {
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
            <Info className={`w-4 h-4 transition-colors ${showInfo ? 'text-emerald-500' : 'text-slate-300 hover:text-slate-50'}`} />
          </button>
          
          {showInfo && (
            <div className="absolute right-0 top-6 w-64 bg-slate-800 text-white text-xs rounded p-3 z-50 shadow-xl">
              <div className="font-semibold mb-1 text-emerald-400">{t.formula}:</div>
              {description}
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
                  {t.seeTax} <ChevronRight className="w-3 h-3 ml-0.5" />
              </span>
          )}
      </div>
    </Card>
  );
};

const DICT = {
  NA: {
    title: "Real Estate Investment Model",
    subtitle: "Quickly calculate cashflow and visualize the 'True Cost' of your mortgage.",
    inputs: "Inputs",
    property: "Property (Green)",
    price: "Purchase Price",
    downPayment: "Down Payment %",
    committedCash: "Committed Cash",
    mortgage: "Mortgage",
    rate: "Interest Rate",
    term: "Amortization",
    income: "Income",
    rent: "Monthly Rent",
    vacancy: "Vacancy Rate",
    expenses: "Expenses",
    tax: "Property Tax (Yr)",
    insurance: "Insurance (Yr)",
    strata: "Strata/Maint (Mo)",
    other: "Other Expenses (Mo)",
    otherTooltip: "Management fees, repairs, etc.",
    projections: "Projections",
    growth: "Prop Growth %",
    rentInc: "Rent Increase %",
    expInf: "Exp Inflation %",
    expInfTooltip: "Annual increase for Strata, Tax, Insurance & Other expenses.",
    incomeTax: "Tax Rate %",
    incomeTaxTooltip: "Marginal tax rate on Net Income.",
    formula: "Formula",
    kpiPreTax: "Pre-Tax Cashflow (Mo)",
    kpiPreTaxSub: "Actual Liquidity",
    kpiPreTaxDesc: "Rent - (Op Expenses + Mortgage Payment).",
    kpiPostTax: "Post-Tax Cashflow (Mo)",
    kpiPostTaxSub: "After Estimated Tax",
    kpiPostTaxDesc: "Pre-Tax Cashflow - Estimated Income Tax.",
    kpiCoC: "Cash on Cash",
    kpiCoCSub: "Return on",
    kpiCoCDesc: "Annual Post-Tax Cashflow / Initial Cash Invested.",
    kpiCapRate: "Cap Rate (Y1)",
    kpiCapRateSub: "NOI / Price",
    kpiCapRateDesc: "Net Operating Income / Purchase Price.",
    kpiMortgage: "Mortgage Payment",
    kpiMortgageSub: "Int: {int} | Prin: {prin}",
    kpiMortgageDesc: "Interest (Cost) + Principal (Equity).",
    seeTax: "See Tax Impact",
    viewing: "Viewing Projection:",
    showLess: "Show Less (10 Years)",
    showAll: "Show All ({term} Years)",
    chart1Title: "Cashflow Analysis",
    chart1Sub: "Principal is Equity, Interest & Expenses are Costs.",
    chart1Rent: "Rent Income",
    chart1Exp: "Op. Expenses",
    chart1Int: "Interest",
    chart1Prin: "Principal (Equity)",
    chart1Net: "Net Cashflow",
    chart2Title: "Where does the money go? (Year 1)",
    chart2Sub: "Breakdown of all outflows.",
    chart3Title: "Equity & Loan",
    chart3Prop: "Property Value",
    chart3Loan: "Loan Balance",
    chart3Eq: "Net Equity",
    chart4Title: "Total Gain Composition",
    chart4Sub: "Gain = Cashflow + Principal Paydown + Appreciation",
    chart4Gain: "Appreciation",
    taxNoteTitle: "How Tax Rate Affects Total Gain:",
    taxNoteDesc: "High taxes reduce your Cashflow (Blue bar), which is part of your Total Gain.",
    tableTitle: "Yearly Breakdown",
    tableYear: "Year",
    tableRent: "Rent",
    tableExp: "Expenses",
    tableInt: "Interest",
    tablePrin: "Principal",
    tableCashflow: "Cashflow",
    tableTotalGain: "Total Gain",
    tableEquity: "Equity",
    pieInt: "Interest",
    pieStrata: "Strata/Maint",
    pieTax: "Prop Tax",
    pieIns: "Insurance",
    pieOther: "Other"
  },
  VN: {
    title: "Mô Hình Đầu Tư BĐS Cho Thuê",
    subtitle: "Trực quan hóa dòng tiền, nghĩa vụ nợ, và lợi nhuận dài hạn (Chuẩn Việt Nam).",
    inputs: "Thông Số Nhập Liệu",
    property: "Bất Động Sản (Nhập Xanh)",
    price: "Giá Mua BĐS (tỷ)",
    downPayment: "Tỉ Lệ Vốn Tự Có",
    committedCash: "Vốn Đầu Tư",
    mortgage: "Khoản Vay",
    rate: "Lãi Suất Vay",
    term: "Thời Hạn Vay",
    income: "Doanh Thu Cho Thuê",
    rent: "Giá Thuê / Tháng (triệu)",
    vacancy: "Tỉ Lệ Trống",
    expenses: "Chi Phí Vận Hành (triệu)",
    tax: "Thuế Đất / Năm",
    insurance: "Bảo hiểm / Năm",
    strata: "Phí Quản Lý / Tháng",
    other: "Chi Phí Khác / Tháng",
    otherTooltip: "Phí môi giới, bảo trì, v.v.",
    projections: "Dự Phóng Tương Lai",
    growth: "BĐS Tăng Giá",
    rentInc: "Tăng Giá Thuê",
    expInf: "Lạm Phát Chi Phí",
    expInfTooltip: "Tăng chi phí quản lý hàng năm.",
    incomeTax: "Thuế Cho Thuê",
    incomeTaxTooltip: "Mặc định VN: 10% tính trên TỔNG doanh thu nếu >100tr/năm.",
    formula: "Cách tính",
    kpiPreTax: "Dòng Tiền / Tháng (TT)",
    kpiPreTaxSub: "Trạng Thái Thực Tế",
    kpiPreTaxDesc: "Giá Thuê - (Chi phí quản lý + Tiền trả ngân hàng).",
    kpiPostTax: "Dòng Tiền Sau Thuế",
    kpiPostTaxSub: "Đã trừ Thuế Cho Thuê",
    kpiPostTaxDesc: "Dòng Tiền Trước Thuế - Tiền Thuế.",
    kpiCoC: "Tỉ Suất Tiền Mặt",
    kpiCoCSub: "Lãi trên",
    kpiCoCDesc: "Dòng tiền Sau Thuế hàng năm / Vốn Đầu Tư Ban Đầu.",
    kpiCapRate: "Tỉ Suất Sinh Lời (Cap)",
    kpiCapRateSub: "NOI / Giá Mua",
    kpiCapRateDesc: "Lợi Nhuận Vận Hành Thuần chia cho Giá Mua.",
    kpiMortgage: "Trả Ngân Hàng (Tháng)",
    kpiMortgageSub: "Lãi: {int} | Gốc: {prin}",
    kpiMortgageDesc: "Tổng tiền trả NH. GỐC là tích luỹ, LÃI là chi phí.",
    seeTax: "Xem Thuế",
    viewing: "Đang xem dữ liệu:",
    showLess: "Thu Gọn (10 Năm)",
    showAll: "Xem Toàn Bộ ({term} Năm)",
    chart1Title: "Phân Tích Dòng Tiền",
    chart1Sub: "Trả Gốc là tích luỹ, Lãi & Phí QL là Chi phí.",
    chart1Rent: "Thu Tiền Thuê",
    chart1Exp: "Phí QL + Thuế",
    chart1Int: "Trả Lãi NH",
    chart1Prin: "Trả Gốc NH (Tích luỹ)",
    chart1Net: "Dòng Tiền Thực Tế",
    chart2Title: "Chi Phí Thất Thoát (Năm 1)",
    chart2Sub: "Phân bổ dòng tiền chi ra hàng tháng.",
    chart3Title: "Tích Luỹ Vốn Chủ & Dư Nợ",
    chart3Prop: "Giá Trị BĐS",
    chart3Loan: "Dư Nợ NH",
    chart3Eq: "Vốn Chủ Thực Tế",
    chart4Title: "Cấu Trúc Lợi Nhuận",
    chart4Sub: "Tổng Lời = Tiền Mặt + Trả Gốc NH + Tăng Giá BĐS",
    chart4Gain: "BĐS Tăng Giá",
    taxNoteTitle: "Ảo Tưởng Dòng Tiền (Phantom Cashflow):",
    taxNoteDesc: "Thuế TNCN tại VN tính trên tổng doanh thu. Bạn có thể phải nộp thuế ngay cả khi dòng tiền đang âm.",
    tableTitle: "Bảng Phân Tích Chi Tiết",
    tableYear: "Năm",
    tableRent: "Giá Thuê",
    tableExp: "Phí/Thuế",
    tableInt: "Trả Lãi",
    tablePrin: "Trả Gốc",
    tableCashflow: "Dòng Tiền",
    tableTotalGain: "Tổng Lời",
    tableEquity: "Vốn Chủ",
    pieInt: "Trả Lãi NH",
    pieStrata: "Phí QL/Dịch vụ",
    pieTax: "Thuế",
    pieIns: "Bảo hiểm",
    pieOther: "Khác"
  }
};

export default function RealEstateCalculator() {
  const [market, setMarket] = useState('NA'); 
  const t = DICT[market];

  // Base raw values (stored in standard units: $1 or 1 VND)
  const [propertyPrice, setPropertyPrice] = useState(530000); 
  const [downPaymentPercent, setDownPaymentPercent] = useState(25); 
  const [mortgageRate, setMortgageRate] = useState(4.5); 
  const [mortgageTerm, setMortgageTerm] = useState(30); 
  
  const [monthlyRent, setMonthlyRent] = useState(2400); 
  const [monthlyStrata, setMonthlyStrata] = useState(466); 
  const [annualPropertyTax, setAnnualPropertyTax] = useState(2000); 
  const [annualInsurance, setAnnualInsurance] = useState(1200); 
  const [monthlyOther, setMonthlyOther] = useState(0); 
  const [vacancyRate, setVacancyRate] = useState(0); 
  
  const [annualAppreciation, setAnnualAppreciation] = useState(3.0); 
  const [annualRentIncrease, setAnnualRentIncrease] = useState(0.0); 
  const [expenseInflation, setExpenseInflation] = useState(2.0); 
  const [incomeTaxRate, setIncomeTaxRate] = useState(54); 
  
  const [showFullSchedule, setShowFullSchedule] = useState(false);
  const [showPostTax, setShowPostTax] = useState(false);

  useEffect(() => {
    if (market === 'VN') {
        setPropertyPrice(4000000000); // 4.0 tỷ
        setDownPaymentPercent(30);
        setMortgageRate(9.0);
        setMortgageTerm(30);
        setMonthlyRent(15000000); // 15 triệu
        setMonthlyStrata(1500000); // 1.5 triệu
        setAnnualPropertyTax(0);
        setAnnualInsurance(0);
        setMonthlyOther(0);
        setAnnualAppreciation(5.0);
        setExpenseInflation(3.0);
        setIncomeTaxRate(10);
    } else {
        setPropertyPrice(530000);
        setDownPaymentPercent(25);
        setMortgageRate(4.5);
        setMortgageTerm(30);
        setMonthlyRent(2400);
        setMonthlyStrata(466);
        setAnnualPropertyTax(2000);
        setAnnualInsurance(1200);
        setMonthlyOther(0);
        setAnnualAppreciation(3.0);
        setExpenseInflation(2.0);
        setIncomeTaxRate(54);
    }
    setShowPostTax(false);
  }, [market]);

  const isVN = market === 'VN';
  const locale = isVN ? 'vi-VN' : 'en-US';
  const currencyStr = isVN ? 'VND' : 'USD';
  
  const fmt = (val) => new Intl.NumberFormat(locale, { style: 'currency', currency: currencyStr, maximumFractionDigits: 0 }).format(val);
  const fmtPct = (val) => new Intl.NumberFormat(locale, { style: 'percent', minimumFractionDigits: 2 }).format(val / 100);
  
  // Smart Short Formatter for VN: Swaps between triệu and tỷ
  const fmtShort = (val) => {
      const absVal = Math.abs(val);
      if (isVN) {
        if (absVal >= 1e9) return (val / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + ' tỷ';
        return (val / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + ' triệu';
      } else {
        if (absVal >= 1e6) return (val / 1e6).toFixed(2).replace(/\.00$/, '') + 'm';
        if (absVal >= 1e3) return (val / 1e3).toFixed(0) + 'k';
      }
      return fmt(val);
  };

  const results = useMemo(() => {
    const loanAmount = propertyPrice * (1 - downPaymentPercent / 100);
    const monthlyRate = mortgageRate / 100 / 12;
    const numberOfPayments = mortgageTerm * 12;
    
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

    for (let year = 1; year <= mortgageTerm; year++) {
      let annualInterest = 0;
      let annualPrincipal = 0;
      
      for (let m = 0; m < 12; m++) {
        if (currentLoanBalance <= 0) break;
        const interestPayment = currentLoanBalance * monthlyRate;
        const principalPayment = monthlyMortgage - interestPayment;
        annualInterest += interestPayment;
        annualPrincipal += principalPayment;
        currentLoanBalance -= principalPayment;
      }
      if (currentLoanBalance < 0) currentLoanBalance = 0;

      const grossRent = currentMonthlyRent * 12 * (1 - vacancyRate/100);
      const operatingExpenses = (currentMonthlyStrata * 12) + currentAnnualTax + currentAnnualIns + (currentMonthlyOther * 12);
      const mortgagePaymentAnnual = annualInterest + annualPrincipal;
      const totalExpenses = operatingExpenses + mortgagePaymentAnnual;
      const cashflowPreTax = grossRent - totalExpenses;
      
      let estimatedTax = 0;
      if (isVN) {
          estimatedTax = grossRent > 100000000 ? grossRent * (incomeTaxRate / 100) : 0;
      } else {
          const taxableIncome = grossRent - operatingExpenses - annualInterest;
          estimatedTax = taxableIncome > 0 ? taxableIncome * (incomeTaxRate / 100) : 0;
      }

      const cashflowPostTax = cashflowPreTax - estimatedTax;
      const startValue = currentPropertyValue;
      currentPropertyValue = currentPropertyValue * (1 + annualAppreciation / 100);
      const appreciationAmount = currentPropertyValue - startValue;
      const equity = currentPropertyValue - currentLoanBalance;
      const totalGain = cashflowPostTax + annualPrincipal + appreciationAmount;

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
        taxBill: Math.round(estimatedTax),
        cashflow: Math.round(cashflowPostTax),
        cashflowPreTax: Math.round(cashflowPreTax),
        totalGain: Math.round(totalGain),
        appreciation: Math.round(appreciationAmount),
        breakdown: {
            strata: currentMonthlyStrata * 12,
            tax: currentAnnualTax + (isVN ? estimatedTax : 0),
            insurance: currentAnnualIns,
            other: currentMonthlyOther * 12,
            interest: annualInterest
        }
      });

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
  }, [propertyPrice, downPaymentPercent, mortgageRate, mortgageTerm, monthlyRent, monthlyStrata, annualPropertyTax, annualInsurance, monthlyOther, vacancyRate, annualAppreciation, annualRentIncrease, expenseInflation, incomeTaxRate, isVN]);

  const stats = results.schedule[0] || {};
  const visibleSchedule = useMemo(() => {
    return showFullSchedule ? results.schedule : results.schedule.slice(0, 10);
  }, [results.schedule, showFullSchedule]);

  const cashOnCash = results.initialCashInvested > 0 ? (stats.cashflow / results.initialCashInvested) * 100 : 0;
  const noi = stats.grossRent - stats.operatingExpenses;
  const capRate = propertyPrice > 0 ? (noi / propertyPrice) * 100 : 0;

  const expenseData = stats.breakdown ? [
    { name: t.pieInt, value: stats.breakdown.interest, color: '#f97316' }, 
    { name: t.pieStrata, value: stats.breakdown.strata, color: '#ef4444' }, 
    { name: t.pieTax, value: stats.breakdown.tax, color: '#f43f5e' }, 
    { name: t.pieIns, value: stats.breakdown.insurance, color: '#ec4899' }, 
    { name: t.pieOther, value: stats.breakdown.other, color: '#94a3b8' }, 
  ].filter(d => d.value > 0) : [];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <header>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">{t.title}</h1>
                <p className="text-slate-600">{t.subtitle}</p>
            </header>
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                <button onClick={() => setMarket('NA')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${market === 'NA' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-500 hover:bg-slate-50'}`}><MapPin className="w-4 h-4" /> North America</button>
                <button onClick={() => setMarket('VN')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${market === 'VN' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-500 hover:bg-slate-50'}`}><MapPin className="w-4 h-4" /> Việt Nam</button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <Card className="p-5 bg-white sticky top-6">
              <h2 className="text-lg font-bold mb-4 text-slate-900">{t.inputs}</h2>
              <SectionTitle icon={Home} title={t.property} />
              <InputField label={t.price} value={isVN ? propertyPrice / 1e9 : propertyPrice} onChange={(v) => setPropertyPrice(isVN ? v * 1e9 : v)} unit={isVN ? "tỷ" : "$"} step={isVN ? "0.05" : "10000"} highlight />
              <InputField label={t.downPayment} value={downPaymentPercent} onChange={setDownPaymentPercent} unit="%" highlight subLabel={`${t.committedCash}: ${fmtShort(results.initialCashInvested)}`} />
              
              <SectionTitle icon={Percent} title={t.mortgage} />
              <InputField label={t.rate} value={mortgageRate} onChange={setMortgageRate} unit="%" step="0.1" highlight />
              <InputField label={t.term} value={mortgageTerm} onChange={setMortgageTerm} unit={isVN ? "Năm" : "Years"} />
              
              <SectionTitle icon={DollarSign} title={t.income} />
              <InputField label={t.rent} value={isVN ? monthlyRent / 1e6 : monthlyRent} onChange={(v) => setMonthlyRent(isVN ? v * 1e6 : v)} unit={isVN ? "triệu" : "$"} step={isVN ? "0.5" : "100"} highlight />
              <InputField label={t.vacancy} value={vacancyRate} onChange={setVacancyRate} unit="%" />
              
              <SectionTitle icon={Calculator} title={t.expenses} />
              <InputField label={t.tax} value={isVN ? annualPropertyTax / 1e6 : annualPropertyTax} onChange={(v) => setAnnualPropertyTax(isVN ? v * 1e6 : v)} unit={isVN ? "triệu" : "$"} step={isVN ? "1" : "100"} />
              <InputField label={t.insurance} value={isVN ? annualInsurance / 1e6 : annualInsurance} onChange={(v) => setAnnualInsurance(isVN ? v * 1e6 : v)} unit={isVN ? "triệu" : "$"} step={isVN ? "1" : "100"} />
              <InputField label={t.strata} value={isVN ? monthlyStrata / 1e6 : monthlyStrata} onChange={(v) => setMonthlyStrata(isVN ? v * 1e6 : v)} unit={isVN ? "triệu" : "$"} step={isVN ? "0.1" : "10"} />
              <InputField label={t.other} value={isVN ? monthlyOther / 1e6 : monthlyOther} onChange={(v) => setMonthlyOther(isVN ? v * 1e6 : v)} unit={isVN ? "triệu" : "$"} step={isVN ? "0.1" : "10"} tooltip={t.otherTooltip} />

              <SectionTitle icon={TrendingUp} title={t.projections} />
              <InputField label={t.growth} value={annualAppreciation} onChange={setAnnualAppreciation} unit="%" step="0.1" />
              <InputField label={t.rentInc} value={annualRentIncrease} onChange={setAnnualRentIncrease} unit="%" step="0.1" />
              <InputField label={t.expInf} value={expenseInflation} onChange={setExpenseInflation} unit="%" step="0.1" tooltip={t.expInfTooltip} />
              <InputField label={t.incomeTax} value={incomeTaxRate} onChange={setIncomeTaxRate} unit="%" tooltip={t.incomeTaxTooltip} />
            </Card>
          </div>

          <div className="lg:col-span-9 space-y-6">
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${showPostTax ? 'xl:grid-cols-5' : 'xl:grid-cols-4'} gap-4 transition-all duration-300 ease-in-out`}>
              <KPICard title={t.kpiPreTax} value={stats.cashflowPreTax ? fmtShort(stats.cashflowPreTax / 12) : (isVN ? '0' : '$0')} subtext={t.kpiPreTaxSub} borderColor="border-slate-400" valueColor={stats.cashflowPreTax >= 0 ? 'text-slate-700' : 'text-rose-600'} description={t.kpiPreTaxDesc} clickable={true} onClick={() => setShowPostTax(!showPostTax)} isOpen={showPostTax} t={t} />
              {showPostTax && <div className="animate-in fade-in zoom-in-95 duration-200"><KPICard title={t.kpiPostTax} value={stats.cashflow ? fmtShort(stats.cashflow / 12) : (isVN ? '0' : '$0')} subtext={t.kpiPostTaxSub} borderColor="border-emerald-500" valueColor={stats.cashflow >= 0 ? 'text-emerald-600' : 'text-rose-600'} description={t.kpiPostTaxDesc} t={t} /></div>}
              <KPICard title={t.kpiCoC} value={fmtPct(cashOnCash)} subtext={`${t.kpiCoCSub} ${fmtShort(results.initialCashInvested)}`} borderColor="border-blue-500" description={t.kpiCoCDesc} t={t} />
              <KPICard title={t.kpiCapRate} value={fmtPct(capRate)} subtext={t.kpiCapRateSub} borderColor="border-purple-500" description={t.kpiCapRateDesc} t={t} />
              <KPICard title={t.kpiMortgage} value={fmtShort(results.monthlyMortgage)} subtext={t.kpiMortgageSub.replace('{int}', fmtShort(stats.interest/12)).replace('{prin}', fmtShort(stats.principal/12))} borderColor="border-amber-500" isHighlighted={true} description={t.kpiMortgageDesc} t={t} />
            </div>

            <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                <span className="text-sm text-slate-500 font-medium">{t.viewing}</span>
                <button onClick={() => setShowFullSchedule(!showFullSchedule)} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-md transition-colors" >
                  {showFullSchedule ? (<><span >{t.showLess}</span><ChevronUp className="w-4 h-4" /></>) : (<><span >{t.showAll.replace('{term}', mortgageTerm)}</span><ChevronDown className="w-4 h-4" /></>)}
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card className="p-6">
                <div className="flex justify-between items-start mb-6"><div><h3 className="text-lg font-bold text-slate-800">{t.chart1Title}</h3><p className="text-xs text-slate-500">{t.chart1Sub}</p></div></div>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={visibleSchedule} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                      <YAxis tickFormatter={fmtShort} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} width={70} />
                      <Tooltip formatter={(value) => fmtShort(value)} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend iconType="circle" />
                      <Bar dataKey="grossRent" name={t.chart1Rent} fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                      <Bar dataKey="operatingExpenses" name={t.chart1Exp} stackId="cost" fill="#ef4444" />
                      <Bar dataKey="interest" name={t.chart1Int} stackId="cost" fill="#f97316" />
                      <Bar dataKey="principal" name={t.chart1Prin} stackId="cost" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="cashflowPreTax" name={t.chart1Net} stroke="#1e293b" strokeWidth={2} dot={{r: 3}} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-6 flex flex-col">
                <div className="mb-4"><h3 className="text-lg font-bold text-slate-800">{t.chart2Title}</h3><p className="text-xs text-slate-500">{t.chart2Sub}</p></div>
                <div className="flex-1 flex items-center justify-center min-h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={expenseData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" label={({ name, value }) => `${name}: ${fmtShort(value)}`} >
                        {expenseData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                      </Pie>
                      <Tooltip formatter={(value) => fmtShort(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">{t.chart3Title}</h3>
                    <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={visibleSchedule} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <defs><linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                        <YAxis tickFormatter={fmtShort} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} width={70} />
                        <Tooltip formatter={(value) => fmtShort(value)} />
                        <Area type="monotone" dataKey="propertyValue" name={t.chart3Prop} stroke="#059669" fill="url(#colorValue)" strokeWidth={2} />
                        <Area type="monotone" dataKey="loanBalance" name={t.chart3Loan} stroke="#ef4444" fill="transparent" strokeDasharray="5 5" strokeWidth={2} />
                        <Area type="monotone" dataKey="equity" name={t.chart3Eq} stroke="#3b82f6" fill="transparent" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="p-6 flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">{t.chart4Title}</h3>
                    <p className="text-sm text-slate-500 mb-4">{t.chart4Sub}</p>
                    <div className="h-64 w-full mb-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={visibleSchedule} margin={{ top: 10, right: 10, left: 10, bottom: 0 }} stacked>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="year" axisLine={false} tickLine={false} />
                            <YAxis tickFormatter={fmtShort} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} width={70} />
                            <Tooltip formatter={(value) => fmtShort(value)} cursor={{fill: '#f1f5f9'}} />
                            <Legend />
                            <Bar dataKey="cashflow" name={t.tableCashflow} stackId="a" fill="#3b82f6" />
                            <Bar dataKey="principal" name={t.tablePrin} stackId="a" fill="#8b5cf6" />
                            <Bar dataKey="appreciation" name={t.chart4Gain} stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-auto bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-600 flex items-start gap-2">
                        <Info className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" /><p><strong>{t.taxNoteTitle}</strong> {t.taxNoteDesc}</p>
                    </div>
                </Card>
            </div>

            <Card className="overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">{t.tableTitle}</h3>
                <span className="text-sm text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{showFullSchedule ? t.showAll.replace('{term}', mortgageTerm) : t.showLess}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-right">
                  <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left">{t.tableYear}</th>
                      <th className="px-4 py-3">{t.tableRent}</th>
                      <th className="px-4 py-3">{t.tableExp}</th>
                      <th className="px-4 py-3">{t.tableInt}</th>
                      <th className="px-4 py-3 text-blue-600">{t.tablePrin}</th>
                      <th className="px-4 py-3 text-emerald-600">{t.tableCashflow}</th>
                      <th className="px-4 py-3 font-bold text-slate-800">{t.tableTotalGain}</th>
                      <th className="px-4 py-3">{t.tableEquity}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleSchedule.map((row) => (
                      <tr key={row.year} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-left font-medium text-slate-700">{row.year}</td>
                        <td className="px-4 py-3">{fmtShort(row.grossRent)}</td>
                        <td className="px-4 py-3 text-rose-500">-{fmtShort(row.operatingExpenses + (isVN ? row.taxBill : 0))}</td>
                        <td className="px-4 py-3 text-orange-500">-{fmtShort(row.interest)}</td>
                        <td className="px-4 py-3 text-blue-600">-{fmtShort(row.principal)}</td>
                        <td className={`px-4 py-3 font-medium ${row.cashflow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmtShort(row.cashflow)}</td>
                        <td className="px-4 py-3 font-bold text-slate-800 bg-slate-50/50">{fmtShort(row.totalGain)}</td>
                        <td className="px-4 py-3 text-slate-600">{fmtShort(row.equity)}</td>
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