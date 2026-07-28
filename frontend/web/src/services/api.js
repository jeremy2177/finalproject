const BASE_URL = '/api';

async function handleResponse(response) {
  if (!response.ok) {
    let errorMsg = 'An error occurred';
    try {
      const errData = await response.json();
      errorMsg = errData.error || errData.message || errorMsg;
    } catch (e) {
      // Ignore if not JSON
    }
    throw new Error(errorMsg);
  }
  
  // Check if it's a CSV or text response
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/csv')) {
    return response.text();
  }
  
  return response.json();
}

export const api = {
  // Auth
  login: async (username, password) => {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return handleResponse(response);
  },

  // Dashboard
  getDashboard: async () => {
    const response = await fetch(`${BASE_URL}/dashboard`);
    return handleResponse(response);
  },

  // Positions
  getPositions: async (filters = {}) => {
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

  createPosition: async (data) => {
    const response = await fetch(`${BASE_URL}/positions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  getPositionDetail: async (id) => {
    const response = await fetch(`${BASE_URL}/positions/${id}/detail`);
    return handleResponse(response);
  },

  updatePosition: async (id, data) => {
    const response = await fetch(`${BASE_URL}/positions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  deletePosition: async (id) => {
    const response = await fetch(`${BASE_URL}/positions/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(response);
  },

  // Trades
  createTrade: async (positionId, data) => {
    const response = await fetch(`${BASE_URL}/positions/${positionId}/trades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  closeTrade: async (tradeId, closePrice) => {
    const response = await fetch(`${BASE_URL}/trades/${tradeId}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ close_price: closePrice })
    });
    return handleResponse(response);
  },

  expireTrade: async (tradeId) => {
    const response = await fetch(`${BASE_URL}/trades/${tradeId}/expire`, {
      method: 'POST'
    });
    return handleResponse(response);
  },

  assignTrade: async (tradeId) => {
    const response = await fetch(`${BASE_URL}/trades/${tradeId}/assign`, {
      method: 'POST'
    });
    return handleResponse(response);
  },

  assessTrade: async (tradeId, currentUnderlyingPrice, currentOptionPrice) => {
    const response = await fetch(`${BASE_URL}/trades/${tradeId}/assess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentUnderlyingPrice, currentOptionPrice })
    });
    return handleResponse(response);
  },

  // Statistics
  getStatistics: async () => {
    const response = await fetch(`${BASE_URL}/statistics`);
    return handleResponse(response);
  },

  // CSV Exports
  exportPositionsCSV: async () => {
    const response = await fetch(`${BASE_URL}/export/positions`);
    return handleResponse(response);
  }
};
