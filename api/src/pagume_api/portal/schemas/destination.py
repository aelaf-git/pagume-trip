from typing import List, Optional
from pydantic import BaseModel, Field

class DestinationBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    description: Optional[str] = Field(None, max_length=5000)
    region: Optional[str] = Field(None, max_length=100)
    zone: Optional[str] = Field(None, max_length=100)
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    category: Optional[str] = Field(None, max_length=100)
    images: List[str] = Field(default_factory=list)
    status: str = Field("ACTIVE", pattern="^(ACTIVE|INACTIVE)$")
    verification_status: str = Field("VERIFIED", pattern="^(VERIFIED|UNVERIFIED)$")

class DestinationCreate(DestinationBase):
    pass

class DestinationResponse(DestinationBase):
    id: int
    
    model_config = {"from_attributes": True}
