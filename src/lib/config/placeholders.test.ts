import { findPlaceholders } from '@/lib/config/placeholders';
import { describe, expect, it } from 'vitest';

describe('findPlaceholders', () => {
  it('returns no paths for a config without sentinels', () => {
    expect(
      findPlaceholders({
        tradingName: 'Era-Sure Renewables',
        siteUrl: 'https://example.com',
      }),
    ).toEqual([]);
  });

  it('reports TODO_CLIENT values with dotted key paths', () => {
    expect(
      findPlaceholders({
        tradingName: 'TODO_CLIENT',
        salesContacts: [{ name: 'TODO_CLIENT', phone: 'TODO_CLIENT' }],
        businessHours: { saturday: 'TODO_CLIENT' },
        serviceAreas: ['TODO_CLIENT', 'Gauteng'],
      }),
    ).toEqual([
      'tradingName',
      'salesContacts.0.name',
      'salesContacts.0.phone',
      'businessHours.saturday',
      'serviceAreas.0',
    ]);
  });

  it('reports a site URL on the .invalid TLD', () => {
    expect(
      findPlaceholders({
        siteUrl: 'https://example.invalid',
      }),
    ).toEqual(['siteUrl']);
  });

  it('does not report a real-looking URL', () => {
    expect(
      findPlaceholders({
        siteUrl: 'https://example.com',
      }),
    ).toEqual([]);
  });

  it('handles nested objects and arrays', () => {
    expect(
      findPlaceholders({
        salesContacts: [
          { name: 'TODO_CLIENT', phone: 'TODO_CLIENT' },
          { name: 'Wesley Erasmus', phone: 'sales@example.com' },
        ],
      }),
    ).toEqual(['salesContacts.0.name', 'salesContacts.0.phone']);
  });

  // `socialLinks` and similar fields are genuinely optional, so absent, null
  // and undefined values are normal input — not an error case.
  it('ignores absent, undefined and null values without throwing', () => {
    expect(
      findPlaceholders({
        tradingName: 'Era-Sure Renewables',
        socialLinks: undefined,
        registrationNumber: null,
        businessHours: {},
        salesContacts: [],
        serviceAreas: [],
      }),
    ).toEqual([]);
  });

  it('returns no paths for an empty config', () => {
    expect(findPlaceholders({})).toEqual([]);
  });
});
