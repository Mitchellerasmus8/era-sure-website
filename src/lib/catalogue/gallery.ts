import type { ImageMetadata } from 'astro';

export interface PhotoCredit {
  creator: string;
  title: string;
  sourceUrl: string;
  license: string;
  licenseUrl: string;
  modification?: string;
}

export interface GalleryPhoto {
  src: ImageMetadata;
  alt: string;
  caption?: string;
  provenance: 'client-owned' | 'third-party';
  credit?: PhotoCredit;
}

export interface GalleryView {
  items: GalleryPhoto[];
  heading: string;
  intro: string;
  total: number;
  initiallyVisible: number;
  /**
   * Null when the gallery is short enough to show whole. The component renders
   * the disclosure button only when this is a string, so it needs no threshold
   * arithmetic and no string building of its own.
   */
  disclosureLabel: string | null;
}

export interface CategoryVideo {
  src: string;
  poster: ImageMetadata;
  title: string;
  description: string;
  publishedOn: string;
}

/**
 * Identical to `CategoryVideo` today. It survives as a distinct name because the
 * component renders *this* type, not the content shape — the alias is where a
 * future derived field would land without touching every caller.
 */
export type VideoViewItem = CategoryVideo;

export interface VideoView {
  items: VideoViewItem[];
  heading: string;
  intro: string;
}

export interface CategoryMedia {
  gallery?: readonly GalleryPhoto[];
  galleryHeading?: string;
  galleryIntro?: string;
  videos?: readonly CategoryVideo[];
}

/**
 * Used when a category supplies no wording of its own. It describes the gallery
 * and claims nothing about who supplied what, so any future licensed stock
 * photography cannot imply Era-Sure supplied the pictured equipment (ARCHI §5.5).
 */
const defaultGalleryHeading = 'Photographs';
const defaultGalleryIntro =
  'Photographs of the equipment covered by this range.';

/**
 * Twelve tiles is four rows on a phone and two on a desktop — enough to show the
 * range at a glance without the gallery becoming the page. Everything beyond it
 * sits behind the disclosure button.
 */
const galleryDisclosureThreshold = 12;

function assertGalleryAltText(photos: readonly GalleryPhoto[]): void {
  const invalidPhoto = photos.find((photo) => photo.alt.trim().length === 0);

  if (invalidPhoto !== undefined) {
    throw new Error('Every gallery photograph must have non-empty alt text.');
  }
}

export function buildGalleryView(media: CategoryMedia): GalleryView | null {
  const gallery = media.gallery;

  if (gallery === undefined || gallery.length === 0) {
    return null;
  }

  assertGalleryAltText(gallery);

  const isCollapsible = gallery.length > galleryDisclosureThreshold;

  return {
    items: [...gallery],
    heading: media.galleryHeading ?? defaultGalleryHeading,
    intro: media.galleryIntro ?? defaultGalleryIntro,
    total: gallery.length,
    initiallyVisible: isCollapsible
      ? galleryDisclosureThreshold
      : gallery.length,
    disclosureLabel: isCollapsible
      ? `Show all ${gallery.length} photographs`
      : null,
  };
}

export function buildVideoView(media: CategoryMedia): VideoView | null {
  const videos = media.videos;

  if (videos === undefined || videos.length === 0) {
    return null;
  }

  return {
    items: [...videos],
    // Fixed rather than per-category, unlike the gallery wording: video here is
    // always Era-Sure's own footage. The stock-photography problem that made
    // `galleryHeading` necessary — copy that must not imply Era-Sure supplied
    // what is pictured — cannot arise, because nobody licenses stock footage of
    // their own enclosures. If a category ever needs different wording, add the
    // field then.
    heading: 'Video',
    intro: 'Short clips of equipment Era-Sure has supplied.',
  };
}
