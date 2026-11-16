import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages 주소: https://hyukson.github.io/fortune-lab/
export default defineConfig({
  plugins: [react()],
  base: '/fortune-lab/',
});
