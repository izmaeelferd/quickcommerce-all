import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { useConfig } from './context/ConfigContext.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Orders from './pages/Orders.jsx';
import Menu from './pages/Menu.jsx';
import Categories from './pages/Categories.jsx';
import Payouts from './pages/Payouts.jsx';
import Timings from './pages/Timings.jsx';
import Settings from './pages/Settings.jsx';

export default function App() {
  const { config, error, t } = useConfig();
  if (!config && !error) return <div className="flex min-h-screen items-center justify-center text-content/60">…</div>;
  if (!config && error) return <div className="flex min-h-screen items-center justify-center p-6 text-center text-danger">{t('error.network')}</div>;
  if (config.maintenance?.appInMaintenance && (config.maintenance.affectedApps || []).includes('vendor')) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        {config.maintenance.maintenanceImageUrl && <img src={config.maintenance.maintenanceImageUrl} alt="" className="h-40 object-contain" />}
        <h1 className="text-2xl font-bold">{t('maintenance.title')}</h1>
        <p className="text-content/70">{config.maintenance.maintenanceMessage || t('maintenance.defaultMessage')}</p>
      </div>
    );
  }
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute requireRestaurant={false}><Layout /></ProtectedRoute>}>
        <Route index element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="menu" element={<ProtectedRoute><Menu /></ProtectedRoute>} />
        <Route path="categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
        <Route path="payouts" element={<ProtectedRoute><Payouts /></ProtectedRoute>} />
        <Route path="timings" element={<ProtectedRoute><Timings /></ProtectedRoute>} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
