import { BACKEND_URL } from "../config/AppConfig";
import type { RagTravel } from "../utils/schemas";
import type {
  ChatMessage,
  ChatResponse,
  CustomerResponse,
} from "../utils/interfaces";

export class BackendClientError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = "BackendClientError";
  }
}

/**
 * Cliente HTTP simplificado para comunicar con el backend Spring.
 * Solo lectura + cierre de chat — n8n gestiona las sesiones.
 */
export class BackendClient {
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(baseUrl: string = BACKEND_URL, timeoutMs: number = 15000) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.timeout = timeoutMs;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new BackendClientError(
          `Backend ${method} ${path} returned ${response.status}: ${response.statusText}`,
          response.status,
        );
      }

      const text = await response.text();
      if (!text) return undefined as T;
      return JSON.parse(text) as T;
    } catch (error) {
      if (error instanceof BackendClientError) throw error;
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new BackendClientError(
          `Request to ${path} timed out after ${this.timeout}ms`,
        );
      }
      throw new BackendClientError(
        `Backend request failed: ${error instanceof Error ? error.message : "unknown"}`,
      );
    } finally {
      clearTimeout(timer);
    }
  }

  /** GET /api/rag/chats/{phone} — Obtener chat activo de Redis */
  async getActiveChat(phone: string): Promise<ChatResponse | null> {
    try {
      return await this.request(
        "GET",
        `/api/rag/chats/${encodeURIComponent(phone)}`,
      );
    } catch (error) {
      if (error instanceof BackendClientError && error.statusCode === 404)
        return null;
      throw error;
    }
  }

  /** POST /api/rag/chats — Crear nueva sesión de chat */
  async createChat(phone: string): Promise<ChatResponse> {
    return this.request("POST", "/api/rag/chats", {
      phone,
      attendedBy: "IA_AGENT",
      chatHistory: [],
    });
  }

  /** GET /api/rag/travels — Catálogo de viajes activos */
  async getTravels(): Promise<RagTravel[]> {
    return this.request("GET", "/api/rag/travels");
  }

  /** GET /api/rag/customers/phone/{phone} — Datos del cliente */
  async getCustomer(phone: string): Promise<CustomerResponse | null> {
    try {
      const customer = await this.request<CustomerResponse | undefined>(
        "GET",
        `/api/rag/customers/phone/${encodeURIComponent(phone)}`,
      );
      return customer ?? null;
    } catch (error) {
      if (error instanceof BackendClientError && error.statusCode === 404)
        return null;
      throw error;
    }
  }

  /** POST /api/rag/chats/phone/{phone}/close — Cerrar chat + persistir summary */
  async closeChat(phone: string, summary: string): Promise<ChatResponse> {
    return this.request(
      "POST",
      `/api/rag/chats/phone/${encodeURIComponent(phone)}/close`,
      {
        contextSummary: summary,
      },
    );
  }

  /** POST /api/rag/chats/{id}/messages — Agregar mensajes al historial */
  async addMessage(
    chatId: number,
    messages: ChatMessage[],
  ): Promise<ChatResponse> {
    return this.request("POST", `/api/rag/chats/${chatId}/messages`, {
      interaction: messages,
    });
  }
}

export const backendClient = new BackendClient();
