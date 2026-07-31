import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AuthenticationRequest, User } from '../types/auth';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: AuthenticationRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      setTimeout(() => {
        setUser({
          id: 'user-id',
          email: 'user@example.com',
          role: 'MEMBER'
        });
      }, 1000);
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: AuthenticationRequest) => {
    const data = await authService.login(credentials);
    if (data.token) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated: !!token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}