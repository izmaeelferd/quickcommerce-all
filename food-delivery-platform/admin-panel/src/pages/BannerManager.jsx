import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import DragDropList from '../components/DragDropList.jsx';
import ImageUpload from '../components/ImageUpload.jsx';
import Modal, { ConfirmModal } from '../components/Modal.jsx';
import Toggle from '../components/Toggle.jsx';
import ColorPicker from '../components/ColorPicker.jsx';
import { TextField, SelectField } from '../components/Field.jsx';
import { useConfig } from '../context/ConfigContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { configApi } from '../services/config';
import { errorKey, get } from '../services/api';
import { formatDay, toInputDate } from '../utils/format';
import useAsync from '../utils/useAsync';
import Icon from '../components/Icon.jsx';

const EMPTY = { title: '', subtitle: '', imageUrl: '', placement: 'home', linkType: 'none', linkValue: '', startDate: '', endDate: '', isActive: true, backgroundColor: '' };

export default function BannerManager() {
  const { t, config, reload: reloadConfig, language } = useConfig();
  const toast = useToast();
  const { data, setData, reload } = useAsync(() => configApi.banners(), []);
  const restaurants = useAsync(() => get('/admin/restaurants', { status: 'approved', limit: 100 }), []);
  const [form, setForm] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const persistOrder = async (list) => {
    setData(list);
    try {
      await configApi.reorderBanners(list.map((b) => b._id));
      toast('banner.reordered');
      reloadConfig();
    } catch (e) {
      toast(errorKey(e), 'error');
    }
  };

  const submit = async () => {
    const body = { ...form, startDate: form.startDate || null, endDate: form.endDate || null };
    try {
      if (form._id) await configApi.updateBanner(form._id, body);
      else await configApi.createBanner({ ...body, order: (data?.length || 0) + 1 });
      setForm(null);
      toast('banner.saved');
      reload();
      reloadConfig();
    } catch (e) {
      toast(errorKey(e), 'error');
    }
  };

  const linkOptions = () => {
    if (form.linkType === 'restaurant') return (restaurants.data?.items || []).map((r) => ({ value: r._id, label: r.name }));
    if (form.linkType === 'category') return (config?.categories || []).map((c) => ({ value: c._id, label: c.name }));
    if (form.linkType === 'cuisine') return (config?.cuisines || []).map((c) => ({ value: c.name, label: c.name }));
    return null;
  };

  const status = (b) => {
    const now = Date.now();
    if (!b.isActive) return 'inactive';
    if (b.startDate && new Date(b.startDate).getTime() > now) return 'scheduled';
    if (b.endDate && new Date(b.endDate).getTime() < now) return 'expired';
    return 'live';
  };

  return (
    <div>
      <PageHeader title={t('admin.nav.banners')} subtitle={t('admin.bannersSubtitle')} actions={<button type="button" className="btn-primary" onClick={() => setForm({ ...EMPTY })}>+ {t('banner.add')}</button>} />
      {data && (
        <DragDropList
          items={data}
          onChange={persistOrder}
          renderItem={(b) => (
            <div className="card flex flex-wrap items-center gap-4 p-3">
              <span className="cursor-grab text-xl text-content/40">⋮⋮</span>
              <img src={b.imageUrl} alt="" className="h-16 w-32 rounded-btn object-cover" style={{ background: b.backgroundColor || undefined }} />
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{b.title || t('banner.untitled')}</div>
                <div className="text-xs text-content/60">
                  {t(`placement.${b.placement}`)} · {t(`link.${b.linkType}`)} · {b.startDate ? formatDay(b.startDate, language) : '∞'} → {b.endDate ? formatDay(b.endDate, language) : '∞'} · {t('banner.clicks', { n: b.clicks })}
                </div>
              </div>
              <span className="badge bg-primary/10 text-primary">{t(`banner.status.${status(b)}`)}</span>
              <button type="button" className="btn-ghost px-2" onClick={() => setForm({ ...b, startDate: toInputDate(b.startDate), endDate: toInputDate(b.endDate) })}><Icon name="edit" className="h-4 w-4" title={t('common.edit')} /></button>
              <button type="button" className="btn-ghost px-2 text-danger" onClick={() => setDeleting(b)}><Icon name="trash" className="h-4 w-4" title={t('common.delete')} /></button>
            </div>
          )}
        />
      )}
      {data?.length === 0 && <div className="card text-center text-content/60">{t('banner.none')}</div>}

      <Modal open={!!form} onClose={() => setForm(null)} title={t(form?._id ? 'banner.edit' : 'banner.add')} size="lg" footer={<><button type="button" className="btn-ghost" onClick={() => setForm(null)}>{t('common.cancel')}</button><button type="button" className="btn-primary" disabled={!form?.imageUrl} onClick={submit}>{t('common.save')}</button></>}>
        {form && (
          <div className="grid gap-4 md:grid-cols-2">
            <ImageUpload className="md:col-span-2" label={t('banner.image')} value={form.imageUrl} onChange={(v) => setForm({ ...form, imageUrl: v })} folder="banners" aspect="aspect-[3/1]" />
            <TextField label={t('banner.title')} value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
            <TextField label={t('banner.subtitle')} value={form.subtitle} onChange={(v) => setForm({ ...form, subtitle: v })} />
            <SelectField label={t('banner.placement')} value={form.placement} onChange={(v) => setForm({ ...form, placement: v })} options={['home', 'offers', 'restaurant', 'cart'].map((x) => ({ value: x, label: t(`placement.${x}`) }))} />
            <SelectField label={t('banner.linkType')} value={form.linkType} onChange={(v) => setForm({ ...form, linkType: v, linkValue: '' })} options={['none', 'restaurant', 'category', 'cuisine', 'url', 'coupon'].map((x) => ({ value: x, label: t(`link.${x}`) }))} />
            {form.linkType !== 'none' && (linkOptions() ? (
              <SelectField label={t('banner.linkTarget')} value={form.linkValue} onChange={(v) => setForm({ ...form, linkValue: v })} options={[{ value: '', label: '—' }, ...linkOptions()]} />
            ) : (
              <TextField label={t('banner.linkTarget')} value={form.linkValue} onChange={(v) => setForm({ ...form, linkValue: v })} />
            ))}
            <ColorPicker label={t('banner.backgroundColor')} value={form.backgroundColor} onChange={(v) => setForm({ ...form, backgroundColor: v })} />
            <TextField label={t('banner.startDate')} type="datetime-local" value={form.startDate} onChange={(v) => setForm({ ...form, startDate: v })} />
            <TextField label={t('banner.endDate')} type="datetime-local" value={form.endDate} onChange={(v) => setForm({ ...form, endDate: v })} />
            <Toggle label={t('common.active')} checked={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} />
          </div>
        )}
      </Modal>
      <ConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        titleKey="banner.deleteConfirm"
        onConfirm={async () => {
          await configApi.deleteBanner(deleting._id);
          setDeleting(null);
          reload();
          reloadConfig();
        }}
      />
    </div>
  );
}
