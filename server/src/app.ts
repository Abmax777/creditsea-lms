import express from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./modules/auth/auth.routes.js";
import borrowerRoutes from "./modules/borrower/borrower.routes.js";
import opsRoutes from "./modules/ops/ops.routes.js";
import { errorHandler } from "./middleware/error.js";

export function createApp() {
  const app = express();
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });
  app.use("/api/auth", authRoutes);
  app.use("/api/borrower", borrowerRoutes);
  app.use("/api/ops", opsRoutes);

  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Route not found" });
  });
  app.use(errorHandler);
  return app;
}
