import type { ErrorRequestHandler } from "express";
import mongoose from "mongoose";

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  // Handle malformed JSON request bodies emitted by express.json() / body-parser
  if (
    (error instanceof SyntaxError && ("body" in error || ("status" in error && (error as { status?: number }).status === 400))) ||
    (typeof error === "object" && error !== null && "type" in error && (error as { type?: unknown }).type === "entity.parse.failed")
  ) {
    res.status(400).json({ message: "Malformed JSON body" });
    return;
  }

  // Handle Mongoose CastError (e.g. invalid MongoDB ObjectId format)
  if (error instanceof mongoose.Error.CastError) {
    res.status(400).json({ message: "Invalid resource id" });
    return;
  }

  // Unexpected internal server errors: log stack trace and return 500
  console.error(error);
  res.status(500).json({ message: "Unexpected server error" });
};
