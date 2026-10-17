import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Playwright owns e2e/; Vitest would otherwise pick up its *.spec.ts files.
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
});
