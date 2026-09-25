import { describe, expect, it } from 'vitest';
import { buildNavItems, routeLabels } from '@/lib/navigation/nav';

describe('buildNavItems', () => {
  it('shows Home, Products, About and Contact in order', () => {
    expect(buildNavItems()).toEqual([
      { label: 'Home', href: '/' },
      { label: 'Products', href: '/products/' },
      { label: 'About', href: '/about/' },
      { label: 'Contact', href: '/contact/' },
    ]);
  });

  it('keeps route labels for breadcrumbs', () => {
    expect(routeLabels).toEqual(
      expect.arrayContaining([
        { label: 'About', href: '/about/' },
        { label: 'Contact', href: '/contact/' },
        { label: 'Request a quote', href: '/quote/' },
        {
          label: 'Supply and delivery highlights',
          href: '/deliveries/',
        },
        { label: 'Cables', href: '/cables/' },
        { label: 'Cables', href: '/products/cables/' },
        { label: 'Cable management', href: '/products/cable-management/' },
        {
          label: 'Switchgear and components',
          href: '/products/switchgear-and-components/',
        },
        {
          label: 'Enclosures and custom AC/DC combiners',
          href: '/products/enclosures-and-combiners/',
        },
        {
          label: 'Electrical consumables',
          href: '/products/electrical-consumables/',
        },
        {
          label: 'Renewable energy equipment',
          href: '/products/renewable-energy-equipment/',
        },
      ]),
    );
  });

  it('does not expose the legacy cable route in the visible nav', () => {
    expect(buildNavItems()).not.toContainEqual({
      label: 'Cables',
      href: '/cables/',
    });
  });

  it('does not expose delivery highlights in the nav before approved entries exist', () => {
    expect(buildNavItems()).not.toContainEqual({
      label: 'Supply and delivery highlights',
      href: '/deliveries/',
    });
  });

  it('labels the privacy notice for breadcrumbs without adding it to the visible nav', () => {
    // The notice is reached from the footer and from the quote form, not from
    // the primary navigation — but its breadcrumb trail still has to resolve,
    // which is exactly the identity/visibility split `routeLabels` exists for.
    expect(routeLabels).toContainEqual({
      label: 'Privacy notice',
      href: '/privacy/',
    });
    expect(buildNavItems()).not.toContainEqual({
      label: 'Privacy notice',
      href: '/privacy/',
    });
  });
});
