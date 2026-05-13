from datetime import date, datetime
from typing import List

from pydantic import BaseModel, Field


class CustomerResponse(BaseModel):
    id: int
    name: str
    email: str | None = None
    phone: str
    birthdate: date | None = None
    origin: str
    created_at: datetime = Field(alias="createdAt")
    model_config = {"populate_by_name": True}

class ChatMessage(BaseModel):
    type: str
    content: str


class ChatResponse(BaseModel):
    id: int
    customerId: int | None = None
    attendedBy: str
    closedBy: str | None = None
    chatHistory: List[ChatMessage]
    contextSummary: str | None = None
