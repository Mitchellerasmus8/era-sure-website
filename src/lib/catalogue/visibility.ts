export type BuildContext = string | undefined;

type StatusEntry = {
  data: {
    status: 'draft' | 'published';
  };
};

export function filterVisibleEntries<T extends StatusEntry>(
  entries: readonly T[],
  context: BuildContext,
): T[] {
  if (context !== 'production') {
    return [...entries];
  }

  return entries.filter((entry) => entry.data.status === 'published');
}

type ProductEntry = StatusEntry;

/**
 * Keeps only published products, in every build context.
 *
 * This deliberately does NOT take a `BuildContext`, unlike
 * `filterVisibleEntries`. A draft product is not an unfinished page — it is a
 * specification table full of invented illustrative values, and ARCHI §5.2
 * names wrong technical data on a cable supplier's site a commercial and
 * safety liability.
 *
 * It replaced a context-gated filter that was correct and still failed: on
 * 2026-08-26, pointing the real domain at Netlify revealed
 * `/cables/solar-pv-cable-4mm2-single-core/` serving invented voltage,
 * current and temperature ratings on the production domain, because the
 * deployed build was not running as a production context. A guard that depends
 * on an environment variable set by a service outside this repository cannot be
 * the only thing between invented specifications and a customer.
 *
 * Consequence, and it is the intended one: with every seed product still
 * `draft`, no product page is generated at all and `/cables/` renders its
 * empty state. Category pages stop linking there via
 * `hasPublishableCableContent`. Flipping an entry to `published` — which the
 * pre-launch checklist permits only once its specifications come from the
 * client or a manufacturer datasheet — restores all of it.
 */
export function filterPublishedProducts<T extends ProductEntry>(
  entries: readonly T[],
): T[] {
  return entries.filter((entry) => entry.data.status === 'published');
}
