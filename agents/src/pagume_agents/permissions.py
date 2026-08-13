from enum import StrEnum


class Permission(StrEnum):
    READ = "READ"
    PREPARE = "PREPARE"
    TRANSACTIONAL = "TRANSACTIONAL"


class AuthorizationDenied(PermissionError):
    """Raised when a TRANSACTIONAL tool is invoked without user approval."""

    def __init__(self, action: str, message: str | None = None) -> None:
        self.action = action
        super().__init__(message or f"Authorization required for {action}")


def is_transaction_authorized(
    authorization: dict | None,
    *,
    action_id: str | None = None,
    amount_etb: float | None = None,
) -> bool:
    auth = authorization or {}
    if auth.get("approved") is True:
        return True
    approved_ids = set(auth.get("approved_action_ids") or [])
    if action_id and action_id in approved_ids:
        return True
    cap = auth.get("spending_cap_etb")
    spent = float(auth.get("spent_etb") or 0)
    if cap is not None and amount_etb is not None:
        return spent + amount_etb <= float(cap)
    return False


def require_permission(
    permission: Permission,
    authorization: dict | None,
    *,
    action: str,
    action_id: str | None = None,
    amount_etb: float | None = None,
) -> None:
    if permission != Permission.TRANSACTIONAL:
        return
    if is_transaction_authorized(
        authorization, action_id=action_id, amount_etb=amount_etb
    ):
        return
    raise AuthorizationDenied(action)
