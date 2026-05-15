import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";
import { LLM_CONFIG, EMBEDDINGS_CONFIG } from "../config/AppConfing";

export const llm = new ChatOllama({
  model: LLM_CONFIG.model,
  temperature: LLM_CONFIG.temperature,
  maxRetries: LLM_CONFIG.maxRetries,
});

export const embeddings = new OllamaEmbeddings({
  model: EMBEDDINGS_CONFIG.model,
});
