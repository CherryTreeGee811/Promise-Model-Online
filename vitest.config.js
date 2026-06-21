import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['PromiseModelOnline.Client.Tests/UnitTests/**/*.test.ts'],
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
});
