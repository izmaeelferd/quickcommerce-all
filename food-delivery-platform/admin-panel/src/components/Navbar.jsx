import { useState } from 'react';
import { useConfig } from '../context/ConfigContext.jsx';
import Modal from './Modal.jsx';
import { useToast } from './Toast.jsx';
import { put, errorKey } from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar({ onMenu }) {
  const { config, t, language, setLanguage, dark, setDark } = useConfig();
  const { user, logout } = useAuth();
  const toast = useToast();
  const [pw, setPw] = useState(null);
  const savePw = async () => {
    try {
      await put('/users/change-password', { currentPassword: pw.current, newPassword: pw.next });
      toast('auth.passwordChanged');
      setPw(null);
    } catch (e) {
      toast(errorKey(e), 'error');
    }
  };
  const meta = Object.fromEntries((config?.languageMeta || []).map((l) => [l.code, l]));
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-content/10 bg-background/90 px-4 py-3 backdrop-blur">
      <button type="button" className="btn-ghost px-2 lg:hidden" onClick={onMenu} aria-label={t('common.menu')}>☰</button>
      <div className="flex-1" />
      {config?.languages?.length > 1 && (
        <select className="input w-auto" value={language} onChange={(e) => setLanguage(e.target.value)}>
          {config.languages.map((c) => (
            <option key={c} value={c}>{meta[c]?.nativeName || meta[c]?.name || c.toUpperCase()}</option>
          ))}
        </select>
      )}
      <button type="button" className="btn-ghost px-3" onClick={() => setDark(!dark)} title={t('settings.theme')}>{dark ? '☀️' : '🌙'}</button>
      <div className="hidden text-end sm:block">
        <div className="text-sm font-semibold">{user?.name}</div>
        <div className="text-xs text-content/60">{user?.adminRole?.name || t(`role.${user?.role}`)}</div>
      </div>
      <button type="button" className="btn-ghost" onClick={() => setPw({ current: '', next: '' })}>{t('settings.changePassword')}</button>
      <button type="button" className="btn-outline" onClick={logout}>{t('auth.logout')}</button>
      <Modal open={!!pw} onClose={() => setPw(null)} title={t('settings.changePassword')} size="sm" footer={<button type="button" className="btn-primary" disabled={!pw?.next || pw.next.length < 8} onClick={savePw}>{t('common.save')}</button>}>
        {pw && (
          <div className="space-y-3">
            <label className="label">{t('auth.currentPassword')}<input className="input mt-1" type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></label>
            <label className="label">{t('auth.newPassword')}<input className="input mt-1" type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></label>
          </div>
        )}
      </Modal>
    </header>
  );
}
