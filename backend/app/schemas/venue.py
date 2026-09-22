from datetime import datetime

from pydantic import BaseModel, Field


class VenueCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    city_id: int = Field(gt=0)
    address: str = Field(min_length=2, max_length=300)
    description: str | None = None


class VenueUpdateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    city_id: int = Field(gt=0)
    address: str = Field(min_length=2, max_length=300)
    description: str | None = None


class VenueResponse(BaseModel):
    id: int
    name: str
    city_id: int
    address: str
    description: str | None
    created_at: datetime