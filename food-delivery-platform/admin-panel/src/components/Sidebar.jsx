import { NavLink } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import Icon from './Icon.jsx';

export const NAV = [
  { group: 'admin.nav.overview', items: [{ to: '/', key: 'admin.nav.dashboard', icon: 'dashboard', perm: 'dashboard' }] },
  {
    group: 'admin.nav.configuration',
    items: [
      { to: '/config/theme', key: 'admin.nav.theme', icon: 'palette', perm: 'config' },
      { to: '/config/branding', key: 'admin.nav.branding', icon: 'tag', perm: 'config' },
      { to: '/config/layout', key: 'admin.nav.layout', icon: 'layout', perm: 'config' },
      { to: '/config/banners', key: 'admin.nav.banners', icon: 'image', perm: 'banners' },
      { to: '/config/features', key: 'admin.nav.features', icon: 'flag', perm: 'config' },
      { to: '/config/business', key: 'admin.nav.business', icon: 'scale', perm: 'config' },
      { to: '/config/languages', key: 'admin.nav.languages', icon: 'globe', perm: 'translations' },
      { to: '/config/legal', key: 'admin.nav.legal', icon: 'document', perm: 'legal' },
      { to: '/config/maintenance', key: 'admin.nav.maintenance', icon: 'wrench', perm: 'config' },
    ],
  },
  {
    group: 'admin.nav.operations',
    items: [
      { to: '/orders', key: 'admin.nav.orders', icon: 'receipt', perm: 'orders' },
      { to: '/vendors', key: 'admin.nav.vendors', icon: 'userCheck', perm: 'vendors' },
      { to: '/restaurants', key: 'admin.nav.restaurants', icon: 'store', perm: 'restaurants' },
      { to: '/categories', key: 'admin.nav.categories', icon: 'folder', perm: 'categories' },
      { to: '/reviews', key: 'admin.nav.reviews', icon: 'star', perm: 'restaurants' },
      { to: '/delivery-partners', key: 'admin.nav.delivery', icon: 'truck', perm: 'delivery' },
      { to: '/users', key: 'admin.nav.users', icon: 'users', perm: 'users' },
    ],
  },
  {
    group: 'admin.nav.finance',
    items: [
      { to: '/transactions', key: 'admin.nav.transactions', icon: 'card', perm: 'transactions' },
      { to: '/coupons', key: 'admin.nav.coupons', icon: 'tag', perm: 'coupons' },
      { to: '/commission', key: 'admin.nav.commission', icon: 'percent', perm: 'settings' },
      { to: '/reports', key: 'admin.nav.reports', icon: 'chart', perm: 'reports' },
    ],
  },
  {
    group: 'admin.nav.system',
    items: [
      { to: '/notifications', key: 'admin.nav.notifications', icon: 'bell', perm: 'notifications' },
      { to: '/roles', key: 'admin.nav.roles', icon: 'shield', perm: 'roles' },
      { to: '/settings', key: 'admin.nav.settings', icon: 'settings', perm: 'settings' },
    ],
  },
];

export default function Sidebar({ open, onClose }) {
  const { config, t } = useConfig();
  const { can } = useAuth();
  const logo = config?.theme?.adminLogoUrl || config?.theme?.appIconUrl;
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-scrim/40 lg:hidden" onClick={onClose} />}
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
                    <Icon name={i.icon} className="h-5 w-5 shrink-0" />
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
