import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { setTokenGetter } from '../services/apiService';

const BASE_URL = import.meta.env.VITE_API_URL || '';

/** Backup when httpOnly refresh cookie is not sent (common on mobile / cross-origin). */
const ACCESS_STORAGE_KEY = 'voyageai_access';

// To prevent concurrent refreshes from overlapping globally
let globalRefreshPromise: Promise<string | null> | null = null;

const authFetchInit = {
  credentials: 'include' as RequestCredentials,
  cache: 'no-store' as RequestCache,
};

interface User {
  _id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: (forceRefresh?: boolean) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

function getJwtExp(token: string): number | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded)) as { exp?: number };
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

function looksLikeJwt(token: string): boolean {
  return token.split('.').length === 3 && token.length > 20;
}

/** Client-side hint only; server validates on /me and API calls. */
function isAccessTokenLikelyValid(token: string, skewMs = 60_000): boolean {
  const exp = getJwtExp(token);
  if (exp === null) return true;
  // Ensure token is valid for at least skewMs more
  return exp * 1000 > Date.now() + skewMs;
}

function persistAccessToken(token: string | null) {
  try {
    if (token) {
      sessionStorage.setItem(ACCESS_STORAGE_KEY, token);
      localStorage.setItem(ACCESS_STORAGE_KEY, token);
    } else {
      sessionStorage.removeItem(ACCESS_STORAGE_KEY);
      localStorage.removeItem(ACCESS_STORAGE_KEY);
    }
  } catch {
    // private mode / quota
  }
}

function readStoredAccessToken(): string | null {
  try {
    return sessionStorage.getItem(ACCESS_STORAGE_KEY) || localStorage.getItem(ACCESS_STORAGE_KEY);
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Refresh access token using httpOnly cookie. Does NOT clear user/session on failure —
   * clearing only happens when the access token is expired and refresh failed (see getAccessToken / init).
   */
  const silentRefresh = useCallback(async (): Promise<string | null> => {
    // If a refresh is already in progress, return the existing promise
    if (globalRefreshPromise) return globalRefreshPromise;

    globalRefreshPromise = (async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
          method: 'POST',
          ...authFetchInit,
        });

        if (!res.ok) {
          if (res.status === 403) {
            const data = await res.json().catch(() => ({}));
            console.warn(`Refresh rejected by server (403): ${data.message || 'unknown error'}`);
          }
          return null;
        }

        const data = await res.json();
        if (!data?.accessToken) return null;

        setUser(data.user);
        setAccessToken(data.accessToken);
        persistAccessToken(data.accessToken);
        return data.accessToken;
      } catch (err: any) {
        console.error('Silent refresh failed:', err.message);
        return null;
      } finally {
        globalRefreshPromise = null;
      }
    })();

    return globalRefreshPromise;
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    persistAccessToken(null);
  }, []);

  const restoreSessionFromStoredAccessToken = useCallback(async (): Promise<boolean> => {
    const stored = readStoredAccessToken();
    if (!stored || !looksLikeJwt(stored)) {
      persistAccessToken(null);
      return false;
    }

    try {
      const res = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${stored}`,
        },
        ...authFetchInit,
      });

      if (res.status === 401 || res.status === 403) {
        persistAccessToken(null);
        return false;
      }

      if (!res.ok) return false;

      const data = await res.json();
      if (!data?.user) return false;

      setUser(data.user);
      setAccessToken(stored);
      persistAccessToken(stored);
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const fromCookie = await silentRefresh();
      if (!fromCookie) {
        const restored = await restoreSessionFromStoredAccessToken();
        if (!restored) {
          clearSession();
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, [silentRefresh, restoreSessionFromStoredAccessToken, clearSession]);

  const getAccessToken = useCallback(
    async (forceRefresh = false): Promise<string | null> => {
      // 1. Return current token if it's still likely valid and no force refresh is requested.
      if (!forceRefresh && accessToken && isAccessTokenLikelyValid(accessToken)) {
        return accessToken;
      }

      // 2. We need a fresh token. Attempt silent refresh from httpOnly cookie.
      // silentRefresh() itself has a global deduplication promise.
      const refreshed = await silentRefresh();
      if (refreshed) return refreshed;

      // 3. Fallback: silentRefresh failed. 
      // If the failure was due to network/server being DOWN, we should NOT clearSession if the current token is still valid.
      // But if we're here, it means the server didn't give us a fresh token.
      
      // Check if our current (old) token is still valid (using 0 skew margin for one last attempt).
      if (accessToken && isAccessTokenLikelyValid(accessToken, 0)) {
        console.warn('getAccessToken: silentRefresh failed, but old token appears valid according to our clock. Using it as fallback.');
        return accessToken;
      }

      // 4. Session appears definitively invalid OR refresh failed and we have no fallback.
      // Don't clear if it was likely a temporary network error? 
      // Currently silentRefresh returns null for ALL errors. 
      // But clearing here is what triggers the redirect to /login.
      console.warn('getAccessToken: Session definitively expired or refresh failed. Clearing session.');
      clearSession();
      return null;
    },
    [accessToken, silentRefresh, clearSession]
  );

  // Wire the token getter directly in the render body to ensure it's available 
  // before children (Destinations, Favorites, etc.) mount and try to use it.
  setTokenGetter(getAccessToken);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      ...authFetchInit,
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');

    setUser(data.user);
    setAccessToken(data.accessToken);
    persistAccessToken(data.accessToken);
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const res = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      ...authFetchInit,
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Signup failed');

    setUser(data.user);
    setAccessToken(data.accessToken);
    persistAccessToken(data.accessToken);
  }, []);

  const logout = useCallback(async () => {
    try {
      if (accessToken) {
        await fetch(`${BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
          ...authFetchInit,
        });
      }
    } catch {
      // ignore
    } finally {
      clearSession();
    }
  }, [accessToken, clearSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
