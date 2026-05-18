import { Router, type Request, type Response } from "express";
import { llmService } from "../../core/llm/LlmService";
import type { HealthResponse } from "../../utils/types";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { backendClient } from "../../services/BackendClient";

const apiRouter = Router();

/** GET /api/health — Health check completo */
apiRouter.get("/health", async (_req: Request, res: Response) => {
  const health: HealthResponse & {
    chromadb?: string;
    backend?: string;
    llm?: string;
  } = {
    ok: true,
    runtime: "bun",
    timestamp: new Date().toISOString(),
  };

  // Check backend
  try {
    await backendClient.getTravels();
    health.backend = "ok";
  } catch {
    health.backend = "error";
  }

  // Check LLM (ping rápido)
  try {
    const result = await llmService.generate([
      new SystemMessage("Responde solo con la palabra OK."),
      new HumanMessage("¿Estás funcionando?"),
    ]);
    health.llm = result.content.includes("OK") ? "ok" : "degraded";
  } catch {
    health.llm = "error";
  }

  res.json(health);
});

export { apiRouter };
