const API_BASE = import.meta.env.VITE_API_URL ?? '';

/** Absolute URL for API paths returned by the backend (e.g. restaurant logo URLs). */
export const apiUrl = (path) => (path ? `${API_BASE}${path}` : null);

export class ApiError extends Error {
  constructor(message, status, fieldErrors = {}) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export async function apiRequest(path, { method = 'GET', body, token } = {}) {
  const isForm = body instanceof FormData;
  const headers = { Accept: 'application/json' };
  // For FormData the browser sets the multipart Content-Type (with its boundary) itself.
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const unreachable = 'Cannot reach the server. Please make sure the backend is running.';
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
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
  detail: (token, id) => apiRequest(`/api/restaurants/${encodeURIComponent(id)}`, { token }),
  mine: (token) => apiRequest('/api/restaurants/me', { token }),
  updateMine: (token, payload) => apiRequest('/api/restaurants/me', { method: 'PUT', body: payload, token }),
  updateOptions: (token, payload) => apiRequest('/api/restaurants/me/options', { method: 'PUT', body: payload, token }),
  uploadLogo: (token, file) => {
    const form = new FormData();
    form.append('file', file);
    return apiRequest('/api/restaurants/me/logo', { method: 'POST', body: form, token });
  },
  deleteLogo: (token) => apiRequest('/api/restaurants/me/logo', { method: 'DELETE', token }),
};

export const orderApi = {
  place: (token, order) => apiRequest('/api/orders', { method: 'POST', body: order, token }),
  mine: (token) => apiRequest('/api/orders', { token }),
  cancel: (token, id) => apiRequest(`/api/orders/${id}/cancel`, { method: 'POST', token }),
};

export const restaurantOrderApi = {
  list: (token) => apiRequest('/api/restaurants/me/orders', { token }),
  updateStatus: (token, id, status) =>
    apiRequest(`/api/restaurants/me/orders/${id}/status`, { method: 'PUT', body: { status }, token }),
};

export const menuApi = {
  list: (token) => apiRequest('/api/restaurants/me/menu', { token }),
  create: (token, item) => apiRequest('/api/restaurants/me/menu', { method: 'POST', body: item, token }),
  update: (token, id, item) => apiRequest(`/api/restaurants/me/menu/${id}`, { method: 'PUT', body: item, token }),
  remove: (token, id) => apiRequest(`/api/restaurants/me/menu/${id}`, { method: 'DELETE', token }),
};
