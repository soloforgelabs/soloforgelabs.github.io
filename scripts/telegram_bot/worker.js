/**
 * SoloForge Labs — Unified Serverless Worker
 * ===========================================
 * Handles:
 * 1. Multi-Device Ed25519 Seat Licensing Ledger (/api/license/*)
 *    - /api/license/activate   : Registers/re-activates hardware seat (1/2/5 limits)
 *    - /api/license/deactivate : Frees hardware seat (idempotent 200 OK)
 *    - /api/license/replace    : Replaces old/dead PC seat (3/month cap + UTC rollover)
 * 2. Ko-fi to Telegram Notification Webhook (POST /)
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

    // Handle OPTIONS preflight for /api/license/*
    if (request.method === "OPTIONS" && pathname.startsWith("/api/license/")) {
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

    // Ko-fi webhook handling
    return await handleKofiWebhook(request, env, ctx);
  },
};
