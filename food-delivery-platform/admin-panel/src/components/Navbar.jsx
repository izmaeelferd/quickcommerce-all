import { useConfig } from '../context/ConfigContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar({ onMenu }) {
  const { config, t, language, setLanguage, dark, setDark } = useConfig();
  const { user, logout } = useAuth();
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
      <button type="button" className="btn-outline" onClick={logout}>{t('auth.logout')}</button>
    </header>
  );
}
