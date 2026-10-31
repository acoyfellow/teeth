import { test } from "node:test";
import assert from "node:assert/strict";
import { canPublish, withinQuota } from "./quota.ts";

test("quota boundary", () => {
  assert.equal(withinQuota(1, 2), true);
  assert.equal(withinQuota(2, 2), false);
  assert.equal(withinQuota(3, 2), false);
});

test("publish rules", () => {
  assert.equal(canPublish("admin", false), true);
  assert.equal(canPublish("editor", true), true);
  assert.equal(canPublish("editor", false), false);
  assert.equal(canPublish("viewer", true), false);
});
