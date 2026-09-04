import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Siden publiseres på https://sindreaatland.github.io/drivhusgenerator/
  base: '/drivhusgenerator/',
  plugins: [react()],
});
