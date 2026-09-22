from datetime import datetime

from pydantic import BaseModel, Field


class CityCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)


class CityUpdateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)


class CityResponse(BaseModel):
    id: int
    name: str
    created_at: datetime