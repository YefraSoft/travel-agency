import { Chroma } from "@langchain/community/vectorstores/chroma";
import type { Document } from "@langchain/core/documents";
import type { Embeddings } from "@langchain/core/embeddings";
import type { IVectorStore, SearchResult } from "../../utils/interfaces";
import { VECTOR_STORE_CONFIG } from "../../config/AppConfing";
import { embeddings } from "../Models";

export class ChromaVectorStore implements IVectorStore {
  private readonly store: Chroma;
  private readonly collectionName: string;

  constructor(
    embeddingsModel: Embeddings = embeddings,
    collectionName: string = VECTOR_STORE_CONFIG.collectionName,
  ) {
    this.collectionName = collectionName;
    this.store = new Chroma(embeddingsModel, { collectionName });
  }

  async addDocuments(docs: Document[]): Promise<string[]> {
    if (docs.length === 0) {
      console.warn(
        "[ChromaVectorStore] addDocuments llamado con 0 documentos.",
      );
      return [];
    }
    const ids = await this.store.addDocuments(docs);
    console.log(
      `[ChromaVectorStore] ${ids.length} documentos añadidos a "${this.collectionName}"`,
    );
    return ids;
  }

  async similaritySearch(query: string, k = 4): Promise<SearchResult> {
    const documents = await this.store.similaritySearch(query, k);
    return { documents, query, totalFound: documents.length };
  }

  async deleteCollection(): Promise<void> {
    await this.store.delete({ filter: {} });
    console.log(
      `[ChromaVectorStore] Colección "${this.collectionName}" limpiada.`,
    );
  }
}

/*
 * ─── Migrar a Qdrant en el futuro ────────────────────────────────────────────
 * import { QdrantVectorStore } from "@langchain/qdrant";
 *
 * export class QdrantStore implements IVectorStore {
 *   private readonly store: QdrantVectorStore;
 *   constructor(embeddingsModel = embeddings) {
 *     this.store = new QdrantVectorStore(embeddingsModel, {
 *       url: process.env.QDRANT_URL,
 *       collectionName: VECTOR_STORE_CONFIG.collectionName,
 *     });
 *   }
 *   async addDocuments(docs: Document[]) { ... }
 *   async similaritySearch(query: string, k = 4) { ... }
 *   async deleteCollection() { ... }
 * }
 */
