import { api, ApiError } from '../api';
import { field, h } from '../dom';
import { getUser, setUser } from '../session';
import type { Specialization, SpecializationChoice } from '../types';

let flash = '';

export async function profileView(root: HTMLElement): Promise<void> {
  const user = getUser();
  if (!user) return;
  const { profile } = user;

  let choices: SpecializationChoice[] = [];
  try {
    choices = await api.getSpecializations();
  } catch {
    choices = [{ value: profile.specialization, label: profile.specialization_display }];
  }

  const name = h('input', { name: 'first_name', maxlength: '100', value: profile.first_name });
  const spec = h(
    'select',
    { name: 'specialization' },
    ...choices.map((c) => h('option', { value: c.value, ...(c.value === profile.specialization ? { selected: true } : {}) }, c.label)),
  );
  const bio = h('textarea', { name: 'bio', rows: '4' }, profile.bio);
  const fee = h('input', { name: 'fee', inputmode: 'decimal', value: profile.fee });

  const fields = {
    first_name: field('Имя', name),
    specialization: field('Специализация', spec),
    bio: field('О себе', bio),
    fee: field('Гонорар', fee, 'Число, до 2 знаков после точки'),
  };
  const status = h('p', { class: 'form-status', role: 'status' }, flash);
  flash = '';
  const formError = h('p', { class: 'form-error', role: 'alert' });
  const button = h('button', { class: 'btn', type: 'submit' }, 'Сохранить');

  const form = h(
    'form',
    {
      class: 'card',
      novalidate: true,
      onsubmit: async (event: Event) => {
        event.preventDefault();
        Object.values(fields).forEach((f) => f.setError(undefined));
        status.textContent = '';
        formError.textContent = '';
        button.disabled = true;
        try {
          const updated = await api.updateProfile({
            first_name: name.value.trim(),
            specialization: spec.value as Specialization,
            bio: bio.value,
            fee: fee.value.trim().replace(',', '.'),
          });
          // setUser перерисует страницу, поэтому сообщение передаём через flash.
          flash = 'Профиль сохранён';
          setUser(updated);
        } catch (error: unknown) {
          if (error instanceof ApiError) {
            for (const [key, f] of Object.entries(fields)) f.setError(error.fields[key]);
            if (Object.keys(error.fields).length === 0) formError.textContent = error.message;
            if (error.status === 401 || error.status === 403) setUser(null);
          } else {
            formError.textContent = 'Неизвестная ошибка.';
          }
          button.disabled = false;
        }
      },
    },
    h('h2', {}, 'Мой профиль'),
    h('p', { class: 'meta' }, `Логин: ${user.username} · ID ${user.id} · ${profile.specialization_display}`),
    fields.first_name.wrap,
    fields.specialization.wrap,
    fields.bio.wrap,
    fields.fee.wrap,
    formError,
    status,
    button,
  );
  root.append(form);
}
