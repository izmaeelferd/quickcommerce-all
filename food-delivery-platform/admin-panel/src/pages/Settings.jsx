import PageHeader from '../components/PageHeader.jsx';
import ImageUpload from '../components/ImageUpload.jsx';
import DragDropList from '../components/DragDropList.jsx';
import Toggle from '../components/Toggle.jsx';
import { TextField, TextArea } from '../components/Field.jsx';
import { useT } from '../context/ConfigContext.jsx';
import useConfigSection from '../utils/useConfigSection';
import SaveBar from './_SaveBar.jsx';
import Icon from '../components/Icon.jsx';

/** Onboarding screens + app version gates (force update). */
export default function Settings() {
  const t = useT();
  const onboarding = useConfigSection('onboarding');
  const versions = useConfigSection('appVersions');
  if (!onboarding.draft || !versions.draft) return <div className="text-content/60">{t('common.loading')}</div>;
  const pages = (onboarding.draft.pages || []).map((p, i) => ({ ...p, _k: `${i}-${p.title}` }));
  const setPages = (list) => onboarding.set('pages', list.map(({ _k, ...p }, i) => ({ ...p, order: i + 1 })));

  return (
    <div className="space-y-8">
      <PageHeader title={t('admin.nav.settings')} subtitle={t('admin.settingsSubtitle')} />
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-bold">{t('admin.onboarding')}</h3>
          <div className="flex items-center gap-4">
            <Toggle label={t('common.enabled')} checked={!!onboarding.draft.enabled} onChange={(v) => onboarding.set('enabled', v)} />
            <button type="button" className="btn-outline" onClick={() => setPages([...pages, { title: '', description: '', imageUrl: '', order: pages.length + 1, _k: String(Date.now()) }])}>+ {t('admin.addPage')}</button>
          </div>
        </div>
        <DragDropList
          items={pages}
          getKey={(p) => p._k}
          onChange={setPages}
          renderItem={(p, i) => (
            <div className="card grid gap-4 md:grid-cols-[200px_1fr_auto]">
              <ImageUpload value={p.imageUrl} onChange={(v) => setPages(pages.map((x, j) => (j === i ? { ...x, imageUrl: v } : x)))} folder="onboarding" aspect="aspect-square" />
              <div className="space-y-3">
                <TextField label={t('common.title')} value={p.title} onChange={(v) => setPages(pages.map((x, j) => (j === i ? { ...x, title: v } : x)))} />
                <TextArea label={t('common.description')} value={p.description} onChange={(v) => setPages(pages.map((x, j) => (j === i ? { ...x, description: v } : x)))} />
              </div>
              <button type="button" className="btn-ghost self-start text-danger" onClick={() => setPages(pages.filter((_, j) => j !== i))}><Icon name="trash" className="h-4 w-4" title={t('common.delete')} /></button>
            </div>
          )}
        />
        <SaveBar dirty={onboarding.dirty} saving={onboarding.saving} onSave={onboarding.save} onReset={onboarding.reset} />
      </section>
      <section>
        <h3 className="mb-3 text-lg font-bold">{t('admin.appVersions')}</h3>
        <div className="grid gap-4 lg:grid-cols-3">
          {['customer', 'vendor', 'delivery'].map((app) => (
            <div key={app} className="card space-y-3">
              <div className="font-bold">{t(`app.${app}`)}</div>
              <TextField label={t('version.min')} value={versions.draft[app]?.minVersion} onChange={(v) => versions.set(`${app}.minVersion`, v)} />
              <TextField label={t('version.latest')} value={versions.draft[app]?.latestVersion} onChange={(v) => versions.set(`${app}.latestVersion`, v)} />
              <TextField label={t('version.android')} value={versions.draft[app]?.storeUrlAndroid} onChange={(v) => versions.set(`${app}.storeUrlAndroid`, v)} />
              <TextField label={t('version.ios')} value={versions.draft[app]?.storeUrlIos} onChange={(v) => versions.set(`${app}.storeUrlIos`, v)} />
              <Toggle label={t('version.force')} checked={!!versions.draft[app]?.forceUpdate} onChange={(v) => versions.set(`${app}.forceUpdate`, v)} />
            </div>
          ))}
        </div>
        <SaveBar dirty={versions.dirty} saving={versions.saving} onSave={versions.save} onReset={versions.reset} />
      </section>
    </div>
  );
}
