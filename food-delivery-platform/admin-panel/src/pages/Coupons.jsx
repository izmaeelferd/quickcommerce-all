import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import Modal, { ConfirmModal } from '../components/Modal.jsx';
import Toggle from '../components/Toggle.jsx';
import ImageUpload from '../components/ImageUpload.jsx';
import { TextField, SelectField, TextArea } from '../components/Field.jsx';
import { useConfig } from '../context/ConfigContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { get, post, put, del, errorKey } from '../services/api';
import { formatDay, toInputDate } from '../utils/format';
import useAsync from '../utils/useAsync';
import Icon, { Dot } from '../components/Icon.jsx';

const EMPTY = { code: '', title: '', description: '', discountType: 'percent', value: 10, maxDiscount: '', minOrderValue: 0, validFrom: '', validTo: '', usageLimit: '', perUserLimit: 1, restaurant: '', firstOrderOnly: false, isActive: true, showInOffers: true, bannerImage: '' };

export default function Coupons() {
  const { t, currency, language } = useConfig();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const { data, loading, reload } = useAsync(() => get('/coupons', { page, q }), [page, q]);
  const restaurants = useAsync(() => get('/admin/restaurants', { status: 'approved', limit: 100 }), []);
  const [form, setForm] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const save = async () => {
    const nil = (v) => (v === '' ? null : v);
    const body = { ...form, maxDiscount: nil(form.maxDiscount), usageLimit: nil(form.usageLimit), restaurant: nil(form.restaurant), validFrom: form.validFrom || undefined, validTo: nil(form.validTo) };
    try {
      if (form._id) await put(`/coupons/${form._id}`, body);
      else await post('/coupons', body);
      setForm(null);
      toast('coupon.saved');
      reload();
    } catch (e) {
      toast(errorKey(e), 'error');
    }
  };

  const describe = (c) => (c.discountType === 'percent' ? `${c.value}%${c.maxDiscount ? ` ≤ ${currency}${c.maxDiscount}` : ''}` : c.discountType === 'flat' ? `${currency}${c.value}` : t('offer.freeDelivery'));

  return (
    <div>
      <PageHeader title={t('admin.nav.coupons')} subtitle={t('admin.couponsSubtitle')} actions={<button type="button" className="btn-primary" onClick={() => setForm({ ...EMPTY })}>+ {t('coupon.add')}</button>} />
      <input className="input mb-4 max-w-xs" placeholder={t('common.search')} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
      <DataTable
        loading={loading}
        rows={data?.items}
        pagination={data?.pagination}
        onPage={setPage}
        onRowClick={(c) => setForm({ ...EMPTY, ...c, restaurant: c.restaurant?._id || '', maxDiscount: c.maxDiscount ?? '', usageLimit: c.usageLimit ?? '', validFrom: toInputDate(c.validFrom), validTo: toInputDate(c.validTo) })}
        columns={[
          { key: 'code', label: t('coupon.code'), render: (c) => <span className="font-mono font-bold">{c.code}</span> },
          { key: 'discount', label: t('coupon.discount'), render: describe },
          { key: 'min', label: t('coupon.minOrder'), render: (c) => `${currency}${c.minOrderValue}` },
          { key: 'scope', label: t('coupon.scope'), render: (c) => c.restaurant?.name || t('coupon.allRestaurants') },
          { key: 'usage', label: t('coupon.usage'), render: (c) => `${c.usedCount}${c.usageLimit ? ` / ${c.usageLimit}` : ''}` },
          { key: 'validity', label: t('coupon.validity'), render: (c) => `${formatDay(c.validFrom, language)} → ${c.validTo ? formatDay(c.validTo, language) : '∞'}` },
          { key: 'active', label: t('common.active'), render: (c) => <Dot on={c.isActive} label={c.isActive ? t('common.active') : t('common.inactive')} /> },
          { key: 'x', label: '', render: (c) => <button type="button" className="btn-ghost px-2 text-danger" onClick={(e) => { e.stopPropagation(); setDeleting(c); }}><Icon name="trash" className="h-4 w-4" title={t('common.delete')} /></button> },
        ]}
      />
      <Modal open={!!form} onClose={() => setForm(null)} title={t(form?._id ? 'coupon.edit' : 'coupon.add')} size="lg" footer={<button type="button" className="btn-primary" onClick={save}>{t('common.save')}</button>}>
        {form && (
          <div className="grid gap-4 md:grid-cols-3">
            <TextField label={t('coupon.code')} value={form.code} onChange={(v) => setForm({ ...form, code: v.toUpperCase() })} />
            <TextField label={t('coupon.title')} value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
            <SelectField label={t('coupon.type')} value={form.discountType} onChange={(v) => setForm({ ...form, discountType: v })} options={['percent', 'flat', 'free_delivery'].map((x) => ({ value: x, label: t(`coupon.type.${x}`) }))} />
            <TextField label={t('coupon.value')} type="number" value={form.value} onChange={(v) => setForm({ ...form, value: v })} />
            <TextField label={t('coupon.maxDiscount')} type="number" value={form.maxDiscount} onChange={(v) => setForm({ ...form, maxDiscount: v })} />
            <TextField label={t('coupon.minOrder')} type="number" value={form.minOrderValue} onChange={(v) => setForm({ ...form, minOrderValue: v })} />
            <TextField label={t('coupon.validFrom')} type="datetime-local" value={form.validFrom} onChange={(v) => setForm({ ...form, validFrom: v })} />
            <TextField label={t('coupon.validTo')} type="datetime-local" value={form.validTo} onChange={(v) => setForm({ ...form, validTo: v })} />
            <SelectField label={t('coupon.scope')} value={form.restaurant} onChange={(v) => setForm({ ...form, restaurant: v })} options={[{ value: '', label: t('coupon.allRestaurants') }, ...(restaurants.data?.items || []).map((r) => ({ value: r._id, label: r.name }))]} />
            <TextField label={t('coupon.usageLimit')} type="number" value={form.usageLimit} onChange={(v) => setForm({ ...form, usageLimit: v })} />
            <TextField label={t('coupon.perUserLimit')} type="number" value={form.perUserLimit} onChange={(v) => setForm({ ...form, perUserLimit: v })} />
            <ImageUpload label={t('coupon.bannerImage')} value={form.bannerImage} onChange={(v) => setForm({ ...form, bannerImage: v })} folder="coupons" aspect="aspect-square" />
            <TextArea label={t('coupon.description')} value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
            <div className="flex flex-col gap-3 md:col-span-2">
              <Toggle label={t('coupon.firstOrderOnly')} checked={form.firstOrderOnly} onChange={(v) => setForm({ ...form, firstOrderOnly: v })} />
              <Toggle label={t('coupon.showInOffers')} checked={form.showInOffers} onChange={(v) => setForm({ ...form, showInOffers: v })} />
              <Toggle label={t('common.active')} checked={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} />
            </div>
          </div>
        )}
      </Modal>
      <ConfirmModal open={!!deleting} onClose={() => setDeleting(null)} titleKey="coupon.deleteConfirm" onConfirm={async () => { await del(`/coupons/${deleting._id}`); setDeleting(null); reload(); }} />
    </div>
  );
}
