import { defineConfig } from 'wxt';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  vite: () => ({ plugins: [react(), tailwindcss()] }),
  manifest: {
    name: 'Bridder',
    description: '__MSG_description__',
    default_locale: 'ja',
    permissions: ['storage'],
    icons: {
      128: '/blue-bird.png',
    },
  },
});
