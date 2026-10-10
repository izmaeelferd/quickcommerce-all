import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useT } from '../context/ConfigContext.jsx';

export default function ProtectedRoute({ permission, children }) {
  const { user, loading, can } = useAuth();
  const t = useT();
  if (loading) return <div className="p-10 text-center text-content/60">{t('common.loading')}</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (permission && !can(permission)) return <div className="card m-6 text-center">{t('admin.noPermission')}</div>;
  return children;
}
