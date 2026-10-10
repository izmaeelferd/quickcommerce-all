import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import RichTextEditor from '../components/RichTextEditor.jsx';
import { useT } from '../context/ConfigContext.jsx';
import useConfigSection from '../utils/useConfigSection';
import SaveBar from './_SaveBar.jsx';

const PAGES = ['privacyPolicy', 'termsAndConditions', 'refundPolicy', 'aboutUs'];

export default function LegalPages() {
  const t = useT();
  const [tab, setTab] = useState(PAGES[0]);
  const { draft, set, save, saving, dirty, reset } = useConfigSection('legal');
  if (!draft) return <div className="text-content/60">{t('common.loading')}</div>;
  return (
    <div>
      <PageHeader title={t('admin.nav.legal')} subtitle={t('admin.legalSubtitle')} />
      <div className="mb-4 flex flex-wrap gap-2">
        {PAGES.map((p) => (
          <button key={p} type="button" className={tab === p ? 'btn-primary' : 'btn-outline'} onClick={() => setTab(p)}>{t(`legal.page.${p}`)}</button>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="card">
          <RichTextEditor key={tab} value={draft[tab]} onChange={(v) => set(tab, v)} minHeight={480} />
        </div>
        <div className="card">
          <div className="mb-3 text-sm font-semibold text-content/60">{t('admin.livePreview')}</div>
          <div className="rte-content" dangerouslySetInnerHTML={{ __html: draft[tab] || '' }} />
        </div>
      </div>
      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={reset} />
    </div>
  );
}
