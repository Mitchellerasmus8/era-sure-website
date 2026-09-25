import { describe, expect, it } from 'vitest';

import { assertUniqueSlugs } from '@/lib/catalogue/slugs';

describe('assertUniqueSlugs', () => {
  it('accepts entries with unique slugs', () => {
    expect(() =>
      assertUniqueSlugs([
        { id: 'first-cable', data: { slug: 'solar-cable-4-mm2' } },
        { id: 'second-cable', data: { slug: 'solar-cable-6-mm2' } },
      ]),
    ).not.toThrow();
  });

  it('throws with the duplicate slug and both entries named', () => {
    expect(() =>
      assertUniqueSlugs([
        { id: 'first-cable', data: { slug: 'duplicate-cable' } },
        { id: 'second-cable', data: { slug: 'duplicate-cable' } },
      ]),
    ).toThrow(
      'Duplicate product slug: "duplicate-cable" held by first-cable and second-cable.',
    );
  });
});
