import { describe, expect, it } from 'vitest';

import {
  automaticDataItems,
  personalDataFields,
} from '@/lib/enquiry/personal-data';

describe('personal data inventories', () => {
  it('mirrors the seven user-facing quote-form fields', () => {
    expect(personalDataFields.map(({ name }) => name)).toEqual([
      'name',
      'company',
      'email',
      'phone',
      'customer-type',
      'products',
      'bill-of-quantities',
    ]);

    expect(personalDataFields.map(({ required }) => required)).toEqual([
      true,
      true,
      true,
      true,
      true,
      true,
      false,
    ]);

    expect(personalDataFields.at(-1)).toMatchObject({
      name: 'bill-of-quantities',
      accept: '.pdf,.csv,.xls,.xlsx,.doc,.docx',
    });
  });

  it('has complete descriptions and excludes provider controls', () => {
    personalDataFields.forEach((field) => {
      expect(field.name.trim()).not.toBe('');
      expect(field.label.trim()).not.toBe('');
      expect(field.purpose.trim()).not.toBe('');
      expect(typeof field.required).toBe('boolean');
    });

    expect(personalDataFields).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'form-name' }),
        expect.objectContaining({ name: 'website' }),
      ]),
    );

    personalDataFields
      .filter(({ name }) => name !== 'bill-of-quantities')
      .forEach((field) => {
        expect(field).not.toHaveProperty('accept');
      });
  });

  it('keeps automatic collection at the verified category level', () => {
    expect(automaticDataItems.length).toBeGreaterThan(0);

    automaticDataItems.forEach((item) => {
      expect(item.label.trim()).not.toBe('');
      expect(item.purpose.trim()).not.toBe('');
      expect(item.operator.trim()).not.toBe('');
      expect(item).not.toHaveProperty('name');
    });

    const serialised = JSON.stringify(automaticDataItems).toLowerCase();
    expect(serialised).not.toContain('ip address');
    expect(serialised).not.toContain('user agent');
  });
});
