class InventoryUnavailableError(Exception):
    """Requested hotel, vehicle, or tour nights are already held or confirmed."""


RoomUnavailableError = InventoryUnavailableError
