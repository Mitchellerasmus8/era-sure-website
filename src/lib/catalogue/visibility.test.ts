import { describe, expect, it } from 'vitest';

import {
  filterPublishedProducts,
  filterVisibleEntries,
} from '@/lib/catalogue/visibility';

const entries = [
  { id: 'draft-cable', data: { status: 'draft' as const } },
  { id: 'published-cable', data: { status: 'published' as const } },
];

describe('filterPublishedProducts', () => {
  it('drops drafts and keeps published entries', () => {
    expect(filterPublishedProducts(entries)).toEqual([entries[1]]);
  });

  it('withholds a draft product whatever the build context says', () => {
    // The point of the function. A draft product carries invented
    // specifications, and the live site proved a non-production CONTEXT can
    // reach the production domain.
    const previous = process.env.CONTEXT;

    for (const context of ['development', 'deploy-preview', 'production']) {
      process.env.CONTEXT = context;
      expect(filterPublishedProducts(entries)).toEqual([entries[1]]);
    }

    process.env.CONTEXT = previous;
  });

  it('returns an empty list when every entry is a draft', () => {
    expect(filterPublishedProducts([entries[0]])).toEqual([]);
  });
});

describe('filterVisibleEntries', () => {
  const categoryEntries = [
    { id: 'draft-category', data: { status: 'draft' as const } },
    { id: 'published-category', data: { status: 'published' as const } },
  ];

  it('filters any status-bearing entry to published entries in production', () => {
    expect(filterVisibleEntries(categoryEntries, 'production')).toEqual([
      categoryEntries[1],
    ]);
  });

  it('keeps drafts visible outside production for any status-bearing entry', () => {
    expect(filterVisibleEntries(categoryEntries, 'deploy-preview')).toEqual(
      categoryEntries,
    );
  });
});
