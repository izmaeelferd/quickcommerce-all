import { useT } from '../context/ConfigContext.jsx';

/** Sticky save/discard bar shown while a config draft has unsaved changes. */
export default function SaveBar({ dirty, saving, onSave, onReset }) {
  const t = useT();
  if (!dirty) return null;
  return (
    <div className="sticky bottom-4 z-10 mt-6 flex items-center justify-between gap-4 rounded-card border border-primary/30 bg-background p-4 shadow-lg">
      <span className="text-sm font-medium">{t('admin.unsavedChanges')}</span>
      <div className="flex gap-2">
        <button type="button" className="btn-ghost" onClick={onReset}>{t('common.discard')}</button>
        <button type="button" className="btn-primary" disabled={saving} onClick={() => onSave()}>{saving ? t('common.saving') : t('common.save')}</button>
      </div>
    </div>
  );
}
