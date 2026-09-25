/**
 * Business facts, in one place (ARCHI §7). Never type these into a template.
 *
 * Unknown values hold the literal sentinel `TODO_CLIENT`. Do not replace a
 * sentinel with a plausible-looking placeholder: an invented phone number or
 * address looks correct, fails silently, and costs the business a lead.
 * Replace only with confirmed detail.
 *
 * `siteUrl` was the one exception to the sentinel format — Astro validates it
 * as a URL, so it had to stay parseable, and it held a reserved RFC 2606
 * `.invalid` host that could never resolve. **It is now confirmed** as the
 * www host of the domain the client already uses for email. The guard in
 * `src/lib/config/placeholders.ts` still reports any `.invalid` host, so the
 * check stays meaningful if the value is ever reverted.
 *
 * The `www.` prefix is load-bearing, not cosmetic: it is the primary domain in
 * Netlify, the apex 301-redirects to it, and every canonical, Open Graph URL,
 * sitemap entry and structured-data URL is built from this string. A mismatch
 * between this value and the primary domain means canonicals pointing at a
 * host that immediately redirects — which is a silent SEO fault, not an error.
 */
export interface SalesContact {
  id: string;
  name: string;
  role: string;
  region: string;
  hub: string;
  phone: string;
  whatsapp: string;
}

export interface SiteConfig {
  // This confirmed public name is separate from the registered legal name below.
  displayName: string;
  tradingName: string;
  registrationNumber: string;
  vatNumber: string;
  registeredAddress: string;
  informationOfficer: {
    name: string;
    email: string;
  };
  retention: {
    period: string;
    routine: string;
  };
  tagline: string;
  responseTime: string;
  salesContacts: SalesContact[];
  salesEmail: string;
  accountsEmail: string;
  businessHours: {
    weekdays: string;
    saturday: string;
    sunday: string;
    supportNote: string;
  };
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
  };
  serviceAreas: string[];
  siteUrl: string;
}

export const siteConfig: SiteConfig = {
  displayName: 'Era-Sure Renewables',
  tradingName: 'Era-Sure Trading (Pty) Ltd',
  registrationNumber: '2023/206746/07',
  vatNumber: '4790315370',
  registeredAddress: 'TODO_CLIENT',
  informationOfficer: {
    name: 'TODO_CLIENT',
    email: 'TODO_CLIENT',
  },
  retention: {
    period: 'TODO_CLIENT',
    routine: 'TODO_CLIENT',
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
    {
      id: 'wesley',
      name: 'Wesley Erasmus',
      role: 'Sales contact',
      region: 'KwaZulu-Natal',
      hub: 'Hillcrest, KZN',
      phone: '+27 71 637 4188',
      whatsapp: '+27 71 637 4188',
    },
  ],
  salesEmail: 'sales@erasuretrading.co.za',
  accountsEmail: 'accounts@erasuretrading.co.za',
  businessHours: {
    weekdays: '07:30 – 17:00',
    saturday: 'TODO_CLIENT',
    sunday: 'TODO_CLIENT',
    supportNote: 'After-sales support is available 24/7.',
  },
  serviceAreas: ['South Africa'],
  socialLinks: {
    facebook: 'https://www.facebook.com/erasure.renewables',
    instagram: 'https://www.instagram.com/erasure.renewables/',
    linkedin: 'https://www.linkedin.com/company/era-sure-renewables/',
  },
  siteUrl: 'https://www.erasuretrading.co.za',
};
