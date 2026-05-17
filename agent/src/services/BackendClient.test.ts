import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { BackendClient, BackendClientError } from "./BackendClient.ts";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

describe("BackendClient", () => {
  let client: BackendClient;

  beforeAll(() => {
    client = new BackendClient(BACKEND_URL, 10000);
  });

  describe("instantiation", () => {
    it("creates with default values", () => {
      const c = new BackendClient();
      expect(c).toBeDefined();
    });

    it("creates with custom url and timeout", () => {
      const c = new BackendClient("http://example.com", 5000);
      expect(c).toBeDefined();
    });
  });

  describe("BackendClientError", () => {
    it("has correct name and message", () => {
      const err = new BackendClientError("test error", 500);
      expect(err.name).toBe("BackendClientError");
      expect(err.message).toBe("test error");
      expect(err.statusCode).toBe(500);
    });

    it("works without statusCode", () => {
      const err = new BackendClientError("connection failed");
      expect(err.statusCode).toBeUndefined();
    });
  });

  describe("GET /api/rag/travels", () => {
    it("returns array of travels", async () => {
      const travels = await client.getTravels();
      expect(Array.isArray(travels)).toBe(true);
      expect(travels.length).toBeGreaterThan(0);
      expect(travels[0]).toHaveProperty("id");
      expect(travels[0]).toHaveProperty("name");
      expect(travels[0]).toHaveProperty("destination");
      expect(travels[0]).toHaveProperty("minPrice");
      expect(travels[0]).toHaveProperty("availablePackages");
    });
  });

  describe("GET /api/rag/customers/phone", () => {
    it("returns customer for known phone", async () => {
      const c = await client.getCustomer("+5213312345678");
      expect(c).not.toBeNull();
      expect(c!.name).toBe("María García López");
      expect(c!.phone).toBe("+5213312345678");
    });

    it("returns null for unknown phone", async () => {
      const c = await client.getCustomer("+9999999999");
      expect(c).toBeNull();
    });
  });

  describe("GET /api/rag/chats/{phone}", () => {
    it("returns null when no active chat", async () => {
      const chat = await client.getActiveChat("+529990000000");
      expect(chat).toBeNull();
    });
  });

  describe("POST /api/rag/chats (create)", () => {
    it("creates a new chat session", async () => {
      const phone = "+529991112222";
      const chat = await client.createChat(phone);
      expect(chat.id).toBeDefined();
      expect(chat.phone).toBe(phone);
      expect(chat.closedAt).toBeNull();
    });
  });

  describe("POST /api/rag/chats/{id}/messages", () => {
    it("adds messages to a chat", async () => {
      const phone = "+529993334445";
      const chat = await client.createChat(phone);

      const updated = await client.addMessage(chat.id!, [
        { type: "HUMAN", content: "Hola, quiero info de Cancún" },
        { type: "AI", content: "Tenemos paquetes desde $16,500 MXN" },
      ]);

      expect(updated.id).toBe(chat.id);
    });
  });

  describe("POST /api/rag/chats/phone/{phone}/close", () => {
    it("closes chat with summary", async () => {
      const phone = "+529995556666";
      await client.createChat(phone);

      const closed = await client.closeChat(
        phone,
        "Cliente interesado en Cancún, requiere seguimiento humano."
      );

      expect(closed.closedAt).not.toBeNull();
      expect(closed.contextSummary).toContain("Cancún");
    });
  });

  describe("error handling", () => {
    it("throws BackendClientError on timeout", async () => {
      const fastClient = new BackendClient("http://localhost:9999", 500);
      let threw = false;
      try {
        await fastClient.getTravels();
      } catch (e: any) {
        threw = true;
        expect(e).toBeInstanceOf(BackendClientError);
      }
      expect(threw).toBe(true);
    });

    it("throws BackendClientError on connection refused", async () => {
      const badClient = new BackendClient("http://localhost:9998", 2000);
      let threw = false;
      try {
        await badClient.getTravels();
      } catch (e: any) {
        threw = true;
        expect(e).toBeInstanceOf(BackendClientError);
      }
      expect(threw).toBe(true);
    });
  });
});
