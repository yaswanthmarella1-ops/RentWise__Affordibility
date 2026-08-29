/**
 * Fetch wrapper for the RentWise API.
 *
 * The access token is held in memory only — never localStorage — so an XSS
 * payload cannot read it back. Durable session state lives in the httpOnly
 * refresh cookie, which JavaScript cannot touch at all.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fieldErrors: string[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let accessToken: string | null = null;
let onSessionExpired: (() => void) | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setSessionExpiredHandler(handler: (() => void) | null): void {
  onSessionExpired = handler;
}

/**
 * In-flight refresh, shared by every 401 that arrives while it is pending.
 * Without this, a screen firing three requests at once would send three
 * refreshes — and rotation would invalidate the two that lost the race,
 * tripping the server's token-reuse detection and killing the session.
 */
let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  refreshInFlight ??= (async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        accessToken = null;
        return false;
      }

      const data = (await res.json()) as { accessToken: string };
      accessToken = data.accessToken;
      return true;
    } catch {
      accessToken = null;
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

async function toApiError(res: Response): Promise<ApiError> {
  let message = res.statusText || 'Request failed';
  let fieldErrors: string[] = [];

  try {
    const body = await res.json();
    // Nest's ValidationPipe returns `message` as an array of field errors.
    if (Array.isArray(body?.message)) {
      fieldErrors = body.message;
      message = body.message[0] ?? message;
    } else if (typeof body?.message === 'string') {
      message = body.message;
    }
  } catch {
    // Non-JSON error body — keep the status text.
  }

  return new ApiError(message, res.status, fieldErrors);
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Internal: prevents a refreshed request from retrying forever. */
  _retried?: boolean;
  /** Skip the refresh-and-retry dance (used by login/register themselves). */
  skipAuthRetry?: boolean;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, _retried, skipAuthRetry, headers, ...rest } = options;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    credentials: 'include',
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (res.status === 401 && !_retried && !skipAuthRetry) {
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      return apiRequest<T>(path, { ...options, _retried: true });
    }

    onSessionExpired?.();
    throw await toApiError(res);
  }

  if (!res.ok) {
    throw await toApiError(res);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => apiRequest<T>(path),
  post: <T>(path: string, body?: unknown, options: RequestOptions = {}) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: 'DELETE' }),
};

export { refreshAccessToken };
