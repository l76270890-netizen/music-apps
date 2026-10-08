const API_BASE_URL = typeof process !== 'undefined' ? (process.env.EXPO_PUBLIC_API_URL || '') : '';
let accessToken = null;

export function setApiToken(token) { accessToken = token || null; }
export function apiBaseUrlConfigured() { return Boolean(API_BASE_URL); }

export class ApiError extends Error {
  constructor(message, status, payload) {
    const details = Array.isArray(payload?.detail)
      ? payload.detail.map((item) => item?.msg).filter(Boolean).join(' ')
      : payload?.detail;
    const detail = typeof details === 'string' ? details : message;
    super(detail || message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

export async function request(path, options = {}) {
  if (!API_BASE_URL) throw new Error('Music API is not configured. Set EXPO_PUBLIC_API_URL to enable account and library sync.');
  const url = `${API_BASE_URL.replace(/\/$/, '')}/${String(path).replace(/^\//, '')}`;
  const response = await fetch(url, {
    ...options,
    headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}), ...options.headers },
  });
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) throw new ApiError(`Music API request failed (${response.status})`, response.status, payload);
  return payload;
}

export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
};

export default api;
