<#
.SYNOPSIS
    Converts client-supplied phone video into web-playable MP4 plus a poster frame.

.DESCRIPTION
    The client's clips are HEVC (`hvc1`) in a QuickTime container. Safari plays them;
    stock Chrome, Edge and Firefox do not — and the `qt` major brand is not a valid MP4
    brand, so renaming the file achieves nothing. They also arrive at 9-14 MB each, which
    is far too heavy for a site whose audience is installers on mobile data.

    This transcodes to H.264 MP4 at 720p, moves the moov atom to the front so playback
    can start before the file has finished downloading, and strips all metadata (phone
    video carries GPS in the same way phone stills do).

    **The output has no audio track at all.** These are clips filmed on a working site, and
    their soundtrack is whatever happened to be said near the phone — bystanders who never
    agreed to be published, and occasionally a customer or a price. Muting the player only
    hides that; the words still ship in the file and anyone can recover them. `-an` is the
    version of "silent" that survives someone downloading the MP4, so it is the one used
    here. It also takes roughly 10% off each file.

    The MP4 goes to public/ because Astro's image pipeline does not process video and a
    video needs a stable, untransformed URL. The poster goes to src/assets/ so the build
    optimises it — anything in public/ bypasses optimisation entirely, which is how og.png
    once reached production at 1.29 MB.

    This is an authoring tool. ffmpeg is a dependency of this script on one machine, not
    of the project: it appears in neither package.json nor netlify.toml, and the Netlify
    build never runs it.

.PARAMETER Source
    Folder of client-supplied video.

.PARAMETER Destination
    Folder for the MP4s, under public/video/.

.PARAMETER PosterDestination
    Folder for extracted poster frames, under src/assets/.

.PARAMETER PosterSecond
    Timestamp to grab the poster from. The first frame of a hand-held clip is usually the
    worst one in it.

.PARAMETER Crf
    H.264 quality, lower is better. 26 holds up well for equipment footage.

.PARAMETER FfmpegPath
    Explicit path to ffmpeg.exe. Only needed when ffmpeg is not on PATH — which is the
    case in a shell that was already open when winget installed it.

.EXAMPLE
    ./scripts/convert-client-videos.ps1 `
        -Source 'Website pictures_/Enclosure and Combiner' `
        -Destination 'public/video/enclosures-and-combiners' `
        -PosterDestination 'src/assets/photography/video-posters'

.NOTES
    Install ffmpeg with: winget install Gyan.FFmpeg

    Review every output before publishing. A video is 30 seconds of continuous frames and
    is far more likely than a still to catch a number plate, a document or a bystander.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$Source,
    [Parameter(Mandatory)][string]$Destination,
    [Parameter(Mandatory)][string]$PosterDestination,
    [double]$PosterSecond = 1.0,
    [int]$Crf = 26,
    [int]$MaxHeight = 720,
    [string]$FfmpegPath,
    [switch]$Force
)

$ErrorActionPreference = 'Stop'

if (-not $FfmpegPath) {
    $command = Get-Command ffmpeg -ErrorAction SilentlyContinue
    if ($command) {
        $FfmpegPath = $command.Source
    }
    else {
        $packaged = Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" `
            -Filter 'ffmpeg.exe' -Recurse -ErrorAction SilentlyContinue |
            Select-Object -First 1
        if (-not $packaged) {
            throw 'ffmpeg not found. Install it with: winget install Gyan.FFmpeg'
        }
        $FfmpegPath = $packaged.FullName
    }
}

if (-not (Test-Path -LiteralPath $Source)) { throw "Source folder not found: $Source" }
foreach ($dir in @($Destination, $PosterDestination)) {
    if (-not (Test-Path -LiteralPath $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
    }
}

$converted = 0
$skipped = 0

Get-ChildItem -LiteralPath $Source -File |
    Where-Object { $_.Extension -match '(?i)\.(mov|mp4|m4v)$' } |
    Sort-Object Name |
    ForEach-Object {
        $clip = $_
        $stem = ($clip.BaseName -replace '[^A-Za-z0-9]+', '-').Trim('-').ToLower()
        $mp4 = Join-Path $Destination "$stem.mp4"
        $poster = Join-Path $PosterDestination "$stem.jpg"

        if ((Test-Path -LiteralPath $mp4) -and -not $Force) {
            $skipped++
            return
        }

        # -map_metadata -1 drops GPS and device metadata; -an drops the on-site chatter
        # (see .DESCRIPTION); +faststart moves the moov atom to the front so the browser
        # can begin playing before the download completes.
        $arguments = @(
            '-y', '-hide_banner', '-loglevel', 'error',
            '-i', $clip.FullName,
            '-map_metadata', '-1',
            '-vf', "scale=-2:'min($MaxHeight,ih)'",
            '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', "$Crf",
            '-pix_fmt', 'yuv420p',
            '-an',
            '-movflags', '+faststart',
            $mp4
        )
        & $FfmpegPath @arguments
        if ($LASTEXITCODE -ne 0) { throw "ffmpeg failed on $($clip.Name)" }

        $posterArguments = @(
            '-y', '-hide_banner', '-loglevel', 'error',
            '-ss', "$PosterSecond", '-i', $clip.FullName,
            '-map_metadata', '-1',
            '-frames:v', '1',
            '-vf', "scale=-2:'min(900,ih)'",
            '-q:v', '4',
            $poster
        )
        & $FfmpegPath @posterArguments
        if ($LASTEXITCODE -ne 0) { throw "ffmpeg poster extraction failed on $($clip.Name)" }

        $sourceMb = [math]::Round($clip.Length / 1MB, 1)
        $outMb = [math]::Round((Get-Item -LiteralPath $mp4).Length / 1MB, 1)
        $posterKb = [math]::Round((Get-Item -LiteralPath $poster).Length / 1KB)
        '{0,-18} {1,6} MB -> {2,6} MB   poster {3} KB' -f $clip.Name, $sourceMb, $outMb, $posterKb
        $converted++
    }

''
"converted: $converted   skipped (already present): $skipped"
"ffmpeg: $FfmpegPath"
