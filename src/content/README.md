# Catalogue content guide

Product, category and delivery-highlight files in this directory are YAML entries for the
`products`, `categories` and `deliveries` collections. Product specifications are
technical and safety-sensitive: **specification values must come from the client or a
manufacturer datasheet, never be estimated**.

Every seed entry in this repository is illustrative and has `status: draft`. Replace its
values with confirmed information before publishing it.

## Status and publishing

The required `status` field controls visibility:

- `draft` entries are included in local builds, development, and deploy previews so they
  can be reviewed.
- `published` entries are eligible for the production catalogue.
- Draft entries are excluded from production builds. Do not change a status to `published`
  until every specification has been checked against client-supplied or
  manufacturer-datasheet data.

Delivery highlights add a second publication safeguard: `publicationPermission` must be
`confirmed` before an entry with `status: published` can pass validation. Confirmation
must cover both the photographs and the project details supplied for the entry.

## Deliveries collection

Delivery files live in `src/content/deliveries/`. Keep each entry and its photographs in
one folder so the image paths remain reviewable. `_example.yaml` and its black SVG
placeholders are a draft-only layout preview; copy its field shape, but replace all example content and images
before publishing.

| Field                   | Format                   | Notes                                                                         |
| ----------------------- | ------------------------ | ----------------------------------------------------------------------------- |
| `slug`                  | Lowercase kebab-case     | Stable route identity for `/deliveries/[slug]/`.                              |
| `title`                 | Non-empty text           | Describe supply or delivery, never claim Era-Sure installed the equipment.    |
| `order`                 | Positive unique integer  | Editorial order on the listing page and homepage.                             |
| `status`                | `draft` or `published`   | Drafts stay out of the production build.                                      |
| `featured`              | Boolean                  | Featured entries are eligible for the homepage preview.                       |
| `summary`               | Non-empty text           | One concise, factual account of what Era-Sure sourced or delivered.           |
| `location`              | Non-empty text           | Use a province or broad area, not a private site address.                     |
| `projectType`           | Optional text            | General context such as `Commercial solar supply`; do not imply installation. |
| `deliveryPeriod`        | Optional text            | A client-approved month, year or broad period.                                |
| `suppliedItems`         | One or more text items   | Equipment Era-Sure actually supplied. Do not list installed scope.            |
| `images`                | 1–8 local images         | Every image requires meaningful alt text; captions are optional.              |
| `socialUrl`             | Optional HTTPS URL       | Link to the original public post rather than embedding a live feed.           |
| `photoCredit`           | Optional text            | Name a photographer or organisation only when the credit is approved.         |
| `publicationPermission` | `pending` or `confirmed` | Published entries require `confirmed`; there is no bypass.                    |

Public delivery copy should describe confirmed equipment and logistics facts without
adding installation claims. Keep titles, summaries, captions and alt text factual and
within the documented project record.

## Categories collection

Category files live in `src/content/categories/`. They provide the stable, high-level
catalogue view rather than a complete product list.

| Field             | Format                                                              | Notes                                                                                                                              |
| ----------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `slug`            | Lowercase kebab-case                                                | Stable id, never derived from the filename. Changing it breaks the route identity.                                                 |
| `name`            | Non-empty display text                                              | Category name used in headings and cards.                                                                                          |
| `order`           | Positive integer                                                    | Must be unique across the collection. `validateCategories` enforces this after collection loading because Zod cannot see siblings. |
| `status`          | `draft` or `published`                                              | Required; there is no default.                                                                                                     |
| `summary`         | Non-empty one-line text                                             | Used on the overview card and as the meta description.                                                                             |
| `intro`           | Non-empty text                                                      | Opening paragraph for the category page.                                                                                           |
| `sourceItems`     | List of at least one non-empty text value                           | The items Era-Sure can source in this category.                                                                                    |
| `typicalVariants` | Optional list of non-empty text values                              | Include only when the client supplied distinct variant detail; never restate `sourceItems`.                                        |
| `brands`          | Optional list of names                                              | Names only. Do not add logo fields or image references.                                                                            |
| `relatedRoute`    | Optional string                                                     | Route to related publishable content.                                                                                              |
| `seoTitle`        | Optional string                                                     | Optional page title override.                                                                                                      |
| `cardImage`       | Optional image reference                                            | The photograph on the category card. Omitted, the card falls back to its decorative category icon.                                 |
| `galleryHeading`  | Optional string                                                     | Heading above the gallery. See the wording rule below.                                                                             |
| `galleryIntro`    | Optional string                                                     | Lead paragraph above the gallery. See the wording rule below.                                                                      |
| `gallery`         | Optional list of 1-30 `{ src, alt, caption?, provenance, credit? }` | Photographs for the category page. `alt` and `provenance` are required; see the provenance rule below.                             |
| `videos`          | Optional list of 1-6 video entries                                  | See _Photographs and video_ below. Each needs `src`, `poster`, `title`, `description` and `publishedOn`.                           |

`validateCategories` also asserts unique slugs after the collection has been loaded.
Zod validates one entry at a time and cannot see sibling entries, so collection-wide
uniqueness is deliberately not a schema rule. Omit optional fields when the information
is not confirmed. Do not invent detail or repeat `sourceItems` to fill `typicalVariants`.

### Photographs and video

**Do not drop client files straight into `src/assets/`.** They arrive as HEIC and HEVC,
which the build cannot read, and they carry GPS coordinates. Run
`scripts/convert-client-photos.ps1` and `scripts/convert-client-videos.ps1` first — see
[`scripts/README.md`](../../scripts/README.md).

Image paths use the `@/assets/photography/…` alias. Photographs and video posters go
through the build's image pipeline; **video files themselves live in `public/video/`**,
because the pipeline does not process video and a video needs a stable, untransformed URL.
The schema fails the build if a `videos[].src` does not start with `/video/` or names a file
that is not there.

The gallery cap is **30 photographs**. It is a payload guard, not a taste judgement: each
thumbnail adds roughly 600 bytes of `srcset` markup to the page. Beyond twelve, the gallery
collapses behind a "Show all" button.

Every photograph needs **`alt` describing what is in it**. Captions are optional and appear
only in the enlarged view.

### `provenance` and `credit` — required on every photograph

Every gallery photograph must say where it came from. There is no default, and the build
fails until you set it:

| `provenance`   | Means                         | `credit`                                        |
| -------------- | ----------------------------- | ----------------------------------------------- |
| `client-owned` | Era-Sure's own photograph     | **Must be omitted.** A credit here is rejected. |
| `third-party`  | Licensed or stock photography | **Required**, with every field below.           |

**Do not guess this field.** Marking a photograph `client-owned` makes it eligible for the
home-page showcase band, which states that Era-Sure supplied the equipment pictured. A
licensed stock photograph marked `client-owned` therefore publishes a false supply claim,
and nothing in the build will object — the schema can check that you answered, not that you
answered truthfully. If you do not know, ask before committing.

A `credit` carries `creator`, `title`, `sourceUrl`, `license`, `licenseUrl`, and
`modification` where the image was cropped or altered. All but `modification` are required,
because the CC BY and BY-SA deeds ask for all of them and an attribution missing one is not
an attribution. **Copy the values** from
[`THIRD_PARTY_IMAGES.md`](../assets/photography/THIRD_PARTY_IMAGES.md); never paraphrase a
licence name. Credits render beneath the gallery on the category page, as plain server-side
HTML, so they are present whether or not JavaScript runs.

`galleryHeading` and `galleryIntro` exist because the claim differs by category. Where the
gallery is Era-Sure's own work, say so. Where it is licensed stock photography, the intro
**must not imply Era-Sure supplied what is pictured** — the four stock categories say so
explicitly. Omit both fields and the wording falls back to a neutral default that claims
neither.

**Published clips are silent, and silent in the file rather than in the player.**
`convert-client-videos.ps1` passes `-an`, so the MP4 carries no audio track at all. The
clips are filmed on a working site and their soundtrack is whatever was being said near the
phone — bystanders who never agreed to be published, sometimes a customer or a price. A
`muted` player hides that; it does not stop anyone who downloads the file from hearing it.
The player sets `muted` as well, but only as a guard for a clip that reached the site some
other way. Never publish a clip with a track on it.

`publishedOn` is the date the video went onto this site, in `YYYY-MM-DD`. **Nothing on the
page shows it** — since v0.12.1 it is emitted only as the `VideoObject` `uploadDate` in the
page's structured data, because a fixed "Published \<date\>" under every clip makes the page
look abandoned a few months later. It is still required, and still has to be a real date
someone chose rather than a build timestamp: search engines read it even though visitors
do not. Write the plain day; the schema adds midnight SAST to it, because Google rejects an
`uploadDate` that carries no time and no timezone.

**Before adding any client photograph or clip**, check it at full resolution for number
plates, delivery documents, serial numbers, addresses and recognisable people. Look for
**legible text belonging to someone else** too — a v0.12.1 photograph had another company's
phone number and email on a vehicle in the corner of the frame, on a vehicle with no plate
in shot. Anything showing an identifiable person waits for that person's consent, and waits
**outside the repository**: do not commit the file and reference it later, because an
unreferenced file in git is still published.

### Category copy constraints

These constraints come from questionnaire boxes the client left **UNTICKED**. They are
claims policy, not style preferences:

- Never describe Era-Sure as a distributor, wholesaler, stockist, retail supplier or importer.
- Do not claim 'technical product guidance'. Recommendations are limited to cable and
  switchgear sizing; never claim system design or sizing.
- Do not include stock, availability, lead-time or price signals.
- Installation, site assessment and commissioning belong to Hallmark Energy and are never
  offered directly by Era-Sure.
- Do not make standards or certification claims because no certificates or test reports
  were supplied.
- Brand names are text only. Do not add logos because display permission has never been
  given.

## Identity and routing fields

| Field      | Format                                                              | Notes                                                                                                                          |
| ---------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `slug`     | Lowercase kebab-case, for example `solar-pv-cable-4mm2-single-core` | Permanent once published. Changing it breaks an indexed URL and requires a redirect. It is the URL identity, not the filename. |
| `name`     | Non-empty display text                                              | Product name used in headings and page titles.                                                                                 |
| `category` | `cables`                                                            | This release accepts cables only.                                                                                              |
| `status`   | `draft` or `published`                                              | Required; there is no safe default.                                                                                            |
| `summary`  | Non-empty one-line text                                             | Short product description for the listing and metadata.                                                                        |

## Cable specifications

| Field                  | Format                                       | Example or rule                                                                                                             |
| ---------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `conductorMaterial`    | `copper`, `tinned-copper`, or `aluminium`    | Use the enum value exactly.                                                                                                 |
| `crossSectionMm2`      | Positive number, in mm²                      | Enter `4`, not `4 mm²` or `"4 mm²"`. The field name supplies the unit.                                                      |
| `coreCount`            | Positive whole number                        | Enter `1` or `2`, never a fraction or a text label.                                                                         |
| `voltageRating`        | Non-empty display text                       | Compound ratings are allowed, for example `1.5/1.5 kV DC`.                                                                  |
| `currentRatingAmps`    | Optional positive number, in amps            | Enter `55`, not `55 A`.                                                                                                     |
| `temperatureMinC`      | Optional number, in °C                       | Must be supplied together with `temperatureMaxC`.                                                                           |
| `temperatureMaxC`      | Optional number, in °C                       | Must be supplied together with `temperatureMinC`, and the minimum cannot exceed the maximum.                                |
| `insulationMaterial`   | Optional non-empty text                      | Material name only; do not leave a blank string.                                                                            |
| `sheathMaterial`       | Optional non-empty text                      | Material name only; do not leave a blank string.                                                                            |
| `uvResistant`          | Optional boolean                             | Use `true` or `false`, not `yes` or `no`.                                                                                   |
| `colours`              | Optional list of non-empty text values       | For example `black` and `red`.                                                                                              |
| `lengthsM`             | Optional list of positive numbers, in metres | Enter `100`, not `100 m`.                                                                                                   |
| `standards`            | Optional list of text values                 | A standards entry is a compliance **claim** and requires supporting documentation. Do not add one because it seems likely.  |
| `datasheetPath`        | Optional path beginning `/datasheets/`       | The corresponding file must exist under `public/datasheets/`. Do not add this field until the supplied document is present. |
| `stockNote`            | Optional non-empty text                      | Confirmed availability or lead-time note; do not use an empty string.                                                       |
| `minimumOrderQuantity` | Optional non-empty text                      | Keep the unit or packaging in the text, for example `1 drum` or `100 m`.                                                    |

Optional fields should be omitted when the information is not confirmed. Do not enter an
empty string, a dash, or a guessed value to fill a gap. The schema rejects blank text and
invalid numbers, and the catalogue omits absent optional fields from the specification
table.
