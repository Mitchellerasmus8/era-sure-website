import { describe, expect, it } from 'vitest';

import { sortProducts } from '@/lib/catalogue/sort';

type TestEntry = {
  id: string;
  data: {
    name: string;
    crossSectionMm2: number;
  };
};

function entry(id: string, name: string, crossSectionMm2: number): TestEntry {
  return { id, data: { name, crossSectionMm2 } };
}

describe('sortProducts', () => {
  it('sorts by cross-section ascending and then by name', () => {
    const entries = [
      entry('twin-6', 'Twin core 6 mm2', 6),
      entry('single-4', 'Single core 4 mm2', 4),
      entry('twin-4', 'Twin core 4 mm2', 4),
    ];

    expect(sortProducts(entries).map((item) => item.id)).toEqual([
      'single-4',
      'twin-4',
      'twin-6',
    ]);
  });

  it('keeps equal entries in their original order', () => {
    const first = entry('first', 'Same cable', 4);
    const second = entry('second', 'Same cable', 4);

    expect(sortProducts([first, second])).toEqual([first, second]);
  });

  it('does not mutate the input array', () => {
    const entries = [entry('six', 'Six', 6), entry('four', 'Four', 4)];
    const original = [...entries];

    sortProducts(entries);

    expect(entries).toEqual(original);
  });
});
