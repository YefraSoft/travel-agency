import { llmService } from "../core/llm/LlmService";
import { PromptBuilder } from "../core/llm/PromptBuilder";
import { SummarySchema, type SummaryResult } from "./schemas";
import type { ChatHistoryEntry } from "../core/llm/PromptBuilder";

const SUMMARY_PARSE_PROMPT = `Extrae la siguiente información de la conversación y responde SOLO con un JSON válido siguiendo este esquema exacto:

{
  "interests": ["destinos mencionados", "presupuesto", "fechas"],
  "actionsTaken": ["viajes consultados", "cotizaciones dadas"],
  "pendingItems": ["lo que falta por hacer"],
  "needsHumanFollowup": true o false,
  "contextSummary": "resumen conciso en español, máximo 300 caracteres"
}

No incluyas markdown, no incluyas explicaciones. Solo el JSON puro.`;

export class SummaryTool {
  async generate(
    history: ChatHistoryEntry[]
  ): Promise<SummaryResult> {
    const messages = PromptBuilder.buildSummaryPrompt(history);
    messages.push({
      role: "human" as const,
      content: SUMMARY_PARSE_PROMPT,
    } as any);

    const result = await llmService.generate(messages);

    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("SummaryTool: LLM did not return valid JSON");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return SummarySchema.parse(parsed);
  }
}

export const summaryTool = new SummaryTool();
