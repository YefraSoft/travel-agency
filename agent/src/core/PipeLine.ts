import type { Document } from "@langchain/core/documents";
import { DocumentLoader } from "./loaders/DocumentLoader";
import { ViajesLoader } from "./loaders/ViajesLoader";
import type { IVectorStore, SearchResult } from "../utils/interfaces";

export class RagPipeline {
  private readonly loader: DocumentLoader;
  private readonly vectorStore: IVectorStore; // ← interfaz, no implementación concreta

  constructor(loader: DocumentLoader, vectorStore: IVectorStore) {
    this.loader = loader;
    this.vectorStore = vectorStore;
  }

  /** Carga docs del filesystem, los chunkea y guarda embeddings. */
  async ingestFiles(): Promise<void> {
    const docs = await this.loader.load();
    await this.vectorStore.addDocuments(docs);
  }

  /**
   * Obtiene viajes de tu backend, los convierte a Documents y actualiza el contexto.
   * Llámalo cuando quieras refrescar la info de viajes (cron, webhook, etc.).
   */
  async ingestViajes(apiUrl: string): Promise<void> {
    const viajesLoader = new ViajesLoader(apiUrl);
    const docs = await viajesLoader.load();
    await this.vectorStore.addDocuments(docs);
  }

  /** Añade documentos arbitrarios al contexto. */
  async ingestDocs(docs: Document[]): Promise<void> {
    await this.vectorStore.addDocuments(docs);
  }

  /** Busca chunks relevantes para una pregunta. */
  async query(question: string, k = 4): Promise<SearchResult> {
    return this.vectorStore.similaritySearch(question, k);
  }
}
