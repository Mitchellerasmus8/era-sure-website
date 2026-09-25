/**
 * Rasterises the brand mark into the icon formats that SVG alone does not cover.
 *
 * Run by hand, like everything else in this directory; the output is committed
 * and the build never invokes this. Unlike its neighbours it is Node rather
 * than PowerShell, because `sharp` ships with Astro and reads SVG perfectly
 * well — the HEIC/HEVC problems that forced those scripts out to WIC and
 * ffmpeg do not apply here.
 *
 *     node scripts/generate-favicons.mjs
 *
 * Why each output exists:
 *
 *   favicon.ico          The root path every favicon consumer probes when it
 *                        ignores the markup: Google's favicon crawler, older
 *                        browsers, link-preview and chat-unfurl bots. Google
 *                        documents SVG as supported, but /favicon.ico is the
 *                        fallback, and a 404 there is the one real gap.
 *   apple-touch-icon.png iOS home-screen shortcut. Without it iOS saves a
 *                        screenshot of the page instead of the mark.
 *   icon-192 / icon-512  Referenced by site.webmanifest for Android.
 *
 * The SVG stays the primary icon for browsers that prefer it — it is sharp at
 * every size and a fifth of a kilobyte.
 */
import { Buffer } from 'node:buffer';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = new URL('../', import.meta.url);
const source = new URL('src/assets/brand/favicon.svg', root);
// The same mark is committed twice: `src/assets/brand/` is the source of truth
// and is what the build imports, `public/` is the copy served at /favicon.svg.
// If they ever drift, every raster below would be generated from the wrong one.
const servedCopy = new URL('public/favicon.svg', root);

/** The mark's own viewBox. Density is scaled off it so nothing renders blurred. */
const SOURCE_SIZE = 64;
/** The dark of the mark's backing plate, from the SVG's own `rect`. */
const BRAND_DARK = '#0B2530';
/** Sizes packed into favicon.ico. 48 is what Google asks for; 16 and 32 are the tab. */
const ICO_SIZES = [16, 32, 48];

/**
 * `flatten` fills the rounded corners with the plate colour, giving a
 * full-bleed square. Both iOS and Android apply their own mask, and an icon
 * that arrives pre-rounded gets rounded twice; transparency is kept only for
 * the .ico, where the rounded badge is the intended shape.
 */
async function render(size, { flatten = false } = {}) {
  let pipeline = sharp(await readFile(source), {
    density: Math.ceil((72 * size) / SOURCE_SIZE),
  }).resize(size, size);

  if (flatten) pipeline = pipeline.flatten({ background: BRAND_DARK });

  return pipeline.png({ compressionLevel: 9 }).toBuffer();
}

/**
 * Packs PNGs into an ICO container. `sharp` cannot write .ico, and the format
 * is a 6-byte header plus one 16-byte directory entry per image, so the
 * alternative was a dependency for 30 lines of arithmetic. PNG-compressed
 * entries have been read by Windows since Vista and by every browser in use.
 */
function packIco(images) {
  const HEADER = 6;
  const ENTRY = 16;

  const header = Buffer.alloc(HEADER);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = icon
  header.writeUInt16LE(images.length, 4);

  let offset = HEADER + ENTRY * images.length;

  const entries = images.map(({ size, data }) => {
    const entry = Buffer.alloc(ENTRY);
    entry.writeUInt8(size === 256 ? 0 : size, 0); // 0 encodes 256
    entry.writeUInt8(size === 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2); // palette size; 0 for truecolour
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });

  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

async function main() {
  const [master, served] = await Promise.all([
    readFile(source, 'utf8'),
    readFile(servedCopy, 'utf8'),
  ]);

  if (master !== served) {
    throw new Error(
      `${fileURLToPath(source)} and ${fileURLToPath(servedCopy)} have drifted. ` +
        'Reconcile them before generating, or the rasters will not match the served SVG.',
    );
  }

  const icoImages = await Promise.all(
    ICO_SIZES.map(async (size) => ({ size, data: await render(size) })),
  );

  const outputs = [
    ['public/favicon.ico', packIco(icoImages)],
    ['public/apple-touch-icon.png', await render(180, { flatten: true })],
    ['public/icon-192.png', await render(192, { flatten: true })],
    ['public/icon-512.png', await render(512, { flatten: true })],
  ];

  for (const [path, data] of outputs) {
    await writeFile(new URL(path, root), data);
    console.log(`${path}  ${(data.length / 1024).toFixed(1)} kB`);
  }
}

await main();
