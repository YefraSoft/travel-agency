import { z } from "zod";

// ─── Summary Tool ─────────────────────────────────────────────────────────────
export const SummarySchema = z.object({
  interests: z.array(z.string()),
  actionsTaken: z.array(z.string()),
  pendingItems: z.array(z.string()),
  needsHumanFollowup: z.boolean(),
  contextSummary: z.string(),
});

// ─── Escalation Tool ──────────────────────────────────────────────────────────
export const EscalationSchema = z.object({
  reason: z.enum(["unresolved", "payment", "complex_request"]),
  clientQuestion: z.string(),
  context: z.string(),
  suggestedAction: z.string(),
});

// ─── Inferred types ───────────────────────────────────────────────────────────
export type SummaryResult = z.infer<typeof SummarySchema>;
export type EscalationResult = z.infer<typeof EscalationSchema>;
