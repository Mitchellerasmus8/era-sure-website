export interface NavItem {
  label: string;
  href: string;
}

// Keep route identity separate from visibility so breadcrumbs work when a nav item is hidden.
export const routeLabels: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Products', href: '/products/' },
  { label: 'About', href: '/about/' },
  { label: 'Contact', href: '/contact/' },
  { label: 'Privacy notice', href: '/privacy/' },
  { label: 'Request a quote', href: '/quote/' },
  { label: 'Supply and delivery highlights', href: '/deliveries/' },
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
];

// The visible subset. Every other route in `routeLabels` is reachable but not
// advertised: `/cables/` because the client did not ask for a product
// catalogue, and the six capability routes because they are reached through
// `/products/`, not the top-level nav.
//
// Request a Quote has a route but is rendered as the persistent header CTA,
// not duplicated in this list. Delivery highlights stay out of the persistent
// nav until approved entries exist; their home-page cards provide discovery.
const VISIBLE_HREFS: readonly string[] = [
  '/',
  '/products/',
  '/about/',
  '/contact/',
];

export function buildNavItems(): NavItem[] {
  return routeLabels.filter((item) => VISIBLE_HREFS.includes(item.href));
}
