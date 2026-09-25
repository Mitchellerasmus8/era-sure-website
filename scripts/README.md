# Authoring scripts

One-off asset tools, run by hand — media conversion when the client sends new material,
and icon generation when the brand mark changes.

**These are not build steps.** Nothing in `package.json`, `netlify.toml` or the Netlify
build invokes them, and the site builds on a machine that has never run them. What they
produce — the JPEGs under `src/assets/photography/` and the MP4s under `public/video/` — is
committed, and that committed output is what the build consumes.

## Why they exist

The client sends photographs a category at a time, straight off an iPhone. Those files
cannot go into the site as they are:

- **HEIC does not decode.** The project's bundled `sharp` rejects every client HEIC with a
  libheif security-limit error: the iref box holds 48 references against a limit of 16. So
  Astro's image pipeline cannot read them at all. Windows' own imaging stack (WIC) decodes
  them fine — which is why the photo script is PowerShell.
- **HEVC does not play.** The client's videos are `hvc1` in a QuickTime container. Safari
  plays them; stock Chrome, Edge and Firefox do not.
- **Both carry EXIF, including GPS.** Astro strips metadata when it re-encodes, so published
  images are clean either way — but these intermediates are _committed_, and git history is
  forever. Stripping happens at conversion, before anything is staged.

The client media drop itself (`Website pictures_/`) is gitignored. It is the input, not
project source.

## `convert-client-photos.ps1`

```powershell
./scripts/convert-client-photos.ps1 `
    -Source 'Website pictures_/Enclosure and Combiner' `
    -Destination 'src/assets/photography/enclosures-and-combiners'
```

Decodes HEIC/JPEG/PNG, applies EXIF orientation, strips all metadata, caps the long edge at
1600 px and writes quality-74 JPEG. Existing outputs are skipped unless `-Force` is passed,
so re-running after a follow-up batch converts only what is new.

**Then rename the output by hand.** The script derives names from source filenames, which
are camera identifiers and occasionally carry a customer's name. Published assets get
descriptive kebab-case names, and a customer name must never travel across from a source
filename.

## `convert-client-videos.ps1`

```powershell
./scripts/convert-client-videos.ps1 `
    -Source 'Website pictures_/Enclosure and Combiner' `
    -Destination 'public/video/enclosures-and-combiners' `
    -PosterDestination 'src/assets/photography/video-posters'
```

Requires **ffmpeg on `PATH`** (`winget install Gyan.FFmpeg`). This is an authoring
dependency on one machine — it is deliberately absent from `package.json` and
`netlify.toml`.

Transcodes to H.264 MP4 at 720p with `faststart` and stripped metadata, and extracts a
poster frame. The MP4 goes to `public/` because Astro's image pipeline does not process
video and a video needs a stable, untransformed URL; the **poster goes to `src/assets/`** so
it is optimised by the build rather than shipped as-is. Anything in `public/` bypasses
optimisation entirely — that is how `og.png` reached production at 1.29 MB.

**The output carries no audio track** (`-an`). The clips are filmed on a working site and
their soundtrack is whatever was being said near the phone — bystanders who never agreed to
be published, sometimes a customer or a price. Muting the player only hides that; the words
still ship inside the file. Removing the track is the version of "silent" that survives
someone downloading the MP4. If a clip predates this and still has audio, strip it in place:

```powershell
ffmpeg -i clip.mp4 -map 0:v -c:v copy -an -map_metadata -1 -movflags +faststart out.mp4
```

## `generate-favicons.mjs`

```bash
node scripts/generate-favicons.mjs
```

Rasterises `src/assets/brand/favicon.svg` into `public/favicon.ico` (16, 32 and 48 px
packed into one file), `public/apple-touch-icon.png`, `public/icon-192.png` and
`public/icon-512.png`. Re-run it only when the mark itself changes.

Unlike its neighbours this one is Node, not PowerShell: `sharp` ships with Astro and reads
SVG without complaint, so none of the HEIC/HEVC decoding problems that pushed the media
scripts out to WIC and ffmpeg apply. It needs nothing on `PATH`.

The SVG remains the icon browsers prefer. The rasters exist for the consumers that cannot
use it or never look at the markup — **Google's favicon crawler probes `/favicon.ico` at
the root**, iOS wants a square PNG for a home-screen shortcut, and Android reads the two
sized PNGs through `public/site.webmanifest`.

The mark is committed twice, at `src/assets/brand/favicon.svg` (imported by the build) and
`public/favicon.svg` (served as-is). The script compares them and refuses to run if they
have drifted, because otherwise the rasters would silently stop matching the served SVG.

## Before publishing anything these produce

Check every converted file at full resolution for number plates, delivery documents, serial
numbers, addresses and recognisable people.
