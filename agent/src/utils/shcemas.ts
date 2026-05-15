import { z } from "zod";

// ─── Viaje (forma que devuelve tu backend) ────────────────────────────────────
export const ViajeSchema = z.object({
  id: z.string(),
  origen: z.string(),
  destino: z.string(),
  fechaSalida: z.string().datetime(),
  fechaLlegada: z.string().datetime(),
  precio: z.number().positive(),
  asientosDisponibles: z.number().int().nonnegative(),
  descripcion: z.string().optional(),
});

export const ViajesResponseSchema = z.object({
  data: z.array(ViajeSchema),
  total: z.number().int(),
});

// ─── HTTP request bodies ──────────────────────────────────────────────────────
export const RagQueryBodySchema = z.object({
  question: z.string().min(1, "El campo 'question' es requerido"),
  k: z.number().int().positive().default(4),
});

export const RagIngestViajsBodySchema = z.object({
  apiUrl: z.string().url().optional(), // override de la URL si se necesita
});

// ─── Inferred types (ya no necesitas types.ts para estas) ─────────────────────
export type Viaje = z.infer<typeof ViajeSchema>;
export type ViajesResponse = z.infer<typeof ViajesResponseSchema>;
export type RagQueryBody = z.infer<typeof RagQueryBodySchema>;
