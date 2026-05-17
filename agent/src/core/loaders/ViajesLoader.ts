import type { Document } from "@langchain/core/documents";
import { RagTravelsArraySchema, type RagTravel } from "../../utils/schemas";

/**
 * Convierte los viajes de tu backend en Documents para el vector store.
 * Cada viaje se convierte en un chunk con texto legible + metadata estructurada.
 */
export class ViajesLoader {
  private readonly apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  private travelToDocument(travel: RagTravel): Document {
    const packagesText = travel.availablePackages
      .filter((p) => p.active)
      .map(
        (p) =>
          `Paquete "${p.name}": ${p.pricePerPerson} ${p.currency}, ${p.personsIncluded} personas incluidas, ${p.availableSpots ?? "?"} lugares disponibles`
      )
      .join(". ");

    const pageContent = [
      `Viaje ${travel.type} a ${travel.destination}${travel.origin ? ` desde ${travel.origin}` : ""}.`,
      `Nombre: ${travel.name}.`,
      travel.minPrice != null
        ? `Precio desde: ${travel.minPrice} ${travel.currency ?? "MXN"}.`
        : "",
      travel.availablePackages.length > 0
        ? `Paquetes disponibles: ${packagesText}.`
        : "",
    ]
      .filter(Boolean)
      .join(" ");

    return {
      pageContent,
      metadata: {
        source: "backend-viajes",
        travelId: travel.id,
        name: travel.name,
        slug: travel.slug,
        type: travel.type,
        destination: travel.destination,
        origin: travel.origin,
        minPrice: travel.minPrice,
        currency: travel.currency,
      },
    };
  }

  async load(): Promise<Document[]> {
    const response = await fetch(this.apiUrl);

    if (!response.ok) {
      throw new Error(
        `[ViajesLoader] Error al obtener viajes: ${response.status} ${response.statusText}`
      );
    }

    const raw = await response.json();

    // Zod valida y parsea — lanza si la forma no coincide
    const travels = RagTravelsArraySchema.parse(raw);

    const docs = travels.map((t) => this.travelToDocument(t));
    console.log(
      `[ViajesLoader] ${docs.length} viajes convertidos a documentos.`
    );
    return docs;
  }
}
