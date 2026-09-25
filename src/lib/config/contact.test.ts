import { describe, expect, it } from 'vitest';

import {
  buildContactDetails,
  buildSupplyBasesStatement,
} from '@/lib/config/contact';
import { TODO_CLIENT } from '@/lib/config/placeholders';
import type { SalesContact, SiteConfig } from '@/site.config';

type FixtureOverrides = Omit<
  Partial<SiteConfig>,
  'businessHours' | 'salesContacts'
> & {
  businessHours?: Partial<SiteConfig['businessHours']>;
  salesContacts?: Array<Partial<SalesContact>>;
};

function makeContact(overrides: Partial<SalesContact> = {}): SalesContact {
  return {
    id: overrides.id ?? 'fixture-contact',
    name: overrides.name ?? TODO_CLIENT,
    role: overrides.role ?? TODO_CLIENT,
    region: overrides.region ?? TODO_CLIENT,
    hub: overrides.hub ?? TODO_CLIENT,
    phone: overrides.phone ?? TODO_CLIENT,
    whatsapp: overrides.whatsapp ?? TODO_CLIENT,
  };
}

function makeConfig(overrides: FixtureOverrides = {}): SiteConfig {
  return {
    displayName: overrides.displayName ?? 'Fixture Renewables',
    tradingName: overrides.tradingName ?? TODO_CLIENT,
    registrationNumber: overrides.registrationNumber ?? TODO_CLIENT,
    vatNumber: overrides.vatNumber ?? TODO_CLIENT,
    registeredAddress: overrides.registeredAddress ?? TODO_CLIENT,
    informationOfficer: {
      name: overrides.informationOfficer?.name ?? TODO_CLIENT,
      email: overrides.informationOfficer?.email ?? TODO_CLIENT,
    },
    retention: {
      period: overrides.retention?.period ?? TODO_CLIENT,
      routine: overrides.retention?.routine ?? TODO_CLIENT,
    },
    tagline: overrides.tagline ?? TODO_CLIENT,
    responseTime: overrides.responseTime ?? TODO_CLIENT,
    salesContacts: overrides.salesContacts
      ? overrides.salesContacts.map((contact) => makeContact(contact))
      : [makeContact()],
    salesEmail: overrides.salesEmail ?? TODO_CLIENT,
    accountsEmail: overrides.accountsEmail ?? TODO_CLIENT,
    businessHours: {
      weekdays: overrides.businessHours?.weekdays ?? TODO_CLIENT,
      saturday: overrides.businessHours?.saturday ?? TODO_CLIENT,
      sunday: overrides.businessHours?.sunday ?? TODO_CLIENT,
      supportNote: overrides.businessHours?.supportNote ?? TODO_CLIENT,
    },
    serviceAreas: overrides.serviceAreas ?? [TODO_CLIENT],
    siteUrl: overrides.siteUrl ?? 'https://fixture.example',
    socialLinks: overrides.socialLinks,
  };
}

describe('buildContactDetails', () => {
  it('returns empty details when all contact fields are placeholders', () => {
    expect(buildContactDetails(makeConfig())).toEqual({
      contactGroups: [],
      emails: [],
      hubs: [],
      businessHours: [],
      serviceAreas: [],
      registration: [],
      socialLinks: [],
    });
  });

  it('keeps confirmed mixed values in the fixed group order', () => {
    expect(
      buildContactDetails(
        makeConfig({
          salesContacts: [
            {
              id: 'mitchell',
              name: 'Mitchell Erasmus',
              region: 'Gauteng',
              hub: 'Sandton, JHB',
              phone: '+27 21 555 0100',
              whatsapp: '+27 82 555 0100',
            },
            {
              id: 'wesley',
              name: 'Wesley Erasmus',
              region: 'KwaZulu-Natal',
              hub: 'Hillcrest, KZN',
              phone: '+27 71 555 0100',
              whatsapp: TODO_CLIENT,
            },
          ],
          salesEmail: 'sales@fixture.example',
          accountsEmail: 'accounts@fixture.example',
          businessHours: {
            weekdays: '08:00–17:00',
            sunday: 'Closed',
            supportNote: '24/7 support for enquiries and assistance',
          },
          serviceAreas: [TODO_CLIENT, 'Western Cape', 'Gauteng'],
          tradingName: 'Era-Sure Trading (Pty) Ltd',
          vatNumber: 'VAT-123',
          registrationNumber: 'REG-456',
        }),
      ),
    ).toEqual({
      contactGroups: [
        {
          id: 'mitchell',
          heading: 'Mitchell Erasmus – Gauteng',
          details: [
            {
              label: 'Phone',
              value: '+27 21 555 0100',
              href: 'tel:+27215550100',
            },
            {
              label: 'WhatsApp',
              value: '+27 82 555 0100',
              href: 'https://wa.me/27825550100',
            },
          ],
        },
        {
          id: 'wesley',
          heading: 'Wesley Erasmus – KwaZulu-Natal',
          details: [
            {
              label: 'Phone',
              value: '+27 71 555 0100',
              href: 'tel:+27715550100',
            },
          ],
        },
      ],
      emails: [
        {
          label: 'Sales',
          value: 'sales@fixture.example',
          href: 'mailto:sales@fixture.example',
        },
        {
          label: 'Accounts',
          value: 'accounts@fixture.example',
          href: 'mailto:accounts@fixture.example',
        },
      ],
      hubs: ['Sandton, JHB', 'Hillcrest, KZN'],
      businessHours: [
        { label: 'Weekdays', value: '08:00–17:00' },
        { label: 'Sunday', value: 'Closed' },
      ],
      supportNote: '24/7 support for enquiries and assistance',
      serviceAreas: ['Western Cape', 'Gauteng'],
      registration: [
        { label: 'Registered name', value: 'Era-Sure Trading (Pty) Ltd' },
        { label: 'Registration number', value: 'REG-456' },
        { label: 'VAT number', value: 'VAT-123' },
      ],
      socialLinks: [],
    });
  });

  it('renders only confirmed hubs when sales contacts are partial', () => {
    expect(
      buildContactDetails(
        makeConfig({
          salesContacts: [
            { id: 'mitchell', hub: 'Sandton, JHB' },
            { id: 'wesley', hub: TODO_CLIENT },
          ],
        }),
      ).hubs,
    ).toEqual(['Sandton, JHB']);
  });

  it('normalises phone and WhatsApp numbers while preserving display values', () => {
    const content = buildContactDetails(
      makeConfig({
        salesContacts: [
          {
            id: 'mitchell',
            name: 'Mitchell Erasmus',
            region: 'Gauteng',
            phone: '+27 (21) 555-0100',
            whatsapp: '+27-82 555 0100',
          },
        ],
      }),
    );

    expect(content.contactGroups[0]?.details).toEqual([
      {
        label: 'Phone',
        value: '+27 (21) 555-0100',
        href: 'tel:+27215550100',
      },
      {
        label: 'WhatsApp',
        value: '+27-82 555 0100',
        href: 'https://wa.me/27825550100',
      },
    ]);
  });

  it('does not create groups or hrefs for unconfirmed contact values', () => {
    const content = buildContactDetails(
      makeConfig({
        salesContacts: [
          {
            id: 'mitchell',
            name: 'Mitchell Erasmus',
            region: 'Gauteng',
            phone: TODO_CLIENT,
            whatsapp: TODO_CLIENT,
          },
        ],
        salesEmail: TODO_CLIENT,
        accountsEmail: TODO_CLIENT,
      }),
    );

    expect(content.contactGroups).toEqual([]);
    expect(JSON.stringify(content)).not.toContain('TODO_CLIENT');
  });

  it('adds a response note only when response time and weekday hours are confirmed', () => {
    const content = buildContactDetails(
      makeConfig({
        responseTime: '60 minutes',
        businessHours: { weekdays: '07:30 – 17:00' },
      }),
    );

    expect(content.responseNote).toBe(
      'Enquiries received during business hours (07:30 – 17:00) are acknowledged within 60 minutes.',
    );

    expect(
      buildContactDetails(
        makeConfig({
          responseTime: TODO_CLIENT,
          businessHours: { weekdays: '07:30 – 17:00' },
        }),
      ).responseNote,
    ).toBeUndefined();

    expect(
      buildContactDetails(
        makeConfig({
          responseTime: '60 minutes',
          businessHours: { weekdays: TODO_CLIENT },
        }),
      ).responseNote,
    ).toBeUndefined();
  });

  it('omits an unconfirmed registered name without dropping confirmed numbers', () => {
    expect(
      buildContactDetails(
        makeConfig({
          tradingName: TODO_CLIENT,
          registrationNumber: 'REG-456',
          vatNumber: 'VAT-123',
        }),
      ).registration,
    ).toEqual([
      { label: 'Registration number', value: 'REG-456' },
      { label: 'VAT number', value: 'VAT-123' },
    ]);
  });

  it('maps confirmed social links in order and omits absent or sentinel values', () => {
    expect(
      buildContactDetails(
        makeConfig({
          socialLinks: {
            linkedin: 'https://www.linkedin.com/company/fixture/',
            instagram: 'https://www.instagram.com/fixture/',
          },
        }),
      ).socialLinks,
    ).toEqual([
      {
        platform: 'LinkedIn',
        href: 'https://www.linkedin.com/company/fixture/',
      },
      {
        platform: 'Instagram',
        href: 'https://www.instagram.com/fixture/',
      },
    ]);

    expect(
      buildContactDetails(
        makeConfig({
          socialLinks: {
            linkedin: TODO_CLIENT,
            facebook: 'https://www.facebook.com/fixture/',
            instagram: TODO_CLIENT,
          },
        }),
      ).socialLinks,
    ).toEqual([
      {
        platform: 'Facebook',
        href: 'https://www.facebook.com/fixture/',
      },
    ]);

    expect(buildContactDetails(makeConfig()).socialLinks).toEqual([]);
  });
});

describe('buildSupplyBasesStatement', () => {
  it('names both hubs and the service area', () => {
    expect(
      buildSupplyBasesStatement(
        makeConfig({
          salesContacts: [
            { id: 'mitchell', hub: 'Sandton, JHB' },
            { id: 'wesley', hub: 'Hillcrest, KZN' },
          ],
          serviceAreas: ['South Africa'],
        }),
      ),
    ).toBe(
      'Supplied from our bases in Sandton, JHB and Hillcrest, KZN, with delivery across South Africa.',
    );
  });

  it('uses the singular and skips unconfirmed hubs', () => {
    expect(
      buildSupplyBasesStatement(
        makeConfig({
          salesContacts: [
            { id: 'mitchell', hub: 'Sandton, JHB' },
            { id: 'wesley', hub: TODO_CLIENT },
          ],
          serviceAreas: ['South Africa'],
        }),
      ),
    ).toBe(
      'Supplied from our base in Sandton, JHB, with delivery across South Africa.',
    );
  });

  it('omits the delivery clause when no service area is confirmed', () => {
    expect(
      buildSupplyBasesStatement(
        makeConfig({
          salesContacts: [{ id: 'mitchell', hub: 'Sandton, JHB' }],
        }),
      ),
    ).toBe('Supplied from our base in Sandton, JHB.');
  });

  it('is withheld when no hub is confirmed', () => {
    expect(buildSupplyBasesStatement(makeConfig())).toBeUndefined();
  });
});
