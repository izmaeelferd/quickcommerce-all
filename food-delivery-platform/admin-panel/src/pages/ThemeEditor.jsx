import PageHeader from '../components/PageHeader.jsx';
import ColorPicker from '../components/ColorPicker.jsx';
import ImageUpload from '../components/ImageUpload.jsx';
import LivePreview from '../components/LivePreview.jsx';
import Toggle from '../components/Toggle.jsx';
import { TextField, SelectField } from '../components/Field.jsx';
import { useT } from '../context/ConfigContext.jsx';
import useConfigSection from '../utils/useConfigSection';
import SaveBar from './_SaveBar.jsx';

const COLORS = ['primaryColor', 'secondaryColor', 'accentColor', 'backgroundColor', 'surfaceColor', 'textColor', 'successColor', 'warningColor', 'errorColor', 'vegColor', 'nonVegColor', 'splashBackgroundColor'];
const FONTS = ['Poppins', 'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Nunito', 'Rubik', 'Work Sans', 'DM Sans', 'Noto Sans', 'Cairo', 'Tajawal', 'Hind'];

function Slider({ label, value, min, max, step = 1, onChange, unit = '' }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm"><span className="font-medium">{label}</span><span className="text-content/60">{value}{unit}</span></div>
      <input type="range" className="w-full accent-primary" min={min} max={max} step={step} value={value ?? min} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

export default function ThemeEditor() {
  const t = useT();
  const { draft, set, save, saving, dirty, reset } = useConfigSection('theme');
  if (!draft) return <div className="text-content/60">{t('common.loading')}</div>;
  return (
    <div>
      <PageHeader title={t('admin.nav.theme')} subtitle={t('admin.themeSubtitle')} />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="card">
            <h3 className="mb-4 font-bold">{t('admin.colors')}</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {COLORS.map((k) => <ColorPicker key={k} label={t(`theme.${k}`)} value={draft[k]} onChange={(v) => set(k, v)} />)}
            </div>
          </div>
          <div className="card grid gap-5 sm:grid-cols-2">
            <h3 className="font-bold sm:col-span-2">{t('admin.typographyShape')}</h3>
            <SelectField label={t('theme.fontFamily')} value={draft.fontFamily} onChange={(v) => set('fontFamily', v)} options={[...new Set([draft.fontFamily, ...FONTS])].filter(Boolean).map((f) => ({ value: f, label: f }))} />
            <TextField label={t('theme.customFont')} hint={t('theme.customFontHint')} value={draft.fontFamily} onChange={(v) => set('fontFamily', v)} />
            <Slider label={t('theme.appFontScale')} value={draft.appFontScale} min={0.8} max={1.4} step={0.05} onChange={(v) => set('appFontScale', v)} unit="×" />
            <Slider label={t('theme.buttonRadius')} value={draft.buttonRadius} min={0} max={32} onChange={(v) => set('buttonRadius', v)} unit="px" />
            <Slider label={t('theme.cardRadius')} value={draft.cardRadius} min={0} max={32} onChange={(v) => set('cardRadius', v)} unit="px" />
            <Slider label={t('theme.inputRadius')} value={draft.inputRadius} min={0} max={32} onChange={(v) => set('inputRadius', v)} unit="px" />
            <Slider label={t('theme.splashDuration')} value={draft.splashDuration} min={0} max={6000} step={250} onChange={(v) => set('splashDuration', v)} unit="ms" />
            <div className="flex items-end"><Toggle label={t('theme.darkModeDefault')} checked={draft.darkModeDefault} onChange={(v) => set('darkModeDefault', v)} /></div>
          </div>
          <div className="card grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <h3 className="font-bold sm:col-span-2 lg:col-span-4">{t('admin.logosIcons')}</h3>
            <ImageUpload label={t('theme.appIconUrl')} value={draft.appIconUrl} onChange={(v) => set('appIconUrl', v)} folder="branding" aspect="aspect-square" />
            <ImageUpload label={t('theme.splashLogoUrl')} value={draft.splashLogoUrl} onChange={(v) => set('splashLogoUrl', v)} folder="branding" aspect="aspect-square" />
            <ImageUpload label={t('theme.adminLogoUrl')} value={draft.adminLogoUrl} onChange={(v) => set('adminLogoUrl', v)} folder="branding" aspect="aspect-square" />
            <ImageUpload label={t('theme.faviconUrl')} value={draft.faviconUrl} onChange={(v) => set('faviconUrl', v)} folder="branding" aspect="aspect-square" />
          </div>
        </div>
        <div className="xl:sticky xl:top-20 xl:self-start">
          <div className="mb-2 text-center text-sm font-semibold text-content/60">{t('admin.livePreview')}</div>
          <LivePreview theme={draft} />
        </div>
      </div>
      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={reset} />
    </div>
  );
}
