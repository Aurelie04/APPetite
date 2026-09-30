const API_BASE = import.meta.env.VITE_API_URL ?? '';

export class ApiError extends Error {
  constructor(message, status, fieldErrors = {}) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export async function apiRequest(path, { method = 'GET', body, token } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const unreachable = 'Cannot reach the server. Please make sure the backend is running.';
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(unreachable, 0);
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    // The Vite dev proxy answers with an empty 5xx when the backend is down
    if (!data && response.status >= 500) throw new ApiError(unreachable, response.status);
    const fallback = response.status === 401 ? 'Your session has expired, please sign in again.' : 'Request failed';
    throw new ApiError(data?.message || fallback, response.status, data?.errors || {});
  }
  return data;
}

export const authApi = {
  login: (payload) => apiRequest('/api/auth/login', { method: 'POST', body: payload }),
  registerClient: (payload) => apiRequest('/api/auth/register/client', { method: 'POST', body: payload }),
  registerRestaurant: (payload) => apiRequest('/api/auth/register/restaurant', { method: 'POST', body: payload }),
  forgotPassword: (payload) => apiRequest('/api/auth/forgot-password', { method: 'POST', body: payload }),
  resetPassword: (payload) => apiRequest('/api/auth/reset-password', { method: 'POST', body: payload }),
  me: (token) => apiRequest('/api/users/me', { token }),
};

export const restaurantApi = {
  list: (token) => apiRequest('/api/restaurants', { token }),
  mine: (token) => apiRequest('/api/restaurants/me', { token }),
  updateMine: (token, payload) => apiRequest('/api/restaurants/me', { method: 'PUT', body: payload, token }),
};
