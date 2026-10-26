import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import mongoose from "mongoose";
import { errorHandler } from "./errorHandler.js";

test("errorHandler responds with 400 and does not log for malformed JSON error", () => {
  let logged = false;
  const originalError = console.error;
  console.error = () => { logged = true; };

  try {
    let capturedStatus: number | undefined;
    let capturedBody: unknown;

    const res = {
      status(code: number) {
        capturedStatus = code;
        return this;
      },
      json(body: unknown) {
        capturedBody = body;
        return this;
      },
    } as unknown as express.Response;

    const malformedError = Object.assign(new SyntaxError("Unexpected token in JSON"), {
      status: 400,
      body: "{bad",
    });

    errorHandler(malformedError, {} as express.Request, res, () => {});

    assert.equal(capturedStatus, 400);
    assert.deepEqual(capturedBody, { message: "Malformed JSON body" });
    assert.equal(logged, false, "Should not log stack trace for 400 client error");
  } finally {
    console.error = originalError;
  }
});

test("errorHandler responds with 400 and does not log for Mongoose CastError", () => {
  let logged = false;
  const originalError = console.error;
  console.error = () => { logged = true; };

  try {
    let capturedStatus: number | undefined;
    let capturedBody: unknown;

    const res = {
      status(code: number) {
        capturedStatus = code;
        return this;
      },
      json(body: unknown) {
        capturedBody = body;
        return this;
      },
    } as unknown as express.Response;

    const castError = new mongoose.Error.CastError("ObjectId", "invalid-id", "_id");

    errorHandler(castError, {} as express.Request, res, () => {});

    assert.equal(capturedStatus, 400);
    assert.deepEqual(capturedBody, { message: "Invalid resource id" });
    assert.equal(logged, false, "Should not log stack trace for CastError");
  } finally {
    console.error = originalError;
  }
});

test("errorHandler responds with 500 and logs stack trace for unexpected server error", () => {
  let logged = false;
  const originalError = console.error;
  console.error = () => { logged = true; };

  try {
    let capturedStatus: number | undefined;
    let capturedBody: unknown;

    const res = {
      status(code: number) {
        capturedStatus = code;
        return this;
      },
      json(body: unknown) {
        capturedBody = body;
        return this;
      },
    } as unknown as express.Response;

    const unexpectedError = new Error("Database failed unexpectedly");

    errorHandler(unexpectedError, {} as express.Request, res, () => {});

    assert.equal(capturedStatus, 500);
    assert.deepEqual(capturedBody, { message: "Unexpected server error" });
    assert.equal(logged, true, "Must log stack trace for 500 internal server error");
  } finally {
    console.error = originalError;
  }
});

test("end-to-end: POST with malformed JSON body returns 400 without console logging", async () => {
  let logged = false;
  const originalError = console.error;
  console.error = () => { logged = true; };

  const app = express();
  app.use(express.json());
  app.post("/api/auth/login", (_req, res) => {
    res.json({ ok: true });
  });
  app.use(errorHandler);

  const server = app.listen(0);
  try {
    const address = server.address();
    assert.ok(address && typeof address === "object");
    const port = address.port;

    const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{bad",
    });

    const body = await response.json();
    assert.equal(response.status, 400);
    assert.deepEqual(body, { message: "Malformed JSON body" });
    assert.equal(logged, false, "Should not log stack trace when parsing malformed JSON");
  } finally {
    console.error = originalError;
    server.close();
  }
});
