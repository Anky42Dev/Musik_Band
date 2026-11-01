import { h } from './dom';
import { getUser, onSessionChange, restoreSession, setUser } from './session';
import { api } from './api';
import { homeView } from './views/home';
import { loginView } from './views/login';
import { registerView } from './views/register';
import { profileView } from './views/profile';

type Guard = 'guest' | 'auth' | 'any';
interface Route {
  view: (root: HTMLElement) => void | Promise<void>;
  guard: Guard;
}

const routes: Record<string, Route> = {
  '/': { view: homeView, guard: 'any' },
  '/login': { view: loginView, guard: 'guest' },
  '/register': { view: registerView, guard: 'guest' },
  '/profile': { view: profileView, guard: 'auth' },
};

export const navigate = (path: string): void => {
  location.hash = `#${path}`;
};

function header(): HTMLElement {
  const user = getUser();
  const link = (path: string, text: string) => h('a', { href: `#${path}` }, text);
  const nav = user
    ? [
        link('/profile', user.profile.first_name || user.username),
        h(
          'button',
          {
            class: 'link-button',
            type: 'button',
            onclick: async () => {
              await api.logout().catch(() => undefined);
              setUser(null);
              navigate('/');
            },
          },
          'Выйти',
        ),
      ]
    : [link('/login', 'Войти'), link('/register', 'Регистрация')];
  return h(
    'header',
    { class: 'site-header' },
    h('a', { class: 'logo', href: '#/' }, 'BLACK STATIC'),
    h('nav', { 'aria-label': 'Основная навигация' }, ...nav),
  );
}

async function render(app: HTMLElement): Promise<void> {
  const path = location.hash.slice(1) || '/';
  const route = routes[path] ?? routes['/']!;
  if (route.guard === 'auth' && !getUser()) return navigate('/login');
  if (route.guard === 'guest' && getUser()) return navigate('/profile');

  const main = h('main', { class: 'page' });
  app.replaceChildren(header(), main);
  await route.view(main);
}

export async function startApp(app: HTMLElement): Promise<void> {
  app.replaceChildren(h('p', { class: 'loading' }, 'Загрузка…'));
  try {
    await restoreSession();
  } catch {
    // Сервер недоступен: показываем сайт как для гостя, ошибка появится при действиях.
  }
  const rerender = () => void render(app);
  window.addEventListener('hashchange', rerender);
  onSessionChange(rerender);
  rerender();
}
