import { useEffect } from 'react';
import { useT } from '../context/ConfigContext.jsx';

export default function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  const t = useT();
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  const widths = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl', xl: 'max-w-6xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-scrim/50 p-4" onMouseDown={onClose}>
      <div className={`card my-8 w-full ${widths[size]}`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          <button type="button" className="btn-ghost px-2 py-1" onClick={onClose} aria-label={t('common.close')}>✕</button>
        </div>
        <div>{children}</div>
        {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmModal({ open, onClose, onConfirm, titleKey, messageKey, danger = true }) {
  const t = useT();
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t(titleKey)}
      size="sm"
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>{t('common.cancel')}</button>
          <button type="button" className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm}>{t('common.confirm')}</button>
        </>
      }
    >
      {messageKey && <p className="text-sm text-content/70">{t(messageKey)}</p>}
    </Modal>
  );
}
