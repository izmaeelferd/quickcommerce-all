import axios from 'axios';

const base = import.meta.env.VITE_API_BASE_URL || '';
const prefix = import.meta.env.VITE_API_PREFIX || '/api';
export const API_URL = `${base}${prefix}`;
export const SOCKET_URL = base || window.location.origin;

const ACCESS = 'admin_access_token';
const REFRESH = 'admin_refresh_token';

export const tokens = {
  get access() { return localStorage.getItem(ACCESS); },
  get refresh() { return localStorage.getItem(REFRESH); },
  set(access, refresh) { localStorage.setItem(ACCESS, access); localStorage.setItem(REFRESH, refresh); },
  clear() { localStorage.removeItem(ACCESS); localStorage.removeItem(REFRESH); },
};

const api = axios.create({ baseURL: API_URL, headers: { 'X-App-Type': 'admin' } });

api.interceptors.request.use((cfg) => {
  if (tokens.access) cfg.headers.Authorization = `Bearer ${tokens.access}`;
  return cfg;
});

let refreshing = null;
api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && tokens.refresh && !original._retry && !original.url.includes('/auth/')) {
      original._retry = true;
      refreshing = refreshing || axios.post(`${API_URL}/auth/refresh-token`, { refreshToken: tokens.refresh }).finally(() => { setTimeout(() => { refreshing = null; }, 0); });
      try {
        const { data } = await refreshing;
        tokens.set(data.data.accessToken, data.data.refreshToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch (e) {
        tokens.clear();
        window.dispatchEvent(new Event('auth:expired'));
      }
    }
    return Promise.reject(error);
  }
);

/** Unwraps `{ success, data }` envelopes. */
export const unwrap = (p) => p.then((r) => r.data.data);
export const errorKey = (e) => e?.response?.data?.message || 'error.generic';

export const get = (url, params) => unwrap(api.get(url, { params }));
export const post = (url, body) => unwrap(api.post(url, body));
export const put = (url, body) => unwrap(api.put(url, body));
export const patch = (url, body) => unwrap(api.patch(url, body));
export const del = (url) => unwrap(api.delete(url));

export async function uploadImage(file, folder = 'admin') {
  const fd = new FormData();
  fd.append('folder', folder);
  fd.append('image', file);
  return unwrap(api.post('/upload/image', fd)).then((d) => d.url);
}

export async function downloadCsv(url, params, filename) {
  const res = await api.get(url, { params: { ...params, format: 'csv' }, responseType: 'blob' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(res.data);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default api;
