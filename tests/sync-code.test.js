const test = require("node:test");
const assert = require("node:assert/strict");

const {
  ALPHABET,
  codeToEmail,
  formatCode,
  generateCode,
  isValidCode,
  normalizeCode
} = require("../sync-code-core");

const VALID_CODE = "RR-ABCD-EFGH-JKLM-NPQR";

test("sync codes normalize and format consistently", () => {
  assert.equal(normalizeCode("rr abcd-efgh jklm-npqr"), "RRABCDEFGHJKLMNPQR");
  assert.equal(formatCode("abcdefghjklmnpqr"), VALID_CODE);
  assert.equal(formatCode(VALID_CODE), VALID_CODE);
});

test("sync codes require 16 unambiguous characters", () => {
  assert.equal(isValidCode(VALID_CODE), true);
  assert.equal(isValidCode("RR-ABCD"), false);
  assert.equal(isValidCode(`${VALID_CODE}A`), false);
  assert.equal(isValidCode("RR-ABCI-EFGH-JKLM-NPQR"), false);
  assert.equal(ALPHABET.includes("I"), false);
  assert.equal(ALPHABET.includes("O"), false);
});

test("generated codes use the readable Rise & Rep format", () => {
  const deterministicCrypto = {
    getRandomValues(values) {
      values.forEach((_, index) => { values[index] = index; });
      return values;
    }
  };
  const code = generateCode(deterministicCrypto);
  assert.match(code, /^RR-(?:[A-HJ-NP-Z2-9]{4}-){3}[A-HJ-NP-Z2-9]{4}$/);
  assert.equal(isValidCode(code), true);
});

test("account email is deterministic and does not reveal the sync code", async () => {
  const first = await codeToEmail(VALID_CODE);
  const second = await codeToEmail("abcd efgh jklm npqr");
  assert.equal(first, second);
  assert.match(first, /^[a-f0-9]{64}@sync\.rise-and-rep\.app$/);
  assert.equal(first.includes("ABCD"), false);
});
