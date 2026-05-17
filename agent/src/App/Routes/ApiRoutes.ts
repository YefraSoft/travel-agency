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

/** GET /api/translate — demo LLM call */
apiRouter.get("/translate", async (_req: Request, res: Response) => {
  try {
    const result = await llmService.generate([
      new SystemMessage("You are a helpful assistant that translates English to French. Translate the user sentence."),
      new HumanMessage("I love programming."),
    ]);
    res.json({ success: true, result });
  } catch (error) {
    console.error("LLM error:", error);
    res.status(500).json({ success: false, error: String(error) });
  }
});

/** POST /api/users — placeholder */
apiRouter.post("/users", (req: Request, res: Response) => {
  const user = req.body;
  res.json({ success: true, data: user });
});

export { apiRouter };
