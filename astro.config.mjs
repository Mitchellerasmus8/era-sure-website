import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { siteConfig } from './src/site.config.ts';

export default defineConfig({
  site: siteConfig.siteUrl,
  output: 'static',
  integrations: [
    sitemap({
      // Three exclusions, each for a different reason, all of which end when
      // the underlying content does:
      //
      //   /quote/success  - conversion confirmation, renders its own noindex.
      //   /deliveries     - currently a redirect stub carrying noindex, because
      //                     no delivery has approved photographs yet. Listing a
      //                     noindex redirect in a sitemap is reported as an
      //                     error in Search Console.
      //   /cables         - renders only its empty state while every product is
      //                     still draft, so there is nothing to rank.
      //
      // Remove an entry here when its content is published; the pre-launch
      // checklist tracks both.
      filter: (page) => {
        const { pathname } = new URL(page);

        return !['/quote/success', '/deliveries', '/cables'].some((excluded) =>
          pathname.startsWith(excluded),
        );
      },
    }),
  ],
  build: {
    inlineStylesheets: 'never',
  },
  vite: {
    build: {
      // Keep the nav's plain Astro script external so the production CSP can load it.
      assetsInlineLimit: 0,
    },
  },
});
