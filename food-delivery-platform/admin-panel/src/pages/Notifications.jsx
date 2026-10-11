import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import ImageUpload from '../components/ImageUpload.jsx';
import { TextField, TextArea, SelectField } from '../components/Field.jsx';
import { useConfig } from '../context/ConfigContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { get, post, errorKey } from '../services/api';
import { formatDate } from '../utils/format';
import useAsync from '../utils/useAsync';

const CHANNELS = ['push', 'inapp', 'email', 'sms'];

export default function Notifications() {
  const { t, language, feature } = useConfig();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const history = useAsync(() => get('/admin/notifications', { page }), [page]);
  const [form, setForm] = useState({ audience: 'customer', title: '', body: '', imageUrl: '', channels: ['push', 'inapp'], userIds: '' });
  const [sending, setSending] = useState(false);

  const allowed = (c) => c === 'inapp' || feature(`${c === 'push' ? 'push' : c}Notifications`);

  const send = async () => {
    setSending(true);
    try {
      const ids = form.userIds.split(',').map((s) => s.trim()).filter(Boolean);
      const res = await post('/admin/notifications/send', { ...form, userIds: ids, channels: form.channels.filter(allowed) });
      toast('notification.sentTo', 'success', { n: res.recipients });
      setForm({ ...form, title: '', body: '', imageUrl: '' });
      history.reload();
    } catch (e) {
      toast(errorKey(e), 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <PageHeader title={t('admin.nav.notifications')} subtitle={t('admin.notificationsSubtitle')} />
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="card space-y-4">
          <SelectField label={t('notification.audience')} value={form.audience} onChange={(v) => setForm({ ...form, audience: v })} options={['all', 'customer', 'vendor', 'delivery'].map((a) => ({ value: a, label: t(`audience.${a}`) }))} />
          <TextField label={t('notification.userIds')} hint={t('notification.userIdsHint')} value={form.userIds} onChange={(v) => setForm({ ...form, userIds: v })} />
          <TextField label={t('notification.title')} value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
          <TextArea label={t('notification.body')} value={form.body} onChange={(v) => setForm({ ...form, body: v })} />
          <ImageUpload label={t('notification.image')} value={form.imageUrl} onChange={(v) => setForm({ ...form, imageUrl: v })} folder="notifications" />
          <div>
            <div className="label">{t('notification.channels')}</div>
            <div className="flex flex-wrap gap-4">
              {CHANNELS.map((c) => (
                <label key={c} className={`flex items-center gap-2 text-sm ${allowed(c) ? '' : 'opacity-40'}`} title={allowed(c) ? '' : t('feature.disabled')}>
                  <input type="checkbox" className="accent-primary" disabled={!allowed(c)} checked={form.channels.includes(c)} onChange={(e) => setForm({ ...form, channels: e.target.checked ? [...form.channels, c] : form.channels.filter((x) => x !== c) })} />
                  {t(`channel.${c}`)}
                </label>
              ))}
            </div>
          </div>
          <button type="button" className="btn-primary w-full" disabled={!form.title || sending} onClick={send}>{sending ? t('common.sending') : t('notification.send')}</button>
        </div>
        <DataTable
          loading={history.loading}
          rows={history.data?.items}
          pagination={history.data?.pagination}
          onPage={setPage}
          columns={[
            { key: 'date', label: t('common.date'), render: (n) => formatDate(n.createdAt, language) },
            { key: 'title', label: t('notification.title'), render: (n) => <div><div className="font-semibold">{n.title}</div><div className="text-xs text-content/60">{n.body}</div></div> },
            { key: 'audience', label: t('notification.audience'), render: (n) => t(`audience.${n.audience}`) },
            { key: 'channels', label: t('notification.channels'), render: (n) => n.channels?.map((c) => t(`channel.${c}`)).join(', ') },
            { key: 'by', label: t('admin.sentBy'), render: (n) => n.sentBy?.name },
          ]}
        />
      </div>
    </div>
  );
}
