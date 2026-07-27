import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { api } from '@/services/api';
import { SafeStorage } from '@/utils/storage';

const STORAGE_KEY = 'acacia_user';

export interface User {
  id: number;
  username: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<unknown>;
  register: (username: string, password: string, email?: string) => Promise<unknown>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const savedUser = await SafeStorage.getItem(STORAGE_KEY);
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch {
        await SafeStorage.removeItem(STORAGE_KEY);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const data = (await api.login(username, password)) as { user?: User };
    if (data.user) {
      setUser(data.user);
      await SafeStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
    }
    return data;
  }, []);

  const register = useCallback(async (username: string, password: string, email?: string) => {
    const data = (await api.register(username, password, email)) as { user?: User };
    if (data.user) {
      setUser(data.user);
      await SafeStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
    }
    return data;
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    await SafeStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
