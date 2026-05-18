import type { Document } from "@langchain/core/documents";
import { RagTravelsArraySchema, type RagTravel } from "../../utils/schemas";

/**
 * ViajesLoader
 *
 * Responsible for fetching travel data from an external API
 * and transforming it into LangChain Documents suitable for:
 * - Embedding generation
 * - Vector storage indexing (e.g. Chroma)
 * - RAG-based retrieval systems
 *
 * Each travel entity is converted into a structured text representation
 * enriched with metadata for filtering and retrieval.
 */
export class ViajesLoader {
  private readonly apiUrl: string;

  /**
   * Creates a new instance of ViajesLoader.
   *
   * @param apiUrl - URL of the backend endpoint that returns travels
   */
  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  /**
   * Converts a single travel entity into a LangChain Document.
   *
   * This method:
   * - Formats travel data into human-readable text (pageContent)
   * - Extracts relevant structured metadata for filtering/search
   * - Ensures optional fields are safely handled
   *
   * The resulting document is optimized for embedding models,
   * combining semantic text + structured context.
   *
   * @param travel - Validated travel object from backend
   * @returns Document ready for vector storage
   */
  private travelToDocument(travel: RagTravel): Document {
    const packagesText = travel.packages
      .filter((p) => p.active)
      .map(
        (p) =>
          `Paquete "${p.name}": ${p.pricePerPerson} ${p.currency}, ${p.personsIncluded} personas, ${p.availableSpots ?? "?"} disponibles`,
      )
      .join(". ");
    const highlights = (travel.highlights ?? [])
      .map((h) => `- ${h.label}`)
      .join("\n");

    const includes = (travel.includes ?? [])
      .map((i) => `- ${i.label}`)
      .join("\n");
    const pageContent = [
      `Viaje ${travel.type} a ${travel.destination}.`,
      `Nombre: ${travel.name}.`,
      `Descripción: ${travel.description}.`,
      `Duración: ${travel.durationDays} días / ${travel.durationNights} noches.`,
      travel.minPrice != null ? `Precio desde: ${travel.minPrice} MXN.` : "",
      travel.rating != null ? `Rating: ${travel.rating}.` : "",
      highlights ? `Destacados:\n${highlights}` : "",
      includes ? `Incluye:\n${includes}` : "",
      packagesText ? `Paquetes:\n${packagesText}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    return {
      pageContent,
      metadata: {
        source: "backend-viajes",
        travelId: travel.id,
        name: travel.name,
        slug: travel.slug,
        type: travel.type,
        destination: travel.destination,
        minPrice: travel.minPrice,
        currency: "MXN",
      },
    };
  }

  /**
   * Loads travel data from the configured API endpoint,
   * validates it using Zod, and converts it into Documents.
   *
   * Workflow:
   * 1. Fetch raw travel data from API
   * 2. Validate structure using RagTravelsArraySchema
   * 3. Convert each travel into a Document
   * 4. Return array of processed documents
   *
   * @returns Array of Documents ready for embedding and vector storage
   * @throws Error if API request fails or validation fails
   */
  async load(): Promise<Document[]> {
    const response = await fetch(this.apiUrl);
    if (!response.ok) {
      throw new Error(
        `[ViajesLoader] Error al obtener viajes: ${response.status} ${response.statusText}`,
      );
    }
    const raw = await response.json();
    const travels = RagTravelsArraySchema.parse(raw);
    const docs = travels.map((t) => this.travelToDocument(t));
    console.log(
      `[ViajesLoader] ${docs.length} viajes convertidos a documentos.`,
    );
    return docs;
  }
}
