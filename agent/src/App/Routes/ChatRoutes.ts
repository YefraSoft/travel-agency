import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { RagPipeline } from "../../core/PipeLine";
import { DocumentLoader } from "../../core/loaders/DocumentLoader";
import { ChromaVectorStore } from "../../core/vectors/ChromaVector";
import { backendClient } from "../../services/BackendClient";
import { summaryTool } from "../../tools/SummaryTool";
import { escalationTool } from "../../tools/EscalationTool";
import {
  ChatRequestBodySchema,
  ChatSummarizeBodySchema,
} from "../../utils/schemas";
import { KNOWLEDGE_DIR } from "../../config/AppConfig";

const chatRouter = Router();

const pipeline = new RagPipeline(
  new DocumentLoader(KNOWLEDGE_DIR),
  new ChromaVectorStore(),
);

/** POST /api/chat — Procesa mensaje con RAG completo */
chatRouter.post("/chat", async (req: Request, res: Response) => {
  const parsed = ChatRequestBodySchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      errors: z.treeifyError(parsed.error),
    });
    return;
  }

  const { message, phone, history, persist } = parsed.data;

  try {
    // 1. Fetch travels del backend
    let travels: any[] = [];
    try {
      travels = await backendClient.getTravels();
    } catch (e) {
      console.warn("[/api/chat] Failed to fetch travels:", e);
    }

    // 2. Get or create chat in backend to obtain real chat_id
    let chatId: number | null = null;
    try {
      let activeChat = await backendClient.getActiveChat(phone);
      if (!activeChat) {
        activeChat = await backendClient.createChat(phone);
      }
      chatId = activeChat?.id ?? null;
    } catch (e) {
      console.warn("[/api/chat] Failed to get/create chat:", e);
      res.status(503).json({
        success: false,
        error: "Could not create or load chat in backend",
      });
      return;
    }

    // 3. Escalation check — antes de generar respuesta
    const contextSnippet = travels
      .slice(0, 3)
      .map((t: any) => `${t.name} a ${t.destination}`)
      .join(", ");

    const escalation = await escalationTool.evaluate(message, contextSnippet);

    // 4. Si hay escalación, retornar inmediatamente
    if (escalation) {
      const answer =
        escalation.reason === "payment"
          ? "Entiendo que mencionas un pago. Permíteme transferirte con un asesor para verificarlo."
          : escalation.reason === "unresolved"
            ? "No tengo información suficiente para responder tu pregunta. Te transferiré con un asesor."
            : "Tu solicitud requiere atención especializada. Te transferiré con un asesor.";

      if (persist && chatId) {
        await backendClient.addMessage(chatId, [
          { type: "HUMAN", content: message },
          { type: "AI", content: answer },
        ]);
      }

      res.json({
        answer,
        sources: [],
        model: process.env.LLM_MODEL || "gemini-2.5-flash",
        chatId,
        chat_id: chatId,
        escalate: true,
        escalation: {
          reason: escalation.reason,
          clientQuestion: escalation.clientQuestion,
          context: escalation.context,
          suggestedAction: escalation.suggestedAction,
        },
      });
      return;
    }

    // 5. RAG generation
    const result = await pipeline.queryWithRag(message, travels, history);

    if (persist && chatId) {
      await backendClient.addMessage(chatId, [
        { type: "HUMAN", content: message },
        { type: "AI", content: result.answer },
      ]);
    }

    res.json({
      answer: result.answer,
      sources: [],
      model: result.model,
      chatId,
      chat_id: chatId,
      escalate: false,
    });
  } catch (error) {
    console.error("[/api/chat]", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/** POST /api/chat/summarize — Genera summary y cierra chat */
chatRouter.post("/chat/summarize", async (req: Request, res: Response) => {
  const parsed = ChatSummarizeBodySchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      errors: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const { phone } = parsed.data;

  try {
    // 1. Obtener chat activo del backend (Redis)
    const activeChat = await backendClient.getActiveChat(phone);
    if (!activeChat) {
      res.status(404).json({
        success: false,
        error: "No active chat found for this phone",
      });
      return;
    }

    // 2. Convertir chat history a formato del agente
    const history =
      (activeChat as any).chatHistory?.map((msg: any) => ({
        role: msg.type === "HUMAN" ? "user" : "assistant",
        content: msg.content,
      })) ?? [];

    if (history.length === 0) {
      res.status(400).json({
        success: false,
        error: "Chat has no history to summarize",
      });
      return;
    }

    // 3. Generar summary con LLM
    const summary = await summaryTool.generate(history);

    // 4. Cerrar chat en backend (persiste en PostgreSQL + borra Redis)
    const closedChat = await backendClient.closeChat(
      phone,
      summary.contextSummary,
    );

    res.json({
      success: true,
      summary: summary.contextSummary,
      chat_id: closedChat.id,
      needsHumanFollowup: summary.needsHumanFollowup,
      interests: summary.interests,
      pendingItems: summary.pendingItems,
    });
  } catch (error) {
    console.error("[/api/chat/summarize]", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export { chatRouter };
