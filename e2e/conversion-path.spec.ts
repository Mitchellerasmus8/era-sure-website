import { expect, test } from '@playwright/test';

import { personalDataFields } from '../src/lib/enquiry/personal-data';

test('product cards use the questionnaire categories in a three-by-two grid', async ({
  page,
}) => {
  await page.goto('/products/');

  const cards = page.locator('[data-category-slug]');
  await expect(cards).toHaveCount(6);
  const slugs = await cards.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute('data-category-slug')),
  );
  expect(slugs).toEqual([
    'cables',
    'cable-management',
    'switchgear-and-components',
    'enclosures-and-combiners',
    'electrical-consumables',
    'renewable-energy-equipment',
  ]);

  const iconSources = await cards
    .locator('img')
    .evaluateAll((images) => images.map((image) => image.getAttribute('src')));
  expect(iconSources).toHaveLength(6);
  expect(new Set(iconSources).size).toBe(6);

  const cardPositions = await cards.evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { left: Math.round(rect.left), top: Math.round(rect.top) };
    }),
  );
  expect(new Set(cardPositions.map(({ left }) => left)).size).toBe(3);
  expect(new Set(cardPositions.map(({ top }) => top)).size).toBe(2);
});

test('a category CTA reaches the quote form', async ({ page }) => {
  await page.goto('/products/renewable-energy-equipment/');

  const cta = page.getByRole('link', { name: 'Request a quote' }).first();
  await expect(cta).toHaveAttribute('href', '/quote/');

  await cta.click();

  await expect(page).toHaveURL(/\/quote\/$/);
  await expect(
    page.getByRole('heading', {
      name: 'Request a quotation',
      level: 1,
    }),
  ).toBeVisible();

  const form = page.locator('form[name="quote-request"]');
  await expect(form).toHaveAttribute('method', 'POST');
  await expect(form).toHaveAttribute('action', '/quote/success/');
  await expect(page.getByLabel('Name')).toBeVisible();
  await expect(page.getByLabel('Company')).toBeVisible();
  await expect(page.getByLabel('Phone or WhatsApp number')).toBeVisible();
  await expect(page.getByLabel('Products or part numbers')).toBeVisible();
  await expect(
    page.getByLabel('Attach a bill of quantities or product list (optional)'),
  ).toHaveAttribute('type', 'file');

  const actualFields = await form
    .locator('input, select, textarea')
    .evaluateAll((controls) =>
      controls
        .filter(
          (control) =>
            control.getAttribute('name') !== 'form-name' &&
            control.getAttribute('name') !== 'website',
        )
        .map((control) => {
          const accept = control.getAttribute('accept');

          return {
            name: control.getAttribute('name') ?? '',
            required: (control as HTMLInputElement).required,
            ...(accept !== null ? { accept } : {}),
          };
        }),
    );

  expect(actualFields).toEqual(
    personalDataFields.map(({ name, required, accept }) => ({
      name,
      required,
      ...(accept !== undefined ? { accept } : {}),
    })),
  );

  const collectionStatement = form.locator('.quote-form__footer');
  await expect(
    collectionStatement.getByRole('link', { name: 'privacy notice' }),
  ).toHaveAttribute('href', '/privacy/');
});

test('the contact page exposes distinct WhatsApp and phone links', async ({
  page,
}) => {
  await page.goto('/contact/');

  const whatsappLinks = page.getByRole('link', { name: /^WhatsApp / });
  await expect(whatsappLinks).toHaveCount(2);
  await expect(
    page.getByRole('link', { name: 'WhatsApp +27 82 870 5847' }),
  ).toHaveCount(1);
  await expect(
    page.getByRole('link', { name: 'WhatsApp +27 71 637 4188' }),
  ).toHaveCount(1);

  const whatsappHrefs = await whatsappLinks.evaluateAll((links) =>
    links.map((link) => link.getAttribute('href') ?? ''),
  );

  expect(whatsappHrefs).toEqual(
    expect.arrayContaining([
      expect.stringContaining('27828705847'),
      expect.stringContaining('27716374188'),
    ]),
  );
  for (const href of whatsappHrefs) {
    expect(href).toMatch(/^https:\/\/wa\.me\/\d+/);
    expect(href).not.toContain('+');
  }

  const phoneLinks = page.getByRole('link', { name: /^Call / });
  await expect(phoneLinks).toHaveCount(2);
  await expect(
    page.getByRole('link', { name: 'Call +27 82 870 5847' }),
  ).toHaveCount(1);
  await expect(
    page.getByRole('link', { name: 'Call +27 71 637 4188' }),
  ).toHaveCount(1);

  const telHrefs = await phoneLinks.evaluateAll((links) =>
    links.map((link) => link.getAttribute('href') ?? ''),
  );

  expect(telHrefs).toEqual(
    expect.arrayContaining(['tel:+27828705847', 'tel:+27716374188']),
  );
});

test('the floating WhatsApp shortcut opens the Era-Sure chat', async ({
  page,
}) => {
  await page.goto('/products/');

  const shortcut = page.getByRole('link', {
    name: 'Get a quote on WhatsApp',
  });

  await expect(shortcut).toBeVisible();
  await expect(shortcut).toHaveAttribute('target', '_blank');
  await expect(shortcut).toHaveAttribute(
    'href',
    /^https:\/\/wa\.me\/27828705847\?text=/,
  );
});

// The floating button is the only enquiry route that follows the reader onto
// every page, so its label is a permanent fixture if it is one at all. It is
// revealed on pointer and keyboard rather than pinned open: at 375px a pinned
// pill covers roughly 60% of the viewport, over the catalogue copy it exists to
// support.
test('the floating WhatsApp button reveals its label on hover and keyboard focus', async ({
  page,
}) => {
  await page.goto('/');

  const button = page.getByRole('link', { name: 'Get a quote on WhatsApp' });
  const label = page.locator('.floating-whatsapp__label');

  await expect(button).toBeVisible();
  await expect(label).toBeHidden();

  await button.hover();
  await expect(label).toBeVisible();
  await expect(label).toHaveCSS('opacity', '1');

  await page.mouse.move(0, 0);
  await expect(label).toBeHidden();

  // Focus has to reach the label too, and it has to be real keyboard focus:
  // `:focus-visible` deliberately ignores a programmatic `.focus()`, so the
  // round trip through Shift+Tab and Tab is what makes this assertion mean
  // anything.
  await button.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(button).toBeFocused();
  await expect(label).toBeVisible();

  // The words are already the link's accessible name, so the visible copy is
  // decorative — announcing it a second time is the bug this guards.
  await expect(label).toHaveAttribute('aria-hidden', 'true');
});

test('the floating WhatsApp button stays a bare circle on phones', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');

  const button = page.getByRole('link', { name: 'Get a quote on WhatsApp' });
  await expect(button).toBeVisible();
  await expect(page.locator('.floating-whatsapp__label')).toBeHidden();

  // An in-flow label would widen the anchor even while invisible and swallow
  // taps meant for the page beneath it. The hit area is the circle, nothing more.
  const box = await button.boundingBox();
  expect(box).not.toBeNull();
  expect(Math.round(box!.width)).toBe(60);
  expect(Math.round(box!.height)).toBe(60);
});
