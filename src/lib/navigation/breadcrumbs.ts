import { routeLabels } from '@/lib/navigation/nav';

export interface Crumb {
  label: string;
  href: string;
  isCurrent: boolean;
}

function normaliseHref(href: string): string {
  if (href === '/') {
    return href;
  }

  return `/${href.replace(/^\/+|\/+$/g, '')}/`;
}

function deSlugify(segment: string): string {
  let decodedSegment = segment;

  try {
    decodedSegment = decodeURIComponent(segment);
  } catch {
    // An invalid escape is still an unknown segment; it must not break a 404 trail.
  }

  return decodedSegment
    .replace(/[-_]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ');
}

function labelFor(href: string, segment: string): string {
  const routeLabel = routeLabels.find(
    (item) => normaliseHref(item.href) === normaliseHref(href),
  );

  return routeLabel?.label ?? deSlugify(segment);
}

interface BreadcrumbOptions {
  /**
   * Label for the final crumb, when the caller knows the real title.
   *
   * De-slugifying a URL segment is a reasonable fallback for an unknown route,
   * but it cannot recover casing or units — `solar-pv-cable-4mm2-twin-core`
   * becomes "Solar Pv Cable 4mm2 Twin Core" rather than the product's actual
   * name, "Solar PV Cable 4 mm² Twin Core". A page holding the entry should
   * pass its name rather than let the trail guess at it.
   */
  currentLabel?: string;
}

export function getBreadcrumbs(
  pathname: string,
  options: BreadcrumbOptions = {},
): Crumb[] {
  const segments = pathname.split('/').filter(Boolean);
  const homeLabel =
    routeLabels.find((item) => normaliseHref(item.href) === '/')?.label ??
    'Home';

  if (segments.length === 0) {
    return [{ label: homeLabel, href: '/', isCurrent: true }];
  }

  const crumbs: Crumb[] = [
    {
      label: homeLabel,
      href: '/',
      isCurrent: false,
    },
  ];

  segments.forEach((segment, index) => {
    const href = normaliseHref(`/${segments.slice(0, index + 1).join('/')}`);
    const isCurrent = index === segments.length - 1;

    crumbs.push({
      label:
        isCurrent && options.currentLabel
          ? options.currentLabel
          : labelFor(href, segment),
      href,
      isCurrent,
    });
  });

  return crumbs;
}
