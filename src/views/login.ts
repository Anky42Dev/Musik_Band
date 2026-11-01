import { api } from '../api';
import { renderAuthForm } from './authForm';

export const loginView = (root: HTMLElement): void =>
  renderAuthForm(root, {
    title: 'Вход',
    submitLabel: 'Войти',
    alt: { text: 'Нет аккаунта?', href: '#/register', label: 'Зарегистрироваться' },
    autocompletePassword: 'current-password',
    submit: api.login,
  });
