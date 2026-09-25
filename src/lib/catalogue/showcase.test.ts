import type { ImageMetadata } from 'astro';
import { describe, expect, it } from 'vitest';

import type { CategoryEntry } from '@/lib/catalogue/categories';
import type { GalleryPhoto } from '@/lib/catalogue/gallery';

import { buildShowcaseView } from './showcase';

const credit = {
  creator: 'Example photographer',
  title: 'Example photograph',
  sourceUrl: 'https://example.com/photograph',
  license: 'CC BY 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
};

function image(slug: string): ImageMetadata {
  return {
    src: `/_astro/${slug}.jpg`,
    width: 1200,
    height: 900,
    format: 'jpg',
  };
}

function photo(
  category: string,
  index: number,
  provenance: GalleryPhoto['provenance'] = 'client-owned',
): GalleryPhoto {
  return provenance === 'client-owned'
    ? {
        src: image(`${category}-${index}`),
        alt: `${category} photograph ${index}`,
        provenance,
      }
    : {
        src: image(`${category}-${index}`),
        alt: `${category} photograph ${index}`,
        provenance,
        credit,
      };
}

function photos(category: string, count: number): GalleryPhoto[] {
  return Array.from({ length: count }, (_unused, index) =>
    photo(category, index + 1),
  );
}

function category(
  slug: string,
  order: number,
  gallery?: GalleryPhoto[],
): CategoryEntry {
  return {
    id: slug,
    data: {
      slug,
      name: slug,
      order,
      status: 'published',
      summary: `${slug} summary`,
      intro: `${slug} intro`,
      sourceItems: [`${slug} equipment`],
      gallery,
    },
  };
}

describe('buildShowcaseView', () => {
  it('interleaves photographs round-robin in category order', () => {
    const result = buildShowcaseView([
      category('cables', 1, photos('cables', 3)),
      category('enclosures', 2, photos('enclosures', 2)),
    ]);

    expect(result?.items.map((item) => item.alt)).toEqual([
      'cables photograph 1',
      'enclosures photograph 1',
      'cables photograph 2',
      'enclosures photograph 2',
      'cables photograph 3',
    ]);
  });

  it('returns the same ordering across repeated builds', () => {
    const categories = [
      category('cables', 1, photos('cables', 4)),
      category('enclosures', 2, photos('enclosures', 4)),
    ];

    expect(buildShowcaseView(categories)).toEqual(
      buildShowcaseView(categories),
    );
  });

  it('excludes photographs with third-party provenance', () => {
    const result = buildShowcaseView([
      category('stock', 1, [photo('stock', 1, 'third-party')]),
      category('client', 2, photos('client', 4)),
    ]);

    expect(result?.items.map((item) => item.alt)).not.toContain(
      'stock photograph 1',
    );
  });

  it('honours the eight-photograph cap', () => {
    const result = buildShowcaseView([
      category('first', 1, photos('first', 4)),
      category('second', 2, photos('second', 4)),
      category('third', 3, photos('third', 4)),
    ]);

    expect(result?.items).toHaveLength(8);
  });

  it('returns null below the four-photograph minimum', () => {
    expect(
      buildShowcaseView([category('client', 1, photos('client', 3))]),
    ).toBeNull();
  });

  it('allows a category with no gallery to contribute nothing', () => {
    const result = buildShowcaseView([
      category('empty', 1),
      category('client', 2, photos('client', 4)),
    ]);

    expect(result?.items.map((item) => item.alt)).toEqual([
      'client photograph 1',
      'client photograph 2',
      'client photograph 3',
      'client photograph 4',
    ]);
  });

  it('allows an all-credited category to contribute nothing', () => {
    const result = buildShowcaseView([
      category('credited', 1, [
        photo('credited', 1, 'third-party'),
        photo('credited', 2, 'third-party'),
      ]),
      category('client', 2, photos('client', 4)),
    ]);

    expect(result?.items.every((item) => item.alt.startsWith('client'))).toBe(
      true,
    );
  });

  it('returns null for an empty collection', () => {
    expect(buildShowcaseView([])).toBeNull();
  });
});
