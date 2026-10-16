// apk_packager.js — Injects dynamic WFF XML, custom package ID, watch face label, and dial assets
// into the Wear OS APK container, 4-byte zipaligns uncompressed resources, and signs with v2 & v3 via Web Crypto API.
import { unzipSync, zipSync, strToU8 } from "./fflate.js";
import { BASE_WFF_APK_B64 } from "./base_template.js";
import { APK_SIG_BLOCK_B64, DEBUG_PKCS8_B64 } from "./apk_sig_template.js";

export const DEFAULT_PACKAGE_PREFIX = "com.dialtool.watchface";
export const DEFAULT_WATCHFACE_LABEL = "Dial Tool";

/**
 * Base64 string to Uint8Array helper
 */
function b64_to_u8(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Concatenates multiple Uint8Arrays into a single Uint8Array.
 */
function concat_u8(arrays) {
  let total = 0;
  for (const a of arrays) total += a.length;
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) {
    out.set(a, offset);
    offset += a.length;
  }
  return out;
}

/**
 * Sanitizes a user-provided watch face name or ID into a valid Android package suffix
 * (lowercase ASCII letters, digits, and underscores, starting with a letter).
 */
export function sanitize_package_suffix(input, fallback = "custom") {
  const cleaned = String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (!cleaned) return fallback;
  const validStart = /^[a-z]/.test(cleaned) ? cleaned : "wf_" + cleaned;
  return validStart.slice(0, 48);
}

/**
 * Formats a full Android package name from an optional suffix or full package string.
 */
export function format_package_name(packageOrSuffix, label = "") {
  const raw = String(packageOrSuffix || "").trim();
  if (raw.includes(".")) {
    const parts = raw
      .split(".")
      .map((p) => sanitize_package_suffix(p, "wf"))
      .filter(Boolean);
    if (parts.length >= 2) return parts.slice(0, 6).join(".").slice(0, 120);
  }
  const source = raw || label;
  if (!source || source.trim().toLowerCase() === "dial tool") {
    return DEFAULT_PACKAGE_PREFIX;
  }
  return `${DEFAULT_PACKAGE_PREFIX}.${sanitize_package_suffix(source)}`;
}

/**
 * Encodes a JS string as UTF-16LE bytes.
 */
function encode_utf16le(str) {
  const out = new Uint8Array(str.length * 2);
  const view = new DataView(out.buffer);
  for (let i = 0; i < str.length; i++) {
    view.setUint16(i * 2, str.charCodeAt(i), true);
  }
  return out;
}

/**
 * Decodes a UTF-16LE Uint8Array into a JS string.
 */
function decode_utf16le(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let out = "";
  for (let i = 0; i < bytes.byteLength; i += 2) {
    out += String.fromCharCode(view.getUint16(i, true));
  }
  return out;
}

/**
 * Rebuilds a ResStringPool_header chunk (type 0x0001) encoded in UTF-16LE (used in binary AndroidManifest.xml),
 * replacing any string equal to `targetStr` with `replacementStr`.
 */
function patch_utf16_string_pool(poolChunk, targetStr, replacementStr) {
  const view = new DataView(poolChunk.buffer, poolChunk.byteOffset, poolChunk.byteLength);
  const stringCount = view.getUint32(8, true);
  const styleCount = view.getUint32(12, true);
  const flags = view.getUint32(16, true);
  const stringsStart = view.getUint32(20, true);

  const strings = [];
  for (let i = 0; i < stringCount; i++) {
    const off = view.getUint32(28 + i * 4, true);
    const absOff = stringsStart + off;
    const charLen = view.getUint16(absOff, true);
    const strBytes = poolChunk.subarray(absOff + 2, absOff + 2 + charLen * 2);
    const s = decode_utf16le(strBytes);
    strings.push(s === targetStr ? replacementStr : s);
  }

  const encoded = [];
  const offsets = [];
  let curOff = 0;
  for (const s of strings) {
    offsets.push(curOff);
    const strBytes = encode_utf16le(s);
    const entry = new Uint8Array(2 + strBytes.length + 2);
    new DataView(entry.buffer).setUint16(0, s.length, true);
    entry.set(strBytes, 2);
    encoded.push(entry);
    curOff += entry.length;
  }

  const pad = (4 - (curOff % 4)) % 4;
  if (pad > 0) encoded.push(new Uint8Array(pad));

  const poolData = concat_u8(encoded);
  const newChunkSize = 28 + stringCount * 4 + poolData.length;
  const out = new Uint8Array(newChunkSize);
  const outView = new DataView(out.buffer);
  outView.setUint16(0, 0x0001, true);
  outView.setUint16(2, 28, true);
  outView.setUint32(4, newChunkSize, true);
  outView.setUint32(8, stringCount, true);
  outView.setUint32(12, styleCount, true);
  outView.setUint32(16, flags, true);
  outView.setUint32(20, 28 + stringCount * 4, true);
  outView.setUint32(24, 0, true);
  for (let i = 0; i < stringCount; i++) {
    outView.setUint32(28 + i * 4, offsets[i], true);
  }
  out.set(poolData, 28 + stringCount * 4);
  return out;
}

/**
 * Rebuilds a ResStringPool_header chunk (type 0x0001) encoded in UTF-8 (used in resources.arsc),
 * replacing any string equal to `targetStr` with `replacementStr`.
 */
function patch_utf8_string_pool(poolChunk, targetStr, replacementStr) {
  const view = new DataView(poolChunk.buffer, poolChunk.byteOffset, poolChunk.byteLength);
  const stringCount = view.getUint32(8, true);
  const styleCount = view.getUint32(12, true);
  const flags = view.getUint32(16, true);
  const stringsStart = view.getUint32(20, true);
  const decoder = new TextDecoder("utf-8");

  const strings = [];
  for (let i = 0; i < stringCount; i++) {
    const off = view.getUint32(28 + i * 4, true);
    const absOff = stringsStart + off;
    const byteLen = poolChunk[absOff + 1];
    const s = decoder.decode(poolChunk.subarray(absOff + 2, absOff + 2 + byteLen));
    strings.push(s === targetStr ? replacementStr : s);
  }

  const encoded = [];
  const offsets = [];
  let curOff = 0;
  for (const s of strings) {
    offsets.push(curOff);
    const clipped = [...s].slice(0, 120).join("");
    const strBytes = strToU8(clipped).slice(0, 125);
    const charLen = Math.min([...clipped].length, 125);
    const entry = new Uint8Array(2 + strBytes.length + 1);
    entry[0] = charLen;
    entry[1] = strBytes.length;
    entry.set(strBytes, 2);
    encoded.push(entry);
    curOff += entry.length;
  }

  const pad = (4 - (curOff % 4)) % 4;
  if (pad > 0) encoded.push(new Uint8Array(pad));

  const poolData = concat_u8(encoded);
  const newChunkSize = 28 + stringCount * 4 + poolData.length;
  const out = new Uint8Array(newChunkSize);
  const outView = new DataView(out.buffer);
  outView.setUint16(0, 0x0001, true);
  outView.setUint16(2, 28, true);
  outView.setUint32(4, newChunkSize, true);
  outView.setUint32(8, stringCount, true);
  outView.setUint32(12, styleCount, true);
  outView.setUint32(16, flags, true);
  outView.setUint32(20, 28 + stringCount * 4, true);
  outView.setUint32(24, 0, true);
  for (let i = 0; i < stringCount; i++) {
    outView.setUint32(28 + i * 4, offsets[i], true);
  }
  out.set(poolData, 28 + stringCount * 4);
  return out;
}

/**
 * Patches binary AndroidManifest.xml with a custom package name.
 */
export function patch_binary_manifest(manifestBytes, packageName) {
  if (!packageName || packageName === DEFAULT_PACKAGE_PREFIX) return manifestBytes;
  const view = new DataView(manifestBytes.buffer, manifestBytes.byteOffset, manifestBytes.byteLength);
  const oldPoolSize = view.getUint32(8 + 4, true);
  const newPool = patch_utf16_string_pool(
    manifestBytes.subarray(8, 8 + oldPoolSize),
    DEFAULT_PACKAGE_PREFIX,
    packageName
  );
  const out = concat_u8([manifestBytes.subarray(0, 8), newPool, manifestBytes.subarray(8 + oldPoolSize)]);
  new DataView(out.buffer).setUint32(4, out.length, true);
  return out;
}

/**
 * Patches binary resources.arsc with a custom watch face label (`@string/app_name`) and package name.
 */
export function patch_resources_arsc(arscBytes, { label = DEFAULT_WATCHFACE_LABEL, packageName = DEFAULT_PACKAGE_PREFIX } = {}) {
  const cleanLabel = String(label || DEFAULT_WATCHFACE_LABEL).trim() || DEFAULT_WATCHFACE_LABEL;
  const cleanPkg = packageName || DEFAULT_PACKAGE_PREFIX;
  if (cleanLabel === DEFAULT_WATCHFACE_LABEL && cleanPkg === DEFAULT_PACKAGE_PREFIX) {
    return arscBytes;
  }

  const view = new DataView(arscBytes.buffer, arscBytes.byteOffset, arscBytes.byteLength);
  const oldPoolSize = view.getUint32(12 + 4, true);
  const newPool = patch_utf8_string_pool(
    arscBytes.subarray(12, 12 + oldPoolSize),
    DEFAULT_WATCHFACE_LABEL,
    cleanLabel
  );

  // ResTable_package chunk immediately follows the global string pool; its 256-byte UTF-16LE name starts at +12
  const pkgChunk = arscBytes.slice(12 + oldPoolSize);
  pkgChunk.fill(0, 12, 12 + 256);
  const pkgUtf16 = encode_utf16le(cleanPkg.slice(0, 127));
  pkgChunk.set(pkgUtf16, 12);

  const out = concat_u8([arscBytes.subarray(0, 12), newPool, pkgChunk]);
  new DataView(out.buffer).setUint32(4, out.length, true);
  return out;
}

/**
 * 4-byte zipaligns all uncompressed (STORE / method 0) entries in a ZIP archive,
 * required by Android 11+ (R+) for resources.arsc and uncompressed drawables.
 */
export function zipalign_apk(zipBytes) {
  const view = new DataView(zipBytes.buffer, zipBytes.byteOffset, zipBytes.byteLength);
  let eocdOffset = -1;
  for (let i = zipBytes.length - 22; i >= 0; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset < 0) throw new Error("Invalid ZIP archive: EOCD not found");

  const cdCount = view.getUint16(eocdOffset + 10, true);
  const cdOffset = view.getUint32(eocdOffset + 16, true);

  const localChunks = [];
  const newOffsets = new Map();
  let pos = 0;
  let outPos = 0;

  while (pos < cdOffset) {
    if (view.getUint32(pos, true) !== 0x04034b50) {
      throw new Error(`Invalid ZIP local file header at ${pos}`);
    }
    const oldOffset = pos;
    const method = view.getUint16(pos + 8, true);
    const compSize = view.getUint32(pos + 18, true);
    const nameLen = view.getUint16(pos + 26, true);
    const extraLen = view.getUint16(pos + 28, true);
    const headerEnd = pos + 30 + nameLen;
    const dataStart = headerEnd + extraLen;

    let newExtra = zipBytes.subarray(headerEnd, dataStart);
    if (method === 0) {
      const baseDataStart = outPos + 30 + nameLen;
      const pad = (4 - (baseDataStart % 4)) % 4;
      newExtra = new Uint8Array(pad);
    }

    const headerCopy = zipBytes.slice(pos, headerEnd);
    new DataView(headerCopy.buffer, headerCopy.byteOffset, headerCopy.byteLength).setUint16(28, newExtra.length, true);
    const dataSlice = zipBytes.subarray(dataStart, dataStart + compSize);

    newOffsets.set(oldOffset, outPos);
    localChunks.push(headerCopy, newExtra, dataSlice);
    outPos += headerCopy.length + newExtra.length + dataSlice.length;
    pos = dataStart + compSize;
  }

  const cdCopy = zipBytes.slice(cdOffset, eocdOffset);
  const cdView = new DataView(cdCopy.buffer, cdCopy.byteOffset, cdCopy.byteLength);
  let cdPos = 0;
  for (let i = 0; i < cdCount; i++) {
    if (cdView.getUint32(cdPos, true) !== 0x02014b50) {
      throw new Error(`Invalid ZIP central directory header at ${cdPos}`);
    }
    const nameLen = cdView.getUint16(cdPos + 28, true);
    const extraLen = cdView.getUint16(cdPos + 30, true);
    const commentLen = cdView.getUint16(cdPos + 32, true);
    const oldLocOffset = cdView.getUint32(cdPos + 42, true);
    cdView.setUint32(cdPos + 42, newOffsets.get(oldLocOffset), true);
    cdPos += 46 + nameLen + extraLen + commentLen;
  }

  const eocdCopy = zipBytes.slice(eocdOffset);
  new DataView(eocdCopy.buffer, eocdCopy.byteOffset, eocdCopy.byteLength).setUint32(16, outPos, true);

  return concat_u8([...localChunks, cdCopy, eocdCopy]);
}

/**
 * Signs an aligned APK using APK Signature Scheme v2 (0x7109871a) and v3 (0xf05368c0)
 * via the standard Web Crypto API (works in both browsers and Node.js 19+).
 */
export async function sign_apk_v2_v3(alignedApkBytes) {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error("Web Crypto API (crypto.subtle) is required for APK v2/v3 signing");
  }

  const view = new DataView(alignedApkBytes.buffer, alignedApkBytes.byteOffset, alignedApkBytes.byteLength);
  let eocdOffset = -1;
  for (let i = alignedApkBytes.length - 22; i >= 0; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset < 0) throw new Error("Invalid APK: EOCD not found");

  const cdOffset = view.getUint32(eocdOffset + 16, true);

  // For APK v2/v3 digest calculation, EOCD's central directory offset field must point to the start of the APK Signing Block (= cdOffset)
  const eocdForHash = alignedApkBytes.slice(eocdOffset);
  new DataView(eocdForHash.buffer, eocdForHash.byteOffset, eocdForHash.byteLength).setUint32(16, cdOffset, true);

  const sections = [
    alignedApkBytes.subarray(0, cdOffset),
    alignedApkBytes.subarray(cdOffset, eocdOffset),
    eocdForHash,
  ];

  // Compute 1 MB chunk SHA-256 digests per APK Signature Scheme v2/v3 spec
  const chunkDigests = [];
  const CHUNK_SIZE = 1048576;
  for (const sec of sections) {
    for (let off = 0; off < sec.length; off += CHUNK_SIZE) {
      const chunk = sec.subarray(off, Math.min(off + CHUNK_SIZE, sec.length));
      const chunkInput = new Uint8Array(5 + chunk.length);
      chunkInput[0] = 0xa5;
      new DataView(chunkInput.buffer).setUint32(1, chunk.length, true);
      chunkInput.set(chunk, 5);
      const digestBuf = await subtle.digest("SHA-256", chunkInput);
      chunkDigests.push(new Uint8Array(digestBuf));
    }
  }

  // Compute top-level SHA-256 digest: 0x5a || uint32LE(numChunks) || concat(chunkDigests)
  const topHeader = new Uint8Array(5);
  topHeader[0] = 0x5a;
  new DataView(topHeader.buffer).setUint32(1, chunkDigests.length, true);
  const topInput = concat_u8([topHeader, ...chunkDigests]);
  const topDigest = new Uint8Array(await subtle.digest("SHA-256", topInput));

  // Import Android Debug PKCS#8 RSA private key
  const pkcs8Bytes = b64_to_u8(DEBUG_PKCS8_B64);
  const privateKey = await subtle.importKey(
    "pkcs8",
    pkcs8Bytes,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  // Patch the APK Signing Block v2 (0x7109871a) and v3 (0xf05368c0) entries
  const sigBlock = b64_to_u8(APK_SIG_BLOCK_B64);
  const sbView = new DataView(sigBlock.buffer, sigBlock.byteOffset, sigBlock.byteLength);

  let p = 8; // skip initial uint64 block size
  while (p < sigBlock.length - 24) {
    const pairLen = Number(sbView.getBigUint64(p, true));
    const id = sbView.getUint32(p + 8, true);
    const valStart = p + 12;

    if (id === 0x7109871a || id === 0xf05368c0) {
      const signedDataLen = sbView.getUint32(valStart + 8, true);
      const signedDataOffset = valStart + 12;
      const digestOffset = valStart + 28; // 32-byte SHA-256 top digest
      const sigsOffset = valStart + (id === 0x7109871a ? 12 : 20) + signedDataLen;
      const sigBytesOffset = sigsOffset + 16; // 256-byte RSA-2048 signature

      sigBlock.set(topDigest, digestOffset);
      const signedData = sigBlock.subarray(signedDataOffset, signedDataOffset + signedDataLen);
      const signature = new Uint8Array(await subtle.sign("RSASSA-PKCS1-v1_5", privateKey, signedData));
      sigBlock.set(signature, sigBytesOffset);
    }
    p += 8 + pairLen;
  }

  // Final EOCD points to Central Directory shifted by sigBlock.length
  const eocdFinal = alignedApkBytes.slice(eocdOffset);
  new DataView(eocdFinal.buffer, eocdFinal.byteOffset, eocdFinal.byteLength).setUint32(
    16,
    cdOffset + sigBlock.length,
    true
  );

  return concat_u8([
    alignedApkBytes.subarray(0, cdOffset),
    sigBlock,
    alignedApkBytes.subarray(cdOffset, eocdOffset),
    eocdFinal,
  ]);
}

/**
 * Packages a dynamic watch face into an aligned Wear OS APK.
 *
 * @param {string} watchfaceXml - The WFF XML content
 * @param {Object} drawables - Map of drawable name to Uint8Array PNG bytes
 * @param {Object} metadata - Optional { label, packageId } overrides
 * @returns {Uint8Array} The zipaligned APK binary
 */
export function build_wearos_apk(watchfaceXml, drawables = {}, metadata = {}) {
  const baseApkBytes = b64_to_u8(BASE_WFF_APK_B64);
  const files = unzipSync(baseApkBytes);

  // 1. Patch binary AndroidManifest.xml and resources.arsc if custom label or packageId provided
  const label = String(metadata.label || DEFAULT_WATCHFACE_LABEL).trim() || DEFAULT_WATCHFACE_LABEL;
  const packageName = format_package_name(metadata.packageId, label);
  files["AndroidManifest.xml"] = patch_binary_manifest(files["AndroidManifest.xml"], packageName);
  files["resources.arsc"] = patch_resources_arsc(files["resources.arsc"], { label, packageName });

  // 2. Inject WFF watchface.xml
  files["res/raw/watchface.xml"] = strToU8(watchfaceXml);

  // 3. Inject drawables
  const mapping = {
    dial_face: "res/drawable-nodpi-v4/dial_face.png",
    dial_face_ambient: "res/drawable-nodpi-v4/dial_face_ambient.png",
    dial_face_ambient_black: "res/drawable-nodpi-v4/dial_face_ambient_black.png",
    dial_face_ambient_dimmed: "res/drawable-nodpi-v4/dial_face_ambient_dimmed.png",
    hour_hand: "res/drawable-nodpi-v4/hour_hand.png",
    hour_hand_ambient: "res/drawable-nodpi-v4/hour_hand_ambient.png",
    minute_hand: "res/drawable-nodpi-v4/minute_hand.png",
    minute_hand_ambient: "res/drawable-nodpi-v4/minute_hand_ambient.png",
    second_hand: "res/drawable-nodpi-v4/second_hand.png",
    cap: "res/drawable-nodpi-v4/cap.png",
    preview: "res/drawable-nodpi-v4/preview.png",
    icon: "res/drawable-nodpi-v4/icon.png",
  };

  for (const [key, path] of Object.entries(mapping)) {
    if (drawables[key] && drawables[key].length > 0) {
      files[path] = drawables[key];
    }
  }

  // 4. Re-zip archive with STORE (level 0) for resources.arsc and PNGs, DEFLATE (level 6) for XML/Manifest
  const zipEntries = {};
  for (const [name, data] of Object.entries(files)) {
    const uncompressed = name === "resources.arsc" || name.endsWith(".png");
    zipEntries[name] = [data, { level: uncompressed ? 0 : 6 }];
  }

  const rawZip = zipSync(zipEntries);
  return zipalign_apk(rawZip);
}

/**
 * Packages, 4-byte zipaligns, and signs a ready-to-install Wear OS APK (v2 + v3 schemes)
 * 100% in JavaScript using the Web Crypto API.
 *
 * @param {string} watchfaceXml - The WFF XML content
 * @param {Object} drawables - Map of drawable name to Uint8Array PNG bytes
 * @param {Object} metadata - Optional { label, packageId } overrides
 * @returns {Promise<Uint8Array>} The signed & zipaligned APK binary
 */
export async function build_signed_wearos_apk(watchfaceXml, drawables = {}, metadata = {}) {
  const alignedApk = build_wearos_apk(watchfaceXml, drawables, metadata);
  return await sign_apk_v2_v3(alignedApk);
}
