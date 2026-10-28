const BASE = `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/v1`;

export class ApiError extends Error {
  constructor(message, { status, code, fields } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields ?? {};
  }
}

async function request(path, { method = 'GET', params, body, signal } = {}) {
  const query = params
    ? `?${new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')).toString()}`
    : '';
  let response;
  try {
    response = await fetch(`${BASE}${path}${query}`, {
      method,
      signal,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError('Cannot reach the server. Check that the backend is running.');
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const e = payload.error ?? {};
    throw new ApiError(e.message ?? 'Request failed.', { status: response.status, code: e.code, fields: e.fields });
  }
  return payload;
}

export const api = {
  get: (path, params, signal) => request(path, { params, signal }),
  post: (path, body) => request(path, { method: 'POST', body }),
};
