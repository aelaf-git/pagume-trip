from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from src.api.deps import get_db, get_current_active_user
from src.db.models.user import User, UserRole
from src.db.models.destination import Destination
from src.schemas.user import UserResponse
from src.schemas.destination import DestinationCreate, DestinationResponse

router = APIRouter()

def require_admin(current_user: User = Depends(get_current_active_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user

@router.put("/users/{user_id}/verify", response_model=UserResponse)
async def verify_provider(
    user_id: int,
    is_verified: bool = True,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.is_verified = is_verified
    await db.commit()
    await db.refresh(user)
    return user

@router.post("/destinations", response_model=DestinationResponse)
async def create_destination(
    destination_in: DestinationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    destination = Destination(**destination_in.model_dump())
    db.add(destination)
    await db.commit()
    await db.refresh(destination)
    return destination

@router.get("/destinations", response_model=List[DestinationResponse])
async def read_destinations(
    skip: int = 0, limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    stmt = select(Destination).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()
