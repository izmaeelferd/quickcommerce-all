import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import Modal from '../components/Modal.jsx';
import { TextField, SelectField } from '../components/Field.jsx';
import { useConfig } from '../context/ConfigContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { get, put, patch, errorKey } from '../services/api';
import useAsync from '../utils/useAsync';

/** Global commission (businessRules.commissionPercent) + per-restaurant overrides. */
export default function Commission() {
  const { t, reload: reloadConfig } = useConfig();
  const toast = useToast();
  const { data, reload } = useAsync(() => get('/admin/commission'), []);
  const restaurants = useAsync(() => get('/admin/restaurants', { status: 'approved', limit: 100 }), []);
  const [global, setGlobal] = useState('');
  const [override, setOverride] = useState(null);

  useEffect(() => {
    if (data) setGlobal(data.globalPercent);
  }, [data]);

  const run = async (fn) => {
    try {
      await fn();
      toast('config.updated');
      reload();
      reloadConfig();
    } catch (e) {
      toast(errorKey(e), 'error');
    }
  };

  return (
    <div>
      <PageHeader title={t('admin.nav.commission')} subtitle={t('admin.commissionSubtitle')} actions={<button type="button" className="btn-primary" onClick={() => setOverride({ id: '', value: '' })}>+ {t('admin.addOverride')}</button>} />
      <div className="card mb-6 flex flex-wrap items-end gap-4">
        <div className="w-48"><TextField label={t('rules.commissionPercent')} type="number" value={global} onChange={setGlobal} /></div>
        <button type="button" className="btn-primary" onClick={() => run(() => put('/admin/commission', { commissionPercent: global }))}>{t('common.save')}</button>
        <p className="text-sm text-content/60">{t('admin.commissionHint')}</p>
      </div>
      <DataTable
        rows={data?.overrides}
        columns={[
          { key: 'name', label: t('admin.restaurant') },
          { key: 'pct', label: t('admin.commission'), render: (r) => `${r.commissionPercent}%` },
          {
            key: 'x',
            label: '',
            render: (r) => (
              <div className="flex gap-2">
                <button type="button" className="btn-outline px-3 py-1 text-xs" onClick={() => setOverride({ id: r._id, value: r.commissionPercent })}>{t('common.edit')}</button>
                <button type="button" className="btn-ghost px-3 py-1 text-xs text-danger" onClick={() => run(() => patch(`/admin/restaurants/${r._id}/commission`, { commissionPercent: null }))}>{t('admin.useGlobal')}</button>
              </div>
            ),
          },
        ]}
        empty="admin.noOverrides"
      />
      <Modal open={!!override} onClose={() => setOverride(null)} title={t('admin.commissionOverride')} size="sm" footer={<button type="button" className="btn-primary" disabled={!override?.id} onClick={() => run(async () => { await patch(`/admin/restaurants/${override.id}/commission`, { commissionPercent: override.value }); setOverride(null); })}>{t('common.save')}</button>}>
        {override && (
          <div className="space-y-4">
            <SelectField label={t('admin.restaurant')} value={override.id} onChange={(v) => setOverride({ ...override, id: v })} options={[{ value: '', label: '—' }, ...(restaurants.data?.items || []).map((r) => ({ value: r._id, label: r.name }))]} />
            <TextField label={t('admin.commission')} type="number" value={override.value} onChange={(v) => setOverride({ ...override, value: v })} />
          </div>
        )}
      </Modal>
    </div>
  );
}
