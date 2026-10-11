import type { ErrorRequestHandler } from "express";
import multer from "multer";
import { HttpError } from "../utils/httpError.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE" ? "File must be 5 MB or smaller" : err.message;
    return res.status(400).json({ error: message });
  }
  if (err?.name === "CastError") {
    return res.status(400).json({ error: `Invalid ${err.path}` });
  }
  if (err?.code === 11000) {
    return res.status(409).json({ error: "Duplicate value", details: err.keyValue });
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
};
