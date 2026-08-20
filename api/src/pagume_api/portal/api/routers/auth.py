from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from pagume_api.portal.api.deps import get_current_active_user, get_db
from pagume_api.portal.core.security import (
    create_access_token,
    get_password_hash,
    verify_password,
)
from pagume_api.portal.db.models.user import User, UserRole
from pagume_api.portal.schemas.token import Token
from pagume_api.portal.schemas.user import UserCreate, UserResponse

router = APIRouter()

_SELF_REGISTER_ROLES = {
    UserRole.TRAVELER,
    UserRole.HOTEL_PROVIDER,
    UserRole.TOUR_AGENCY,
    UserRole.CAR_RENTAL,
    UserRole.DRIVER,
    UserRole.GUIDE,
}


@router.post("/register", response_model=UserResponse)
async def register_user(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    if user_in.role == UserRole.ADMIN or user_in.role not in _SELF_REGISTER_ROLES:
        raise HTTPException(
            status_code=400,
            detail="Cannot self-register with this role",
        )
    result = await db.execute(select(User).where(User.email == user_in.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/login", response_model=Token)
async def login_access_token(
    db: AsyncSession = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
):
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalars().first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return {
        "access_token": create_access_token(subject=user.id),
        "token_type": "bearer",
    }


@router.get("/me", response_model=UserResponse)
async def read_me(current_user: User = Depends(get_current_active_user)):
    return current_user
