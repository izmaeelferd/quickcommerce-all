import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Modal from '../components/Modal.jsx';
import { TextArea } from '../components/Field.jsx';
import { useConfig } from '../context/ConfigContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { get, patch, errorKey } from '../services/api';
import { formatDate } from '../utils/format';
import useAsync from '../utils/useAsync';

/** Vendor approval queue: approve / reject / suspend restaurants. */
export default function Vendors() {
  const { t, language } = useConfig();
  const toast = useToast();
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const { data, loading, reload } = useAsync(() => get('/admin/restaurants', { status, page }), [status, page]);
  const [action, setAction] = useState(null);
  const [reason, setReason] = useState('');

  const apply = async (r, next, why = '') => {
    try {
      await patch(`/admin/restaurants/${r._id}/status`, { status: next, reason: why });
      toast('restaurant.statusUpdated');
      setAction(null);
      setReason('');
      reload();
    } catch (e) {
      toast(errorKey(e), 'error');
    }
  };

  return (
    <div>
      <PageHeader title={t('admin.nav.vendors')} subtitle={t('admin.vendorsSubtitle')} />
      <div className="mb-4 flex gap-2">
        {['pending', 'approved', 'suspended', 'rejected'].map((s) => (
          <button key={s} type="button" className={status === s ? 'btn-primary' : 'btn-outline'} onClick={() => { setStatus(s); setPage(1); }}>{t(`status.${s}`)}</button>
        ))}
      </div>
      <DataTable
        loading={loading}
        rows={data?.items}
        pagination={data?.pagination}
        onPage={setPage}
        columns={[
          { key: 'name', label: t('admin.restaurant'), render: (r) => <div className="flex items-center gap-3">{r.logo && <img src={r.logo} alt="" className="h-9 w-9 rounded-btn object-cover" />}<div><div className="font-semibold">{r.name}</div><div className="text-xs text-content/60">{r.cuisines?.join(', ')}</div></div></div> },
          { key: 'owner', label: t('admin.owner'), render: (r) => <div className="text-xs">{r.owner?.name}<br />{r.owner?.email || r.owner?.phone}</div> },
          { key: 'address', label: t('address.title'), render: (r) => <span className="text-xs">{r.address?.fullAddress}</span> },
          { key: 'docs', label: t('admin.documents'), render: (r) => <span className="text-xs">{r.licenseNumber || '—'} / {r.gstNumber || '—'}</span> },
          { key: 'created', label: t('common.date'), render: (r) => formatDate(r.createdAt, language) },
          { key: 'status', label: t('common.status'), render: (r) => <StatusBadge status={r.status} /> },
          {
            key: 'actions',
            label: '',
            render: (r) => (
              <div className="flex gap-2">
                {r.status !== 'approved' && <button type="button" className="btn-primary px-3 py-1 text-xs" onClick={() => apply(r, 'approved')}>{t('admin.approve')}</button>}
                {r.status === 'pending' && <button type="button" className="btn-danger px-3 py-1 text-xs" onClick={() => setAction({ r, next: 'rejected' })}>{t('admin.reject')}</button>}
                {r.status === 'approved' && <button type="button" className="btn-danger px-3 py-1 text-xs" onClick={() => setAction({ r, next: 'suspended' })}>{t('admin.suspend')}</button>}
              </div>
            ),
          },
        ]}
      />
      <Modal open={!!action} onClose={() => setAction(null)} title={action ? t(`admin.confirm_${action.next}`, { name: action.r.name }) : ''} size="sm" footer={<button type="button" className="btn-danger" onClick={() => apply(action.r, action.next, reason)}>{t('common.confirm')}</button>}>
        <TextArea label={t('admin.reason')} value={reason} onChange={setReason} />
      </Modal>
    </div>
  );
}
