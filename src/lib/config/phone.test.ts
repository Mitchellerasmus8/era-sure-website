import { describe, expect, it } from 'vitest';

import {
  buildTelHref,
  buildWhatsAppHref,
  isConfirmed,
  normaliseNumber,
} from '@/lib/config/phone';
import { TODO_CLIENT } from '@/lib/config/placeholders';

describe('normaliseNumber', () => {
  it('keeps a leading plus for tel links', () => {
    expect(normaliseNumber('+27 (82) 870-5847', true)).toBe('+27828705847');
  });

  it('returns digits only for WhatsApp links', () => {
    expect(normaliseNumber('+27 (82) 870-5847', false)).toBe('27828705847');
  });

  it('supports local numbers without inventing an international prefix', () => {
    expect(normaliseNumber('082 870 5847', true)).toBe('0828705847');
    expect(normaliseNumber('082 870 5847', false)).toBe('0828705847');
  });
});

describe('phone href builders', () => {
  it('builds a tel href from the display number', () => {
    expect(buildTelHref('+27 82 870 5847')).toBe('tel:+27828705847');
  });

  it('builds a digits-only WhatsApp href from the display number', () => {
    expect(buildWhatsAppHref('+27 82 870 5847')).toBe(
      'https://wa.me/27828705847',
    );
  });

  it('URL-encodes an optional WhatsApp message', () => {
    expect(
      buildWhatsAppHref(
        '+27 82 870 5847',
        'Hi, I would like to request a quote from Era-Sure Renewables.',
      ),
    ).toBe(
      'https://wa.me/27828705847?text=Hi%2C%20I%20would%20like%20to%20request%20a%20quote%20from%20Era-Sure%20Renewables.',
    );
  });
});

describe('isConfirmed', () => {
  it('rejects sentinels and blank values', () => {
    expect(isConfirmed(TODO_CLIENT)).toBe(false);
    expect(isConfirmed('https://era-sure-renewables.invalid')).toBe(false);
    expect(isConfirmed('   ')).toBe(false);
    expect(isConfirmed(undefined)).toBe(false);
  });

  it('accepts a non-empty confirmed value', () => {
    expect(isConfirmed('sales@example.com')).toBe(true);
  });
});
