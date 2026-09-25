import type { CollectionEntry } from 'astro:content';

export type DeliveryHighlightEntry = CollectionEntry<'deliveries'>;

export function getDeliveryUrl(slug: string): string {
  return `/deliveries/${slug}/`;
}

export function sortDeliveryHighlights(
  entries: readonly DeliveryHighlightEntry[],
): DeliveryHighlightEntry[] {
  return [...entries].sort(
    (left, right) =>
      left.data.order - right.data.order ||
      left.data.title.localeCompare(right.data.title),
  );
}

export function selectFeaturedDeliveryHighlights(
  entries: readonly DeliveryHighlightEntry[],
  limit = 3,
): DeliveryHighlightEntry[] {
  if (limit <= 0) {
    return [];
  }

  const sorted = sortDeliveryHighlights(entries);
  const featured = sorted.filter((entry) => entry.data.featured);

  return (featured.length > 0 ? featured : sorted).slice(0, limit);
}

export function validateDeliveryHighlights(
  entries: readonly DeliveryHighlightEntry[],
): void {
  const slugs = new Set<string>();
  const orders = new Set<number>();

  for (const entry of entries) {
    if (slugs.has(entry.data.slug)) {
      throw new Error(`Duplicate delivery highlight slug: ${entry.data.slug}`);
    }

    if (orders.has(entry.data.order)) {
      throw new Error(
        `Duplicate delivery highlight order: ${entry.data.order}`,
      );
    }

    slugs.add(entry.data.slug);
    orders.add(entry.data.order);
  }
}

/**
 * Keeps only the delivery highlights that are genuinely publishable.
 *
 * This deliberately does NOT consult the build context, unlike
 * `filterVisibleEntries`. A draft delivery is not an unfinished page — it is a
 * fabricated claim about work performed for a customer, and the seed entry is
 * literally black placeholder artwork captioned "development placeholder only".
 * There is no audience, on any URL, for whom showing that is correct.
 *
 * The context-based gate was already in place and is still not enough: it
 * depends on `CONTEXT` being `production`, and the live site proved that
 * assumption can fail silently — the placeholder entry was reachable on the
 * production domain. This filter cannot fail that way because it reads only
 * the entry's own data.
 *
 * `publicationPermission` is checked alongside `status` even though the content
 * schema already refuses that combination. The schema protects the build; this
 * protects the page, and the rule stays legible if either one is ever relaxed.
 */
export function filterPublishableDeliveries(
  entries: readonly DeliveryHighlightEntry[],
): DeliveryHighlightEntry[] {
  return entries.filter(
    (entry) =>
      entry.data.status === 'published' &&
      entry.data.publicationPermission === 'confirmed',
  );
}
