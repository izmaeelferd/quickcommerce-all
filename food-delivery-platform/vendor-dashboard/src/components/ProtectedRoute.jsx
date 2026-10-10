import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useT } from '../context/ConfigContext.jsx';

/** Requires a vendor session; vendors without a restaurant are sent to onboarding. */
export default function ProtectedRoute({ children, requireRestaurant = true }) {
  const { user, restaurant, loading } = useAuth();
  const t = useT();
  const loc = useLocation();
  if (loading) return <div className="p-10 text-center text-content/60">{t('common.loading')}</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requireRestaurant && !restaurant && loc.pathname !== '/settings') return <Navigate to="/settings" replace />;
  return children;
}
