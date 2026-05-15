import type {
  LLMConfig,
  EmbeddingsConfig,
  VectorStoreConfig,
  SplitterConfig,
} from "../utils/types";

export const LLM_CONFIG: LLMConfig = {
  model: "gpt-oss",
  temperature: 0,
  maxRetries: 2,
};

export const EMBEDDINGS_CONFIG: EmbeddingsConfig = {
  model: "qwen3-embedding",
};

export const VECTOR_STORE_CONFIG: VectorStoreConfig = {
  collectionName: "knowledge-base",
};

export const SPLITTER_CONFIG: SplitterConfig = {
  chunkSize: 100,
  chunkOverlap: 0,
};

export const SERVER_CONFIG = {
  port: Number(process.env.PORT) || 3000,
  host: "localhost",
} as const;
