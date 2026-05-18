import type { Document } from "@langchain/core/documents";
import type { BaseDocumentLoader } from "@langchain/core/document_loaders/base";

export interface SplitterConfig {
  chunkSize: number;
  chunkOverlap: number;
}

export interface VectorStoreConfig {
  collectionName: string;
}

export interface LLMConfig {
  model: string;
  temperature: number;
  maxRetries: number;
}

export interface EmbeddingsConfig {
  model: string;
}

export interface SearchResult {
  documents: Document[];
  query: string;
  totalFound: number;
}

export interface HealthResponse {
  ok: boolean;
  runtime: string;
  timestamp: string;
}

export type FileLoaderMap = Record<string, (path: string) => BaseDocumentLoader>;
