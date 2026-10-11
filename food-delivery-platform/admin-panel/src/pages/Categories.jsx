import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import DragDropList from '../components/DragDropList.jsx';
import Modal, { ConfirmModal } from '../components/Modal.jsx';
import ImageUpload from '../components/ImageUpload.jsx';
import Toggle from '../components/Toggle.jsx';
import { TextField } from '../components/Field.jsx';
import { useConfig } from '../context/ConfigContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { get, post, put, del, errorKey } from '../services/api';
import useAsync from '../utils/useAsync';
import Icon from '../components/Icon.jsx';

/** Platform food categories ("What's on your mind") and cuisines. */
export default function Categories() {
  const { t, reload: reloadConfig } = useConfig();
  const toast = useToast();
  const [type, setType] = useState('category');
  const { data, setData, reload } = useAsync(() => get('/admin/categories', { type }), [type]);
  const [form, setForm] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const done = (key) => {
    toast(key);
    reload();
    reloadConfig();
  };

  const save = async () => {
    try {
      if (form._id) await put(`/admin/categories/${form._id}`, form);
      else await post('/admin/categories', { ...form, type, order: (data?.length || 0) + 1 });
      setForm(null);
      done('category.saved');
    } catch (e) {
      toast(errorKey(e), 'error');
    }
  };

  return (
    <div>
      <PageHeader title={t('admin.nav.categories')} subtitle={t('admin.categoriesSubtitle')} actions={<button type="button" className="btn-primary" onClick={() => setForm({ name: '', nameKey: '', image: '', isActive: true })}>+ {t('common.add')}</button>} />
      <div className="mb-4 flex gap-2">
        {['category', 'cuisine'].map((x) => <button key={x} type="button" className={type === x ? 'btn-primary' : 'btn-outline'} onClick={() => setType(x)}>{t(`categoryType.${x}`)}</button>)}
      </div>
      {data && (
        <DragDropList
          items={data}
          onChange={async (list) => {
            setData(list);
            await put('/admin/categories/reorder', { ids: list.map((c) => c._id) });
            done('category.reordered');
          }}
          renderItem={(c) => (
            <div className="card flex items-center gap-4 p-3">
              <span className="cursor-grab text-xl text-content/40">⋮⋮</span>
              {c.image ? <img src={c.image} alt="" className="h-12 w-12 rounded-full object-cover" /> : <div className="h-12 w-12 rounded-full bg-content/10" />}
              <div className="flex-1">
                <div className="font-semibold">{c.name}</div>
                {c.nameKey && <div className="font-mono text-xs text-content/50">{c.nameKey}</div>}
              </div>
              <Toggle checked={c.isActive} onChange={async (v) => { await put(`/admin/categories/${c._id}`, { isActive: v }); done('category.saved'); }} />
              <button type="button" className="btn-ghost px-2" onClick={() => setForm(c)}><Icon name="edit" className="h-4 w-4" title={t('common.edit')} /></button>
              <button type="button" className="btn-ghost px-2 text-danger" onClick={() => setDeleting(c)}><Icon name="trash" className="h-4 w-4" title={t('common.delete')} /></button>
            </div>
          )}
        />
      )}
      <Modal open={!!form} onClose={() => setForm(null)} title={t(form?._id ? 'common.edit' : 'common.add')} size="sm" footer={<button type="button" className="btn-primary" onClick={save}>{t('common.save')}</button>}>
        {form && (
          <div className="space-y-4">
            <ImageUpload label={t('common.image')} value={form.image} onChange={(v) => setForm({ ...form, image: v })} folder="categories" aspect="aspect-square" />
            <TextField label={t('common.name')} value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <TextField label={t('admin.translationKey')} hint={t('admin.translationKeyHint')} value={form.nameKey} onChange={(v) => setForm({ ...form, nameKey: v })} />
            <Toggle label={t('common.active')} checked={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} />
          </div>
        )}
      </Modal>
      <ConfirmModal open={!!deleting} onClose={() => setDeleting(null)} titleKey="category.deleteConfirm" onConfirm={async () => { await del(`/admin/categories/${deleting._id}`); setDeleting(null); done('category.deleted'); }} />
    </div>
  );
}
