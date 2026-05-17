import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { RagTravel } from "../utils/schemas";

export interface ChatHistoryEntry {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `Eres un asistente virtual de una agencia de viajes mexicana operando por WhatsApp.

REGLAS:
1. Responde SIEMPRE en español.
2. Usa SOLO la información proporcionada en el contexto. NO inventes datos.
3. NUNCA proceses pagos, recibas comprobantes ni confirmes cargos. Si el cliente quiere pagar, dile que un asesor humano lo guiará.
4. Si no tienes información suficiente para responder, di que consultarás con un asesor humano.
5. Para cotizar necesitas: destino, fechas aproximadas, número de viajeros, presupuesto.
6. Si el cliente menciona un pago realizado, NO intentes verificarlo — indica que un asesor lo verificará.
7. No negocies precios ni ofrezcas descuentos — eso lo hace un agente humano.
8. Sé amable, profesional y conciso. Usa un tono cálido mexicano.`;

const SUMMARY_SYSTEM_PROMPT = `Eres un analista de conversaciones de una agencia de viajes.
Genera un resumen estructurado de la conversación que incluya:
- Intereses del cliente (destinos, fechas, presupuesto)
- Acciones realizadas (viajes consultados, cotizaciones)
- Pendientes para el agente humano
- Si requiere seguimiento humano

Formato: texto conciso en español, máximo 300 caracteres.`;

export class PromptBuilder {
  static buildRagPrompt(
    question: string,
    travels: RagTravel[],
    contexts: string[],
    history?: ChatHistoryEntry[]
  ): BaseMessage[] {
    const messages: BaseMessage[] = [new SystemMessage(SYSTEM_PROMPT)];

    let contextText = "";

    if (history && history.length > 0) {
      contextText += "HISTORIAL DE CONVERSACIÓN:\n";
      for (const entry of history) {
        const role = entry.role === "user" ? "Cliente" : "Asistente";
        contextText += `${role}: ${entry.content}\n`;
      }
      contextText += "\n";
    }

    if (travels.length > 0) {
      contextText += "VIAJES DISPONIBLES:\n";
      for (const t of travels) {
        const price = t.minPrice != null ? `desde ${t.minPrice} ${t.currency ?? "MXN"}` : "consultar precio";
        const packages = t.availablePackages
          .filter((p) => p.active)
          .map((p) => `  - ${p.name}: ${p.pricePerPerson} ${p.currency} (${p.personsIncluded} personas)`)
          .join("\n");
        contextText += `• ${t.name} a ${t.destination} (${t.type}) — ${price}\n${packages}\n`;
      }
      contextText += "\n";
    }

    if (contexts.length > 0) {
      contextText += "INFORMACIÓN ADICIONAL:\n";
      contextText += contexts.join("\n\n");
      contextText += "\n\n";
    }

    if (contextText) {
      messages.push(new HumanMessage(`Contexto:\n${contextText}`));
    }

    messages.push(new HumanMessage(question));
    return messages;
  }

  static buildSummaryPrompt(history: ChatHistoryEntry[]): BaseMessage[] {
    const historyText = history
      .map((e) => `${e.role === "user" ? "Cliente" : "Asistente"}: ${e.content}`)
      .join("\n");

    return [
      new SystemMessage(SUMMARY_SYSTEM_PROMPT),
      new HumanMessage(`Conversación:\n${historyText}\n\nGenera el resumen.`),
    ];
  }
}
