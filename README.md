# Era-Sure Renewables

**Version 0.12.1** · live at [www.erasuretrading.co.za](https://www.erasuretrading.co.za)

The website of Era-Sure Trading (Pty) Ltd, a supplier of electrical and renewable-energy
equipment. It is a **sales-led supplier site**: its job is to turn trade visitors into
quote requests, calls and WhatsApp messages, not to publish a product database.

It is a static [Astro](https://astro.build) site, hosted on Netlify and rebuilt
automatically whenever this repository's `main` branch changes.

## Editing the site (no coding)

Everyday changes (category text, gallery photos, delivery highlights) are made in
[Pages CMS](https://app.pagescms.org), a web editor that saves straight into this
repository. The one-page guide is
[`docs/handover/Era-Sure-Website-Editing-Cheat-Sheet.pdf`](docs/handover/Era-Sure-Website-Editing-Cheat-Sheet.pdf).

- Sign in to Pages CMS with the GitHub account that owns this repository. The first time,
  it asks to install its GitHub app on the repository.
- Each save is a commit to `main`. Netlify publishes it in about two to three minutes.
- A save the site rejects (a missing photo description, say) fails the Netlify build, and
  **the previous version stays live**. Netlify → Deploys shows the reason.
- What the editor offers is configured in [`.pages.yml`](.pages.yml). Category web
  addresses, videos and stock-photo licence credits are deliberately left out of it; those
  are developer changes. `settings.content.merge: true` keeps them intact when a category
  is saved.

## Accounts and services

| Service               | Used for                                                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| GitHub                | Stores the site and the full history of every change.                                                                          |
| Pages CMS             | The content editor. Holds no data of its own; everything it saves lands in GitHub.                                             |
| Netlify               | Builds and hosts the site, serves the domain, and receives quote-form submissions (Forms → Notifications sets who is emailed). |
| Google Search Console | Search visibility and indexing reports for `www.erasuretrading.co.za`.                                                         |
| Domain registrar      | `erasuretrading.co.za`, which also carries the company email. Renewal is annual.                                               |

## Still waiting on confirmed details

These values in [`src/site.config.ts`](src/site.config.ts) hold the placeholder
`TODO_CLIENT`. The site hides whatever depends on them rather than showing a guess, and a
test fails if a placeholder ever reaches a page:

- Registered company address
- Information officer name and email (POPIA)
- How long quote enquiries are kept, and who deletes them
- Saturday and Sunday hours

Supplying them is a small developer change. The privacy page gains the matching sections
automatically.

---

## For developers

Read [`docs/ARCHI.md`](docs/ARCHI.md) before changing the application: it records the
architecture and the reasons behind its less obvious rules.
[`src/content/README.md`](src/content/README.md) covers the content schemas and the rules
for product data and photographs.

### Prerequisites

- Node.js **24.19.0**, matching [`.nvmrc`](.nvmrc) and Netlify's
  [`NODE_VERSION`](netlify.toml).
- Chromium for Playwright: `npx playwright install chromium`.
- Optional: ffmpeg, only to convert new video with the tools in
  [`scripts/`](scripts/README.md). The build never needs it.

```bash
npm install
npx playwright install chromium
```

### Commands

| Command                | Purpose                                       |
| ---------------------- | --------------------------------------------- |
| `npm run dev`          | Start the Astro development server.           |
| `npm run build`        | Build the static site into `dist/`.           |
| `npm run preview`      | Serve the built `dist/` output locally.       |
| `npm run lint`         | Run ESLint across the repository.             |
| `npm run format`       | Format application files with Prettier.       |
| `npm run format:check` | Check formatting without changing files.      |
| `npm run check`        | Run Astro's TypeScript and Astro diagnostics. |
| `npm test`             | Run Vitest unit tests.                        |
| `npm run test:e2e`     | Run Playwright end-to-end tests in Chromium.  |

### Where things live

| Path                      | Holds                                                                                    |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| `src/content/`            | Category, delivery and product entries (YAML), validated by `src/content.config.ts`.     |
| `src/assets/photography/` | Photographs, one folder per category. Optimised at build time.                           |
| `public/video/`           | Transcoded video, served untransformed.                                                  |
| `src/site.config.ts`      | Business details: contacts, hubs, social links, POPIA facts.                             |
| `src/lib/`                | Testable logic (catalogue, contact, navigation, SEO), with unit tests alongside.         |
| `src/components/`         | Rendering only; pages live in `src/pages/`.                                              |
| `e2e/`                    | Playwright suites: accessibility, conversion path, SEO, placeholder leaks, smoke.        |
| `scripts/`                | One-off media conversion and favicon tools, run by hand. Not build steps.                |
| `netlify.toml`            | Build settings, redirects and security headers (including the Content Security Policy).  |
| `docs/`                   | `ARCHI.md`, the POPIA evidence behind the privacy notice, and the owner's editing guide. |

### Rules that break things silently

- **Never replace a `TODO_CLIENT` placeholder with a plausible-looking value.** An invented
  address or phone number looks correct and costs the business a lead or a POPIA problem.
- **Product specifications come from the client or a manufacturer datasheet, never an
  estimate.** Every product entry is currently a draft with illustrative values, so the
  public catalogue is empty rather than wrong, and `/cables/` stays out of the navigation.
- **Colour pairs are measured, not estimated.** `e2e/accessibility.spec.ts` runs axe on
  every route; add new routes to it. Tokens named `--color-brand-*` are graphic-only: the
  logo teal and lime fail text contrast as supplied.
- **The CSP only exists on Netlify.** `astro preview` ignores `netlify.toml`, so check
  header-sensitive changes on a deploy preview.
