import Constants from 'expo-constants';
import { Platform } from 'react-native';

function getBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Extract host IP dynamically from Expo packager connection
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    const match = hostUri.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/);
    if (match) {
      return `http://${match[0]}:3001`;
    }
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3001';
  }

  return 'http://localhost:3001';
}

const BASE_URL = getBaseUrl();

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}`;
    try {
      const errData = await response.json();
      errorMsg = errData.error || errData.message || errorMsg;
    } catch {
      try {
        const text = await response.text();
        if (text) errorMsg = text;
      } catch {
        // Fallback
      }
    }
    throw new Error(errorMsg);
  }

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('text/csv')) {
    return response.text() as Promise<T>;
  }

  return response.json();
}

export interface PositionFilters {
  status?: string;
  ticker?: string;
  sort?: string;
}

export const api = {
  register: async (username: string, password: string, email?: string) => {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, email }),
    });
    return handleResponse(response);
  },

  login: async (username: string, password: string) => {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return handleResponse(response);
  },

  getDashboard: async () => {
    const response = await fetch(`${BASE_URL}/dashboard`);
    return handleResponse(response);
  },

  getPositions: async (filters: PositionFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.ticker) params.append('ticker', filters.ticker);
    if (filters.sort) params.append('sort', filters.sort);

    const response = await fetch(`${BASE_URL}/positions?${params.toString()}`);
    return handleResponse(response);
  },

  getTickers: async () => {
    const response = await fetch(`${BASE_URL}/tickers`);
    return handleResponse(response);
  },

  createPosition: async (data: Record<string, unknown>) => {
    const response = await fetch(`${BASE_URL}/positions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  getPositionDetail: async (id: string | number) => {
    const response = await fetch(`${BASE_URL}/positions/${id}/detail`);
    return handleResponse(response);
  },

  updatePosition: async (id: string | number, data: Record<string, unknown>) => {
    const response = await fetch(`${BASE_URL}/positions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  deletePosition: async (id: string | number) => {
    const response = await fetch(`${BASE_URL}/positions/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  createTrade: async (positionId: string | number, data: Record<string, unknown>) => {
    const response = await fetch(`${BASE_URL}/positions/${positionId}/trades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  closeTrade: async (tradeId: string | number, closePrice: number) => {
    const response = await fetch(`${BASE_URL}/trades/${tradeId}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ close_price: closePrice }),
    });
    return handleResponse(response);
  },

  expireTrade: async (tradeId: string | number) => {
    const response = await fetch(`${BASE_URL}/trades/${tradeId}/expire`, {
      method: 'POST',
    });
    return handleResponse(response);
  },

  assignTrade: async (tradeId: string | number) => {
    const response = await fetch(`${BASE_URL}/trades/${tradeId}/assign`, {
      method: 'POST',
    });
    return handleResponse(response);
  },

  assessTrade: async (
    tradeId: string | number,
    currentUnderlyingPrice: number,
    currentOptionPrice: number,
  ) => {
    const response = await fetch(`${BASE_URL}/trades/${tradeId}/assess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentUnderlyingPrice, currentOptionPrice }),
    });
    return handleResponse(response);
  },

  getStatistics: async () => {
    const response = await fetch(`${BASE_URL}/statistics`);
    return handleResponse(response);
  },

  exportPositionsCSV: async () => {
    const response = await fetch(`${BASE_URL}/export/positions`);
    return handleResponse(response);
  },
};
