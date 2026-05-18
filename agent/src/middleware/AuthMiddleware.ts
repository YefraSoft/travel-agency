import type { Request, Response, NextFunction } from "express";

const RAG_API_KEY = process.env.RAG_API_KEY;

/**
 * Middleware que valida la API_KEY para endpoints internos.
 * /api/health siempre es público porque se monta antes de este middleware.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!RAG_API_KEY) {
    res.status(500).json({
      success: false,
      error: "Server misconfigured: RAG_API_KEY is required",
    });
    return;
  }

  const providedKey = req.headers["x-api-key"];

  if (providedKey === RAG_API_KEY) {
    return next();
  }

  res.status(401).json({
    success: false,
    error: "Unauthorized: invalid or missing API key",
  });
}
