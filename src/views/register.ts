import { api } from '../api';
import { renderAuthForm } from './authForm';

/** После регистрации бэкенд сразу открывает сессию, поэтому отдельный вход не нужен. */
export const registerView = (root: HTMLElement): void =>
  renderAuthForm(root, {
    title: 'Регистрация',
    submitLabel: 'Создать аккаунт',
    alt: { text: 'Уже есть аккаунт?', href: '#/login', label: 'Войти' },
    autocompletePassword: 'new-password',
    submit: api.register,
  });
