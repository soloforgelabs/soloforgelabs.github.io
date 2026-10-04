<#
.SYNOPSIS
    Builds the SoloForge Labs showcase website and synchronizes distribution bundles to repo root for GitHub Pages.

.DESCRIPTION
    1. Executes `npm run build` in the `website/` directory.
    2. Removes stale hashed bundles (`assets/index-*.js`, `assets/index-*.css`) from the repository root to prevent accumulation.
    3. Copies fresh `website/dist/*` artifacts to repo root (`index.html`, `assets/`, logos, `favicon.svg`).
    4. Guarantees presence of `.nojekyll` to disable Jekyll processing on GitHub Pages.
    5. Displays a verification summary of deployed assets.
#>

[CmdletBinding()]
param(
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

# Determine paths relative to this script
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir
$WebsiteDir = Join-Path $RepoRoot "website"
$DistDir = Join-Path $WebsiteDir "dist"
$RootAssetsDir = Join-Path $RepoRoot "assets"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " SoloForge Labs - Static Site Build & Sync Automation     " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Repo Root: $RepoRoot" -ForegroundColor DarkGray
Write-Host "Website:   $WebsiteDir" -ForegroundColor DarkGray

# 1. Build Website
if (-not $SkipBuild) {
    Write-Host "`n[1/4] Building website in $WebsiteDir..." -ForegroundColor Yellow
    Push-Location $WebsiteDir
    try {
        npm run build
        if ($LASTEXITCODE -ne 0) {
            throw "npm run build failed with exit code $LASTEXITCODE"
        }
    }
    finally {
        Pop-Location
    }
} else {
    Write-Host "`n[1/4] Skipping build step (-SkipBuild supplied)..." -ForegroundColor DarkGray
}

if (-not (Test-Path $DistDir)) {
    throw "Distribution directory not found at $DistDir"
}

# 2. Clean old hashed bundles from root assets
Write-Host "`n[2/4] Cleaning stale hashed bundles from root assets/..." -ForegroundColor Yellow
if (Test-Path $RootAssetsDir) {
    $staleBundles = Get-ChildItem -Path $RootAssetsDir -File | Where-Object {
        $_.Name -match '^index-.*\.js$' -or $_.Name -match '^index-.*\.css$'
    }
    foreach ($file in $staleBundles) {
        Write-Host "  Removing stale asset: $($file.Name)" -ForegroundColor DarkGray
        Remove-Item -Path $file.FullName -Force
    }
} else {
    New-Item -Path $RootAssetsDir -ItemType Directory -Force | Out-Null
}

# 3. Synchronize website/dist/* to repo root
Write-Host "`n[3/4] Copying fresh build artifacts from website/dist to repo root..." -ForegroundColor Yellow
$distItems = Get-ChildItem -Path $DistDir
foreach ($item in $distItems) {
    Copy-Item -Path $item.FullName -Destination $RepoRoot -Recurse -Force
    Write-Host "  Synced: $($item.Name)" -ForegroundColor Green
}

# 4. Ensure .nojekyll marker exists
Write-Host "`n[4/4] Ensuring .nojekyll marker at repo root..." -ForegroundColor Yellow
$NoJekyllPath = Join-Path $RepoRoot ".nojekyll"
if (-not (Test-Path $NoJekyllPath)) {
    New-Item -Path $NoJekyllPath -ItemType File -Force | Out-Null
    Write-Host "  Created: .nojekyll" -ForegroundColor Green
} else {
    Write-Host "  Verified: .nojekyll is present" -ForegroundColor Green
}

# 5. Verification summary
Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host " Sync Complete - Verification Summary                     " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$syncedRootFiles = @("index.html", ".nojekyll", "favicon.svg", "sfl-logo.png", "sfl-logo-transparent.png", "sfl-logo.svg", "sfl-logo.jpg")
Write-Host "Root Deployment Files:" -ForegroundColor Cyan
Get-ChildItem -Path $RepoRoot -File | Where-Object { $_.Name -in $syncedRootFiles } | Select-Object Name, Length, LastWriteTime | Format-Table -AutoSize

Write-Host "Root Assets Bundle:" -ForegroundColor Cyan
Get-ChildItem -Path $RootAssetsDir -File | Where-Object { $_.Name -like "index-*" } | Select-Object Name, Length, LastWriteTime | Format-Table -AutoSize

Write-Host "GitHub Pages static release synchronized successfully!`n" -ForegroundColor Green
