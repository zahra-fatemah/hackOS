"""
utils/scan_code_service.py — HackOS AI Backend
Service for generating 6-digit organizer scan codes.
"""

import random
import string
from datetime import datetime, timedelta, timezone

def generate_6_digit_code() -> str:
    """Generate a random 6-digit numeric string."""
    return ''.join(random.choices(string.digits, k=6))

def get_expiration_time(hours: int = 24) -> datetime:
    """Return a UTC datetime 'hours' from now."""
    return datetime.now(timezone.utc) + timedelta(hours=hours)

def is_code_expired(expires_at: datetime | str) -> bool:
    """Check if the given expiration time has passed."""
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    return datetime.now(timezone.utc) > expires_at
