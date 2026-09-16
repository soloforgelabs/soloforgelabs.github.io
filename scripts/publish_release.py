#!/usr/bin/env python3
"""
SoloForge Labs — Automated Release Publisher
============================================
Publishes binary releases for BlinkScribe, DeskScribe, and future SoloForge tools.
- Packages portable archives and checks binary artifacts.
- Computes SHA-256 checksums.
- Updates SoloForgeLabs/README.md links and docs/checksums.sha256.
- Commits and pushes documentation to GitHub.
- Creates product-scoped GitHub release (e.g. `blinkscribe-v1.0.1`) and uploads assets.

Usage:
    python publish_release.py --project blinkscribe --version 1.0.1 [--notes "Bugfix release notes"] [--dry-run]
"""

import argparse
import hashlib
import os
import re
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

# Ensure UTF-8 output on Windows consoles
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

SOLOFORGE_ROOT = Path(__file__).resolve().parent.parent
WORKSPACE_ROOT = SOLOFORGE_ROOT.parent
RELEASES_DIR = SOLOFORGE_ROOT / "releases"
DOCS_DIR = SOLOFORGE_ROOT / "docs"
README_FILE = SOLOFORGE_ROOT / "README.md"
CHECKSUMS_FILE = DOCS_DIR / "checksums.sha256"

PROJECT_CONFIGS = {
    "blinkscribe": {
        "title": "BlinkScribe",
        "tag_prefix": "blinkscribe-v",
        "source_dir": WORKSPACE_ROOT / "BlinkScribe",
        "dist_dir": WORKSPACE_ROOT / "BlinkScribe" / "dist",
        "primary_exe": "BlinkScribe.exe",
    },
    "deskscribe": {
        "title": "DeskScribe",
        "tag_prefix": "deskscribe-v",
        "source_dir": WORKSPACE_ROOT / "DeskScribe",
        "dist_dir": WORKSPACE_ROOT / "DeskScribe" / "dist",
        "primary_exe": "DeskScribe.exe",
    },
}


def compute_sha256(file_path: Path) -> str:
    """Compute SHA-256 hash of a file."""
    sha = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(1024 * 1024):
            sha.update(chunk)
    return sha.hexdigest().upper()


def format_size(bytes_val: int) -> str:
    """Format bytes to human-readable size."""
    if bytes_val >= 1024 * 1024 * 1024:
        return f"{bytes_val / (1024**3):.2f} GB"
    return f"{bytes_val / (1024**2):.1f} MB"


def package_blinkscribe(cfg: dict, version: str, dry_run: bool) -> list[Path]:
    """Package and stage BlinkScribe release artifacts."""
    dist_dir = cfg["dist_dir"]
    source_dir = cfg["source_dir"]
    exe_src = dist_dir / "BlinkScribe.exe"

    if not exe_src.exists():
        raise FileNotFoundError(
            f"BlinkScribe executable not found at: {exe_src}. Did you run build first?"
        )

    RELEASES_DIR.mkdir(parents=True, exist_ok=True)
    versioned_exe = RELEASES_DIR / f"BlinkScribe_v{version}.exe"
    portable_zip = RELEASES_DIR / f"BlinkScribe_v{version}_Portable.zip"

    print(f"📦 Staging {versioned_exe.name}...")
    if not dry_run:
        shutil.copy2(exe_src, versioned_exe)

    print(f"📦 Building {portable_zip.name}...")
    if not dry_run:
        with zipfile.ZipFile(portable_zip, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.write(exe_src, arcname="BlinkScribe.exe")
            for optional_file in ["README_USERS.txt", "README.txt", "default_config.json", "config.json"]:
                p = source_dir / optional_file
                if p.exists():
                    zf.write(p, arcname=optional_file)

    return [versioned_exe, portable_zip]


def package_deskscribe(cfg: dict, version: str, dry_run: bool) -> list[Path]:
    """Stage DeskScribe release artifacts."""
    dist_dir = cfg["dist_dir"]
    RELEASES_DIR.mkdir(parents=True, exist_ok=True)

    # Search for setup exe
    setup_candidates = list(dist_dir.glob(f"DeskScribe_Setup_v{version}.exe")) or list(dist_dir.glob("DeskScribe_Setup_*.exe"))
    if not setup_candidates:
        raise FileNotFoundError(f"DeskScribe installer not found in {dist_dir}")
    setup_exe = setup_candidates[0]
    target_setup = RELEASES_DIR / f"DeskScribe_Setup_v{version}.exe"

    print(f"📦 Staging {target_setup.name}...")
    if not dry_run:
        shutil.copy2(setup_exe, target_setup)

    # Search for portable zip
    zip_candidates = list(dist_dir.glob(f"DeskScribe_v{version}_Portable.zip")) or list(dist_dir.glob("DeskScribe_*_Portable.zip"))
    target_zip = None
    if zip_candidates:
        target_zip = RELEASES_DIR / f"DeskScribe_v{version}_Portable.zip"
        print(f"📦 Staging {target_zip.name}...")
        if not dry_run:
            shutil.copy2(zip_candidates[0], target_zip)

    artifacts = [target_setup]
    if target_zip:
        artifacts.append(target_zip)
    return artifacts


def update_checksums_and_readme(project: str, version: str, artifacts: list[Path], dry_run: bool):
    """Update docs/checksums.sha256 and README.md tables and links."""
    print("🔒 Calculating SHA-256 hashes...")
    artifact_hashes = {}
    for art in artifacts:
        if art.exists():
            h = compute_sha256(art)
            artifact_hashes[art.name] = (h, format_size(art.stat().st_size))
            print(f"  {h}  {art.name} ({artifact_hashes[art.name][1]})")

    if dry_run:
        print("🔍 [DRY-RUN] Skipping file modifications.")
        return

    # 1. Update checksums.sha256
    existing_lines = {}
    if CHECKSUMS_FILE.exists():
        for line in CHECKSUMS_FILE.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and "  " in line:
                h, fn = line.split("  ", 1)
                existing_lines[fn.strip()] = h.strip()

    for fn, (h, _) in artifact_hashes.items():
        existing_lines[fn] = h

    new_checksums_content = "\n".join(f"{h}  {fn}" for fn, h in sorted(existing_lines.items())) + "\n"
    CHECKSUMS_FILE.write_text(new_checksums_content, encoding="utf-8")
    print(f"✅ Updated {CHECKSUMS_FILE.relative_to(SOLOFORGE_ROOT)}")

    # 2. Update README.md
    readme_content = README_FILE.read_text(encoding="utf-8")
    tag_name = f"{project}-v{version}"

    if project == "blinkscribe":
        # Update download links
        readme_content = re.sub(
            r'href="https://github.com/soloforgelabs/soloforgelabs.github.io/releases/download/[^/]+/BlinkScribe_[^"]+\.exe"',
            f'href="https://github.com/soloforgelabs/soloforgelabs.github.io/releases/download/{tag_name}/BlinkScribe_v{version}.exe"',
            readme_content
        )
        readme_content = re.sub(
            r'href="https://github.com/soloforgelabs/soloforgelabs.github.io/releases/download/[^/]+/BlinkScribe_[^"]+_Portable\.zip"',
            f'href="https://github.com/soloforgelabs/soloforgelabs.github.io/releases/download/{tag_name}/BlinkScribe_v{version}_Portable.zip"',
            readme_content
        )
        # Update checksum table rows
        for art_name, (h, sz) in artifact_hashes.items():
            pattern = rf'\| `BlinkScribe_[^`]+({re.escape(art_name.split("_")[-1])})` \| [^|]+ \| `[A-F0-9]+` \|'
            replacement = f'| `{art_name}` | {sz} | `{h}` |'
            if re.search(pattern, readme_content):
                readme_content = re.sub(pattern, replacement, readme_content)

    elif project == "deskscribe":
        readme_content = re.sub(
            r'href="https://github.com/soloforgelabs/soloforgelabs.github.io/releases/download/[^/]+/DeskScribe_Setup_[^"]+\.exe"',
            f'href="https://github.com/soloforgelabs/soloforgelabs.github.io/releases/download/{tag_name}/DeskScribe_Setup_v{version}.exe"',
            readme_content
        )
        readme_content = re.sub(
            r'href="https://github.com/soloforgelabs/soloforgelabs.github.io/releases/download/[^/]+/DeskScribe_[^"]+_Portable\.zip"',
            f'href="https://github.com/soloforgelabs/soloforgelabs.github.io/releases/download/{tag_name}/DeskScribe_v{version}_Portable.zip"',
            readme_content
        )
        for art_name, (h, sz) in artifact_hashes.items():
            pattern = rf'\| `DeskScribe_[^`]+({re.escape(art_name.split("_")[-1])})` \| [^|]+ \| `[A-F0-9]+` \|'
            replacement = f'| `{art_name}` | {sz} | `{h}` |'
            if re.search(pattern, readme_content):
                readme_content = re.sub(pattern, replacement, readme_content)

    README_FILE.write_text(readme_content, encoding="utf-8")
    print(f"✅ Updated download links and checksums in {README_FILE.relative_to(SOLOFORGE_ROOT)}")


def git_commit_and_push(project: str, version: str, dry_run: bool):
    """Commit documentation updates and push to GitHub."""
    if dry_run:
        print("🔍 [DRY-RUN] Would commit and push to git.")
        return

    commit_msg = f"release({project}): update download links and checksums for v{version}"
    print(f"🚀 Committing documentation to git: '{commit_msg}'...")
    subprocess.run(["git", "add", "README.md", "docs/checksums.sha256"], cwd=SOLOFORGE_ROOT, check=True)
    
    # Check if there are changes to commit
    status_output = subprocess.check_output(["git", "status", "--porcelain"], cwd=SOLOFORGE_ROOT, text=True)
    if "README.md" in status_output or "checksums.sha256" in status_output:
        subprocess.run(["git", "commit", "-m", commit_msg], cwd=SOLOFORGE_ROOT, check=True)
        subprocess.run(["git", "push", "origin", "main"], cwd=SOLOFORGE_ROOT, check=True)
        print("✅ Pushed documentation changes to GitHub main branch.")
    else:
        print("ℹ️ No documentation changes to commit.")


def create_github_release(project: str, version: str, artifacts: list[Path], notes: str, dry_run: bool):
    """Create GitHub Release via `gh release create` and upload assets."""
    cfg = PROJECT_CONFIGS[project]
    tag_name = f"{cfg['tag_prefix']}{version}"
    release_title = f"{cfg['title']} v{version}"

    if not notes:
        notes = f"## 🚀 {release_title}\n\nAutomated release with latest improvements and bugfixes."

    # Write release notes to temp file
    notes_file = RELEASES_DIR / f"RELEASE_NOTES_{tag_name}.md"
    notes_file.write_text(notes, encoding="utf-8")

    cmd = [
        "gh", "release", "create", tag_name,
        "--title", release_title,
        "--notes-file", str(notes_file),
    ]
    for art in artifacts:
        cmd.append(str(art))

    print(f"🌐 Creating GitHub release '{tag_name}'...")
    print(f"   Command: {' '.join(cmd)}")

    if dry_run:
        print("🔍 [DRY-RUN] Skipping GitHub release creation.")
        return

    subprocess.run(cmd, cwd=SOLOFORGE_ROOT, check=True)
    print(f"🎉 Release successfully published: https://github.com/soloforgelabs/soloforgelabs.github.io/releases/tag/{tag_name}")


def main():
    parser = argparse.ArgumentParser(description="SoloForge Labs Release Publisher")
    parser.add_argument("--project", choices=["blinkscribe", "deskscribe"], required=True, help="Product to release")
    parser.add_argument("--version", required=True, help="Semantic version (e.g. 1.0.1)")
    parser.add_argument("--notes", default="", help="Release notes text or markdown")
    parser.add_argument("--dry-run", action="store_true", help="Simulate release without modifying files or uploading")

    args = parser.parse_args()
    project = args.project.lower()
    version = args.version.lstrip("v")
    cfg = PROJECT_CONFIGS[project]

    print(f"\n=======================================================")
    print(f"🚀 SoloForge Labs Release Publisher: {cfg['title']} v{version}")
    print(f"=======================================================\n")

    if project == "blinkscribe":
        artifacts = package_blinkscribe(cfg, version, args.dry_run)
    elif project == "deskscribe":
        artifacts = package_deskscribe(cfg, version, args.dry_run)
    else:
        raise ValueError(f"Unknown project: {project}")

    update_checksums_and_readme(project, version, artifacts, args.dry_run)
    git_commit_and_push(project, version, args.dry_run)
    create_github_release(project, version, artifacts, args.notes, args.dry_run)


if __name__ == "__main__":
    main()
