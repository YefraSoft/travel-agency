import { ChatGoogle } from "@langchain/google";
import { ChatOllama } from "@langchain/ollama";
import type { BaseMessage } from "@langchain/core/messages";
import { LLM_CONFIG } from "../../config/AppConfig";

/**
 * Result returned by the LLM service after generation.
 */
export interface LlmResult {
  content: string;
  model: string;
}

/**
 * LlmService
 *
 * Abstraction layer over multiple LLM providers:
 * - Primary: Google Gemini (via LangChain ChatGoogle)
 * - Fallback: Ollama (local model runtime)
 *
 * This service is designed to:
 * - Centralize LLM access
 * - Provide automatic fallback when the primary model fails
 * - Reuse instantiated clients (singleton-like behavior)
 *
 * Provider priority:
 * 1. Gemini (primary)
 * 2. Ollama (fallback on error)
 *
 * Behavior:
 * - If Gemini succeeds → returns its response
 * - If Gemini throws → logs warning and retries with Ollama
 *
 * Dependencies:
 * - LangChain chat models
 * - Environment variable: GOOGLE_API_KEY (for Gemini)
 */
export class LlmService {
  private gemini: ChatGoogle | null = null;
  private ollama: ChatOllama | null = null;

  /**
   * Creates or returns existing Gemini client instance.
   *
   * Uses configuration defined in LLM_CONFIG.
   *
   * @returns ChatGoogle instance
   */
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

  /**
   * Creates or returns existing Ollama client instance.
   *
   * Uses local Ollama server configuration.
   *
   * @returns ChatOllama instance
   */
  private getOrCreateOllama(): ChatOllama {
    if (!this.ollama) {
      this.ollama = new ChatOllama({
        model: LLM_CONFIG.model,
        temperature: LLM_CONFIG.temperature,
        maxRetries: LLM_CONFIG.maxRetries,
      });
    }
    return this.ollama;
  }

  /**
   * Generates a response using an LLM.
   *
   * Execution flow:
   * 1. Attempt generation using Gemini
   * 2. If it fails (quota, network, API error, etc.)
   *    fallback to Ollama
   *
   * @param messages - Array of chat messages following LangChain format
   *
   * @returns LlmResult containing:
   * - content: generated text
   * - model: which provider was used
   *
   * @throws Error only if both providers fail
   */
  async generate(messages: BaseMessage[]): Promise<LlmResult> {
    try {
      const response = await this.getOrCreateGemini().invoke(messages);
      return {
        content: response.content as string,
        model: LLM_CONFIG.model,
      };
    } catch (error) {
      console.warn(
        "Gemini unavailable/quota exceeded. Falling back to Ollama...",
      );
      const response = await this.getOrCreateOllama().invoke(messages);

      return {
        content: response.content as string,
        model: "ollama",
      };
    }
  }
}

export const llmService = new LlmService();
