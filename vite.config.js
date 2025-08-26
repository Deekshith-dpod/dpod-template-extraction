import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic', // Enable the new JSX transform
      babel: {
        presets: ['@babel/preset-react'], // Ensure Babel processes JSX
      },
    }),
  ],
  esbuild: {
    loader: 'jsx', // Treat `.js` files as containing JSX
    include: /src\/.*\.js$/, // Apply this rule only to .js files in the src folder
  }
});
