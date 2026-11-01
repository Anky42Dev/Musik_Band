import { describe, expect, it } from 'vitest';
import { parseErrorBody } from './api';

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
