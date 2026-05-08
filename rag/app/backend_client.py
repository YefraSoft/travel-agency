from __future__ import annotations

import os

import httpx


BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8080").rstrip("/")


class BackendClient:
    def __init__(self) -> None:
        self._client = httpx.Client(base_url=BACKEND_URL, timeout=15.0)

    # ------------------------------------------------------------------
    # Chats
    # ------------------------------------------------------------------

    def get_active_chat(self, phone: str) -> dict | None:
        resp = self._client.get(f"/api/rag/chats/{phone}")
        if resp.status_code == 404:
            return None
        resp.raise_for_status()
        return resp.json()

    def create_chat(self, phone: str) -> dict:
        resp = self._client.post(
            "/api/rag/chats",
            json={
                "phone": phone,
                "customerId": None,
                "attendedBy": "IA_AGENT",
                "closedBy": None,
                "chatHistory": [],
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

    # ------------------------------------------------------------------
    # Travels
    # ------------------------------------------------------------------

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
