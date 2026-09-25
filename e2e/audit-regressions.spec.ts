import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('videos preserve their proportions under the production security policy', async ({
  page,
}) => {
  const policy = readFileSync('netlify.toml', 'utf8').match(
    /^\s*Content-Security-Policy\s*=\s*"([^"]+)"/m,
  )?.[1];
  expect(policy).toBeTruthy();
  await page.route('**/*', async (route) => {
    if (!route.request().isNavigationRequest()) return route.continue();
    const response = await route.fetch();
    await route.fulfill({
      response,
      headers: { ...response.headers(), 'content-security-policy': policy! },
    });
  });
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', () => {
      document.documentElement.dataset.cspViolation = 'true';
    });
  });
  for (const path of [
    '/products/enclosures-and-combiners/',
    '/products/renewable-energy-equipment/',
  ]) {
    await page.goto(path);
    const videos = page.locator('video');
    expect(await videos.count()).toBeGreaterThan(0);
    for (const video of await videos.all()) {
      await video.scrollIntoViewIfNeeded();
      const dimensions = await video.evaluate((element: HTMLVideoElement) => {
        const box = element.getBoundingClientRect();
        return {
          actual: box.width / box.height,
          expected: element.width / element.height,
        };
      });
      expect(dimensions.actual).toBeCloseTo(dimensions.expected, 2);
    }
    await expect(page.locator('html')).not.toHaveAttribute(
      'data-csp-violation',
      'true',
    );
  }
});

test('mobile menu keeps keyboard focus inside and offers a direct quote route', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  expect(
    await page
      .locator('[data-nav-drawer]')
      .evaluate((element) => getComputedStyle(element).transitionDuration),
  ).toBe('0s');
  const toggle = page.getByRole('button', { name: 'Toggle menu' });
  await toggle.click();
  const menu = page.getByRole('dialog', { name: 'Menu' });
  const close = menu.getByRole('button', { name: 'Close menu' });
  const quote = menu.getByRole('link', { name: 'Request a quote' });
  await expect(close).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(quote).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(toggle).toBeFocused();
  await expect(menu).toHaveCount(0);
  await toggle.click();
  await quote.click();
  await expect(page).toHaveURL(/\/quote\/$/);
});

test('oversized attachments are rejected locally and a smaller replacement recovers', async ({
  page,
}) => {
  await page.goto('/quote/');
  const input = page.locator('#quote-file');
  const error = page.locator('#quote-file-error');
  await input.setInputFiles({
    name: 'oversized-boq.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.alloc(7_500_001),
  });
  await expect(error).toContainText('larger than 7.5 MB');
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  expect(
    await input.evaluate(
      (element: HTMLInputElement) => element.validity.customError,
    ),
  ).toBe(true);
  await input.setInputFiles({
    name: 'boq.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\nAudit fixture only'),
  });
  await expect(error).toBeEmpty();
  await expect(input).not.toHaveAttribute('aria-invalid');
  expect(
    await input.evaluate((element: HTMLInputElement) => element.validity.valid),
  ).toBe(true);
  await input.setInputFiles([]);
  await expect(error).toBeEmpty();
});

test('empty cable specifications stay out of search and useful ranges link together', async ({
  page,
  request,
}) => {
  await page.goto('/cables/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'noindex, follow',
  );
  await page.goto('/products/cables/');
  await expect(page).toHaveTitle(
    'Solar PV & Armoured Cables | Era-Sure Renewables',
  );
  const related = page
    .getByRole('navigation', { name: 'Related product ranges' })
    .getByRole('link');
  await expect(related).toHaveCount(5);
  for (const link of await related.all()) {
    const href = await link.getAttribute('href');
    expect(href).not.toBe('/products/cables/');
    expect((await request.get(href!)).ok()).toBe(true);
  }
});

test('BOQ deep link clears the sticky header', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/quote/#quote-form-heading');
  const heading = page.locator('#quote-form-heading');
  const header = page.locator('.site-header');
  await expect(heading).toBeInViewport();
  const titleBox = await heading.boundingBox();
  const headerBox = await header.boundingBox();
  expect(titleBox!.y).toBeGreaterThanOrEqual(headerBox!.y + headerBox!.height);
});
