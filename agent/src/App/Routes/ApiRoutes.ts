import { Router, type Request, type Response } from "express";
import { llm } from "../../core/Models";
import type { HealthResponse } from "../../utils/types";

const apiRouter = Router();

/** GET /api/health */
apiRouter.get("/health", (_req: Request, res: Response) => {
  const body: HealthResponse = {
    ok: true,
    runtime: "bun",
    timestamp: new Date().toISOString(),
  };
  res.json(body);
});

/** GET /api/translate — demo LLM call */
apiRouter.get("/translate", async (_req: Request, res: Response) => {
  try {
    const aiMsg = await llm.invoke([
      [
        "system",
        "You are a helpful assistant that translates English to French. Translate the user sentence.",
      ],
      ["human", "I love programming."],
    ]);
    res.json({ success: true, result: aiMsg });
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
