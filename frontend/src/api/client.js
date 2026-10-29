
import { supabase } from '../lib/supabase.js';

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
    ? `?${new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
      ).toString()}`
    : '';

  const headers = {};

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  // Attach the Supabase access token when a session exists.
  if (supabase) {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      throw new ApiError('Unable to retrieve the authentication session.');
    }

    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }
  }

  let response;

  try {
    response = await fetch(`${BASE}${path}${query}`, {
      method,
      signal,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;

    throw new ApiError(
      'Cannot reach the server. Check that the backend is running.'
    );
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const e = payload.error ?? {};

    throw new ApiError(e.message ?? 'Request failed.', {
      status: response.status,
      code: e.code,
      fields: e.fields,
    });
  }

  return payload;
}

export const api = {
  get: (path, params, signal) => request(path, { params, signal }),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
};
