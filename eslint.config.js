import { defineConfig, globalIgnores } from 'eslint/config';
import astro from 'eslint-plugin-astro';
import tseslint from 'typescript-eslint';

// `eslint-plugin-jsx-a11y` is deliberately absent: its latest release still
// peers ESLint 3–9, so installing it alongside ESLint 10 is a hard ERESOLVE.
// It is an optional peer of eslint-plugin-astro, so omitting it is supported —
// but the plugin's `jsx-a11y-*` configs delegate to it and must not be
// referenced here, or config loading fails. See the plan's accessibility-lint
// gap, tracked as an open decision in ARCHI §22.
export default defineConfig([
  globalIgnores([
    'dist/',
    '.astro/',
    'node_modules/',
    'playwright-report/',
    'test-results/',
    'coverage/',
    // Vendored agent skills. These are third-party tooling, not project
    // source: `impeccable` ships ~86 `.mjs` files written against its own
    // conventions, which produced 152 errors under this project's config the
    // moment it was installed. Linting someone else's vendored tool tells us
    // nothing about this site.
    '.claude/skills/',
  ]),
  tseslint.configs.recommended,
  astro.configs.recommended,
]);
