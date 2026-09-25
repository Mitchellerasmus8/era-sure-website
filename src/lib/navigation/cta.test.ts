import { describe, expect, it } from 'vitest';

import { TODO_CLIENT } from '@/lib/config/placeholders';
import { QUOTE_ROUTE, getPrimaryCta } from '@/lib/navigation/cta';
import { siteConfig } from '@/site.config';

describe('getPrimaryCta', () => {
  it('returns the quote route when a contact is confirmed', () => {
    expect(getPrimaryCta()).toEqual({
      label: 'Request a quote',
      href: QUOTE_ROUTE,
    });
  });

  it('returns null when no contact is reachable', () => {
    const config = {
      ...siteConfig,
      salesContacts: siteConfig.salesContacts.map((contact) => ({
        ...contact,
        phone: TODO_CLIENT,
        whatsapp: TODO_CLIENT,
      })),
    };

    expect(getPrimaryCta(config)).toBeNull();
  });

  it('includes a label whenever it returns an href', () => {
    const cta = getPrimaryCta();

    if (cta?.href) {
      expect(cta.label).toBeTruthy();
    }
  });

  it('uses a site-relative path rather than a fragment', () => {
    const cta = getPrimaryCta();

    expect(cta?.href).toMatch(/^\/[^#]/);
    expect(cta?.href).not.toContain('#');
  });
});
