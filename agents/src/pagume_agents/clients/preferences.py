from typing import Protocol

from pagume_agents.models.trip import UserPreferences


class UserPreferenceStore(Protocol):
    def get(self, user_id: str) -> UserPreferences | None: ...

    def upsert(self, preferences: UserPreferences) -> UserPreferences: ...


class InMemoryPreferenceStore:
    def __init__(self) -> None:
        self._data: dict[str, UserPreferences] = {}

    def get(self, user_id: str) -> UserPreferences | None:
        return self._data.get(user_id)

    def upsert(self, preferences: UserPreferences) -> UserPreferences:
        self._data[preferences.user_id] = preferences
        return preferences
