import { h } from '../dom';
import { getUser } from '../session';

export function homeView(root: HTMLElement): void {
  const user = getUser();
  root.append(
    h(
      'section',
      { class: 'hero' },
      h('p', { class: 'eyebrow' }, 'Рок-группа · с 2019'),
      h('h1', {}, 'BLACK', h('br'), 'STATIC'),
      h('p', { class: 'lead' }, 'Громкие гитары, живая сцена и своя команда. Присоединяйся к составу — создай профиль участника.'),
      h(
        'div',
        { class: 'actions' },
        user
          ? h('a', { class: 'btn', href: '#/profile' }, 'Мой профиль')
          : h('a', { class: 'btn', href: '#/register' }, 'Стать участником'),
        user ? null : h('a', { class: 'btn btn-ghost', href: '#/login' }, 'Войти'),
      ),
    ),
    h(
      'ul',
      { class: 'facts' },
      h('li', {}, h('strong', {}, '120+'), ' концертов'),
      h('li', {}, h('strong', {}, '3'), ' альбома'),
      h('li', {}, h('strong', {}, '6'), ' ролей в составе'),
    ),
  );
}
