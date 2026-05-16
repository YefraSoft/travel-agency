from __future__ import annotations

import os
from typing import Any, TypeVar

import httpx
from pydantic import BaseModel, TypeAdapter, ValidationError

from app.schemas.backend import (
    ChatCreatePayload,
    ChatMessagePayload,
    ChatMessageResponse,
    ChatResponse,
    CustomerResponse,
    RagTravelResponse,
)

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8080").rstrip("/")

T = TypeVar("T", bound=BaseModel)


class BackendClientError(RuntimeError):
    pass


class BackendClient:
    def __init__(self) -> None:
        self._client = httpx.Client(base_url=BACKEND_URL, timeout=15.0)

    def get_active_chat(self, phone: str) -> ChatMessageResponse | None:
        data = self._request("GET", f"/api/rag/chats/{phone}", not_found_none=True)
        if data is None:
            return None
        return self._validate(ChatMessageResponse, data, "active chat")

    def create_chat(self, phone: str) -> ChatResponse:
        customer = self.get_customer(phone)
        payload = ChatCreatePayload(
            phone=phone,
            customerId=customer.id if customer else None,
            attendedBy="IA_AGENT",
            closedBy=None,
            chatHistory=[],
            contextSummary=None,
        )
        data = self._request("POST", "/api/rag/chats", payload=payload)
        return self._validate(ChatResponse, data, "created chat")

    def add_message(self, chat_id: int, messages: list[dict[str, str]]) -> ChatResponse:
        payload = ChatMessagePayload(interaction=messages)
        data = self._request("POST", f"/api/rag/chats/{chat_id}/messages", payload=payload)
        return self._validate(ChatResponse, data, "updated chat")

    def get_travels(self) -> list[RagTravelResponse]:
        data = self._request("GET", "/api/rag/travels")
        try:
            return TypeAdapter(list[RagTravelResponse]).validate_python(data)
        except ValidationError as exc:
            raise BackendClientError(f"Invalid backend travels response: {exc}") from exc

    def get_customer(self, phone: str) -> CustomerResponse | None:
        data = self._request("GET", f"/api/rag/customers/phone/{phone}", not_found_none=True)
        if data is None:
            return None
        return self._validate(CustomerResponse, data, "customer")

    def close(self) -> None:
        self._client.close()

    def _request(
        self,
        method: str,
        path: str,
        payload: BaseModel | None = None,
        not_found_none: bool = False,
    ) -> Any:
        json_payload = payload.model_dump(by_alias=True, mode="json") if payload else None
        try:
            resp = self._client.request(method, path, json=json_payload)
        except httpx.HTTPError as exc:
            raise BackendClientError(f"Backend request failed: {method} {path}") from exc

        if resp.status_code == 404 and not_found_none:
            return None
        if resp.status_code >= 400:
            detail = self._safe_error_detail(resp)
            raise BackendClientError(f"Backend returned {resp.status_code} for {method} {path}: {detail}")

        try:
            return resp.json()
        except ValueError as exc:
            raise BackendClientError(f"Backend returned invalid JSON for {method} {path}") from exc

    def _validate(self, model: type[T], data: Any, label: str) -> T:
        try:
            return model.model_validate(data)
        except ValidationError as exc:
            raise BackendClientError(f"Invalid backend {label} response: {exc}") from exc

    def _safe_error_detail(self, resp: httpx.Response) -> str:
        try:
            data = resp.json()
        except ValueError:
            return resp.text[:300]
        if isinstance(data, dict):
            return str(data.get("message") or data.get("error") or data.get("detail") or data)[:300]
        return str(data)[:300]
