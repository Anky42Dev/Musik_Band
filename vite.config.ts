import { defineConfig } from 'vite';

// Относительный base — сайт работает по любому адресу GitHub Pages.
export default defineConfig({
  base: './',
  build: { target: 'es2022' },
});
