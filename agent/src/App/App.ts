import express from "express";
import cors from "cors";
import { apiRouter } from "./Routes/ApiRoutes";
import { ragRouter } from "./Routes/RagRoutes";
import { chatRouter } from "./Routes/ChatRoutes";

export function createApp() {
  const app = express();

  app.use(express.json());

  // CORS — permitir orígenes configurados o todos en desarrollo
  const corsOrigins = process.env.CORS_ORIGINS?.split(",") ?? "*";
  app.use(cors({
    origin: corsOrigins === "*" ? "*" : corsOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
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
  app.use("/api", apiRouter);
  app.use("/api/rag", ragRouter);
  app.use("/api", chatRouter);

  return app;
}
