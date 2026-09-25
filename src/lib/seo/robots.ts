/**
 * Resolves the effective `robots` meta value for a page.
 *
 * This exists because of a Netlify constraint, not a preference: headers in
 * `netlify.toml` are GLOBAL. They cannot be scoped to a deploy context no
 * matter where they are declared in the file, so the site-wide
 * `X-Robots-Tag: noindex` that guarded the pre-launch site could not simply be
 * narrowed to previews — it was all-or-nothing, and "all" meant an invisible
 * production site.
 *
 * Netlify does add `X-Robots-Tag: noindex` to deploy previews on its own, but
 * that is its behaviour to change, it has been reported lapsing, and it does
 * not cover branch deploys. Since the site already renders a `robots` meta tag
 * for `/404/` and `/quote/success/`, the cheapest durable guard is to make that
 * existing tag context-aware rather than depend on a header we do not control.
 *
 * `CONTEXT` is set by Netlify on every build (`production`, `deploy-preview`,
 * `branch-deploy`). An ABSENT value means a local `astro build` or `astro dev`
 * — neither is served to a crawler, so those keep the page's own value and the
 * e2e suite can still assert real production metadata.
 */
export const NON_PRODUCTION_ROBOTS = 'noindex, nofollow';

const PRODUCTION_CONTEXT = 'production';

export function resolveRobots(
  pageRobots: string | undefined,
  context: string | undefined,
): string | undefined {
  if (context !== undefined && context !== PRODUCTION_CONTEXT) {
    return NON_PRODUCTION_ROBOTS;
  }

  return pageRobots;
}
