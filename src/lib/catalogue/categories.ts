import type { ImageMetadata } from 'astro';

import type { CategoryVideo, GalleryPhoto } from '@/lib/catalogue/gallery';
import { assertUniqueSlugs } from '@/lib/catalogue/slugs';

export interface CategoryData {
  slug: string;
  name: string;
  order: number;
  status: 'draft' | 'published';
  summary: string;
  intro: string;
  sourceItems: string[];
  typicalVariants?: string[];
  brands?: string[];
  relatedRoute?: string;
  seoTitle?: string;
  cardImage?: ImageMetadata;
  gallery?: GalleryPhoto[];
  videos?: CategoryVideo[];
}

export interface CategoryEntry {
  id?: string;
  data: CategoryData;
}

export interface CategoryCard {
  slug: string;
  name: string;
  summary: string;
  href: string;
  cardImage?: ImageMetadata;
}

export function validateCategories(entries: readonly CategoryEntry[]): void {
  assertUniqueSlugs(entries);

  const slugsByOrder = new Map<number, string[]>();

  entries.forEach((entry) => {
    const slugs = slugsByOrder.get(entry.data.order) ?? [];
    slugs.push(entry.data.slug);
    slugsByOrder.set(entry.data.order, slugs);
  });

  const duplicateOrders = [...slugsByOrder.entries()].filter(
    ([, slugs]) => slugs.length > 1,
  );

  if (duplicateOrders.length === 0) {
    return;
  }

  const details = duplicateOrders
    .map(([order, slugs]) => `order ${order} used by ${slugs.join(' and ')}`)
    .join('; ');

  throw new Error(`Duplicate category order: ${details}.`);
}

export function sortCategories<T extends CategoryEntry>(
  entries: readonly T[],
): T[] {
  return [...entries].sort(
    (first, second) =>
      first.data.order - second.data.order ||
      first.data.name.localeCompare(second.data.name),
  );
}

export function findCategoryBySlug<T extends CategoryEntry>(
  entries: readonly T[],
  slug: string,
): T | undefined {
  return entries.find((entry) => entry.data.slug === slug);
}

export function buildCategoryCards(
  entries: readonly CategoryEntry[],
): CategoryCard[] {
  return entries.map((entry) => ({
    slug: entry.data.slug,
    name: entry.data.name,
    summary: entry.data.summary,
    href: `/products/${entry.data.slug}/`,
    cardImage: entry.data.cardImage,
  }));
}
