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
from decimal import Decimal, InvalidOperation
import hashlib
import json
import os
from pathlib import Path
import sys
import time
from typing import Any
import urllib.error
import urllib.request

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
        PRODUCT_VOXSCRIBE,
        TIER_BRONZE,
        TIER_GOLD,
        TIER_MAX_SEATS,
        TIER_NAMES,
        TIER_PLATINUM,
        TIER_SILVER,
        LicensePayload,
        ed25519_public_key_from_seed,
        encode_license_key,
        reconstruct_official_public_key,
        tier_rank,
        verify_and_decode_license_key,
    )
except ImportError as exc:
    print(f"Error importing soloforge_desktop.licensing: {exc}", file=sys.stderr)
    sys.exit(1)

TIER_THRESHOLD_CENTS: dict[int, int] = {
    TIER_BRONZE: 300,
    TIER_SILVER: 500,
    TIER_GOLD: 1300,
    TIER_PLATINUM: 1500,
}


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


def tier_from_cents(total_cents: int) -> int:
    """Map cumulative USD cents to SoloForge tier_code (0 if below $3.00)."""
    if total_cents >= 1500:
        return TIER_PLATINUM
    if total_cents >= 1300:
        return TIER_GOLD
    if total_cents >= 500:
        return TIER_SILVER
    if total_cents >= 300:
        return TIER_BRONZE
    return 0


def parse_apps_mask(apps_str: str | None) -> int:
    """Convert comma-separated app IDs into a bitmask (0 if omitted or empty)."""
    if not apps_str:
        return 0
    mask = 0
    for app in apps_str.split(","):
        clean = app.strip().lower()
        if clean:
            mask |= APP_PRODUCT_BITS.get(clean, 0)
    return mask


def resolve_upgrade_mask(
    target_tier: int,
    prev_tier: int,
    prev_mask: int,
    requested_mask: int,
) -> int:
    """Resolve product_mask on tier upgrade without inheriting Bronze's mask=7."""
    if target_tier in (TIER_BRONZE, TIER_PLATINUM):
        return PRODUCT_TRINITY_ALL
    if prev_tier in (TIER_SILVER, TIER_GOLD, TIER_PLATINUM) and prev_mask > 0:
        return (prev_mask | requested_mask) if requested_mask > 0 else prev_mask
    if requested_mask > 0:
        return requested_mask
    if target_tier == TIER_GOLD:
        return PRODUCT_BLINKSCRIBE | PRODUCT_VOXSCRIBE
    return PRODUCT_BLINKSCRIBE


def _amount_to_cents(amount_raw: str) -> int:
    try:
        cents = int((Decimal(str(amount_raw).strip()) * 100).quantize(Decimal("1")))
    except (InvalidOperation, ValueError) as exc:
        raise ValueError(f"Invalid --amount value: {amount_raw}") from exc
    if cents == 0:
        raise ValueError("--amount must be non-zero")
    return cents


def _record_donation_local(args: argparse.Namespace) -> dict[str, Any]:
    clean_email = args.email.strip().lower()
    if not clean_email:
        raise ValueError("--email must not be empty")

    delta_cents = _amount_to_cents(args.amount)
    ledger_path = Path(args.ledger_file) if args.ledger_file else (_SCRIPT_DIR / ".donor_ledger.json")
    ledger: dict[str, Any] = {}
    if ledger_path.exists():
        with open(ledger_path, "r", encoding="utf-8") as f:
            ledger = json.load(f)

    email_sha256 = hashlib.sha256(clean_email.encode("utf-8")).hexdigest()
    donor_key = f"donor:{email_sha256}"
    lic_id_hex = email_sha256[:16]
    lic_key = f"lic:{lic_id_hex}"
    now_sec = int(time.time())

    record = ledger.get(donor_key) or {
        "email": clean_email,
        "email_sha256": email_sha256,
        "license_id_hex": lic_id_hex,
        "total_cents": 0,
        "highest_tier_code": 0,
        "highest_product_mask": 0,
        "revoked": False,
        "transactions": {},
    }
    transactions = record.setdefault("transactions", {})

    if args.tx_id and args.tx_id in transactions:
        return {
            "ok": True,
            "duplicate": True,
            "upgraded": False,
            "revoked": bool(record.get("revoked", False)),
            "email": clean_email,
            "total_cents": record["total_cents"],
            "total_usd": f"{record['total_cents'] / 100:.2f}",
            "highest_tier_code": record["highest_tier_code"],
            "tier_name": TIER_NAMES.get(record["highest_tier_code"], "None"),
            "product_mask": record["highest_product_mask"],
            "license_id_hex": lic_id_hex,
            "license_key": None,
        }

    record["total_cents"] = max(0, int(record["total_cents"]) + delta_cents)
    if args.tx_id:
        transactions[args.tx_id] = {
            "amount_cents": delta_cents,
            "ts": now_sec,
            "source": args.source,
        }

    prev_tier = int(record.get("highest_tier_code", 0))
    prev_mask = int(record.get("highest_product_mask", 0))
    just_revoked = False

    if delta_cents < 0 and prev_tier > 0:
        if record["total_cents"] < TIER_THRESHOLD_CENTS.get(prev_tier, 0):
            lic_rec = ledger.get(lic_key) or {"license_id_hex": lic_id_hex}
            lic_rec["revoked"] = True
            lic_rec["revoked_ts"] = now_sec
            ledger[lic_key] = lic_rec
            record["revoked"] = True
            record["highest_tier_code"] = 0
            record["highest_product_mask"] = 0
            just_revoked = True

    target_tier = tier_from_cents(record["total_cents"])
    upgraded = False
    license_key: str | None = None

    if not just_revoked and target_tier > 0 and tier_rank(target_tier) > tier_rank(record["highest_tier_code"]):
        seed32 = load_master_seed(args.seed_hex)
        requested_mask = parse_apps_mask(args.apps)
        resolved_mask = resolve_upgrade_mask(target_tier, prev_tier, prev_mask, requested_mask)
        expires_ts = (now_sec + args.days * 86400) if args.days > 0 else 0
        payload = LicensePayload(
            version=1,
            product_mask=resolved_mask,
            tier_code=target_tier,
            issued_ts=now_sec,
            expires_ts=expires_ts,
            license_id_hex=lic_id_hex,
        )
        license_key = encode_license_key(payload, seed32)
        record["highest_tier_code"] = target_tier
        record["highest_product_mask"] = resolved_mask
        record["revoked"] = False
        record["latest_license_key"] = license_key
        upgraded = True

        if lic_key in ledger:
            ledger[lic_key]["revoked"] = False
            ledger[lic_key]["tier_code"] = target_tier
            ledger[lic_key]["max_seats"] = TIER_MAX_SEATS.get(target_tier, 1)

    ledger[donor_key] = record
    ledger_path.parent.mkdir(parents=True, exist_ok=True)
    with open(ledger_path, "w", encoding="utf-8") as f:
        json.dump(ledger, f, indent=2)

    cur_tier = int(record["highest_tier_code"])
    return {
        "ok": True,
        "upgraded": upgraded,
        "revoked": bool(record.get("revoked", False)),
        "email": clean_email,
        "total_cents": record["total_cents"],
        "total_usd": f"{record['total_cents'] / 100:.2f}",
        "previous_tier_code": prev_tier,
        "highest_tier_code": cur_tier,
        "tier_name": TIER_NAMES.get(cur_tier, "None"),
        "product_mask": record["highest_product_mask"],
        "max_seats": TIER_MAX_SEATS.get(cur_tier, 0) if cur_tier else 0,
        "license_id_hex": lic_id_hex,
        "license_key": license_key,
    }


def _record_donation_remote(args: argparse.Namespace) -> dict[str, Any]:
    token = args.admin_token or os.environ.get("ADMIN_API_TOKEN") or os.environ.get("SFL_ADMIN_API_TOKEN")
    if not token:
        raise ValueError("Remote --worker-url requires --admin-token or ADMIN_API_TOKEN env var")
    delta_cents = _amount_to_cents(args.amount)
    payload: dict[str, Any] = {
        "email": args.email.strip().lower(),
        "amount_cents": delta_cents,
        "source": args.source,
        "days": args.days,
    }
    if args.tx_id:
        payload["tx_id"] = args.tx_id
    if args.apps:
        payload["apps"] = args.apps

    endpoint = args.worker_url.rstrip("/") + "/api/donations/record"
    req = urllib.request.Request(
        endpoint,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Worker returned HTTP {exc.code}: {body}") from exc


def handle_record_donation(args: argparse.Namespace) -> None:
    if not args.email or args.amount is None:
        print("Error: --record-donation requires --email and --amount", file=sys.stderr)
        sys.exit(1)
    try:
        result = _record_donation_remote(args) if args.worker_url else _record_donation_local(args)
    except Exception as exc:
        print(f"Error recording donation: {exc}", file=sys.stderr)
        sys.exit(1)

    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print("SoloForge Labs Donor Ledger Updated:")
        print(f"  Email:      {result['email']}")
        print(f"  Total USD:  ${result['total_usd']} ({result['total_cents']} cents)")
        print(f"  Tier:       {result.get('tier_name', 'None')} (code={result['highest_tier_code']})")
        print(f"  Mask:       {result['product_mask']}")
        print(f"  Revoked:    {result['revoked']}")
        if result.get("license_key"):
            print(f"  New Key:    {result['license_key']}")


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
        default=None,
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
    parser.add_argument(
        "--record-donation",
        action="store_true",
        help="Record a cumulative donation/refund and mint upgraded SFL1-... key if tier rises",
    )
    parser.add_argument(
        "--email",
        type=str,
        default=None,
        help="Donor email address (required for --record-donation)",
    )
    parser.add_argument(
        "--amount",
        type=str,
        default=None,
        help="Donation delta in USD, e.g. 5.00 or -5.00 (required for --record-donation)",
    )
    parser.add_argument(
        "--tx-id",
        type=str,
        default=None,
        help="Optional unique transaction ID for idempotent deduplication",
    )
    parser.add_argument(
        "--source",
        type=str,
        default="manual",
        help="Donation source tag (default: manual)",
    )
    parser.add_argument(
        "--ledger-file",
        type=str,
        default=None,
        help="Local JSON ledger file path (default: scripts/.donor_ledger.json)",
    )
    parser.add_argument(
        "--worker-url",
        type=str,
        default=None,
        help="Remote worker base URL to POST /api/donations/record",
    )
    parser.add_argument(
        "--admin-token",
        type=str,
        default=None,
        help="Bearer token for --worker-url (or ADMIN_API_TOKEN env var)",
    )

    args = parser.parse_args()

    if args.record_donation:
        handle_record_donation(args)
        return

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
    apps_arg = args.apps if args.apps is not None else "blinkscribe"
    tier_lower = args.tier.lower()
    if tier_lower == "bronze":
        tier_code = TIER_BRONZE
        product_mask = PRODUCT_TRINITY_ALL
    elif tier_lower == "trinity":
        tier_code = 3
        product_mask = PRODUCT_TRINITY_ALL
    elif tier_lower == "duo":
        tier_code = 2
        product_mask = parse_apps_mask(apps_arg) or (PRODUCT_BLINKSCRIBE | PRODUCT_VOXSCRIBE)
    else:  # single
        tier_code = 1
        product_mask = parse_apps_mask(apps_arg) or PRODUCT_BLINKSCRIBE

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
