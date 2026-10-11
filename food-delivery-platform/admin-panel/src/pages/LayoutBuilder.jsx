import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import DragDropList from '../components/DragDropList.jsx';
import LivePreview from '../components/LivePreview.jsx';
import Toggle from '../components/Toggle.jsx';
import Modal from '../components/Modal.jsx';
import { TextField, SelectField } from '../components/Field.jsx';
import { useConfig } from '../context/ConfigContext.jsx';
import useConfigSection from '../utils/useConfigSection';
import SaveBar from './_SaveBar.jsx';
import Icon from '../components/Icon.jsx';
import ImageUpload from '../components/ImageUpload.jsx';
import ColorPicker from '../components/ColorPicker.jsx';
import RichTextEditor from '../components/RichTextEditor.jsx';
import { RestaurantPicker, DishPicker } from '../components/SectionPickers.jsx';

const STANDARD_TYPES = ['banner', 'categories', 'search', 'restaurants', 'offers', 'cuisines', 'featured', 'topRated', 'nearby', 'custom'];
const CUSTOM_TYPES = ['promo', 'pickedRestaurants', 'pickedDishes', 'text', 'spacer'];
const TYPES = [...STANDARD_TYPES, ...CUSTOM_TYPES];
const LINK_TYPES = ['none', 'restaurant', 'category', 'cuisine', 'url', 'offers'];
const ALIGNS = ['start', 'center', 'end'];
/** Section types whose content is a list that uses layout / columns / limit. */
const LIST_TYPES = ['categories', 'cuisines', 'offers', 'restaurants', 'featured', 'topRated', 'nearby', 'custom', 'pickedRestaurants', 'pickedDishes'];
/** Sensible starting values when an admin adds a custom section. */
const CUSTOM_DEFAULTS = {
  promo: { layout: 'list', content: { imageUrl: '', ctaText: '', linkType: 'none', linkValue: '' }, style: { height: 180, textAlign: 'start' } },
  pickedRestaurants: { layout: 'carousel', content: { restaurantIds: [] } },
  pickedDishes: { layout: 'carousel', content: { itemIds: [] } },
  text: { layout: 'list', content: { html: '' }, style: { textAlign: 'start' } },
  spacer: { layout: 'list', title: '', style: { height: 16 } },
};
const LAYOUTS = ['grid', 'list', 'carousel'];
const SORTS = ['', 'rating', 'deliveryTime', 'priceLow', 'priceHigh', 'popular', 'newest'];
const ICONS = { banner: 'image', categories: 'grid', search: 'search', restaurants: 'store', offers: 'tag', cuisines: 'utensils', featured: 'star', topRated: 'award', nearby: 'pin', custom: 'list', promo: 'megaphone', pickedRestaurants: 'store', pickedDishes: 'utensils', text: 'document', spacer: 'spacing' };

export default function LayoutBuilder() {
  const { t, config } = useConfig();
  const { draft, setDraft, save, saving, dirty, reset } = useConfigSection('homeLayout');
  const [editing, setEditing] = useState(null);
  if (!draft) return <div className="text-content/60">{t('common.loading')}</div>;

  const reorder = (list) => setDraft(list.map((s, i) => ({ ...s, order: i + 1 })));
  const update = (id, patch) => setDraft(draft.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const remove = (id) => reorder(draft.filter((s) => s.id !== id));
  const add = (type) => {
    const base = { id: `sec_${type}_${Date.now()}`, type, enabled: true, order: draft.length + 1, title: t(`section.${type}`), titleKey: '', subtitle: '', layout: 'list', columns: 2, limit: 10, filter: {}, style: {}, content: {} };
    const s = { ...base, ...(CUSTOM_DEFAULTS[type] || {}) };
    setDraft([...draft, s]);
    setEditing(s);
  };
  const sorted = [...draft].sort((a, b) => a.order - b.order);
  const cuisines = config?.cuisines || [];
  const categories = config?.categories || [];

  return (
    <div>
      <PageHeader
        title={t('admin.nav.layout')}
        subtitle={t('admin.layoutSubtitle')}
        actions={
          <select className="input w-auto" value="" onChange={(e) => e.target.value && add(e.target.value)}>
            <option value="">{t('admin.addSection')}</option>
            <optgroup label={t('admin.sectionGroupStandard')}>
              {STANDARD_TYPES.map((ty) => <option key={ty} value={ty}>{t(`section.${ty}`)}</option>)}
            </optgroup>
            <optgroup label={t('admin.sectionGroupCustom')}>
              {CUSTOM_TYPES.map((ty) => <option key={ty} value={ty}>{t(`section.${ty}`)}</option>)}
            </optgroup>
          </select>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <DragDropList
          items={sorted}
          onChange={reorder}
          renderItem={(s, i, h) => (
            <div className={`card flex items-center gap-4 p-4 ${s.enabled ? '' : 'opacity-60'}`}>
              <span className="cursor-grab select-none text-xl text-content/40" title={t('admin.dragToReorder')}>⋮⋮</span>
              <span className="flex h-10 w-10 items-center justify-center rounded-btn bg-primary/10 text-primary"><Icon name={ICONS[s.type] || 'layout'} className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{s.title || t(`section.${s.type}`)}</div>
                <div className="text-xs text-content/60">{t(`section.${s.type}`)}{LIST_TYPES.includes(s.type) ? ` · ${t(`layout.${s.layout}`)}` : ''} · #{i + 1}</div>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" className="btn-ghost px-2 py-1" onClick={h.moveUp} disabled={i === 0}><Icon name="arrowUp" className="h-4 w-4" title={t('admin.moveUp')} /></button>
                <button type="button" className="btn-ghost px-2 py-1" onClick={h.moveDown} disabled={i === sorted.length - 1}><Icon name="arrowDown" className="h-4 w-4" title={t('admin.moveDown')} /></button>
                <button type="button" className="btn-ghost px-2 py-1" onClick={() => setEditing(s)}><Icon name="edit" className="h-4 w-4" title={t('common.edit')} /></button>
                <button type="button" className="btn-ghost px-2 py-1 text-danger" onClick={() => remove(s.id)}><Icon name="trash" className="h-4 w-4" title={t('common.delete')} /></button>
              </div>
              <Toggle checked={s.enabled} onChange={(v) => update(s.id, { enabled: v })} />
            </div>
          )}
        />
        <div className="xl:sticky xl:top-20 xl:self-start">
          <div className="mb-2 text-center text-sm font-semibold text-content/60">{t('admin.livePreview')}</div>
          <LivePreview layout={draft} />
        </div>
      </div>
      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={reset} />

      <Modal open={!!editing} onClose={() => setEditing(null)} title={t('admin.editSection')} footer={<button type="button" className="btn-primary" onClick={() => setEditing(null)}>{t('common.done')}</button>}>
        {editing && (() => {
          const s = draft.find((x) => x.id === editing.id) || editing;
          const u = (patch) => update(s.id, patch);
          const isRestaurantList = ['restaurants', 'featured', 'topRated', 'nearby', 'custom'].includes(s.type);
          const isList = LIST_TYPES.includes(s.type);
          const content = s.content || {};
          const style = s.style || {};
          const setContent = (patch) => u({ content: { ...content, ...patch } });
          const setStyle = (patch) => u({ style: { ...style, ...patch } });
          const linkOptions = () => {
            if (content.linkType === 'category') return categories.map((c) => ({ value: c._id, label: c.name }));
            if (content.linkType === 'cuisine') return cuisines.map((c) => ({ value: c.name, label: c.name }));
            return null;
          };
          return (
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField label={t('admin.sectionType')} value={s.type} onChange={(v) => u({ type: v, ...(CUSTOM_DEFAULTS[v] ? { content: CUSTOM_DEFAULTS[v].content || {}, style: { ...style, ...(CUSTOM_DEFAULTS[v].style || {}) } } : {}) })} options={TYPES.map((x) => ({ value: x, label: t(`section.${x}`) }))} />
              {isList && <SelectField label={t('admin.layoutStyle')} value={s.layout} onChange={(v) => u({ layout: v })} options={LAYOUTS.map((x) => ({ value: x, label: t(`layout.${x}`) }))} />}
              {s.type !== 'spacer' && (
                <>
                  <TextField label={t('admin.sectionTitle')} value={s.title} onChange={(v) => u({ title: v })} />
                  <TextField label={t('admin.sectionTitleKey')} hint={t('admin.sectionTitleKeyHint')} value={s.titleKey} onChange={(v) => u({ titleKey: v })} />
                  <TextField label={t('admin.sectionSubtitle')} value={s.subtitle} onChange={(v) => u({ subtitle: v })} />
                </>
              )}
              {isList && !['pickedRestaurants', 'pickedDishes'].includes(s.type) && <TextField label={t('admin.itemLimit')} type="number" value={s.limit} onChange={(v) => u({ limit: v })} />}
              {isList && s.layout === 'grid' && <TextField label={t('admin.columns')} type="number" value={s.columns} onChange={(v) => u({ columns: v })} />}
              {s.type === 'banner' && (
                <>
                  <SelectField label={t('banner.placement')} value={s.filter?.placement || 'home'} onChange={(v) => u({ filter: { ...s.filter, placement: v } })} options={['home', 'offers', 'restaurant', 'cart'].map((x) => ({ value: x, label: t(`placement.${x}`) }))} />
                  <TextField label={t('admin.autoplaySeconds')} type="number" value={style.autoplaySeconds ?? 4} onChange={(v) => setStyle({ autoplaySeconds: v })} />
                  <TextField label={t('admin.bannerHeight')} type="number" value={style.height ?? 160} onChange={(v) => setStyle({ height: v })} />
                </>
              )}
              {isRestaurantList && (
                <>
                  <SelectField label={t('admin.filterCuisine')} value={s.filter?.cuisine || ''} onChange={(v) => u({ filter: { ...s.filter, cuisine: v } })} options={[{ value: '', label: t('common.any') }, ...cuisines.map((c) => ({ value: c.name, label: c.name }))]} />
                  <SelectField label={t('admin.filterCategory')} value={s.filter?.category || ''} onChange={(v) => u({ filter: { ...s.filter, category: v } })} options={[{ value: '', label: t('common.any') }, ...categories.map((c) => ({ value: c._id, label: c.name }))]} />
                  <SelectField label={t('admin.sortBy')} value={s.filter?.sort || ''} onChange={(v) => u({ filter: { ...s.filter, sort: v } })} options={SORTS.map((x) => ({ value: x, label: x ? t(`sort.${x}`) : t('common.default') }))} />
                  <TextField label={t('admin.minRating')} type="number" value={s.filter?.minRating ?? ''} onChange={(v) => u({ filter: { ...s.filter, minRating: v === '' ? undefined : v } })} />
                  <div className="sm:col-span-2 flex gap-6">
                    <Toggle label={t('filter.vegOnly')} checked={!!s.filter?.veg} onChange={(v) => u({ filter: { ...s.filter, veg: v } })} />
                    <Toggle label={t('admin.featuredOnly')} checked={!!s.filter?.featured} onChange={(v) => u({ filter: { ...s.filter, featured: v } })} />
                  </div>
                </>
              )}

              {s.type === 'promo' && (
                <>
                  <div className="sm:col-span-2"><ImageUpload label={t('admin.promoImage')} value={content.imageUrl} onChange={(v) => setContent({ imageUrl: v })} folder="layout" /></div>
                  <SelectField label={t('admin.onTap')} value={content.linkType || 'none'} onChange={(v) => setContent({ linkType: v, linkValue: '' })} options={LINK_TYPES.map((x) => ({ value: x, label: t(`link.${x}`) }))} />
                  {content.linkType === 'restaurant' && <div className="sm:col-span-2"><RestaurantPicker value={content.linkValue ? [content.linkValue] : []} onChange={(ids) => setContent({ linkValue: ids[ids.length - 1] || '' })} /></div>}
                  {linkOptions() && <SelectField label={t('admin.linkTarget')} value={content.linkValue || ''} onChange={(v) => setContent({ linkValue: v })} options={[{ value: '', label: '-' }, ...linkOptions()]} />}
                  {content.linkType === 'url' && <TextField label={t('admin.linkUrl')} value={content.linkValue || ''} onChange={(v) => setContent({ linkValue: v })} />}
                  {content.linkType && content.linkType !== 'none' && <TextField label={t('admin.ctaText')} value={content.ctaText || ''} onChange={(v) => setContent({ ctaText: v })} />}
                </>
              )}
              {s.type === 'pickedRestaurants' && <div className="sm:col-span-2"><RestaurantPicker value={content.restaurantIds || []} onChange={(ids) => setContent({ restaurantIds: ids })} /></div>}
              {s.type === 'pickedDishes' && <div className="sm:col-span-2"><DishPicker value={content.itemIds || []} onChange={(ids) => setContent({ itemIds: ids })} /></div>}
              {s.type === 'text' && (
                <div className="sm:col-span-2">
                  <label className="label">{t('admin.textContent')}</label>
                  <RichTextEditor value={content.html || ''} onChange={(v) => setContent({ html: v })} minHeight={180} />
                </div>
              )}

              <div className="sm:col-span-2 border-t border-content/10 pt-3 text-sm font-semibold">{t('admin.sectionStyle')}</div>
              {s.type !== 'spacer' && <ColorPicker label={t('admin.backgroundColor')} value={style.backgroundColor || ''} onChange={(v) => setStyle({ backgroundColor: v || undefined })} />}
              {['promo', 'text'].includes(s.type) && <ColorPicker label={t('admin.textColor')} value={style.textColor || ''} onChange={(v) => setStyle({ textColor: v || undefined })} />}
              {['promo', 'text'].includes(s.type) && <SelectField label={t('admin.textAlign')} value={style.textAlign || 'start'} onChange={(v) => setStyle({ textAlign: v })} options={ALIGNS.map((x) => ({ value: x, label: t(`align.${x}`) }))} />}
              {['promo', 'spacer'].includes(s.type) && <TextField label={t('admin.sectionHeight')} type="number" value={style.height ?? (s.type === 'spacer' ? 16 : 180)} onChange={(v) => setStyle({ height: v })} />}
              {s.type !== 'spacer' && <TextField label={t('admin.verticalPadding')} type="number" value={style.paddingVertical ?? 0} onChange={(v) => setStyle({ paddingVertical: v })} />}
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
