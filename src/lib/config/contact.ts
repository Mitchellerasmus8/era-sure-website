import {
  buildTelHref,
  buildWhatsAppHref,
  isConfirmed,
} from '@/lib/config/phone';
import type { SiteConfig } from '@/site.config';

export interface ContactDetail {
  label: string;
  value: string;
  href?: string;
}

export interface ContactGroup {
  id: string;
  heading: string;
  details: ContactDetail[];
}

export interface SocialLink {
  platform: string;
  href: string;
}

export interface ContactDetails {
  contactGroups: ContactGroup[];
  emails: ContactDetail[];
  hubs: string[];
  businessHours: ContactDetail[];
  supportNote?: string;
  serviceAreas: string[];
  registration: ContactDetail[];
  socialLinks: SocialLink[];
  responseNote?: string;
}

export function buildContactDetails(config: SiteConfig): ContactDetails {
  const contactGroups = config.salesContacts.flatMap((contact) => {
    const details: ContactDetail[] = [];

    if (isConfirmed(contact.phone)) {
      details.push({
        label: 'Phone',
        value: contact.phone,
        href: buildTelHref(contact.phone),
      });
    }

    if (isConfirmed(contact.whatsapp)) {
      details.push({
        label: 'WhatsApp',
        value: contact.whatsapp,
        href: buildWhatsAppHref(contact.whatsapp),
      });
    }

    const heading = [contact.name, contact.region]
      .filter(isConfirmed)
      .join(' – ');

    if (details.length === 0 || heading.length === 0) {
      return [];
    }

    return [{ id: contact.id, heading, details }];
  });

  const emails = [
    ['Sales', config.salesEmail],
    ['Accounts', config.accountsEmail],
  ]
    .filter(([, value]) => isConfirmed(value))
    .map(([label, value]) => ({
      label,
      value,
      href: `mailto:${value}`,
    }));

  const hubs = config.salesContacts
    .map((contact) => contact.hub)
    .filter(isConfirmed);

  const businessHours: ContactDetail[] = [];
  const hours = [
    ['Weekdays', config.businessHours.weekdays],
    ['Saturday', config.businessHours.saturday],
    ['Sunday', config.businessHours.sunday],
  ] as const;

  hours.forEach(([label, value]) => {
    if (isConfirmed(value)) {
      businessHours.push({ label, value });
    }
  });

  const supportNote = isConfirmed(config.businessHours.supportNote)
    ? config.businessHours.supportNote
    : undefined;

  const serviceAreas = config.serviceAreas.filter(isConfirmed);

  const registration: ContactDetail[] = [];

  if (isConfirmed(config.tradingName)) {
    registration.push({
      label: 'Registered name',
      value: config.tradingName,
    });
  }

  if (isConfirmed(config.registrationNumber)) {
    registration.push({
      label: 'Registration number',
      value: config.registrationNumber,
    });
  }

  if (isConfirmed(config.vatNumber)) {
    registration.push({ label: 'VAT number', value: config.vatNumber });
  }

  const socialLinks: SocialLink[] = [
    { platform: 'LinkedIn', href: config.socialLinks?.linkedin },
    { platform: 'Facebook', href: config.socialLinks?.facebook },
    { platform: 'Instagram', href: config.socialLinks?.instagram },
  ].flatMap(({ platform, href }) =>
    isConfirmed(href) ? [{ platform, href }] : [],
  );

  // "Acknowledgement", not "response": the client's process is a reply within
  // the hour, then a request for item detail, then the quote. Promising a
  // *response* in 60 minutes reads as promising the quote in 60 minutes.
  //
  // The sentence names the hours it applies within, and is withheld entirely
  // when those hours are unconfirmed. Whether the promise extends beyond
  // 07:30–17:00 has never been answered (pre-launch checklist), so it must not
  // be publishable as an unscoped commitment.
  const responseNote =
    isConfirmed(config.responseTime) &&
    isConfirmed(config.businessHours.weekdays)
      ? `Enquiries received during business hours (${config.businessHours.weekdays}) are acknowledged within ${config.responseTime}.`
      : undefined;

  return {
    contactGroups,
    emails,
    hubs,
    businessHours,
    ...(supportNote ? { supportNote } : {}),
    serviceAreas,
    registration,
    socialLinks,
    ...(responseNote ? { responseNote } : {}),
  };
}

/**
 * The category pages' "where we supply from" line. Every other statement of
 * the hubs sits in the footer or on the contact page, so without this the
 * pages that rank for products carried no place name at all — and trade buyers
 * search "cable tray supplier JHB", not "cable tray supplier".
 *
 * Built from the same confirmed hubs and service areas as the footer, and
 * withheld when no hub is confirmed: a sentence with its places missing is
 * worse than no sentence.
 */
export function buildSupplyBasesStatement(
  config: SiteConfig,
): string | undefined {
  const { hubs, serviceAreas } = buildContactDetails(config);

  if (hubs.length === 0) {
    return undefined;
  }

  const list = new Intl.ListFormat('en-ZA', { type: 'conjunction' });
  const bases = `our ${hubs.length === 1 ? 'base' : 'bases'} in ${list.format(hubs)}`;
  const delivery =
    serviceAreas.length > 0
      ? `, with delivery across ${list.format(serviceAreas)}`
      : '';

  return `Supplied from ${bases}${delivery}.`;
}
