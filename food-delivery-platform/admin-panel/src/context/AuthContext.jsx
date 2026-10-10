import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as auth from '../services/auth';
import { tokens } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const bootstrap = useCallback(async () => {
    if (!tokens.access) {
      setLoading(false);
      return;
    }
    try {
      const u = await auth.me();
      if (['admin', 'superadmin'].includes(u.role)) setUser(u);
      else tokens.clear();
    } catch (e) {
      tokens.clear();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
    const onExpired = () => setUser(null);
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, [bootstrap]);

  const login = async (id, pw) => {
    const u = await auth.login(id, pw);
    const full = await auth.me();
    setUser(full || u);
  };

  const logout = async () => {
    await auth.logout();
    setUser(null);
  };

  /** RBAC: superadmin or admins without a role have all permissions. */
  const can = (perm) => {
    if (!user) return false;
    if (user.role === 'superadmin' || !user.adminRole) return true;
    return (user.adminRole.permissions || []).includes(perm);
  };

  return <AuthContext.Provider value={{ user, loading, login, logout, can }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
