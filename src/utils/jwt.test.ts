import assert from "node:assert/strict";
import test from "node:test";
import { signToken, verifyToken } from "./jwt.js";

process.env.JWT_SECRET = "test-secret-that-is-long-enough-for-local-tests";

test("signToken creates a token that verifyToken can read", () => {
  const payload = { userId: "user-123", username: "alice" };

  const token = signToken(payload);

  assert.deepEqual(verifyToken(token), payload);
});

test("verifyToken rejects a malformed token", () => {
  assert.throws(() => verifyToken("not-a-jwt"));
});
