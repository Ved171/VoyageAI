import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  isInitializing: boolean;
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

function persistSession(token: string | null, user: User | null = null) {
  try {
    if (token) {
      sessionStorage.setItem(ACCESS_STORAGE_KEY, token);
      localStorage.setItem(ACCESS_STORAGE_KEY, token);
      if (user) {
        sessionStorage.setItem('voyageai_user', JSON.stringify(user));
        localStorage.setItem('voyageai_user', JSON.stringify(user));
      }
    } else {
      sessionStorage.removeItem(ACCESS_STORAGE_KEY);
      localStorage.removeItem(ACCESS_STORAGE_KEY);
      sessionStorage.removeItem('voyageai_user');
      localStorage.removeItem('voyageai_user');
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
          // Normal behavior if user is logged out or session naturally expired. 
          // We fail silently without spamming the browser console.
          return null;
        }

        const data = await res.json();
        if (!data?.accessToken) return null;

        setUser(data.user);
        setAccessToken(data.accessToken);
        persistSession(data.accessToken, data.user);
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
    persistSession(null);
  }, []);

  const restoreSessionFromStoredAccessToken = useCallback(async (): Promise<boolean> => {
    const stored = readStoredAccessToken();
    if (!stored || !looksLikeJwt(stored)) {
      persistSession(null);
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
        persistSession(null);
        return false;
      }

      if (!res.ok) return false;

      const data = await res.json();
      if (!data?.user) return false;

      setUser(data.user);
      setAccessToken(stored);
      persistSession(stored, data.user);
      return true;
    } catch {
      return false;
    }
  }, []);

  // Using a ref to track initialization and prevent double-firing in StrictMode
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const initAuth = async () => {
      try {
        // 1. Check local storage for immediate "Likely Valid" hint and cached user to prevent flicker
        const stored = readStoredAccessToken();
        const likelyValid = stored && looksLikeJwt(stored) && isAccessTokenLikelyValid(stored);

        let cachedUser: User | null = null;
        try {
          const userStr = localStorage.getItem('voyageai_user') || sessionStorage.getItem('voyageai_user');
          if (userStr) cachedUser = JSON.parse(userStr);
        } catch(e) {}

        if (likelyValid && cachedUser) {
          setAccessToken(stored);
          setUser(cachedUser);
          // Set loading false early ONLY IF we have both a valid token and user.
          // This entirely prevents the login screen flicker while background refresh happens.
          setIsLoading(false);
        }

        // 2. SEQUENTIAL Initialization: Try silent refresh FIRST
        // This is much safer than parallel requests which compete for the rotation cookie
        const refreshResult = await silentRefresh();

        if (!refreshResult) {
          // 3. Fallback: silentRefresh failed, try to restore from stored token only if we haven't already
          if (!likelyValid) {
            const restored = await restoreSessionFromStoredAccessToken();
            if (!restored) {
              clearSession();
            }
          } else {
            // Our "likely valid" token was actually invalid according to the server
            const restored = await restoreSessionFromStoredAccessToken();
            if (!restored) {
              clearSession();
            }
          }
        }
      } catch (err) {
        console.error('Boot phase auth verification failed:', err);
      } finally {
        setIsLoading(false);
      }
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
    persistSession(data.accessToken, data.user);
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
    persistSession(data.accessToken, data.user);
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
