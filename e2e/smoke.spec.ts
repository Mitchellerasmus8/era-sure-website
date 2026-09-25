import { expect, test } from '@playwright/test';

test('the home page responds with a real title and one heading', async ({
  page,
}) => {
  const response = await page.goto('/');

  expect(response?.ok()).toBe(true);
  await expect(page).toHaveTitle(/\S+/);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(
    page.getByRole('img', {
      name: 'Era-Sure Renewables — The future of energy',
    }),
  ).toBeVisible();
});

test('the unapproved delivery placeholder is published nowhere', async ({
  page,
  request,
}) => {
  await page.goto('/');

  // The only delivery entry is black placeholder artwork captioned
  // "development placeholder only" — a fabricated claim about work done for a
  // customer. `filterPublishableDeliveries` withholds it regardless of build
  // context, so none of this may render on any URL.
  await expect(
    page.locator('[data-delivery-slug="example-supply-delivery"]'),
  ).toHaveCount(0);
  await expect(page.getByText('Recent deliveries')).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'Supply and delivery highlights' }),
  ).toHaveCount(0);

  // The detail route is not generated at all, rather than generated and hidden.
  const detail = await request.get('/deliveries/example-supply-delivery/');
  expect(detail.status()).toBe(404);

  // The index route survives as a redirect stub home, so an existing inbound
  // link lands somewhere useful instead of on a dead end. Asserted against the
  // served HTML rather than by driving the browser, because Astro's static
  // redirect is a 2-second meta refresh that `page.goto` resolves ahead of.
  const index = await request.get('/deliveries/');
  expect(index.status()).toBe(200);

  const indexHtml = await index.text();
  expect(indexHtml).toContain('url=/');
  expect(indexHtml).toContain('name="robots" content="noindex"');
  expect(indexHtml).not.toContain('example-supply-delivery');
});

test('the header exposes the confirmed social profiles', async ({ page }) => {
  await page.goto('/');

  const socialMedia = page.getByRole('navigation', { name: 'Social media' });
  const instagram = socialMedia.getByRole('link', {
    name: 'Era-Sure Renewables on Instagram',
  });
  const linkedin = socialMedia.getByRole('link', {
    name: 'Era-Sure Renewables on LinkedIn',
  });
  const facebook = socialMedia.getByRole('link', {
    name: 'Era-Sure Renewables on Facebook',
  });

  await expect(instagram).toHaveAttribute(
    'href',
    'https://www.instagram.com/erasure.renewables/',
  );
  await expect(linkedin).toHaveAttribute(
    'href',
    'https://www.linkedin.com/company/era-sure-renewables/',
  );
  await expect(facebook).toHaveAttribute(
    'href',
    'https://www.facebook.com/erasure.renewables',
  );
  await expect(instagram).toHaveAttribute('target', '_blank');
  await expect(linkedin).toHaveAttribute('target', '_blank');
  await expect(facebook).toHaveAttribute('target', '_blank');
});

/**
 * Guards failures the rest of the suite cannot see. Every one of these shipped
 * while the markup, the hrefs, the accessible names and the axe sweep stayed
 * green — only looking at the page revealed them:
 *
 * 1. Moving the `<svg>` marks into `SocialIcon.astro` detached the scoped
 *    `width`/`height` rule that had lived in `Header.astro`. Glyphs rendered at
 *    30px inside a 32px control.
 * 2. Correcting their *relative* sizes against the smallest of the three, and
 *    leaving the overall scale alone, left all three at 11px.
 * 3. Applying that correction as a CSS `width` gave two marks a fractional box,
 *    which the renderer snapped 0.45px up and left of the third.
 *
 * So this asserts three things, in the terms a visitor sees them: painted
 * artwork rather than the `<svg>` box, since each mark reserves a different
 * amount of internal padding; equal box sizes, since unequal ones are what
 * broke centring; and whole-pixel offsets inside the control.
 */
test('the header social marks are sized, matched and centred', async ({
  page,
}) => {
  await page.goto('/');

  const measurements = await page
    .locator('.header-social__link')
    .evaluateAll((links) =>
      links.map((link) => {
        const svg = link.querySelector('svg')!;
        const viewBox = svg.getAttribute('viewBox')!.split(/\s+/).map(Number);
        const bounds = svg.getBBox();
        // getBBox() excludes stroke, which is most of the Instagram mark.
        const stroke =
          svg.getAttribute('fill') === 'none'
            ? parseFloat(getComputedStyle(svg).strokeWidth)
            : 0;
        const units = Math.max(bounds.width + stroke, bounds.height + stroke);
        const scale = svg.getBoundingClientRect().width / viewBox[2];

        const box = svg.getBoundingClientRect();
        const control = link.getBoundingClientRect();

        return {
          icon: svg.getAttribute('class')!.replace(/.*--/, ''),
          artwork: units * scale,
          box: box.width,
          control: control.width,
          // How far the mark's box sits from the centre of its control.
          offset: {
            x: box.left + box.width / 2 - (control.left + control.width / 2),
            y: box.top + box.height / 2 - (control.top + control.height / 2),
          },
        };
      }),
    );

  expect(measurements).toHaveLength(3);

  for (const { artwork, control, box, offset } of measurements) {
    expect(control).toBeCloseTo(32, 0);
    // Roughly half the control: the band either side is what separates "an icon
    // in a button" from failures 1 and 2 above.
    expect(artwork).toBeGreaterThan(14);
    expect(artwork).toBeLessThan(19);
    // Whole-pixel box, so centring it cannot land on a sub-pixel boundary.
    expect(box % 1).toBe(0);
    expect(offset.x).toBeCloseTo(0, 1);
    expect(offset.y).toBeCloseTo(0, 1);
  }

  // One box size for all three — differing sizes is failure 3.
  const boxes = measurements.map(({ box }) => box);
  expect(new Set(boxes).size).toBe(1);

  // Instagram and LinkedIn match; Facebook is deliberately larger, because a
  // disc reads smaller than the squarer marks at equal geometric size.
  const artworkOf = (name: string) =>
    measurements.find(({ icon }) => icon === name)!.artwork;

  expect(artworkOf('instagram')).toBeCloseTo(artworkOf('linkedin'), 1);
  expect(artworkOf('facebook') / artworkOf('instagram')).toBeCloseTo(1.08, 2);
});
