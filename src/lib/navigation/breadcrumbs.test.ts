import { describe, expect, it } from 'vitest';
import { getBreadcrumbs } from '@/lib/navigation/breadcrumbs';

describe('getBreadcrumbs', () => {
  it('returns the home crumb as the current root page', () => {
    expect(getBreadcrumbs('/')).toEqual([
      { label: 'Home', href: '/', isCurrent: true },
    ]);
  });

  it('includes home and the current crumb for a single segment', () => {
    expect(getBreadcrumbs('/about')).toEqual([
      { label: 'Home', href: '/', isCurrent: false },
      { label: 'About', href: '/about/', isCurrent: true },
    ]);
  });

  it('builds cumulative links for nested segments', () => {
    expect(getBreadcrumbs('/cables/solar-cable')).toEqual([
      { label: 'Home', href: '/', isCurrent: false },
      { label: 'Cables', href: '/cables/', isCurrent: false },
      {
        label: 'Solar Cable',
        href: '/cables/solar-cable/',
        isCurrent: true,
      },
    ]);
  });

  it('uses the delivery collection label for a delivery detail trail', () => {
    expect(
      getBreadcrumbs('/deliveries/gauteng-solar-delivery/', {
        currentLabel: 'Solar equipment supplied in Gauteng',
      }).map((crumb) => crumb.label),
    ).toEqual([
      'Home',
      'Supply and delivery highlights',
      'Solar equipment supplied in Gauteng',
    ]);
  });

  it('normalises a trailing slash without adding an empty crumb', () => {
    expect(getBreadcrumbs('/about/')).toEqual(getBreadcrumbs('/about'));
  });

  it('de-slugifies labels for segments without a nav item', () => {
    expect(getBreadcrumbs('/solar-products/')[1]).toEqual({
      label: 'Solar Products',
      href: '/solar-products/',
      isCurrent: true,
    });
  });

  // De-slugifying cannot recover casing or units, so a caller holding the real
  // title must be able to supply it.
  it('uses a supplied label for the current crumb', () => {
    const trail = getBreadcrumbs('/cables/solar-pv-cable-4mm2-twin-core/', {
      currentLabel: 'Solar PV Cable 4 mm² Twin Core',
    });

    expect(trail.at(-1)).toEqual({
      label: 'Solar PV Cable 4 mm² Twin Core',
      href: '/cables/solar-pv-cable-4mm2-twin-core/',
      isCurrent: true,
    });
  });

  it('does not apply a supplied label to ancestor crumbs', () => {
    const trail = getBreadcrumbs('/cables/solar-pv-cable-4mm2-twin-core/', {
      currentLabel: 'Solar PV Cable 4 mm² Twin Core',
    });

    expect(trail.map((crumb) => crumb.label)).toEqual([
      'Home',
      'Cables',
      'Solar PV Cable 4 mm² Twin Core',
    ]);
  });
});
