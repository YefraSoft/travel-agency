from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class BackendModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True)


class ChatMessage(BackendModel):
    type: Literal["SYSTEM", "HUMAN", "AI", "TOOL", "FUNCTION"]
    content: str = Field(min_length=1)


class ChatCreatePayload(BackendModel):
    phone: str = Field(min_length=1, max_length=20)
    customerId: int | None = None
    attendedBy: str = "IA_AGENT"
    closedBy: str | None = None
    chatHistory: list[ChatMessage] = Field(default_factory=list)
    contextSummary: str | None = None


class ChatMessagePayload(BackendModel):
    interaction: list[ChatMessage]


class ChatResponse(BackendModel):
    id: int
    phone: str
    customerId: int | None = None
    contextSummary: str | None = None
    closedAt: datetime | None = None


class ChatMessageResponse(BackendModel):
    id: int
    customerId: int | None = None
    attendedBy: str
    closedBy: str | None = None
    chatHistory: list[ChatMessage] = Field(default_factory=list)
    contextSummary: str | None = None


class CustomerResponse(BackendModel):
    id: int
    name: str
    email: str | None = None
    phone: str
    birthdate: date | None = None
    origin: str
    createdAt: datetime


class TravelPackageResponse(BackendModel):
    id: int
    name: str
    personsIncluded: int
    hotelStars: int | None = None
    pricePerPerson: Decimal
    currency: str
    capacity: int | None = None
    availableSpots: int | None = None
    active: bool


class RagTravelResponse(BackendModel):
    id: int
    name: str
    slug: str
    type: str
    destination: str
    minPrice: Decimal | None = None
    currency: str | None = None
    availablePackages: list[TravelPackageResponse] = Field(default_factory=list)
