(function initializeSyncCodeCore(globalScope) {
  const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const CODE_CHARACTERS = 16;
  const PREFIX = "RR";

  function normalizeCode(value = "") {
    const compact = String(value).toUpperCase().replace(/[^A-Z0-9]/g, "");
    const body = compact.startsWith(PREFIX) ? compact.slice(PREFIX.length) : compact;
    return `${PREFIX}${body}`;
  }

  function formatCode(value = "") {
    const normalized = normalizeCode(value);
    const body = normalized.slice(PREFIX.length);
    const groups = body.match(/.{1,4}/g) || [];
    return [PREFIX, ...groups].join("-");
  }

  function isValidCode(value = "") {
    const normalized = normalizeCode(value);
    const body = normalized.slice(PREFIX.length);
    return body.length === CODE_CHARACTERS && [...body].every((character) => ALPHABET.includes(character));
  }

  function generateCode(cryptoSource = globalScope.crypto) {
    if (!cryptoSource?.getRandomValues) throw new Error("Secure code creation is not supported in this browser.");
    const random = new Uint8Array(CODE_CHARACTERS);
    cryptoSource.getRandomValues(random);
    const body = [...random].map((value) => ALPHABET[value % ALPHABET.length]).join("");
    return formatCode(`${PREFIX}${body}`);
  }

  async function codeToEmail(value) {
    if (!isValidCode(value)) throw new Error("Enter a complete Rise & Rep sync code.");
    if (!globalScope.crypto?.subtle || !globalScope.TextEncoder) throw new Error("Secure sign-in is not supported in this browser.");
    const bytes = new globalScope.TextEncoder().encode(normalizeCode(value));
    const digest = await globalScope.crypto.subtle.digest("SHA-256", bytes);
    const hash = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
    return `${hash}@sync.rise-and-rep.app`;
  }

  const api = { ALPHABET, CODE_CHARACTERS, normalizeCode, formatCode, isValidCode, generateCode, codeToEmail };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  globalScope.RiseRepSyncCode = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
