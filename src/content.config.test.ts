import { describe, expect, it } from 'vitest';
import { z } from 'astro/zod';

import {
  createCategorySchema,
  createDeliverySchema,
  productSchema,
} from './content.config';

const validEntry = () => ({
  slug: 'solar-cable-4-mm2',
  name: 'Solar cable 4 mm²',
  category: 'cables',
  status: 'draft',
  summary: 'A four-square-millimetre solar cable.',
  conductorMaterial: 'tinned-copper',
  crossSectionMm2: 4,
  coreCount: 1,
  voltageRating: '1.5/1.5 kV DC',
  currentRatingAmps: 55,
  temperatureMinC: -40,
  temperatureMaxC: 90,
  insulationMaterial: 'XLPE',
  sheathMaterial: 'XLPE',
  uvResistant: true,
  colours: ['black', 'red'],
  lengthsM: [100, 500],
  standards: ['EN 50618'],
  stockNote: 'Available to order.',
  minimumOrderQuantity: '1 drum',
});

function entryWithout(field: string): Record<string, unknown> {
  const entry: Record<string, unknown> = { ...validEntry() };
  delete entry[field];
  return entry;
}

const validCategoryEntry = () => ({
  slug: 'cables',
  name: 'Cables',
  order: 1,
  status: 'published',
  summary: 'Cabling for electrical and renewable-energy projects.',
  intro: 'Era-Sure can source cabling for project requirements.',
  sourceItems: ['Solar PV cable'],
  typicalVariants: ['Flexible cable'],
  brands: ['Aberdare'],
  relatedRoute: '/cables/',
  seoTitle: 'Cables | Era-Sure Renewables',
});

const REAL_VIDEO =
  '/video/enclosures-and-combiners/orange-enclosure-walkthrough.mp4';

const validVideo = () => ({
  src: REAL_VIDEO,
  poster: '@/assets/photography/video-posters/orange-enclosure-walkthrough.jpg',
  title: 'Orange steel enclosure walkthrough',
  description: 'A completed enclosure is opened to show its breaker layout.',
  publishedOn: '2026-08-13',
});

const validPhotoCredit = () => ({
  creator: 'Example photographer',
  title: 'Example photograph',
  sourceUrl: 'https://example.com/photograph',
  license: 'CC BY 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  modification: 'cropped',
});

// This helper defaults to client-owned because omission is not a valid provenance
// state. Tests for third-party media opt into the credit-bearing branch below.
const galleryPhotoOf = (overrides: Record<string, unknown> = {}) => ({
  src: '@/assets/photography/cables/photo.jpg',
  alt: 'Photograph',
  provenance: 'client-owned',
  ...overrides,
});

const galleryOf = (count: number) =>
  Array.from({ length: count }, (_unused, index) => ({
    src: `@/assets/photography/cables/photo-${index}.jpg`,
    alt: `Photograph ${index}`,
    provenance: 'client-owned',
  }));

const deliverySchema = createDeliverySchema(z.string());
// Same substitution as deliverySchema above: a plain string stands in for Astro's
// image() helper, which only exists inside a running content build.
const categorySchema = createCategorySchema(z.string());
const validDeliveryEntry = () => ({
  slug: 'gauteng-solar-delivery',
  title: 'Solar equipment supplied in Gauteng',
  order: 1,
  status: 'draft',
  featured: true,
  summary: 'Equipment sourced and delivered for renewable-energy work.',
  location: 'Gauteng',
  projectType: 'Commercial solar supply',
  deliveryPeriod: 'August 2026',
  suppliedItems: ['Solar panels', 'Inverters'],
  images: [
    {
      src: './photo.jpg',
      alt: 'Palletised solar panels prepared for delivery.',
    },
  ],
  socialUrl: 'https://www.linkedin.com/posts/example',
  publicationPermission: 'pending',
});

describe('productSchema', () => {
  it('accepts a fully valid cable entry', () => {
    expect(productSchema.safeParse(validEntry()).success).toBe(true);
  });

  it('rejects a missing required field', () => {
    expect(productSchema.safeParse(entryWithout('voltageRating')).success).toBe(
      false,
    );
  });

  it.each(['name', 'summary', 'voltageRating'] as const)(
    'rejects an empty %s',
    (field) => {
      expect(
        productSchema.safeParse({ ...validEntry(), [field]: '' }).success,
      ).toBe(false);
    },
  );

  it.each([
    'insulationMaterial',
    'sheathMaterial',
    'stockNote',
    'minimumOrderQuantity',
  ] as const)('rejects an empty optional %s when present', (field) => {
    expect(
      productSchema.safeParse({ ...validEntry(), [field]: '' }).success,
    ).toBe(false);
  });

  it('rejects a non-numeric crossSectionMm2', () => {
    expect(
      productSchema.safeParse({ ...validEntry(), crossSectionMm2: '4' })
        .success,
    ).toBe(false);
  });

  it('rejects a negative crossSectionMm2', () => {
    expect(
      productSchema.safeParse({ ...validEntry(), crossSectionMm2: -4 }).success,
    ).toBe(false);
  });

  it.each([0, -1, 1.5])('rejects an invalid coreCount of %s', (coreCount) => {
    expect(
      productSchema.safeParse({ ...validEntry(), coreCount }).success,
    ).toBe(false);
  });

  it('rejects an out-of-enum conductorMaterial', () => {
    expect(
      productSchema.safeParse({ ...validEntry(), conductorMaterial: 'silver' })
        .success,
    ).toBe(false);
  });

  it('rejects an out-of-enum status', () => {
    expect(
      productSchema.safeParse({ ...validEntry(), status: 'archived' }).success,
    ).toBe(false);
  });

  it('rejects a category other than cables', () => {
    expect(
      productSchema.safeParse({ ...validEntry(), category: 'panels' }).success,
    ).toBe(false);
  });

  it('rejects a temperature range with only one endpoint', () => {
    expect(
      productSchema.safeParse(entryWithout('temperatureMaxC')).success,
    ).toBe(false);
  });

  it('rejects a temperature range whose minimum is greater than its maximum', () => {
    expect(
      productSchema.safeParse({
        ...validEntry(),
        temperatureMinC: 90,
        temperatureMaxC: -40,
      }).success,
    ).toBe(false);
  });

  it.each(['solar cable-4-mm2', 'Solar-cable-4-mm2', 'solar_cable-4-mm2'])(
    'rejects a non-kebab-case slug: %s',
    (slug) => {
      expect(productSchema.safeParse({ ...validEntry(), slug }).success).toBe(
        false,
      );
    },
  );

  it('rejects a datasheet path for a file that does not exist', () => {
    const result = productSchema.safeParse({
      ...validEntry(),
      datasheetPath: '/datasheets/not-present.pdf',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const message = result.error.issues
        .map((issue) => issue.message)
        .join(' ');
      expect(message).toContain('solar-cable-4-mm2');
      expect(message).toContain('/datasheets/not-present.pdf');
    }
  });

  it('rejects a datasheet path outside the public datasheets directory', () => {
    expect(
      productSchema.safeParse({
        ...validEntry(),
        datasheetPath: '/documents/spec.pdf',
      }).success,
    ).toBe(false);
  });
});

describe('categorySchema', () => {
  it('accepts a fully valid category entry', () => {
    expect(categorySchema.safeParse(validCategoryEntry()).success).toBe(true);
  });

  it.each(['name', 'summary', 'intro', 'headline', 'rangeHeading'] as const)(
    'rejects an empty %s',
    (field) => {
      expect(
        categorySchema.safeParse({ ...validCategoryEntry(), [field]: '' })
          .success,
      ).toBe(false);
    },
  );

  it('accepts a headline and range heading', () => {
    expect(
      categorySchema.safeParse({
        ...validCategoryEntry(),
        headline: 'Solar PV, armoured and power cables',
        rangeHeading: 'Frequently supplied items:',
      }).success,
    ).toBe(true);
  });

  it('rejects a category with no status', () => {
    const entry = { ...validCategoryEntry() };
    delete (entry as Partial<typeof entry>).status;

    expect(categorySchema.safeParse(entry).success).toBe(false);
  });

  it.each(['solar cable', 'Solar-cable', 'solar_cable'])(
    'rejects a non-kebab-case category slug: %s',
    (slug) => {
      expect(
        categorySchema.safeParse({ ...validCategoryEntry(), slug }).success,
      ).toBe(false);
    },
  );

  it.each([0, -1])('rejects a non-positive category order of %s', (order) => {
    expect(
      categorySchema.safeParse({ ...validCategoryEntry(), order }).success,
    ).toBe(false);
  });

  it('rejects a fractional category order', () => {
    expect(
      categorySchema.safeParse({ ...validCategoryEntry(), order: 1.5 }).success,
    ).toBe(false);
  });

  it('rejects an empty sourceItems array', () => {
    expect(
      categorySchema.safeParse({ ...validCategoryEntry(), sourceItems: [] })
        .success,
    ).toBe(false);
  });
});

describe('deliverySchema', () => {
  it('accepts a complete draft highlight', () => {
    expect(deliverySchema.safeParse(validDeliveryEntry()).success).toBe(true);
  });

  it('requires at least one supplied item and one photograph', () => {
    expect(
      deliverySchema.safeParse({
        ...validDeliveryEntry(),
        suppliedItems: [],
      }).success,
    ).toBe(false);
    expect(
      deliverySchema.safeParse({ ...validDeliveryEntry(), images: [] }).success,
    ).toBe(false);
  });

  it('requires meaningful alt text for every photograph', () => {
    expect(
      deliverySchema.safeParse({
        ...validDeliveryEntry(),
        images: [{ src: './photo.jpg', alt: '' }],
      }).success,
    ).toBe(false);
  });

  it('rejects non-HTTPS social links', () => {
    expect(
      deliverySchema.safeParse({
        ...validDeliveryEntry(),
        socialUrl: 'http://www.linkedin.com/posts/example',
      }).success,
    ).toBe(false);
  });

  it('blocks publishing until permission is confirmed', () => {
    const result = deliverySchema.safeParse({
      ...validDeliveryEntry(),
      status: 'published',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('cannot be published');
    }
  });

  it('accepts a published highlight with confirmed permission', () => {
    expect(
      deliverySchema.safeParse({
        ...validDeliveryEntry(),
        status: 'published',
        publicationPermission: 'confirmed',
      }).success,
    ).toBe(true);
  });
});

describe('categorySchema media fields', () => {
  it('accepts an entry carrying a gallery and videos', () => {
    const result = categorySchema.safeParse({
      ...validCategoryEntry(),
      cardImage: '@/assets/photography/cables/cable-drum-red-black.jpg',
      galleryHeading: 'Cable supply in practice',
      galleryIntro: 'Photographs from Era-Sure cable orders.',
      gallery: galleryOf(3),
      videos: [validVideo()],
    });

    expect(result.success).toBe(true);
  });

  it('accepts an entry with no media at all', () => {
    expect(categorySchema.safeParse(validCategoryEntry()).success).toBe(true);
  });

  describe('gallery provenance and credits', () => {
    it('accepts a client-owned photograph without a credit', () => {
      expect(
        categorySchema.safeParse({
          ...validCategoryEntry(),
          gallery: [galleryPhotoOf()],
        }).success,
      ).toBe(true);
    });

    it('accepts a third-party photograph with a full credit', () => {
      expect(
        categorySchema.safeParse({
          ...validCategoryEntry(),
          gallery: [
            galleryPhotoOf({
              provenance: 'third-party',
              credit: validPhotoCredit(),
            }),
          ],
        }).success,
      ).toBe(true);
    });

    it('rejects a gallery photograph with missing provenance', () => {
      const withoutProvenance: Record<string, unknown> = galleryPhotoOf();
      delete withoutProvenance.provenance;

      expect(
        categorySchema.safeParse({
          ...validCategoryEntry(),
          gallery: [withoutProvenance],
        }).success,
      ).toBe(false);
    });

    it('rejects a gallery photograph with an invalid provenance value', () => {
      expect(
        categorySchema.safeParse({
          ...validCategoryEntry(),
          gallery: [galleryPhotoOf({ provenance: 'licensed' })],
        }).success,
      ).toBe(false);
    });

    it('rejects a third-party photograph without a credit', () => {
      expect(
        categorySchema.safeParse({
          ...validCategoryEntry(),
          gallery: [galleryPhotoOf({ provenance: 'third-party' })],
        }).success,
      ).toBe(false);
    });

    it('rejects a client-owned photograph carrying a credit', () => {
      expect(
        categorySchema.safeParse({
          ...validCategoryEntry(),
          gallery: [galleryPhotoOf({ credit: validPhotoCredit() })],
        }).success,
      ).toBe(false);
    });

    // Each required attribution scalar has its own refusal case. `modification`
    // is intentionally absent from this table because the schema makes it optional.
    it.each([
      'creator',
      'title',
      'sourceUrl',
      'license',
      'licenseUrl',
    ] as const)('rejects a third-party credit missing %s', (field) => {
      const incompleteCredit: Record<string, unknown> = validPhotoCredit();
      delete incompleteCredit[field];

      expect(
        categorySchema.safeParse({
          ...validCategoryEntry(),
          gallery: [
            galleryPhotoOf({
              provenance: 'third-party',
              credit: incompleteCredit,
            }),
          ],
        }).success,
      ).toBe(false);
    });

    it('rejects an empty-string credit creator', () => {
      expect(
        categorySchema.safeParse({
          ...validCategoryEntry(),
          gallery: [
            galleryPhotoOf({
              provenance: 'third-party',
              credit: { ...validPhotoCredit(), creator: '' },
            }),
          ],
        }).success,
      ).toBe(false);
    });

    it.each(['sourceUrl', 'licenseUrl'] as const)(
      'rejects a credit with a non-URL %s',
      (field) => {
        expect(
          categorySchema.safeParse({
            ...validCategoryEntry(),
            gallery: [
              galleryPhotoOf({
                provenance: 'third-party',
                credit: { ...validPhotoCredit(), [field]: 'not-a-url' },
              }),
            ],
          }).success,
        ).toBe(false);
      },
    );

    // Each field is required because the CC BY and BY-SA deeds ask for all of
    // them; a credit missing any one is not an attribution, and a schema that
    // accepted a partial one would publish a licence breach that reads as fine.
    it.each([
      'creator',
      'title',
      'sourceUrl',
      'license',
      'licenseUrl',
    ] as const)('rejects a credit missing %s', (field) => {
      const credit: Record<string, unknown> = { ...validPhotoCredit() };
      delete credit[field];

      expect(
        categorySchema.safeParse({
          ...validCategoryEntry(),
          gallery: [galleryPhotoOf({ provenance: 'third-party', credit })],
        }).success,
      ).toBe(false);
    });
  });

  // Empty alt is the whole reason alt is validated rather than merely typed:
  // z.string() accepts "", and a blank alt publishes an unlabelled image.
  it('rejects a gallery photograph with empty alt text', () => {
    expect(
      categorySchema.safeParse({
        ...validCategoryEntry(),
        gallery: [
          {
            src: '@/assets/photography/cables/a.jpg',
            alt: '',
            provenance: 'client-owned',
          },
        ],
      }).success,
    ).toBe(false);
  });

  it('rejects a gallery photograph with whitespace-only alt text', () => {
    expect(
      categorySchema.safeParse({
        ...validCategoryEntry(),
        gallery: [
          {
            src: '@/assets/photography/cables/a.jpg',
            alt: '   ',
            provenance: 'client-owned',
          },
        ],
      }).success,
    ).toBe(false);
  });

  it('rejects an empty gallery array', () => {
    expect(
      categorySchema.safeParse({ ...validCategoryEntry(), gallery: [] })
        .success,
    ).toBe(false);
  });

  it('accepts a gallery at the thirty-photograph cap', () => {
    expect(
      categorySchema.safeParse({
        ...validCategoryEntry(),
        gallery: galleryOf(30),
      }).success,
    ).toBe(true);
  });

  it('rejects a gallery over the thirty-photograph cap', () => {
    expect(
      categorySchema.safeParse({
        ...validCategoryEntry(),
        gallery: galleryOf(31),
      }).success,
    ).toBe(false);
  });

  it('rejects an empty videos array', () => {
    expect(
      categorySchema.safeParse({ ...validCategoryEntry(), videos: [] }).success,
    ).toBe(false);
  });

  // ARCHI §17: a 404 on a video is the same class of failure as a 404 on a
  // datasheet, so the build must fail rather than ship a broken player.
  it('rejects a video file that does not exist under public/', () => {
    const result = categorySchema.safeParse({
      ...validCategoryEntry(),
      videos: [{ ...validVideo(), src: '/video/not-present.mp4' }],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.map((issue) => issue.message).join(' '),
      ).toContain('/video/not-present.mp4');
    }
  });

  it.each([
    '/videos/clip.mp4',
    '/assets/clip.mp4',
    'video/clip.mp4',
    '../public/video/clip.mp4',
  ])('rejects a video path outside /video/: %s', (src) => {
    expect(
      categorySchema.safeParse({
        ...validCategoryEntry(),
        videos: [{ ...validVideo(), src }],
      }).success,
    ).toBe(false);
  });

  // The poster is what a visitor sees before pressing play, and its dimensions
  // are what reserve the right space for a portrait clip. Without it the video
  // renders as an empty box that shifts the page when it loads.
  it('rejects a video with no poster', () => {
    const withoutPoster: Record<string, unknown> = { ...validVideo() };
    delete withoutPoster.poster;

    expect(
      categorySchema.safeParse({
        ...validCategoryEntry(),
        videos: [withoutPoster],
      }).success,
    ).toBe(false);
  });

  it.each(['title', 'description', 'src'] as const)(
    'rejects a video with no %s',
    (field) => {
      const incomplete: Record<string, unknown> = { ...validVideo() };
      delete incomplete[field];

      expect(
        categorySchema.safeParse({
          ...validCategoryEntry(),
          videos: [incomplete],
        }).success,
      ).toBe(false);
    },
  );

  // `poster` is deliberately absent from this list. Image fields are validated
  // by Astro's `image()`, which these tests substitute with a plain string —
  // and `z.string()` accepts `''` where the real helper fails to resolve it. An
  // empty path is caught by `npm run build`, not here. Adding `.min(1)` in front
  // of `image()` was tried and reverted: Astro types the helper's *input* as the
  // ImageMetadata object even though it takes a string at runtime, so piping
  // pushed `unknown` through nine call sites for a marginally better message.
  it.each(['title', 'description'] as const)(
    'rejects an empty video %s',
    (field) => {
      expect(
        categorySchema.safeParse({
          ...validCategoryEntry(),
          videos: [{ ...validVideo(), [field]: '' }],
        }).success,
      ).toBe(false);
    },
  );

  it('rejects a video with no publication date', () => {
    const withoutDate: Record<string, unknown> = { ...validVideo() };
    delete withoutDate.publishedOn;

    expect(
      categorySchema.safeParse({
        ...validCategoryEntry(),
        videos: [withoutDate],
      }).success,
    ).toBe(false);
  });

  // publishedOn is emitted as the VideoObject uploadDate — it is no longer shown
  // on the page — so a value that merely *looks* like a date is not enough:
  // 2026-02-31 parses under a regex alone and is not a day that exists.
  it.each([
    '2026-13-01',
    '2026-02-31',
    '2026-00-10',
    '13 August 2026',
    '2026-8-13',
    '2026-08-13T00:00:00Z',
    '',
  ])('rejects a malformed publication date: %s', (publishedOn) => {
    expect(
      categorySchema.safeParse({
        ...validCategoryEntry(),
        videos: [{ ...validVideo(), publishedOn }],
      }).success,
    ).toBe(false);
  });

  it('accepts a real leap day', () => {
    expect(
      categorySchema.safeParse({
        ...validCategoryEntry(),
        videos: [{ ...validVideo(), publishedOn: '2028-02-29' }],
      }).success,
    ).toBe(true);
  });

  it('rejects a leap day in a non-leap year', () => {
    expect(
      categorySchema.safeParse({
        ...validCategoryEntry(),
        videos: [{ ...validVideo(), publishedOn: '2027-02-29' }],
      }).success,
    ).toBe(false);
  });

  it.each(['galleryHeading', 'galleryIntro'] as const)(
    'rejects an empty %s',
    (field) => {
      expect(
        categorySchema.safeParse({
          ...validCategoryEntry(),
          gallery: galleryOf(2),
          [field]: '',
        }).success,
      ).toBe(false);
    },
  );
});
