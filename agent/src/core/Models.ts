import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { EMBEDDINGS_CONFIG } from "../config/AppConfig";

export const embeddings = new GoogleGenerativeAIEmbeddings({
  model: EMBEDDINGS_CONFIG.model,
});

/*
export const llm = new ChatOllama({
  model: LLM_CONFIG.model,
  temperature: LLM_CONFIG.temperature,
  maxRetries: LLM_CONFIG.maxRetries,
});

export const embeddings = new OllamaEmbeddings({
  model: EMBEDDINGS_CONFIG.model,
});
*/