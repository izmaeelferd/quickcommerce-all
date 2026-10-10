import { NavLink } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export const NAV = [
  { group: 'admin.nav.overview', items: [{ to: '/', key: 'admin.nav.dashboard', icon: '📊', perm: 'dashboard' }] },
  {
    group: 'admin.nav.configuration',
    items: [
      { to: '/config/theme', key: 'admin.nav.theme', icon: '🎨', perm: 'config' },
      { to: '/config/branding', key: 'admin.nav.branding', icon: '🏷️', perm: 'config' },
      { to: '/config/layout', key: 'admin.nav.layout', icon: '🧩', perm: 'config' },
      { to: '/config/banners', key: 'admin.nav.banners', icon: '🖼️', perm: 'banners' },
      { to: '/config/features', key: 'admin.nav.features', icon: '🚩', perm: 'config' },
      { to: '/config/business', key: 'admin.nav.business', icon: '⚖️', perm: 'config' },
      { to: '/config/languages', key: 'admin.nav.languages', icon: '🌐', perm: 'translations' },
      { to: '/config/legal', key: 'admin.nav.legal', icon: '📜', perm: 'legal' },
      { to: '/config/maintenance', key: 'admin.nav.maintenance', icon: '🛠️', perm: 'config' },
    ],
  },
  {
    group: 'admin.nav.operations',
    items: [
      { to: '/orders', key: 'admin.nav.orders', icon: '🧾', perm: 'orders' },
      { to: '/vendors', key: 'admin.nav.vendors', icon: '✅', perm: 'vendors' },
      { to: '/restaurants', key: 'admin.nav.restaurants', icon: '🍽️', perm: 'restaurants' },
      { to: '/categories', key: 'admin.nav.categories', icon: '🗂️', perm: 'categories' },
      { to: '/delivery-partners', key: 'admin.nav.delivery', icon: '🛵', perm: 'delivery' },
      { to: '/users', key: 'admin.nav.users', icon: '👥', perm: 'users' },
    ],
  },
  {
    group: 'admin.nav.finance',
    items: [
      { to: '/transactions', key: 'admin.nav.transactions', icon: '💳', perm: 'transactions' },
      { to: '/coupons', key: 'admin.nav.coupons', icon: '🏷', perm: 'coupons' },
      { to: '/commission', key: 'admin.nav.commission', icon: '％', perm: 'settings' },
      { to: '/reports', key: 'admin.nav.reports', icon: '📈', perm: 'reports' },
    ],
  },
  {
    group: 'admin.nav.system',
    items: [
      { to: '/notifications', key: 'admin.nav.notifications', icon: '🔔', perm: 'notifications' },
      { to: '/roles', key: 'admin.nav.roles', icon: '🛡️', perm: 'roles' },
      { to: '/settings', key: 'admin.nav.settings', icon: '⚙️', perm: 'settings' },
    ],
  },
];

export default function Sidebar({ open, onClose }) {
  const { config, t } = useConfig();
  const { can } = useAuth();
  const logo = config?.theme?.adminLogoUrl || config?.theme?.appIconUrl;
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 z-40 w-64 transform overflow-y-auto border-e border-content/10 bg-background transition lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full'}`}>
        <div className="flex items-center gap-3 px-5 py-5">
          {logo ? <img src={logo} alt="" className="h-9 w-9 rounded-btn object-cover" /> : <div className="h-9 w-9 rounded-btn bg-primary" />}
          <div>
            <div className="font-extrabold leading-tight">{config?.branding?.appName}</div>
            <div className="text-xs text-content/60">{t('admin.title')}</div>
          </div>
        </div>
        <nav className="space-y-5 px-3 pb-8">
          {NAV.map((g) => {
            const items = g.items.filter((i) => can(i.perm));
            if (!items.length) return null;
            return (
              <div key={g.group}>
                <div className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-content/40">{t(g.group)}</div>
                {items.map((i) => (
                  <NavLink
                    key={i.to}
                    to={i.to}
                    end={i.to === '/'}
                    onClick={onClose}
                    className={({ isActive }) => `flex items-center gap-3 rounded-btn px-3 py-2 text-sm font-medium ${isActive ? 'bg-primary/10 text-primary' : 'text-content/75 hover:bg-content/5'}`}
                  >
                    <span className="w-5 text-center">{i.icon}</span>
                    {t(i.key)}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
