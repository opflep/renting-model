import { useRef, useState } from 'react';
import { Check, Copy, Download, Home, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { tr } from '../lib/i18n';

const btn = 'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:hover:bg-transparent';

export default function ProfileBar({ profiles, activeId, t, onSelect, onAdd, onDuplicate, onRename, onRemove, onExport, onImport }) {
  const active = profiles.find((x) => x.id === activeId);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const fileRef = useRef(null);

  const startEdit = () => {
    setName(active.name);
    setEditing(true);
  };
  const commit = () => {
    if (name.trim()) onRename(active.id, name.trim());
    setEditing(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <Home className="w-4 h-4 text-blue-600 shrink-0" />
        {editing ? (
          <form
            className="flex items-center gap-1"
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
              aria-label={t.pRename}
              className="w-52 rounded-lg border border-blue-500 ring-2 ring-blue-500/20 px-2 py-1 text-sm outline-none"
            />
            <button type="submit" className={btn} aria-label={t.pRename}>
              <Check className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <select
            value={activeId}
            onChange={(e) => onSelect(e.target.value)}
            aria-label={t.pSelect}
            className="max-w-[16rem] truncate rounded-lg border border-slate-200 bg-white pl-2.5 pr-8 py-1.5 text-sm font-medium text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
          >
            {profiles.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        )}
        <span className="text-xs text-slate-400 whitespace-nowrap">{tr(t.pCount, { n: profiles.length })}</span>
      </div>

      <div className="flex flex-wrap items-center gap-0.5">
        <button type="button" className={btn} onClick={startEdit} disabled={editing}>
          <Pencil className="w-3.5 h-3.5" /> {t.pRename}
        </button>
        <button type="button" className={btn} onClick={onDuplicate}>
          <Copy className="w-3.5 h-3.5" /> {t.pDuplicate}
        </button>
        <button type="button" className={btn} onClick={onAdd}>
          <Plus className="w-3.5 h-3.5" /> {t.pNew}
        </button>
        <button
          type="button"
          className={`${btn} hover:!text-rose-600`}
          disabled={profiles.length <= 1}
          onClick={() => window.confirm(tr(t.pDeleteConfirm, { name: active.name })) && onRemove(active.id)}
        >
          <Trash2 className="w-3.5 h-3.5" /> {t.pDelete}
        </button>
        <span className="mx-1 h-4 w-px bg-slate-200 hidden sm:block" />
        <button type="button" className={btn} onClick={onExport} title={t.pExportTip}>
          <Download className="w-3.5 h-3.5" /> {t.pExport}
        </button>
        <button type="button" className={btn} onClick={() => fileRef.current?.click()} title={t.pImportTip}>
          <Upload className="w-3.5 h-3.5" /> {t.pImport}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onImport(file);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
}
