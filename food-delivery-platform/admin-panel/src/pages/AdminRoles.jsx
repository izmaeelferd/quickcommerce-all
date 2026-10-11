import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import Modal, { ConfirmModal } from '../components/Modal.jsx';
import { TextField } from '../components/Field.jsx';
import { useConfig } from '../context/ConfigContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { get, post, put, del, errorKey } from '../services/api';
import useAsync from '../utils/useAsync';
import Icon from '../components/Icon.jsx';

export default function AdminRoles() {
  const { t } = useConfig();
  const toast = useToast();
  const { data, reload } = useAsync(() => get('/admin/roles'), []);
  const [form, setForm] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const perms = data?.permissions || [];

  const save = async () => {
    try {
      if (form._id) await put(`/admin/roles/${form._id}`, form);
      else await post('/admin/roles', form);
      setForm(null);
      toast('role.saved');
      reload();
    } catch (e) {
      toast(errorKey(e), 'error');
    }
  };

  return (
    <div>
      <PageHeader title={t('admin.nav.roles')} subtitle={t('admin.rolesSubtitle')} actions={<button type="button" className="btn-primary" onClick={() => setForm({ name: '', description: '', permissions: [] })}>+ {t('role.add')}</button>} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data?.roles.map((r) => (
          <div key={r._id} className="card space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-bold">{r.name}</div>
                <div className="text-xs text-content/60">{r.description}</div>
              </div>
              <div className="flex gap-1">
                <button type="button" className="btn-ghost px-2" onClick={() => setForm(r)}><Icon name="edit" className="h-4 w-4" title={t('common.edit')} /></button>
                <button type="button" className="btn-ghost px-2 text-danger" onClick={() => setDeleting(r)}><Icon name="trash" className="h-4 w-4" title={t('common.delete')} /></button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">{r.permissions.map((p) => <span key={p} className="badge bg-primary/10 text-primary">{t(`perm.${p}`)}</span>)}</div>
          </div>
        ))}
      </div>
      <Modal open={!!form} onClose={() => setForm(null)} title={t(form?._id ? 'role.edit' : 'role.add')} footer={<button type="button" className="btn-primary" onClick={save}>{t('common.save')}</button>}>
        {form && (
          <div className="space-y-4">
            <TextField label={t('common.name')} value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <TextField label={t('common.description')} value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {perms.map((p) => (
                <label key={p} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="accent-primary" checked={form.permissions.includes(p)} onChange={(e) => setForm({ ...form, permissions: e.target.checked ? [...form.permissions, p] : form.permissions.filter((x) => x !== p) })} />
                  {t(`perm.${p}`)}
                </label>
              ))}
            </div>
          </div>
        )}
      </Modal>
      <ConfirmModal open={!!deleting} onClose={() => setDeleting(null)} titleKey="role.deleteConfirm" onConfirm={async () => { try { await del(`/admin/roles/${deleting._id}`); reload(); } catch (e) { toast(errorKey(e), 'error'); } setDeleting(null); }} />
    </div>
  );
}
