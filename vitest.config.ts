import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    testTimeout: 10000,
    setupFiles: [
      resolve(__dirname, './src/crawler/tests/setup.ts')
    ],
  },
});
