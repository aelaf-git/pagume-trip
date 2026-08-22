from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from pagume_api.models import Destination as MainDestination
from pagume_api.portal.api.deps import get_current_active_user, get_db
from pagume_api.portal.db.models.destination import Destination
from pagume_api.portal.db.models.ops import (
    AgentRunLog,
    ModerationItem,
    PlatformSetting,
    PortalBooking,
    PortalPayment,
    PortalReview,
    ProviderDocument,
    ProviderProfile,
)
from pagume_api.portal.db.models.provider import DriverProfile, Hotel, TourPackage, Vehicle
from pagume_api.portal.db.models.user import User, UserRole
from pagume_api.portal.schemas.destination import (
    DestinationCreate,
    DestinationResponse,
    DestinationUpdate,
)
from pagume_api.portal.schemas.inventory import DriverProfileResponse
from pagume_api.portal.schemas.ops import (
    ActivityEventResponse,
    AgentRunLogResponse,
    DashboardStats,
    DocumentMeta,
    ModerationItemResponse,
    ModerationUpdate,
    PlatformSettingResponse,
    PlatformSettingUpdate,
    PortalBookingResponse,
    PortalPaymentResponse,
    PortalReviewResponse,
    ProviderProfileResponse,
    ProviderStatusUpdate,
)
from pagume_api.portal.schemas.user import UserResponse

router = APIRouter()


def require_admin(current_user: User = Depends(get_current_active_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user


def _status_to_fe(status: str) -> str:
    return {"PENDING": "UNDER_REVIEW", "DOCS_REQUESTED": "UNDER_REVIEW"}.get(
        status, status
    )


async def _docs_for_user(db: AsyncSession, user_id: int) -> list[DocumentMeta]:
    result = await db.execute(
        select(ProviderDocument).where(ProviderDocument.user_id == user_id)
    )
    return [
        DocumentMeta(
            doc_type=d.doc_type,
            file_name=d.file_name,
            file_size=d.file_size or 0,
            url=d.url,
        )
        for d in result.scalars().all()
    ]


async def _profile_response(
    db: AsyncSession, profile: ProviderProfile, email: str | None = None
) -> ProviderProfileResponse:
    if email is None:
        user = (
            await db.execute(select(User).where(User.id == profile.user_id))
        ).scalars().first()
        email = user.email if user else None
    docs = await _docs_for_user(db, profile.user_id)
    return ProviderProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        business_name=profile.business_name,
        category=profile.category,
        phone=profile.phone,
        address=profile.address,
        details=profile.details or {},
        status=profile.status,
        rejection_reason=profile.rejection_reason,
        status_note=profile.status_note,
        registered_at=profile.registered_at,
        email=email,
        documents=docs,
    )


# ── Users ───────────────────────────────────────────────────────────────────


@router.get("/users", response_model=List[UserResponse])
async def list_users(
    role: Optional[str] = None,
    is_verified: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    stmt = select(User)
    if role:
        stmt = stmt.where(User.role == role)
    if is_verified is not None:
        stmt = stmt.where(User.is_verified == is_verified)
    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.put("/users/{user_id}/verify", response_model=UserResponse)
async def verify_provider(
    user_id: int,
    is_verified: bool = True,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_verified = is_verified
    profile = (
        await db.execute(select(ProviderProfile).where(ProviderProfile.user_id == user_id))
    ).scalars().first()
    if profile:
        profile.status = "VERIFIED" if is_verified else "PENDING"
        if is_verified:
            profile.rejection_reason = None
            profile.status_note = "Verified by admin."
    await db.commit()
    await db.refresh(user)
    return user


# ── Provider profiles / verification ─────────────────────────────────────────


@router.get("/providers", response_model=List[ProviderProfileResponse])
async def list_provider_profiles(
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    stmt = select(ProviderProfile, User).join(User, User.id == ProviderProfile.user_id)
    if status:
        if status == "UNDER_REVIEW":
            stmt = stmt.where(
                ProviderProfile.status.in_(["PENDING", "DOCS_REQUESTED"])
            )
        else:
            stmt = stmt.where(ProviderProfile.status == status)
    rows = (await db.execute(stmt)).all()
    out = []
    for profile, user in rows:
        resp = await _profile_response(db, profile, user.email)
        out.append(resp)
    return out


@router.put("/providers/{user_id}/status", response_model=ProviderProfileResponse)
async def update_provider_status(
    user_id: int,
    body: ProviderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    profile = (
        await db.execute(select(ProviderProfile).where(ProviderProfile.user_id == user_id))
    ).scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Provider profile not found")
    user = (
        await db.execute(select(User).where(User.id == user_id))
    ).scalars().first()
    email = user.email if user else None
    profile.status = body.status
    if body.status == "VERIFIED":
        profile.rejection_reason = None
        profile.status_note = body.reason or "Verified by admin."
        if user:
            user.is_verified = True
    elif body.status == "REJECTED":
        profile.rejection_reason = body.reason
        profile.status_note = None
        if user:
            user.is_verified = False
    elif body.status == "DOCS_REQUESTED":
        profile.status_note = body.reason or "Additional documents requested."
        profile.rejection_reason = None
    elif body.status == "SUSPENDED":
        profile.status_note = body.reason
        if user:
            user.is_active = False
            user.is_verified = False
    await db.commit()
    await db.refresh(profile)
    return await _profile_response(db, profile, email)


@router.put("/drivers/{user_id}/verify", response_model=DriverProfileResponse)
async def verify_driver(
    user_id: int,
    verification_status: str = "VERIFIED",
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    if verification_status not in {"UNDER_REVIEW", "VERIFIED", "REJECTED"}:
        raise HTTPException(status_code=400, detail="Invalid verification_status")
    result = await db.execute(
        select(DriverProfile).where(DriverProfile.user_id == user_id)
    )
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Driver profile not found")
    profile.verification_status = verification_status
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalars().first()
    if user and verification_status == "VERIFIED":
        user.is_verified = True
    await db.commit()
    await db.refresh(profile)
    return profile


@router.get("/drivers", response_model=List[DriverProfileResponse])
async def list_drivers(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    result = await db.execute(select(DriverProfile))
    return result.scalars().all()


# ── Destinations ────────────────────────────────────────────────────────────


def _sync_main_destination(db_sync_fields: Destination) -> MainDestination:
    main_id = db_sync_fields.name.lower().replace(" ", "_")
    if not main_id.startswith("dest_"):
        main_id = f"dest_{main_id}"
    return MainDestination(
        id=main_id,
        name=db_sync_fields.name,
        description=db_sync_fields.description or "",
        region=db_sync_fields.region or "",
        zone=db_sync_fields.zone or "",
        latitude=db_sync_fields.latitude or 0.0,
        longitude=db_sync_fields.longitude or 0.0,
        category=db_sync_fields.category or "destination",
        verification_status=db_sync_fields.verification_status or "VERIFIED",
    )


@router.post("/destinations", response_model=DestinationResponse)
async def create_destination(
    destination_in: DestinationCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    destination = Destination(**destination_in.model_dump())
    db.add(destination)
    await db.flush()
    dest_id = destination.id

    main_id = destination.name.lower().replace(" ", "_")
    if not main_id.startswith("dest_"):
        main_id = f"dest_{main_id}"
    existing = (
        await db.execute(select(MainDestination).where(MainDestination.id == main_id))
    ).scalars().first()
    if not existing:
        db.add(_sync_main_destination(destination))

    await db.commit()
    result = await db.execute(select(Destination).where(Destination.id == dest_id))
    return result.scalars().first()


@router.get("/destinations", response_model=List[DestinationResponse])
async def read_destinations(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    result = await db.execute(select(Destination).offset(skip).limit(limit))
    return result.scalars().all()


@router.put("/destinations/{destination_id}", response_model=DestinationResponse)
async def update_destination(
    destination_id: int,
    body: DestinationUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    destination = (
        await db.execute(select(Destination).where(Destination.id == destination_id))
    ).scalars().first()
    if not destination:
        raise HTTPException(status_code=404, detail="Destination not found")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(destination, key, value)
    await db.commit()
    await db.refresh(destination)
    return destination


@router.delete("/destinations/{destination_id}")
async def delete_destination(
    destination_id: int,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    destination = (
        await db.execute(select(Destination).where(Destination.id == destination_id))
    ).scalars().first()
    if not destination:
        raise HTTPException(status_code=404, detail="Destination not found")
    await db.delete(destination)
    await db.commit()
    return {"ok": True}


@router.post("/destinations/import", response_model=List[DestinationResponse])
async def import_destinations(
    items: List[DestinationCreate],
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    created = []
    for item in items:
        dest = Destination(**item.model_dump())
        db.add(dest)
        created.append(dest)
    await db.commit()
    for dest in created:
        await db.refresh(dest)
    return created


# ── Moderation ──────────────────────────────────────────────────────────────


@router.get("/moderation", response_model=List[ModerationItemResponse])
async def list_moderation(
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    stmt = select(ModerationItem)
    if status:
        stmt = stmt.where(ModerationItem.status == status)
    return (await db.execute(stmt)).scalars().all()


@router.put("/moderation/{item_id}", response_model=ModerationItemResponse)
async def update_moderation(
    item_id: int,
    body: ModerationUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    item = (
        await db.execute(select(ModerationItem).where(ModerationItem.id == item_id))
    ).scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Moderation item not found")
    item.status = body.status
    if body.flag_reason is not None:
        item.flag_reason = body.flag_reason
    await db.commit()
    await db.refresh(item)
    return item


# ── Bookings / payments overview ────────────────────────────────────────────


@router.get("/bookings", response_model=List[PortalBookingResponse])
async def admin_list_bookings(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    return (await db.execute(select(PortalBooking))).scalars().all()


@router.get("/payments", response_model=List[PortalPaymentResponse])
async def admin_list_payments(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    return (await db.execute(select(PortalPayment))).scalars().all()


@router.get("/reviews", response_model=List[PortalReviewResponse])
async def admin_list_reviews(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    stmt = select(PortalReview).order_by(PortalReview.id.desc())
    return (await db.execute(stmt)).scalars().all()


# ── Settings ────────────────────────────────────────────────────────────────


@router.get("/settings", response_model=List[PlatformSettingResponse])
async def list_settings(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    return (await db.execute(select(PlatformSetting))).scalars().all()


@router.put("/settings/{key}", response_model=PlatformSettingResponse)
async def upsert_setting(
    key: str,
    body: PlatformSettingUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    setting = (
        await db.execute(select(PlatformSetting).where(PlatformSetting.key == key))
    ).scalars().first()
    if not setting:
        setting = PlatformSetting(key=key, value=body.value)
        db.add(setting)
    else:
        setting.value = body.value
    await db.commit()
    await db.refresh(setting)
    return setting


# ── Dashboard / agent runs ──────────────────────────────────────────────────


@router.get("/dashboard/stats", response_model=DashboardStats)
async def dashboard_stats(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    users_total = (await db.execute(select(func.count()).select_from(User))).scalar() or 0
    providers_pending = (
        await db.execute(
            select(func.count())
            .select_from(ProviderProfile)
            .where(ProviderProfile.status.in_(["PENDING", "DOCS_REQUESTED"]))
        )
    ).scalar() or 0
    providers_verified = (
        await db.execute(
            select(func.count())
            .select_from(ProviderProfile)
            .where(ProviderProfile.status == "VERIFIED")
        )
    ).scalar() or 0
    destinations = (
        await db.execute(select(func.count()).select_from(Destination))
    ).scalar() or 0
    bookings_total = (
        await db.execute(select(func.count()).select_from(PortalBooking))
    ).scalar() or 0
    bookings_pending = (
        await db.execute(
            select(func.count())
            .select_from(PortalBooking)
            .where(PortalBooking.booking_status == "PENDING")
        )
    ).scalar() or 0
    payments_total = (
        await db.execute(select(func.coalesce(func.sum(PortalPayment.amount), 0.0)))
    ).scalar() or 0.0
    hotels = (await db.execute(select(func.count()).select_from(Hotel))).scalar() or 0
    tours = (
        await db.execute(select(func.count()).select_from(TourPackage))
    ).scalar() or 0
    vehicles = (
        await db.execute(select(func.count()).select_from(Vehicle))
    ).scalar() or 0
    return DashboardStats(
        users_total=users_total,
        providers_pending=providers_pending,
        providers_verified=providers_verified,
        destinations=destinations,
        bookings_total=bookings_total,
        bookings_pending=bookings_pending,
        payments_total=float(payments_total),
        hotels=hotels,
        tours=tours,
        vehicles=vehicles,
    )


@router.get("/agent-runs", response_model=List[AgentRunLogResponse])
async def list_agent_runs(
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    stmt = select(AgentRunLog).order_by(AgentRunLog.id.desc()).limit(limit)
    return (await db.execute(stmt)).scalars().all()


_ACTIVITY_TYPES = frozenset(
    {"provider", "moderation", "agent_run", "review"}
)


def _parse_activity_types(raw: str | None) -> set[str] | None:
    if not raw or not raw.strip():
        return None
    parts = {p.strip().lower() for p in raw.split(",") if p.strip()}
    unknown = parts - _ACTIVITY_TYPES
    if unknown:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown activity type(s): {', '.join(sorted(unknown))}. "
            f"Allowed: {', '.join(sorted(_ACTIVITY_TYPES))}",
        )
    return parts


async def _user_label_map(db: AsyncSession, user_ids: set[int]) -> dict[int, str]:
    if not user_ids:
        return {}
    rows = (
        await db.execute(select(User).where(User.id.in_(list(user_ids))))
    ).scalars().all()
    return {
        u.id: (u.full_name or u.email or f"user:{u.id}")
        for u in rows
    }


@router.get("/activities", response_model=List[ActivityEventResponse])
async def list_platform_activities(
    type: Optional[str] = Query(
        None,
        description="Filter by type (comma-separated): provider,moderation,agent_run,review",
    ),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Chronological feed assembled from portal DB tables (no mock data)."""
    wanted = _parse_activity_types(type)
    # Fetch a generous slice per source so merge+pagination stays accurate for typical admin use.
    per_source = min(200, offset + limit)

    events: list[ActivityEventResponse] = []
    provider_ids: set[int] = set()

    if wanted is None or "provider" in wanted:
        profiles = (
            await db.execute(
                select(ProviderProfile)
                .order_by(
                    ProviderProfile.registered_at.desc().nullslast(),
                    ProviderProfile.id.desc(),
                )
                .limit(per_source)
            )
        ).scalars().all()
        for pr in profiles:
            provider_ids.add(pr.user_id)
            events.append(
                ActivityEventResponse(
                    id=f"provider:{pr.id}",
                    type="provider",
                    title=pr.business_name or "Provider registration",
                    summary=f"{pr.category} · status {pr.status}",
                    status=pr.status,
                    entity_label=pr.business_name,
                    occurred_at=pr.registered_at,
                    meta={
                        "profile_id": pr.id,
                        "user_id": pr.user_id,
                        "category": pr.category,
                        "phone": pr.phone,
                        "address": pr.address,
                    },
                )
            )

    if wanted is None or "moderation" in wanted:
        items = (
            await db.execute(
                select(ModerationItem)
                .order_by(
                    ModerationItem.uploaded_at.desc().nullslast(),
                    ModerationItem.id.desc(),
                )
                .limit(per_source)
            )
        ).scalars().all()
        for m in items:
            provider_ids.add(m.provider_id)
            events.append(
                ActivityEventResponse(
                    id=f"moderation:{m.id}",
                    type="moderation",
                    title=m.title or "Moderation item",
                    summary=(
                        f"{m.content_type}"
                        + (f" · {m.provider_name}" if m.provider_name else "")
                        + (f" · {m.category}" if m.category else "")
                    ),
                    status=m.status,
                    entity_label=m.provider_name,
                    occurred_at=m.uploaded_at,
                    meta={
                        "moderation_id": m.id,
                        "provider_id": m.provider_id,
                        "content_type": m.content_type,
                        "content_ref_id": m.content_ref_id,
                        "flag_reason": m.flag_reason,
                    },
                )
            )

    if wanted is None or "agent_run" in wanted:
        runs = (
            await db.execute(
                select(AgentRunLog)
                .order_by(AgentRunLog.created_at.desc().nullslast(), AgentRunLog.id.desc())
                .limit(per_source)
            )
        ).scalars().all()
        for r in runs:
            events.append(
                ActivityEventResponse(
                    id=f"agent_run:{r.id}",
                    type="agent_run",
                    title=r.agent or "Agent run",
                    summary=r.task or "—",
                    status=r.status,
                    occurred_at=r.created_at,
                    meta={
                        "run_id": r.id,
                        "duration_ms": r.duration_ms,
                        "token_usage": r.token_usage or {},
                    },
                )
            )

    if wanted is None or "review" in wanted:
        reviews = (
            await db.execute(
                select(PortalReview)
                .order_by(PortalReview.created_at.desc().nullslast(), PortalReview.id.desc())
                .limit(per_source)
            )
        ).scalars().all()
        for rv in reviews:
            provider_ids.add(rv.provider_id)
            comment_snip = (rv.comment or "").strip()
            if len(comment_snip) > 120:
                comment_snip = comment_snip[:117] + "…"
            events.append(
                ActivityEventResponse(
                    id=f"review:{rv.id}",
                    type="review",
                    title=f"{rv.rating}★ by {rv.author_name}",
                    summary=comment_snip or "No comment",
                    status=rv.status,
                    actor_label=rv.author_name,
                    occurred_at=rv.created_at,
                    meta={
                        "review_id": rv.id,
                        "provider_id": rv.provider_id,
                        "rating": rv.rating,
                    },
                )
            )

    labels = await _user_label_map(db, provider_ids)
    for ev in events:
        pid = ev.meta.get("provider_id") or ev.meta.get("user_id")
        if pid and not ev.actor_label:
            ev.actor_label = labels.get(pid)
        if pid and not ev.entity_label and ev.type != "provider":
            ev.entity_label = labels.get(pid)

    def _sort_key(ev: ActivityEventResponse):
        # Newest first; missing timestamps sort last among peers via min datetime
        ts = ev.occurred_at or datetime.min
        return (ts, ev.id)

    events.sort(key=_sort_key, reverse=True)
    return events[offset : offset + limit]
