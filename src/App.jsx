import { createElement, useEffect, useMemo, useState } from 'react';
import { Building2, LayoutList, Scale, Waves } from 'lucide-react';
import InputsPanel from './components/InputsPanel';
import ProfileBar from './components/ProfileBar';
import RentalTab from './components/RentalTab';
import CompareTab from './components/CompareTab';
import DammingTab from './components/DammingTab';
import HousesTab from './components/HousesTab';
import { makeFormatters } from './lib/format';
import { STRINGS, tr } from './lib/i18n';
import { actions, activeProfile, analyze, inputsFor, loadState, mergeImport, saveState } from './lib/store';

export default function App() {
  const [state, setState] = useState(loadState);
  const { market, tab } = state;
  const profile = activeProfile(state);
  const profiles = state.profiles[market];
  const shared = state.shared[market];
  const t = STRINGS[market];
  const fmt = useMemo(() => makeFormatters(market), [market]);
  const p = useMemo(() => inputsFor(market, profile, shared), [market, profile, shared]);
  const { safe, rental, compare, damming } = useMemo(() => analyze(p), [p]);

  useEffect(() => saveState(state), [state]);
  useEffect(() => {
    document.documentElement.lang = market === 'VN' ? 'vi' : 'en';
  }, [market]);

  const go = (patch) => setState((s) => ({ ...s, ...patch }));

  const exportProfiles = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `rent-vs-invest-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importProfiles = async (file) => {
    try {
      const data = JSON.parse(await file.text());
      setState((s) => mergeImport(s, data));
    } catch {
      window.alert(t.pImportError);
    }
  };

  const tabs = [
    { id: 'rental', label: t.tabRental, icon: Building2 },
    { id: 'compare', label: t.tabCompare, icon: Scale },
    { id: 'damming', label: t.tabDamming, icon: Waves, disabled: market !== 'CA' },
    { id: 'houses', label: tr(t.tabHouses, { n: profiles.length }), icon: LayoutList },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-[1440px] mx-auto px-4 md:px-6 pt-5 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900">{t.appTitle}</h1>
              <p className="text-sm text-slate-500">{t.appSub}</p>
            </div>
            <div className="inline-flex rounded-xl bg-slate-100 p-1 self-start" aria-label="Market">
              {['CA', 'VN'].map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={market === m}
                  onClick={() => go({ market: m, tab: m !== 'CA' && tab === 'damming' ? 'rental' : tab })}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${market === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {m === 'CA' ? '🇨🇦 ' : '🇻🇳 '}
                  {STRINGS[m][m === 'CA' ? 'marketCA' : 'marketVN']}
                </button>
              ))}
            </div>
          </div>

          <ProfileBar
            profiles={profiles}
            activeId={profile.id}
            t={t}
            onSelect={(id) => setState(actions.select(id))}
            onAdd={() => setState(actions.add(tr(t.pDefaultName, { n: profiles.length + 1 })))}
            onDuplicate={() => setState(actions.add(tr(t.pCopyName, { name: profile.name }), profile.inputs))}
            onRename={(id, name) => setState(actions.rename(id, name))}
            onRemove={(id) => setState(actions.remove(id))}
            onExport={exportProfiles}
            onImport={importProfiles}
          />

          <nav className="flex gap-1 -mb-px overflow-x-auto" role="tablist">
            {tabs.map(({ id, label, icon, disabled }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                disabled={disabled}
                onClick={() => go({ tab: id })}
                className={`inline-flex items-center gap-2 whitespace-nowrap px-3 py-2.5 text-sm font-medium border-b-2 transition ${
                  tab === id ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {createElement(icon, { className: 'w-4 h-4' })}
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className={`max-w-[1440px] mx-auto px-4 md:px-6 py-6 grid grid-cols-1 gap-6 ${tab === 'houses' ? '' : 'lg:grid-cols-[300px_1fr]'}`}>
        {tab !== 'houses' && (
          <aside>
            <InputsPanel
              p={p}
              set={(path, v) => setState(actions.set(path, v))}
              t={t}
              fmt={fmt}
              tab={tab}
              onReset={() => setState(actions.resetHouse())}
              initialCash={rental.initialCash}
            />
          </aside>
        )}
        <div className="min-w-0">
          {tab === 'rental' && <RentalTab p={safe} rental={rental} compare={compare} t={t} fmt={fmt} />}
          {tab === 'compare' && <CompareTab p={safe} rental={rental} compare={compare} t={t} fmt={fmt} />}
          {tab === 'damming' && <DammingTab p={safe} damming={damming} t={t} fmt={fmt} />}
          {tab === 'houses' && (
            <HousesTab
              market={market}
              profiles={profiles}
              shared={shared}
              activeId={profile.id}
              t={t}
              fmt={fmt}
              onOpen={(id) => setState((s) => ({ ...actions.select(id)(s), tab: 'rental' }))}
            />
          )}
          <p className="mt-8 text-center text-[11px] text-slate-400">{t.footer}</p>
        </div>
      </main>
    </div>
  );
}
