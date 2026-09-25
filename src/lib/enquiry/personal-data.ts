/**
 * The personal-information contract for the quote form.
 *
 * Keep this list aligned with the user-facing controls in
 * `src/components/enquiry/QuoteForm.astro`. Provider controls are deliberately
 * not part of the inventory: `form-name` is Netlify plumbing, and `website` is
 * the honeypot used for spam filtering.
 */
export interface PersonalDataField {
  /** The exact `name` attribute used by the form control. */
  name: string;
  label: string;
  purpose: string;
  required: boolean;
  /** The exact `accept` attribute used by the optional file control. */
  accept?: string;
}

export interface AutomaticDataItem {
  label: string;
  purpose: string;
  operator: string;
}

export const personalDataFields: readonly PersonalDataField[] = [
  {
    name: 'name',
    label: 'Name',
    purpose: 'To identify the person making the enquiry.',
    required: true,
  },
  {
    name: 'company',
    label: 'Company',
    purpose: 'To understand which business or project team is enquiring.',
    required: true,
  },
  {
    name: 'email',
    label: 'Email address',
    purpose:
      'To send your quotation and correspond about your enquiry. A quotation is a document, so without an email address it can only be discussed by phone.',
    required: true,
  },
  {
    name: 'phone',
    label: 'Phone or WhatsApp number',
    purpose: 'To contact you about your enquiry and quotation.',
    required: true,
  },
  {
    name: 'customer-type',
    label: 'I am enquiring as',
    purpose:
      'To understand the type of customer or organisation making the enquiry.',
    required: true,
  },
  {
    name: 'products',
    label: 'Products or part numbers',
    purpose: 'To understand what products or part numbers you need quoted.',
    required: true,
  },
  {
    name: 'bill-of-quantities',
    label: 'Bill of quantities or product list',
    purpose:
      'To review the quantities and products needed for the quotation. An attachment may contain personal information you choose to include.',
    required: false,
    accept: '.pdf,.csv,.xls,.xlsx,.doc,.docx',
  },
];

/**
 * Netlify's public privacy statement excludes data processed as a processor on
 * behalf of a customer. The exact metadata stored against an individual form
 * submission is therefore not established here; keep this inventory at the
 * verified category level rather than naming fields such as an IP address or
 * user agent.
 */
export const automaticDataItems: readonly AutomaticDataItem[] = [
  {
    label: 'Automatically collected technical information',
    purpose: 'To operate and protect the form service.',
    operator: 'Netlify Forms',
  },
];
