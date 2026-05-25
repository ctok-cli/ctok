# ctok installer — https://ctok.dev/install.ps1
# Usage: iwr https://ctok.dev/install.ps1 | iex
#        or: iwr https://ctok.dev/install.ps1 -UseBasicParsing | Invoke-Expression
[CmdletBinding()]
param(
  [string]$Version = $env:CTOK_VERSION,
  [string]$BinDir  = $env:CTOK_BIN
)

$ErrorActionPreference = "Stop"
$Repo = "ctok-cli/ctok"

if (-not $BinDir) {
  $BinDir = Join-Path $HOME ".ctok" "bin"
}

# ── Architecture ────────────────────────────────────────────────────────────

$Arch = [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture
$ArchName = switch ($Arch) {
  "X64"   { "x64"   }
  "Arm64" { "arm64" }
  default {
    Write-Error "Unsupported architecture: $Arch. Install via npm: npm install -g @ctok/cli"
    exit 1
  }
}

$Binary = "ctok-win-$ArchName.exe"

# ── Resolve version ──────────────────────────────────────────────────────────

if (-not $Version) {
  try {
    $Release = Invoke-RestMethod "https://api.github.com/repos/$Repo/releases/latest"
    $Version = $Release.tag_name -replace "^v", ""
  } catch {
    Write-Error "Failed to resolve latest ctok version. Set `$env:CTOK_VERSION` explicitly."
    exit 1
  }
}

Write-Host "Installing ctok v$Version (win/$ArchName)..." -ForegroundColor Cyan

# ── Download ─────────────────────────────────────────────────────────────────

$DownloadUrl = "https://github.com/$Repo/releases/download/v$Version/$Binary"
$TmpFile = Join-Path $env:TEMP "ctok-installer-$([System.IO.Path]::GetRandomFileName()).exe"

try {
  Invoke-WebRequest $DownloadUrl -OutFile $TmpFile -UseBasicParsing
} catch {
  Write-Error "Download failed from $DownloadUrl`n$_"
  exit 1
}

# ── Install ──────────────────────────────────────────────────────────────────

if (-not (Test-Path $BinDir)) {
  New-Item -ItemType Directory -Path $BinDir -Force | Out-Null
}

$DestPath = Join-Path $BinDir "ctok.exe"
Copy-Item $TmpFile $DestPath -Force
Remove-Item $TmpFile -ErrorAction SilentlyContinue

# ── Add to user PATH (current session + persistent) ─────────────────────────

$UserPath = [System.Environment]::GetEnvironmentVariable("PATH", "User")
if ($UserPath -notlike "*$BinDir*") {
  [System.Environment]::SetEnvironmentVariable("PATH", "$UserPath;$BinDir", "User")
  $env:PATH = "$env:PATH;$BinDir"
  Write-Host "  Added $BinDir to your user PATH." -ForegroundColor Green
}

# ── Done ─────────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "ctok v$Version installed to $DestPath" -ForegroundColor Green
Write-Host ""
Write-Host "  Run: ctok --version" -ForegroundColor White
Write-Host ""
Write-Host "  Note: Windows binary is unsigned. If SmartScreen blocks it, right-click → Properties → Unblock." -ForegroundColor Yellow
