import type { Request, Response, NextFunction } from "express";

const RAG_API_KEY = process.env.RAG_API_KEY;

/**
 * Middleware que valida la API_KEY para endpoints internos.
 * Si RAG_API_KEY no está definida, permite todas las requests (modo dev).
 * /api/health siempre es público.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!RAG_API_KEY) {
    return next();
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
