import { Itinerary, TripMemberInfo, UserSearchInfo, Expense, Settlement, BalanceSummary, Message } from '../types';

const API_BASE = '/api/itineraries';

// Token management — the access token is stored in memory via the auth context.
// We accept a getter function so the service can always retrieve the latest token.
let getTokenFn: ((forceRefresh?: boolean) => Promise<string | null>) | null = null;

export function setTokenGetter(fn: (forceRefresh?: boolean) => Promise<string | null>) {
  getTokenFn = fn;
}

async function authHeaders(): Promise<HeadersInit> {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (getTokenFn) {
    const token = await getTokenFn();
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

async function handleResponse(res: Response) {
  if (res.status === 401) {
    if (getTokenFn) {
      const newToken = await getTokenFn(true);
      if (newToken) {
        return null; // Signals the caller to retry the request
      }
    }
    throw new Error('Session expired. Please sign in again.');
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(data.message || 'Request failed');
  }
  return res.json();
}

export const apiService = {
  async getSavedTrips(): Promise<Itinerary[]> {
    const response = await fetch(API_BASE, {
      headers: await authHeaders(),
      credentials: 'include',
    });
    const data = await handleResponse(response);
    if (data === null) {
      // Retry after refresh
      const retryRes = await fetch(API_BASE, {
        headers: await authHeaders(),
        credentials: 'include',
      });
      return retryRes.json();
    }
    return data;
  },

  async saveItinerary(itinerary: Itinerary): Promise<Itinerary> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: await authHeaders(),
      credentials: 'include',
      body: JSON.stringify(itinerary),
    });
    const data = await handleResponse(response);
    if (data === null) {
      const retryRes = await fetch(API_BASE, {
        method: 'POST',
        headers: await authHeaders(),
        credentials: 'include',
        body: JSON.stringify(itinerary),
      });
      return retryRes.json();
    }
    return data;
  },

  async deleteItinerary(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
      headers: await authHeaders(),
      credentials: 'include',
    });
    const data = await handleResponse(response);
    if (data === null) {
      await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
        headers: await authHeaders(),
        credentials: 'include',
      });
    }
  },

  async getFavorites(): Promise<any[]> {
    const response = await fetch('/api/favorites', {
      headers: await authHeaders(),
      credentials: 'include',
    });
    const data = await handleResponse(response);
    if (data === null) {
      const retryRes = await fetch('/api/favorites', {
        headers: await authHeaders(),
        credentials: 'include',
      });
      return retryRes.json();
    }
    return data;
  },

  async addFavorite(destination: any): Promise<any[]> {
    const response = await fetch('/api/favorites', {
      method: 'POST',
      headers: await authHeaders(),
      credentials: 'include',
      body: JSON.stringify(destination),
    });
    const data = await handleResponse(response);
    if (data === null) {
      const retryRes = await fetch('/api/favorites', {
        method: 'POST',
        headers: await authHeaders(),
        credentials: 'include',
        body: JSON.stringify(destination),
      });
      return retryRes.json();
    }
    return data;
  },

  async removeFavorite(name: string): Promise<any[]> {
    const response = await fetch(`/api/favorites/${encodeURIComponent(name)}`, {
      method: 'DELETE',
      headers: await authHeaders(),
      credentials: 'include',
    });
    const data = await handleResponse(response);
    if (data === null) {
      const retryRes = await fetch(`/api/favorites/${encodeURIComponent(name)}`, {
        method: 'DELETE',
        headers: await authHeaders(),
        credentials: 'include',
      });
      return retryRes.json();
    }
    return data;
  },

  // Collaborative features
  async updateItinerary(id: string, itinerary: Partial<Itinerary>): Promise<Itinerary> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: await authHeaders(),
      credentials: 'include',
      body: JSON.stringify(itinerary),
    });
    const data = await handleResponse(response);
    if (data === null) {
      const retryRes = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: await authHeaders(),
        credentials: 'include',
        body: JSON.stringify(itinerary),
      });
      return retryRes.json();
    }
    return data;
  },

  async getTripMembers(id: string): Promise<TripMemberInfo[]> {
    const response = await fetch(`${API_BASE}/${id}/members`, {
      headers: await authHeaders(),
      credentials: 'include',
    });
    const data = await handleResponse(response);
    if (data === null) {
      const retryRes = await fetch(`${API_BASE}/${id}/members`, {
        headers: await authHeaders(),
        credentials: 'include',
      });
      return retryRes.json();
    }
    return data;
  },

  async addTripMember(id: string, targetUserId: string, role: string = 'member'): Promise<TripMemberInfo> {
    const response = await fetch(`${API_BASE}/${id}/members`, {
      method: 'POST',
      headers: await authHeaders(),
      credentials: 'include',
      body: JSON.stringify({ targetUserId, role }),
    });
    const data = await handleResponse(response);
    if (data === null) {
      const retryRes = await fetch(`${API_BASE}/${id}/members`, {
        method: 'POST',
        headers: await authHeaders(),
        credentials: 'include',
        body: JSON.stringify({ targetUserId, role }),
      });
      return retryRes.json();
    }
    return data;
  },

  async leaveTrip(id: string, userId: string = 'me'): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}/members/${userId}`, {
      method: 'DELETE',
      headers: await authHeaders(),
      credentials: 'include',
    });
    const data = await handleResponse(response);
    if (data === null) {
      await fetch(`${API_BASE}/${id}/members/${userId}`, {
        method: 'DELETE',
        headers: await authHeaders(),
        credentials: 'include',
      });
    }
  },

  async searchUsers(query: string): Promise<UserSearchInfo[]> {
    const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
      headers: await authHeaders(),
      credentials: 'include',
    });
    const data = await handleResponse(response);
    if (data === null) {
      const retryRes = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
        headers: await authHeaders(),
        credentials: 'include',
      });
      return retryRes.json();
    }
    return data;
  },

  // --- Expenses & Settlements ---
  async getExpenses(tripId: string): Promise<Expense[]> {
    const response = await fetch(`${API_BASE}/${tripId}/expenses`, {
      headers: await authHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  async addExpense(tripId: string, expense: any): Promise<Expense> {
    const response = await fetch(`${API_BASE}/${tripId}/expenses`, {
      method: 'POST',
      headers: await authHeaders(),
      credentials: 'include',
      body: JSON.stringify(expense),
    });
    return handleResponse(response);
  },

  async deleteExpense(tripId: string, expenseId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${tripId}/expenses/${expenseId}`, {
      method: 'DELETE',
      headers: await authHeaders(),
      credentials: 'include',
    });
    await handleResponse(response);
  },

  async getSettlements(tripId: string): Promise<Settlement[]> {
    const response = await fetch(`${API_BASE}/${tripId}/settlements`, {
      headers: await authHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  async addSettlement(tripId: string, settlement: any): Promise<Settlement> {
    const response = await fetch(`${API_BASE}/${tripId}/settlements`, {
      method: 'POST',
      headers: await authHeaders(),
      credentials: 'include',
      body: JSON.stringify(settlement),
    });
    return handleResponse(response);
  },

  async getBalanceSummary(tripId: string): Promise<BalanceSummary> {
    const response = await fetch(`${API_BASE}/${tripId}/expenses/summary`, {
      headers: await authHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  // --- Group Chat ---
  async getTripMessages(tripId: string): Promise<Message[]> {
    const response = await fetch(`/api/itineraries/${tripId}/messages`, {
      headers: await authHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  async sendTripMessage(tripId: string, formData: FormData): Promise<Message> {
    const headers = await authHeaders();
    // Delete Content-Type from headers so the browser sets it correctly for multipart/form-data
    const { 'Content-Type': _, ...rest } = headers as any;
    
    const response = await fetch(`/api/itineraries/${tripId}/messages`, {
      method: 'POST',
      headers: rest,
      credentials: 'include',
      body: formData,
    });
    return handleResponse(response);
  }
};
