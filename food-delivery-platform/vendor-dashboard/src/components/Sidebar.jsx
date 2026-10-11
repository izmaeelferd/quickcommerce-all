import { NavLink } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import Icon from './Icon.jsx';

const NAV = [
  { to: '/', key: 'vendor.nav.dashboard', icon: 'dashboard' },
  { to: '/orders', key: 'vendor.nav.orders', icon: 'receipt' },
  { to: '/menu', key: 'vendor.nav.menu', icon: 'utensils' },
  { to: '/categories', key: 'vendor.categories', icon: 'folder' },
  { to: '/payouts', key: 'vendor.earnings', icon: 'wallet' },
  { to: '/timings', key: 'vendor.timings', icon: 'clock' },
  { to: '/reviews', key: 'restaurant.reviews', icon: 'star' },
  { to: '/settings', key: 'settings.title', icon: 'settings' },
];

export default function Sidebar({ open, onClose }) {
  const { config, t } = useConfig();
  const { restaurant } = useAuth();
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-scrim/40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 z-40 w-64 transform border-e border-content/10 bg-background transition lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full'}`}>
        <div className="flex items-center gap-3 px-5 py-5">
          {restaurant?.logo || config?.theme?.appIconUrl ? <img src={restaurant?.logo || config.theme.appIconUrl} alt="" className="h-9 w-9 rounded-btn object-cover" /> : <div className="h-9 w-9 rounded-btn bg-primary" />}
          <div className="min-w-0">
            <div className="truncate font-extrabold leading-tight">{restaurant?.name || config?.branding?.vendorAppName}</div>
            <div className="text-xs text-content/60">{config?.branding?.vendorAppName}</div>
          </div>
        </div>
        <nav className="space-y-1 px-3">
          {NAV.map((i) => (
            <NavLink key={i.to} to={i.to} end={i.to === '/'} onClick={onClose} className={({ isActive }) => `flex items-center gap-3 rounded-btn px-3 py-2 text-sm font-medium ${isActive ? 'bg-primary/10 text-primary' : 'text-content/75 hover:bg-content/5'}`}>
              <Icon name={i.icon} className="h-5 w-5 shrink-0" />
              {t(i.key)}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
