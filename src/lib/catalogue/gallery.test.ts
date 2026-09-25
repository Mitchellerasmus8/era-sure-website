import type { ImageMetadata } from 'astro';
import { describe, expect, it } from 'vitest';

import {
  buildGalleryView,
  buildVideoView,
  type CategoryMedia,
  type CategoryVideo,
  type GalleryPhoto,
} from '@/lib/catalogue/gallery';

const image: ImageMetadata = {
  src: '/_astro/photo.jpg',
  width: 1600,
  height: 1200,
  format: 'jpg',
};

function makePhotos(count: number): GalleryPhoto[] {
  // Generic gallery fixtures use the explicit client-owned branch so these tests
  // can exercise gallery view behaviour without accidentally asserting a credit
  // block that belongs only to third-party photographs.
  return Array.from({ length: count }, (_unused, index) => ({
    src: image,
    alt: `Photograph ${index + 1}`,
    provenance: 'client-owned' as const,
  }));
}

function makeVideo(overrides: Partial<CategoryVideo> = {}): CategoryVideo {
  return {
    src: '/video/enclosures-and-combiners/example.mp4',
    poster: image,
    title: 'Example clip',
    description: 'An example clip.',
    publishedOn: '2026-08-13',
    ...overrides,
  };
}

describe('buildGalleryView', () => {
  it('returns null when the category has no gallery', () => {
    expect(buildGalleryView({})).toBeNull();
  });

  // An empty array must behave like an absent field, not like a gallery of zero
  // photographs — otherwise the page renders a heading over nothing.
  it('returns null for an empty gallery array', () => {
    expect(buildGalleryView({ gallery: [] })).toBeNull();
  });

  it('shapes the photographs it was given', () => {
    const view = buildGalleryView({ gallery: makePhotos(3) });

    expect(view?.items).toHaveLength(3);
    expect(view?.total).toBe(3);
    expect(view?.items[0]?.alt).toBe('Photograph 1');
  });

  it('copies the gallery so a caller cannot mutate the entry', () => {
    const media: CategoryMedia = { gallery: makePhotos(2) };
    const view = buildGalleryView(media);

    view?.items.push({
      src: image,
      alt: 'Added later',
      provenance: 'client-owned',
    });

    expect(media.gallery).toHaveLength(2);
  });

  describe('disclosure', () => {
    it('offers no disclosure at the threshold', () => {
      const view = buildGalleryView({ gallery: makePhotos(12) });

      expect(view?.disclosureLabel).toBeNull();
      expect(view?.initiallyVisible).toBe(12);
    });

    it('offers no disclosure below the threshold', () => {
      const view = buildGalleryView({ gallery: makePhotos(8) });

      expect(view?.disclosureLabel).toBeNull();
      // Every photograph is visible, so the component never collapses the grid.
      expect(view?.initiallyVisible).toBe(8);
    });

    it('collapses to the threshold and names the full count above it', () => {
      const view = buildGalleryView({ gallery: makePhotos(19) });

      expect(view?.initiallyVisible).toBe(12);
      expect(view?.disclosureLabel).toBe('Show all 19 photographs');
    });

    it('offers a disclosure one photograph past the threshold', () => {
      const view = buildGalleryView({ gallery: makePhotos(13) });

      expect(view?.disclosureLabel).toBe('Show all 13 photographs');
    });
  });

  describe('wording', () => {
    it('uses the category wording when supplied', () => {
      const view = buildGalleryView({
        gallery: makePhotos(2),
        galleryHeading: 'Cable supply in practice',
        galleryIntro: 'Photographs from Era-Sure cable orders.',
      });

      expect(view?.heading).toBe('Cable supply in practice');
      expect(view?.intro).toBe('Photographs from Era-Sure cable orders.');
    });

    // The four stock-photography categories rely on this: the fallback must not
    // imply Era-Sure supplied what is pictured (ARCHI §5.5).
    it('falls back to wording that claims no supply relationship', () => {
      const view = buildGalleryView({ gallery: makePhotos(2) });

      expect(view?.heading).toBe('Photographs');
      expect(view?.intro).not.toMatch(/era-sure|supplied|our /i);
    });
  });

  describe('alt text', () => {
    it('rejects an empty alt', () => {
      expect(() =>
        buildGalleryView({
          gallery: [{ src: image, alt: '', provenance: 'client-owned' }],
        }),
      ).toThrow(/alt text/i);
    });

    it('rejects a whitespace-only alt', () => {
      expect(() =>
        buildGalleryView({
          gallery: [{ src: image, alt: '   ', provenance: 'client-owned' }],
        }),
      ).toThrow(/alt text/i);
    });

    it('rejects a missing alt among otherwise valid photographs', () => {
      expect(() =>
        buildGalleryView({
          gallery: [
            ...makePhotos(3),
            { src: image, alt: '', provenance: 'client-owned' },
          ],
        }),
      ).toThrow(/alt text/i);
    });
  });
});

describe('buildVideoView', () => {
  it('returns null when the category has no videos', () => {
    expect(buildVideoView({})).toBeNull();
  });

  it('returns null for an empty videos array', () => {
    expect(buildVideoView({ videos: [] })).toBeNull();
  });

  it('shapes the videos it was given', () => {
    const view = buildVideoView({
      videos: [makeVideo(), makeVideo({ title: 'Second clip' })],
    });

    expect(view?.items).toHaveLength(2);
    expect(view?.items[1]?.title).toBe('Second clip');
  });

  // The date is no longer rendered anywhere on the page — it exists only as the
  // VideoObject `uploadDate` — but it still has to survive the view unchanged,
  // because the structured data is built from these items.
  it('carries the publication date through unchanged', () => {
    const view = buildVideoView({
      videos: [makeVideo({ publishedOn: '2026-08-13' })],
    });

    expect(view?.items[0]?.publishedOn).toBe('2026-08-13');
  });

  it('copies the videos so a caller cannot mutate the entry', () => {
    const media: CategoryMedia = { videos: [makeVideo()] };
    const view = buildVideoView(media);

    view?.items.push(makeVideo({ title: 'Added later' }));

    expect(media.videos).toHaveLength(1);
  });
});
