/**
 * Acacia Trades — API Service Layer
 * Direct connection to the backend API (no Vite proxy)
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Determine the backend base URL based on platform
function getBaseUrl(): string {
  // In production, you'd use your deployed API URL
  const PORT = 3001;

  if (Platform.OS === 'web') {
    return `http://localhost:${PORT}`;
  }

  // For Expo Go on a real device, use the dev server host (your Mac's LAN IP)
  const debuggerHost =
    Constants.expoConfig?.hostUri ?? Constants.manifest?.debuggerHost;

  if (debuggerHost) {
    const host = debuggerHost.split(':')[0];
    return `http://${host}:${PORT}`;
  }

  // Fallback for emulators
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${PORT}`; // Android emulator alias for host
  }

  return `http://localhost:${PORT}`;
}

const BASE_URL = getBaseUrl();

async function handleResponse(response: Response): Promise<any> {
  if (!response.ok) {
    let errorMsg = 'An error occurred';
    try {
      const errData = await response.json();
      errorMsg = errData.error || errData.message || errorMsg;
    } catch (_e) {
      // Ignore if not JSON
    }
    throw new Error(errorMsg);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/csv')) {
    return response.text();
  }

  return response.json();
}

export const api = {
  // ─── Auth ─────────────────────────────────────────────────
  login: async (username: string, password: string) => {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return handleResponse(response);
  },

  // ─── Dashboard ────────────────────────────────────────────
  getDashboard: async () => {
    const response = await fetch(`${BASE_URL}/dashboard`);
    return handleResponse(response);
  },

  // ─── Positions ────────────────────────────────────────────
  getPositions: async (filters: {
    status?: string;
    ticker?: string;
    sort?: string;
  } = {}) => {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== 'all')
      params.append('status', filters.status);
    if (filters.ticker) params.append('ticker', filters.ticker);
    if (filters.sort) params.append('sort', filters.sort);

    const response = await fetch(
      `${BASE_URL}/positions?${params.toString()}`
    );
    return handleResponse(response);
  },

  getTickers: async () => {
    const response = await fetch(`${BASE_URL}/tickers`);
    return handleResponse(response);
  },

  createPosition: async (data: any) => {
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

  updatePosition: async (id: string | number, data: any) => {
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

  // ─── Trades ───────────────────────────────────────────────
  createTrade: async (positionId: string | number, data: any) => {
    const response = await fetch(
      `${BASE_URL}/positions/${positionId}/trades`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );
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
    currentOptionPrice: number
  ) => {
    const response = await fetch(`${BASE_URL}/trades/${tradeId}/assess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentUnderlyingPrice, currentOptionPrice }),
    });
    return handleResponse(response);
  },

  // ─── Statistics ───────────────────────────────────────────
  getStatistics: async () => {
    const response = await fetch(`${BASE_URL}/statistics`);
    return handleResponse(response);
  },

  // ─── CSV Exports ──────────────────────────────────────────
  exportPositionsCSV: async () => {
    const response = await fetch(`${BASE_URL}/export/positions`);
    return handleResponse(response);
  },
};
