import { useEffect, useRef, useState } from 'react';
import { ExternalLink, FileSpreadsheet, Link2, Loader2, RefreshCw, Unlink, Upload, X } from 'lucide-react';
import { parseSheetUrl, sheetUrl } from '../lib/sheets';
import { tr } from '../lib/i18n';

export default function SheetsDialog({ open, onClose, t, sources, profilesBySheet, syncing, errors, onLink, onSync, onUnlink, onTemplate, onFile }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const submit = async (e) => {
    e.preventDefault();
    const id = parseSheetUrl(url);
    if (!id) return setError(t.shBadLink);
    setError('');
    const err = await onLink(id, url.trim());
    if (err) setError(err);
    else setUrl('');
  };

  const ids = Object.keys(sources);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => e.target === dialogRef.current && onClose()}
      className="w-[min(640px,calc(100vw-2rem))] rounded-2xl p-0 shadow-2xl backdrop:bg-slate-900/40 backdrop:backdrop-blur-[2px]"
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="grid place-items-center h-9 w-9 rounded-xl bg-emerald-50 text-emerald-700">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-900">{t.shTitle}</h2>
              <p className="text-xs text-slate-500">{t.shSub}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label={t.shClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <ol className="grid sm:grid-cols-3 gap-2 mb-5 text-xs">
          {[
            [t.shStep1, t.shStep1d, <button key="tpl" type="button" onClick={onTemplate} className="mt-1 font-medium text-blue-700 hover:text-blue-900">{t.shTemplate}</button>],
            [t.shStep2, t.shStep2d],
            [t.shStep3, t.shStep3d],
          ].map(([title, desc, extra], i) => (
            <li key={title} className="rounded-xl bg-slate-50 p-3">
              <span className="text-[10px] font-semibold text-blue-700">0{i + 1}</span>
              <p className="font-semibold text-slate-900">{title}</p>
              <p className="text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
              {extra}
            </li>
          ))}
        </ol>

        <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/…"
            aria-label={t.shLinkLabel}
            className="flex-1 min-w-0 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
          />
          <button
            type="submit"
            disabled={!url.trim() || syncing === 'new'}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {syncing === 'new' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
            {t.shLink}
          </button>
        </form>
        {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}

        {ids.length > 0 && (
          <div className="mt-5">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">{t.shLinked}</h3>
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
              {ids.map((id) => {
                const src = sources[id];
                const houses = profilesBySheet[id] || [];
                return (
                  <li key={id} className="p-3 flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <a href={sheetUrl(id)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-slate-900 hover:text-blue-700">
                        <span className="truncate max-w-[18rem]">{houses.length ? houses.join(', ') : id}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                      <p className="text-[11px] text-slate-500">
                        {tr(t.shHouses, { n: houses.length })} · {src.lastSync ? tr(t.shSynced, { v: new Date(src.lastSync).toLocaleString() }) : t.shNever}
                      </p>
                      {errors[id] && <p className="text-[11px] text-rose-600">{errors[id]}</p>}
                    </div>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => onSync(id)} disabled={syncing === id} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50">
                        <RefreshCw className={`w-3.5 h-3.5 ${syncing === id ? 'animate-spin' : ''}`} /> {t.shSync}
                      </button>
                      <button
                        type="button"
                        onClick={() => window.confirm(t.shUnlinkConfirm) && onUnlink(id)}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-rose-600"
                      >
                        <Unlink className="w-3.5 h-3.5" /> {t.shUnlink}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
          <p className="leading-relaxed">{t.shNote}</p>
          <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 shrink-0 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 hover:bg-slate-100">
            <Upload className="w-3.5 h-3.5" /> {t.shFile}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.ods,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              const err = await onFile(file);
              setError(err || '');
            }}
          />
        </div>
      </div>
    </dialog>
  );
}
