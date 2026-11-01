import { ApiError } from '../api';
import { field, h } from '../dom';
import { navigate } from '../router';
import { setUser } from '../session';
import type { Credentials, UserProfile } from '../types';

interface AuthFormOptions {
  title: string;
  submitLabel: string;
  alt: { text: string; href: string; label: string };
  autocompletePassword: 'current-password' | 'new-password';
  submit: (credentials: Credentials) => Promise<UserProfile>;
}

export function renderAuthForm(root: HTMLElement, options: AuthFormOptions): void {
  const username = h('input', { name: 'username', required: true, maxlength: '150', pattern: '[\\w.@+\\-]+', autocomplete: 'username' });
  const password = h('input', {
    name: 'password',
    type: 'password',
    required: true,
    minlength: '6',
    autocomplete: options.autocompletePassword,
  });
  const userField = field('Имя пользователя', username, 'Буквы, цифры и символы @ . + - _');
  const passField = field('Пароль', password, 'Не менее 6 символов');
  const formError = h('p', { class: 'form-error', role: 'alert' });
  const button = h('button', { class: 'btn', type: 'submit' }, options.submitLabel);

  const form = h(
    'form',
    {
      class: 'card',
      novalidate: true,
      onsubmit: async (event: Event) => {
        event.preventDefault();
        userField.setError(undefined);
        passField.setError(undefined);
        formError.textContent = '';
        button.disabled = true;
        try {
          const user = await options.submit({ username: username.value.trim(), password: password.value });
          setUser(user);
          navigate('/profile');
        } catch (error: unknown) {
          if (error instanceof ApiError) {
            userField.setError(error.fields.username);
            passField.setError(error.fields.password);
            if (!error.fields.username && !error.fields.password) formError.textContent = error.message;
          } else {
            formError.textContent = 'Неизвестная ошибка.';
          }
        } finally {
          button.disabled = false;
        }
      },
    },
    h('h2', {}, options.title),
    userField.wrap,
    passField.wrap,
    formError,
    button,
    h('p', { class: 'alt' }, `${options.alt.text} `, h('a', { href: options.alt.href }, options.alt.label)),
  );
  root.append(form);
}
