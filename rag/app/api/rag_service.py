from __future__ import annotations
import os
import httpx

from dto import CustomerResponse, ChatResponse, ChatMessage
from utils import to_langchain_messages

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8080").rstrip("/")


class RagService:

    def __init__(self) -> None:
        self._client = httpx.Client(base_url=BACKEND_URL, timeout=15.0)

    def get_active_chat_messages(self, phone: str):
        resp = self._client.get(f"/api/rag/chats/{phone}")
        if resp.status_code == 404:
            return None
        resp.raise_for_status()
        chat = ChatResponse.model_validate(resp.json())
        return to_langchain_messages(chat)

    def create_chat(self, phone: str, chatHistory: list[ChatMessage] | None) -> dict:
        client_resp = self._client.get(f"/api/admin/customers/phone/{phone}")
        if client_resp.status_code == 404:
            customer = None
        else:
            client_resp.raise_for_status()
            customer = CustomerResponse.model_validate(client_resp.json())
        resp = self._client.post(
            "/api/rag/chats",
            json={
                "phone": phone,
                "customerId": customer.id if customer else None,
                "attendedBy": "IA_AGENT",
                "closedBy": None,
                "chatHistory": chatHistory if chatHistory,
                "contextSummary": None,
            },
        )
        resp.raise_for_status()
        return resp.json()

    def add_message(
        self,
        chat_id: int,
        messages: list[dict],
        intention: str = "UNKNOWN",
        escalated: bool = False,
    ) -> dict:
        resp = self._client.post(
            f"/api/rag/chats/{chat_id}/messages",
            json={
                "intention": intention,
                "escalated": escalated,
                "interaction": messages,
            },
        )
        resp.raise_for_status()
        return resp.json()

    def get_travels(self) -> list[dict]:
        resp = self._client.get("/api/rag/travels")
        resp.raise_for_status()
        return resp.json()

    # ------------------------------------------------------------------
    # Customers
    # ------------------------------------------------------------------

    def get_customer(self, phone: str) -> dict | None:
        resp = self._client.get(f"/api/rag/customers/phone/{phone}")
        if resp.status_code == 404:
            return None
        resp.raise_for_status()
        return resp.json()

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    def close(self) -> None:
        self._client.close()
