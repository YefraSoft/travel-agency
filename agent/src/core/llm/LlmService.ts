import { ChatGoogle } from "@langchain/google";
import type { BaseMessage } from "@langchain/core/messages";
import { LLM_CONFIG } from "../../config/AppConfig";

export interface LlmResult {
  content: string;
  model: string;
}

/**
 * Servicio de LLM usando Google Gemini.
 * (Ollama removido — el equipo no tiene capacidad para ejecutarlo localmente)
 */
export class LlmService {
  private gemini: ChatGoogle | null = null;

  private getOrCreateGemini(): ChatGoogle {
    if (!this.gemini) {
      this.gemini = new ChatGoogle({
        model: LLM_CONFIG.model,
        temperature: LLM_CONFIG.temperature,
        maxRetries: LLM_CONFIG.maxRetries,
        apiKey: process.env.GOOGLE_API_KEY,
      });
    }
    return this.gemini;
  }

  async generate(messages: BaseMessage[]): Promise<LlmResult> {
    const response = await this.getOrCreateGemini().invoke(messages);
    return {
      content: response.content as string,
      model: LLM_CONFIG.model,
    };
  }
}

export const llmService = new LlmService();


/*

import { ChatGoogle } from "@langchain/google";
import { ChatOllama } from "@langchain/ollama";
import type { BaseMessage } from "@langchain/core/messages";
import { LLM_CONFIG, OLLAMA_HOST, OLLAMA_LLM_MODEL } from "../../config/AppConfig";
export interface LlmResult {
  content: string;
  model: string;
}
export class LlmService {
  private readonly gemini: ChatGoogle;
  private readonly ollama: ChatOllama;
  constructor() {
    this.gemini = new ChatGoogle({
      model: LLM_CONFIG.model,
      temperature: LLM_CONFIG.temperature,
      maxRetries: 1,
    });
    this.ollama = new ChatOllama({
      model: OLLAMA_LLM_MODEL,
      baseUrl: OLLAMA_HOST,
      temperature: LLM_CONFIG.temperature,
    });
  }
     async generate(messages: BaseMessage[]): Promise<LlmResult> {
    try {
      const response = await this.gemini.invoke(messages);
      return {
        content: response.content as string,
        model: `gemini-${LLM_CONFIG.model}`,
      };
    } catch (geminiError) {
      console.warn(
        `[LlmService] Gemini failed, falling back to Ollama:`,
        geminiError instanceof Error ? geminiError.message : geminiError
      );
      try {
        const response = await this.ollama.invoke(messages);
        return {
          content: response.content as string,
          model: `ollama-${OLLAMA_LLM_MODEL}`,
        };
      } catch (ollamaError) {
        throw new Error(
          `LLM generation failed. Gemini: ${geminiError instanceof Error ? geminiError.message : "unknown"}. Ollama: ${ollamaError instanceof Error ? ollamaError.message : "unknown"}`
        );
      }
    }
  }
}
export const llmService = new LlmService();
*/
