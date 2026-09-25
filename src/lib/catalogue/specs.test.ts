import { describe, expect, it } from 'vitest';

import { formatCardSpecs, formatSpecs } from '@/lib/catalogue/specs';

const requiredSpecifications = {
  conductorMaterial: 'tinned-copper',
  crossSectionMm2: 4,
  coreCount: 1,
  voltageRating: '1.5/1.5 kV DC',
};

describe('formatSpecs', () => {
  it('formats specification units, ranges, numbers and booleans', () => {
    expect(
      formatSpecs({
        ...requiredSpecifications,
        currentRatingAmps: 55,
        temperatureMinC: -40,
        temperatureMaxC: 90,
        insulationMaterial: 'XLPE',
        sheathMaterial: 'XLPE',
        uvResistant: true,
        colours: ['black', 'red'],
        lengthsM: [100, 1000],
        standards: ['EN 50618'],
        stockNote: 'Available to order.',
        minimumOrderQuantity: '1 drum',
      }),
    ).toEqual([
      { label: 'Conductor material', value: 'Tinned copper' },
      { label: 'Cross-section', value: '4 mm²' },
      { label: 'Core count', value: '1 core' },
      { label: 'Voltage rating', value: '1.5/1.5 kV DC' },
      { label: 'Current rating', value: '55 A' },
      { label: 'Temperature range', value: '-40 °C to +90 °C' },
      { label: 'Insulation material', value: 'XLPE' },
      { label: 'Sheath material', value: 'XLPE' },
      { label: 'UV resistant', value: 'Yes' },
      { label: 'Colours', value: 'Black, Red' },
      { label: 'Available lengths', value: '100 m, 1 000 m' },
      { label: 'Standards', value: 'EN 50618' },
      { label: 'Stock note', value: 'Available to order.' },
      { label: 'Minimum order quantity', value: '1 drum' },
    ]);
  });

  it('omits absent optional fields instead of rendering blanks', () => {
    const rows = formatSpecs({
      ...requiredSpecifications,
      temperatureMinC: -40,
    });

    expect(rows).toEqual([
      { label: 'Conductor material', value: 'Tinned copper' },
      { label: 'Cross-section', value: '4 mm²' },
      { label: 'Core count', value: '1 core' },
      { label: 'Voltage rating', value: '1.5/1.5 kV DC' },
    ]);
    expect(rows.every(({ value }) => value.trim().length > 0)).toBe(true);
    expect(JSON.stringify(rows)).not.toContain('undefined');
  });

  it('includes a false UV resistance value when it is explicitly present', () => {
    expect(
      formatSpecs({ ...requiredSpecifications, uvResistant: false }),
    ).toContainEqual({ label: 'UV resistant', value: 'No' });
  });
});

describe('formatCardSpecs', () => {
  it('formats the three values a listing card shows', () => {
    expect(formatCardSpecs(requiredSpecifications)).toEqual({
      crossSection: '4 mm²',
      coreCount: '1 core',
      conductorMaterial: 'Tinned copper',
    });
  });

  it('pluralises the core count', () => {
    expect(
      formatCardSpecs({ ...requiredSpecifications, coreCount: 2 }).coreCount,
    ).toBe('2 cores');
  });

  // The card and the spec table must agree; two formatters drifting apart
  // would show a different cross-section on the listing than on the product.
  it('agrees with formatSpecs on the shared values', () => {
    const card = formatCardSpecs(requiredSpecifications);
    const rows = formatSpecs(requiredSpecifications);
    const rowValue = (label: string) =>
      rows.find((row) => row.label === label)?.value;

    expect(card.crossSection).toBe(rowValue('Cross-section'));
    expect(card.coreCount).toBe(rowValue('Core count'));
    expect(card.conductorMaterial).toBe(rowValue('Conductor material'));
  });
});
