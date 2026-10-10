import { useCallback, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Modal from '../components/Modal.jsx';
import { TextArea } from '../components/Field.jsx';
import { useConfig } from '../context/ConfigContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { vendorApi } from '../services/vendor';
import { errorKey } from '../services/api';
import { formatDate, money } from '../utils/format';
import useAsync from '../utils/useAsync';
import useVendorEvents from '../utils/useVendorEvents';

const TABS = { 'vendor.tab.new': 'placed', 'vendor.tab.inProgress': 'accepted,preparing,ready', 'vendor.tab.outForDelivery': 'picked', 'vendor.tab.past': 'delivered,cancelled,rejected' };
const NEXT = { placed: 'accepted', accepted: 'preparing', preparing: 'ready' };
const NEXT_LABEL = { placed: 'vendor.accept', accepted: 'vendor.startPreparing', preparing: 'vendor.markReady' };

/** Kanban-style live order board. */
export default function Orders() {
  const { t, currency, language } = useConfig();
  const toast = useToast();
  const [tab, setTab] = useState('vendor.tab.new');
  const [page, setPage] = useState(1);
  const { data, reload } = useAsync(() => vendorApi.orders({ status: TABS[tab], page }), [tab, page]);
  const [reject, setReject] = useState(null);
  const [reason, setReason] = useState('');
  useVendorEvents(useCallback(() => reload(), [reload]));
  const m = (v) => money(v, currency, language);

  const update = async (o, status, why) => {
    try {
      await vendorApi.updateOrder(o._id, status, why);
      toast('order.statusUpdated');
      reload();
    } catch (e) {
      toast(errorKey(e), 'error');
    }
  };

  return (
    <div>
      <PageHeader title={t('vendor.nav.orders')} subtitle={t('vendor.ordersSubtitle')} />
      <div className="mb-4 flex flex-wrap gap-2">
        {Object.keys(TABS).map((k) => <button key={k} type="button" className={tab === k ? 'btn-primary' : 'btn-outline'} onClick={() => { setTab(k); setPage(1); }}>{t(k)}</button>)}
      </div>
      {data?.items?.length === 0 && <div className="card text-center text-content/60">{t('vendor.noOrders')}</div>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data?.items?.map((o) => (
          <div key={o._id} className="card flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="font-bold">{o.orderNumber}</div>
              <StatusBadge status={o.status} />
            </div>
            <div className="text-xs text-content/60">{formatDate(o.createdAt, language)}{o.scheduledFor ? ` · ${t('vendor.scheduledFor', { time: formatDate(o.scheduledFor, language) })}` : ''}</div>
            <div className="space-y-1 text-sm">
              {o.items.map((i, idx) => (
                <div key={idx}>
                  <div className="flex justify-between"><span>{i.quantity} × {i.name}</span><span>{m(i.lineTotal)}</span></div>
                  {i.addOns?.length > 0 && <div className="text-xs text-content/60">{i.addOns.map((a) => a.name).join(', ')}</div>}
                  {i.instructions && <div className="text-xs italic text-content/60">“{i.instructions}”</div>}
                </div>
              ))}
            </div>
            {o.instructions && <div className="rounded-btn bg-warning/10 p-2 text-xs">{o.instructions}</div>}
            <div className="flex justify-between border-t border-content/10 pt-2 text-sm">
              <span>{t('payment.method.' + o.payment?.method)}</span>
              <span className="font-bold">{t('vendor.youEarn', { amount: m(o.vendorEarning) })}</span>
            </div>
            {o.deliveryPartner && <div className="text-xs text-content/70">🛵 {o.deliveryPartner.name} · {o.deliveryPartner.phone}</div>}
            <div className="mt-auto flex gap-2">
              {o.status === 'placed' && <button type="button" className="btn-danger flex-1" onClick={() => { setReject(o); setReason(''); }}>{t('vendor.reject')}</button>}
              {NEXT[o.status] && <button type="button" className="btn-primary flex-1" onClick={() => update(o, NEXT[o.status])}>{t(NEXT_LABEL[o.status])}</button>}
            </div>
          </div>
        ))}
      </div>
      {data?.pagination?.pages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button type="button" className="btn-outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>{t('common.prev')}</button>
          <button type="button" className="btn-outline" disabled={page >= data.pagination.pages} onClick={() => setPage(page + 1)}>{t('common.next')}</button>
        </div>
      )}
      <Modal open={!!reject} onClose={() => setReject(null)} title={t('vendor.rejectTitle')} size="sm" footer={<button type="button" className="btn-danger" onClick={() => { update(reject, 'rejected', reason); setReject(null); }}>{t('vendor.reject')}</button>}>
        <TextArea label={t('order.cancelReason')} value={reason} onChange={setReason} />
      </Modal>
    </div>
  );
}
