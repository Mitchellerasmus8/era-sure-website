import { isConfirmed, buildTelHref } from '@/lib/config/phone';
import {
  automaticDataItems,
  personalDataFields,
  type AutomaticDataItem,
  type PersonalDataField,
} from '@/lib/enquiry/personal-data';
import type { SiteConfig } from '@/site.config';

export interface ResponsibleParty {
  name?: string;
  registrationNumber?: string;
  vatNumber?: string;
  address?: string;
}

export interface InformationOfficer {
  name: string;
  email: string;
}

export interface RetentionStatement {
  period: string;
  routine: string;
}

export interface PrivacyOperator {
  name: string;
  role: string;
  /** Present only where the destination has been verified. */
  destination?: string;
  /** Deliberately absent until the provider's protection level is established. */
  levelOfProtection?: string;
  /** Deliberately absent until a POPIA section 72 basis is established. */
  popiaSection72Basis?: string;
}

export interface PrivacyContactRoute {
  label: string;
  value: string;
  href?: string;
}

export interface InformationRegulatorDetails {
  name: string;
  address: string;
  /** General enquiries. Not the address a complaint should go to. */
  email: string;
  /** The dedicated POPIA complaints channel. */
  complaintsEmail: string;
  telephone: string;
  tollFree: string;
}

/**
 * POPIA section 18(1)(b): the data subject must be told whether supplying the
 * information is voluntary or mandatory, and what happens if they do not.
 *
 * Derived from the inventory's `required` flags rather than written out on the
 * page, for the same reason the inventory exists at all — a field quietly
 * becoming required would otherwise leave the notice stating the opposite of
 * what the form enforces, and nothing would report it.
 */
export interface SubmissionRequirement {
  mandatoryLabels: readonly string[];
  optionalLabels: readonly string[];
}

export interface PrivacyNotice {
  responsibleParty: ResponsibleParty;
  informationOfficer?: InformationOfficer;
  retention?: RetentionStatement;
  operators: readonly PrivacyOperator[];
  dataSubjectContacts: readonly PrivacyContactRoute[];
  personalData: readonly PersonalDataField[];
  submissionRequirement: SubmissionRequirement;
  automaticData: readonly AutomaticDataItem[];
  regulator: InformationRegulatorDetails;
}

/**
 * Taken from the Regulator's own contact page on 2026-08-10, not from memory,
 * and recorded with its source in `docs/popia-processing-facts.md`. A
 * wrong address for a regulator in a legal notice is the plausible-looking
 * error ARCHI section 7 warns about: it reads perfectly and makes the right to
 * complain unusable. Re-check before launch.
 *
 * **The complaints address is separate on purpose.** The Regulator publishes a
 * dedicated `POPIAComplaints@` channel alongside general enquiries, so a notice
 * that invites a complaint and then prints the enquiries address is routing
 * people to the wrong desk. A first draft here did exactly that, because only
 * the site's home page had been checked and it lists the general address alone.
 */
const informationRegulator: InformationRegulatorDetails = {
  name: 'Information Regulator of South Africa',
  address:
    'Woodmead North Office Park, 54 Maxwell Drive, Woodmead, Johannesburg, 2191',
  email: 'enquiries@inforegulator.org.za',
  complaintsEmail: 'POPIAComplaints@inforegulator.org.za',
  telephone: '010 023 5200',
  tollFree: '0800 017 160',
};

/**
 * These are the operators evidenced in `docs/popia-processing-facts.md`.
 * Netlify's United States destination is verified. GoDaddy is the verified
 * mailbox operator, but its storage destination is not established. Neither
 * operator has a verified protection level or POPIA section 72 basis, so those
 * properties stay absent instead of being replaced with generic language.
 */
const operators: readonly PrivacyOperator[] = [
  {
    name: 'Netlify',
    role: 'Form provider and submission processor',
    destination: 'United States, among other countries',
  },
  {
    name: 'GoDaddy',
    role: 'Mailbox provider for form notification emails',
  },
];

function buildResponsibleParty(config: SiteConfig): ResponsibleParty {
  return {
    ...(isConfirmed(config.tradingName) ? { name: config.tradingName } : {}),
    ...(isConfirmed(config.registrationNumber)
      ? { registrationNumber: config.registrationNumber }
      : {}),
    ...(isConfirmed(config.vatNumber) ? { vatNumber: config.vatNumber } : {}),
    ...(isConfirmed(config.registeredAddress)
      ? { address: config.registeredAddress }
      : {}),
  };
}

function buildInformationOfficer(
  config: SiteConfig,
): InformationOfficer | undefined {
  const { name, email } = config.informationOfficer;

  return isConfirmed(name) && isConfirmed(email) ? { name, email } : undefined;
}

function buildRetentionStatement(
  config: SiteConfig,
): RetentionStatement | undefined {
  const { period, routine } = config.retention;

  return isConfirmed(period) && isConfirmed(routine)
    ? { period, routine }
    : undefined;
}

function buildDataSubjectContacts(config: SiteConfig): PrivacyContactRoute[] {
  const contacts: PrivacyContactRoute[] = [];

  if (isConfirmed(config.salesEmail)) {
    contacts.push({
      label: 'Sales email',
      value: config.salesEmail,
      href: `mailto:${config.salesEmail}`,
    });
  }

  config.salesContacts.forEach((contact) => {
    if (!isConfirmed(contact.phone)) {
      return;
    }

    const label = isConfirmed(contact.name)
      ? `Phone - ${contact.name}`
      : 'Phone';

    contacts.push({
      label,
      value: contact.phone,
      href: buildTelHref(contact.phone),
    });
  });

  return contacts;
}

function buildSubmissionRequirement(): SubmissionRequirement {
  return {
    mandatoryLabels: personalDataFields
      .filter((field) => field.required)
      .map((field) => field.label),
    optionalLabels: personalDataFields
      .filter((field) => !field.required)
      .map((field) => field.label),
  };
}

export function buildPrivacyNotice(config: SiteConfig): PrivacyNotice {
  const informationOfficer = buildInformationOfficer(config);
  const retention = buildRetentionStatement(config);

  return {
    responsibleParty: buildResponsibleParty(config),
    ...(informationOfficer ? { informationOfficer } : {}),
    ...(retention ? { retention } : {}),
    operators,
    dataSubjectContacts: buildDataSubjectContacts(config),
    personalData: personalDataFields,
    submissionRequirement: buildSubmissionRequirement(),
    automaticData: automaticDataItems,
    regulator: informationRegulator,
  };
}
