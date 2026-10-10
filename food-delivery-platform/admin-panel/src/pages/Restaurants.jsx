import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Modal from '../components/Modal.jsx';
import Toggle from '../components/Toggle.jsx';
import ImageUpload from '../components/ImageUpload.jsx';
import { TextField, TextArea, SelectField } from '../components/Field.jsx';
import { useConfig } from '../context/ConfigContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { get, put, post, del, errorKey } from '../services/api';
import useAsync from '../utils/useAsync';

const EMPTY = { name: '', description: '', cuisines: [], phone: '', email: '', address: { fullAddress: '', city: '' }, priceForTwo: 0, avgPrepTimeMinutes: 25, isPureVeg: false, isFeatured: false, offerText: '', logo: '', coverImage: '', commissionPercent: null, status: 'approved', owner: '' };

export default function Restaurants() {
  const { t, config, currency } = useConfig();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading, reload } = useAsync(() => get('/admin/restaurants', { q, page }), [q, page]);
  const vendors = useAsync(() => get('/admin/users', { role: 'vendor', limit: 100 }), []);
  const [form, setForm] = useState(null);

  const save = async () => {
    const body = { ...form, commissionPercent: form.commissionPercent === '' ? null : form.commissionPercent, lat: form.lat, lng: form.lng };
    try {
      if (form._id) await put(`/restaurants/${form._id}`, body);
      else await post('/restaurants', body);
      toast('restaurant.saved');
      setForm(null);
      reload();
    } catch (e) {
      toast(errorKey(e), 'error');
    }
  };

  const toggleCuisine = (name) => setForm({ ...form, cuisines: form.cuisines.includes(name) ? form.cuisines.filter((c) => c !== name) : [...form.cuisines, name] });

  return (
    <div>
      <PageHeader title={t('admin.nav.restaurants')} subtitle={t('admin.restaurantsSubtitle')} actions={<button type="button" className="btn-primary" onClick={() => setForm({ ...EMPTY })}>+ {t('admin.addRestaurant')}</button>} />
      <input className="input mb-4 max-w-xs" placeholder={t('common.search')} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
      <DataTable
        loading={loading}
        rows={data?.items}
        pagination={data?.pagination}
        onPage={setPage}
        onRowClick={(r) => setForm({ ...EMPTY, ...r, owner: r.owner?._id, lat: r.location?.coordinates?.[1], lng: r.location?.coordinates?.[0] })}
        columns={[
          { key: 'name', label: t('admin.restaurant'), render: (r) => <div className="font-semibold">{r.name}{r.isFeatured && ' ⭐'}</div> },
          { key: 'rating', label: t('admin.rating'), render: (r) => `${r.rating?.toFixed?.(1) ?? 0} (${r.ratingCount})` },
          { key: 'orders', label: t('admin.totalOrders'), render: (r) => r.totalOrders },
          { key: 'commission', label: t('admin.commission'), render: (r) => (r.commissionPercent != null ? `${r.commissionPercent}%` : t('admin.globalCommission', { v: config?.businessRules?.commissionPercent })) },
          { key: 'wallet', label: t('admin.pendingPayout'), render: (r) => `${currency}${r.walletBalance?.toFixed?.(2) ?? 0}` },
          { key: 'open', label: t('admin.open'), render: (r) => (r.isOpen ? '🟢' : '⚪') },
          { key: 'status', label: t('common.status'), render: (r) => <StatusBadge status={r.status} /> },
        ]}
      />
      <Modal open={!!form} onClose={() => setForm(null)} title={form?._id ? form.name : t('admin.addRestaurant')} size="xl" footer={<>{form?._id && <button type="button" className="btn-danger me-auto" onClick={async () => { if (!window.confirm(t('admin.deactivateRestaurantConfirm'))) return; try { await del(`/admin/restaurants/${form._id}`); toast('restaurant.deleted'); setForm(null); reload(); } catch (e) { toast(errorKey(e), 'error'); } }}>{t('admin.deactivateRestaurant')}</button>}<button type="button" className="btn-ghost" onClick={() => setForm(null)}>{t('common.cancel')}</button><button type="button" className="btn-primary" onClick={save}>{t('common.save')}</button></>}>
        {form && (
          <div className="grid gap-4 md:grid-cols-3">
            <ImageUpload label={t('vendor.logo')} value={form.logo} onChange={(v) => setForm({ ...form, logo: v })} folder="restaurants" aspect="aspect-square" />
            <ImageUpload className="md:col-span-2" label={t('vendor.cover')} value={form.coverImage} onChange={(v) => setForm({ ...form, coverImage: v })} folder="restaurants" />
            <TextField label={t('vendor.restaurantName')} value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <SelectField label={t('admin.owner')} value={form.owner} onChange={(v) => setForm({ ...form, owner: v })} options={[{ value: '', label: '—' }, ...(vendors.data?.items || []).map((u) => ({ value: u._id, label: `${u.name} (${u.email || u.phone})` }))]} />
            <SelectField label={t('common.status')} value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={['pending', 'approved', 'suspended', 'rejected'].map((s) => ({ value: s, label: t(`status.${s}`) }))} />
            <TextArea label={t('vendor.description')} value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
            <TextField label={t('auth.phone')} value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <TextField label={t('auth.email')} value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            <TextField label={t('address.full')} value={form.address?.fullAddress} onChange={(v) => setForm({ ...form, address: { ...form.address, fullAddress: v } })} />
            <TextField label={t('admin.latitude')} type="number" value={form.lat} onChange={(v) => setForm({ ...form, lat: v })} step="any" />
            <TextField label={t('admin.longitude')} type="number" value={form.lng} onChange={(v) => setForm({ ...form, lng: v })} step="any" />
            <TextField label={t('vendor.priceForTwo')} type="number" value={form.priceForTwo} onChange={(v) => setForm({ ...form, priceForTwo: v })} />
            <TextField label={t('vendor.prepTime')} type="number" value={form.avgPrepTimeMinutes} onChange={(v) => setForm({ ...form, avgPrepTimeMinutes: v })} />
            <TextField label={t('admin.commissionOverride')} hint={t('admin.commissionOverrideHint')} type="number" value={form.commissionPercent ?? ''} onChange={(v) => setForm({ ...form, commissionPercent: v })} />
            <TextField label={t('vendor.offerText')} value={form.offerText} onChange={(v) => setForm({ ...form, offerText: v })} />
            <div className="flex flex-col gap-3">
              <Toggle label={t('restaurant.pureVeg')} checked={form.isPureVeg} onChange={(v) => setForm({ ...form, isPureVeg: v })} />
              <Toggle label={t('admin.featured')} checked={form.isFeatured} onChange={(v) => setForm({ ...form, isFeatured: v })} />
            </div>
            <div className="md:col-span-3">
              <div className="label">{t('vendor.cuisines')}</div>
              <div className="flex flex-wrap gap-2">
                {(config?.cuisines || []).map((c) => (
                  <button key={c._id} type="button" className={`badge cursor-pointer ${form.cuisines.includes(c.name) ? 'bg-primary text-onprimary' : 'bg-content/10'}`} onClick={() => toggleCuisine(c.name)}>{c.name}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
