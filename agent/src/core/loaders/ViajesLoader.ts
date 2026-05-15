import type { Document } from "@langchain/core/documents";
import { ViajesResponseSchema, type Viaje } from "../../utils/shcemas";

/**
 * Convierte los viajes de tu backend en Documents para el vector store.
 * Cada viaje se convierte en un chunk con texto legible + metadata estructurada.
 */
export class ViajesLoader {
  private readonly apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  private viajeToDocument(viaje: Viaje): Document {
    const pageContent = [
      `Viaje de ${viaje.origen} a ${viaje.destino}.`,
      `Salida: ${new Date(viaje.fechaSalida).toLocaleString("es-MX")}.`,
      `Llegada: ${new Date(viaje.fechaLlegada).toLocaleString("es-MX")}.`,
      `Precio: $${viaje.precio} MXN.`,
      `Asientos disponibles: ${viaje.asientosDisponibles}.`,
      viaje.descripcion ? `Descripción: ${viaje.descripcion}.` : "",
    ]
      .filter(Boolean)
      .join(" ");

    return {
      pageContent,
      metadata: {
        source: "backend-viajes",
        viajeId: viaje.id,
        origen: viaje.origen,
        destino: viaje.destino,
        precio: viaje.precio,
        asientosDisponibles: viaje.asientosDisponibles,
        fechaSalida: viaje.fechaSalida,
      },
    };
  }

  async load(): Promise<Document[]> {
    const response = await fetch(this.apiUrl);

    if (!response.ok) {
      throw new Error(
        `[ViajesLoader] Error al obtener viajes: ${response.status} ${response.statusText}`,
      );
    }

    const raw = await response.json();

    // Zod valida y parsea — lanza si la forma no coincide
    const parsed = ViajesResponseSchema.parse(raw);

    const docs = parsed.data.map((v) => this.viajeToDocument(v));
    console.log(
      `[ViajesLoader] ${docs.length} viajes convertidos a documentos.`,
    );
    return docs;
  }
}
