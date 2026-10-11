import type { RequestHandler } from "express";
import { z, type ZodType } from "zod";
import { badRequest } from "../utils/httpError.js";

export const validateBody =
  (schema: ZodType): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(badRequest("Validation failed", z.flattenError(result.error).fieldErrors));
    }
    req.body = result.data;
    next();
  };
