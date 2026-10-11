import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Modal from '../components/Modal.jsx';
import { TextField, SelectField } from '../components/Field.jsx';
import { useConfig } from '../context/ConfigContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { get, patch, post, put, errorKey } from '../services/api';
import { formatDate, money } from '../utils/format';
import useAsync from '../utils/useAsync';

const ROLES = ['customer', 'vendor', 'delivery', 'admin', 'superadmin'];

export default function Users() {
  const { t, currency, language } = useConfig();
  const toast = useToast();
  const [filters, setFilters] = useState({ role: 'customer', q: '', page: 1 });
  const { data, loading, reload } = useAsync(() => get('/admin/users', filters), [filters]);
  const roles = useAsync(() => get('/admin/roles'), []);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState(null);
  const [wallet, setWallet] = useState({ amount: '', reason: '' });

  const open = async (u) => setDetail(await get(`/admin/users/${u._id}`));
  const act = async (fn, key) => {
    try {
      await fn();
      toast(key);
      reload();
      if (detail) setDetail(await get(`/admin/users/${detail.user._id}`));
    } catch (e) {
      toast(errorKey(e), 'error');
    }
  };

  return (
    <div>
      <PageHeader title={t('admin.nav.users')} subtitle={t('admin.usersSubtitle')} actions={<button type="button" className="btn-primary" onClick={() => setForm({ name: '', email: '', phone: '', password: '', role: 'admin', adminRole: '' })}>+ {t('admin.addUser')}</button>} />
      <div className="mb-4 flex flex-wrap gap-3">
        <input className="input max-w-xs" placeholder={t('common.search')} value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value, page: 1 })} />
        <select className="input w-auto" value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value, page: 1 })}>
          <option value="">{t('common.all')}</option>
          {ROLES.map((r) => <option key={r} value={r}>{t(`role.${r}`)}</option>)}
        </select>
      </div>
      <DataTable
        loading={loading}
        rows={data?.items}
        pagination={data?.pagination}
        onPage={(page) => setFilters({ ...filters, page })}
        onRowClick={open}
        columns={[
          { key: 'name', label: t('common.name'), render: (u) => <div className="font-semibold">{u.name || '—'}</div> },
          { key: 'contact', label: t('admin.contact'), render: (u) => <div className="text-xs">{u.email}<br />{u.phone}</div> },
          { key: 'role', label: t('admin.role'), render: (u) => `${t(`role.${u.role}`)}${u.adminRole ? ` · ${u.adminRole.name}` : ''}` },
          { key: 'wallet', label: t('profile.wallet'), render: (u) => money(u.walletBalance, currency, language) },
          { key: 'joined', label: t('admin.joined'), render: (u) => formatDate(u.createdAt, language) },
          { key: 'status', label: t('common.status'), render: (u) => <StatusBadge status={u.isBanned ? 'banned' : 'active'} /> },
        ]}
      />
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.user?.name || ''} size="lg">
        {detail && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2 text-sm">
              <div>{detail.user.email} · {detail.user.phone}</div>
              <div>{t('admin.role')}: {t(`role.${detail.user.role}`)}</div>
              <div>{t('admin.referralCode')}: <b>{detail.user.referralCode}</b></div>
              <div>{t('admin.lifetimeSpend', { amount: money(detail.lifetime.total, currency, language), count: detail.lifetime.count })}</div>
              <div>{t('profile.wallet')}: <b>{money(detail.user.walletBalance, currency, language)}</b></div>
              <div className="flex gap-2 pt-2">
                {detail.user.isBanned ? (
                  <button type="button" className="btn-primary" onClick={() => act(() => patch(`/admin/users/${detail.user._id}/ban`, { banned: false }), 'user.unbanned')}>{t('admin.unban')}</button>
                ) : (
                  <button type="button" className="btn-danger" onClick={() => act(() => patch(`/admin/users/${detail.user._id}/ban`, { banned: true, reason: 'admin' }), 'user.banned')}>{t('admin.ban')}</button>
                )}
                <button type="button" className="btn-outline" onClick={() => { setForm({ ...detail.user, adminRole: detail.user.adminRole?._id || '', password: '' }); setDetail(null); }}>{t('common.edit')}</button>
              </div>
              <div className="border-t border-content/10 pt-3">
                <div className="label">{t('admin.adjustWallet')}</div>
                <div className="flex gap-2">
                  <input className="input" type="number" placeholder={t('admin.amountSigned')} value={wallet.amount} onChange={(e) => setWallet({ ...wallet, amount: e.target.value })} />
                  <input className="input" placeholder={t('admin.reason')} value={wallet.reason} onChange={(e) => setWallet({ ...wallet, reason: e.target.value })} />
                  <button type="button" className="btn-primary" onClick={() => act(() => post(`/admin/users/${detail.user._id}/wallet`, { amount: Number(wallet.amount), reason: wallet.reason }), 'wallet.adjusted')}>{t('common.apply')}</button>
                </div>
              </div>
            </div>
            <div>
              <div className="label">{t('admin.recentOrders')}</div>
              {detail.recentOrders.map((o) => (
                <div key={o._id} className="flex justify-between border-b border-content/10 py-2 text-sm">
                  <span>{o.orderNumber} · {o.restaurant?.name}</span>
                  <StatusBadge status={o.status} />
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
      <Modal open={!!form} onClose={() => setForm(null)} title={t(form?._id ? 'common.edit' : 'admin.addUser')} footer={<button type="button" className="btn-primary" onClick={() => act(async () => { const body = { ...form, adminRole: form.adminRole || null }; if (!body.password) delete body.password; if (form._id) await put(`/admin/users/${form._id}`, body); else await post('/admin/users', body); setForm(null); }, 'user.saved')}>{t('common.save')}</button>}>
        {form && (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label={t('common.name')} value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <TextField label={t('auth.email')} value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            <TextField label={t('auth.phone')} value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <TextField label={t(form._id ? 'auth.newPassword' : 'auth.password')} type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} />
            {form.role === 'superadmin' ? (
              <TextField label={t('admin.role')} value={t('role.superadmin')} onChange={() => {}} disabled />
            ) : (
              <SelectField label={t('admin.role')} value={form.role} onChange={(v) => setForm({ ...form, role: v })} options={ROLES.filter((r) => r !== 'superadmin').map((r) => ({ value: r, label: t(`role.${r}`) }))} />
            )}
            {form.role === 'admin' && <SelectField label={t('admin.adminRole')} value={form.adminRole} onChange={(v) => setForm({ ...form, adminRole: v })} options={[{ value: '', label: t('admin.fullAccess') }, ...(roles.data?.roles || []).map((r) => ({ value: r._id, label: r.name }))]} />}
          </div>
        )}
      </Modal>
    </div>
  );
}
