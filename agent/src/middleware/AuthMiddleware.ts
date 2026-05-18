import type { Request, Response, NextFunction } from "express";

const RAG_API_KEY = process.env.RAG_API_KEY;

/**
 * Express middleware that validates requests using an API key.
 *
 * This middleware checks the `x-api-key` header against the
 * `RAG_API_KEY` environment variable.
 *
 * Authentication flow:
 * - If `RAG_API_KEY` is not configured, responds with HTTP 500.
 * - If the provided API key is valid, continues to the next middleware.
 * - Otherwise, responds with HTTP 401 Unauthorized.
 *
 * Notes:
 * - Public routes such as `/api/health` should be mounted
 *   before this middleware.
 * - Intended for protecting internal/private API endpoints.
 *
 * Expected header:
 * ```http
 * x-api-key: <your-api-key>
 * ```
 *
 * Example:
 * ```ts
 * app.use(authMiddleware);
 * ```
 *
 * @param req Express request object.
 * @param res Express response object.
 * @param next Express next middleware function.
 *
 * @returns Returns an HTTP response when authentication fails,
 * otherwise calls `next()`.
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
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
