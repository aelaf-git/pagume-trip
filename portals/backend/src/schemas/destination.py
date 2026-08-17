from typing import List, Optional
from pydantic import BaseModel

class DestinationBase(BaseModel):
    name: str
    description: Optional[str] = None
    region: Optional[str] = None
    zone: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    category: Optional[str] = None
    images: List[str] = []
    status: str = "ACTIVE"
    verification_status: str = "VERIFIED"

class DestinationCreate(DestinationBase):
    pass

class DestinationResponse(DestinationBase):
    id: int
    
    model_config = {"from_attributes": True}
