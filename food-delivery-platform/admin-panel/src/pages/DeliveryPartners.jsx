import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Modal from '../components/Modal.jsx';
import { TextField } from '../components/Field.jsx';
import { useConfig } from '../context/ConfigContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { get, patch, post, errorKey } from '../services/api';
import { money } from '../utils/format';
import useAsync from '../utils/useAsync';
import { Dot, Rating } from '../components/Icon.jsx';

export default function DeliveryPartners() {
  const { t, currency, language } = useConfig();
  const toast = useToast();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading, reload } = useAsync(() => get('/admin/delivery-partners', { status, page }), [status, page]);
  const [payout, setPayout] = useState(null);

  const setPartnerStatus = async (p, s) => {
    try {
      await patch(`/admin/delivery-partners/${p._id}/status`, { status: s });
      toast('delivery.statusUpdated');
      reload();
    } catch (e) {
      toast(errorKey(e), 'error');
    }
  };

  return (
    <div>
      <PageHeader title={t('admin.nav.delivery')} subtitle={t('admin.deliverySubtitle')} />
      <div className="mb-4 flex flex-wrap gap-2">
        {['', 'pending', 'approved', 'suspended', 'rejected'].map((s) => <button key={s} type="button" className={status === s ? 'btn-primary' : 'btn-outline'} onClick={() => { setStatus(s); setPage(1); }}>{s ? t(`status.${s}`) : t('common.all')}</button>)}
      </div>
      <DataTable
        loading={loading}
        rows={data?.items}
        pagination={data?.pagination}
        onPage={setPage}
        columns={[
          { key: 'name', label: t('common.name'), render: (p) => <div><div className="font-semibold">{p.user?.name}</div><div className="text-xs text-content/60">{p.user?.phone || p.user?.email}</div></div> },
          { key: 'vehicle', label: t('delivery.vehicle'), render: (p) => `${t(`vehicle.${p.vehicleType}`)} · ${p.vehicleNumber || '—'}` },
          { key: 'license', label: t('delivery.licenseNumber'), render: (p) => p.licenseNumber || '—' },
          { key: 'online', label: t('admin.online'), render: (p) => <Dot on={p.isOnline} label={p.isOnline ? t('admin.online') : t('common.offline')} /> },
          { key: 'active', label: t('admin.activeOrder'), render: (p) => p.activeOrder?.orderNumber || '—' },
          { key: 'stats', label: t('admin.deliveries'), render: (p) => <span className="inline-flex items-center gap-2">{p.totalDeliveries}<Rating value={p.rating} /></span> },
          { key: 'wallet', label: t('admin.pendingPayout'), render: (p) => money(p.walletBalance, currency, language) },
          { key: 'status', label: t('common.status'), render: (p) => <StatusBadge status={p.status} /> },
          {
            key: 'actions',
            label: '',
            render: (p) => (
              <div className="flex gap-2">
                {p.status !== 'approved' && <button type="button" className="btn-primary px-3 py-1 text-xs" onClick={() => setPartnerStatus(p, 'approved')}>{t('admin.approve')}</button>}
                {p.status === 'approved' && <button type="button" className="btn-danger px-3 py-1 text-xs" onClick={() => setPartnerStatus(p, 'suspended')}>{t('admin.suspend')}</button>}
                {p.status === 'pending' && <button type="button" className="btn-outline px-3 py-1 text-xs" onClick={() => setPartnerStatus(p, 'rejected')}>{t('admin.reject')}</button>}
                {p.walletBalance > 0 && <button type="button" className="btn-outline px-3 py-1 text-xs" onClick={() => setPayout({ p, amount: p.walletBalance, reference: '' })}>{t('admin.payout')}</button>}
              </div>
            ),
          },
        ]}
      />
      <Modal open={!!payout} onClose={() => setPayout(null)} title={t('admin.recordPayout')} size="sm" footer={<button type="button" className="btn-primary" onClick={async () => { try { await post('/admin/payouts', { kind: 'delivery', id: payout.p.user._id, amount: payout.amount, reference: payout.reference }); setPayout(null); toast('payout.recorded'); reload(); } catch (e) { toast(errorKey(e), 'error'); } }}>{t('common.confirm')}</button>}>
        {payout && (
          <div className="space-y-3">
            <TextField label={t('wallet.amount')} type="number" value={payout.amount} onChange={(v) => setPayout({ ...payout, amount: v })} />
            <TextField label={t('admin.reference')} value={payout.reference} onChange={(v) => setPayout({ ...payout, reference: v })} />
          </div>
        )}
      </Modal>
    </div>
  );
}
