import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import pinoHttp from "pino-http";
import pino from "pino";
import * as Sentry from "@sentry/node";

import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import applyRoutes from "./routes/apply.routes.js";
import shopRoutes from "./routes/shop.routes.js";
import adminApprovalRoutes from "./routes/admin.approvals.routes.js";
import menuRoutes from "./routes/menu.routes.js";
import orderRoutes from "./routes/order.routes.js";
import flashDealRoutes from "./routes/flashDeal.routes.js";
import ratingRoutes from "./routes/rating.routes.js";
import complaintRoutes from "./routes/complaint.routes.js";
import sellerRoutes from "./routes/seller.routes.js";
import addressRoutes from "./routes/address.routes.js";

dotenv.config();

const app = express();
const logger = pino({ level: process.env.LOG_LEVEL || "info" });

// CORS first so preflight OPTIONS always gets correct headers (before helmet/rateLimit).
const corsOrigin = process.env.CORS_ORIGIN?.trim();
const allowAll = !corsOrigin || corsOrigin === "*";
const allowedList = allowAll ? [] : corsOrigin.split(",").map((s) => s.trim());
// Allow *.vercel.app for Vercel deployments when using allow-all or when not in list.
const vercelOrigin = (origin, cb) => {
  if (allowAll) return cb(null, true);
  if (allowedList.includes(origin)) return cb(null, true);
  if (origin && /^https:\/\/[a-z0-9.-]+\.vercel\.app$/i.test(origin)) return cb(null, true);
  return cb(null, allowedList.length ? false : true);
};
const corsOptions = {
  origin: allowAll && allowedList.length === 0 ? true : vercelOrigin,
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));

app.use(pinoHttp({ logger }));
app.use(helmet());
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
  })
);
app.use(express.json());

app.get("/api/v1/health", (req, res) => {
  res.json({ success: true, data: { status: "ok" } });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/apply", applyRoutes);
app.use("/api/v1/shops", shopRoutes);
app.use("/api/v1/admin/approvals", adminApprovalRoutes);
app.use("/api/v1", menuRoutes);
app.use("/api/v1", orderRoutes);
app.use("/api/v1", flashDealRoutes);
app.use("/api/v1", ratingRoutes);
app.use("/api/v1", complaintRoutes);
app.use("/api/v1", sellerRoutes);
app.use("/api/v1", addressRoutes);

Sentry.setupExpressErrorHandler(app);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: "Route not found" },
  });
});

app.use((err, req, res, _next) => {
  req.log?.error?.({ err }, "Unhandled error");
  const isDev = (process.env.NODE_ENV || "development") === "development";
  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: isDev ? err.message : "Something went wrong",
    },
  });
});

export { app };
export { logger };
