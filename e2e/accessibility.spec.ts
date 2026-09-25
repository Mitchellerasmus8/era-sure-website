import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// All four tags, deliberately: the wcag21* tags cover only rules *introduced*
// in 2.1, so scanning with those alone would skip the inherited 2.0 rules —
// including colour contrast and name/role/value.
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const NOT_FOUND_PATH = '/phase-three-missing-route/';

test.use({ viewport: { width: 375, height: 720 } });

for (const path of [
  '/',
  '/cables/',
  '/products/',
  '/about/',
  '/contact/',
  '/privacy/',
  '/quote/',
  '/quote/success/',
  '/products/cables/',
  '/products/cable-management/',
  '/products/switchgear-and-components/',
  '/products/enclosures-and-combiners/',
  '/products/electrical-consumables/',
  '/products/renewable-energy-equipment/',
  NOT_FOUND_PATH,
]) {
  test(`has no accessibility violations at ${path}`, async ({ page }) => {
    await page.goto(path);

    const results = await new AxeBuilder({ page })
      .withTags(WCAG_TAGS)
      .analyze();

    expect(results.violations).toEqual([]);
  });
}

test('supports the keyboard shell path on mobile', async ({ page }) => {
  await page.goto('/');

  const skipLink = page.getByRole('link', { name: 'Skip to content' });
  const main = page.locator('main#main');
  const toggle = page.locator('[data-nav-toggle]');

  await page.keyboard.press('Tab');
  await expect(skipLink).toBeFocused();

  await skipLink.press('Enter');
  await expect(main).toBeFocused();

  await toggle.focus();
  await toggle.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('.site-header__cta')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Close menu' })).toBeFocused();

  const primaryNavigation = page.getByRole('navigation', {
    name: 'Primary navigation',
  });
  const navigationLinks = primaryNavigation.getByRole('link');
  await expect(navigationLinks).toHaveCount(5);

  for (const link of await navigationLinks.all()) {
    const box = await link.boundingBox();
    expect(box?.width).toBeGreaterThan(220);
    expect(box?.height).toBeGreaterThanOrEqual(48);
  }

  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toBeFocused();

  const footerNavigation = page.getByRole('navigation', {
    name: 'Quick links',
  });
  await expect(footerNavigation.getByRole('link')).toHaveCount(5);
  await expect(
    footerNavigation.getByRole('link', { name: 'Products' }),
  ).toHaveAttribute('href', '/products/');
  await expect(
    footerNavigation.getByRole('link', { name: 'Request a quote' }),
  ).toHaveAttribute('href', '/quote/');
});

// The lightbox only exists in the DOM as a closed <dialog>, so the route scans
// above never see its open state. Scanned separately, on the largest gallery.
test('has no accessibility violations with the gallery lightbox open', async ({
  page,
}) => {
  await page.goto('/products/cables/');

  await page.locator('[data-gallery-trigger]').first().click();
  await expect(page.locator('[data-gallery-lightbox]')).toHaveAttribute('open');

  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

  expect(results.violations).toEqual([]);
});

test('supports the gallery keyboard path', async ({ page }) => {
  await page.goto('/products/cables/');

  const grid = page.locator('[data-gallery-grid]');
  const triggers = grid.locator('[data-gallery-trigger]');
  const disclosure = page.locator('[data-gallery-disclosure]');
  const lightbox = page.locator('[data-gallery-lightbox]');
  const counter = page.locator('[data-gallery-counter]');

  // Collapsed by default once the script has run, with everything beyond the
  // threshold hidden behind a button that names the full count.
  await expect(disclosure).toBeVisible();
  await expect(disclosure).toHaveAttribute('aria-expanded', 'false');
  const total = await triggers.count();
  await expect(triggers.nth(total - 1)).toBeHidden();

  await disclosure.press('Enter');
  await expect(disclosure).toHaveAttribute('aria-expanded', 'true');
  await expect(triggers.nth(total - 1)).toBeVisible();

  // Opening from the keyboard, navigating, and returning focus to the thumbnail
  // that opened it — the part a mouse-only test would never exercise.
  const third = triggers.nth(2);
  await third.focus();
  await third.press('Enter');
  await expect(lightbox).toHaveAttribute('open');
  await expect(counter).toHaveText(`3 of ${total}`);

  await page.keyboard.press('ArrowRight');
  await expect(counter).toHaveText(`4 of ${total}`);

  await page.keyboard.press('ArrowLeft');
  await expect(counter).toHaveText(`3 of ${total}`);

  await page.keyboard.press('Escape');
  await expect(lightbox).not.toHaveAttribute('open');
  await expect(third).toBeFocused();
});

// Without JavaScript every photograph must be present and every thumbnail must
// still lead somewhere. A gallery that collapses by default in CSS would hide
// most of the client's photographs from a visitor whose script never ran.
test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('shows every photograph as a working link', async ({ page }) => {
    await page.goto('/products/cables/');

    const triggers = page.locator('[data-gallery-trigger]');
    const total = await triggers.count();

    expect(total).toBeGreaterThan(12);
    await expect(triggers.nth(total - 1)).toBeVisible();
    await expect(page.locator('[data-gallery-disclosure]')).toBeHidden();

    const href = await triggers.first().getAttribute('href');
    expect(href).toBeTruthy();

    const response = await page.request.get(href!);
    expect(response.status()).toBe(200);
  });

  test('shows the supplied consumables photos without obsolete stock credits', async ({
    page,
  }) => {
    await page.goto('/products/electrical-consumables/');

    await expect(
      page.getByRole('heading', {
        name: 'Electrical consumables we have supplied',
      }),
    ).toBeVisible();
    const photos = page.locator('[data-gallery-trigger]');
    await expect(photos).toHaveCount(7);
    for (const photo of await photos.all()) {
      await expect(photo).toBeVisible();
      const href = await photo.getAttribute('href');
      expect(href).toBeTruthy();
      expect((await page.request.get(href!)).ok()).toBe(true);
    }
    await expect(page.locator('[data-photo-credits]')).toHaveCount(0);
  });
});
