import { useConfig } from '../context/ConfigContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from './Toast.jsx';
import Toggle from './Toggle.jsx';
import { vendorApi } from '../services/vendor';
import { errorKey } from '../services/api';

export default function Navbar({ onMenu }) {
  const { config, t, language, setLanguage, dark, setDark } = useConfig();
  const { user, restaurant, setRestaurant, logout } = useAuth();
  const toast = useToast();
  const meta = Object.fromEntries((config?.languageMeta || []).map((l) => [l.code, l]));
  const toggleOpen = async (v) => {
    try {
      setRestaurant(await vendorApi.setStatus({ isOpen: v }));
    } catch (e) {
      toast(errorKey(e), 'error');
    }
  };
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-content/10 bg-background/90 px-4 py-3 backdrop-blur">
      <button type="button" className="btn-ghost px-2 lg:hidden" onClick={onMenu} aria-label={t('common.menu')}>☰</button>
      {restaurant && <Toggle label={t(restaurant.isOpen ? 'vendor.open' : 'vendor.closed')} checked={restaurant.isOpen} onChange={toggleOpen} />}
      <div className="flex-1" />
      {config?.languages?.length > 1 && (
        <select className="input w-auto" value={language} onChange={(e) => setLanguage(e.target.value)}>
          {config.languages.map((c) => <option key={c} value={c}>{meta[c]?.nativeName || meta[c]?.name || c.toUpperCase()}</option>)}
        </select>
      )}
      <button type="button" className="btn-ghost px-3" onClick={() => setDark(!dark)}>{dark ? '☀️' : '🌙'}</button>
      <span className="hidden text-sm font-semibold sm:block">{user?.name}</span>
      <button type="button" className="btn-outline" onClick={logout}>{t('auth.logout')}</button>
    </header>
  );
}
