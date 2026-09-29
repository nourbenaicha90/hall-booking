const BASE = import.meta.env.VITE_API_URL || '/api';
export const getToken = () => localStorage.getItem('token');
const authHeader = () => (getToken() ? { Authorization: `Bearer ${getToken()}` } : {});

async function handle(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = new Error(data.message || 'حدث خطأ غير متوقع');
    e.status = res.status;
    throw e;
  }
  return data;
}

const request = (method, path, body) =>
  fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: body === undefined ? undefined : JSON.stringify(body),
  }).then(handle);

export const api = {
  get: (p) => request('GET', p),
  post: (p, b = {}) => request('POST', p, b),
  put: (p, b = {}) => request('PUT', p, b),
  del: (p) => request('DELETE', p),
};

export async function uploadImage(file) {
  const fd = new FormData();
  fd.append('image', file);
  const data = await fetch(BASE + '/admin/upload', { method: 'POST', headers: authHeader(), body: fd }).then(handle);
  return data.url;
}
