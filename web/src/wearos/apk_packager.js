// apk_packager.js — Injects dynamic WFF XML and dial assets into the Wear OS APK container,
// 4-byte zipaligns uncompressed resources, and signs with APK Signature Scheme v2 & v3 via Web Crypto API.
import { unzipSync, zipSync, strToU8 } from "./fflate.js";
import { BASE_WFF_APK_B64 } from "./base_template.js";
import { APK_SIG_BLOCK_B64, DEBUG_PKCS8_B64 } from "./apk_sig_template.js";

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
 * @returns {Uint8Array} The zipaligned APK binary
 */
export function build_wearos_apk(watchfaceXml, drawables = {}) {
  const baseApkBytes = b64_to_u8(BASE_WFF_APK_B64);
  const files = unzipSync(baseApkBytes);

  // 1. Inject WFF watchface.xml
  files["res/raw/watchface.xml"] = strToU8(watchfaceXml);

  // 2. Inject drawables
  const mapping = {
    dial_face: "res/drawable-nodpi-v4/dial_face.png",
    dial_face_ambient: "res/drawable-nodpi-v4/dial_face_ambient.png",
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

  // 3. Re-zip archive with STORE (level 0) for resources.arsc and PNGs, DEFLATE (level 6) for XML/Manifest
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
 * @returns {Promise<Uint8Array>} The signed & zipaligned APK binary
 */
export async function build_signed_wearos_apk(watchfaceXml, drawables = {}) {
  const alignedApk = build_wearos_apk(watchfaceXml, drawables);
  return await sign_apk_v2_v3(alignedApk);
}
