import { getViteConfig } from 'astro/config';
import { configDefaults } from 'vitest/config';

// `getViteConfig` reuses Astro's own Vite config, so there is no second
// toolchain to keep in sync.
//
// The include/exclude pair is what actually keeps the two runners apart:
// Vitest's default include glob also matches `*.spec.ts`, so without this it
// would collect Playwright's e2e specs and fail on their imports.
export default getViteConfig({
  test: {
    include: ['src/**/*.test.ts'],
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
});
