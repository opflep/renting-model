import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, Info } from 'lucide-react';


export const Card = ({ children, className = '' }) => (
  <section className={`bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}>{children}</section>
);

export const CardHeader = ({ title, subtitle, right }) => (
  <div className="flex items-start justify-between gap-4 mb-4">
    <div>
      <h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
    {right}
  </div>
);

// Numeric input that keeps the raw text while typing (so "0." or an empty
// field doesn't snap back) and commits a number to the parent.
export function NumberField({ label, value, onChange, unit, step = 1, scale = 1, tip, hint }) {
  const id = useId();
  const display = (v) => {
    const n = v / scale;
    return Number.isFinite(n) ? String(Math.round(n * 1e6) / 1e6) : '';
  };
  const [text, setText] = useState(display(value));
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setText(display(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, scale]);

  return (
    <div>
      <label htmlFor={id} className="flex items-center justify-between text-[11px] font-medium text-slate-500 mb-1">
        <span className="truncate">{label}</span>
        {tip && <InfoTip text={tip} />}
      </label>
      <div className="relative">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          step={step}
          value={text}
          onFocus={() => (focused.current = true)}
          onBlur={() => {
            focused.current = false;
            setText(display(value));
          }}
          onChange={(e) => {
            setText(e.target.value);
            const n = parseFloat(e.target.value);
            onChange(Number.isFinite(n) ? n * scale : 0);
          }}
          className="w-full rounded-lg border border-slate-200 bg-slate-50/60 pl-2.5 pr-10 py-1.5 text-sm text-slate-900 tabular-nums focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
        />
        {unit && <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-xs text-slate-400">{unit}</span>}
      </div>
      {hint && <p className="text-[11px] text-blue-700 mt-1 text-right">{hint}</p>}
    </div>
  );
}

export function Toggle({ label, checked, onChange }) {
  return (
    <label className="col-span-2 flex items-center justify-between gap-3 py-1 cursor-pointer select-none">
      <span className="text-xs text-slate-600">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition ${checked ? 'bg-blue-600' : 'bg-slate-300'}`}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`} />
      </button>
    </label>
  );
}

export function Group({ title, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-slate-100 first:border-t-0">
      <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center gap-2 py-3 text-left">
        {Icon && <Icon className="w-4 h-4 text-slate-400" />}
        <span className="flex-1 text-xs font-semibold uppercase tracking-wider text-slate-700">{title}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? '' : '-rotate-90'}`} />
      </button>
      {open && <div className="grid grid-cols-2 gap-x-3 gap-y-3 pb-4">{children}</div>}
    </div>
  );
}

export function InfoTip({ text, title }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type="button" aria-label={title || 'info'} onClick={() => setOpen(!open)} className="text-slate-300 hover:text-slate-500">
        <Info className="w-3.5 h-3.5" />
      </button>
      {open && (
        <span className="absolute right-0 top-5 z-50 w-64 rounded-lg bg-slate-900 p-3 text-[11px] font-normal normal-case tracking-normal leading-relaxed text-slate-100 shadow-xl">
          {title && <span className="block font-semibold text-white mb-1">{title}</span>}
          {text}
        </span>
      )}
    </span>
  );
}

export function Kpi({ label, value, sub, desc, tone = 'neutral', formulaLabel }) {
  const toneClass = { neutral: 'text-slate-900', good: 'text-emerald-700', bad: 'text-rose-600' }[tone];
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
        {desc && <InfoTip text={desc} title={formulaLabel} />}
      </div>
      <p className={`mt-1.5 text-2xl font-semibold tabular-nums tracking-tight ${toneClass}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-500 tabular-nums">{sub}</p>}
    </Card>
  );
}

export function ChartTooltip({ active, payload, label, fmt, labelFmt }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white/95 backdrop-blur px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-slate-900 mb-1">{labelFmt ? labelFmt(label) : label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 py-0.5">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.stroke || p.fill }} />
          <span className="text-slate-500 flex-1">{p.name}</span>
          <span className="text-slate-900 font-medium tabular-nums">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function LegendRow({ items }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-1.5 text-xs text-slate-600">
          <span
            className={it.dashed ? 'w-3 border-t-2 border-dashed' : it.line ? 'w-3 h-0.5 rounded' : 'w-2.5 h-2.5 rounded-sm'}
            style={it.dashed ? { borderColor: it.color } : { background: it.color }}
          />
          {it.label}
        </span>
      ))}
    </div>
  );
}
