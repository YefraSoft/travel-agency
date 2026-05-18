import { Router, type Request, type Response } from "express";
import { RagPipeline } from "../../core/PipeLine";
import { DocumentLoader } from "../../core/loaders/DocumentLoader";
import { ChromaVectorStore } from "../../core/vectors/ChromaVector";
import { RagQueryBodySchema } from "../../utils/schemas";

/**
 * ragRouter
 *
 * Express router that exposes REST endpoints for the RAG system.
 *
 * Responsibilities:
 * - Ingest documents from filesystem into vector store
 * - Ingest travel data from backend API into vector store
 * - Perform semantic search queries over embeddings
 *
 * Acts as the HTTP interface for the core RagPipeline.
 */
const ragRouter = Router();

/**
 * RagPipeline instance (singleton for this router scope)
 *
 * Initializes:
 * - DocumentLoader for filesystem ingestion
 * - ChromaVectorStore as embedding storage backend
 */
const pipeline = new RagPipeline(
  new DocumentLoader("./data"),
  new ChromaVectorStore(),
);

/**
 * Default API URL used for travel ingestion.
 * Falls back to local backend if environment variable is not set.
 */
const VIAJES_API_URL =
  process.env.VIAJES_API_URL ?? "http://localhost:8080/api/rag/travels";

/**
 * POST /api/rag/ingest
 *
 * Ingests local filesystem documents into the vector database.
 *
 * Workflow:
 * 1. Load files from ./data
 * 2. Split into chunks
 * 3. Generate embeddings
 * 4. Store in vector DB
 */
ragRouter.post("/ingest", async (_req: Request, res: Response) => {
  try {
    await pipeline.ingestFiles();
    res.json({
      success: true,
      message: "Documentos ingestados correctamente.",
    });
  } catch (error) {
    console.error("[/ingest]", error);
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * POST /api/rag/ingest/viajes
 *
 * Ingests travel data from external backend API into the vector store.
 *
 * This endpoint:
 * - Fetches travel data
 * - Converts it into embeddings via ViajesLoader
 * - Stores it in the vector database
 *
 * Body (optional):
 * - apiUrl: override default travel API endpoint
 */
ragRouter.post("/ingest/viajes", async (req: Request, res: Response) => {
  const apiUrl = (req.body as { apiUrl?: string })?.apiUrl ?? VIAJES_API_URL;
  try {
    await pipeline.ingestViajes(apiUrl);
    res.json({ success: true, message: "Contexto de viajes actualizado." });
  } catch (error) {
    console.error("[/ingest/viajes]", error);
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * POST /api/rag/query
 *
 * Performs a semantic search over the vector database.
 *
 * Uses Zod validation to ensure:
 * - question is required
 * - k is a positive integer
 *
 * Returns raw similarity search results without LLM generation.
 *
 * Useful for debugging retrieval quality.
 */
ragRouter.post("/query", async (req: Request, res: Response) => {
  const parsed = RagQueryBodySchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      errors: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const result = await pipeline.query(parsed.data.question, parsed.data.k);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("[/query]", error);
    res.status(500).json({ success: false, error: String(error) });
  }
});

export { ragRouter };
