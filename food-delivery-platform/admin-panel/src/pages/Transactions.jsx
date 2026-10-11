import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useConfig } from '../context/ConfigContext.jsx';
import { get } from '../services/api';
import { formatDate, money } from '../utils/format';
import useAsync from '../utils/useAsync';

const TYPES = ['payment', 'refund', 'wallet_credit', 'wallet_debit', 'referral_bonus', 'vendor_payout', 'delivery_payout', 'commission', 'cancellation_fee'];

export default function Transactions() {
  const { t, currency, language } = useConfig();
  const [filters, setFilters] = useState({ type: '', from: '', to: '', page: 1 });
  const { data, loading } = useAsync(() => get('/admin/transactions', filters), [filters]);
  const m = (v) => money(v, currency, language);
  return (
    <div>
      <PageHeader title={t('admin.nav.transactions')} subtitle={t('admin.transactionsSubtitle')} />
      <div className="mb-4 flex flex-wrap gap-3">
        <select className="input w-auto" value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}>
          <option value="">{t('common.allTypes')}</option>
          {TYPES.map((x) => <option key={x} value={x}>{t(`txn.${x}`)}</option>)}
        </select>
        <input className="input w-auto" type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value, page: 1 })} />
        <input className="input w-auto" type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value, page: 1 })} />
      </div>
      {data?.summary?.length > 0 && (
        <div className="mb-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {data.summary.map((s) => (
            <div key={s._id} className="card p-4">
              <div className="text-xs text-content/60">{t(`txn.${s._id}`)}</div>
              <div className="text-lg font-bold">{m(s.amount)}</div>
              <div className="text-xs text-content/50">{t('admin.countN', { n: s.count })}</div>
            </div>
          ))}
        </div>
      )}
      <DataTable
        loading={loading}
        rows={data?.items}
        pagination={data?.pagination}
        onPage={(page) => setFilters({ ...filters, page })}
        columns={[
          { key: 'date', label: t('common.date'), render: (r) => formatDate(r.createdAt, language) },
          { key: 'type', label: t('common.type'), render: (r) => t(`txn.${r.type}`) },
          { key: 'party', label: t('admin.party'), render: (r) => r.restaurant?.name || r.user?.name || '—' },
          { key: 'order', label: t('order.numberLabel'), render: (r) => r.order?.orderNumber || '—' },
          { key: 'amount', label: t('wallet.amount'), render: (r) => <span className={r.direction === 'credit' ? 'text-success' : 'text-danger'}>{r.direction === 'credit' ? '+' : '−'}{m(r.amount)}</span> },
          { key: 'provider', label: t('admin.provider'), render: (r) => <span className="text-xs">{r.provider || r.method || '—'} {r.providerRef}</span> },
          { key: 'status', label: t('common.status'), render: (r) => <StatusBadge status={r.status} /> },
        ]}
      />
    </div>
  );
}
