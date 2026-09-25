import type { CategoryEntry } from '@/lib/catalogue/categories';
import type { GalleryPhoto } from '@/lib/catalogue/gallery';

export interface ShowcasePhoto {
  src: GalleryPhoto['src'];
  alt: string;
}

export interface ShowcaseView {
  items: ShowcasePhoto[];
  heading: string;
  intro: string;
}

const showcaseMaximum = 8;
const showcaseMinimum = 4;
const showcaseHeading = 'Equipment Era-Sure has supplied';
const showcaseIntro =
  'Photographs of equipment Era-Sure has supplied, sourced, assembled or prepared for delivery.';

function clientOwnedPhotos(category: CategoryEntry): ShowcasePhoto[] {
  return (category.data.gallery ?? [])
    .filter((photo) => photo.provenance === 'client-owned')
    .map(({ src, alt }) => ({ src, alt }));
}

export function buildShowcaseView(
  categories: readonly CategoryEntry[],
): ShowcaseView | null {
  const photosByCategory = categories.map(clientOwnedPhotos);
  const items: ShowcasePhoto[] = [];

  // The caller supplies categories in editorial order. Taking one photograph
  // from each category at every depth keeps a larger gallery from dominating
  // the band without introducing a random build-time result.
  for (let photoIndex = 0; items.length < showcaseMaximum; photoIndex += 1) {
    let addedPhoto = false;

    for (const photos of photosByCategory) {
      const photo = photos[photoIndex];

      if (photo === undefined) {
        continue;
      }

      items.push(photo);
      addedPhoto = true;

      if (items.length === showcaseMaximum) {
        break;
      }
    }

    if (!addedPhoto) {
      break;
    }
  }

  if (items.length < showcaseMinimum) {
    return null;
  }

  return {
    items,
    heading: showcaseHeading,
    intro: showcaseIntro,
  };
}
