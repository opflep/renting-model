import { useState } from 'react';
import { Check, Copy, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Toggle } from './ui';
import { cleanCcaSteps, cleanSteps } from '../lib/taxcases';
import { tr } from '../lib/i18n';

const btn = 'inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40';

// Pick / rename / duplicate / add / delete the saved tax cases.
export function TaxCaseBar({ cases, activeId, t, onSelect, onAdd, onDuplicate, onRename, onRemove }) {
  const active = cases.find((c) => c.id === activeId) || cases[0];
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const commit = () => {
    if (name.trim()) onRename(active.id, name.trim());
    setEditing(false);
  };
  return (
    <div className="col-span-2 rounded-lg bg-slate-50 p-2 -mt-1">
      <div className="flex items-center gap-1.5">
        {editing ? (
          <form
            className="flex flex-1 items-center gap-1"
            onSubmit={(e) => {
              e.preventDefault();
              commit();
            }}
          >
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => e.key === 'Escape' && setEditing(false)}
              maxLength={60}
              aria-label={t.tcRename}
              className="min-w-0 flex-1 rounded-md border border-blue-500 ring-2 ring-blue-500/20 px-2 py-1 text-xs outline-none"
            />
            <button type="submit" className={btn} aria-label={t.tcRename}>
              <Check className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          <select
            value={active.id}
            onChange={(e) => onSelect(e.target.value)}
            aria-label={t.tcLabel}
            className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white pl-2 pr-7 py-1 text-xs font-medium text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
          >
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-0.5">
        <button type="button" className={btn} onClick={() => (setName(active.name), setEditing(true))} disabled={editing}>
          <Pencil className="w-3 h-3" /> {t.tcRename}
        </button>
        <button type="button" className={btn} onClick={() => onDuplicate(active)}>
          <Copy className="w-3 h-3" /> {t.tcDuplicate}
        </button>
        <button type="button" className={btn} onClick={onAdd}>
          <Plus className="w-3 h-3" /> {t.tcNew}
        </button>
        <button
          type="button"
          className={`${btn} hover:!text-rose-600`}
          disabled={cases.length <= 1}
          onClick={() => window.confirm(tr(t.tcDeleteConfirm, { name: active.name })) && onRemove(active.id)}
        >
          <Trash2 className="w-3 h-3" /> {t.tcDelete}
        </button>
        <span className="ml-auto text-[10px] text-slate-400">{tr(t.tcCount, { n: cases.length })}</span>
      </div>
    </div>
  );
}

const cell = 'w-full rounded-md border border-slate-200 bg-white px-1.5 py-1 text-right text-xs tabular-nums focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none';

function YearInput({ value, onChange, aria }) {
  return (
    <input
      type="number"
      min={1}
      max={60}
      step={1}
      aria-label={aria}
      defaultValue={value}
      key={value}
      onBlur={(e) => onChange(Math.round(parseFloat(e.target.value)) || 1)}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      className={cell}
    />
  );
}

function PctInput({ value, onChange, aria }) {
  return (
    <input
      type="number"
      step={0.5}
      aria-label={aria}
      defaultValue={value}
      key={value}
      onBlur={(e) => onChange(parseFloat(e.target.value) || 0)}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      className={cell}
    />
  );
}

// Rate changes by year: from year N, marginal X%, dividend Y%.
export function RateStepsEditor({ steps, base, onChange, t }) {
  const update = (i, patch) => onChange(cleanSteps(steps.map((s, k) => (k === i ? { ...s, ...patch } : s))));
  const remove = (i) => onChange(steps.filter((_, k) => k !== i));
  const add = () => {
    const from = (steps.at(-1)?.from || 1) + 5;
    onChange(cleanSteps([...steps, { from, marginal: Math.max(0, base.marginal - 15), dividend: Math.max(0, base.dividend - 15) }]));
  };
  return (
    <div className="col-span-2">
      <p className="text-[11px] font-medium text-slate-500 mb-1" title={t.tcStepsTip}>
        {t.tcSteps}
      </p>
      <div className="grid grid-cols-[4rem_1fr_1fr_1.5rem] gap-1 items-center text-[10px] text-slate-400">
        <span>{t.tcFrom}</span>
        <span className="text-right">{t.marginal}</span>
        <span className="text-right">{t.dividend}</span>
        <span />
        <span className="text-slate-500">1</span>
        <span className="text-right text-slate-500 tabular-nums">{base.marginal}%</span>
        <span className="text-right text-slate-500 tabular-nums">{base.dividend}%</span>
        <span />
        {steps.map((s, i) => (
          <StepRow key={`${s.from}-${i}`}>
            <YearInput value={s.from} onChange={(v) => update(i, { from: Math.max(2, v) })} aria={t.tcFrom} />
            <PctInput value={s.marginal} onChange={(v) => update(i, { marginal: v })} aria={t.marginal} />
            <PctInput value={s.dividend} onChange={(v) => update(i, { dividend: v })} aria={t.dividend} />
            <button type="button" onClick={() => remove(i)} aria-label={t.tcDelete} className="text-slate-300 hover:text-rose-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </StepRow>
        ))}
      </div>
      <button type="button" onClick={add} className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 hover:text-blue-900">
        <Plus className="w-3 h-3" /> {t.tcAddStep}
      </button>
    </div>
  );
}

// CCA by year: from year N, claim yes/no.
export function CcaStepsEditor({ steps, onChange, t }) {
  const update = (i, patch) => onChange(cleanCcaSteps(steps.map((s, k) => (k === i ? { ...s, ...patch } : s))));
  const remove = (i) => onChange(steps.filter((_, k) => k !== i));
  const add = () => {
    const last = steps.at(-1);
    onChange(cleanCcaSteps([...steps, { from: last ? last.from + 5 : 1, claim: last ? !last.claim : false }]));
  };
  return (
    <div className="col-span-2">
      <p className="text-[11px] font-medium text-slate-500 mb-1" title={t.tcCcaTip}>
        {t.tcCca}
      </p>
      <div className="grid grid-cols-[4rem_1fr_1.5rem] gap-1 items-center text-[10px] text-slate-400">
        <span>{t.tcFrom}</span>
        <span>{t.tcClaim}</span>
        <span />
        {!steps.length && (
          <>
            <span className="text-slate-500">1</span>
            <span className="text-slate-500">{t.tcClaim} ✓</span>
            <span />
          </>
        )}
        {steps.map((s, i) => (
          <StepRow key={`${s.from}-${i}`}>
            <YearInput value={s.from} onChange={(v) => update(i, { from: v })} aria={t.tcFrom} />
            <Toggle label={s.claim ? t.tcClaim : '—'} checked={s.claim} onChange={(v) => update(i, { claim: v })} />
            <button type="button" onClick={() => remove(i)} aria-label={t.tcDelete} className="text-slate-300 hover:text-rose-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </StepRow>
        ))}
      </div>
      <button type="button" onClick={add} className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 hover:text-blue-900">
        <Plus className="w-3 h-3" /> {t.tcAddCca}
      </button>
    </div>
  );
}

const StepRow = ({ children }) => <>{children}</>;
