"""
utils/validators.py — HackOS AI Backend
Request and data validation helpers.
"""

from __future__ import annotations

import os
from pathlib import Path

from config import ALLOWED_EXTENSIONS, MAX_FILE_SIZE_BYTES


# ── File validation ───────────────────────────────────────────────────────────

def validate_uploaded_file(file) -> tuple[bool, str]:
    """
    Validate a werkzeug FileStorage object.
    Returns (is_valid: bool, error_message: str).
    error_message is empty string when valid.
    """
    if file is None or file.filename == "":
        return False, "No file provided."

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        allowed = ", ".join(sorted(ALLOWED_EXTENSIONS))
        return False, f"File type '{ext}' is not supported. Allowed: {allowed}"

    # Read the file size without consuming the stream
    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)  # reset to beginning for subsequent reads

    max_mb = MAX_FILE_SIZE_BYTES // (1024 * 1024)
    if size > MAX_FILE_SIZE_BYTES:
        return False, f"File size exceeds the {max_mb} MB limit."

    return True, ""


# ── Hackathon payload validation ──────────────────────────────────────────────

REQUIRED_FIELDS: list[str] = [
    "title",
    "description",
    "start_date",
    "end_date",
    "registration_deadline",
    "contact_email",
]


def validate_hackathon_payload(data: dict) -> tuple[bool, list[str]]:
    """
    Validate the hackathon creation payload sent from the frontend.
    Returns (is_valid: bool, list_of_error_messages).
    """
    errors: list[str] = []

    if not isinstance(data, dict):
        return False, ["Request body must be a JSON object."]

    # Required field presence check
    for field in REQUIRED_FIELDS:
        value = data.get(field, "")
        if not str(value).strip():
            errors.append(f"'{field}' is required and cannot be empty.")

    # Array type checks
    array_fields = ["tracks", "rules", "faqs", "sponsors"]
    for field in array_fields:
        if field in data and not isinstance(data[field], list):
            errors.append(f"'{field}' must be an array.")

    # Basic email format check
    email = data.get("contact_email", "")
    if email and "@" not in str(email):
        errors.append("'contact_email' must be a valid email address.")

    # team_size sanity check
    try:
        min_size = int(data.get("team_size_min", 1) or 1)
        max_size = int(data.get("team_size_max", 1) or 1)
        if min_size > max_size:
            errors.append("'team_size_min' cannot be greater than 'team_size_max'.")
    except (ValueError, TypeError):
        errors.append("'team_size_min' and 'team_size_max' must be numeric strings.")

    return len(errors) == 0, errors


# ── Participant payload validation ────────────────────────────────────────────

REQUIRED_PARTICIPANT_FIELDS: list[str] = [
    "hackathon_id",
    "full_name",
    "email",
    "phone",
    "college",
]

def validate_participant_payload(data: dict) -> tuple[bool, list[str]]:
    """
    Validate the participant registration payload sent from the frontend.
    Returns (is_valid: bool, list_of_error_messages).
    """
    errors: list[str] = []

    if not isinstance(data, dict):
        return False, ["Request body must be a JSON object."]

    # Required field presence check
    for field in REQUIRED_PARTICIPANT_FIELDS:
        value = data.get(field, "")
        if not str(value).strip():
            errors.append(f"'{field}' is required and cannot be empty.")

    # Array type checks
    if "skills" in data and not isinstance(data["skills"], list):
        errors.append("'skills' must be an array.")

    # Basic email format check
    email = data.get("email", "")
    if email and "@" not in str(email):
        errors.append("'email' must be a valid email address.")

    return len(errors) == 0, errors
