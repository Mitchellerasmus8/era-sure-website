import { buildSalesContactLinks } from '@/lib/config/sales-contacts';
import { siteConfig, type SiteConfig } from '@/site.config';

export interface PrimaryCta {
  label: string;
  href: string;
}

export const CONTACT_ROUTE = '/contact/';
export const QUOTE_ROUTE = '/quote/';

/**
 * The primary call to action, or `null` when there is no honest destination.
 *
 * The quote form is the primary route. Direct phone and WhatsApp options remain
 * available on `/contact/` for visitors who prefer a conversation.
 */
export function getPrimaryCta(
  config: SiteConfig = siteConfig,
): PrimaryCta | null {
  if (buildSalesContactLinks(config).length === 0) {
    return null;
  }

  return {
    label: 'Request a quote',
    href: QUOTE_ROUTE,
  };
}
