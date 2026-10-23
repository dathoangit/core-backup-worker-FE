import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ApiError } from 'src/utils/api';
import { fetchMe, login as loginApi, logout as logoutApi } from './api';
import { clearLegacyAuthStorage } from './storage';
import { registerUnauthorizedHandler } from './unauthorized';
import type { AuthLoginRequest, AuthLoginResponse, AuthMeResponse, AuthRole } from './types';

function userFromLoginResponse(res: AuthLoginResponse): AuthMeResponse {
  return res.user;
}

type AuthContextValue = {
  isBootstrapping: boolean;
  isAuthenticated: boolean;
  user: AuthMeResponse | null;
  role: AuthRole | null;
  login: (body: AuthLoginRequest) => Promise<AuthMeResponse>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [user, setUser] = useState<AuthMeResponse | null>(null);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      /* cookie / session may already be gone */
    }
    setUser(null);
  }, []);

  useEffect(() => registerUnauthorizedHandler(() => {
    void logout();
  }), [logout]);

  const login = useCallback(async (body: AuthLoginRequest) => {
    const loginRes = await loginApi(body);
    const profile = userFromLoginResponse(loginRes);
    setUser(profile);
    return profile;
  }, []);

  useEffect(() => {
    let active = true;
    const bootstrap = async () => {
      clearLegacyAuthStorage();
      try {
        const profile = await fetchMe();
        if (active) {
          setUser(profile);
        }
      } catch (error) {
        if (active) {
          setUser(null);
        }
        if (!(error instanceof ApiError && error.status === 401)) {
          /* ignore network noise during boot; gate will redirect */
        }
      } finally {
        if (active) {
          setIsBootstrapping(false);
        }
      }
    };

    void bootstrap();
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isBootstrapping,
      isAuthenticated: Boolean(user),
      user,
      role: user?.role ?? null,
      login,
      logout,
    }),
    [isBootstrapping, login, logout, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
