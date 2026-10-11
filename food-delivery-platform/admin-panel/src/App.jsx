import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { useConfig } from './context/ConfigContext.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ThemeEditor from './pages/ThemeEditor.jsx';
import BrandingEditor from './pages/BrandingEditor.jsx';
import LayoutBuilder from './pages/LayoutBuilder.jsx';
import BannerManager from './pages/BannerManager.jsx';
import FeatureFlags from './pages/FeatureFlags.jsx';
import BusinessRules from './pages/BusinessRules.jsx';
import LanguageManager from './pages/LanguageManager.jsx';
import LegalPages from './pages/LegalPages.jsx';
import Maintenance from './pages/Maintenance.jsx';
import Orders from './pages/Orders.jsx';
import Vendors from './pages/Vendors.jsx';
import Restaurants from './pages/Restaurants.jsx';
import Categories from './pages/Categories.jsx';
import DeliveryPartners from './pages/DeliveryPartners.jsx';
import Users from './pages/Users.jsx';
import Transactions from './pages/Transactions.jsx';
import Coupons from './pages/Coupons.jsx';
import Commission from './pages/Commission.jsx';
import Reports from './pages/Reports.jsx';
import Notifications from './pages/Notifications.jsx';
import AdminRoles from './pages/AdminRoles.jsx';
import Settings from './pages/Settings.jsx';
import Reviews from './pages/Reviews.jsx';

const guarded = (perm, el) => <ProtectedRoute permission={perm}>{el}</ProtectedRoute>;

export default function App() {
  const { config, error, t } = useConfig();
  if (!config && !error) return <div className="flex min-h-screen items-center justify-center text-content/60">…</div>;
  if (!config && error) return <div className="flex min-h-screen items-center justify-center p-6 text-center text-danger">{t('error.network')}</div>;
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={guarded('dashboard', <Dashboard />)} />
        <Route path="config/theme" element={guarded('config', <ThemeEditor />)} />
        <Route path="config/branding" element={guarded('config', <BrandingEditor />)} />
        <Route path="config/layout" element={guarded('config', <LayoutBuilder />)} />
        <Route path="config/banners" element={guarded('banners', <BannerManager />)} />
        <Route path="config/features" element={guarded('config', <FeatureFlags />)} />
        <Route path="config/business" element={guarded('config', <BusinessRules />)} />
        <Route path="config/languages" element={guarded('translations', <LanguageManager />)} />
        <Route path="config/legal" element={guarded('legal', <LegalPages />)} />
        <Route path="config/maintenance" element={guarded('config', <Maintenance />)} />
        <Route path="orders" element={guarded('orders', <Orders />)} />
        <Route path="vendors" element={guarded('vendors', <Vendors />)} />
        <Route path="restaurants" element={guarded('restaurants', <Restaurants />)} />
        <Route path="categories" element={guarded('categories', <Categories />)} />
        <Route path="reviews" element={guarded('restaurants', <Reviews />)} />
        <Route path="delivery-partners" element={guarded('delivery', <DeliveryPartners />)} />
        <Route path="users" element={guarded('users', <Users />)} />
        <Route path="transactions" element={guarded('transactions', <Transactions />)} />
        <Route path="coupons" element={guarded('coupons', <Coupons />)} />
        <Route path="commission" element={guarded('settings', <Commission />)} />
        <Route path="reports" element={guarded('reports', <Reports />)} />
        <Route path="notifications" element={guarded('notifications', <Notifications />)} />
        <Route path="roles" element={guarded('roles', <AdminRoles />)} />
        <Route path="settings" element={guarded('settings', <Settings />)} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
