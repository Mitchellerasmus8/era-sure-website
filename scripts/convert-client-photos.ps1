<#
.SYNOPSIS
    Converts a folder of client-supplied photographs into web-ready, metadata-free JPEGs.

.DESCRIPTION
    The client sends photographs a category at a time, straight off an iPhone. Those files
    cannot go into the site as they are, for two reasons:

      1. They are HEIC. The project's bundled `sharp` refuses every one of them with
         "Security limit exceeded: Number of references in iref box (48) exceeds the
         security limits of 16", so Astro's image pipeline cannot read them at all.
         Windows' own imaging stack (WIC, via PresentationCore) decodes them fine, which
         is why this script is PowerShell rather than Node.

      2. They carry EXIF, including GPS coordinates of customer premises. Astro strips
         metadata when it re-encodes, so published images are clean either way — but the
         intermediate JPEGs are committed, and git history is forever. Stripping happens
         here, before anything is staged.

    Re-encoding also bakes in the EXIF orientation flag, so portrait photographs stay
    portrait once the metadata carrying that flag is gone.

    This is an authoring tool. It is not part of `npm run build`, and nothing in
    package.json or netlify.toml depends on it.

.PARAMETER Source
    Folder of client-supplied images. HEIC, JPEG and PNG are all accepted.

.PARAMETER Destination
    Folder to write JPEGs into, normally src/assets/photography/<category-slug>/.

.PARAMETER MaxEdge
    Longest-edge cap in pixels. 1600 still exceeds the 1400px lightbox render, so it is a
    ceiling rather than a compromise — the shipped renditions are Astro's WebP output, and
    this file is only ever a build input. Measured: 1600/74 lands around 300 KB per
    photograph, against roughly 450 KB at 1800/78 for no visible gain.

.PARAMETER Quality
    JPEG quality, 1-100.

.PARAMETER Force
    Overwrite existing outputs. Without it, existing files are skipped, so the script is
    safe to re-run when the client sends a follow-up batch.

.EXAMPLE
    ./scripts/convert-client-photos.ps1 `
        -Source 'Website pictures_/Enclosure and Combiner' `
        -Destination 'src/assets/photography/enclosures-and-combiners'

.NOTES
    Output names come from the source filename and are meant to be renamed by hand
    afterwards. Descriptive kebab-case only — never carry a customer name across from a
    source filename.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$Source,
    [Parameter(Mandatory)][string]$Destination,
    [int]$MaxEdge = 1600,
    [int]$Quality = 74,
    [switch]$Force
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName PresentationCore

if (-not (Test-Path -LiteralPath $Source)) {
    throw "Source folder not found: $Source"
}
if (-not (Test-Path -LiteralPath $Destination)) {
    New-Item -ItemType Directory -Force -Path $Destination | Out-Null
}

$converted = 0
$skipped = 0
$failed = @()

Get-ChildItem -LiteralPath $Source -File |
    Where-Object { $_.Extension -match '(?i)\.(heic|heif|jpe?g|png)$' } |
    Sort-Object Name |
    ForEach-Object {
        $sourceFile = $_
        $targetName = ($sourceFile.BaseName -replace '[^A-Za-z0-9]+', '-').Trim('-').ToLower() + '.jpg'
        $targetPath = Join-Path $Destination $targetName

        if ((Test-Path -LiteralPath $targetPath) -and -not $Force) {
            $skipped++
            return
        }

        $stream = $null
        try {
            $stream = [System.IO.File]::OpenRead($sourceFile.FullName)
            $decoder = [System.Windows.Media.Imaging.BitmapDecoder]::Create(
                $stream, 'None', 'OnLoad')
            $frame = $decoder.Frames[0]

            # WIC applies the EXIF orientation flag during decode, so PixelWidth/Height are
            # already the displayed dimensions. Scaling from them keeps portraits portrait.
            $longest = [Math]::Max($frame.PixelWidth, $frame.PixelHeight)
            $scale = if ($longest -gt $MaxEdge) { $MaxEdge / $longest } else { 1.0 }

            # Not $source — PowerShell variables are case-insensitive, so that name is the
            # [string]$Source parameter, and assigning a bitmap to it silently stringifies
            # the image.
            # The transform is applied unconditionally, even at scale 1.0. A BitmapFrame
            # carries its own metadata, and BitmapFrame::Create() hands that straight back
            # out — so skipping the transform for an already-small image republishes its
            # EXIF. Caught exactly that way: three source JPEGs measuring 1600px on the long
            # edge sailed through with GPS intact while every rescaled HEIC came out clean.
            $transform = New-Object System.Windows.Media.ScaleTransform -ArgumentList $scale, $scale
            $image = New-Object System.Windows.Media.Imaging.TransformedBitmap `
                -ArgumentList ([System.Windows.Media.Imaging.BitmapSource]$frame), ([System.Windows.Media.Transform]$transform)

            $encoder = New-Object System.Windows.Media.Imaging.JpegBitmapEncoder
            $encoder.QualityLevel = $Quality

            # BitmapFrame::Create(BitmapSource) carries no metadata and no colour profile.
            # This single-argument overload is the whole EXIF/GPS strip — do not "improve"
            # it into an overload that takes metadata.
            $encoder.Frames.Add(
                [System.Windows.Media.Imaging.BitmapFrame]::Create(
                    [System.Windows.Media.Imaging.BitmapSource]$image))

            $target = [System.IO.File]::Create($targetPath)
            try { $encoder.Save($target) } finally { $target.Close() }

            $size = [math]::Round((Get-Item -LiteralPath $targetPath).Length / 1KB)
            '{0,-38} -> {1,-42} {2}x{3}  {4} KB' -f $sourceFile.Name, $targetName,
                [int]($frame.PixelWidth * $scale), [int]($frame.PixelHeight * $scale), $size
            $converted++
        }
        catch {
            $failed += "$($sourceFile.Name): $($_.Exception.Message)"
        }
        finally {
            if ($null -ne $stream) { $stream.Close() }
        }
    }

''
"converted: $converted   skipped (already present): $skipped   failed: $($failed.Count)"
if ($failed.Count -gt 0) {
    ''
    'FAILED:'
    $failed | ForEach-Object { "  $_" }
}
