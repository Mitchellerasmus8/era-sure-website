import { isConfirmed } from '@/lib/config/phone';
import type { Crumb } from '@/lib/navigation/breadcrumbs';
import type { SiteConfig } from '@/site.config';

export type StructuredData = Record<string, unknown>;

interface ProductStructuredDataInput {
  slug: string;
  name: string;
  summary: string;
  conductorMaterial: string;
  crossSectionMm2: number;
  coreCount: number;
  voltageRating: string;
}

interface VideoStructuredDataInput {
  title: string;
  description: string;
  thumbnailUrl: string;
  src: string;
  publishedOn: string;
}

function absoluteUrl(pathname: string, siteUrl: string): string {
  return new URL(pathname, siteUrl).href;
}

/**
 * South African Standard Time. The business, its stock and its filming are all
 * in ZA, which has observed UTC+02:00 with no daylight saving since 1944, so a
 * fixed offset is the honest one rather than a simplification.
 */
const SAST_OFFSET = '+02:00';

/**
 * `publishedOn` is a bare calendar date because that is all an editor should
 * have to supply, but Search Console rejects a date-only `uploadDate` twice
 * over — "invalid datetime value" and "missing a timezone" — since schema.org
 * asks for an ISO 8601 *datetime* there. Midnight SAST is the only defensible
 * instant for a date whose time nobody recorded: it keeps the calendar day the
 * editor typed intact for any reader in ZA or west of it.
 */
function toUploadDateTime(publishedOn: string): string {
  return `${publishedOn}T00:00:00${SAST_OFFSET}`;
}

export interface CategoryListItemInput {
  name: string;
  slug: string;
  summary: string;
}

export function buildBreadcrumbStructuredData(
  crumbs: readonly Crumb[],
  siteUrl: string,
): StructuredData | null {
  if (crumbs.length < 2) {
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.label,
      item: absoluteUrl(crumb.href, siteUrl),
    })),
  };
}

export function buildCategoryListStructuredData(
  categories: readonly CategoryListItemInput[],
  siteUrl: string,
): StructuredData {
  const url = absoluteUrl('/products/', siteUrl);
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${url}#itemlist`,
    name: 'Electrical and renewable-energy product categories',
    url,
    itemListElement: categories.map((category, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: category.name,
      description: category.summary,
      url: absoluteUrl(`/products/${category.slug}/`, siteUrl),
    })),
  };
}

export function buildHomeStructuredData(config: SiteConfig): StructuredData {
  const organizationId = `${config.siteUrl}#organization`;
  const websiteId = `${config.siteUrl}#website`;
  const sameAs = Object.values(config.socialLinks ?? {}).filter(
    (value): value is string => Boolean(value && isConfirmed(value)),
  );

  const contactPoints = [
    ...config.salesContacts
      .filter((contact) => isConfirmed(contact.phone))
      .map((contact) => ({
        '@type': 'ContactPoint',
        name: contact.name,
        telephone: contact.phone,
        contactType: 'sales',
        areaServed: contact.region,
        availableLanguage: 'English',
      })),
    ...(isConfirmed(config.accountsEmail)
      ? [
          {
            '@type': 'ContactPoint',
            email: config.accountsEmail,
            contactType: 'billing',
            availableLanguage: 'English',
          },
        ]
      : []),
  ];

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': organizationId,
        name: config.displayName,
        legalName: config.tradingName,
        ...(isConfirmed(config.tagline) ? { slogan: config.tagline } : {}),
        url: config.siteUrl,
        logo: absoluteUrl('/favicon.svg', config.siteUrl),
        email: config.salesEmail,
        identifier: config.registrationNumber,
        vatID: config.vatNumber,
        areaServed: config.serviceAreas,
        sameAs,
        contactPoint: contactPoints,
      },
      {
        '@type': 'WebSite',
        '@id': websiteId,
        url: config.siteUrl,
        name: config.displayName,
        alternateName: 'Era-Sure',
        publisher: { '@id': organizationId },
      },
    ],
  };
}

export function buildProductStructuredData(
  product: ProductStructuredDataInput,
  siteUrl: string,
): StructuredData {
  const url = absoluteUrl(`/cables/${product.slug}/`, siteUrl);

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#product`,
    name: product.name,
    description: product.summary,
    url,
    category: 'Solar PV cable',
    material: product.conductorMaterial,
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'Cross-section',
        value: product.crossSectionMm2,
        unitText: 'mm²',
      },
      {
        '@type': 'PropertyValue',
        name: 'Core count',
        value: product.coreCount,
      },
      {
        '@type': 'PropertyValue',
        name: 'Voltage rating',
        value: product.voltageRating,
      },
    ],
  };
}

export function buildVideoStructuredData(
  video: VideoStructuredDataInput,
  siteUrl: string,
): StructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.title,
    description: video.description,
    thumbnailUrl: absoluteUrl(video.thumbnailUrl, siteUrl),
    contentUrl: absoluteUrl(video.src, siteUrl),
    uploadDate: toUploadDateTime(video.publishedOn),
  };
}

export function serializeStructuredData(data: StructuredData): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
