import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "node:path";
import { env } from "./config/env.js";
import { notFoundHandler, errorHandler } from "./middlewares/error.js";

import { authRouter } from "./modules/auth.js";
import { usersRouter } from "./modules/users.js";
import { categoriesRouter, productsRouter } from "./modules/catalog.js";
import { ordersRouter } from "./modules/orders.js";
import { paymentsRouter } from "./modules/payments.js";
import { kitchenRouter } from "./modules/kitchen.js";
import { dispatchRouter } from "./modules/dispatch.js";
import { courierRouter } from "./modules/courier.js";
import { employeesRouter, couriersRouter, adminRouter } from "./modules/admin.js";
import { customersRouter } from "./modules/customers.js";
import { uploadsRouter } from "./modules/uploads.js";

export function createApp() {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(
    cors({
      credentials: true,
      origin(origin, cb) {
        // permite requests sem origin (apps mobile/capacitor, curl) e origens da lista
        if (!origin || env.corsOrigins.includes(origin)) return cb(null, true);
        cb(new Error(`Origin não permitida: ${origin}`));
      },
    })
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(cookieParser());
  if (!env.isProd) app.use(morgan("dev"));

  // arquivos enviados (StorageService local)
  app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

  app.get("/health", (_req, res) => res.json({ ok: true, service: "cabana-api", ts: Date.now() }));

  app.use("/auth", authRouter);
  app.use("/me", usersRouter);
  app.use("/categories", categoriesRouter);
  app.use("/products", productsRouter);
  app.use("/orders", ordersRouter);
  app.use("/payments", paymentsRouter);
  app.use("/kitchen", kitchenRouter);
  app.use("/dispatch", dispatchRouter);
  app.use("/courier", courierRouter);
  app.use("/employees", employeesRouter);
  app.use("/couriers", couriersRouter);
  app.use("/customers", customersRouter);
  app.use("/admin", adminRouter);
  app.use("/uploads", uploadsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
