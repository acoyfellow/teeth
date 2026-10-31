import { test } from "node:test";
import assert from "node:assert/strict";
import { canPublish, withinQuota } from "./quota.ts";

test("functions return booleans", () => {
  assert.equal(typeof withinQuota(1, 2), "boolean");
  assert.equal(typeof canPublish("admin", false), "boolean");
});
