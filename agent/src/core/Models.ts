import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";
import { ChatGoogle,  } from "@langchain/google";
import { LLM_CONFIG, EMBEDDINGS_CONFIG } from "../config/AppConfing";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

export const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "text-embedding-004"
});

export const llm = new ChatGoogle("gemini-2.5-flash");
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