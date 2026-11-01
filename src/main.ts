import './styles.css';
import { startApp } from './router';

const app = document.getElementById('app');
if (!app) throw new Error('Контейнер #app не найден');
void startApp(app);
