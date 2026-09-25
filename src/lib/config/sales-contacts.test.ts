import { describe, expect, it } from 'vitest';

import { buildSalesContactLinks } from '@/lib/config/sales-contacts';
import { TODO_CLIENT } from '@/lib/config/placeholders';
import { siteConfig } from '@/site.config';

describe('buildSalesContactLinks', () => {
  it('builds one chooser link per confirmed contact', () => {
    expect(buildSalesContactLinks(siteConfig)).toEqual([
      {
        id: 'mitchell',
        name: 'Mitchell Erasmus',
        role: 'Sales contact',
        region: 'Gauteng',
        hub: 'Sandton, JHB',
        phone: '+27 82 870 5847',
        whatsapp: '+27 82 870 5847',
        telHref: 'tel:+27828705847',
        whatsAppHref:
          'https://wa.me/27828705847?text=Hi%2C%20I%20would%20like%20to%20request%20a%20quote%20from%20Era-Sure%20Renewables.',
      },
      {
        id: 'wesley',
        name: 'Wesley Erasmus',
        role: 'Sales contact',
        region: 'KwaZulu-Natal',
        hub: 'Hillcrest, KZN',
        phone: '+27 71 637 4188',
        whatsapp: '+27 71 637 4188',
        telHref: 'tel:+27716374188',
        whatsAppHref:
          'https://wa.me/27716374188?text=Hi%2C%20I%20would%20like%20to%20request%20a%20quote%20from%20Era-Sure%20Renewables.',
      },
    ]);
  });

  it('omits a contact holding any sentinel instead of emitting a broken link', () => {
    const [mitchell, wesley] = siteConfig.salesContacts;

    expect(
      buildSalesContactLinks({
        ...siteConfig,
        salesContacts: [{ ...mitchell, phone: TODO_CLIENT }, wesley],
      }),
    ).toEqual([
      {
        id: 'wesley',
        name: 'Wesley Erasmus',
        role: 'Sales contact',
        region: 'KwaZulu-Natal',
        hub: 'Hillcrest, KZN',
        phone: '+27 71 637 4188',
        whatsapp: '+27 71 637 4188',
        telHref: 'tel:+27716374188',
        whatsAppHref:
          'https://wa.me/27716374188?text=Hi%2C%20I%20would%20like%20to%20request%20a%20quote%20from%20Era-Sure%20Renewables.',
      },
    ]);
  });

  it('keeps a reachable contact whose descriptive labels are unconfirmed', () => {
    const [mitchell] = siteConfig.salesContacts;

    expect(
      buildSalesContactLinks({
        ...siteConfig,
        salesContacts: [{ ...mitchell, hub: TODO_CLIENT, role: TODO_CLIENT }],
      }),
    ).toEqual([
      {
        id: 'mitchell',
        name: 'Mitchell Erasmus',
        region: 'Gauteng',
        phone: '+27 82 870 5847',
        whatsapp: '+27 82 870 5847',
        telHref: 'tel:+27828705847',
        whatsAppHref:
          'https://wa.me/27828705847?text=Hi%2C%20I%20would%20like%20to%20request%20a%20quote%20from%20Era-Sure%20Renewables.',
      },
    ]);
  });

  it('returns no chooser links when every contact is unconfirmed', () => {
    expect(
      buildSalesContactLinks({
        ...siteConfig,
        salesContacts: [
          {
            ...siteConfig.salesContacts[0],
            name: TODO_CLIENT,
          },
        ],
      }),
    ).toEqual([]);
  });
});
