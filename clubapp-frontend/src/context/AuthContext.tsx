import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AuthenticationRequest, AuthenticationResponse, User } from '../types/auth';
import { authService } from '../services/authService';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: AuthenticationRequest) => Promise<void>;
  setSession: (token: string, user: User | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getStoredItem = (key: string) => localStorage.getItem(key) ?? sessionStorage.getItem(key);

/**
 * Decodifica el payload (claims) de un JWT sin librerías externas.
 * Se usa como respaldo para reconstruir la información del usuario cuando
 * la respuesta del backend no incluye el objeto `user` completo.
 */
function decodeJwt(token: string): User | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const payload = JSON.parse(jsonPayload);
    return {
      id: payload.sub ?? payload.nameid ?? payload.id,
      firstName: payload.given_name ?? payload.unique_name ?? payload.name,
      lastName: payload.family_name,
      email: payload.email,
      role: (payload.role ?? 'MEMBER') as User['role'],
    };
  } catch {
    return null;
  }
}

/**
 * Verifica si un token JWT ha expirado (validación del lado del cliente).
 */
function isTokenExpired(token: string): boolean {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return true;

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const payload = JSON.parse(jsonPayload);
    const exp = payload.exp;
    if (!exp) return true;
    
    // exp está en segundos, Date.now() en milisegundos
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      const savedToken = getStoredItem('token');
      const savedUser = getStoredItem('user');

      if (savedToken) {
        // Validación rápida del lado del cliente: verificar expiración del JWT
        if (isTokenExpired(savedToken)) {
          console.log('[Auth] Token expirado, limpiando sesión');
          clearSession();
          if (mounted) setIsLoading(false);
          return;
        }

        // Token no expirado localmente, validar con el backend
        // El endpoint /authentication/validate-token devuelve 401 si el token es inválido
        // El interceptor de api.ts limpiará la sesión automáticamente en ese caso
        try {
          await api.get('/authentication/validate-token');
        } catch {
          // El interceptor de respuesta ya limpió la sesión si fue 401
          // Si llegamos aquí, la sesión fue invalidada
          if (mounted) {
            setIsLoading(false);
            setToken(null);
            setUser(null);
          }
          return;
        }

        // Si llegamos aquí sin que el interceptor haya limpiado, asumimos token válido
        setToken(savedToken);

        let parsedUser: User | null = null;
        if (savedUser) {
          try {
            parsedUser = JSON.parse(savedUser) as User;
          } catch {
            parsedUser = null;
          }
        }

        // Si no hay usuario persistido, intentamos reconstruirlo desde el JWT
        if (!parsedUser) parsedUser = decodeJwt(savedToken);

        if (parsedUser && mounted) {
          setUser(parsedUser);
          // Sincronizamos el usuario en localStorage para futuras recargas
          localStorage.setItem('user', JSON.stringify(parsedUser));
        } else if (mounted) {
          setUser(null);
        }
      } else {
        // No hay token guardado
        clearSession();
      }

      if (mounted) setIsLoading(false);
    };

    const clearSession = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      setToken(null);
      setUser(null);
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  /**
   * Persiste la sesión de forma atómica: guarda el token y el usuario
   * en localStorage y actualiza el estado global de inmediato.
   */
  const setSession = (newToken: string, newUser: User | null) => {
    const sessionUser = newUser ?? decodeJwt(newToken);

    localStorage.setItem('token', newToken);
    setToken(newToken);

    if (sessionUser) {
      localStorage.setItem('user', JSON.stringify(sessionUser));
      setUser(sessionUser);
    } else {
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const login = async (credentials: AuthenticationRequest) => {
    const data: AuthenticationResponse = await authService.login(credentials);

    if (!data.token) {
      throw new Error('No se recibió un token de autenticación.');
    }

    setSession(data.token, data.user ?? null);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token,
        isLoading,
        login,
        setSession,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}