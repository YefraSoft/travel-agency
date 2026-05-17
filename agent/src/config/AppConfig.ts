import type {
  LLMConfig,
  EmbeddingsConfig,
  VectorStoreConfig,
  SplitterConfig,
} from "../utils/types";

export const LLM_CONFIG: LLMConfig = {
  model: process.env.LLM_MODEL || "gemini-2.5-flash",
  temperature: Number(process.env.LLM_TEMPERATURE) || 0.35,
  maxRetries: Number(process.env.LLM_MAX_RETRIES) || 2,
};

export const EMBEDDINGS_CONFIG: EmbeddingsConfig = {
  model: process.env.EMBEDDINGS_MODEL || "gemini-embedding-2",
};

export const VECTOR_STORE_CONFIG: VectorStoreConfig = {
  collectionName: process.env.CHROMA_COLLECTION || "knowledge-base",
};

export const SPLITTER_CONFIG: SplitterConfig = {
  chunkSize: Number(process.env.CHUNK_SIZE) || 500,
  chunkOverlap: Number(process.env.CHUNK_OVERLAP) || 50,
};

export const SERVER_CONFIG = {
  port: Number(process.env.PORT) || 3000,
  host: process.env.HOST || "localhost",
} as const;

export const BACKEND_URL =
  process.env.BACKEND_URL || "http://localhost:8080";

export const KNOWLEDGE_DIR =
  process.env.KNOWLEDGE_DIR || "./data/knowledge";

export const OLLAMA_HOST =
  process.env.OLLAMA_HOST || "http://localhost:11434";

export const OLLAMA_LLM_MODEL =
  process.env.OLLAMA_LLM_MODEL || "gemma3:12b";

export const OLLAMA_EMBEDDINGS_MODEL =
  process.env.OLLAMA_EMBEDDINGS_MODEL || "qwen3-embedding";
