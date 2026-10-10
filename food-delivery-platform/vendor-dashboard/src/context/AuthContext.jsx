import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as auth from '../services/auth';
import { tokens } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!tokens.access) {
      setLoading(false);
      return;
    }
    try {
      const d = await auth.me();
      if (d.user.role !== 'vendor') {
        tokens.clear();
        return;
      }
      setUser(d.user);
      setRestaurant(d.restaurant || null);
    } catch (e) {
      tokens.clear();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const onExpired = () => setUser(null);
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, [refresh]);

  const login = async (id, pw) => {
    const d = await auth.login(id, pw);
    setUser(d.user);
    setRestaurant(d.restaurant || null);
  };

  const register = async (body) => {
    const d = await auth.register(body);
    setUser(d.user);
    setRestaurant(null);
  };

  const logout = async () => {
    await auth.logout();
    setUser(null);
    setRestaurant(null);
  };

  return <AuthContext.Provider value={{ user, restaurant, setRestaurant, loading, login, register, logout, refresh }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
