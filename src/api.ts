import type { Credentials, ProfilePatch, SpecializationChoice, UserProfile } from './types';

const API_URL: string = import.meta.env.VITE_API_URL ?? 'https://inai-col2.fishrungames.com/api';

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

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...init.headers },
    });
  } catch {
    throw new ApiError('Нет связи с сервером. Попробуйте позже.', 0);
  }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) throw parseErrorBody(body, response.status);
  return body as T;
}

const post = <T>(path: string, data?: unknown) =>
  request<T>(path, { method: 'POST', body: data === undefined ? undefined : JSON.stringify(data) });

export const api = {
  register: (credentials: Credentials) => post<UserProfile>('/register/', credentials),
  login: (credentials: Credentials) => post<UserProfile>('/login/', credentials),
  logout: () => post<{ detail: string }>('/logout/'),
  getProfile: () => request<UserProfile>('/profile/'),
  updateProfile: (patch: ProfilePatch) =>
    request<UserProfile>('/profile/', { method: 'PATCH', body: JSON.stringify(patch) }),
  getSpecializations: () => request<SpecializationChoice[]>('/specializations/'),
};
