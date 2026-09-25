import { describe, expect, it } from 'vitest';

import {
  buildCategoryCards,
  findCategoryBySlug,
  sortCategories,
  validateCategories,
  type CategoryEntry,
} from '@/lib/catalogue/categories';

function makeCategory(slug: string, order: number, name = slug): CategoryEntry {
  return {
    id: slug,
    data: {
      slug,
      name,
      order,
      status: 'published',
      summary: `${name} summary.`,
      intro: `${name} intro.`,
      sourceItems: [`${name} source item`],
      typicalVariants: [`${name} typical variant`],
    },
  };
}

describe('validateCategories', () => {
  it('accepts entries with unique slugs and orders', () => {
    expect(() =>
      validateCategories([
        makeCategory('solar-panels', 1),
        makeCategory('inverters', 2),
      ]),
    ).not.toThrow();
  });

  it('reuses the slug assertion and names a duplicate slug', () => {
    expect(() =>
      validateCategories([
        makeCategory('duplicate-category', 1, 'First'),
        makeCategory('duplicate-category', 2, 'Second'),
      ]),
    ).toThrow(/duplicate-category/);
  });

  it('rejects duplicate orders and names the slugs holding the order', () => {
    expect(() =>
      validateCategories([
        makeCategory('cables', 1),
        makeCategory('solar-panels', 1),
      ]),
    ).toThrow(
      'Duplicate category order: order 1 used by cables and solar-panels.',
    );
  });
});

describe('sortCategories', () => {
  it('sorts by order and then by name without mutating the input', () => {
    const entries = [
      makeCategory('zeta', 2, 'Zeta'),
      makeCategory('alpha', 1, 'Alpha'),
      makeCategory('beta', 1, 'Beta'),
    ];

    expect(sortCategories(entries).map((entry) => entry.data.slug)).toEqual([
      'alpha',
      'beta',
      'zeta',
    ]);
    expect(entries.map((entry) => entry.data.slug)).toEqual([
      'zeta',
      'alpha',
      'beta',
    ]);
  });
});

describe('findCategoryBySlug', () => {
  const entries = [makeCategory('cables', 1), makeCategory('switchgear', 2)];

  it('returns the matching entry', () => {
    expect(findCategoryBySlug(entries, 'switchgear')).toBe(entries[1]);
  });

  it('returns undefined when no category matches', () => {
    expect(findCategoryBySlug(entries, 'missing')).toBeUndefined();
  });
});

describe('buildCategoryCards', () => {
  it('returns the shaped overview view model', () => {
    expect(
      buildCategoryCards([makeCategory('solar-panels', 1, 'Solar panels')]),
    ).toEqual([
      {
        slug: 'solar-panels',
        name: 'Solar panels',
        summary: 'Solar panels summary.',
        href: '/products/solar-panels/',
        cardImage: undefined,
      },
    ]);
  });

  // The card photograph moved out of a hard-coded map in CategoryCard.astro and
  // into content, so the view model is now the only thing carrying it to the
  // component. Without this the card silently falls back to its icon.
  it('carries the card image through to the view model', () => {
    const entry = makeCategory('cables', 1, 'Cables');
    const cardImage = {
      src: '/_astro/cable-drum.jpg',
      width: 1600,
      height: 1200,
      format: 'jpg' as const,
    };

    const [card] = buildCategoryCards([
      { ...entry, data: { ...entry.data, cardImage } },
    ]);

    expect(card?.cardImage).toBe(cardImage);
  });

  it('leaves the card image undefined when the category has none', () => {
    const [card] = buildCategoryCards([makeCategory('cables', 1, 'Cables')]);

    expect(card?.cardImage).toBeUndefined();
  });
});
