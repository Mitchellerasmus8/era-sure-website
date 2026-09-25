import {
  buildTelHref,
  buildWhatsAppHref,
  isConfirmed,
} from '@/lib/config/phone';
import type { SiteConfig } from '@/site.config';

export interface SalesContactLink {
  id: string;
  name: string;
  role?: string;
  region?: string;
  hub?: string;
  // The human-readable numbers, carried alongside the hrefs so a link can be
  // labelled with its destination. Two contacts means two "WhatsApp" links on
  // one page; without the number they share an accessible name and differ only
  // by href, which is a WCAG 2.4.4 failure and useless in a screen-reader link
  // list. Trade buyers also expect to see the number before dialling.
  phone: string;
  whatsapp: string;
  telHref: string;
  whatsAppHref: string;
}

const WHATSAPP_QUOTE_MESSAGE =
  'Hi, I would like to request a quote from Era-Sure Renewables.';

/**
 * The chooser view model: one entry per sales contact a visitor can actually
 * reach.
 *
 * Two different rules apply to the fields, and the split matters:
 *
 * - `id`, `name`, `phone` and `whatsapp` are what make an entry *work*. Without
 *   them there is no reachable contact, so the entry is dropped entirely.
 * - `role`, `region` and `hub` are descriptive labels. An unconfirmed one is
 *   omitted, never rendered — but it must not cost the business the phone
 *   number it is attached to. Dropping a working contact because nobody has
 *   confirmed which suburb they sit in is the wrong trade.
 *
 * Omitting rather than rendering also keeps a sentinel off the page, which
 * `e2e/sentinel-leak.spec.ts` enforces independently.
 */
export function buildSalesContactLinks(config: SiteConfig): SalesContactLink[] {
  return config.salesContacts.flatMap((contact) => {
    const isReachable =
      isConfirmed(contact.id) &&
      isConfirmed(contact.name) &&
      isConfirmed(contact.phone) &&
      isConfirmed(contact.whatsapp);

    if (!isReachable) {
      return [];
    }

    return [
      {
        id: contact.id,
        name: contact.name,
        ...(isConfirmed(contact.role) ? { role: contact.role } : {}),
        ...(isConfirmed(contact.region) ? { region: contact.region } : {}),
        ...(isConfirmed(contact.hub) ? { hub: contact.hub } : {}),
        phone: contact.phone,
        whatsapp: contact.whatsapp,
        telHref: buildTelHref(contact.phone),
        whatsAppHref: buildWhatsAppHref(
          contact.whatsapp,
          WHATSAPP_QUOTE_MESSAGE,
        ),
      },
    ];
  });
}
