import PageHeader from '../components/PageHeader.jsx';
import Toggle from '../components/Toggle.jsx';
import { useT } from '../context/ConfigContext.jsx';
import useConfigSection from '../utils/useConfigSection';
import SaveBar from './_SaveBar.jsx';

const GROUPS = {
  'features.group.commerce': ['wallet', 'coupons', 'tipping', 'deliveryPartnerTips', 'scheduleOrder', 'referral'],
  'features.group.discovery': ['reviews', 'favorites', 'vegOnlyFilter', 'searchFilters', 'onboarding', 'darkModeToggle'],
  'features.group.tracking': ['liveTracking', 'chatWithVendor', 'deliveryOtp', 'deliveryPhotoProof'],
  'features.group.auth': ['googleSignIn', 'appleSignIn', 'otpLogin'],
  'features.group.notifications': ['pushNotifications', 'emailNotifications', 'smsNotifications'],
};

export default function FeatureFlags() {
  const t = useT();
  const { draft, set, save, saving, dirty, reset } = useConfigSection('features');
  if (!draft) return <div className="text-content/60">{t('common.loading')}</div>;
  const known = new Set(Object.values(GROUPS).flat());
  const extra = Object.keys(draft).filter((k) => !known.has(k));
  const groups = extra.length ? { ...GROUPS, 'features.group.other': extra } : GROUPS;
  return (
    <div>
      <PageHeader title={t('admin.nav.features')} subtitle={t('admin.featuresSubtitle')} />
      <div className="grid gap-6 lg:grid-cols-2">
        {Object.entries(groups).map(([g, keys]) => (
          <div key={g} className="card space-y-4">
            <h3 className="font-bold">{t(g)}</h3>
            {keys.map((k) => <Toggle key={k} label={t(`feature.${k}`)} description={t(`feature.${k}Desc`)} checked={!!draft[k]} onChange={(v) => set(k, v)} />)}
          </div>
        ))}
      </div>
      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={reset} />
    </div>
  );
}
