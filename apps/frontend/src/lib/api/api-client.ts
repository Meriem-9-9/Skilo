/**
 * api-client.ts
 * Centralised Axios instance for Skilo.
 *
 * Debugging strategy
 * ──────────────────
 * Every request/response is tagged with a short traceId so you can grep the
 * console and correlate a failed response back to its request.
 *
 * In development:
 *   ✓ Requests  → logged with method, url, traceId
 *   ✓ Responses → logged with status, duration, traceId
 *   ✗ Errors    → logged with full context + friendly message
 *
 * In production:
 *   Only errors are logged (no sensitive data in the payload).
 *
 * TODO (onboarding):
 *   - Plug in your preferred error-monitoring SDK (e.g. Sentry) at the
 *     bottom of the response-error interceptor — the `apiError` object has
 *     all the context you need.
 *   - Add a refresh-token interceptor here once the backend exposes
 *     POST /auth/refresh (FC-01-C).
 */

import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** 6-char random ID used to correlate request↔response in logs. */
const traceId = () => Math.random().toString(36).slice(2, 8).toUpperCase();

const isDev = process.env.NODE_ENV === 'development';

// ─── Instance ─────────────────────────────────────────────────────────────────

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000',
  withCredentials: true,          // send httpOnly cookie if you add refresh tokens
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// ─── Request interceptor ──────────────────────────────────────────────────────

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Attach trace id so we can correlate logs
    const id = traceId();
    config.headers['X-Trace-Id'] = id;
    (config as any).__traceId = id;
    (config as any).__startTime = Date.now();

    // Attach JWT from localStorage (set by AuthContext on login)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('skilo_access_token');
      if (token) config.headers['Authorization'] = `Bearer ${token}`;
    }

    if (isDev) {
      console.debug(
        `[API ▶] ${id} ${config.method?.toUpperCase()} ${config.url}`,
        config.params ?? '',
      );
    }

    return config;
  },
  (error) => {
    console.error('[API ▶ request-error]', error);
    return Promise.reject(error);
  },
);

// ─── Response interceptor ─────────────────────────────────────────────────────

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (isDev) {
      const cfg = response.config as any;
      const ms = Date.now() - cfg.__startTime;
      console.debug(
        `[API ◀] ${cfg.__traceId} ${response.status} ${cfg.url} (${ms}ms)`,
      );
    }
    return response;
  },
  (error: AxiosError<{ message?: string; statusCode?: number }>) => {
    const cfg = error.config as any | undefined;
    const status = error.response?.status;
    const serverMsg = error.response?.data?.message;

    // Structured error object — attach to Sentry or other monitoring here
    const apiError = {
      traceId: cfg?.__traceId ?? 'unknown',
      method: cfg?.method?.toUpperCase(),
      url: cfg?.url,
      status,
      serverMessage: serverMsg,
      networkError: !error.response,
    };

    if (isDev) {
      console.error('[API ✗]', apiError);
    } else if (status !== 401) {
      // In prod, only log non-auth errors (401s flood the console)
      console.error('[API ✗]', apiError);
    }

    // TODO: forward `apiError` to Sentry / Datadog / your monitoring tool
    // e.g. Sentry.captureException(error, { extra: apiError });

    // 401 → clear auth state and redirect to /login
    if (status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('skilo_access_token');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  },
);

// ─── Typed fetcher helpers (used with SWR / React Query) ─────────────────────

export async function fetcher<T>(url: string): Promise<T> {
  const res = await apiClient.get<T>(url);
  return res.data;
}
