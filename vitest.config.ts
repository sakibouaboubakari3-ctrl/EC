import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'node',
    testTimeout: 20000,
    setupFiles: ['./vitest.setup.ts'],
    // Playwright e2e specs live under tests/e2e and are run via `playwright test`,
    // not vitest — they import @playwright/test's own test()/expect(), which
    // conflicts with vitest's runner if picked up here.
    exclude: [...configDefaults.exclude, 'tests/e2e/**'],
    server: {
      deps: {
        inline: ['next-auth', '@auth/core'],
      },
    },
  },
});
