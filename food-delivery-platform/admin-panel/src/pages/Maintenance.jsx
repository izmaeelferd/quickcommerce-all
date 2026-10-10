import PageHeader from '../components/PageHeader.jsx';
import Toggle from '../components/Toggle.jsx';
import ImageUpload from '../components/ImageUpload.jsx';
import { TextArea } from '../components/Field.jsx';
import { useT } from '../context/ConfigContext.jsx';
import useConfigSection from '../utils/useConfigSection';
import SaveBar from './_SaveBar.jsx';

const APPS = ['customer', 'vendor', 'delivery'];

export default function Maintenance() {
  const t = useT();
  const { draft, set, save, saving, dirty, reset } = useConfigSection('maintenance');
  if (!draft) return <div className="text-content/60">{t('common.loading')}</div>;
  const affected = draft.affectedApps || [];
  return (
    <div>
      <PageHeader title={t('admin.nav.maintenance')} subtitle={t('admin.maintenanceSubtitle')} />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className={`card space-y-5 ${draft.appInMaintenance ? 'ring-2 ring-danger' : ''}`}>
          <Toggle label={t('maintenance.toggle')} description={t('maintenance.toggleDesc')} checked={!!draft.appInMaintenance} onChange={(v) => set('appInMaintenance', v)} />
          <TextArea label={t('maintenance.message')} rows={4} value={draft.maintenanceMessage} onChange={(v) => set('maintenanceMessage', v)} />
          <div>
            <div className="label">{t('maintenance.affectedApps')}</div>
            <div className="flex flex-wrap gap-4">
              {APPS.map((a) => (
                <label key={a} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="accent-primary" checked={affected.includes(a)} onChange={(e) => set('affectedApps', e.target.checked ? [...affected, a] : affected.filter((x) => x !== a))} />
                  {t(`app.${a}`)}
                </label>
              ))}
            </div>
          </div>
          <Toggle label={t('maintenance.allowAdmins')} checked={!!draft.allowAdmins} onChange={(v) => set('allowAdmins', v)} />
        </div>
        <div className="card space-y-4">
          <ImageUpload label={t('maintenance.image')} value={draft.maintenanceImageUrl} onChange={(v) => set('maintenanceImageUrl', v)} folder="branding" />
          <div className="rounded-card bg-surface p-6 text-center">
            {draft.maintenanceImageUrl && <img src={draft.maintenanceImageUrl} alt="" className="mx-auto mb-4 h-32 object-contain" />}
            <div className="text-lg font-bold">{t('maintenance.title')}</div>
            <p className="mt-2 text-sm text-content/70">{draft.maintenanceMessage || t('maintenance.defaultMessage')}</p>
          </div>
        </div>
      </div>
      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={reset} />
    </div>
  );
}
