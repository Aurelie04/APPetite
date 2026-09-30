import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { authApi } from '../api/client.js';

const STORAGE_KEY = 'appetite.session';
const AuthContext = createContext(null);

function readStoredSession() {
  const raw = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readStoredSession);

  const saveSession = useCallback((data, remember) => {
    const next = { token: data.token, user: data.user };
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    (remember ? localStorage : sessionStorage).setItem(STORAGE_KEY, JSON.stringify(next));
    setSession(next);
  }, []);

  const login = useCallback(
    async (credentials, remember) => {
      const data = await authApi.login(credentials);
      saveSession(data, remember);
      return data.user;
    },
    [saveSession],
  );

  const register = useCallback(
    async (accountType, payload) => {
      const data =
        accountType === 'restaurant' ? await authApi.registerRestaurant(payload) : await authApi.registerClient(payload);
      saveSession(data, true);
      return data.user;
    },
    [saveSession],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      isAuthenticated: Boolean(session?.token),
      login,
      register,
      logout,
    }),
    [session, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
