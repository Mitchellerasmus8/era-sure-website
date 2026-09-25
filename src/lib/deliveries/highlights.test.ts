import { describe, expect, it } from 'vitest';

import type { DeliveryHighlightEntry } from './highlights';
import {
  filterPublishableDeliveries,
  getDeliveryUrl,
  selectFeaturedDeliveryHighlights,
  sortDeliveryHighlights,
  validateDeliveryHighlights,
} from './highlights';

function entry(
  slug: string,
  order: number,
  featured = false,
): DeliveryHighlightEntry {
  return {
    id: `${slug}.yaml`,
    collection: 'deliveries',
    data: {
      slug,
      title: slug,
      order,
      status: 'draft',
      featured,
      summary: `${slug} summary`,
      location: 'South Africa',
      suppliedItems: ['Equipment'],
      images: [],
      publicationPermission: 'pending',
    },
  } as unknown as DeliveryHighlightEntry;
}

describe('delivery highlights', () => {
  it('builds a stable delivery route', () => {
    expect(getDeliveryUrl('gauteng-solar-delivery')).toBe(
      '/deliveries/gauteng-solar-delivery/',
    );
  });

  it('sorts entries by the explicit editorial order', () => {
    const entries = [entry('third', 3), entry('first', 1), entry('second', 2)];

    expect(
      sortDeliveryHighlights(entries).map((item) => item.data.slug),
    ).toEqual(['first', 'second', 'third']);
  });

  it('selects featured entries and respects the limit', () => {
    const entries = [
      entry('first', 1),
      entry('second', 2, true),
      entry('third', 3, true),
    ];

    expect(
      selectFeaturedDeliveryHighlights(entries, 1).map(
        (item) => item.data.slug,
      ),
    ).toEqual(['second']);
  });

  it('falls back to the first ordered entries when none are featured', () => {
    const entries = [entry('second', 2), entry('first', 1)];

    expect(
      selectFeaturedDeliveryHighlights(entries).map((item) => item.data.slug),
    ).toEqual(['first', 'second']);
  });

  it('rejects duplicate slugs and duplicate order values', () => {
    expect(() =>
      validateDeliveryHighlights([entry('same', 1), entry('same', 2)]),
    ).toThrow('Duplicate delivery highlight slug');

    expect(() =>
      validateDeliveryHighlights([entry('first', 1), entry('second', 1)]),
    ).toThrow('Duplicate delivery highlight order');
  });
});

describe('filterPublishableDeliveries', () => {
  function publishable(slug: string): DeliveryHighlightEntry {
    const base = entry(slug, 1);

    return {
      ...base,
      data: {
        ...base.data,
        status: 'published',
        publicationPermission: 'confirmed',
      },
    } as unknown as DeliveryHighlightEntry;
  }

  it('drops the draft placeholder entry', () => {
    expect(filterPublishableDeliveries([entry('example', 1)])).toEqual([]);
  });

  it('keeps a published entry with confirmed permission', () => {
    const approved = publishable('gauteng-solar-delivery');

    expect(filterPublishableDeliveries([approved])).toEqual([approved]);
  });

  it('drops a published entry whose permission is still pending', () => {
    const approved = publishable('gauteng-solar-delivery');
    const unpermitted = {
      ...approved,
      data: { ...approved.data, publicationPermission: 'pending' },
    } as unknown as DeliveryHighlightEntry;

    expect(filterPublishableDeliveries([unpermitted])).toEqual([]);
  });

  it('ignores the build context entirely', () => {
    // The whole point: this must hold whatever CONTEXT says, because the live
    // site proved a non-production CONTEXT can reach the production domain.
    const previous = process.env.CONTEXT;
    process.env.CONTEXT = 'deploy-preview';

    try {
      expect(filterPublishableDeliveries([entry('example', 1)])).toEqual([]);
    } finally {
      process.env.CONTEXT = previous;
    }
  });
});
