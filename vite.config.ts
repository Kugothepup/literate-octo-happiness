import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative base: the built site works from any folder or host (GitHub Pages, Netlify, Vercel).
  base: './',
  plugins: [react()],
  assetsInclude: ['**/*.glb'],
});

