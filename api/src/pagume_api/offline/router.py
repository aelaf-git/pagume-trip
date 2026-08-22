"""Chooses between Neon (primary) and the local Docker mirror.

The engine factories ask this module which URL to use, so a single switch here
redirects every session, sync and async alike.
"""

from __future__ import annotations

import logging
import threading
import time
from typing import Literal

from sqlalchemy import create_engine, text
from sqlalchemy.pool import NullPool

from pagume_api.config import get_settings

logger = logging.getLogger(__name__)

Target = Literal["primary", "local"]
PRIMARY: Target = "primary"
LOCAL: Target = "local"


def is_postgres(url: str) -> bool:
    return url.startswith("postgres")


def connect_args_for(url: str, timeout: int) -> dict:
    """Driver-specific way to say "give up quickly on a dead host"."""
    if url.startswith("sqlite"):
        return {"check_same_thread": False}
    if "+asyncpg" in url:
        return {"timeout": timeout}
    return {"connect_timeout": timeout}


class DatabaseRouter:
    def __init__(
        self,
        primary_url: str,
        local_url: str,
        *,
        failover_enabled: bool = True,
        connect_timeout: int = 3,
        cooldown: int = 15,
    ) -> None:
        self._urls: dict[str, str] = {PRIMARY: primary_url, LOCAL: local_url}
        self._connect_timeout = connect_timeout
        self._cooldown = cooldown
        self._lock = threading.Lock()
        self._failed_at: float = 0.0

        self.failover_enabled = bool(
            failover_enabled
            and primary_url
            and local_url
            and is_postgres(primary_url)
            and is_postgres(local_url)
        )
        self._active: str = PRIMARY if primary_url else LOCAL

    @property
    def active(self) -> str:
        return self._active

    @property
    def connect_timeout(self) -> int:
        return self._connect_timeout

    def url_for(self, target: str) -> str:
        return self._urls.get(target, "")

    def active_url(self) -> str:
        return self._urls[self._active]

    def report_failure(self, target: str) -> bool:
        """Called when a query against ``target`` hits a connection error.

        Returns True when this moved traffic to the mirror.
        """
        if target != PRIMARY or not self.failover_enabled:
            return False
        with self._lock:
            self._failed_at = time.monotonic()
            if self._active == LOCAL:
                return False
            self._active = LOCAL
            logger.warning("Primary database unreachable — serving from the local mirror")
            return True

    def probe(self, target: str) -> bool:
        url = self.url_for(target)
        if not url:
            return False
        engine = create_engine(
            url,
            poolclass=NullPool,
            connect_args=connect_args_for(url, self._connect_timeout),
        )
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return True
        except Exception as exc:  # noqa: BLE001 — any failure means "not usable"
            logger.debug("Probe of %s failed: %s", target, exc)
            return False
        finally:
            engine.dispose()

    def refresh(self) -> tuple[str, str]:
        """Re-test the primary and switch if needed. Returns (before, after)."""
        if not self.failover_enabled:
            return self._active, self._active

        before = self._active
        healthy = self.probe(PRIMARY)

        with self._lock:
            if healthy:
                cooling = time.monotonic() - self._failed_at < self._cooldown
                if self._active == LOCAL and not cooling:
                    self._active = PRIMARY
                    logger.info("Primary database recovered — switching back from the mirror")
            elif self._active == PRIMARY:
                self._failed_at = time.monotonic()
                self._active = LOCAL
                logger.warning("Primary database unreachable — serving from the local mirror")
            return before, self._active


_router: DatabaseRouter | None = None
_router_lock = threading.Lock()


def get_router() -> DatabaseRouter:
    global _router
    if _router is None:
        with _router_lock:
            if _router is None:
                settings = get_settings()
                _router = DatabaseRouter(
                    settings.database_url,
                    settings.local_database_url,
                    failover_enabled=settings.db_failover_enabled,
                    connect_timeout=settings.db_connect_timeout,
                    cooldown=settings.db_probe_interval,
                )
    return _router


def reset_router() -> None:
    global _router
    _router = None
