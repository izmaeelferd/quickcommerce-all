import { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import Modal, { ConfirmModal } from '../components/Modal.jsx';
import Toggle from '../components/Toggle.jsx';
import { TextField, SelectField } from '../components/Field.jsx';
import { useConfig } from '../context/ConfigContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { configApi } from '../services/config';
import { errorKey } from '../services/api';
import useAsync from '../utils/useAsync';

export default function LanguageManager() {
  const { t, config, reload: reloadConfig } = useConfig();
  const toast = useToast();
  const list = useAsync(() => configApi.listTranslations(), []);
  const [active, setActive] = useState(null);
  const [edits, setEdits] = useState({});
  const [filter, setFilter] = useState('');
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [creating, setCreating] = useState(null);
  const [newKey, setNewKey] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const languages = list.data || [];
  const current = languages.find((l) => l.code === active) || null;
  const reference = languages.find((l) => l.code === config?.defaultLanguage) || languages[0];
  const allKeys = useMemo(() => {
    const s = new Set();
    languages.forEach((l) => Object.keys(l.strings || {}).forEach((k) => s.add(k)));
    return [...s].sort();
  }, [languages]);

  const enabled = config?.languages || [];
  const toggleEnabled = async (code, on) => {
    const next = on ? [...new Set([...enabled, code])] : enabled.filter((c) => c !== code);
    try {
      await configApi.updateLanguages({ languages: next });
      reloadConfig();
      toast('config.updated');
    } catch (e) {
      toast(errorKey(e), 'error');
    }
  };
  const setDefault = async (code) => {
    try {
      await configApi.updateLanguages({ defaultLanguage: code, languages: [...new Set([...enabled, code])] });
      reloadConfig();
      toast('config.updated');
    } catch (e) {
      toast(errorKey(e), 'error');
    }
  };

  const saveStrings = async () => {
    try {
      await configApi.updateTranslation(current.code, { strings: edits });
      setEdits({});
      await list.reload();
      reloadConfig();
      toast('translation.saved');
    } catch (e) {
      toast(errorKey(e), 'error');
    }
  };

  const keys = allKeys.filter((k) => {
    if (filter && !k.toLowerCase().includes(filter.toLowerCase()) && !String(current?.strings?.[k] || '').toLowerCase().includes(filter.toLowerCase())) return false;
    if (onlyMissing && current?.strings?.[k]) return false;
    return true;
  });

  return (
    <div>
      <PageHeader title={t('admin.nav.languages')} subtitle={t('admin.languagesSubtitle')} actions={<><button type="button" className="btn-outline" onClick={() => setNewKey({ key: '', values: {} })}>+ {t('translation.addKey')}</button><button type="button" className="btn-primary" onClick={() => setCreating({ code: '', name: '', nativeName: '', isRTL: false, copyFrom: config?.defaultLanguage })}>+ {t('translation.addLanguage')}</button></>} />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {languages.map((l) => {
          const filled = Object.values(l.strings || {}).filter(Boolean).length;
          const pct = allKeys.length ? Math.round((filled / allKeys.length) * 100) : 0;
          return (
            <div key={l.code} className={`card cursor-pointer space-y-3 ${active === l.code ? 'ring-2 ring-primary' : ''}`} onClick={() => { setActive(l.code); setEdits({}); }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold">{l.nativeName || l.name}</div>
                  <div className="text-xs text-content/60">{l.code.toUpperCase()} {l.isRTL ? '· RTL' : ''}</div>
                </div>
                {config?.defaultLanguage === l.code && <span className="badge bg-primary/15 text-primary">{t('translation.default')}</span>}
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-content/10"><div className="h-full bg-success" style={{ width: `${pct}%` }} /></div>
              <div className="text-xs text-content/60">{t('translation.coverage', { pct, filled, total: allKeys.length })}</div>
              <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-between gap-2">
                <Toggle label={t('translation.enabled')} checked={enabled.includes(l.code)} onChange={(v) => toggleEnabled(l.code, v)} disabled={config?.defaultLanguage === l.code} />
                {config?.defaultLanguage !== l.code && <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={() => setDefault(l.code)}>{t('translation.makeDefault')}</button>}
              </div>
            </div>
          );
        })}
      </div>

      {current && (
        <div className="card">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h3 className="flex-1 font-bold">{t('translation.editing', { name: current.name })}</h3>
            <input className="input w-64" placeholder={t('common.search')} value={filter} onChange={(e) => setFilter(e.target.value)} />
            <Toggle label={t('translation.onlyMissing')} checked={onlyMissing} onChange={setOnlyMissing} />
            {config?.defaultLanguage !== current.code && <button type="button" className="btn-ghost text-danger" onClick={() => setDeleting(current)}>{t('common.delete')}</button>}
            <button type="button" className="btn-primary" disabled={!Object.keys(edits).length} onClick={saveStrings}>{t('translation.saveCount', { n: Object.keys(edits).length })}</button>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            <table className="min-w-full">
              <thead className="sticky top-0 bg-background">
                <tr><th className="table-th w-1/4">{t('translation.key')}</th><th className="table-th w-1/3">{t('translation.reference', { code: reference?.code?.toUpperCase() })}</th><th className="table-th">{current.name}</th></tr>
              </thead>
              <tbody className="divide-y divide-content/5">
                {keys.map((k) => {
                  const val = edits[k] !== undefined ? edits[k] : current.strings?.[k] || '';
                  return (
                    <tr key={k}>
                      <td className="table-td font-mono text-xs text-content/70">{k}</td>
                      <td className="table-td text-xs text-content/60">{reference?.strings?.[k]}</td>
                      <td className="table-td"><input dir={current.isRTL ? 'rtl' : 'ltr'} className={`input ${!val ? 'border-warning' : ''}`} value={val} onChange={(e) => setEdits({ ...edits, [k]: e.target.value })} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {!current && <div className="card text-center text-content/60">{t('translation.selectLanguage')}</div>}

      <Modal open={!!creating} onClose={() => setCreating(null)} title={t('translation.addLanguage')} footer={<button type="button" className="btn-primary" onClick={async () => { try { await configApi.createTranslation(creating); setCreating(null); list.reload(); toast('translation.created'); } catch (e) { toast(errorKey(e), 'error'); } }}>{t('common.create')}</button>}>
        {creating && (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label={t('translation.code')} hint={t('translation.codeHint')} value={creating.code} onChange={(v) => setCreating({ ...creating, code: v.toLowerCase() })} />
            <TextField label={t('translation.name')} value={creating.name} onChange={(v) => setCreating({ ...creating, name: v })} />
            <TextField label={t('translation.nativeName')} value={creating.nativeName} onChange={(v) => setCreating({ ...creating, nativeName: v })} />
            <SelectField label={t('translation.copyFrom')} value={creating.copyFrom} onChange={(v) => setCreating({ ...creating, copyFrom: v })} options={[{ value: '', label: t('translation.empty') }, ...languages.map((l) => ({ value: l.code, label: l.name }))]} />
            <Toggle label={t('translation.rtl')} checked={creating.isRTL} onChange={(v) => setCreating({ ...creating, isRTL: v })} />
          </div>
        )}
      </Modal>
      <Modal open={!!newKey} onClose={() => setNewKey(null)} title={t('translation.addKey')} footer={<button type="button" className="btn-primary" disabled={!newKey?.key} onClick={async () => { await configApi.upsertKey(newKey.key, newKey.values); setNewKey(null); list.reload(); reloadConfig(); toast('translation.saved'); }}>{t('common.save')}</button>}>
        {newKey && (
          <div className="space-y-3">
            <TextField label={t('translation.key')} hint={t('translation.keyHint')} value={newKey.key} onChange={(v) => setNewKey({ ...newKey, key: v.trim() })} />
            {languages.map((l) => <TextField key={l.code} label={l.name} value={newKey.values[l.code]} onChange={(v) => setNewKey({ ...newKey, values: { ...newKey.values, [l.code]: v } })} />)}
          </div>
        )}
      </Modal>
      <ConfirmModal open={!!deleting} onClose={() => setDeleting(null)} titleKey="translation.deleteConfirm" onConfirm={async () => { await configApi.deleteTranslation(deleting.code); setDeleting(null); setActive(null); list.reload(); }} />
    </div>
  );
}
