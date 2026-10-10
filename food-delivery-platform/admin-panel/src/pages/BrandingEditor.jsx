import PageHeader from '../components/PageHeader.jsx';
import { TextField, TextArea } from '../components/Field.jsx';
import { useT } from '../context/ConfigContext.jsx';
import useConfigSection from '../utils/useConfigSection';
import SaveBar from './_SaveBar.jsx';

const SOCIALS = ['facebook', 'instagram', 'twitter', 'youtube', 'linkedin'];

export default function BrandingEditor() {
  const t = useT();
  const { draft, set, save, saving, dirty, reset } = useConfigSection('branding');
  if (!draft) return <div className="text-content/60">{t('common.loading')}</div>;
  return (
    <div>
      <PageHeader title={t('admin.nav.branding')} subtitle={t('admin.brandingSubtitle')} />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card space-y-4">
          <h3 className="font-bold">{t('admin.identity')}</h3>
          <TextField label={t('branding.appName')} value={draft.appName} onChange={(v) => set('appName', v)} />
          <TextField label={t('branding.appTagline')} value={draft.appTagline} onChange={(v) => set('appTagline', v)} />
          <TextField label={t('branding.vendorAppName')} value={draft.vendorAppName} onChange={(v) => set('vendorAppName', v)} />
          <TextField label={t('branding.deliveryAppName')} value={draft.deliveryAppName} onChange={(v) => set('deliveryAppName', v)} />
          <TextField label={t('branding.copyright')} value={draft.copyright} onChange={(v) => set('copyright', v)} />
        </div>
        <div className="card space-y-4">
          <h3 className="font-bold">{t('admin.supportContacts')}</h3>
          <TextField label={t('branding.supportEmail')} type="email" value={draft.supportEmail} onChange={(v) => set('supportEmail', v)} />
          <TextField label={t('branding.supportPhone')} value={draft.supportPhone} onChange={(v) => set('supportPhone', v)} />
          <TextField label={t('branding.whatsappNumber')} value={draft.whatsappNumber} onChange={(v) => set('whatsappNumber', v)} />
          <TextField label={t('branding.websiteUrl')} value={draft.websiteUrl} onChange={(v) => set('websiteUrl', v)} />
          <TextArea label={t('branding.address')} value={draft.address} onChange={(v) => set('address', v)} />
        </div>
        <div className="card space-y-4 lg:col-span-2">
          <h3 className="font-bold">{t('admin.socialLinks')}</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SOCIALS.map((s) => <TextField key={s} label={t(`social.${s}`)} value={draft.socialLinks?.[s]} onChange={(v) => set(`socialLinks.${s}`, v)} />)}
          </div>
        </div>
      </div>
      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={reset} />
    </div>
  );
}
