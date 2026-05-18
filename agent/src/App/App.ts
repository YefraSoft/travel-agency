import express from "express";
import cors from "cors";
import { apiRouter } from "./Routes/ApiRoutes";
import { ragRouter } from "./Routes/RagRoutes";
import { chatRouter } from "./Routes/ChatRoutes";
import { authMiddleware } from "../middleware/AuthMiddleware";

/**
 * Creates and configures the Express application instance.
 *
 * Responsibilities:
 * - Initializes Express.
 * - Enables JSON request parsing.
 * - Configures CORS policy.
 * - Registers request logging middleware.
 * - Mounts public and protected API routes.
 *
 * Route structure:
 *
 * Public routes:
 * - `/api/*`
 *   - Includes health endpoints such as `/api/health`
 *
 * Protected routes:
 * - `/api/rag/*`
 * - `/api/*` (chat endpoints)
 *
 * Protected routes require a valid `x-api-key` header
 * handled by `authMiddleware`.
 *
 * Environment variables:
 * - `CORS_ORIGINS`
 *   Comma-separated list of allowed origins.
 *   Example:
 *   ```env
 *   CORS_ORIGINS=http://localhost:3000,https://myapp.com
 *   ```
 *
 * Middleware included:
 * - `express.json()`
 *   Parses JSON request bodies.
 *
 * - `cors()`
 *   Enables cross-origin requests.
 *
 * - Request logger
 *   Logs:
 *   - timestamp
 *   - HTTP method
 *   - request URL
 *   - response status
 *   - execution time
 *
 * Example log:
 * ```txt
 * [2026-05-18T12:00:00.000Z] GET /api/health 200 - 4.32ms
 * ```
 *
 * Example usage:
 * ```ts
 * const app = createApp();
 * app.listen(3000);
 * ```
 *
 * @returns Configured Express application instance.
 */
export function createApp() {
  const app = express();

  app.use(express.json());

  const corsOrigins = process.env.CORS_ORIGINS?.split(",") ?? "*";
  app.use(
    cors({
      origin: corsOrigins === "*" ? "*" : corsOrigins,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
    }),
  );

  // Logging middleware
  app.use((req, res, next) => {
    const start = performance.now();

    res.on("finish", () => {
      const duration = (performance.now() - start).toFixed(2);

      console.log(
        `[${new Date().toISOString()}] ` +
          `${req.method} ${req.originalUrl} ` +
          `${res.statusCode} - ${duration}ms`,
      );
    });

    next();
  });

  // /api/health es público (necesario para Docker healthcheck)
  app.use("/api", apiRouter);

  // Endpoints protegidos con API_KEY
  app.use("/api/rag", authMiddleware, ragRouter);
  app.use("/api", authMiddleware, chatRouter);

  return app;
}
