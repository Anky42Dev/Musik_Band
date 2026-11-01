import { api, ApiError } from './api';
import type { UserProfile } from './types';

let current: UserProfile | null = null;
const listeners = new Set<() => void>();

export const getUser = (): UserProfile | null => current;

export function setUser(user: UserProfile | null): void {
  current = user;
  listeners.forEach((fn) => fn());
}

export function onSessionChange(fn: () => void): void {
  listeners.add(fn);
}

/** Сессия хранится в HttpOnly-cookie, поэтому состояние входа узнаём запросом профиля. */
export async function restoreSession(): Promise<void> {
  try {
    setUser(await api.getProfile());
  } catch (error: unknown) {
    if (!(error instanceof ApiError) || error.status === 0) throw error;
    setUser(null);
  }
}
