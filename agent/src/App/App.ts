import express from "express";
import { apiRouter } from "./Routes/ApiRoutes";
import { ragRouter } from "./Routes/RagRoutes";

export function createApp() {
  const app = express();

  app.use(express.json());

  // Mount routers
  app.use("/api", apiRouter);
  app.use("/api/rag", ragRouter);

  return app;
}
