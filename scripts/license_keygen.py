#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""SoloForge Labs Master License Key Generator & Verifier CLI.

Generates and verifies cryptographically secure offline Ed25519 SFL1-... license keys
for BlinkScribe, DeskScribe, and VoxScribe.

Usage Examples:
  # Generate Bronze Supporter key (Orb skin perk across all 3 apps, 1 PC):
  python license_keygen.py --tier bronze --customer supporter@example.com

  # Generate Single Edition key for BlinkScribe:
  python license_keygen.py --tier single --apps blinkscribe --customer alice@example.com

  # Generate Duo Pack for BlinkScribe and VoxScribe:
  python license_keygen.py --tier duo --apps blinkscribe,voxscribe --customer bob@example.com

  # Generate Lifetime Scribe Trinity key:
  python license_keygen.py --tier trinity --customer studio@firm.com

  # Generate 30-day time-limited Trinity trial key:
  python license_keygen.py --tier trinity --days 30 --customer beta-tester-1

  # Verify an existing key:
  python license_keygen.py --verify SFL1-AC0G0-...
"""
from __future__ import annotations

import argparse
import datetime
import hashlib
import json
import os
from pathlib import Path
import sys
import time

# Ensure soloforge_desktop (or ScribeSuite BlinkScribe fallback) is importable
_SCRIPT_DIR = Path(__file__).resolve().parent
_REPO_ROOT = _SCRIPT_DIR.parent
_SOLOFORGE_DESKTOP_SRC = _REPO_ROOT.parent / "ScribeSuite" / "ScribeCore" / "packages" / "soloforge-desktop" / "src"
_BLINKSCRIBE_ROOT = _REPO_ROOT.parent / "ScribeSuite" / "BlinkScribe"

for _candidate in (_SOLOFORGE_DESKTOP_SRC, _BLINKSCRIBE_ROOT, _REPO_ROOT.parent / "BlinkScribe"):
    if _candidate.exists() and str(_candidate) not in sys.path:
        sys.path.insert(0, str(_candidate))

try:
    from soloforge_desktop.licensing import (
        APP_PRODUCT_BITS,
        PRODUCT_BLINKSCRIBE,
        PRODUCT_TRINITY_ALL,
        TIER_BRONZE,
        TIER_MAX_SEATS,
        LicensePayload,
        ed25519_public_key_from_seed,
        encode_license_key,
        reconstruct_official_public_key,
        verify_and_decode_license_key,
    )
except ImportError as exc:
    print(f"Error importing soloforge_desktop.licensing: {exc}", file=sys.stderr)
    sys.exit(1)


def load_master_seed(explicit_seed_hex: str | None = None) -> bytes:
    """Load master private seed from CLI flag, env var, or .master_license_key.json."""
    if explicit_seed_hex:
        return bytes.fromhex(explicit_seed_hex.strip())

    env_seed = os.environ.get("SFL_LICENSE_PRIVATE_SEED_HEX")
    if env_seed:
        return bytes.fromhex(env_seed.strip())

    key_file = _SCRIPT_DIR / ".master_license_key.json"
    if key_file.exists():
        try:
            with open(key_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            seed_hex = data.get("seed_hex")
            if seed_hex:
                return bytes.fromhex(seed_hex.strip())
        except Exception as exc:
            print(f"Warning: Failed to load {key_file}: {exc}", file=sys.stderr)

    raise ValueError(
        "SoloForge Labs master seed not found! Provide --seed-hex, set "
        "SFL_LICENSE_PRIVATE_SEED_HEX, or create scripts/.master_license_key.json."
    )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="SoloForge Labs Unified Ed25519 License Key Generator & Verifier"
    )
    parser.add_argument(
        "--verify",
        type=str,
        help="Verify and inspect an existing SFL1-... license key",
    )
    parser.add_argument(
        "--tier",
        type=str,
        choices=["bronze", "single", "duo", "trinity"],
        default="single",
        help="Storefront license tier (default: single)",
    )
    parser.add_argument(
        "--apps",
        type=str,
        default="blinkscribe",
        help="Comma-separated app IDs: blinkscribe, deskscribe, voxscribe (default: blinkscribe)",
    )
    parser.add_argument(
        "--customer",
        type=str,
        default="anonymous",
        help="Customer email or transaction reference (default: anonymous)",
    )
    parser.add_argument(
        "--days",
        type=int,
        default=0,
        help="Key validity in days (0 = lifetime perpetual, default: 0)",
    )
    parser.add_argument(
        "--seed-hex",
        type=str,
        default=None,
        help="Explicit 32-byte master seed in hex (overrides env and file)",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Format output as JSON",
    )
    parser.add_argument(
        "--show-seats",
        action="store_true",
        help="Explicitly display PC seat limits (1, 2, or 5)",
    )
    parser.add_argument(
        "--print-public-key",
        action="store_true",
        help="Print the reconstructed official public key and exit",
    )

    args = parser.parse_args()

    if args.print_public_key:
        pk = reconstruct_official_public_key()
        sha = hashlib.sha256(pk).hexdigest()
        if args.json:
            print(json.dumps({"public_key_hex": pk.hex(), "public_key_sha256": sha}, indent=2))
        else:
            print(f"Official Public Key: {pk.hex()}")
            print(f"SHA-256 Checksum:   {sha}")
        return

    if args.verify:
        key_str = args.verify.strip()
        payload = verify_and_decode_license_key(key_str)
        if payload is None:
            if args.json:
                print(json.dumps({"valid": False, "error": "Invalid signature or expired key"}, indent=2))
            else:
                print("FAILED: License key is INVALID, CORRUPTED, or EXPIRED.")
            sys.exit(1)

        max_seats = TIER_MAX_SEATS.get(payload.tier_code, 1)
        result = {
            "valid": True,
            "tier_code": payload.tier_code,
            "tier_name": payload.tier_name(),
            "max_seats": max_seats,
            "product_mask": payload.product_mask,
            "unlocked_apps": payload.unlocked_apps(),
            "issued_at": datetime.datetime.fromtimestamp(payload.issued_ts, datetime.timezone.utc).isoformat(),
            "expires_at": (
                datetime.datetime.fromtimestamp(payload.expires_ts, datetime.timezone.utc).isoformat()
                if payload.expires_ts > 0
                else "Lifetime (Perpetual)"
            ),
            "license_id_hex": payload.license_id_hex,
        }

        if args.json:
            print(json.dumps(result, indent=2))
        else:
            print("OK: License key is VALID and AUTHENTIC.")
            print(f"  Tier:          {result['tier_name']}")
            print(f"  Max PCs:       {result['max_seats']}")
            print(f"  Unlocked Apps: {', '.join(result['unlocked_apps'])}")
            print(f"  Issued At:     {result['issued_at']}")
            print(f"  Expires At:    {result['expires_at']}")
            print(f"  License ID:    {result['license_id_hex']}")
        return

    # Generation mode
    seed32 = load_master_seed(args.seed_hex)

    # Calculate product mask
    tier_lower = args.tier.lower()
    if tier_lower == "bronze":
        tier_code = TIER_BRONZE
        product_mask = PRODUCT_TRINITY_ALL
    elif tier_lower == "trinity":
        tier_code = 3
        product_mask = PRODUCT_TRINITY_ALL
    elif tier_lower == "duo":
        tier_code = 2
        requested_apps = [a.strip().lower() for a in args.apps.split(",") if a.strip()]
        product_mask = 0
        for app in requested_apps:
            product_mask |= APP_PRODUCT_BITS.get(app, 0)
        if not product_mask:
            product_mask = PRODUCT_BLINKSCRIBE | PRODUCT_VOXSCRIBE
    else:  # single
        tier_code = 1
        requested_apps = [a.strip().lower() for a in args.apps.split(",") if a.strip()]
        product_mask = 0
        for app in requested_apps:
            product_mask |= APP_PRODUCT_BITS.get(app, 0)
        if not product_mask:
            product_mask = PRODUCT_BLINKSCRIBE

    issued_ts = int(time.time())
    expires_ts = (issued_ts + args.days * 86400) if args.days > 0 else 0
    lic_id_hex = hashlib.sha256(args.customer.encode("utf-8")).digest()[:8].hex()

    payload = LicensePayload(
        version=1,
        product_mask=product_mask,
        tier_code=tier_code,
        issued_ts=issued_ts,
        expires_ts=expires_ts,
        license_id_hex=lic_id_hex,
    )

    license_key = encode_license_key(payload, seed32)

    # Verification self-check
    pubkey_override = ed25519_public_key_from_seed(seed32) if args.seed_hex else None
    verified = verify_and_decode_license_key(license_key, pubkey_override=pubkey_override)
    if not verified:
        print("Error: Generated key failed self-verification!", file=sys.stderr)
        sys.exit(1)

    max_seats = TIER_MAX_SEATS.get(tier_code, 1)
    out = {
        "license_key": license_key,
        "tier_name": payload.tier_name(),
        "tier_code": tier_code,
        "max_seats": max_seats,
        "unlocked_apps": payload.unlocked_apps(),
        "customer": args.customer,
        "issued_ts": issued_ts,
        "expires_ts": expires_ts,
        "license_id_hex": lic_id_hex,
    }

    if args.json:
        print(json.dumps(out, indent=2))
    else:
        print("SoloForge Labs License Key Generated Successfully:")
        print(f"  Key:           {license_key}")
        print(f"  Tier:          {out['tier_name']}")
        print(f"  Max PCs:       {max_seats}")
        print(f"  Unlocked Apps: {', '.join(out['unlocked_apps'])}")
        print(f"  Customer Ref:  {args.customer}")
        print(f"  Expires:       {'Lifetime' if expires_ts == 0 else f'{args.days} days'}")


if __name__ == "__main__":
    main()
