import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { User, AuthResponse } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('legalai_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('legalai_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const res = await api.get<User>('/auth/me');
      setUser(res.data);
      localStorage.setItem('legalai_user', JSON.stringify(res.data));
    } catch (err) {
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await api.post<AuthResponse>('/auth/login', { email, password });
    const { access_token } = res.data;
    localStorage.setItem('legalai_token', access_token);
    setToken(access_token);
    // Fetch full profile
    const profileRes = await api.get<User>('/auth/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    setUser(profileRes.data);
    localStorage.setItem('legalai_user', JSON.stringify(profileRes.data));
  };

  const register = async (email: string, password: string, fullName: string) => {
    const res = await api.post<AuthResponse>('/auth/register', {
      email,
      password,
      full_name: fullName,
    });
    const { access_token } = res.data;
    localStorage.setItem('legalai_token', access_token);
    setToken(access_token);
    const profileRes = await api.get<User>('/auth/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    setUser(profileRes.data);
    localStorage.setItem('legalai_user', JSON.stringify(profileRes.data));
  };

  const logout = () => {
    localStorage.removeItem('legalai_token');
    localStorage.removeItem('legalai_user');
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token && !!user;
  const isAdmin = !!user && (user.role === 'admin' || user.is_superuser);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isAdmin,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
