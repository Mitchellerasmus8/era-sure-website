import { describe, expect, it } from 'vitest';
import { NON_PRODUCTION_ROBOTS, resolveRobots } from '@/lib/seo/robots';

describe('resolveRobots', () => {
  it('keeps a page opt-out on production', () => {
    expect(resolveRobots('noindex, follow', 'production')).toBe(
      'noindex, follow',
    );
  });

  it('leaves an ordinary production page indexable', () => {
    expect(resolveRobots(undefined, 'production')).toBeUndefined();
  });

  it('forces noindex on deploy previews', () => {
    expect(resolveRobots(undefined, 'deploy-preview')).toBe(
      NON_PRODUCTION_ROBOTS,
    );
  });

  it('forces noindex on branch deploys', () => {
    expect(resolveRobots(undefined, 'branch-deploy')).toBe(
      NON_PRODUCTION_ROBOTS,
    );
  });

  it('overrides a weaker page value outside production', () => {
    // `/404/` and `/quote/success/` ask for `noindex, follow`. A preview must
    // not follow links onward into a duplicate of the whole site.
    expect(resolveRobots('noindex, follow', 'deploy-preview')).toBe(
      NON_PRODUCTION_ROBOTS,
    );
  });

  it('treats an absent context as a local build and changes nothing', () => {
    expect(resolveRobots(undefined, undefined)).toBeUndefined();
    expect(resolveRobots('noindex, follow', undefined)).toBe('noindex, follow');
  });
});
