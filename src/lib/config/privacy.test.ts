import { describe, expect, it } from 'vitest';

import { TODO_CLIENT } from '@/lib/config/placeholders';
import { buildPrivacyNotice } from '@/lib/config/privacy';
import { personalDataFields } from '@/lib/enquiry/personal-data';
import { siteConfig, type SiteConfig } from '@/site.config';

const confirmedConfig: SiteConfig = {
  ...siteConfig,
  registeredAddress: '1 Example Street, Johannesburg, 2000',
  informationOfficer: {
    name: 'Mitchell Erasmus',
    email: 'sales@erasuretrading.co.za',
  },
  retention: {
    period: 'Until the enquiry is resolved',
    routine:
      'The business deletes records from each storage location routinely.',
  },
};

function withRetention(period: string, routine: string): SiteConfig {
  return {
    ...confirmedConfig,
    retention: { period, routine },
  };
}

describe('buildPrivacyNotice', () => {
  it('includes confirmed responsible-party, officer and retention details', () => {
    const notice = buildPrivacyNotice(confirmedConfig);

    expect(notice.responsibleParty).toEqual({
      name: 'Era-Sure Trading (Pty) Ltd',
      registrationNumber: '2023/206746/07',
      vatNumber: '4790315370',
      address: '1 Example Street, Johannesburg, 2000',
    });
    expect(notice.informationOfficer).toEqual({
      name: 'Mitchell Erasmus',
      email: 'sales@erasuretrading.co.za',
    });
    expect(notice.retention).toEqual(confirmedConfig.retention);
  });

  it('states the verified Netlify destination and the GoDaddy operator only', () => {
    const notice = buildPrivacyNotice(confirmedConfig);

    expect(notice.operators).toEqual([
      {
        name: 'Netlify',
        role: 'Form provider and submission processor',
        destination: 'United States, among other countries',
      },
      {
        name: 'GoDaddy',
        role: 'Mailbox provider for form notification emails',
      },
    ]);

    expect(notice.operators[0]).not.toHaveProperty('levelOfProtection');
    expect(notice.operators[0]).not.toHaveProperty('popiaSection72Basis');
    expect(notice.operators[1]).not.toHaveProperty('destination');
  });

  it('keeps a fallback contact route when the Information Officer is unknown', () => {
    const notice = buildPrivacyNotice({
      ...confirmedConfig,
      informationOfficer: {
        name: TODO_CLIENT,
        email: TODO_CLIENT,
      },
    });

    expect(notice).not.toHaveProperty('informationOfficer');
    expect(notice.dataSubjectContacts).toEqual([
      {
        label: 'Sales email',
        value: 'sales@erasuretrading.co.za',
        href: 'mailto:sales@erasuretrading.co.za',
      },
      {
        label: 'Phone - Mitchell Erasmus',
        value: '+27 82 870 5847',
        href: 'tel:+27828705847',
      },
      {
        label: 'Phone - Wesley Erasmus',
        value: '+27 71 637 4188',
        href: 'tel:+27716374188',
      },
    ]);
  });

  it.each([
    ['period only', 'Until the enquiry is resolved', TODO_CLIENT, false],
    [
      'routine only',
      TODO_CLIENT,
      'The business deletes records routinely.',
      false,
    ],
    ['neither', TODO_CLIENT, TODO_CLIENT, false],
    [
      'period and routine',
      'Until the enquiry is resolved',
      'The business deletes records routinely.',
      true,
    ],
  ])(
    'gates retention when %s is confirmed',
    (_caseName, period, routine, shouldInclude) => {
      const notice = buildPrivacyNotice(withRetention(period, routine));

      if (shouldInclude) {
        expect(notice.retention).toEqual({ period, routine });
      } else {
        expect(notice).not.toHaveProperty('retention');
      }
    },
  );

  it('omits every unknown config value in the all-unknown state', () => {
    const notice = buildPrivacyNotice({
      ...confirmedConfig,
      tradingName: TODO_CLIENT,
      registrationNumber: TODO_CLIENT,
      vatNumber: TODO_CLIENT,
      registeredAddress: TODO_CLIENT,
      informationOfficer: {
        name: TODO_CLIENT,
        email: TODO_CLIENT,
      },
      retention: {
        period: TODO_CLIENT,
        routine: TODO_CLIENT,
      },
      salesEmail: TODO_CLIENT,
      salesContacts: confirmedConfig.salesContacts.map((contact) => ({
        ...contact,
        name: TODO_CLIENT,
        phone: TODO_CLIENT,
      })),
    });

    expect(notice.responsibleParty).toEqual({});
    expect(notice).not.toHaveProperty('informationOfficer');
    expect(notice).not.toHaveProperty('retention');
    expect(notice.dataSubjectContacts).toEqual([]);
    expect(JSON.stringify(notice)).not.toContain(TODO_CLIENT);
  });

  it('derives the mandatory and optional split from the inventory, not from prose', () => {
    const { submissionRequirement } = buildPrivacyNotice(confirmedConfig);

    // POPIA s18(1)(b). Asserted against the inventory itself rather than a
    // literal list, so adding a field cannot leave the notice silently
    // describing a form that no longer exists.
    expect(submissionRequirement.mandatoryLabels).toEqual(
      personalDataFields.filter((field) => field.required).map((f) => f.label),
    );
    expect(submissionRequirement.optionalLabels).toEqual([
      'Bill of quantities or product list',
    ]);
    expect(submissionRequirement.mandatoryLabels).toHaveLength(6);
  });

  it('carries the verified Information Regulator contact details', () => {
    expect(buildPrivacyNotice(confirmedConfig).regulator).toEqual({
      name: 'Information Regulator of South Africa',
      address:
        'Woodmead North Office Park, 54 Maxwell Drive, Woodmead, Johannesburg, 2191',
      email: 'enquiries@inforegulator.org.za',
      complaintsEmail: 'POPIAComplaints@inforegulator.org.za',
      telephone: '010 023 5200',
      tollFree: '0800 017 160',
    });
  });
});
