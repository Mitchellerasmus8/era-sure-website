import { describe, expect, it } from 'vitest';

import { getProductUrl } from '@/lib/catalogue/routes';

describe('getProductUrl', () => {
  it('maps a product slug to its cable URL', () => {
    expect(getProductUrl({ slug: 'solar-cable-4-mm2' })).toBe(
      '/cables/solar-cable-4-mm2/',
    );
  });
});
