import express from "express";
import cors from "cors";
import { apiRouter } from "./Routes/ApiRoutes";
import { ragRouter } from "./Routes/RagRoutes";
import { chatRouter } from "./Routes/ChatRoutes";
import { authMiddleware } from "../middleware/AuthMiddleware";

export function createApp() {
  const app = express();

  app.use(express.json());

  // CORS — permitir orígenes configurados o todos en desarrollo
  const corsOrigins = process.env.CORS_ORIGINS?.split(",") ?? "*";
  app.use(cors({
    origin: corsOrigins === "*" ? "*" : corsOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
  }));

  // Logging middleware básico
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    });
    next();
  });

  // Mount routers
  // /api/health es público (necesario para Docker healthcheck)
  app.use("/api", apiRouter);

  // Endpoints protegidos con API_KEY
  app.use("/api/rag", authMiddleware, ragRouter);
  app.use("/api", authMiddleware, chatRouter);

  return app;
}
