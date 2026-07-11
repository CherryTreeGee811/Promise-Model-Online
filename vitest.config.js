import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['PromiseModelOnline.Client.Tests/UnitTests/**/*.test.ts'],
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
  pool: 'forks',
  poolOptions: {
    forks: {
      singleFork: false,
    },
  },
  coverage: {
    provider: 'v8',
    reporter: ['text', 'clover'],
    reportsDirectory: './coverage',
    include: ['PromiseModelOnline.Client/wwwroot/js/**/*.ts'],
    exclude: ['**/*.test.ts', '**/*.d.ts'],
  },
});
