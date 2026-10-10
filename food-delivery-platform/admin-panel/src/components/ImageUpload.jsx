import { useRef, useState } from 'react';
import { uploadImage, errorKey } from '../services/api';
import { useT } from '../context/ConfigContext.jsx';
import { useToast } from './Toast.jsx';

export default function ImageUpload({ label, value, onChange, folder = 'admin', aspect = 'aspect-video', className = '' }) {
  const t = useT();
  const toast = useToast();
  const input = useRef(null);
  const [busy, setBusy] = useState(false);

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    try {
      onChange(await uploadImage(f, folder));
    } catch (err) {
      toast(errorKey(err), 'error');
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  return (
    <div className={className}>
      {label && <label className="label">{label}</label>}
      <div className={`relative flex ${aspect} w-full items-center justify-center overflow-hidden rounded-card border-2 border-dashed border-content/15 bg-surface`}>
        {value ? <img src={value} alt="" className="h-full w-full object-contain" /> : <span className="text-sm text-content/50">{t('upload.none')}</span>}
        {busy && <div className="absolute inset-0 flex items-center justify-center bg-background/70 text-sm">{t('upload.uploading')}</div>}
      </div>
      <div className="mt-2 flex gap-2">
        <button type="button" className="btn-outline px-3 py-1 text-sm" onClick={() => input.current?.click()}>{t('upload.choose')}</button>
        {value && <button type="button" className="btn-ghost px-3 py-1 text-sm" onClick={() => onChange('')}>{t('common.remove')}</button>}
      </div>
      <input className="input mt-2 text-xs" placeholder={t('upload.orUrl')} value={value || ''} onChange={(e) => onChange(e.target.value)} />
      <input ref={input} type="file" accept="image/*" hidden onChange={onFile} />
    </div>
  );
}
