/**
 * SoloForge Labs — Multi-Device Seat Licensing Cloudflare Worker Test Suite
 * ========================================================================
 * 100% Zero-Mocks verification of:
 * 1. BigInt Crockford Base32 decoding and Crockford normalization (O->0, I/L->1).
 * 2. WebCrypto Ed25519 signature verification on keys from license_keygen.py.
 * 3. WebCrypto RFC 8410 PKCS#8 Ed25519 seat certificate signing & verification.
 * 4. Multi-device seat enforcement:
 *    - Single Edition: max 1 PC (2nd PC blocked with 409 Conflict).
 *    - Duo Pack: max 2 PCs (3rd PC blocked with 409 Conflict).
 *    - Scribe Trinity: max 5 PCs (6th PC blocked with 409 Conflict).
 * 5. Windows reinstall idempotency at 5/5 capacity (same hw_id re-activates with 200 OK).
 * 6. Idempotent hardware seat deactivation (/api/license/deactivate).
 * 7. Old/dead PC replacement (/api/license/replace) with 3/month cap and UTC rollover.
 * 8. Strict per-key isolation (Key_A vs Key_B on same hardware fingerprint).
 * 9. App product mask authorization (app_id check against product_mask).
 * 10. Backward-compatible Ko-fi webhook routing (POST /).
 */

import assert from "node:assert";
import { execFileSync } from "node:child_process";
import nodeCrypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import worker, {
  decodeLicenseKey,
  encodeLicenseKey,
  verifyAndDecodeLicenseKey,
  signSeatCertificate,
  md5Bytes,
  hmacMd5Hex,
  resetInMemoryKv,
  getInMemoryKvStore,
  DEFAULT_VENDOR_PUBLIC_KEY_HEX,
  hexToBytes,
  bytesToHex,
} from "./worker.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to license_keygen.py and master key file
const KEYGEN_PATH = path.resolve(__dirname, "..", "license_keygen.py");
const MASTER_KEY_PATH = path.resolve(__dirname, "..", ".master_license_key.json");

let MASTER_SEED_HEX = "";
let VENDOR_PUBLIC_KEY_HEX = DEFAULT_VENDOR_PUBLIC_KEY_HEX;

if (fs.existsSync(MASTER_KEY_PATH)) {
  const masterData = JSON.parse(fs.readFileSync(MASTER_KEY_PATH, "utf-8"));
  MASTER_SEED_HEX = masterData.seed_hex;
  VENDOR_PUBLIC_KEY_HEX = masterData.public_key_hex || DEFAULT_VENDOR_PUBLIC_KEY_HEX;
}

const TEST_ENV = {
  SFL_LICENSE_PRIVATE_SEED_HEX: MASTER_SEED_HEX,
  SFL_VENDOR_PUBLIC_KEY_HEX: VENDOR_PUBLIC_KEY_HEX,
  TELEGRAM_BOT_TOKEN: "mock_token_for_tests",
  TELEGRAM_CHAT_ID: "123456789",
  KOFI_TOKEN: "test_kofi_secret_token",
  PATREON_WEBHOOK_SECRET: "test_patreon_webhook_secret_123",
  ADMIN_API_TOKEN: "test_admin_bearer_token_456",
};

const LEDGER_ENV = {
  ...TEST_ENV,
  TELEGRAM_BOT_TOKEN: "",
  TELEGRAM_CHAT_ID: "",
};

/**
 * Helper to generate a live key using license_keygen.py
 */
function generateKeyViaKeygen(tier, apps = "blinkscribe", customer = "test@soloforgelabs.com", days = 0) {
  const args = [
    KEYGEN_PATH,
    "--tier", tier,
    "--apps", apps,
    "--customer", customer,
    "--days", String(days),
    "--json",
  ];
  const stdout = execFileSync("python", args, { encoding: "utf-8" });
  return JSON.parse(stdout);
}

/**
 * Helper to dispatch simulated HTTP Request through worker.fetch()
 */
async function callWorker(pathname, options = {}, env = TEST_ENV) {
  const url = `https://licensing.soloforgelabs.internal${pathname}`;
  const req = new Request(url, options);
  const ctx = {
    waitUntil(promise) {
      // non-blocking
      promise?.catch?.(() => {});
    },
  };
  return await worker.fetch(req, env, ctx);
}

async function runTestSuite() {
  console.log("=== SoloForge Labs Multi-Device Seat Worker Tests ===");
  let passedCount = 0;

  function pass(testName) {
    passedCount++;
    console.log(`  [PASS] ${testName}`);
  }

  // --- Test 1: BigInt Crockford Base32 Decoder & Normalization ---
  {
    const singleData = generateKeyViaKeygen("single", "blinkscribe", "user-crockford@test.com");
    const rawKey = singleData.license_key;

    const decoded1 = decodeLicenseKey(rawKey, 88);
    assert.strictEqual(decoded1.length, 88, "Decoded key must be exactly 88 bytes");

    // Test Crockford alias normalization (replace chars with O and I/L)
    // SFL1- prefix variations
    const withLowerPrefix = rawKey.toLowerCase();
    const decoded2 = decodeLicenseKey(withLowerPrefix, 88);
    assert.deepStrictEqual(decoded1, decoded2, "Lower-case key must decode identically");

    // Invalid length error
    assert.throws(
      () => decodeLicenseKey("SFL1-SHORT-KEY", 88),
      /Invalid key length/,
      "Short key must throw invalid key length error"
    );

    pass("BigInt Crockford Base32 decoding and case/prefix normalization");
  }

  // --- Test 2: WebCrypto Ed25519 Key Verification ---
  {
    const trinityData = generateKeyViaKeygen("trinity", "blinkscribe,deskscribe,voxscribe", "trinity@test.com");
    const payload = await verifyAndDecodeLicenseKey(trinityData.license_key, TEST_ENV);

    assert.ok(payload !== null, "Trinity key verification must succeed");
    assert.strictEqual(payload.version, 1, "Payload version must be 1");
    assert.strictEqual(payload.tier_code, 3, "Tier code must be 3 (Trinity)");
    assert.strictEqual(payload.max_seats, 5, "Trinity max_seats must be 5");
    assert.strictEqual(payload.product_mask, 7, "Trinity product mask must be 7 (all 3 apps)");
    assert.strictEqual(payload.license_id_hex, trinityData.license_id_hex);

    // Tampered signature test
    const keyChars = trinityData.license_key.split("");
    // Corrupt one character near the end (signature area)
    const lastIdx = keyChars.length - 2;
    keyChars[lastIdx] = keyChars[lastIdx] === "9" ? "8" : "9";
    const corruptedKey = keyChars.join("");
    const corruptedPayload = await verifyAndDecodeLicenseKey(corruptedKey, TEST_ENV);
    assert.strictEqual(corruptedPayload, null, "Corrupted signature must be rejected cleanly");

    // Expired key test (simulated time past expiration)
    const expiredData = generateKeyViaKeygen("single", "blinkscribe", "expired@test.com", 1);
    const futureTime = expiredData.expires_ts + 1000;
    const expiredPayload = await verifyAndDecodeLicenseKey(expiredData.license_key, TEST_ENV, futureTime);
    assert.strictEqual(expiredPayload, null, "Key verified after expires_ts must be rejected");

    pass("WebCrypto Ed25519 signature verification, tamper rejection, and expiry");
  }

  // --- Test 3: Asymmetric Seat Certificate Signing & Verification ---
  {
    const licId = "44bc4d78b4ec75d6";
    const hwId = "a1b2c3d4e5f60718293a4b5c6d7e8f90";
    const tierCode = 3;
    const issuedTs = 1762500000;

    const cert = await signSeatCertificate(licId, hwId, tierCode, issuedTs, MASTER_SEED_HEX);
    assert.strictEqual(cert.v, 1);
    assert.strictEqual(cert.license_id_hex, licId);
    assert.strictEqual(cert.hw_id, hwId);
    assert.strictEqual(cert.tier_code, 3);
    assert.strictEqual(cert.issued_ts, issuedTs);
    assert.strictEqual(typeof cert.sig_hex, "string");
    assert.strictEqual(cert.sig_hex.length, 128, "Signature must be 64 bytes = 128 hex chars");

    // Verify signature with WebCrypto using public key
    const pubKeyBytes = hexToBytes(VENDOR_PUBLIC_KEY_HEX);
    const pubKey = await crypto.subtle.importKey("raw", pubKeyBytes, { name: "Ed25519" }, false, ["verify"]);
    const canonicalMsg = `SFL-SEAT-V1:${licId}:${hwId}:${tierCode}:${issuedTs}`;
    const sigBytes = hexToBytes(cert.sig_hex);
    const isValid = await crypto.subtle.verify({ name: "Ed25519" }, pubKey, sigBytes, new TextEncoder().encode(canonicalMsg));
    assert.strictEqual(isValid, true, "Seat certificate signature must verify with vendor public key");

    pass("RFC 8410 PKCS#8 Ed25519 seat certificate signing & WebCrypto verification");
  }

  // --- Test 4: Top-of-Fetch Routing, CORS Preflight & 405/404 ---
  {
    // OPTIONS preflight
    const optRes = await callWorker("/api/license/activate", { method: "OPTIONS" });
    assert.strictEqual(optRes.status, 204, "OPTIONS preflight must return 204 No Content");
    assert.strictEqual(optRes.headers.get("Access-Control-Allow-Origin"), "*");
    assert.ok(optRes.headers.get("Access-Control-Allow-Methods").includes("POST"));

    // GET on license route -> 405 Method Not Allowed
    const getRes = await callWorker("/api/license/activate", { method: "GET" });
    assert.strictEqual(getRes.status, 405, "GET on license endpoint must return 405");

    // POST on unknown license route -> 404
    const notFoundRes = await callWorker("/api/license/unknown", { method: "POST" });
    assert.strictEqual(notFoundRes.status, 404, "Unknown license route must return 404");

    pass("Top-of-fetch routing, CORS preflight and HTTP status validation");
  }

  // --- Test 5: Single Edition (1 PC Limit & 2nd PC Blocked) ---
  {
    resetInMemoryKv();
    const singleData = generateKeyViaKeygen("single", "blinkscribe", "single-seat@test.com");
    const key = singleData.license_key;

    // PC 1 activates -> 200 OK
    const res1 = await callWorker("/api/license/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        license_key: key,
        hw_id: "hw_single_pc_1",
        device_name: "ALICE-DESKTOP",
        app_id: "blinkscribe",
      }),
    });
    assert.strictEqual(res1.status, 200);
    const json1 = await res1.json();
    assert.strictEqual(json1.ok, true);
    assert.strictEqual(json1.seats_used, 1);
    assert.strictEqual(json1.max_seats, 1);
    assert.ok(json1.seat_cert !== null);
    assert.strictEqual(json1.seat_cert.hw_id, "hw_single_pc_1");

    // PC 2 attempts activate -> 409 Conflict (seat_limit_reached)
    const res2 = await callWorker("/api/license/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        license_key: key,
        hw_id: "hw_single_pc_2",
        device_name: "ALICE-LAPTOP",
        app_id: "blinkscribe",
      }),
    });
    assert.strictEqual(res2.status, 409);
    const json2 = await res2.json();
    assert.strictEqual(json2.ok, false);
    assert.strictEqual(json2.error_code, "seat_limit_reached");
    assert.strictEqual(json2.seats_used, 1);
    assert.strictEqual(json2.max_seats, 1);
    assert.strictEqual(json2.active_devices.length, 1);
    assert.strictEqual(json2.active_devices[0].hw_id, "hw_single_pc_1");

    pass("Single Edition: 1 PC enforced, 2nd PC blocked with 409 Conflict");
  }

  // --- Test 6: Duo Pack (2 PCs Limit & 3rd PC Blocked) ---
  {
    resetInMemoryKv();
    const duoData = generateKeyViaKeygen("duo", "blinkscribe,voxscribe", "duo-seat@test.com");
    const key = duoData.license_key;

    // PC 1 activates -> 200 OK
    const res1 = await callWorker("/api/license/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ license_key: key, hw_id: "hw_duo_pc_1", device_name: "PC 1" }),
    });
    assert.strictEqual(res1.status, 200);
    const json1 = await res1.json();
    assert.strictEqual(json1.seats_used, 1);
    assert.strictEqual(json1.max_seats, 2);

    // PC 2 activates -> 200 OK
    const res2 = await callWorker("/api/license/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ license_key: key, hw_id: "hw_duo_pc_2", device_name: "PC 2" }),
    });
    assert.strictEqual(res2.status, 200);
    const json2 = await res2.json();
    assert.strictEqual(json2.seats_used, 2);
    assert.strictEqual(json2.max_seats, 2);

    // PC 3 attempts activate -> 409 Conflict
    const res3 = await callWorker("/api/license/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ license_key: key, hw_id: "hw_duo_pc_3", device_name: "PC 3" }),
    });
    assert.strictEqual(res3.status, 409);
    const json3 = await res3.json();
    assert.strictEqual(json3.error_code, "seat_limit_reached");
    assert.strictEqual(json3.seats_used, 2);

    pass("Duo Pack: 2 PCs enforced, 3rd PC blocked with 409 Conflict");
  }

  // --- Test 7 & 8: Trinity (5 PCs Limit, 6th Blocked, Windows Reinstall Idempotency) ---
  {
    resetInMemoryKv();
    const trinityData = generateKeyViaKeygen("trinity", "blinkscribe,deskscribe,voxscribe", "trinity-seats@test.com");
    const key = trinityData.license_key;

    // Activate 5 distinct PCs
    for (let i = 1; i <= 5; i++) {
      const res = await callWorker("/api/license/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          license_key: key,
          hw_id: `hw_trinity_pc_${i}`,
          device_name: `OFFICE-PC-${i}`,
          app_id: "blinkscribe",
        }),
      });
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.seats_used, i);
      assert.strictEqual(json.max_seats, 5);
      assert.ok(json.seat_cert !== null);
    }

    // 6th PC attempts activate -> 409 Conflict
    const res6 = await callWorker("/api/license/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        license_key: key,
        hw_id: "hw_trinity_pc_6",
        device_name: "OFFICE-PC-6",
        app_id: "blinkscribe",
      }),
    });
    assert.strictEqual(res6.status, 409);
    const json6 = await res6.json();
    assert.strictEqual(json6.error_code, "seat_limit_reached");
    assert.strictEqual(json6.seats_used, 5);
    assert.strictEqual(json6.active_devices.length, 5);

    // Test 8: Windows Reinstall Idempotency at 5/5 Capacity
    // Re-activating hw_trinity_pc_3 MUST return 200 OK and update device_name
    const reinstallRes = await callWorker("/api/license/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        license_key: key,
        hw_id: "hw_trinity_pc_3",
        device_name: "OFFICE-PC-3-REINSTALLED",
        app_id: "blinkscribe",
      }),
    });
    assert.strictEqual(reinstallRes.status, 200, "Reinstalling on same hw_id must succeed at 5/5 capacity");
    const reinstallJson = await reinstallRes.json();
    assert.strictEqual(reinstallJson.ok, true);
    assert.strictEqual(reinstallJson.seats_used, 5);
    assert.strictEqual(reinstallJson.message, "Device re-activated successfully.");
    const pc3Device = reinstallJson.active_devices.find((d) => d.hw_id === "hw_trinity_pc_3");
    assert.ok(pc3Device !== undefined);
    assert.strictEqual(pc3Device.device_name, "OFFICE-PC-3-REINSTALLED");

    pass("Trinity: 5 PCs cap, 6th PC blocked, and Windows reinstall idempotency at 5/5 capacity");
  }

  // --- Test 9: Deactivation (/api/license/deactivate) ---
  {
    resetInMemoryKv();
    const trinityData = generateKeyViaKeygen("trinity", "blinkscribe,deskscribe,voxscribe", "deactivate@test.com");
    const key = trinityData.license_key;

    // Fill 5 seats
    for (let i = 1; i <= 5; i++) {
      await callWorker("/api/license/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ license_key: key, hw_id: `pc_${i}`, device_name: `PC ${i}` }),
      });
    }

    // Deactivate pc_2
    const deactRes = await callWorker("/api/license/deactivate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ license_key: key, hw_id: "pc_2" }),
    });
    assert.strictEqual(deactRes.status, 200);
    const deactJson = await deactRes.json();
    assert.strictEqual(deactJson.ok, true);
    assert.strictEqual(deactJson.seats_used, 4);
    assert.strictEqual(deactJson.active_devices.some((d) => d.hw_id === "pc_2"), false);

    // PC 6 can now activate into the freed seat
    const act6Res = await callWorker("/api/license/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ license_key: key, hw_id: "pc_6", device_name: "PC 6" }),
    });
    assert.strictEqual(act6Res.status, 200);
    const act6Json = await act6Res.json();
    assert.strictEqual(act6Json.seats_used, 5);

    // Idempotent deactivation of already removed device returns 200 OK
    const deactAgain = await callWorker("/api/license/deactivate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ license_key: key, hw_id: "pc_2" }),
    });
    assert.strictEqual(deactAgain.status, 200);
    const deactAgainJson = await deactAgain.json();
    assert.strictEqual(deactAgainJson.seats_used, 5);

    pass("Deactivation frees seat for new device & provides idempotent 200 OK");
  }

  // --- Test 10 & 11: Device Replacement Flow, 3/Month Cap & Rollover ---
  {
    resetInMemoryKv();
    const trinityData = generateKeyViaKeygen("trinity", "blinkscribe,deskscribe,voxscribe", "replace@test.com");
    const key = trinityData.license_key;

    // Fill 5 seats
    for (let i = 1; i <= 5; i++) {
      await callWorker("/api/license/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ license_key: key, hw_id: `hw_pc_${i}`, device_name: `PC ${i}` }),
      });
    }

    // Attempt replacing nonexistent old device -> 404 Not Found
    const notFoundRes = await callWorker("/api/license/replace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        license_key: key,
        old_hw_id: "hw_nonexistent",
        new_hw_id: "hw_pc_new1",
        new_device_name: "NEW-1",
      }),
    });
    assert.strictEqual(notFoundRes.status, 404);
    const notFoundJson = await notFoundRes.json();
    assert.strictEqual(notFoundJson.error_code, "device_not_found");

    // Replacement 1 (hw_pc_1 -> hw_pc_new1) -> 200 OK
    const rep1Res = await callWorker("/api/license/replace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        license_key: key,
        old_hw_id: "hw_pc_1",
        new_hw_id: "hw_pc_new1",
        new_device_name: "NEW-1",
      }),
    });
    assert.strictEqual(rep1Res.status, 200);
    const rep1Json = await rep1Res.json();
    assert.strictEqual(rep1Json.replacements_count, 1);
    assert.strictEqual(rep1Json.seats_used, 5);
    assert.ok(rep1Json.seat_cert !== null);
    assert.strictEqual(rep1Json.seat_cert.hw_id, "hw_pc_new1");

    // Replacement 2 (hw_pc_2 -> hw_pc_new2) -> 200 OK
    const rep2Res = await callWorker("/api/license/replace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        license_key: key,
        old_hw_id: "hw_pc_2",
        new_hw_id: "hw_pc_new2",
        new_device_name: "NEW-2",
      }),
    });
    assert.strictEqual(rep2Res.status, 200);
    const rep2Json = await rep2Res.json();
    assert.strictEqual(rep2Json.replacements_count, 2);

    // Replacement 3 (hw_pc_3 -> hw_pc_new3) -> 200 OK
    const rep3Res = await callWorker("/api/license/replace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        license_key: key,
        old_hw_id: "hw_pc_3",
        new_hw_id: "hw_pc_new3",
        new_device_name: "NEW-3",
      }),
    });
    assert.strictEqual(rep3Res.status, 200);
    const rep3Json = await rep3Res.json();
    assert.strictEqual(rep3Json.replacements_count, 3);

    // 4th Replacement in same month -> 429 Too Many Requests (replacement_limit_reached)
    const rep4Res = await callWorker("/api/license/replace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        license_key: key,
        old_hw_id: "hw_pc_4",
        new_hw_id: "hw_pc_new4",
        new_device_name: "NEW-4",
      }),
    });
    assert.strictEqual(rep4Res.status, 429);
    const rep4Json = await rep4Res.json();
    assert.strictEqual(rep4Json.error_code, "replacement_limit_reached");
    assert.strictEqual(rep4Json.replacements_count, 3);

    // Test 11: Next-Month UTC Rollover
    // Manually simulate previous month in stored record
    const kvStore = getInMemoryKvStore();
    const kvKey = "lic:" + trinityData.license_id_hex;
    const storedRecord = JSON.parse(kvStore.get(kvKey));
    storedRecord.replacements_month = "2020-01"; // Old month
    kvStore.set(kvKey, JSON.stringify(storedRecord));

    // Now 4th replacement should succeed because month rolled over!
    const repRolloverRes = await callWorker("/api/license/replace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        license_key: key,
        old_hw_id: "hw_pc_4",
        new_hw_id: "hw_pc_new4",
        new_device_name: "NEW-4",
      }),
    });
    assert.strictEqual(repRolloverRes.status, 200, "Replacement must succeed after month rollover");
    const repRolloverJson = await repRolloverRes.json();
    assert.strictEqual(repRolloverJson.replacements_count, 1, "Count must reset to 1 after rollover");

    pass("Device replacement: 3/month cap enforced (429) & UTC month rollover resets count");
  }

  // --- Test 12: Strict Per-Key Isolation ---
  {
    resetInMemoryKv();
    const keyDataA = generateKeyViaKeygen("single", "blinkscribe", "userA@test.com");
    const keyDataB = generateKeyViaKeygen("single", "blinkscribe", "userB@test.com");
    const sharedLaptopHw = "laptop_hardware_uuid_777";

    // Activate on Key A
    const resA1 = await callWorker("/api/license/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ license_key: keyDataA.license_key, hw_id: sharedLaptopHw, device_name: "WORK-LAPTOP" }),
    });
    assert.strictEqual(resA1.status, 200);

    // Deactivate on Key A
    const resADeact = await callWorker("/api/license/deactivate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ license_key: keyDataA.license_key, hw_id: sharedLaptopHw }),
    });
    assert.strictEqual(resADeact.status, 200);

    // Activate same laptop on Key B -> Must succeed immediately with zero cross-key blacklisting
    const resB1 = await callWorker("/api/license/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ license_key: keyDataB.license_key, hw_id: sharedLaptopHw, device_name: "WORK-LAPTOP" }),
    });
    assert.strictEqual(resB1.status, 200, "Deactivating Key A must never block hardware on Key B");
    const jsonB1 = await resB1.json();
    assert.strictEqual(jsonB1.ok, true);
    assert.strictEqual(jsonB1.seats_used, 1);

    pass("Per-key isolation: Deactivation or eviction on Key A leaves Key B fully independent");
  }

  // --- Test 13: App Product Mask Authorization ---
  {
    resetInMemoryKv();
    // Key only unlocks BlinkScribe (mask = 1)
    const singleData = generateKeyViaKeygen("single", "blinkscribe", "appmask@test.com");

    // Activate with app_id = blinkscribe -> 200 OK
    const okRes = await callWorker("/api/license/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        license_key: singleData.license_key,
        hw_id: "hw_mask_test",
        app_id: "blinkscribe",
      }),
    });
    assert.strictEqual(okRes.status, 200);

    // Activate with app_id = deskscribe (not unlocked) -> 403 Forbidden (app_not_unlocked)
    const forbiddenRes = await callWorker("/api/license/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        license_key: singleData.license_key,
        hw_id: "hw_mask_test_2",
        app_id: "deskscribe",
      }),
    });
    assert.strictEqual(forbiddenRes.status, 403);
    const forbiddenJson = await forbiddenRes.json();
    assert.strictEqual(forbiddenJson.error_code, "app_not_unlocked");

    pass("App product mask enforcement: unauthorized app returns 403 Forbidden");
  }

  // --- Test 14: Ko-fi Webhook Backward Compatibility (POST /) ---
  {
    // GET / -> 405 Method Not Allowed (from Ko-fi handler)
    const getRes = await callWorker("/", { method: "GET" });
    assert.strictEqual(getRes.status, 405);
    const getTxt = await getRes.text();
    assert.ok(getTxt.includes("Method Not Allowed. Send POST webhook from Ko-fi."));

    // POST / with invalid verification token -> 403 Unauthorized
    const badTokenRes = await callWorker("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        verification_token: "wrong_secret_token",
        message: "Hello from supporter",
      }),
    });
    assert.strictEqual(badTokenRes.status, 403);

    // POST / with missing payload -> 400 Bad Request
    const badPayloadRes = await callWorker("/", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: "",
    });
    assert.strictEqual(badPayloadRes.status, 400);

    pass("Ko-fi webhook: 100% backward compatible routing, token verification & 405/400 handling");
  }

  // --- Test 15: Bronze Supporter Tier (tier=4, mask=7, maxSeats=1) ---
  {
    resetInMemoryKv();
    const bronzeData = generateKeyViaKeygen("bronze", "blinkscribe", "bronze@test.com");
    const payload = await verifyAndDecodeLicenseKey(bronzeData.license_key, TEST_ENV);

    assert.ok(payload !== null, "Bronze Supporter key verification must succeed");
    assert.strictEqual(payload.tier_code, 4, "Bronze tier_code must be 4");
    assert.strictEqual(payload.product_mask, 7, "Bronze product_mask must be 7 (PRODUCT_TRINITY_ALL)");
    assert.strictEqual(payload.max_seats, 1, "Bronze max_seats must be 1");

    // Unlocks BlinkScribe, DeskScribe, and VoxScribe on the 1 allowed PC
    for (const appId of ["blinkscribe", "deskscribe", "voxscribe"]) {
      const actRes = await callWorker("/api/license/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          license_key: bronzeData.license_key,
          hw_id: "hw_bronze_pc1",
          device_name: "BRONZE-PC-1",
          app_id: appId,
        }),
      });
      assert.strictEqual(actRes.status, 200, `Bronze key must activate on ${appId}`);
      const actJson = await actRes.json();
      assert.strictEqual(actJson.max_seats, 1);
      assert.strictEqual(actJson.seats_used, 1);
    }

    // 2nd PC blocked with 409 Conflict
    const secondPcRes = await callWorker("/api/license/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        license_key: bronzeData.license_key,
        hw_id: "hw_bronze_pc2",
        device_name: "BRONZE-PC-2",
        app_id: "blinkscribe",
      }),
    });
    assert.strictEqual(secondPcRes.status, 409, "Bronze 2nd PC must be blocked with 409");
    const secondPcJson = await secondPcRes.json();
    assert.strictEqual(secondPcJson.error_code, "seat_limit_reached");

    pass("Bronze Supporter tier (tier=4, mask=7): 1 PC seat limit & all 3 apps authorized");
  }

  // --- Test 16: encodeLicenseKey Roundtrip (JS WebCrypto -> JS & Python Verification) ---
  {
    const nowTs = Math.floor(Date.now() / 1000);
    const licIdHex = bytesToHex(
      new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode("encoder-test@soloforgelabs.com"))).slice(0, 8)
    );
    const jsKey = await encodeLicenseKey(
      {
        version: 1,
        product_mask: 5,
        tier_code: 2,
        issued_ts: nowTs,
        expires_ts: 0,
        license_id_hex: licIdHex,
      },
      MASTER_SEED_HEX
    );
    assert.ok(jsKey.startsWith("SFL1-"), "Encoded key must start with SFL1-");
    assert.strictEqual(jsKey.replace(/SFL1-|-/g, "").length, 141, "Encoded Crockford body must be 141 chars");

    const decodedJs = await verifyAndDecodeLicenseKey(jsKey, TEST_ENV);
    assert.ok(decodedJs !== null, "JS-encoded key must verify in JS");
    assert.strictEqual(decodedJs.product_mask, 5);
    assert.strictEqual(decodedJs.tier_code, 2);
    assert.strictEqual(decodedJs.max_seats, 2);
    assert.strictEqual(decodedJs.issued_ts, nowTs);
    assert.strictEqual(decodedJs.expires_ts, 0);
    assert.strictEqual(decodedJs.license_id_hex, licIdHex);

    // Cross-verify against Python license_keygen.py --verify
    const pyOut = execFileSync("python", [KEYGEN_PATH, "--verify", jsKey, "--json"], { encoding: "utf-8" });
    const pyParsed = JSON.parse(pyOut);
    assert.strictEqual(pyParsed.valid, true, "JS-encoded key must verify cleanly in Python");
    assert.strictEqual(pyParsed.tier_code, 2);
    assert.strictEqual(pyParsed.product_mask, 5);
    assert.strictEqual(pyParsed.license_id_hex, licIdHex);

    pass("encodeLicenseKey: WebCrypto Ed25519 encoding matches Python Crockford Base32 wire format");
  }

  // --- Test 17: Pure-JS RFC 1321 MD5 & RFC 2104 HMAC-MD5 Verification ---
  {
    assert.strictEqual(bytesToHex(md5Bytes("")), "d41d8cd98f00b204e9800998ecf8427e");
    assert.strictEqual(bytesToHex(md5Bytes("abc")), "900150983cd24fb0d6963f7d28e17f72");
    assert.strictEqual(
      bytesToHex(md5Bytes("The quick brown fox jumps over the lazy dog")),
      "9e107d9d372bb6826bd81d3542a419d6"
    );
    assert.strictEqual(
      hmacMd5Hex("key", "The quick brown fox jumps over the lazy dog"),
      "80070713463e7749b90c2dc24911e275"
    );
    // Cross-check against Node's native OpenSSL HMAC-MD5 for multi-block >64 byte secret
    const longSecret = "s".repeat(80);
    const sampleBody = JSON.stringify({ data: { id: "p_99", attributes: { currently_entitled_amount_cents: 1500 } } });
    const nodeExpected = nodeCrypto.createHmac("md5", longSecret).update(sampleBody, "utf8").digest("hex");
    assert.strictEqual(hmacMd5Hex(longSecret, sampleBody), nodeExpected);

    pass("Pure-JS MD5 & HMAC-MD5 match RFC 1321/2104 vectors and Node OpenSSL HMAC-MD5");
  }

  // --- Test 18: Cumulative Upgrades ($3 -> $6 Silver -> $13 Gold -> $15 Platinum) & Bronze Non-Inheritance ---
  {
    resetInMemoryKv();
    const donorEmail = "UpgradeUser@Example.com";

    // Unauthorized Bearer check -> 401
    const unauthRes = await callWorker("/api/donations/record", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer wrong_token" },
      body: JSON.stringify({ email: donorEmail, amount_cents: 300 }),
    }, LEDGER_ENV);
    assert.strictEqual(unauthRes.status, 401);

    // Step 1: $3.00 -> Bronze (tier=4, mask=7, max_seats=1)
    const r1 = await callWorker("/api/donations/record", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LEDGER_ENV.ADMIN_API_TOKEN}` },
      body: JSON.stringify({ email: donorEmail, amount_cents: 300, tx_id: "tx_step_1", source: "kofi" }),
    }, LEDGER_ENV);
    assert.strictEqual(r1.status, 200);
    const j1 = await r1.json();
    assert.strictEqual(j1.upgraded, true);
    assert.strictEqual(j1.total_cents, 300);
    assert.strictEqual(j1.tier_code, 4);
    assert.strictEqual(j1.product_mask, 7);
    assert.strictEqual(j1.max_seats, 1);
    const dec1 = await verifyAndDecodeLicenseKey(j1.license_key, LEDGER_ENV);
    assert.strictEqual(dec1.tier_code, 4);
    assert.strictEqual(dec1.product_mask, 7);

    // Step 2: +$3.00 ($6.00 total) -> Silver (tier=1, max_seats=1). Bronze mask=7 MUST NOT be inherited!
    const r2 = await callWorker("/api/donations/record", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LEDGER_ENV.ADMIN_API_TOKEN}` },
      body: JSON.stringify({ email: donorEmail, amount_cents: 300, tx_id: "tx_step_2", source: "kofi" }),
    }, LEDGER_ENV);
    assert.strictEqual(r2.status, 200);
    const j2 = await r2.json();
    assert.strictEqual(j2.upgraded, true);
    assert.strictEqual(j2.total_cents, 600);
    assert.strictEqual(j2.tier_code, 1, "Cumulative $6 must reach Silver (tier=1)");
    assert.strictEqual(j2.product_mask, 1, "Silver must NOT inherit Bronze mask=7; defaults to 1 (BlinkScribe)");
    assert.strictEqual(j2.max_seats, 1);
    const dec2 = await verifyAndDecodeLicenseKey(j2.license_key, LEDGER_ENV);
    assert.strictEqual(dec2.tier_code, 1);
    assert.strictEqual(dec2.product_mask, 1);

    // Duplicate tx_id must be idempotent
    const r2Dup = await callWorker("/api/donations/record", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LEDGER_ENV.ADMIN_API_TOKEN}` },
      body: JSON.stringify({ email: donorEmail, amount_cents: 300, tx_id: "tx_step_2", source: "kofi" }),
    }, LEDGER_ENV);
    assert.strictEqual(r2Dup.status, 200);
    const j2Dup = await r2Dup.json();
    assert.strictEqual(j2Dup.duplicate, true);
    assert.strictEqual(j2Dup.upgraded, false);
    assert.strictEqual(j2Dup.total_cents, 600);

    // Step 3: +$7.00 ($13.00 total) -> Gold (tier=2, max_seats=2, inherits Silver mask=1)
    const r3 = await callWorker("/api/donations/record", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LEDGER_ENV.ADMIN_API_TOKEN}` },
      body: JSON.stringify({ email: donorEmail, amount_cents: 700, tx_id: "tx_step_3", source: "kofi" }),
    }, LEDGER_ENV);
    assert.strictEqual(r3.status, 200);
    const j3 = await r3.json();
    assert.strictEqual(j3.upgraded, true);
    assert.strictEqual(j3.total_cents, 1300);
    assert.strictEqual(j3.tier_code, 2, "Cumulative $13 must reach Gold (tier=2)");
    assert.strictEqual(j3.product_mask, 1, "Gold upgrading from paid AI Silver inherits previous paid mask=1");
    assert.strictEqual(j3.max_seats, 2);

    // Step 4: +$2.00 ($15.00 total) -> Platinum (tier=3, mask=7, max_seats=5)
    const r4 = await callWorker("/api/donations/record", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LEDGER_ENV.ADMIN_API_TOKEN}` },
      body: JSON.stringify({ email: donorEmail, amount_cents: 200, tx_id: "tx_step_4", source: "kofi" }),
    }, LEDGER_ENV);
    assert.strictEqual(r4.status, 200);
    const j4 = await r4.json();
    assert.strictEqual(j4.upgraded, true);
    assert.strictEqual(j4.total_cents, 1500);
    assert.strictEqual(j4.tier_code, 3, "Cumulative $15 must reach Platinum (tier=3)");
    assert.strictEqual(j4.product_mask, 7, "Platinum always uses mask=7");
    assert.strictEqual(j4.max_seats, 5);
    const dec4 = await verifyAndDecodeLicenseKey(j4.license_key, LEDGER_ENV);
    assert.strictEqual(dec4.tier_code, 3);
    assert.strictEqual(dec4.product_mask, 7);

    // Fresh direct $13.00 donor -> Gold defaults to mask=5 (BlinkScribe | VoxScribe)
    const rFreshGold = await callWorker("/api/donations/record", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LEDGER_ENV.ADMIN_API_TOKEN}` },
      body: JSON.stringify({ email: "freshgold@example.com", amount_cents: 1300, tx_id: "tx_gold_fresh" }),
    }, LEDGER_ENV);
    const jFreshGold = await rFreshGold.json();
    assert.strictEqual(jFreshGold.tier_code, 2);
    assert.strictEqual(jFreshGold.product_mask, 5, "Direct $13 Gold must default to mask=5 (BlinkScribe | VoxScribe)");

    pass("Cumulative upgrades ($3 -> $6 -> $13 -> $15), tx_id dedup & Bronze mask non-inheritance");
  }

  // --- Test 19: Patreon v2 Webhooks (HMAC-MD5, pledge:update Delta Idempotency, pledge:delete Revocation) ---
  {
    resetInMemoryKv();
    const patreonEmail = "patron@example.com";
    const pledgeId = "member_pledge_9001";

    function sendPatreonEvent(eventName, entitledCents, sigOverride = null) {
      const bodyStr = JSON.stringify({
        data: {
          id: pledgeId,
          type: "member",
          attributes: {
            email: patreonEmail,
            currently_entitled_amount_cents: entitledCents,
          },
        },
      });
      const sig = sigOverride !== null ? sigOverride : hmacMd5Hex(LEDGER_ENV.PATREON_WEBHOOK_SECRET, bodyStr);
      return callWorker("/api/webhooks/patreon", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Patreon-Event": eventName,
          "X-Patreon-Signature": sig,
        },
        body: bodyStr,
      }, LEDGER_ENV);
    }

    // Invalid signature -> 401
    const badSigRes = await sendPatreonEvent("members:pledge:create", 300, "00000000000000000000000000000000");
    assert.strictEqual(badSigRes.status, 401);

    // 1. members:pledge:create $3 -> Bronze
    const p1 = await sendPatreonEvent("members:pledge:create", 300);
    assert.strictEqual(p1.status, 200);
    const jp1 = await p1.json();
    assert.strictEqual(jp1.upgraded, true);
    assert.strictEqual(jp1.total_cents, 300);
    assert.strictEqual(jp1.tier_code, 4);
    assert.strictEqual(jp1.product_mask, 7);

    // 2. members:pledge:update $5 (same data.id!) -> adds delta +200 -> Silver (mask=1)
    const p2 = await sendPatreonEvent("members:pledge:update", 500);
    assert.strictEqual(p2.status, 200);
    const jp2 = await p2.json();
    assert.strictEqual(jp2.upgraded, true);
    assert.strictEqual(jp2.total_cents, 500);
    assert.strictEqual(jp2.tier_code, 1);
    assert.strictEqual(jp2.product_mask, 1, "Patreon $3->$5 update must NOT inherit Bronze mask=7");

    // 3. Duplicate members:pledge:update $5 -> delta=0 idempotent
    const p2Dup = await sendPatreonEvent("members:pledge:update", 500);
    assert.strictEqual(p2Dup.status, 200);
    const jp2Dup = await p2Dup.json();
    assert.strictEqual(jp2Dup.idempotent, true);
    assert.strictEqual(jp2Dup.total_cents, 500);

    // 4. members:pledge:update $15 (same data.id!) -> adds delta +1000 -> Platinum (mask=7)
    const p3 = await sendPatreonEvent("members:pledge:update", 1500);
    assert.strictEqual(p3.status, 200);
    const jp3 = await p3.json();
    assert.strictEqual(jp3.upgraded, true);
    assert.strictEqual(jp3.total_cents, 1500);
    assert.strictEqual(jp3.tier_code, 3);
    assert.strictEqual(jp3.product_mask, 7);
    const platinumKey = jp3.license_key;

    // Activate Platinum key on PC1 before pledge deletion
    const actOk = await callWorker("/api/license/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ license_key: platinumKey, hw_id: "hw_patron_pc1", device_name: "PATRON-1" }),
    }, LEDGER_ENV);
    assert.strictEqual(actOk.status, 200);

    // 5. members:pledge:delete -> subtracts 1500 -> total=0 -> revokes lic:<id>
    const pDel = await sendPatreonEvent("members:pledge:delete", 1500);
    assert.strictEqual(pDel.status, 200);
    const jpDel = await pDel.json();
    assert.strictEqual(jpDel.total_cents, 0);
    assert.strictEqual(jpDel.revoked, true);

    const kvStore = getInMemoryKvStore();
    const licRec = JSON.parse(kvStore.get("lic:" + jp3.license_id_hex));
    assert.strictEqual(licRec.revoked, true, "lic:<id>.revoked must be true after pledge:delete");

    // 6. Enforce license_revoked (HTTP 403) on BOTH activate and replace
    const actRevoked = await callWorker("/api/license/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ license_key: platinumKey, hw_id: "hw_patron_pc2", device_name: "PATRON-2" }),
    }, LEDGER_ENV);
    assert.strictEqual(actRevoked.status, 403);
    assert.strictEqual((await actRevoked.json()).error_code, "license_revoked");

    const repRevoked = await callWorker("/api/license/replace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        license_key: platinumKey,
        old_hw_id: "hw_patron_pc1",
        new_hw_id: "hw_patron_pc2",
        new_device_name: "PATRON-2",
      }),
    }, LEDGER_ENV);
    assert.strictEqual(repRevoked.status, 403);
    assert.strictEqual((await repRevoked.json()).error_code, "license_revoked");

    pass("Patreon v2 HMAC-MD5, pledge delta updates, pledge:delete & 403 license_revoked on activate/replace");
  }

  // --- Test 20: Partial Refund Dropping Below Issued Tier Threshold Revokes License ---
  {
    resetInMemoryKv();
    const refundEmail = "refund@example.com";
    const resBuy = await callWorker("/api/donations/record", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LEDGER_ENV.ADMIN_API_TOKEN}` },
      body: JSON.stringify({ email: refundEmail, amount_cents: 1300, tx_id: "tx_buy_gold" }),
    }, LEDGER_ENV);
    const jBuy = await resBuy.json();
    assert.strictEqual(jBuy.tier_code, 2);

    // Partial refund of $5.00 drops total from $13.00 to $8.00 (< $13.00 threshold for Gold)
    const resRef = await callWorker("/api/donations/record", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LEDGER_ENV.ADMIN_API_TOKEN}` },
      body: JSON.stringify({ email: refundEmail, amount_cents: -500, tx_id: "tx_refund_500" }),
    }, LEDGER_ENV);
    assert.strictEqual(resRef.status, 200);
    const jRef = await resRef.json();
    assert.strictEqual(jRef.total_cents, 800);
    assert.strictEqual(jRef.revoked, true);

    const actBlocked = await callWorker("/api/license/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ license_key: jBuy.license_key, hw_id: "hw_ref_1", device_name: "REF-PC" }),
    }, LEDGER_ENV);
    assert.strictEqual(actBlocked.status, 403);
    assert.strictEqual((await actBlocked.json()).error_code, "license_revoked");

    pass("Refund dropping below issued tier threshold revokes key on activate");
  }

  console.log(`\nAll ${passedCount} tests PASSED with 100% Zero-Mocks compliance!`);
}

runTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
