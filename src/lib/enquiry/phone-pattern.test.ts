import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Reads the `pattern` attribute out of the component rather than restating it.
 *
 * That indirection is the point. The first version of this attribute shipped
 * as `(?=(?:D*d){9,})[ds+()-]{9,25}` — every backslash silently dropped
 * somewhere between authoring and the file on disk. It looked plausible, and
 * it rejected every real phone number, which is worse than no validation at
 * all: the form would have refused valid customers with a browser message
 * nobody could act on.
 *
 * A test that retypes the regex would have passed against that bug. This one
 * cannot, because it tests the bytes that actually ship.
 */
const COMPONENT = fileURLToPath(
  new URL('../../components/enquiry/QuoteForm.astro', import.meta.url),
);

function shippedPhonePattern(): RegExp {
  const match = readFileSync(COMPONENT, 'utf8').match(/pattern="([^"]+)"/);

  expect(match).not.toBeNull();

  // Browsers anchor a `pattern` attribute implicitly.
  return new RegExp(`^(?:${match?.[1]})$`);
}

describe('quote form phone validation', () => {
  const accepts = [
    '0828705847',
    '082 870 5847',
    '071 637 4188',
    '+27 82 870 5847',
    '+27 (0)82 870-5847',
    '+27828705847',
  ];

  const rejects = [
    'asdf',
    'not a number',
    '123',
    '12345678',
    '++++++++++',
    'email@me.com',
    '',
  ];

  it.each(accepts)('accepts %s', (value) => {
    expect(shippedPhonePattern().test(value)).toBe(true);
  });

  it.each(rejects)('rejects %s', (value) => {
    expect(shippedPhonePattern().test(value)).toBe(false);
  });

  it('uses explicit ranges rather than backslash classes', () => {
    // The escaping hazard that caused the original bug. Explicit ranges cannot
    // be broken by a dropped backslash, because there is none to drop.
    const source = shippedPhonePattern().source;

    expect(source).not.toContain('\d');
    expect(source).not.toContain('\s');
    expect(source).toContain('0-9');
  });

  it('accepts both real sales numbers from the site config', async () => {
    const { siteConfig } = await import('@/site.config');
    const pattern = shippedPhonePattern();

    for (const contact of siteConfig.salesContacts) {
      expect(pattern.test(contact.phone)).toBe(true);
    }
  });
});
