import { z } from "zod";

// ─── RagTravelResponse (forma que devuelve GET /api/rag/travels) ──────────────
export const TravelPackageSchema = z.object({
  id: z.number(),
  name: z.string(),
  personsIncluded: z.number(),
  hotelStars: z.number().nullable(),
  pricePerPerson: z.number(),
  currency: z.string(),
  capacity: z.number().nullable(),
  availableSpots: z.number().nullable(),
  active: z.boolean(),
});

export const RagTravelSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  type: z.string(),
  destination: z.string(),
  minPrice: z.number().nullable(),
  currency: z.string().nullable(),
  availablePackages: z.array(TravelPackageSchema),
});

// El backend retorna un array plano, no un wrapper { data, total }
export const RagTravelsArraySchema = z.array(RagTravelSchema);

// ─── HTTP request bodies ──────────────────────────────────────────────────────
export const RagQueryBodySchema = z.object({
  question: z.string().min(1, "El campo 'question' es requerido"),
  k: z.number().int().positive().default(4),
});

export const RagIngestViajesBodySchema = z.object({
  apiUrl: z.string().url().optional(),
});

export const ChatRequestBodySchema = z.object({
  message: z.string().min(1, "El campo 'message' es requerido"),
  phone: z.string().min(1, "El campo 'phone' es requerido"),
  persist: z.boolean().default(true),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })).optional(),
});

export const ChatSummarizeBodySchema = z.object({
  phone: z.string().min(1, "El campo 'phone' es requerido"),
});

// ─── Inferred types ───────────────────────────────────────────────────────────
export type RagTravel = z.infer<typeof RagTravelSchema>;
export type TravelPackage = z.infer<typeof TravelPackageSchema>;
export type RagQueryBody = z.infer<typeof RagQueryBodySchema>;
export type ChatRequestBody = z.infer<typeof ChatRequestBodySchema>;
export type ChatSummarizeBody = z.infer<typeof ChatSummarizeBodySchema>;
