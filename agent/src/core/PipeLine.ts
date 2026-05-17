import type { Document } from "@langchain/core/documents";
import { DocumentLoader } from "./loaders/DocumentLoader";
import { ViajesLoader } from "./loaders/ViajesLoader";
import type { IVectorStore, SearchResult } from "../utils/interfaces";
import { llmService } from "./llm/LlmService";
import { PromptBuilder } from "./llm/PromptBuilder";
import type { RagTravel } from "../utils/schemas";
import type { ChatHistoryEntry } from "./llm/PromptBuilder";

export interface RagResponse {
  answer: string;
  model: string;
}

export class RagPipeline {
  private readonly loader: DocumentLoader;
  private readonly vectorStore: IVectorStore;

  constructor(loader: DocumentLoader, vectorStore: IVectorStore) {
    this.loader = loader;
    this.vectorStore = vectorStore;
  }

  /** Carga docs del filesystem, los chunkea y guarda embeddings. */
  async ingestFiles(): Promise<void> {
    const docs = await this.loader.load();
    await this.vectorStore.addDocuments(docs);
  }

  /** Obtiene viajes del backend, los convierte a Documents y actualiza el contexto. */
  async ingestViajes(apiUrl: string): Promise<void> {
    const viajesLoader = new ViajesLoader(apiUrl);
    const docs = await viajesLoader.load();
    await this.vectorStore.addDocuments(docs);
  }

  /** Añade documentos arbitrarios al contexto. */
  async ingestDocs(docs: Document[]): Promise<void> {
    await this.vectorStore.addDocuments(docs);
  }

  /** Búsqueda semántica simple (sin LLM, para debug). */
  async query(question: string, k = 4): Promise<SearchResult> {
    return this.vectorStore.similaritySearch(question, k);
  }

  /**
   * Pipeline RAG completo: retrieval + generación LLM.
   * Usa el vector store para contexto, travels del backend, y historial opcional.
   */
  async queryWithRag(
    question: string,
    travels: RagTravel[],
    history?: ChatHistoryEntry[],
    k = 4
  ): Promise<RagResponse> {
    const { documents } = await this.vectorStore.similaritySearch(question, k);
    const contexts = documents.map((d) => d.pageContent);

    const messages = PromptBuilder.buildRagPrompt(question, travels, contexts, history);
    const result = await llmService.generate(messages);
    return { answer: result.content, model: result.model };
  }

  /** Genera un resumen de la conversación usando LLM. */
  async generateSummary(history: ChatHistoryEntry[]): Promise<string> {
    const messages = PromptBuilder.buildSummaryPrompt(history);
    const result = await llmService.generate(messages);
    return result.content;
  }
}
