import type { Document } from "@langchain/core/documents";

export interface SearchResult {
  documents: Document[];
  query: string;
  totalFound: number;
}

/**
 * Contrato que cualquier implementación de vector store debe cumplir.
 * Cambiar de Chroma a Qdrant = crear una nueva clase que implemente esta interfaz.
 */
export interface IVectorStore {
  addDocuments(docs: Document[]): Promise<string[]>;
  similaritySearch(query: string, k?: number): Promise<SearchResult>;
  deleteCollection(): Promise<void>;
}

export interface ChatMessage {
  type: "SYSTEM" | "HUMAN" | "AI" | "TOOL" | "FUNCTION";
  content: string;
}

export interface ChatResponse {
  id: number;
  phone: string;
  customerId: number | null;
  contextSummary: string | null;
  closedAt: string | null;
}

export interface CustomerResponse {
  id: number;
  name: string;
  email: string | null;
  phone: string;
  birthdate: string | null;
  origin: string;
  createdAt: string;
}