# install.ps1 - ctok one-liner installer for Windows
#
# Usage:
#   iwr https://ctok-cli.github.io/ctok/install.ps1 | iex
#   iwr https://ctok-cli.github.io/ctok/install.ps1 -OutFile install.ps1; .\install.ps1 -Version 0.2.0
#
# Parameters:
#   -Version <string>   Install a specific version (default: latest)
#   -Dir     <string>   Install directory (default: $env:USERPROFILE\.ctok\bin)
#   -NoPath             Skip adding the install dir to the user PATH

[CmdletBinding()]
param(
    [string] $Version = "",
    [string] $Dir     = "",
    [switch] $NoPath
)

$ErrorActionPreference = "Stop"

$Repo       = "ctok-cli/ctok"
$Binary     = "ctok-win-x64.exe"
$InstallDir = if ($Dir) { $Dir } else { "$env:USERPROFILE\.ctok\bin" }

# ── Resolve version ───────────────────────────────────────────────────────────
if (-not $Version) {
    Write-Host "Fetching latest ctok release..."
    try {
        $release = Invoke-RestMethod `
            -Uri "https://api.github.com/repos/$Repo/releases/latest" `
            -Headers @{ "User-Agent" = "ctok-installer" }
        $Version = $release.tag_name -replace '^v', ''
    } catch {
        Write-Error "Could not fetch latest release. Set -Version and retry.`n$_"
        exit 1
    }
}

$BaseUrl      = "https://github.com/$Repo/releases/download/v$Version"
$BinaryUrl    = "$BaseUrl/$Binary"
$ChecksumUrl  = "$BaseUrl/SHA256SUMS.txt"

# ── Download ──────────────────────────────────────────────────────────────────
Write-Host "Downloading ctok v$Version ($Binary)..."

$tmp        = New-TemporaryFile | ForEach-Object DirectoryName
$binaryPath = Join-Path $tmp $Binary
$checksumPath = Join-Path $tmp "SHA256SUMS.txt"

try {
    $ProgressPreference = "SilentlyContinue"
    Invoke-WebRequest -Uri $BinaryUrl   -OutFile $binaryPath   -UseBasicParsing
    Invoke-WebRequest -Uri $ChecksumUrl -OutFile $checksumPath -UseBasicParsing -ErrorAction SilentlyContinue
} catch {
    Write-Error "Download failed: $_"
    exit 1
} finally {
    $ProgressPreference = "Continue"
}

# ── Verify checksum (best-effort) ─────────────────────────────────────────────
if (Test-Path $checksumPath) {
    $lines    = Get-Content $checksumPath
    $expected = ($lines | Where-Object { $_ -match [regex]::Escape($Binary) }) `
                  -replace "^(\S+)\s.*", '$1'
    if ($expected) {
        $actual = (Get-FileHash $binaryPath -Algorithm SHA256).Hash.ToLower()
        if ($actual -ne $expected.ToLower()) {
            Write-Error "Checksum mismatch!`n  Expected: $expected`n  Got:      $actual"
            exit 1
        }
        Write-Host "Checksum verified."
    }
}

# ── Install ───────────────────────────────────────────────────────────────────
if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
}

$dest = Join-Path $InstallDir "ctok.exe"
Move-Item -Force $binaryPath $dest

Write-Host "Installed ctok v$Version -> $dest"

# ── Add to PATH ───────────────────────────────────────────────────────────────
if (-not $NoPath) {
    $userPath = [Environment]::GetEnvironmentVariable("PATH", "User")
    if ($userPath -notlike "*$InstallDir*") {
        [Environment]::SetEnvironmentVariable(
            "PATH",
            "$userPath;$InstallDir",
            "User"
        )
        Write-Host "Added $InstallDir to user PATH."
        Write-Host "Restart your terminal for PATH changes to take effect."
    }

    # Also update the current session
    $env:PATH = "$env:PATH;$InstallDir"
}

# ── Done ──────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "Run: ctok --version"
Write-Host "     ctok doctor"
Write-Host "     ctok help"
