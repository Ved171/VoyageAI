import { Itinerary, TripMemberInfo, UserSearchInfo, Expense, Settlement, BalanceSummary, Message } from '../types';

/**
 * BASE URL configuration
 * Removes trailing slashes to prevent issues like //api/favorites
 */
const VITE_API_URL = import.meta.env.VITE_API_URL || '';
const BASE_URL = VITE_API_URL.endsWith('/') ? VITE_API_URL.slice(0, -1) : VITE_API_URL;

let getTokenFn: ((forceRefresh?: boolean) => Promise<string | null>) | null = null;

export function setTokenGetter(fn: (forceRefresh?: boolean) => Promise<string | null>) {
  getTokenFn = fn;
}

/**
 * Centralized fetch wrapper that handles:
 * 1. Attaching Authorization headers (Access Token)
 * 2. Including credentials (HTTP-only Refresh Cookie)
 * 3. Detecting 401/403 errors and triggering a refresh
 * 4. Retrying the original request after a successful refresh
 */
async function fetchWithAuth(url: string, init: RequestInit = {}): Promise<any> {
  const getHeaders = async (tokenOverride?: string | null) => {
    const headers = new Headers(init.headers || {});
    // Don't set Content-Type if body is FormData (browser needs to set boundary)
    if (!(init.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const token = tokenOverride !== undefined ? tokenOverride : (getTokenFn ? await getTokenFn() : null);
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  };

  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  
  // 1. Initial attempt
  let response = await fetch(fullUrl, {
    ...init,
    headers: await getHeaders(),
    credentials: 'include',
  });

  // 2. Handle 401 Unauthorized or 403 Forbidden (Token expired or invalid)
  if ((response.status === 401 || response.status === 403) && getTokenFn) {
    console.warn(`Auth failed (${response.status}) for ${url}. Attempting token refresh...`);
    const newToken = await getTokenFn(true); // Force refresh
    
    if (newToken) {
      console.log(`Token refresh successful for ${url}, retrying request...`);
      // 3. Retry with new token
      response = await fetch(fullUrl, {
        ...init,
        headers: await getHeaders(newToken),
        credentials: 'include',
      });
    } else {
      console.error(`Token refresh failed for ${url}. User must re-authenticate.`);
      throw new Error('Session expired. Please sign in again.');
    }
  }

  // 4. Handle other errors
  if (!response.ok) {
    const data = await response.json().catch(() => ({ message: `Request failed with status ${response.status}` }));
    throw new Error(data.message || data.error || 'Request failed');
  }

  // Support empty responses or JSON
  if (response.status === 204) return null;
  return response.json();
}

export const apiService = {
  // Itineraries
  getSavedTrips(): Promise<Itinerary[]> {
    return fetchWithAuth('/api/itineraries');
  },

  saveItinerary(itinerary: Itinerary): Promise<Itinerary> {
    return fetchWithAuth('/api/itineraries', {
      method: 'POST',
      body: JSON.stringify(itinerary),
    });
  },

  deleteItinerary(id: string): Promise<void> {
    return fetchWithAuth(`/api/itineraries/${id}`, {
      method: 'DELETE',
    });
  },

  updateItinerary(id: string, itinerary: Partial<Itinerary>): Promise<Itinerary> {
    return fetchWithAuth(`/api/itineraries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(itinerary),
    });
  },

  // Favorites
  getFavorites(): Promise<any[]> {
    return fetchWithAuth('/api/favorites');
  },

  addFavorite(destination: any): Promise<any[]> {
    return fetchWithAuth('/api/favorites', {
      method: 'POST',
      body: JSON.stringify(destination),
    });
  },

  removeFavorite(name: string): Promise<any[]> {
    return fetchWithAuth(`/api/favorites/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });
  },

  // Collaboration
  getTripMembers(id: string): Promise<TripMemberInfo[]> {
    return fetchWithAuth(`/api/itineraries/${id}/members`);
  },

  addTripMember(id: string, targetUserId: string, role: string = 'member'): Promise<TripMemberInfo> {
    return fetchWithAuth(`/api/itineraries/${id}/members`, {
      method: 'POST',
      body: JSON.stringify({ targetUserId, role }),
    });
  },

  leaveTrip(id: string, userId: string = 'me'): Promise<void> {
    return fetchWithAuth(`/api/itineraries/${id}/members/${userId}`, {
      method: 'DELETE',
    });
  },

  searchUsers(query: string): Promise<UserSearchInfo[]> {
    return fetchWithAuth(`/api/users/search?q=${encodeURIComponent(query)}`);
  },

  // Expenses & Settlements
  getExpenses(tripId: string): Promise<Expense[]> {
    return fetchWithAuth(`/api/itineraries/${tripId}/expenses`);
  },

  addExpense(tripId: string, expense: any): Promise<Expense> {
    return fetchWithAuth(`/api/itineraries/${tripId}/expenses`, {
      method: 'POST',
      body: JSON.stringify(expense),
    });
  },

  deleteExpense(tripId: string, expenseId: string): Promise<void> {
    return fetchWithAuth(`/api/itineraries/${tripId}/expenses/${expenseId}`, {
      method: 'DELETE',
    });
  },

  getSettlements(tripId: string): Promise<Settlement[]> {
    return fetchWithAuth(`/api/itineraries/${tripId}/settlements`);
  },

  addSettlement(tripId: string, settlement: any): Promise<Settlement> {
    return fetchWithAuth(`/api/itineraries/${tripId}/settlements`, {
      method: 'POST',
      body: JSON.stringify(settlement),
    });
  },

  getBalanceSummary(tripId: string): Promise<BalanceSummary> {
    return fetchWithAuth(`/api/itineraries/${tripId}/expenses/summary`);
  },

  // Group Chat
  getTripMessages(tripId: string): Promise<Message[]> {
    return fetchWithAuth(`/api/itineraries/${tripId}/messages`);
  },

  sendTripMessage(tripId: string, formData: FormData): Promise<Message> {
    return fetchWithAuth(`/api/itineraries/${tripId}/messages`, {
      method: 'POST',
      body: formData,
    });
  },
};
