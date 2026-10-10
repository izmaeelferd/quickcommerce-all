import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import Modal, { ConfirmModal } from '../components/Modal.jsx';
import Toggle from '../components/Toggle.jsx';
import ImageUpload from '../components/ImageUpload.jsx';
import { TextField, TextArea, SelectField } from '../components/Field.jsx';
import { useConfig } from '../context/ConfigContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { vendorApi } from '../services/vendor';
import { errorKey } from '../services/api';
import { money } from '../utils/format';
import useAsync from '../utils/useAsync';

const EMPTY = { name: '', description: '', price: '', discountPrice: '', image: '', category: '', isVeg: true, isAvailable: true, isBestseller: false, spiceLevel: 0, addOns: [], tags: [] };

export default function Menu() {
  const { t, currency, language } = useConfig();
  const toast = useToast();
  const cats = useAsync(() => vendorApi.categories(), []);
  const [filter, setFilter] = useState('');
  const items = useAsync(() => vendorApi.items(filter || undefined), [filter]);
  const [form, setForm] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const m = (v) => money(v, currency, language);

  const save = async () => {
    const body = { ...form, price: Number(form.price), discountPrice: form.discountPrice === '' || form.discountPrice == null ? null : Number(form.discountPrice), category: form.category?._id || form.category };
    try {
      if (form._id) await vendorApi.updateItem(form._id, body);
      else await vendorApi.createItem(body);
      setForm(null);
      toast('menu.itemSaved');
      items.reload();
      cats.reload();
    } catch (e) {
      toast(errorKey(e), 'error');
    }
  };

  const setGroup = (gi, patch) => setForm({ ...form, addOns: form.addOns.map((g, i) => (i === gi ? { ...g, ...patch } : g)) });
  const setOption = (gi, oi, patch) => setGroup(gi, { options: form.addOns[gi].options.map((o, i) => (i === oi ? { ...o, ...patch } : o)) });

  return (
    <div>
      <PageHeader title={t('vendor.nav.menu')} subtitle={t('vendor.menuSubtitle')} actions={<button type="button" className="btn-primary" disabled={!cats.data?.length} onClick={() => setForm({ ...EMPTY, category: cats.data?.[0]?._id })}>+ {t('vendor.addItem')}</button>} />
      {cats.data?.length === 0 && <div className="card mb-4 text-center text-content/60">{t('vendor.noCategories')}</div>}
      <div className="mb-4 flex flex-wrap gap-2">
        <button type="button" className={!filter ? 'btn-primary' : 'btn-outline'} onClick={() => setFilter('')}>{t('common.all')}</button>
        {cats.data?.map((c) => <button key={c._id} type="button" className={filter === c._id ? 'btn-primary' : 'btn-outline'} onClick={() => setFilter(c._id)}>{c.name} ({c.itemCount})</button>)}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.data?.map((i) => (
          <div key={i._id} className={`card flex gap-4 ${i.isAvailable ? '' : 'opacity-60'}`}>
            {i.image ? <img src={i.image} alt="" className="h-24 w-24 rounded-card object-cover" /> : <div className="h-24 w-24 rounded-card bg-content/10" />}
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className={`inline-block h-3 w-3 rounded-sm border-2 ${i.isVeg ? 'border-veg bg-veg/40' : 'border-nonveg bg-nonveg/40'}`} />
                <span className="truncate font-semibold">{i.name}</span>
              </div>
              <div className="text-sm">{i.discountPrice != null && i.discountPrice < i.price ? <><b>{m(i.discountPrice)}</b> <s className="text-content/50">{m(i.price)}</s></> : <b>{m(i.price)}</b>}</div>
              <div className="text-xs text-content/60">{i.category?.name}{i.addOns?.length ? ` · ${t('vendor.addOnGroups', { n: i.addOns.length })}` : ''}</div>
              <div className="flex items-center justify-between pt-1">
                <Toggle label={t('vendor.available')} checked={i.isAvailable} onChange={async (v) => { await vendorApi.toggleItem(i._id, v); items.reload(); }} />
                <div>
                  <button type="button" className="btn-ghost px-2" onClick={() => setForm({ ...EMPTY, ...i, category: i.category?._id || i.category, discountPrice: i.discountPrice ?? '' })}>✎</button>
                  <button type="button" className="btn-ghost px-2 text-danger" onClick={() => setDeleting(i)}>🗑</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={!!form} onClose={() => setForm(null)} title={t(form?._id ? 'vendor.editItem' : 'vendor.addItem')} size="lg" footer={<button type="button" className="btn-primary" disabled={!form?.name || form?.price === ''} onClick={save}>{t('common.save')}</button>}>
        {form && (
          <div className="grid gap-4 md:grid-cols-3">
            <ImageUpload label={t('common.image')} value={form.image} onChange={(v) => setForm({ ...form, image: v })} folder="menu" aspect="aspect-square" />
            <div className="space-y-4 md:col-span-2">
              <TextField label={t('vendor.itemName')} value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
              <TextArea label={t('vendor.itemDescription')} value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
              <div className="grid gap-4 sm:grid-cols-3">
                <TextField label={t('vendor.price')} type="number" value={form.price} onChange={(v) => setForm({ ...form, price: v })} />
                <TextField label={t('vendor.discountPrice')} type="number" value={form.discountPrice} onChange={(v) => setForm({ ...form, discountPrice: v })} />
                <SelectField label={t('vendor.category')} value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={(cats.data || []).map((c) => ({ value: c._id, label: c.name }))} />
              </div>
              <div className="flex flex-wrap gap-6">
                <Toggle label={t('menu.veg')} checked={form.isVeg} onChange={(v) => setForm({ ...form, isVeg: v })} />
                <Toggle label={t('vendor.available')} checked={form.isAvailable} onChange={(v) => setForm({ ...form, isAvailable: v })} />
                <Toggle label={t('menu.bestseller')} checked={form.isBestseller} onChange={(v) => setForm({ ...form, isBestseller: v })} />
              </div>
            </div>
            <div className="md:col-span-3">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="font-bold">{t('vendor.addOns')}</h4>
                <button type="button" className="btn-outline px-3 py-1 text-sm" onClick={() => setForm({ ...form, addOns: [...form.addOns, { name: '', required: false, minSelect: 0, maxSelect: 1, options: [] }] })}>+ {t('vendor.addGroup')}</button>
              </div>
              <div className="space-y-3">
                {form.addOns.map((g, gi) => (
                  <div key={g._id || gi} className="rounded-card border border-content/10 p-3">
                    <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
                      <TextField label={t('vendor.groupName')} value={g.name} onChange={(v) => setGroup(gi, { name: v })} />
                      <TextField label={t('vendor.maxSelect')} type="number" value={g.maxSelect} onChange={(v) => setGroup(gi, { maxSelect: v })} />
                      <Toggle label={t('vendor.required')} checked={g.required} onChange={(v) => setGroup(gi, { required: v, minSelect: v ? Math.max(1, g.minSelect || 0) : 0 })} />
                      <button type="button" className="btn-ghost text-danger" onClick={() => setForm({ ...form, addOns: form.addOns.filter((_, i) => i !== gi) })}>🗑</button>
                    </div>
                    <div className="mt-2 space-y-2">
                      {g.options.map((o, oi) => (
                        <div key={o._id || oi} className="grid grid-cols-[1fr_120px_auto_auto] items-center gap-2">
                          <input className="input" placeholder={t('vendor.optionName')} value={o.name} onChange={(e) => setOption(gi, oi, { name: e.target.value })} />
                          <input className="input" type="number" placeholder={t('vendor.price')} value={o.price} onChange={(e) => setOption(gi, oi, { price: Number(e.target.value) })} />
                          <Toggle checked={o.isVeg !== false} onChange={(v) => setOption(gi, oi, { isVeg: v })} label={t('menu.veg')} />
                          <button type="button" className="btn-ghost px-2" onClick={() => setGroup(gi, { options: g.options.filter((_, i) => i !== oi) })}>✕</button>
                        </div>
                      ))}
                      <button type="button" className="btn-ghost px-2 py-1 text-sm" onClick={() => setGroup(gi, { options: [...g.options, { name: '', price: 0, isVeg: true, isAvailable: true }] })}>+ {t('vendor.addOption')}</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
      <ConfirmModal open={!!deleting} onClose={() => setDeleting(null)} titleKey="vendor.deleteItem" onConfirm={async () => { await vendorApi.deleteItem(deleting._id); setDeleting(null); items.reload(); cats.reload(); }} />
    </div>
  );
}
