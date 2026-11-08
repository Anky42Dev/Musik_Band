import type { AccessTokenResponse, Credentials, ProfilePatch, SpecializationChoice, UserProfile } from './types';

const API_URL: string = import.meta.env.VITE_API_URL ?? 'https://inai-col3.fishrungames.com/api';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fields: Readonly<Record<string, string>> = {},
  ) {
    super(message);
  }
}

/** Превращает тело ошибки DRF ({detail} или {поле: [сообщения]}) в сообщение и ошибки по полям. */
export function parseErrorBody(body: unknown, status: number): ApiError {
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    if (typeof record.detail === 'string') return new ApiError(record.detail, status);
    const fields: Record<string, string> = {};
    for (const [key, value] of Object.entries(record)) {
      fields[key] = Array.isArray(value) ? value.join(' ') : String(value);
    }
    if (Object.keys(fields).length > 0) {
      return new ApiError(fields.non_field_errors ?? 'Проверьте поля формы.', status, fields);
    }
  }
  return new ApiError(`Ошибка сервера (${status}).`, status);
}

/** Access-токен живёт только в памяти; refresh-токен хранится сервером в HttpOnly-cookie. */
let accessToken: string | null = null;
let refreshing: Promise<string | null> | null = null;

export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};

async function send(path: string, init: RequestInit): Promise<{ status: number; ok: boolean; body: unknown }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, credentials: 'include', headers });
  } catch {
    throw new ApiError('Нет связи с сервером. Попробуйте позже.', 0);
  }
  const body: unknown = await response.json().catch(() => null);
  return { status: response.status, ok: response.ok, body };
}

/** Обновляет access-токен по refresh-cookie; параллельные вызовы делят один запрос. */
export function refreshAccessToken(): Promise<string | null> {
  refreshing ??= (async () => {
    try {
      const res = await send('/token/refresh/', { method: 'POST' });
      const token = res.ok ? (res.body as { access?: string } | null)?.access ?? null : null;
      accessToken = token;
      return token;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  let res = await send(path, init);
  if (res.status === 401 && retry && accessToken !== null) {
    if (await refreshAccessToken()) res = await send(path, init);
  }
  if (!res.ok) throw parseErrorBody(res.body, res.status);
  return res.body as T;
}

const post = <T>(path: string, data?: unknown) =>
  request<T>(path, { method: 'POST', body: data === undefined ? undefined : JSON.stringify(data) });

async function authenticate(path: string, credentials: Credentials): Promise<UserProfile> {
  const { access, user } = await post<AccessTokenResponse>(path, credentials);
  accessToken = access;
  return user ?? request<UserProfile>('/profile/');
}

export const api = {
  register: (credentials: Credentials) => authenticate('/register/', credentials),
  login: (credentials: Credentials) => authenticate('/login/', credentials),
  logout: async () => {
    try {
      return await post<{ detail: string }>('/logout/');
    } finally {
      accessToken = null;
    }
  },
  getProfile: () => request<UserProfile>('/profile/'),
  updateProfile: (patch: ProfilePatch) =>
    request<UserProfile>('/profile/', { method: 'PATCH', body: JSON.stringify(patch) }),
  getSpecializations: () => request<SpecializationChoice[]>('/specializations/'),
};
