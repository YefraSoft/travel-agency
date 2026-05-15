import { Chroma } from "@langchain/community/vectorstores/chroma";
import type { Document } from "@langchain/core/documents";
import type { Embeddings } from "@langchain/core/embeddings";
import type { SearchResult, VectorStoreConfig } from "../../utils/types";
import { VECTOR_STORE_CONFIG } from "../../config/AppConfing";
import { embeddings } from "../Models";

export class VectorStoreService {
  private readonly store: Chroma;
  private readonly config: VectorStoreConfig;

  constructor(
    embeddingsModel: Embeddings = embeddings,
    config: VectorStoreConfig = VECTOR_STORE_CONFIG,
  ) {
    this.config = config;
    this.store = new Chroma(embeddingsModel, {
      collectionName: this.config.collectionName,
    });
  }

  async addDocuments(docs: Document[]): Promise<string[]> {
    if (docs.length === 0) {
      console.warn("No documents provided to addDocuments.");
      return [];
    }
    const ids = await this.store.addDocuments(docs);
    console.log(
      `Added ${ids.length} documents to collection "${this.config.collectionName}"`,
    );
    return ids;
  }

  async similaritySearch(query: string, k = 4): Promise<SearchResult> {
    const documents = await this.store.similaritySearch(query, k);
    return {
      documents,
      query,
      totalFound: documents.length,
    };
  }

  async deleteCollection(): Promise<void> {
    await this.store.delete({ filter: {} });
    console.log(`Cleared collection "${this.config.collectionName}"`);
  }
}
