import { Router, type Request, type Response } from "express";
import { RagPipeline } from "../../core/PipeLine";
import { DocumentLoader } from "../../core/loaders/DocumentLoader";
import { ChromaVectorStore } from "../../core/vectors/ChromaVector";
import { RagQueryBodySchema } from "../../utils/schemas";

const ragRouter = Router();

const pipeline = new RagPipeline(
  new DocumentLoader("./data"),
  new ChromaVectorStore(), // ← swappear a QdrantStore aquí cuando migres
);

const VIAJES_API_URL =
  process.env.VIAJES_API_URL ?? "http://localhost:8080/api/rag/travels";

/** POST /api/rag/ingest — carga docs del filesystem */
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

/** POST /api/rag/ingest/viajes — actualiza contexto con viajes del backend */
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

/** POST /api/rag/query — búsqueda semántica con validación Zod */
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
