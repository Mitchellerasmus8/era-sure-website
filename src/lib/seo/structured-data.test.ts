import { describe, expect, it } from 'vitest';
import {
  buildBreadcrumbStructuredData,
  buildCategoryListStructuredData,
  buildHomeStructuredData,
  buildProductStructuredData,
  buildVideoStructuredData,
  serializeStructuredData,
} from '@/lib/seo/structured-data';
import { TODO_CLIENT } from '@/lib/config/placeholders';
import type { SiteConfig } from '@/site.config';

const config: SiteConfig = {
  displayName: 'Era-Sure Renewables',
  tradingName: 'Era-Sure Trading (Pty) Ltd',
  registrationNumber: '2023/206746/07',
  vatNumber: '4790315370',
  registeredAddress: '1 Example Street, Johannesburg, 2000',
  informationOfficer: {
    name: 'Mitchell Erasmus',
    email: 'sales@example.com',
  },
  retention: {
    period: 'Until the enquiry is resolved',
    routine: 'The business reviews and deletes records routinely.',
  },
  tagline: 'The Future of Energy',
  responseTime: '60 minutes',
  salesContacts: [
    {
      id: 'mitchell',
      name: 'Mitchell Erasmus',
      role: 'Sales contact',
      region: 'Gauteng',
      hub: 'Sandton, JHB',
      phone: '+27 82 870 5847',
      whatsapp: '+27 82 870 5847',
    },
  ],
  salesEmail: 'sales@example.com',
  accountsEmail: 'accounts@example.com',
  businessHours: {
    weekdays: '07:30 – 17:00',
    saturday: 'TODO_CLIENT',
    sunday: 'TODO_CLIENT',
    supportNote: 'After-sales support is available 24/7.',
  },
  serviceAreas: ['South Africa'],
  socialLinks: {
    linkedin: 'https://www.linkedin.com/company/era-sure-renewables/',
  },
  siteUrl: 'https://example.com',
};

describe('SEO structured-data builders', () => {
  it('builds absolute, ordered breadcrumb list items', () => {
    expect(
      buildBreadcrumbStructuredData(
        [
          { label: 'Home', href: '/', isCurrent: false },
          { label: 'Products', href: '/products/', isCurrent: true },
        ],
        config.siteUrl,
      ),
    ).toMatchObject({
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          position: 1,
          name: 'Home',
          item: 'https://example.com/',
        },
        {
          position: 2,
          name: 'Products',
          item: 'https://example.com/products/',
        },
      ],
    });
  });

  it('omits a breadcrumb graph for the root page', () => {
    expect(
      buildBreadcrumbStructuredData(
        [{ label: 'Home', href: '/', isCurrent: true }],
        config.siteUrl,
      ),
    ).toBeNull();
  });

  it('lists every confirmed social profile in sameAs and drops the rest', () => {
    expect(
      buildHomeStructuredData({
        ...config,
        socialLinks: {
          facebook: 'https://www.facebook.com/erasure.renewables',
          instagram: TODO_CLIENT,
          linkedin: 'https://www.linkedin.com/company/era-sure-renewables/',
        },
      }),
    ).toMatchObject({
      '@graph': [
        {
          '@type': 'Organization',
          sameAs: [
            'https://www.facebook.com/erasure.renewables',
            'https://www.linkedin.com/company/era-sure-renewables/',
          ],
        },
        { '@type': 'WebSite' },
      ],
    });
  });

  it('keeps organization markup aligned with confirmed business facts', () => {
    expect(buildHomeStructuredData(config)).toMatchObject({
      '@graph': [
        {
          '@type': 'Organization',
          name: 'Era-Sure Renewables',
          legalName: 'Era-Sure Trading (Pty) Ltd',
          slogan: 'The Future of Energy',
          email: 'sales@example.com',
          sameAs: ['https://www.linkedin.com/company/era-sure-renewables/'],
          contactPoint: [
            {
              name: 'Mitchell Erasmus',
              telephone: '+27 82 870 5847',
              areaServed: 'Gauteng',
            },
            {
              email: 'accounts@example.com',
              contactType: 'billing',
            },
          ],
        },
        {
          '@type': 'WebSite',
          name: 'Era-Sure Renewables',
        },
      ],
    });
  });

  it('builds an ItemList graph for the category overview', () => {
    const result = buildCategoryListStructuredData(
      [
        {
          name: 'Cables',
          slug: 'cables',
          summary: 'Solar PV and electrical cables.',
        },
        {
          name: 'Cable management',
          slug: 'cable-management',
          summary: 'Cable trays and trunking.',
        },
      ],
      config.siteUrl,
    );

    expect(result).toEqual({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      '@id': 'https://example.com/products/#itemlist',
      name: 'Electrical and renewable-energy product categories',
      url: 'https://example.com/products/',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Cables',
          description: 'Solar PV and electrical cables.',
          url: 'https://example.com/products/cables/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Cable management',
          description: 'Cable trays and trunking.',
          url: 'https://example.com/products/cable-management/',
        },
      ],
    });
  });

  it('maps visible product facts without inventing price or availability', () => {
    const result = buildProductStructuredData(
      {
        slug: 'solar-pv-cable',
        name: 'Solar PV Cable',
        summary: 'A solar cable.',
        conductorMaterial: 'tinned-copper',
        crossSectionMm2: 4,
        coreCount: 1,
        voltageRating: '1.5 kV DC',
      },
      config.siteUrl,
    );

    expect(result).toMatchObject({
      '@type': 'Product',
      name: 'Solar PV Cable',
      url: 'https://example.com/cables/solar-pv-cable/',
    });
    expect(result).not.toHaveProperty('offers');
  });

  it('builds a VideoObject with absolute content and thumbnail URLs', () => {
    const result = buildVideoStructuredData(
      {
        title: 'Orange steel enclosure',
        description: 'A completed enclosure being opened.',
        thumbnailUrl: '/_astro/poster.webp',
        src: '/video/enclosures-and-combiners/orange-enclosure-walkthrough.mp4',
        publishedOn: '2026-08-13',
      },
      config.siteUrl,
    );

    expect(result).toMatchObject({
      '@type': 'VideoObject',
      name: 'Orange steel enclosure',
      thumbnailUrl: 'https://example.com/_astro/poster.webp',
      contentUrl:
        'https://example.com/video/enclosures-and-combiners/orange-enclosure-walkthrough.mp4',
    });
  });

  // uploadDate must carry the editor-supplied calendar day. Deriving it from the
  // build would make the same video claim a new publication date on every deploy.
  // The time and offset are added here, not by the editor: Search Console faults a
  // date-only uploadDate as both an invalid datetime and a missing timezone.
  it('emits the supplied publication date as a SAST datetime uploadDate', () => {
    const result = buildVideoStructuredData(
      {
        title: 'Clip',
        description: 'A clip.',
        thumbnailUrl: '/_astro/poster.webp',
        src: '/video/example.mp4',
        publishedOn: '2026-08-13',
      },
      config.siteUrl,
    );

    expect(result.uploadDate).toBe('2026-08-13T00:00:00+02:00');
  });

  it('escapes markup-breaking characters before JSON-LD enters HTML', () => {
    expect(serializeStructuredData({ value: '</script>\u2028' })).toBe(
      '{"value":"\\u003c/script>\\u2028"}',
    );
  });
});
