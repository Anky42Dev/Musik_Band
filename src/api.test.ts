import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, parseErrorBody, setAccessToken } from './api';

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('JWT flow', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    setAccessToken(null);
  });

  it('sends Bearer token after login', async () => {
    const user = { id: 1, username: 'a', profile: {} };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json(200, { access: 'A1', user }))
      .mockResolvedValueOnce(json(200, user));
    vi.stubGlobal('fetch', fetchMock);
    await api.login({ username: 'a', password: 'secret1' });
    await api.getProfile();
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe('Bearer A1');
  });

  it('refreshes on 401 and retries once', async () => {
    const user = { id: 1, username: 'a', profile: {} };
    setAccessToken('old');
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json(401, { detail: 'expired' }))
      .mockResolvedValueOnce(json(200, { access: 'new' }))
      .mockResolvedValueOnce(json(200, user));
    vi.stubGlobal('fetch', fetchMock);
    expect(await api.getProfile()).toEqual(user);
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe('Bearer new');
  });

  it('fails with 401 when refresh is rejected', async () => {
    setAccessToken('old');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce(json(401, { detail: 'x' })).mockResolvedValueOnce(json(401, { detail: 'x' })),
    );
    await expect(api.getProfile()).rejects.toMatchObject({ status: 401 });
  });
});

describe('parseErrorBody', () => {
  it('uses detail as message', () => {
    const e = parseErrorBody({ detail: 'Неверный логин или пароль.' }, 401);
    expect(e.message).toBe('Неверный логин или пароль.');
    expect(e.status).toBe(401);
  });

  it('maps field errors', () => {
    const e = parseErrorBody({ username: ['занято'], password: ['коротко', 'совсем'] }, 400);
    expect(e.fields).toEqual({ username: 'занято', password: 'коротко совсем' });
  });

  it('falls back for unknown bodies', () => {
    expect(parseErrorBody(null, 500).message).toContain('500');
  });
});
