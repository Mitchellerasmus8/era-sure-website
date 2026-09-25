import { statSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { glob } from 'astro/loaders';
import { defineCollection } from 'astro:content';
// `astro/zod`, not `astro:content` (whose `z` is deprecated in Astro 7) and not
// a direct `zod` dependency. This is Astro's own copy, so it can never drift
// from the version validating content at build time, and there is no pin to
// keep in step.
import { z } from 'astro/zod';

const publicDirectory = fileURLToPath(new URL('../public/', import.meta.url));

const nonEmptyString = z.string().trim().min(1);
const slugSchema = nonEmptyString.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

/**
 * Attribution for a third-party photograph. Every field except `modification`
 * is required because the CC BY and BY-SA deeds ask for all of them — creator,
 * title, source, and the licence *with a link* — and an attribution missing one
 * of those is not an attribution. `modification` records a crop or composite,
 * which those deeds also require to be indicated.
 *
 * Copy the values from `src/assets/photography/THIRD_PARTY_IMAGES.md`; do not
 * paraphrase a licence name.
 */
const photoCreditSchema = z.object({
  creator: nonEmptyString,
  title: nonEmptyString,
  sourceUrl: z.url(),
  license: nonEmptyString,
  licenseUrl: z.url(),
  modification: nonEmptyString.optional(),
});

/**
 * Required, though nothing renders it. It is the `VideoObject` `uploadDate` in
 * the category page's structured data, which is why the date left the visible
 * caption but not the schema: a stale-looking "Published 13 August 2026" under
 * every clip ages the page, while the machine-readable upload date does not.
 */
const publishedOnSchema = nonEmptyString
  .regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'publishedOn must use YYYY-MM-DD format.',
  })
  .refine(
    (value) => {
      const date = new Date(`${value}T00:00:00.000Z`);
      return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
      );
    },
    { message: 'publishedOn must be a real calendar date.' },
  );

export function createCategorySchema<T extends z.ZodType>(imageSchema: T) {
  return z
    .object({
      slug: slugSchema,
      name: nonEmptyString,
      // The page's h1, in the words a buyer searches ("Cable trays, ladders and
      // trunking"). `name` stays the short label for cards, breadcrumbs and the
      // related-range links, where a keyword phrase would crowd the layout.
      // Absent, the h1 falls back to `name`.
      headline: nonEmptyString.optional(),
      order: z.number().int().positive(),
      status: z.enum(['draft', 'published']),
      summary: nonEmptyString,
      intro: nonEmptyString,
      sourceItems: z.array(nonEmptyString).min(1),
      // Heading over `sourceItems`. Absent, the page uses "The range includes".
      rangeHeading: nonEmptyString.optional(),
      // Optional, and deliberately so. Only some categories came with genuine
      // variant detail from the client; requiring it for all six would force either
      // a restatement of sourceItems or invented specifics, and inventing product
      // detail on a supplier's site is the failure ARCHI §5.5 exists to prevent.
      typicalVariants: z.array(nonEmptyString).min(1).optional(),
      brands: z.array(nonEmptyString).optional(),
      relatedRoute: nonEmptyString.optional(),
      seoTitle: nonEmptyString.optional(),
      cardImage: imageSchema.optional(),
      // Gallery copy is per-category because the claim it makes differs:
      // electrical consumables still shows licensed stock photography and must
      // not imply Era-Sure supplied what is pictured, while the other five show
      // the company's own work and should say so. Absent, `buildGalleryView`
      // falls back to wording that claims neither.
      galleryHeading: nonEmptyString.optional(),
      galleryIntro: nonEmptyString.optional(),
      gallery: z
        .array(
          z.object({
            src: imageSchema,
            alt: nonEmptyString,
            caption: nonEmptyString.optional(),
            // Required, with no default, for the same reason `status` is: a
            // default would let a photograph make a claim by omission. Marking
            // a photograph `client-owned` makes it eligible for the home
            // showcase, which states that Era-Sure supplied what is pictured —
            // so one forgotten field would put a licensed stock photograph
            // under a supply claim, with no error anywhere. An editor has to
            // say which kind it is.
            provenance: z.enum(['client-owned', 'third-party']),
            credit: photoCreditSchema.optional(),
          }),
        )
        .min(1)
        .max(30)
        .optional(),
      videos: z
        .array(
          z.object({
            src: nonEmptyString,
            poster: imageSchema,
            title: nonEmptyString,
            description: nonEmptyString,
            publishedOn: publishedOnSchema,
          }),
        )
        .min(1)
        .max(6)
        .optional(),
    })
    .superRefine((data, context) => {
      data.videos?.forEach((video, index) => {
        if (!video.src.startsWith('/video/')) {
          context.addIssue({
            code: 'custom',
            path: ['videos', index, 'src'],
            message: 'Video src must start with "/video/".',
          });
          return;
        }

        if (!isPublicFile(video.src)) {
          context.addIssue({
            code: 'custom',
            path: ['videos', index, 'src'],
            message: `Video file "${video.src}" does not exist under public/.`,
          });
        }
      });

      // Both directions, deliberately. Requiring a credit on a third-party
      // photograph is the obvious half; rejecting one on a client-owned
      // photograph is the half that stops a stale credit block surviving a
      // provenance correction and attributing a work nobody licensed.
      data.gallery?.forEach((photo, index) => {
        if (photo.provenance === 'third-party' && photo.credit === undefined) {
          context.addIssue({
            code: 'custom',
            path: ['gallery', index, 'credit'],
            message:
              'Third-party gallery photographs must provide a credit object.',
          });
        }

        if (photo.provenance === 'client-owned' && photo.credit !== undefined) {
          context.addIssue({
            code: 'custom',
            path: ['gallery', index, 'credit'],
            message:
              'Client-owned gallery photographs must not provide a credit object.',
          });
        }
      });
    });
}

const secureUrl = z.url().refine((value) => value.startsWith('https://'), {
  message: 'Links must use HTTPS.',
});

export function createDeliverySchema<T extends z.ZodType>(imageSchema: T) {
  return z
    .object({
      slug: slugSchema,
      title: nonEmptyString,
      order: z.number().int().positive(),
      status: z.enum(['draft', 'published']),
      featured: z.boolean(),
      summary: nonEmptyString,
      location: nonEmptyString,
      projectType: nonEmptyString.optional(),
      deliveryPeriod: nonEmptyString.optional(),
      suppliedItems: z.array(nonEmptyString).min(1),
      images: z
        .array(
          z.object({
            src: imageSchema,
            alt: nonEmptyString,
            caption: nonEmptyString.optional(),
          }),
        )
        .min(1)
        .max(8),
      socialUrl: secureUrl.optional(),
      photoCredit: nonEmptyString.optional(),
      publicationPermission: z.enum(['pending', 'confirmed']),
    })
    .superRefine((data, context) => {
      if (
        data.status === 'published' &&
        data.publicationPermission !== 'confirmed'
      ) {
        context.addIssue({
          code: 'custom',
          path: ['publicationPermission'],
          message: `Delivery highlight "${data.slug}" cannot be published until photo and project-detail permission is confirmed.`,
        });
      }
    });
}

function isPublicFile(publicPath: string): boolean {
  const candidate = resolve(publicDirectory, `.${publicPath}`);
  const candidateRelativePath = relative(publicDirectory, candidate);

  if (
    isAbsolute(candidateRelativePath) ||
    candidateRelativePath === '..' ||
    candidateRelativePath.startsWith(`..${sep}`)
  ) {
    return false;
  }

  try {
    return statSync(candidate).isFile();
  } catch {
    return false;
  }
}

function entryLabel(data: { slug: string; name: string }): string {
  return `Product entry "${data.slug}" (${data.name})`;
}

export const productSchema = z
  .object({
    slug: slugSchema,
    name: nonEmptyString,
    category: z.literal('cables'),
    status: z.enum(['draft', 'published']),
    summary: nonEmptyString,
    conductorMaterial: z.enum(['copper', 'tinned-copper', 'aluminium']),
    crossSectionMm2: z.number().positive(),
    coreCount: z.number().int().positive(),
    voltageRating: nonEmptyString,
    currentRatingAmps: z.number().positive().optional(),
    temperatureMinC: z.number().optional(),
    temperatureMaxC: z.number().optional(),
    insulationMaterial: nonEmptyString.optional(),
    sheathMaterial: nonEmptyString.optional(),
    uvResistant: z.boolean().optional(),
    colours: z.array(nonEmptyString).optional(),
    lengthsM: z.array(z.number().positive()).optional(),
    standards: z.array(nonEmptyString).optional(),
    datasheetPath: nonEmptyString.optional(),
    stockNote: nonEmptyString.optional(),
    minimumOrderQuantity: nonEmptyString.optional(),
  })
  .superRefine((data, context) => {
    const hasMinimumTemperature = data.temperatureMinC !== undefined;
    const hasMaximumTemperature = data.temperatureMaxC !== undefined;

    if (hasMinimumTemperature !== hasMaximumTemperature) {
      context.addIssue({
        code: 'custom',
        path: [hasMinimumTemperature ? 'temperatureMaxC' : 'temperatureMinC'],
        message: `${entryLabel(data)} must provide both temperature endpoints or neither.`,
      });
    } else if (
      data.temperatureMinC !== undefined &&
      data.temperatureMaxC !== undefined &&
      data.temperatureMinC > data.temperatureMaxC
    ) {
      context.addIssue({
        code: 'custom',
        path: ['temperatureMinC'],
        message: `${entryLabel(data)} must have temperatureMinC less than or equal to temperatureMaxC.`,
      });
    }

    const datasheetPath = data.datasheetPath;
    if (datasheetPath === undefined || datasheetPath.length === 0) {
      return;
    }

    if (!datasheetPath.startsWith('/datasheets/')) {
      context.addIssue({
        code: 'custom',
        path: ['datasheetPath'],
        message: `${entryLabel(data)} datasheetPath must start with "/datasheets/".`,
      });
      return;
    }

    if (!isPublicFile(datasheetPath)) {
      context.addIssue({
        code: 'custom',
        path: ['datasheetPath'],
        message: `${entryLabel(data)} references missing datasheet "${datasheetPath}" under public/.`,
      });
    }
  });

export const products = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/products' }),
  schema: productSchema,
});

export const categories = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/categories' }),
  schema: ({ image }) => createCategorySchema(image()),
});

export const deliveries = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/deliveries' }),
  schema: ({ image }) => createDeliverySchema(image()),
});

export const collections = { products, categories, deliveries };
