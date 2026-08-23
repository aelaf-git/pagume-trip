"""Unit tests for Neon ↔ mirror failover routing."""

from pagume_api.config import get_settings
from pagume_api.offline.router import LOCAL, PRIMARY, DatabaseRouter, reset_router


def test_router_falls_back_when_primary_probe_fails():
    router = DatabaseRouter(
        "postgresql+psycopg://p@localhost/p",
        "postgresql+psycopg://l@localhost/l",
        failover_enabled=True,
        connect_timeout=1,
        cooldown=0,
    )
    router.probe = lambda target: target != PRIMARY  # type: ignore[method-assign]
    before, after = router.refresh()
    assert before == PRIMARY
    assert after == LOCAL
    assert router.active_url().endswith("/l")


def test_router_recovers_to_primary_after_cooldown():
    router = DatabaseRouter(
        "postgresql+psycopg://p@localhost/p",
        "postgresql+psycopg://l@localhost/l",
        failover_enabled=True,
        connect_timeout=1,
        cooldown=0,
    )
    router.probe = lambda target: True  # type: ignore[method-assign]
    router.report_failure(PRIMARY)
    assert router.active == LOCAL
    before, after = router.refresh()
    assert before == LOCAL
    assert after == PRIMARY


def test_router_report_failure_switches_once():
    router = DatabaseRouter(
        "postgresql+psycopg://p@localhost/p",
        "postgresql+psycopg://l@localhost/l",
        failover_enabled=True,
        connect_timeout=1,
        cooldown=0,
    )
    assert router.active == PRIMARY
    assert router.report_failure(PRIMARY) is True
    assert router.active == LOCAL
    assert router.report_failure(PRIMARY) is False


def test_failover_disabled_without_local_url(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "sqlite:///tmp.db")
    monkeypatch.setenv("LOCAL_DATABASE_URL", "")
    monkeypatch.setenv("DB_FAILOVER_ENABLED", "true")
    get_settings.cache_clear()
    reset_router()

    from pagume_api.offline.router import get_router

    router = get_router()
    assert router.failover_enabled is False
