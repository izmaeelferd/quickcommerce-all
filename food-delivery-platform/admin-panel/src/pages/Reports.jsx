import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import { useConfig } from '../context/ConfigContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { get, downloadCsv, errorKey } from '../services/api';
import useAsync from '../utils/useAsync';
import Icon from '../components/Icon.jsx';

const TYPES = ['orders', 'restaurants', 'delivery', 'reviews'];

export default function Reports() {
  const { t } = useConfig();
  const toast = useToast();
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const [params, setParams] = useState({ type: 'orders', from: monthAgo, to: today });
  const { data, loading } = useAsync(() => get('/admin/reports', { ...params, to: `${params.to}T23:59:59` }), [params]);
  const rows = data?.rows || [];
  const columns = rows.length ? Object.keys(rows[0]).map((k) => ({ key: k, label: t(`report.${k}`) })) : [];

  return (
    <div>
      <PageHeader
        title={t('admin.nav.reports')}
        subtitle={t('admin.reportsSubtitle')}
        actions={
          <button type="button" className="btn-primary" onClick={() => downloadCsv('/admin/reports', { ...params, to: `${params.to}T23:59:59` }, `${params.type}-${params.from}-${params.to}.csv`).catch((e) => toast(errorKey(e), 'error'))}>
            <Icon name="download" className="h-4 w-4" />{t('admin.exportCsv')}
          </button>
        }
      />
      <div className="mb-4 flex flex-wrap gap-3">
        {TYPES.map((x) => <button key={x} type="button" className={params.type === x ? 'btn-primary' : 'btn-outline'} onClick={() => setParams({ ...params, type: x })}>{t(`report.type.${x}`)}</button>)}
        <input className="input w-auto" type="date" value={params.from} onChange={(e) => setParams({ ...params, from: e.target.value })} />
        <input className="input w-auto" type="date" value={params.to} onChange={(e) => setParams({ ...params, to: e.target.value })} />
      </div>
      <DataTable loading={loading} rows={rows.map((r, i) => ({ ...r, _rk: i }))} rowKey="_rk" columns={columns} />
    </div>
  );
}
