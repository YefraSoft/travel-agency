import { EscalationSchema, type EscalationResult } from "./schemas";

const ESCALATION_SYSTEM_PROMPT = `Eres un asistente de agencia de viajes. Analiza la pregunta del cliente y determina si necesita ser escalado a un agente humano.

Razones para escalar:
- "unresolved": No tienes información suficiente para responder
- "payment": El cliente menciona un pago realizado, quiere verificar un pago, o hay alguna situación de dinero
- "complex_request": Negociación de precios, casos especiales, quejas, solicitudes fuera de tu alcance

Si NO hay razón para escalar, responde con un JSON vacío: {}

Si SÍ hay razón para escalar, responde SOLO con un JSON válido:
{
  "reason": "unresolved" | "payment" | "complex_request",
  "clientQuestion": "la pregunta o solicitud del cliente",
  "context": "contexto relevante: viaje consultado, monto mencionado, etc.",
  "suggestedAction": "acción sugerida para el humano"
}

No incluyas markdown, no incluyas explicaciones. Solo el JSON puro.`;

export class EscalationTool {
  async evaluate(
    question: string,
    availableContext: string
  ): Promise<EscalationResult | null> {
    const { ChatGoogle } = await import("@langchain/google");
    const { HumanMessage, SystemMessage } = await import("@langchain/core/messages");

    const llm = new ChatGoogle({
      model: "gemini-2.5-flash",
      temperature: 0,
      maxRetries: 1,
    });

    const messages = [
      new SystemMessage(ESCALATION_SYSTEM_PROMPT),
      new HumanMessage(`Pregunta del cliente: "${question}"\n\nContexto disponible: "${availableContext}"\n\n¿Necesita escalación?`),
    ];

    const response = await llm.invoke(messages);
    const content = response.content as string;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    if (Object.keys(parsed).length === 0) return null;

    return EscalationSchema.parse(parsed);
  }
}

export const escalationTool = new EscalationTool();
