import { z } from "zod";

/**
 * TravelPackageSchema
 *
 * Defines the structure of a travel package option inside a travel offer.
 *
 * Represents pricing tiers such as:
 * - standard rooms
 * - suites
 * - cruise cabins
 *
 * Used for:
 * - pricing breakdown in RAG documents
 * - availability filtering
 * - user quote generation
 */
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

/**
 * TravelHighlightSchema
 *
 * Represents key selling points or highlights of a travel package.
 *
 * Examples:
 * - "Vuelo incluido"
 * - "Hotel 5 estrellas"
 * - "Tour guiado"
 *
 * Used for enriching semantic search in RAG.
 */
export const TravelHighlightSchema = z.object({
  id: z.number(),
  icon: z.string(),
  label: z.string(),
  sort: z.number(),
});

/**
 * TravelIncludeSchema
 *
 * Represents detailed items included in a travel package.
 *
 * These are more granular than highlights and describe
 * what is explicitly included in the trip.
 *
 * Example:
 * - "Desayunos incluidos"
 * - "Traslados aeropuerto-hotel"
 */
export const TravelIncludeSchema = z.object({
  id: z.number(),
  packageId: z.number().nullable(),
  icon: z.string(),
  label: z.string(),
  description: z.string().nullable(),
  sort: z.number(),
});

/**
 * TravelImageSchema
 *
 * Represents images associated with a travel package.
 *
 * Used mainly for UI/visual representation and not directly
 * for embeddings.
 */
export const TravelImageSchema = z.object({
  id: z.number(),
  url: z.string(),
  altText: z.string(),
  sort: z.number(),
});

/**
 * RagTravelSchema
 *
 * Core schema representing a travel product used in the RAG system.
 *
 * This schema is used to:
 * - validate backend travel data
 * - generate embedding documents
 * - power semantic search and retrieval
 *
 * It aggregates:
 * - basic travel info (name, destination, duration)
 * - pricing information
 * - packages (pricing tiers)
 * - highlights (marketing features)
 * - includes (detailed inclusions)
 * - images (UI assets)
 */
export const RagTravelSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  type: z.string(),
  destination: z.string(),
  origin: z.string(),
  durationDays: z.number(),
  durationNights: z.number(),
  stars: z.number().nullable(),
  description: z.string(),
  featured: z.boolean(),
  status: z.string(),
  minPrice: z.number().nullable(),
  rating: z.number().nullable(),
  currency: z.string().optional(),
  packages: z.array(TravelPackageSchema),
  highlights: z.array(TravelHighlightSchema).optional(),
  includes: z.array(TravelIncludeSchema).optional(),
  images: z.array(TravelImageSchema).optional(),
});

/**
 * RagTravelsArraySchema
 *
 * Represents the API response format from the backend:
 * a plain array of travel objects (no wrapper object).
 */
export const RagTravelsArraySchema = z.array(RagTravelSchema);

/**
 * RagQueryBodySchema
 *
 * Request schema for RAG search endpoint.
 *
 * Used when querying the vector database with a question.
 */
export const RagQueryBodySchema = z.object({
  question: z.string().min(1, "El campo 'question' es requerido"),
  k: z.number().int().positive().default(4),
});

/**
 * RagIngestViajesBodySchema
 *
 * Request schema for ingestion endpoint.
 *
 * Optionally allows overriding the API URL for travel ingestion.
 */
export const RagIngestViajesBodySchema = z.object({
  apiUrl: z.url().optional(),
});

/**
 * ChatRequestBodySchema
 *
 * Request schema for chat endpoint.
 *
 * Supports:
 * - user message
 * - phone identifier (session tracking)
 * - optional persistence flag
 * - optional conversation history
 */
export const ChatRequestBodySchema = z.object({
  message: z.string().min(1, "El campo 'message' es requerido"),
  phone: z.string().min(1, "El campo 'phone' es requerido"),
  persist: z.boolean().default(true),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .optional(),
});

/**
 * ChatSummarizeBodySchema
 *
 * Request schema used to summarize a conversation
 * associated with a phone number.
 */
export const ChatSummarizeBodySchema = z.object({
  phone: z.string().min(1, "El campo 'phone' es requerido"),
});

// ─── Inferred types ───────────────────────────────────────────────────────────
export type RagTravel = z.infer<typeof RagTravelSchema>;
export type TravelPackage = z.infer<typeof TravelPackageSchema>;
export type RagQueryBody = z.infer<typeof RagQueryBodySchema>;
export type ChatRequestBody = z.infer<typeof ChatRequestBodySchema>;
export type ChatSummarizeBody = z.infer<typeof ChatSummarizeBodySchema>;
