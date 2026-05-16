from __future__ import annotations

import os

from app.clients import BackendClient, BackendClientError
from app.formatters import format_history, format_travels
from app.schemas.api import ChatRequest, ChatResponse
from app.schemas.backend import ChatMessage
from app.services.llm_service import LLMService
from app.services.retrieval_service import RetrievalService


class ChatService:
    def __init__(
        self,
        backend: BackendClient,
        retrieval: RetrievalService,
        llm: LLMService,
    ) -> None:
        self.backend = backend
        self.retrieval = retrieval
        self.llm = llm

    def chat(self, request: ChatRequest) -> ChatResponse:
        phone = request.phone
        active = self.backend.get_active_chat(phone)

        if active is None:
            created = self.backend.create_chat(phone)
            chat_id = created.id
            chat_history: list[ChatMessage] = []
        else:
            chat_id = active.id
            chat_history = active.chatHistory

        user_msg = ChatMessage(type="HUMAN", content=request.message)
        self.backend.add_message(chat_id, [user_msg.model_dump(mode="json")])

        updated = self.backend.get_active_chat(phone)
        full_history = updated.chatHistory if updated else [*chat_history, user_msg]

        travels = self.backend.get_travels()
        contexts = self.retrieval.search(request.message)

        answer = self.llm.generate({
            "question": request.message,
            "history": format_history(full_history),
            "travels": format_travels(travels),
            "contexts": self._format_contexts(contexts),
        })

        ai_msg = ChatMessage(type="AI", content=answer)
        self.backend.add_message(chat_id, [ai_msg.model_dump(mode="json")])

        return ChatResponse(
            answer=answer,
            sources=self._sources(contexts),
            model=os.getenv("OLLAMA_LLM_MODEL", "gemma3:12b"),
            chat_id=chat_id,
        )

    def fallback_response(self, error: BackendClientError) -> ChatResponse:
        return ChatResponse(
            answer=(
                "Por el momento no puedo consultar la informacion actualizada del sistema. "
                "Te canalizo con un asesor humano para continuar sin errores."
            ),
            sources=[],
            model=os.getenv("OLLAMA_LLM_MODEL", "gemma3:12b"),
            chat_id=None,
        )

    def _format_contexts(self, contexts: list[dict]) -> str:
        if not contexts:
            return "Sin contexto documental relevante."
        return "\n\n---\n\n".join(
            f"Fuente: {item.get('metadata', {}).get('source', 'unknown')}\n{item.get('content', '')}"
            for item in contexts
        )

    def _sources(self, contexts: list[dict]) -> list[str]:
        sources = {
            str(item.get("metadata", {}).get("source", "unknown")).split("#", 1)[0]
            for item in contexts
        }
        return sorted(source for source in sources if source and source != "unknown")
