import { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken } from './api';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!getToken());

  useEffect(() => {
    if (!getToken()) return;
    api.get('/auth/me').then((d) => setUser(d.user)).catch(() => localStorage.removeItem('token')).finally(() => setLoading(false));
  }, []);

  const finish = (d) => {
    localStorage.setItem('token', d.token);
    setUser(d.user);
    return d.user;
  };
  const value = {
    user, loading, setUser,
    login: (email, password) => api.post('/auth/login', { email, password }).then(finish),
    adminLogin: (email, password) => api.post('/auth/admin-login', { email, password }).then(finish),
    register: (form) => api.post('/auth/register', form).then(finish),
    logout: () => { localStorage.removeItem('token'); setUser(null); },
    isAdmin: user && ['admin', 'superadmin'].includes(user.role),
    isSuper: user?.role === 'superadmin',
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);
