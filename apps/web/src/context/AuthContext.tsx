import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api, refreshAccessToken, setAccessToken, setSessionExpiredHandler } from '../lib/apiClient';
import type { AuthResponse, AuthUser, ProfileUpdate } from '../lib/types';

interface AuthContextValue {
  user: AuthUser | null;
  /** True until the initial silent refresh settles, so guards don't flash. */
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  /** `profile` carries the optional fields; pass `{}` to register with none. */
  register: (
    email: string,
    password: string,
    profile?: Record<string, unknown>,
  ) => Promise<void>;
  updateProfile: (patch: ProfileUpdate) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Non-secret hint set alongside the httpOnly refresh cookie. Its absence means
 * there is definitely no session, letting a guest skip the refresh round-trip.
 * Its presence is only a hint — the server still decides.
 */
function hasSessionHint(): boolean {
  return document.cookie.split('; ').some((c) => c.startsWith('rentwise_session='));
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On first mount, try to trade the httpOnly refresh cookie for an access
  // token. This is what keeps a session alive across a page reload, since the
  // access token itself only ever lives in memory.
  useEffect(() => {
    let cancelled = false;

    if (!hasSessionHint()) {
      setIsLoading(false);
      return;
    }

    (async () => {
      try {
        const refreshed = await refreshAccessToken();
        if (cancelled) return;

        if (refreshed) {
          setUser(await api.get<AuthUser>('/api/auth/me'));
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // When a refresh finally fails mid-session, drop the user so guarded routes
  // bounce to /login instead of rendering against a dead session.
  useEffect(() => {
    setSessionExpiredHandler(() => {
      setAccessToken(null);
      setUser(null);
    });
    return () => setSessionExpiredHandler(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<AuthResponse>(
      '/api/auth/login',
      { email, password },
      { skipAuthRetry: true },
    );
    setAccessToken(res.accessToken);
    setUser(res.user);
  }, []);

  const register = useCallback(
    async (email: string, password: string, profile: Record<string, unknown> = {}) => {
      // `profile` is already stripped of blank fields by toProfilePayload, so
      // an empty object registers with no optional data at all.
      const res = await api.post<AuthResponse>(
        '/api/auth/register',
        { email, password, ...profile },
        { skipAuthRetry: true },
      );
      setAccessToken(res.accessToken);
      setUser(res.user);
    },
    [],
  );

  const updateProfile = useCallback(async (patch: ProfileUpdate) => {
    const updated = await api.patch<AuthUser>('/api/auth/me', patch);
    setUser(updated);
    return updated;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout', undefined, { skipAuthRetry: true });
    } catch {
      // Even if the revoke call fails, clear local state — the user asked to
      // be signed out and the cookie expires on its own.
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      login,
      register,
      updateProfile,
      logout,
    }),
    [user, isLoading, login, register, updateProfile, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside an AuthProvider');
  return ctx;
}
