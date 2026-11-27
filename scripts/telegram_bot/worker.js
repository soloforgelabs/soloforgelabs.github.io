/**
 * SoloForge Labs — Unified Serverless Worker
 * ===========================================
 * Handles:
 * 1. Multi-Device Ed25519 Seat Licensing Ledger (/api/license/*)
 *    - /api/license/activate   : Registers/re-activates hardware seat (1/2/5 limits)
 *    - /api/license/deactivate : Frees hardware seat (idempotent 200 OK)
 *    - /api/license/replace    : Replaces old/dead PC seat (3/month cap + UTC rollover)
 * 2. Cumulative Donor Ledger & Automated Ed25519 Key Issuance
 *    - /api/webhooks/patreon   : Patreon v2 HMAC-MD5 webhook (pledge create/update/delete)
 *    - /api/donations/record   : Admin Bearer-authenticated donation/refund ledger endpoint
 * 3. Ko-fi to Telegram Notification Webhook (POST /)
 *    - 100% backward compatible with existing Ko-fi donation notifications
 */

// --- Crockford Base32 Alphabet & Aliases ---
const CROCKFORD_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const CROCKFORD_MAP = new Map();
for (let i = 0; i < CROCKFORD_ALPHABET.length; i++) {
  CROCKFORD_MAP.set(CROCKFORD_ALPHABET[i], BigInt(i));
}
// Crockford aliases (O -> 0, I/L -> 1)
CROCKFORD_MAP.set("O", 0n);
CROCKFORD_MAP.set("I", 1n);
CROCKFORD_MAP.set("L", 1n);

// Default SoloForge Labs official vendor public key hex (32 bytes)
export const DEFAULT_VENDOR_PUBLIC_KEY_HEX =
  "fb52fe1023cafc83445a6a07fdcb6a2618bd65a5001a7d7cdcf3d548a81f2a9a";

// RFC 8410 PKCS#8 Ed25519 DER prefix (16 bytes)
const ED25519_PKCS8_PREFIX_HEX = "302e020100300506032b657004220420";

// In-memory KV fallback for local testing / non-bound environments
const _inMemoryKv = new Map();

export function resetInMemoryKv() {
  _inMemoryKv.clear();
}

export function getInMemoryKvStore() {
  return _inMemoryKv;
}

// --- Byte / Hex Helpers ---

export function hexToBytes(hex) {
  const clean = hex.trim().toLowerCase();
  if (clean.length % 2 !== 0) {
    throw new Error(`Invalid hex string length: ${clean.length}`);
  }
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16);
  }
  return bytes;
}

export function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function concatUint8Arrays(a, b) {
  const c = new Uint8Array(a.length + b.length);
  c.set(a, 0);
  c.set(b, a.length);
  return c;
}

// --- BigInt Crockford Base32 Decoder ---

/**
 * Decodes an SFL1-... Crockford Base32 formatted license key into raw bytes using BigInt.
 * Avoids JavaScript 32-bit bitwise truncation and handles 704-bit (88-byte) payload + signature.
 */
export function decodeLicenseKey(keyStr, expectedLen = 88) {
  if (typeof keyStr !== "string") {
    throw new Error("Invalid key: must be a string");
  }
  let cleaned = keyStr.trim().toUpperCase().replace(/[\s-]/g, "");
  if (
    cleaned.startsWith("SFL1") ||
    cleaned.startsWith("SFLI") ||
    cleaned.startsWith("SFLL")
  ) {
    cleaned = cleaned.slice(4);
  }
  if (cleaned.length !== 141) {
    throw new Error(
      `Invalid key length: expected 141 base32 characters, got ${cleaned.length}`
    );
  }

  let val = 0n;
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    const digit = CROCKFORD_MAP.get(ch);
    if (digit === undefined) {
      throw new Error(`Invalid character in Crockford Base32: ${ch}`);
    }
    val = (val << 5n) | digit;
  }

  const pad = BigInt((5 - ((expectedLen * 8) % 5)) % 5); // 1n for 88 bytes
  val >>= pad;

  const bytes = new Uint8Array(expectedLen);
  for (let i = expectedLen - 1; i >= 0; i--) {
    bytes[i] = Number(val & 0xffn);
    val >>= 8n;
  }
  return bytes;
}

// --- Ed25519 Key Verification & Payload Unpacking ---

/**
 * Verifies and decodes an SFL1-... license key using WebCrypto Ed25519.
 * Returns unpacked payload or null if invalid, expired, or tampered.
 */
export async function verifyAndDecodeLicenseKey(keyStr, env = {}, nowSec = null) {
  if (!keyStr || typeof keyStr !== "string") {
    return null;
  }

  let rawBytes;
  try {
    rawBytes = decodeLicenseKey(keyStr, 88);
  } catch {
    return null;
  }

  const payloadBytes = rawBytes.slice(0, 24);
  const sigBytes = rawBytes.slice(24, 88);

  const view = new DataView(
    payloadBytes.buffer,
    payloadBytes.byteOffset,
    payloadBytes.byteLength
  );
  const magic = view.getUint8(0);
  const version = view.getUint8(1);
  const productMask = view.getUint16(2, false); // big-endian
  const tierCode = view.getUint32(4, false);
  const issuedTs = view.getUint32(8, false);
  const expiresTs = view.getUint32(12, false);
  const licenseIdBytes = payloadBytes.slice(16, 24);
  const licenseIdHex = bytesToHex(licenseIdBytes).toLowerCase();

  // Validate magic ('S' = 0x53) and version (1)
  if (magic !== 0x53 || version !== 1) {
    return null;
  }

  // Validate expiration timestamp if non-zero
  const currentTs = nowSec !== null ? nowSec : Math.floor(Date.now() / 1000);
  if (expiresTs > 0 && currentTs > expiresTs) {
    return null;
  }

  // Verify Ed25519 signature
  const pubKeyHex =
    (env && env.SFL_VENDOR_PUBLIC_KEY_HEX) || DEFAULT_VENDOR_PUBLIC_KEY_HEX;
  let pubKeyBytes;
  try {
    pubKeyBytes = hexToBytes(pubKeyHex);
  } catch {
    return null;
  }

  let cryptoKey;
  try {
    cryptoKey = await crypto.subtle.importKey(
      "raw",
      pubKeyBytes,
      { name: "Ed25519" },
      false,
      ["verify"]
    );
  } catch (err) {
    console.error("Failed to import Ed25519 public key:", err);
    return null;
  }

  const domainPrefix = new TextEncoder().encode("SFL-LIC-V1:");
  const signedMsg = concatUint8Arrays(domainPrefix, payloadBytes);

  let isValid = false;
  try {
    isValid = await crypto.subtle.verify(
      { name: "Ed25519" },
      cryptoKey,
      sigBytes,
      signedMsg
    );
  } catch (err) {
    console.error("Ed25519 verification error:", err);
    return null;
  }

  if (!isValid) {
    return null;
  }

  const maxSeats = tierCode === 3 ? 5 : tierCode === 2 ? 2 : 1;

  return {
    magic,
    version,
    product_mask: productMask,
    tier_code: tierCode,
    issued_ts: issuedTs,
    expires_ts: expiresTs,
    license_id_hex: licenseIdHex,
    max_seats: maxSeats,
  };
}

// --- Ed25519 License Key Encoder ---

/**
 * Encodes a license payload into SFL1-... Crockford Base32 format signed with Ed25519 seed.
 * Mirrors soloforge_desktop.license_keys.encode_license_key ("SFL-LIC-V1:" + 24-byte big-endian payload).
 */
export async function encodeLicenseKey(payload, seedHex) {
  if (!seedHex || typeof seedHex !== "string") {
    throw new Error(
      "Cannot encode license key: SFL_LICENSE_PRIVATE_SEED_HEX is not configured"
    );
  }

  const version = payload?.version ?? 1;
  const productMask = Number(payload?.product_mask);
  const tierCode = Number(payload?.tier_code);
  const issuedTs = Number(payload?.issued_ts);
  const expiresTs = Number(payload?.expires_ts ?? 0);
  const licIdHex = String(payload?.license_id_hex || "")
    .trim()
    .toLowerCase();

  if (version !== 1) {
    throw new Error(`Unsupported license version: ${version}`);
  }
  if (!Number.isInteger(productMask) || productMask < 0 || productMask > 0xffff) {
    throw new Error(`Invalid product_mask: ${payload?.product_mask}`);
  }
  if (!Number.isInteger(tierCode) || tierCode < 1) {
    throw new Error(`Invalid tier_code: ${payload?.tier_code}`);
  }
  if (!Number.isInteger(issuedTs) || issuedTs < 0) {
    throw new Error(`Invalid issued_ts: ${payload?.issued_ts}`);
  }
  if (!Number.isInteger(expiresTs) || expiresTs < 0) {
    throw new Error(`Invalid expires_ts: ${payload?.expires_ts}`);
  }
  if (!/^[0-9a-f]{16}$/.test(licIdHex)) {
    throw new Error("license_id_hex must be exactly 16 hex characters (8 bytes)");
  }

  const cleanSeedHex = seedHex.trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(cleanSeedHex)) {
    throw new Error("seedHex must be exactly 64 hex characters (32 bytes)");
  }

  const payloadBytes = new Uint8Array(24);
  const view = new DataView(payloadBytes.buffer);
  view.setUint8(0, 0x53); // 'S'
  view.setUint8(1, version);
  view.setUint16(2, productMask, false);
  view.setUint32(4, tierCode >>> 0, false);
  view.setUint32(8, issuedTs >>> 0, false);
  view.setUint32(12, expiresTs >>> 0, false);
  payloadBytes.set(hexToBytes(licIdHex), 16);

  const pkcs8Bytes = hexToBytes(ED25519_PKCS8_PREFIX_HEX + cleanSeedHex);
  const privKey = await crypto.subtle.importKey(
    "pkcs8",
    pkcs8Bytes,
    { name: "Ed25519" },
    false,
    ["sign"]
  );

  const domainPrefix = new TextEncoder().encode("SFL-LIC-V1:");
  const signedMsg = concatUint8Arrays(domainPrefix, payloadBytes);
  const sigBuf = await crypto.subtle.sign({ name: "Ed25519" }, privKey, signedMsg);
  const sigBytes = new Uint8Array(sigBuf);

  const rawToken = concatUint8Arrays(payloadBytes, sigBytes); // 88 bytes
  let val = 0n;
  for (let i = 0; i < rawToken.length; i++) {
    val = (val << 8n) | BigInt(rawToken[i]);
  }
  const totalBits = rawToken.length * 8; // 704
  const pad = (5 - (totalBits % 5)) % 5; // 1
  val <<= BigInt(pad);
  const numChars = (totalBits + pad) / 5; // 141

  let enc = "";
  for (let i = numChars - 1; i >= 0; i--) {
    enc += CROCKFORD_ALPHABET[Number((val >> BigInt(i * 5)) & 31n)];
  }

  const blocks = [];
  for (let i = 0; i < enc.length; i += 5) {
    blocks.push(enc.slice(i, i + 5));
  }
  return "SFL1-" + blocks.join("-");
}

// --- Pure-JS RFC 1321 MD5 & RFC 2104 HMAC-MD5 ---

const MD5_SHIFTS = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
];

const MD5_K = new Uint32Array(64);
for (let i = 0; i < 64; i++) {
  MD5_K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000) >>> 0;
}

function toUtf8Bytes(input) {
  if (input instanceof Uint8Array) return input;
  return new TextEncoder().encode(String(input));
}

function md5RoundTerm(i, b, c, d) {
  if (i < 16) return [((b & c) | (~b & d)) >>> 0, i];
  if (i < 32) return [((d & b) | (~d & c)) >>> 0, (5 * i + 1) % 16];
  if (i < 48) return [(b ^ c ^ d) >>> 0, (3 * i + 5) % 16];
  return [(c ^ (b | ~d)) >>> 0, (7 * i) % 16];
}

export function md5Bytes(input) {
  const src = toUtf8Bytes(input);
  const origLen = src.length;
  const paddedLen = Math.ceil((origLen + 9) / 64) * 64;
  const buf = new Uint8Array(paddedLen);
  buf.set(src, 0);
  buf[origLen] = 0x80;

  const bitLen = origLen * 8;
  const lenView = new DataView(buf.buffer);
  lenView.setUint32(paddedLen - 8, bitLen >>> 0, true);
  lenView.setUint32(paddedLen - 4, Math.floor(bitLen / 0x100000000) >>> 0, true);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;
  const words = new Uint32Array(16);

  for (let offset = 0; offset < paddedLen; offset += 64) {
    for (let j = 0; j < 16; j++) {
      words[j] = lenView.getUint32(offset + j * 4, true);
    }
    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;

    for (let i = 0; i < 64; i++) {
      const [f, g] = md5RoundTerm(i, b, c, d);
      const sum = (a + f + MD5_K[i] + words[g]) >>> 0;
      const shift = MD5_SHIFTS[i];
      const rot = ((sum << shift) | (sum >>> (32 - shift))) >>> 0;
      a = d;
      d = c;
      c = b;
      b = (b + rot) >>> 0;
    }

    a0 = (a0 + a) >>> 0;
    b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0;
    d0 = (d0 + d) >>> 0;
  }

  const out = new Uint8Array(16);
  const outView = new DataView(out.buffer);
  outView.setUint32(0, a0, true);
  outView.setUint32(4, b0, true);
  outView.setUint32(8, c0, true);
  outView.setUint32(12, d0, true);
  return out;
}

export function hmacMd5Hex(secret, message) {
  let keyBytes = toUtf8Bytes(secret);
  if (keyBytes.length > 64) {
    keyBytes = md5Bytes(keyBytes);
  }
  const ipad = new Uint8Array(64);
  const opad = new Uint8Array(64);
  for (let i = 0; i < 64; i++) {
    const k = i < keyBytes.length ? keyBytes[i] : 0;
    ipad[i] = k ^ 0x36;
    opad[i] = k ^ 0x5c;
  }
  const inner = md5Bytes(concatUint8Arrays(ipad, toUtf8Bytes(message)));
  const outer = md5Bytes(concatUint8Arrays(opad, inner));
  return bytesToHex(outer);
}

function constantTimeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const enc = new TextEncoder();
  const bytesA = enc.encode(a);
  const bytesB = enc.encode(b);
  let diff = bytesA.length ^ bytesB.length;
  const maxLen = Math.max(bytesA.length, bytesB.length);
  for (let i = 0; i < maxLen; i++) {
    const ba = i < bytesA.length ? bytesA[i] : 0;
    const bb = i < bytesB.length ? bytesB[i] : 0;
    diff |= ba ^ bb;
  }
  return diff === 0;
}

async function sha256Hex(text) {
  const digest = await crypto.subtle.digest("SHA-256", toUtf8Bytes(text));
  return bytesToHex(new Uint8Array(digest));
}

// --- Asymmetric Ed25519 Seat Certificate Signing ---

/**
 * Signs a hardware seat certificate using the master Ed25519 private seed.
 * Canonical message: "SFL-SEAT-V1:{license_id_hex}:{hw_id}:{tier_code}:{issued_ts}"
 */
export async function signSeatCertificate(
  licenseIdHex,
  hwId,
  tierCode,
  issuedTs,
  seedHex
) {
  if (!seedHex || typeof seedHex !== "string") {
    throw new Error(
      "Cannot sign seat certificate: SFL_LICENSE_PRIVATE_SEED_HEX is not configured"
    );
  }

  const cleanLicId = licenseIdHex.trim().toLowerCase();
  const cleanHwId = hwId.trim().toLowerCase();
  const canonicalMsg = `SFL-SEAT-V1:${cleanLicId}:${cleanHwId}:${Number(tierCode)}:${Number(issuedTs)}`;

  const pkcs8Hex = ED25519_PKCS8_PREFIX_HEX + seedHex.trim().toLowerCase();
  const pkcs8Bytes = hexToBytes(pkcs8Hex);

  const privKey = await crypto.subtle.importKey(
    "pkcs8",
    pkcs8Bytes,
    { name: "Ed25519" },
    false,
    ["sign"]
  );

  const msgBytes = new TextEncoder().encode(canonicalMsg);
  const sigBuf = await crypto.subtle.sign({ name: "Ed25519" }, privKey, msgBytes);
  const sigHex = bytesToHex(new Uint8Array(sigBuf));

  return {
    v: 1,
    license_id_hex: cleanLicId,
    hw_id: cleanHwId,
    tier_code: Number(tierCode),
    issued_ts: Number(issuedTs),
    sig_hex: sigHex,
  };
}

// --- KV Storage Helpers ---

async function getKv(env, key) {
  if (env && env.LICENSE_KV && typeof env.LICENSE_KV.get === "function") {
    return await env.LICENSE_KV.get(key, "json");
  }
  const raw = _inMemoryKv.get(key);
  return raw ? JSON.parse(raw) : null;
}

async function putKv(env, key, value) {
  const valStr = JSON.stringify(value);
  if (env && env.LICENSE_KV && typeof env.LICENSE_KV.put === "function") {
    await env.LICENSE_KV.put(key, valStr);
  } else {
    _inMemoryKv.set(key, valStr);
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

// --- License Routing & Handlers ---

const APP_PRODUCT_BITS = {
  blinkscribe: 1,
  deskscribe: 2,
  voxscribe: 4,
};

async function handleLicenseRouting(request, env, ctx, pathname) {
  if (request.method !== "POST") {
    return jsonResponse(
      { ok: false, error: "Method Not Allowed. Use POST." },
      405
    );
  }

  if (pathname === "/api/license/activate") {
    return await handleActivate(request, env, ctx);
  }
  if (pathname === "/api/license/deactivate") {
    return await handleDeactivate(request, env, ctx);
  }
  if (pathname === "/api/license/replace") {
    return await handleReplace(request, env, ctx);
  }

  return jsonResponse({ ok: false, error: "Not Found" }, 404);
}

async function handleActivate(request, env, ctx) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: "Invalid JSON body" }, 400);
  }

  const { license_key, hw_id, device_name, app_id } = body || {};
  if (
    !license_key ||
    typeof license_key !== "string" ||
    !hw_id ||
    typeof hw_id !== "string"
  ) {
    return jsonResponse(
      { ok: false, error: "Missing required fields: license_key and hw_id" },
      400
    );
  }

  const payload = await verifyAndDecodeLicenseKey(license_key, env);
  if (!payload) {
    return jsonResponse(
      {
        ok: false,
        error_code: "invalid_key",
        message: "Invalid, corrupted, or expired license key.",
      },
      401
    );
  }

  // Validate app_id against product_mask if provided
  if (app_id && typeof app_id === "string") {
    const cleanApp = app_id.trim().toLowerCase();
    const bit = APP_PRODUCT_BITS[cleanApp] || 0;
    if (bit && (payload.product_mask & bit) === 0) {
      return jsonResponse(
        {
          ok: false,
          error_code: "app_not_unlocked",
          message: `License does not unlock requested app: ${app_id}`,
        },
        403
      );
    }
  }

  const cleanHwId = hw_id.trim().toLowerCase();
  const cleanDeviceName =
    device_name && typeof device_name === "string"
      ? device_name.trim()
      : "Unknown PC";
  const nowSec = Math.floor(Date.now() / 1000);
  const kvKey = "lic:" + payload.license_id_hex;

  let record = await getKv(env, kvKey);
  if (record?.revoked === true) {
    return jsonResponse(
      {
        ok: false,
        error_code: "license_revoked",
        message: "This license key has been revoked.",
      },
      403
    );
  }
  if (!record) {
    record = {
      license_id_hex: payload.license_id_hex,
      tier_code: payload.tier_code,
      max_seats: payload.max_seats,
      active_devices: [],
      replacements_month: "",
      replacements_count: 0,
    };
  }

  if (!Array.isArray(record.active_devices)) {
    record.active_devices = [];
  }

  const existingIdx = record.active_devices.findIndex(
    (d) => d.hw_id.toLowerCase() === cleanHwId
  );

  let seatCert = null;
  if (env && env.SFL_LICENSE_PRIVATE_SEED_HEX) {
    seatCert = await signSeatCertificate(
      payload.license_id_hex,
      cleanHwId,
      payload.tier_code,
      payload.issued_ts,
      env.SFL_LICENSE_PRIVATE_SEED_HEX
    );
  }

  // Windows Reinstall Idempotency: same hw_id already in active_devices
  // Refresh device_name and last_seen_ts, return 200 OK even if record.active_devices.length === max_seats
  if (existingIdx !== -1) {
    record.active_devices[existingIdx].device_name =
      cleanDeviceName || record.active_devices[existingIdx].device_name;
    record.active_devices[existingIdx].last_seen_ts = nowSec;
    await putKv(env, kvKey, record);

    return jsonResponse(
      {
        ok: true,
        message: "Device re-activated successfully.",
        seats_used: record.active_devices.length,
        max_seats: payload.max_seats,
        active_devices: record.active_devices,
        seat_cert: seatCert,
      },
      200
    );
  }

  // Capacity check for new hardware fingerprint
  if (record.active_devices.length >= payload.max_seats) {
    return jsonResponse(
      {
        ok: false,
        error_code: "seat_limit_reached",
        message: "Maximum active PCs reached for this license.",
        seats_used: record.active_devices.length,
        max_seats: payload.max_seats,
        active_devices: record.active_devices,
      },
      409
    );
  }

  record.active_devices.push({
    hw_id: cleanHwId,
    device_name: cleanDeviceName,
    activated_ts: nowSec,
    last_seen_ts: nowSec,
  });

  await putKv(env, kvKey, record);

  return jsonResponse(
    {
      ok: true,
      message: "Device activated successfully.",
      seats_used: record.active_devices.length,
      max_seats: payload.max_seats,
      active_devices: record.active_devices,
      seat_cert: seatCert,
    },
    200
  );
}

async function handleDeactivate(request, env, ctx) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: "Invalid JSON body" }, 400);
  }

  const { license_key, hw_id } = body || {};
  if (
    !license_key ||
    typeof license_key !== "string" ||
    !hw_id ||
    typeof hw_id !== "string"
  ) {
    return jsonResponse(
      { ok: false, error: "Missing required fields: license_key and hw_id" },
      400
    );
  }

  const payload = await verifyAndDecodeLicenseKey(license_key, env);
  if (!payload) {
    return jsonResponse(
      {
        ok: false,
        error_code: "invalid_key",
        message: "Invalid, corrupted, or expired license key.",
      },
      401
    );
  }

  const cleanHwId = hw_id.trim().toLowerCase();
  const kvKey = "lic:" + payload.license_id_hex;
  let record = await getKv(env, kvKey);

  if (record && Array.isArray(record.active_devices)) {
    record.active_devices = record.active_devices.filter(
      (d) => d.hw_id.toLowerCase() !== cleanHwId
    );
    await putKv(env, kvKey, record);
  }

  const seatsUsed =
    record && Array.isArray(record.active_devices)
      ? record.active_devices.length
      : 0;
  const activeDevices =
    record && Array.isArray(record.active_devices)
      ? record.active_devices
      : [];

  return jsonResponse(
    {
      ok: true,
      message: "Device deactivated successfully. Seat freed.",
      seats_used: seatsUsed,
      max_seats: payload.max_seats,
      active_devices: activeDevices,
    },
    200
  );
}

async function handleReplace(request, env, ctx) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: "Invalid JSON body" }, 400);
  }

  const { license_key, old_hw_id, new_hw_id, new_device_name, app_id } =
    body || {};
  if (!license_key || !old_hw_id || !new_hw_id) {
    return jsonResponse(
      {
        ok: false,
        error: "Missing required fields: license_key, old_hw_id, and new_hw_id",
      },
      400
    );
  }

  const payload = await verifyAndDecodeLicenseKey(license_key, env);
  if (!payload) {
    return jsonResponse(
      {
        ok: false,
        error_code: "invalid_key",
        message: "Invalid, corrupted, or expired license key.",
      },
      401
    );
  }

  if (app_id && typeof app_id === "string") {
    const cleanApp = app_id.trim().toLowerCase();
    const bit = APP_PRODUCT_BITS[cleanApp] || 0;
    if (bit && (payload.product_mask & bit) === 0) {
      return jsonResponse(
        {
          ok: false,
          error_code: "app_not_unlocked",
          message: `License does not unlock requested app: ${app_id}`,
        },
        403
      );
    }
  }

  const cleanOldHwId = old_hw_id.trim().toLowerCase();
  const cleanNewHwId = new_hw_id.trim().toLowerCase();
  const cleanNewDeviceName =
    new_device_name && typeof new_device_name === "string"
      ? new_device_name.trim()
      : "New PC";
  const nowSec = Math.floor(Date.now() / 1000);
  const kvKey = "lic:" + payload.license_id_hex;

  let record = await getKv(env, kvKey);
  if (record?.revoked === true) {
    return jsonResponse(
      {
        ok: false,
        error_code: "license_revoked",
        message: "This license key has been revoked.",
      },
      403
    );
  }
  if (!record) {
    record = {
      license_id_hex: payload.license_id_hex,
      tier_code: payload.tier_code,
      max_seats: payload.max_seats,
      active_devices: [],
      replacements_month: "",
      replacements_count: 0,
    };
  }

  if (!Array.isArray(record.active_devices)) {
    record.active_devices = [];
  }

  const oldIdx = record.active_devices.findIndex(
    (d) => d.hw_id.toLowerCase() === cleanOldHwId
  );
  if (oldIdx === -1) {
    return jsonResponse(
      {
        ok: false,
        error_code: "device_not_found",
        message: "Old device not found in active devices list.",
        active_devices: record.active_devices,
      },
      404
    );
  }

  const oldDevice = record.active_devices[oldIdx];

  // Monthly replacement cap (3/month) with UTC YYYY-MM rollover
  const currentMonth = new Date(nowSec * 1000).toISOString().slice(0, 7);
  if (record.replacements_month !== currentMonth) {
    record.replacements_month = currentMonth;
    record.replacements_count = 0;
  }

  if (record.replacements_count >= 3) {
    return jsonResponse(
      {
        ok: false,
        error_code: "replacement_limit_reached",
        message:
          "Monthly device replacement limit reached (3 per month). Please contact support.",
        replacements_count: record.replacements_count,
        replacements_month: record.replacements_month,
        active_devices: record.active_devices,
      },
      429
    );
  }

  // Evict old device and add new device
  record.active_devices = record.active_devices.filter(
    (d) => d.hw_id.toLowerCase() !== cleanOldHwId
  );
  record.active_devices = record.active_devices.filter(
    (d) => d.hw_id.toLowerCase() !== cleanNewHwId
  );
  record.active_devices.push({
    hw_id: cleanNewHwId,
    device_name: cleanNewDeviceName,
    activated_ts: nowSec,
    last_seen_ts: nowSec,
  });

  record.replacements_count += 1;
  await putKv(env, kvKey, record);

  // Optional non-blocking Telegram notification
  if (env && env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    const notifyPromise = sendTelegramDeviceReplacement(
      env,
      payload.license_id_hex,
      oldDevice,
      { hw_id: cleanNewHwId, device_name: cleanNewDeviceName },
      record.replacements_count
    ).catch((err) =>
      console.error("Telegram replacement notification error:", err)
    );
    if (ctx && typeof ctx.waitUntil === "function") {
      ctx.waitUntil(notifyPromise);
    }
  }

  let seatCert = null;
  if (env && env.SFL_LICENSE_PRIVATE_SEED_HEX) {
    seatCert = await signSeatCertificate(
      payload.license_id_hex,
      cleanNewHwId,
      payload.tier_code,
      payload.issued_ts,
      env.SFL_LICENSE_PRIVATE_SEED_HEX
    );
  }

  return jsonResponse(
    {
      ok: true,
      message: "Device replaced successfully.",
      seats_used: record.active_devices.length,
      max_seats: payload.max_seats,
      active_devices: record.active_devices,
      replacements_count: record.replacements_count,
      seat_cert: seatCert,
    },
    200
  );
}

async function sendTelegramDeviceReplacement(
  env,
  licenseIdHex,
  oldDevice,
  newDevice,
  count
) {
  const botToken = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) return;

  const oldName = escapeHtml(oldDevice.device_name || "Unknown");
  const oldHwShort = escapeHtml(oldDevice.hw_id.slice(0, 8));
  const newName = escapeHtml(newDevice.device_name || "Unknown");
  const newHwShort = escapeHtml(newDevice.hw_id.slice(0, 8));

  const text = `🔄 <b>SoloForge Labs: Перенос лицензии на новый ПК</b>
━━━━━━━━━━━━━━━━━━━━
🔑 <b>License ID:</b> <code>${escapeHtml(licenseIdHex)}</code>
🖥 <b>Старый ПК:</b> <code>${oldName} (${oldHwShort}...)</code>
💻 <b>Новый ПК:</b> <code>${newName} (${newHwShort}...)</code>
📊 <b>Переносов в этом месяце:</b> ${count} / 3
📅 <b>Время:</b> ${new Date().toISOString()}`;

  const tgUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
  await fetch(tgUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: "HTML",
    }),
  });
}

// --- Cumulative Donor Ledger, Patreon Webhook & Admin Recording ---

export const TIER_SILVER = 1;
export const TIER_GOLD = 2;
export const TIER_PLATINUM = 3;
export const TIER_BRONZE = 4;

export const PRODUCT_BLINKSCRIBE = 1;
export const PRODUCT_DESKSCRIBE = 2;
export const PRODUCT_VOXSCRIBE = 4;
export const PRODUCT_TRINITY_ALL = 7;

export const TIER_RANK = { 4: 1, 1: 2, 2: 3, 3: 4 };
const TIER_THRESHOLD_CENTS = { 4: 300, 1: 500, 2: 1300, 3: 1500 };
const TIER_NAMES = {
  1: "Single Edition",
  2: "Duo Pack",
  3: "Scribe Trinity",
  4: "Bronze Supporter",
};
const TIER_MAX_SEATS = { 1: 1, 2: 2, 3: 5, 4: 1 };

export function tierRank(tierCode) {
  return TIER_RANK[Number(tierCode)] || 0;
}

export function tierFromCents(totalCents) {
  if (totalCents >= 1500) return TIER_PLATINUM;
  if (totalCents >= 1300) return TIER_GOLD;
  if (totalCents >= 500) return TIER_SILVER;
  if (totalCents >= 300) return TIER_BRONZE;
  return 0;
}

export function resolveUpgradeMask(targetTier, prevTier, prevMask, requestedMask) {
  if (targetTier === TIER_BRONZE || targetTier === TIER_PLATINUM) {
    return PRODUCT_TRINITY_ALL;
  }
  const isPaidAiPrev =
    prevTier === TIER_SILVER ||
    prevTier === TIER_GOLD ||
    prevTier === TIER_PLATINUM;
  if (isPaidAiPrev && Number.isInteger(prevMask) && prevMask > 0) {
    return requestedMask > 0 ? prevMask | requestedMask : prevMask;
  }
  if (Number.isInteger(requestedMask) && requestedMask > 0) {
    return requestedMask;
  }
  return targetTier === TIER_GOLD
    ? PRODUCT_BLINKSCRIBE | PRODUCT_VOXSCRIBE
    : PRODUCT_BLINKSCRIBE;
}

function parseRequestedMask(apps, productMask) {
  if (productMask !== undefined && productMask !== null && productMask !== "") {
    const parsed = Number(productMask);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed & 0xffff;
    }
  }
  if (!apps) return 0;
  const list = Array.isArray(apps)
    ? apps
    : String(apps)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
  let mask = 0;
  for (const app of list) {
    mask |= APP_PRODUCT_BITS[String(app).trim().toLowerCase()] || 0;
  }
  return mask;
}

async function revokeLicenseRecord(env, licenseIdHex, nowSec) {
  if (!licenseIdHex) return;
  const licKvKey = "lic:" + licenseIdHex;
  let licRecord = await getKv(env, licKvKey);
  if (!licRecord) {
    licRecord = {
      license_id_hex: licenseIdHex,
      tier_code: 0,
      max_seats: 1,
      active_devices: [],
      replacements_month: "",
      replacements_count: 0,
    };
  }
  licRecord.revoked = true;
  licRecord.revoked_ts = nowSec;
  await putKv(env, licKvKey, licRecord);
}

async function sendTelegramTierUpgrade(env, details) {
  const botToken = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) return;

  const prevLabel = TIER_NAMES[details.previousTier] || "None";
  const nextLabel = TIER_NAMES[details.newTier] || `Tier ${details.newTier}`;
  const totalUsd = (details.totalCents / 100).toFixed(2);
  const text = `🎉 <b>SoloForge Labs: Выдан / обновлён лицензионный ключ</b>
━━━━━━━━━━━━━━━━━━━━
📧 <b>Donor:</b> <code>${escapeHtml(details.email)}</code>
💰 <b>Total USD:</b> $${totalUsd}
🏷 <b>Tier:</b> ${escapeHtml(prevLabel)} → <b>${escapeHtml(nextLabel)}</b>
📡 <b>Source:</b> ${escapeHtml(details.source)}
🔑 <b>Key:</b> <code>${escapeHtml(details.licenseKey)}</code>`;

  const tgUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
  await fetch(tgUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    }),
  });
}

async function applyDonorContribution(env, ctx, params) {
  const cleanEmail = params.email.trim().toLowerCase();
  const nowSec = Math.floor(Date.now() / 1000);
  const emailSha256 = await sha256Hex(cleanEmail);
  const donorKvKey = "donor:" + emailSha256;
  const licenseIdHex = emailSha256.slice(0, 16);

  let record = await getKv(env, donorKvKey);
  if (!record) {
    record = {
      email: cleanEmail,
      email_sha256: emailSha256,
      license_id_hex: licenseIdHex,
      total_cents: 0,
      highest_tier_code: 0,
      highest_product_mask: 0,
      revoked: false,
      transactions: {},
      patreon_pledges: {},
    };
  }
  record.transactions = record.transactions || {};
  record.patreon_pledges = record.patreon_pledges || {};

  if (
    params.txId &&
    Object.prototype.hasOwnProperty.call(record.transactions, params.txId)
  ) {
    return jsonResponse(
      {
        ok: true,
        duplicate: true,
        upgraded: false,
        revoked: Boolean(record.revoked),
        email: cleanEmail,
        total_cents: record.total_cents,
        total_usd: (record.total_cents / 100).toFixed(2),
        highest_tier_code: record.highest_tier_code,
        tier_code: record.highest_tier_code,
        product_mask: record.highest_product_mask,
        license_id_hex: licenseIdHex,
        license_key: null,
      },
      200
    );
  }

  let deltaCents = params.deltaCents;
  if (params.pledgeUpdate) {
    const { pledgeId, newCents, eventName } = params.pledgeUpdate;
    const prevEntry = record.patreon_pledges[pledgeId];
    const prevCents = prevEntry ? Number(prevEntry.last_entitled_cents) || 0 : 0;
    deltaCents = newCents - prevCents;
    record.patreon_pledges[pledgeId] = {
      last_entitled_cents: newCents,
      updated_ts: nowSec,
      last_event: eventName,
    };
    if (deltaCents === 0) {
      await putKv(env, donorKvKey, record);
      return jsonResponse(
        {
          ok: true,
          duplicate: true,
          idempotent: true,
          upgraded: false,
          revoked: Boolean(record.revoked),
          email: cleanEmail,
          total_cents: record.total_cents,
          total_usd: (record.total_cents / 100).toFixed(2),
          highest_tier_code: record.highest_tier_code,
          tier_code: record.highest_tier_code,
          product_mask: record.highest_product_mask,
          license_id_hex: licenseIdHex,
          license_key: null,
        },
        200
      );
    }
  }

  record.total_cents = Math.max(0, (Number(record.total_cents) || 0) + deltaCents);
  if (params.txId) {
    record.transactions[params.txId] = {
      amount_cents: deltaCents,
      ts: nowSec,
      source: params.source,
    };
  }

  const prevTierCode = Number(record.highest_tier_code) || 0;
  const prevMask = Number(record.highest_product_mask) || 0;
  let justRevoked = false;

  if (deltaCents < 0 && prevTierCode > 0) {
    const requiredCents = TIER_THRESHOLD_CENTS[prevTierCode] || 0;
    if (record.total_cents < requiredCents) {
      await revokeLicenseRecord(env, licenseIdHex, nowSec);
      record.revoked = true;
      record.highest_tier_code = 0;
      record.highest_product_mask = 0;
      justRevoked = true;
    }
  }

  const targetTier = tierFromCents(record.total_cents);
  const currentTier = Number(record.highest_tier_code) || 0;
  let upgraded = false;
  let licenseKey = null;

  if (!justRevoked && targetTier > 0 && tierRank(targetTier) > tierRank(currentTier)) {
    if (!env || !env.SFL_LICENSE_PRIVATE_SEED_HEX) {
      return jsonResponse(
        { ok: false, error: "SFL_LICENSE_PRIVATE_SEED_HEX is not configured" },
        500
      );
    }
    const resolvedMask = resolveUpgradeMask(
      targetTier,
      prevTierCode,
      prevMask,
      params.requestedMask || 0
    );
    const days = Number(params.days) || 0;
    const expiresTs = days > 0 ? nowSec + days * 86400 : 0;
    licenseKey = await encodeLicenseKey(
      {
        version: 1,
        product_mask: resolvedMask,
        tier_code: targetTier,
        issued_ts: nowSec,
        expires_ts: expiresTs,
        license_id_hex: licenseIdHex,
      },
      env.SFL_LICENSE_PRIVATE_SEED_HEX
    );
    record.highest_tier_code = targetTier;
    record.highest_product_mask = resolvedMask;
    record.revoked = false;
    record.latest_license_key = licenseKey;
    upgraded = true;

    const licKvKey = "lic:" + licenseIdHex;
    const existingLic = await getKv(env, licKvKey);
    if (existingLic) {
      existingLic.revoked = false;
      existingLic.tier_code = targetTier;
      existingLic.max_seats = TIER_MAX_SEATS[targetTier] || 1;
      await putKv(env, licKvKey, existingLic);
    }
  }

  await putKv(env, donorKvKey, record);

  if (params.pledgeUpdate?.pledgeId) {
    await putKv(env, "patreon_pledge:" + params.pledgeUpdate.pledgeId, {
      email: cleanEmail,
    });
  }

  if (upgraded && env?.TELEGRAM_BOT_TOKEN && env?.TELEGRAM_CHAT_ID) {
    const notifyPromise = sendTelegramTierUpgrade(env, {
      email: cleanEmail,
      totalCents: record.total_cents,
      previousTier: prevTierCode,
      newTier: record.highest_tier_code,
      licenseKey,
      source: params.source,
    }).catch((err) =>
      console.error("Telegram tier upgrade notification error:", err)
    );
    if (ctx && typeof ctx.waitUntil === "function") {
      ctx.waitUntil(notifyPromise);
    }
  }

  return jsonResponse(
    {
      ok: true,
      upgraded,
      revoked: Boolean(record.revoked),
      email: cleanEmail,
      total_cents: record.total_cents,
      total_usd: (record.total_cents / 100).toFixed(2),
      previous_tier_code: prevTierCode,
      highest_tier_code: record.highest_tier_code,
      tier_code: record.highest_tier_code,
      tier_name: TIER_NAMES[record.highest_tier_code] || "None",
      product_mask: record.highest_product_mask,
      max_seats: TIER_MAX_SEATS[record.highest_tier_code] || 0,
      license_id_hex: licenseIdHex,
      license_key: licenseKey,
    },
    200
  );
}

function extractPatreonEmail(payload) {
  const direct = payload?.data?.attributes?.email;
  if (typeof direct === "string" && direct.trim()) {
    return direct.trim().toLowerCase();
  }
  const userId = payload?.data?.relationships?.user?.data?.id;
  const included = Array.isArray(payload?.included) ? payload.included : [];
  for (const item of included) {
    if (item?.type === "user" && (!userId || item.id === userId)) {
      const email = item?.attributes?.email;
      if (typeof email === "string" && email.trim()) {
        return email.trim().toLowerCase();
      }
    }
  }
  return "";
}

function extractPatreonEntitledCents(eventName, attrs) {
  if (eventName === "members:pledge:delete") {
    return 0;
  }
  const raw =
    attrs?.currently_entitled_amount_cents ??
    attrs?.will_pay_amount_cents ??
    attrs?.pledge_amount_cents ??
    0;
  const cents = Number(raw);
  return Number.isFinite(cents) && cents >= 0 ? Math.round(cents) : 0;
}

async function handlePatreonWebhook(request, env, ctx) {
  if (request.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method Not Allowed. Use POST." }, 405);
  }
  if (!env || !env.PATREON_WEBHOOK_SECRET) {
    return jsonResponse(
      { ok: false, error: "PATREON_WEBHOOK_SECRET is not configured" },
      500
    );
  }

  const rawBody = await request.text();
  const sigHeader = (request.headers.get("x-patreon-signature") || "")
    .trim()
    .toLowerCase();
  const expectedSig = hmacMd5Hex(env.PATREON_WEBHOOK_SECRET, rawBody);
  if (!sigHeader || !constantTimeEqual(sigHeader, expectedSig)) {
    return jsonResponse(
      { ok: false, error_code: "invalid_signature", error: "Invalid Patreon signature" },
      401
    );
  }

  const eventName = (request.headers.get("x-patreon-event") || "").trim();
  if (!eventName) {
    return jsonResponse({ ok: false, error: "Missing X-Patreon-Event header" }, 400);
  }
  const supported = new Set([
    "members:pledge:create",
    "members:pledge:update",
    "members:pledge:delete",
  ]);
  if (!supported.has(eventName)) {
    return jsonResponse({ ok: true, ignored: true, event: eventName }, 200);
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ ok: false, error: "Invalid JSON body" }, 400);
  }

  const pledgeId = String(payload?.data?.id || "").trim();
  if (!pledgeId) {
    return jsonResponse({ ok: false, error: "Missing Patreon data.id" }, 400);
  }

  let email = extractPatreonEmail(payload);
  if (!email) {
    const pledgeRef = await getKv(env, "patreon_pledge:" + pledgeId);
    email = pledgeRef?.email || "";
  }
  if (!email) {
    return jsonResponse({ ok: false, error: "Missing donor email in Patreon payload" }, 400);
  }

  const newCents = extractPatreonEntitledCents(eventName, payload?.data?.attributes || {});
  return await applyDonorContribution(env, ctx, {
    email,
    deltaCents: 0,
    pledgeUpdate: { pledgeId, newCents, eventName },
    requestedMask: 0,
    days: 0,
    source: `patreon:${eventName}`,
  });
}

async function handleRecordDonation(request, env, ctx) {
  if (request.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method Not Allowed. Use POST." }, 405);
  }
  if (!env || !env.ADMIN_API_TOKEN) {
    return jsonResponse(
      { ok: false, error: "ADMIN_API_TOKEN is not configured" },
      500
    );
  }

  const authHeader = (request.headers.get("authorization") || "").trim();
  const bearerPrefix = "Bearer ";
  const providedToken = authHeader.startsWith(bearerPrefix)
    ? authHeader.slice(bearerPrefix.length).trim()
    : "";
  if (!providedToken || !constantTimeEqual(providedToken, env.ADMIN_API_TOKEN)) {
    return jsonResponse(
      { ok: false, error_code: "unauthorized", error: "Invalid or missing Bearer token" },
      401
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: "Invalid JSON body" }, 400);
  }

  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) {
    return jsonResponse({ ok: false, error: "Missing required field: email" }, 400);
  }

  let amountCents;
  if (body?.amount_cents !== undefined && body?.amount_cents !== null) {
    amountCents = Number(body.amount_cents);
  } else if (body?.amount_usd !== undefined || body?.amount !== undefined) {
    const usd = Number(body.amount_usd ?? body.amount);
    amountCents = Math.round(usd * 100);
  }

  if (!Number.isInteger(amountCents) || amountCents === 0) {
    return jsonResponse(
      { ok: false, error: "amount_cents (or amount) must be a non-zero integer/number" },
      400
    );
  }

  const txId = typeof body?.tx_id === "string" && body.tx_id.trim() ? body.tx_id.trim() : null;
  const source = typeof body?.source === "string" && body.source.trim() ? body.source.trim() : "manual";
  const requestedMask = parseRequestedMask(body?.apps, body?.product_mask);
  const days = Number.isInteger(Number(body?.days)) && Number(body?.days) > 0 ? Number(body.days) : 0;

  return await applyDonorContribution(env, ctx, {
    email,
    deltaCents: amountCents,
    txId,
    requestedMask,
    days,
    source,
  });
}

// --- Ko-fi Webhook Handler (100% Backward Compatible) ---

async function handleKofiWebhook(request, env, ctx) {
  // Only accept POST requests
  if (request.method !== "POST") {
    return new Response(
      "Method Not Allowed. Send POST webhook from Ko-fi.",
      { status: 405 }
    );
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    let payload = null;

    // Ko-fi sends data as application/x-www-form-urlencoded with a 'data' key containing JSON string
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      const rawData = formData.get("data");
      if (rawData) {
        payload = JSON.parse(rawData);
      }
    } else if (contentType.includes("application/json")) {
      payload = await request.json();
    }

    if (!payload) {
      return new Response("Missing or invalid payload data", { status: 400 });
    }

    // Verify token if configured
    if (
      env.KOFI_TOKEN &&
      payload.verification_token &&
      payload.verification_token !== env.KOFI_TOKEN
    ) {
      return new Response("Unauthorized verification token", { status: 403 });
    }

    // Extract donation details
    const type = payload.type || "Donation";
    const fromName = payload.from_name || "Anonymous Supporter";
    const amount = payload.amount || "0.00";
    const currency = payload.currency || "USD";
    const message = payload.message
      ? `\n💬 <i>"${escapeHtml(payload.message)}"</i>`
      : "";
    const isSubscription = payload.is_subscription_payment
      ? " (Monthly Subscription)"
      : "";
    const url = payload.url || "";

    // Format Telegram message with HTML formatting
    const tgText = `☕ <b>SoloForge Labs: Новая поддержка на Ko-fi!</b>
━━━━━━━━━━━━━━━━━━━━
💰 <b>Сумма:</b> ${amount} ${currency}${isSubscription}
👤 <b>От:</b> <code>${escapeHtml(fromName)}</code>${message}
📅 <b>Время:</b> ${payload.timestamp || new Date().toISOString()}

<a href="${url}">Открыть детали транзакции на Ko-fi →</a>`;

    // Send to Telegram Bot API
    const botToken = env.TELEGRAM_BOT_TOKEN;
    const chatId = env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.error(
        "Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in environment variables"
      );
      return new Response(
        "Server configuration error: missing Telegram credentials",
        { status: 500 }
      );
    }

    const tgUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const tgResponse = await fetch(tgUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: tgText,
        parse_mode: "HTML",
        disable_web_page_preview: false,
      }),
    });

    const tgResult = await tgResponse.json();
    if (!tgResult.ok) {
      console.error("Telegram API error:", tgResult);
      return new Response(`Telegram error: ${tgResult.description}`, {
        status: 502,
      });
    }

    return new Response("OK. Notification sent to Telegram.", { status: 200 });
  } catch (err) {
    console.error("Worker processing error:", err);
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
}

function escapeHtml(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// --- Top-Level Worker Export ---

export default {
  async fetch(request, env = {}, ctx = {}) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Handle OPTIONS preflight for /api/*
    if (request.method === "OPTIONS" && pathname.startsWith("/api/")) {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // License API routes
    if (pathname.startsWith("/api/license/")) {
      return await handleLicenseRouting(request, env, ctx, pathname);
    }

    // Patreon v2 webhook route
    if (pathname === "/api/webhooks/patreon") {
      return await handlePatreonWebhook(request, env, ctx);
    }

    // Admin / manual / Patreon-Shop donation recording route
    if (pathname === "/api/donations/record") {
      return await handleRecordDonation(request, env, ctx);
    }

    // Ko-fi webhook handling
    return await handleKofiWebhook(request, env, ctx);
  },
};
