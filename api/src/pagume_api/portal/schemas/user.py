from typing import Any, Dict, List, Optional
from pydantic import BaseModel, EmailStr, Field
from pagume_api.portal.db.models.user import UserRole


class UserBase(BaseModel):
    email: EmailStr = Field(..., description="The user's email address")
    full_name: Optional[str] = Field(
        None, min_length=2, max_length=100, description="The user's full name"
    )
    role: UserRole = Field(
        default=UserRole.TRAVELER, description="The role of the user (e.g., TRAVELER, HOTEL_PROVIDER)"
    )


class UserCreate(UserBase):
    password: str = Field(
        ..., min_length=8, description="Strong password with at least 8 characters"
    )
    business_name: Optional[str] = None
    category: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    details: Dict[str, Any] = Field(default_factory=dict)
    documents: List[Dict[str, Any]] = Field(default_factory=list)


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    password: Optional[str] = Field(None, min_length=8)


class UserResponse(UserBase):
    id: int
    is_active: bool
    is_verified: bool

    model_config = {"from_attributes": True}
