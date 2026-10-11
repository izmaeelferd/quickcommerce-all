import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import DragDropList from '../components/DragDropList.jsx';
import Modal, { ConfirmModal } from '../components/Modal.jsx';
import Toggle from '../components/Toggle.jsx';
import { TextField, TextArea } from '../components/Field.jsx';
import { useConfig } from '../context/ConfigContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { vendorApi } from '../services/vendor';
import { errorKey } from '../services/api';
import useAsync from '../utils/useAsync';
import Icon from '../components/Icon.jsx';

export default function Categories() {
  const { t } = useConfig();
  const toast = useToast();
  const { data, setData, reload } = useAsync(() => vendorApi.categories(), []);
  const [form, setForm] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const run = async (fn, key) => {
    try {
      await fn();
      toast(key);
      reload();
    } catch (e) {
      toast(errorKey(e), 'error');
    }
  };

  return (
    <div>
      <PageHeader title={t('vendor.categories')} subtitle={t('vendor.categoriesSubtitle')} actions={<button type="button" className="btn-primary" onClick={() => setForm({ name: '', description: '', isActive: true })}>+ {t('vendor.addCategory')}</button>} />
      {data && (
        <DragDropList
          items={data}
          onChange={(list) => { setData(list); run(() => vendorApi.reorderCategories(list.map((c) => c._id)), 'menu.reordered'); }}
          renderItem={(c) => (
            <div className="card flex items-center gap-4 p-4">
              <span className="cursor-grab text-xl text-content/40">⋮⋮</span>
              <div className="flex-1">
                <div className="font-semibold">{c.name}</div>
                <div className="text-xs text-content/60">{t('vendor.itemsCount', { count: c.itemCount })}</div>
              </div>
              <Toggle checked={c.isActive} onChange={(v) => run(() => vendorApi.updateCategory(c._id, { isActive: v }), 'menu.categoryUpdated')} />
              <button type="button" className="btn-ghost px-2" onClick={() => setForm(c)}><Icon name="edit" className="h-4 w-4" title={t('common.edit')} /></button>
              <button type="button" className="btn-ghost px-2 text-danger" onClick={() => setDeleting(c)}><Icon name="trash" className="h-4 w-4" title={t('common.delete')} /></button>
            </div>
          )}
        />
      )}
      <Modal open={!!form} onClose={() => setForm(null)} title={t(form?._id ? 'vendor.editCategory' : 'vendor.addCategory')} size="sm" footer={<button type="button" className="btn-primary" disabled={!form?.name} onClick={() => run(async () => { if (form._id) await vendorApi.updateCategory(form._id, form); else await vendorApi.createCategory(form); setForm(null); }, 'menu.categorySaved')}>{t('common.save')}</button>}>
        {form && (
          <div className="space-y-4">
            <TextField label={t('vendor.categoryName')} value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <TextArea label={t('common.description')} value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
            <Toggle label={t('common.active')} checked={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} />
          </div>
        )}
      </Modal>
      <ConfirmModal open={!!deleting} onClose={() => setDeleting(null)} titleKey="vendor.deleteCategory" onConfirm={() => { run(() => vendorApi.deleteCategory(deleting._id), 'menu.categoryDeleted'); setDeleting(null); }} />
    </div>
  );
}
