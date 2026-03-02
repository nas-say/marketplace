import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeGithubHandle,
  normalizeTwitterHandle,
  normalizeWebsiteUrl,
  toSafeWebsiteUrl,
} from "../src/lib/validation/profile";

test("normalizeWebsiteUrl accepts host-only input and normalizes to https", () => {
  const result = normalizeWebsiteUrl("example.com");
  assert.equal(result.error, undefined);
  assert.equal(result.value, "https://example.com/");
});

test("normalizeWebsiteUrl rejects non-http schemes", () => {
  const result = normalizeWebsiteUrl("javascript:alert(1)");
  assert.equal(result.error, "Website must use https:// or http://.");
  assert.equal(result.value, "");
  assert.equal(toSafeWebsiteUrl("javascript:alert(1)"), null);
});

test("normalizeTwitterHandle strips @ and validates chars", () => {
  assert.deepEqual(normalizeTwitterHandle("@@side_flip"), { value: "side_flip" });
  assert.equal(normalizeTwitterHandle("bad handle").error, "Twitter handle must be 1-15 characters with letters, numbers, or underscores.");
});

test("normalizeGithubHandle rejects invalid username shapes", () => {
  assert.deepEqual(normalizeGithubHandle("@sideflip"), { value: "sideflip" });
  assert.equal(
    normalizeGithubHandle("-not-valid").error,
    "GitHub username can use letters, numbers, and single hyphens (not at ends)."
  );
});
