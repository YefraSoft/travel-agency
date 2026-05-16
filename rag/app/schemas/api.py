from __future__ import annotations

import os

from pydantic import BaseModel, Field

DEMO_PHONE = os.getenv("DEMO_PHONE", "+521234567890")


class ChatMessage(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    content: str


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    phone: str = Field(default=DEMO_PHONE, max_length=20)
    history: list[ChatMessage] = Field(default_factory=list)


class ChatResponse(BaseModel):
    answer: str
    sources: list[str]
    model: str
    chat_id: int | None = None
