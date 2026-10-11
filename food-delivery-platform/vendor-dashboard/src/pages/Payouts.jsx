import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import DataTable from '../components/DataTable.jsx';
import { useConfig } from '../context/ConfigContext.jsx';
import { vendorApi } from '../services/vendor';
import { formatDate, money } from '../utils/format';
import useAsync from '../utils/useAsync';
import Icon from '../components/Icon.jsx';

/** Commission % shown here is the effective one (restaurant override or global businessRules). */
export default function Payouts() {
  const { t, currency, language } = useConfig();
  const [page, setPage] = useState(1);
  const { data, loading } = useAsync(() => vendorApi.payouts(page), [page]);
  const m = (v) => money(v, currency, language);
  return (
    <div className="space-y-6">
      <PageHeader title={t('vendor.earnings')} subtitle={t('vendor.payoutsSubtitle')} />
      {data && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={<Icon name="bank" />} label={t('vendor.pendingPayout')} value={m(data.walletBalance)} tone="success" />
          <StatCard icon={<Icon name="percent" />} label={t('vendor.commission')} value={`${data.commissionPercent}%`} tone="accent" />
          <StatCard icon={<Icon name="download" />} label={t('vendor.minPayoutLabel')} value={m(data.minPayoutAmount)} />
        </div>
      )}
      <div>
        <h3 className="mb-3 font-bold">{t('vendor.payoutHistory')}</h3>
        <DataTable
          loading={loading}
          rows={data?.items}
          pagination={data?.pagination}
          onPage={setPage}
          columns={[
            { key: 'date', label: t('common.date'), render: (r) => formatDate(r.createdAt, language) },
            { key: 'type', label: t('common.type'), render: (r) => t(`txn.${r.type}`) },
            { key: 'order', label: t('order.numberLabel'), render: (r) => r.order?.orderNumber || '—' },
            { key: 'amount', label: t('wallet.amount'), render: (r) => m(r.amount) },
            { key: 'ref', label: t('admin.reference'), render: (r) => r.providerRef || r.description },
          ]}
        />
      </div>
      <div>
        <h3 className="mb-3 font-bold">{t('vendor.settlements')}</h3>
        <DataTable
          rows={data?.recentSettlements}
          columns={[
            { key: 'orderNumber', label: t('order.numberLabel') },
            { key: 'date', label: t('common.date'), render: (r) => formatDate(r.deliveredAt, language) },
            { key: 'gross', label: t('vendor.gross'), render: (r) => m(r.pricing?.subtotal) },
            { key: 'discount', label: t('cart.discount'), render: (r) => m(r.pricing?.discount) },
            { key: 'commission', label: t('vendor.commission'), render: (r) => `${m(r.commission?.amount)} (${r.commission?.percent}%)` },
            { key: 'net', label: t('vendor.net'), render: (r) => <b>{m(r.vendorEarning)}</b> },
          ]}
        />
      </div>
    </div>
  );
}
