import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Modal from '../components/Modal.jsx';
import { SelectField, TextField } from '../components/Field.jsx';
import { useConfig } from '../context/ConfigContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { get, patch, post, errorKey, SOCKET_URL, tokens } from '../services/api';
import { money, formatDate } from '../utils/format';
import useAsync from '../utils/useAsync';

const STATUSES = ['', 'placed', 'accepted', 'preparing', 'ready', 'picked', 'delivered', 'cancelled', 'rejected'];
const NEXT = { placed: ['accepted', 'rejected', 'cancelled'], accepted: ['preparing', 'cancelled'], preparing: ['ready', 'cancelled'], ready: ['picked', 'cancelled'], picked: ['delivered', 'cancelled'] };

export default function Orders() {
  const { t, currency, language } = useConfig();
  const toast = useToast();
  const [filters, setFilters] = useState({ status: '', q: '', page: 1 });
  const { data, loading, reload } = useAsync(() => get('/admin/orders', filters), [filters]);
  const [selected, setSelected] = useState(null);
  const partners = useAsync(() => (selected ? get('/admin/delivery-partners', { status: 'approved', online: 'true', limit: 100 }) : Promise.resolve(null)), [selected?._id]);
  const [assignTo, setAssignTo] = useState('');
  const [refund, setRefund] = useState('');
  const m = (v) => money(v, currency, language);

  useEffect(() => {
    const s = io(SOCKET_URL, { transports: ['websocket'], auth: { token: tokens.access } });
    s.on('order:new', reload);
    s.on('order:status-update', reload);
    return () => s.disconnect();
  }, [reload]);

  const act = async (fn, okKey) => {
    try {
      const res = await fn();
      toast(okKey);
      reload();
      if (res && res._id) setSelected(res);
    } catch (e) {
      toast(errorKey(e), 'error');
    }
  };

  return (
    <div>
      <PageHeader title={t('admin.nav.orders')} subtitle={t('admin.ordersSubtitle')} />
      <div className="mb-4 flex flex-wrap gap-3">
        <input className="input max-w-xs" placeholder={t('admin.searchOrderNumber')} value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value, page: 1 })} />
        <select className="input w-auto" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}>
          {STATUSES.map((s) => <option key={s} value={s}>{s ? t(`status.${s}`) : t('common.allStatuses')}</option>)}
        </select>
      </div>
      <DataTable
        loading={loading}
        rows={data?.items}
        pagination={data?.pagination}
        onPage={(page) => setFilters({ ...filters, page })}
        onRowClick={(r) => { setSelected(r); setAssignTo(''); setRefund(''); }}
        columns={[
          { key: 'orderNumber', label: t('order.numberLabel') },
          { key: 'date', label: t('common.date'), render: (r) => formatDate(r.createdAt, language) },
          { key: 'restaurant', label: t('admin.restaurant'), render: (r) => r.restaurant?.name },
          { key: 'customer', label: t('admin.customer'), render: (r) => r.customer?.name },
          { key: 'rider', label: t('admin.rider'), render: (r) => r.deliveryPartner?.name || '—' },
          { key: 'total', label: t('cart.total'), render: (r) => m(r.pricing?.total) },
          { key: 'payment', label: t('payment.title'), render: (r) => <span className="text-xs">{t(`payment.method.${r.payment?.method}`)} · {t(`payment.status.${r.payment?.status}`)}</span> },
          { key: 'status', label: t('common.status'), render: (r) => <StatusBadge status={r.status} /> },
        ]}
      />
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? t('order.number', { number: selected.orderNumber }) : ''} size="lg">
        {selected && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><StatusBadge status={selected.status} /><span className="text-content/60">{formatDate(selected.createdAt, language)}</span></div>
              <div><b>{t('admin.restaurant')}:</b> {selected.restaurant?.name}</div>
              <div><b>{t('admin.customer')}:</b> {selected.customer?.name} · {selected.customer?.phone}</div>
              <div><b>{t('address.title')}:</b> {selected.deliveryAddress?.fullAddress}</div>
              <div><b>{t('admin.rider')}:</b> {selected.deliveryPartner?.name || '—'}</div>
              <div className="border-t border-content/10 pt-2">
                {selected.items.map((i, idx) => <div key={idx} className="flex justify-between"><span>{i.quantity} × {i.name}</span><span>{m(i.lineTotal)}</span></div>)}
              </div>
              <div className="space-y-1 border-t border-content/10 pt-2">
                {['subtotal', 'discount', 'deliveryFee', 'surgeFee', 'packagingFee', 'platformFee', 'tax', 'tip', 'walletUsed', 'total'].map((k) => (selected.pricing?.[k] ? <div key={k} className={`flex justify-between ${k === 'total' ? 'font-bold' : ''}`}><span>{t(`bill.${k}`)}</span><span>{m(selected.pricing[k])}</span></div> : null))}
                <div className="flex justify-between text-content/70"><span>{t('admin.commission')} ({selected.commission?.percent}%)</span><span>{m(selected.commission?.amount)}</span></div>
                <div className="flex justify-between text-content/70"><span>{t('admin.vendorEarning')}</span><span>{m(selected.vendorEarning)}</span></div>
                <div className="flex justify-between text-content/70"><span>{t('admin.deliveryEarning')}</span><span>{m(selected.deliveryEarning)}</span></div>
              </div>
            </div>
            <div className="space-y-5">
              {NEXT[selected.status] && (
                <div>
                  <div className="label">{t('admin.updateStatus')}</div>
                  <div className="flex flex-wrap gap-2">
                    {NEXT[selected.status].map((s) => (
                      <button key={s} type="button" className={['cancelled', 'rejected'].includes(s) ? 'btn-danger' : 'btn-outline'} onClick={() => act(() => patch(`/admin/orders/${selected._id}/status`, { status: s, reason: 'admin' }), 'order.statusUpdated')}>{t(`status.${s}`)}</button>
                    ))}
                  </div>
                </div>
              )}
              {!['delivered', 'cancelled', 'rejected'].includes(selected.status) && (
                <div>
                  <SelectField label={t('admin.assignRider')} value={assignTo} onChange={setAssignTo} options={[{ value: '', label: t('admin.selectOnlineRider') }, ...(partners.data?.items || []).map((p) => ({ value: p.user?._id, label: `${p.user?.name} · ${p.vehicleType}${p.activeOrder ? ` (${t('admin.busy')})` : ''}` }))]} />
                  <button type="button" className="btn-primary mt-2" disabled={!assignTo} onClick={() => act(() => patch(`/admin/orders/${selected._id}/assign`, { partnerUserId: assignTo }), 'order.assigned')}>{t('admin.assign')}</button>
                </div>
              )}
              {selected.payment?.status === 'paid' && (
                <div>
                  <TextField label={t('admin.refundAmount')} type="number" value={refund} onChange={setRefund} placeholder={String(selected.pricing?.payable)} />
                  <div className="mt-2 flex gap-2">
                    <button type="button" className="btn-outline" onClick={() => act(() => post(`/admin/orders/${selected._id}/refund`, { amount: refund || undefined }), 'payment.refunded')}>{t('admin.refundToSource')}</button>
                    <button type="button" className="btn-outline" onClick={() => act(() => post(`/admin/orders/${selected._id}/refund`, { amount: refund || undefined, toWallet: true }), 'payment.refunded')}>{t('admin.refundToWallet')}</button>
                  </div>
                </div>
              )}
              {selected.deliveryPhoto && <img src={selected.deliveryPhoto} alt="" className="rounded-card" />}
              <div>
                <div className="label">{t('admin.timeline')}</div>
                <ol className="space-y-1 text-xs">
                  {selected.statusHistory?.map((h, i) => <li key={i}>{formatDate(h.at, language)} — {t(`status.${h.status}`)} {h.note ? `(${h.note})` : ''}</li>)}
                </ol>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
