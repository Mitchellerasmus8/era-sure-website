import { expect, test } from '@playwright/test';
import { siteConfig } from '@/site.config';

// Derived from the one place the host is configured, so confirming the real
// domain does not silently leave five hard-coded expectations behind.
const absolute = (path: string) => new URL(path, siteConfig.siteUrl).href;

test('home page exposes complete sharing and organization metadata', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    absolute('/'),
  );
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    'content',
    'Electrical & Solar Supplier SA | Era-Sure Renewables',
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    absolute('/og.png'),
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    'content',
    'summary_large_image',
  );

  const graphs = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents();
  const structuredData = graphs.map((graph) => JSON.parse(graph));
  const homeGraph = structuredData.find((item) => item['@graph']);

  expect(homeGraph['@graph']).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        '@type': 'Organization',
        name: 'Era-Sure Renewables',
      }),
      expect.objectContaining({
        '@type': 'WebSite',
        name: 'Era-Sure Renewables',
      }),
    ]),
  );
});

test('nested pages expose breadcrumb structured data and branded titles', async ({
  page,
}) => {
  await page.goto('/products/renewable-energy-equipment/');

  await expect(page).toHaveTitle(
    'Solar Panels, Inverters & Batteries | Era-Sure Renewables',
  );

  const graphs = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents();
  const breadcrumbGraph = graphs
    .map((graph) => JSON.parse(graph))
    .find((item) => item['@type'] === 'BreadcrumbList');

  expect(breadcrumbGraph.itemListElement).toEqual([
    expect.objectContaining({ position: 1, name: 'Home' }),
    expect.objectContaining({ position: 2, name: 'Products' }),
    expect.objectContaining({
      position: 3,
      name: 'Renewable energy equipment',
    }),
  ]);
});

test('category pages lead with the searched range, their bases and their own preview image', async ({
  page,
}) => {
  await page.goto('/products/cable-management/');

  // The h1 carries the phrase buyers search; the category name stays the
  // breadcrumb label.
  await expect(page.locator('h1')).toHaveText(
    'Cable trays, ladders and trunking',
  );
  await expect(page.locator('.breadcrumbs')).toContainText('Cable management');
  await expect(page.locator('.category-header__bases')).toContainText(
    'Sandton, JHB and Hillcrest, KZN',
  );

  // A cropped photograph of the range, not the site-wide logo card.
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    /^https:\/\/[^/]+\/_astro\/.+\.jpg$/,
  );
  await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute(
    'content',
    /cable tray/i,
  );
});

test('crawler files are generated and conversion confirmation stays out of search', async ({
  page,
  request,
}) => {
  const robots = await request.get('/robots.txt');
  expect(robots.ok()).toBe(true);
  expect(await robots.text()).toContain(
    `Sitemap: ${absolute('/sitemap-index.xml')}`,
  );

  const sitemapIndex = await request.get('/sitemap-index.xml');
  expect(sitemapIndex.ok()).toBe(true);
  expect(await sitemapIndex.text()).toContain('sitemap-0.xml');

  const sitemap = await request.get('/sitemap-0.xml');
  const sitemapXml = await sitemap.text();
  expect(sitemap.ok()).toBe(true);
  expect(sitemapXml).toContain(absolute('/products/'));
  expect(sitemapXml).not.toContain('/quote/success/');

  await page.goto('/quote/success/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'noindex, follow',
  );
});

test('video structured data appears only where a video is shown', async ({
  page,
}) => {
  const videoGraphs = async () =>
    page.evaluate(() =>
      [...document.querySelectorAll('script[type="application/ld+json"]')]
        .flatMap((node) => JSON.parse(node.textContent ?? 'null'))
        .filter((entry) => entry?.['@type'] === 'VideoObject'),
    );

  await page.goto('/products/enclosures-and-combiners/');

  const graphs = await videoGraphs();

  // Counted against the rendered players rather than a literal, so adding a clip
  // to the entry does not fail this test — but emitting a graph for a video the
  // page does not show, or showing one it does not describe, still does.
  const players = await page.locator('.video-gallery video').count();
  expect(players).toBeGreaterThan(0);
  expect(graphs).toHaveLength(players);

  // Every graph must describe a clip the page actually shows — a structured-data
  // claim the page does not make is the failure ARCHI §13 guards against. The
  // title is what anchors that now: `uploadDate` used to be checked against a
  // visible <time>, but the caption no longer carries a date, because a fixed
  // "Published <date>" under every clip makes the page look abandoned a few
  // months on. The date survives as `uploadDate` alone, so all this can assert
  // about it is that it is a well-formed ISO 8601 datetime carrying the SAST
  // offset — Search Console faults a date-only value — and the content schema is
  // what enforces the calendar day inside it is a real one.
  const titles = await page.locator('.video-gallery__title').allTextContents();

  for (const graph of graphs) {
    expect(graph.contentUrl).toMatch(
      /^https:\/\/[^/]+\/video\/enclosures-and-combiners\/.+\.mp4$/,
    );
    expect(graph.thumbnailUrl).toMatch(/^https:\/\//);
    expect(titles).toContain(graph.name);
    expect(graph.uploadDate).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+02:00$/,
    );
  }

  // The date is structured data only. If it ever reappears in the caption, that
  // is a decision to re-make deliberately, not a regression to discover on a
  // stale-looking page months later.
  await expect(page.locator('.video-gallery time')).toHaveCount(0);

  // The home-page video was removed; its search metadata must go with it.
  await page.goto('/');
  await expect(page.locator('video')).toHaveCount(0);
  expect(await videoGraphs()).toHaveLength(0);

  // A category with photographs but no video must emit no video graph at all.
  await page.goto('/products/cables/');
  expect(await videoGraphs()).toHaveLength(0);
  await expect(page.locator('.video-gallery')).toHaveCount(0);
});

test('products overview exposes item list structured data', async ({
  page,
}) => {
  await page.goto('/products/');

  const graphs = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents();
  const itemListGraph = graphs
    .map((graph) => JSON.parse(graph))
    .find((item) => item['@type'] === 'ItemList');

  expect(itemListGraph).toBeDefined();
  expect(itemListGraph.itemListElement).toHaveLength(6);
  expect(itemListGraph.itemListElement[0]).toMatchObject({
    position: 1,
    name: 'Cables',
    url: absolute('/products/cables/'),
  });
});
