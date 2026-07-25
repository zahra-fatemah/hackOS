"""
utils/mongodb.py — HackOS AI Backend
Singleton MongoDB client and collection helpers.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError, DuplicateKeyError

from config import MONGO_URI, MONGO_DB_NAME

logger = logging.getLogger(__name__)

# ── Singleton client ──────────────────────────────────────────────────────────
_client: MongoClient | None = None


def get_client() -> MongoClient:
    """Return the shared MongoClient, creating it on first call."""
    global _client
    if _client is None:
        _client = MongoClient(
            MONGO_URI,
            serverSelectionTimeoutMS=8_000,  # 8 s connection timeout
            connectTimeoutMS=8_000,
            socketTimeoutMS=15_000,
        )
        # Eagerly validate the connection so startup fails fast.
        try:
            _client.admin.command("ping")
            logger.info("✅  Connected to MongoDB Atlas — db: %s", MONGO_DB_NAME)
        except (ConnectionFailure, ServerSelectionTimeoutError) as exc:
            logger.error("❌  MongoDB connection failed: %s", exc)
            raise
    return _client


def get_db():
    """Return the hackos_ai database handle."""
    return get_client()[MONGO_DB_NAME]


def hackathons_col() -> Collection:
    """Return the 'hackathons' collection."""
    return get_db()["hackathons"]


def participants_col() -> Collection:
    """Return the 'participants' collection."""
    return get_db()["participants"]


def seating_assignments_col() -> Collection:
    """Return the 'seating_assignments' collection."""
    return get_db()["seating_assignments"]

def seating_layouts_col() -> Collection:
    """Return the 'seating_layouts' collection."""
    return get_db()["seating_layouts"]

def seat_assignments_col() -> Collection:
    """Return the 'seat_assignments' collection."""
    return get_db()["seat_assignments"]

def rewards_col() -> Collection:
    """Return the 'rewards' collection."""
    return get_db()["rewards"]


def scan_logs_col() -> Collection:
    return get_db()["scan_logs"]

def food_claims_col() -> Collection:
    """Return the 'food_claims' collection."""
    return get_db()["food_claims"]


def meal_logs_col() -> Collection:
    """Return the 'meal_logs' collection."""
    return get_db()["meal_logs"]


def organizer_scan_codes_col() -> Collection:
    """Return the 'organizer_scan_codes' collection."""
    return get_db()["organizer_scan_codes"]


def otps_col() -> Collection:
    """Return the 'otps' collection."""
    return get_db()["otps"]


def users_col() -> Collection:
    """Return the 'users' collection."""
    return get_db()["users"]


# ── CRUD helpers ──────────────────────────────────────────────────────────────

def insert_hackathon(doc: dict) -> str:
    """
    Insert a new hackathon document.
    Automatically adds created_at and updated_at timestamps.
    Returns the newly created document's string ID.
    """
    now = datetime.now(timezone.utc)
    doc["created_at"] = now
    doc["updated_at"] = now

    result = hackathons_col().insert_one(doc)
    return str(result.inserted_id)


def fetch_all_hackathons(organizer_email: str = None) -> list[dict]:
    """Return all hackathons sorted newest-first, optionally filtered by organizer_email."""
    col = hackathons_col()
    query = {}
    if organizer_email:
        query["organizer_email"] = organizer_email
    docs = col.find(query, sort=[("created_at", -1)])
    return [_serialize(d) for d in docs]


def fetch_hackathon_by_id(hackathon_id: str) -> dict | None:
    """Return a single hackathon or None if not found."""
    from bson import ObjectId
    from bson.errors import InvalidId

    try:
        oid = ObjectId(hackathon_id)
    except InvalidId:
        return None

    doc = hackathons_col().find_one({"_id": oid})
    return _serialize(doc) if doc else None


def delete_hackathon_by_id(hackathon_id: str) -> bool:
    """
    Delete a hackathon by ID.
    Returns True if a document was deleted, False otherwise.
    """
    from bson import ObjectId
    from bson.errors import InvalidId

    try:
        oid = ObjectId(hackathon_id)
    except InvalidId:
        return False

    result = hackathons_col().delete_one({"_id": oid})
    return result.deleted_count == 1


# ── Participant CRUD helpers ──────────────────────────────────────────────────

def insert_participant(doc: dict) -> str:
    """
    Insert a new participant document.
    Automatically adds created_at and updated_at timestamps.
    Returns the newly created document's string ID.
    """
    now = datetime.now(timezone.utc)
    doc["created_at"] = now
    doc["updated_at"] = now
    if "meals" not in doc:
        doc["meals"] = {
            "breakfast": False,
            "lunch": False,
            "dinner": False
        }

    result = participants_col().insert_one(doc)
    return str(result.inserted_id)


def check_duplicate_registration(email: str, hackathon_id: str) -> bool:
    """Check if a participant with this email is already registered for this hackathon."""
    count = participants_col().count_documents({
        "email": email,
        "hackathon_id": hackathon_id
    })
    return count > 0


def fetch_participant_by_id(participant_id: str) -> dict | None:
    """Fetch a single participant by MongoDB ObjectId string."""
    from bson import ObjectId
    try:
        oid = ObjectId(participant_id)
    except Exception:
        return None
    doc = participants_col().find_one({"_id": oid})
    return _serialize(doc) if doc else None


def fetch_participant_by_custom_id(custom_id: str) -> dict | None:
    """Fetch a single participant by their P-XXX custom string."""
    doc = participants_col().find_one({"participant_id": custom_id})
    return _serialize(doc) if doc else None


def fetch_participants_by_hackathon(hackathon_id: str) -> list[dict]:
    """Return all participants for a specific hackathon, sorted newest-first."""
    col = participants_col()
    docs = col.find({"hackathon_id": hackathon_id}, sort=[("created_at", -1)])
    return [_serialize(d) for d in docs]


def fetch_participants_for_hackathons(hackathon_ids: list[str]) -> list[dict]:
    """Return all participants for a list of hackathons, sorted newest-first."""
    col = participants_col()
    docs = col.find({"hackathon_id": {"$in": hackathon_ids}}, sort=[("created_at", -1)])
    return [_serialize(d) for d in docs]


def delete_participant_by_id(participant_id: str) -> bool:
    """
    Delete a participant by ID.
    Returns True if a document was deleted, False otherwise.
    """
    from bson import ObjectId
    from bson.errors import InvalidId

    try:
        oid = ObjectId(participant_id)
    except InvalidId:
        return False

    result = participants_col().delete_one({"_id": oid})
    return result.deleted_count == 1


def update_participant_meal_status(participant_id: str, meal_type: str) -> bool:
    """Update a specific meal to true for a participant."""
    key = f"meals.{meal_type.lower()}"
    result = participants_col().update_one(
        {"participant_id": participant_id},
        {"$set": {key: True, "updated_at": datetime.now(timezone.utc)}}
    )
    return result.modified_count > 0


# ── Organizer Scan Codes CRUD helpers ─────────────────────────────────────────

def insert_scan_code(doc: dict) -> str:
    """Insert a new organizer scan code document."""
    doc["created_at"] = datetime.now(timezone.utc)
    result = organizer_scan_codes_col().insert_one(doc)
    return str(result.inserted_id)

def fetch_scan_code(scan_code: str, hackathon_id: str) -> dict | None:
    """Fetch a scan code document by code and hackathon."""
    doc = organizer_scan_codes_col().find_one({
        "scan_code": scan_code,
        "hackathon_id": hackathon_id
    })
    return _serialize(doc) if doc else None


# ── Meal Logs CRUD helpers ────────────────────────────────────────────────────

def insert_meal_log(doc: dict) -> str:
    """Insert a new meal log."""
    doc["claimed_at"] = datetime.now(timezone.utc)
    result = meal_logs_col().insert_one(doc)
    return str(result.inserted_id)

def fetch_meal_history_by_participant(participant_id: str) -> list[dict]:
    """Return all meal logs for a participant."""
    docs = meal_logs_col().find({"participant_id": participant_id}, sort=[("claimed_at", -1)])
    return [_serialize(d) for d in docs]

def fetch_meal_logs_for_hackathon(hackathon_id: str) -> list[dict]:
    """Return all meal logs for a hackathon."""
    docs = meal_logs_col().find({"hackathon_id": hackathon_id}, sort=[("claimed_at", -1)])
    return [_serialize(d) for d in docs]

def fetch_meal_logs_for_hackathons(hackathon_ids: list[str]) -> list[dict]:
    """Return all meal logs for a list of hackathons."""
    docs = meal_logs_col().find({"hackathon_id": {"$in": hackathon_ids}}, sort=[("claimed_at", -1)])
    return [_serialize(d) for d in docs]


def fetch_recent_meal_logs(hackathon_id: str, limit: int = 20) -> list[dict]:
    """Return the recent meal logs for a hackathon."""
    docs = meal_logs_col().find({"hackathon_id": hackathon_id}, sort=[("claimed_at", -1)]).limit(limit)
    return [_serialize(d) for d in docs]


# ── Generalized Scan Logs CRUD helpers ────────────────────────────────────────

def ensure_scan_logs_index():
    """Create unique compound index for (participant_id, scan_type, sub_type) to prevent double scans."""
    # Note: MongoDB handles null values uniquely, so entry scans (sub_type=null) will only have 1 document allowed.
    scan_logs_col().create_index(
        [("participant_id", 1), ("scan_type", 1), ("sub_type", 1)],
        unique=True
    )

def record_scan(participant_id: str, hackathon_id: str, scan_type: str, sub_type: str | None, scanned_by: str) -> tuple[bool, datetime | None]:
    """
    Attempts to insert a scan log safely handling race conditions via unique index.
    Returns (True, None) on success.
    Returns (False, existing_scanned_at) if already scanned.
    """
    now = datetime.now(timezone.utc)
    doc = {
        "participant_id": participant_id,
        "hackathon_id": hackathon_id,
        "scan_type": scan_type,
        "sub_type": sub_type,
        "scanned_by": scanned_by,
        "scanned_at": now
    }
    try:
        scan_logs_col().insert_one(doc)
        
        # If it's a food scan, update the participant meals cache
        if scan_type == "food" and sub_type:
            update_participant_meal_status(participant_id, sub_type)
            
        return True, None
    except DuplicateKeyError:
        # Fetch the existing document to return its timestamp
        existing = scan_logs_col().find_one({
            "participant_id": participant_id,
            "scan_type": scan_type,
            "sub_type": sub_type
        })
        if existing:
            return False, existing.get("scanned_at")
        return False, None


# ── Food Claims CRUD helpers ──────────────────────────────────────────────────

def ensure_food_claims_index():
    """DEPRECATED: Use ensure_scan_logs_index instead."""
    food_claims_col().create_index(
        [("participant_id", 1), ("meal_type", 1)],
        unique=True
    )

def insert_food_claim(doc: dict) -> str:
    now = datetime.now(timezone.utc)
    doc["created_at"] = now
    result = food_claims_col().insert_one(doc)
    return str(result.inserted_id)

def check_duplicate_food_claim(participant_id: str, meal_type: str) -> bool:
    """DEPRECATED: Use claim_meal directly to avoid race conditions."""
    count = food_claims_col().count_documents({
        "participant_id": participant_id,
        "meal_type": meal_type
    })
    return count > 0

def claim_meal(participant_id: str, meal_type: str, hackathon_id: str) -> tuple[bool, datetime | None]:
    """
    DEPRECATED: Use record_scan instead.
    """
    now = datetime.now(timezone.utc)
    doc = {
        "participant_id": participant_id,
        "hackathon_id": hackathon_id,
        "meal_type": meal_type,
        "created_at": now
    }
    
    try:
        food_claims_col().insert_one(doc)
        # Update read cache ONLY after successful insert
        update_participant_meal_status(participant_id, meal_type)
        return True, None
    except DuplicateKeyError:
        existing = food_claims_col().find_one({
            "participant_id": participant_id,
            "meal_type": meal_type
        })
        return False, existing.get("created_at") if existing else now

def fetch_food_claims_for_hackathons(hackathon_ids: list[str]) -> list[dict]:
    col = food_claims_col()
    docs = col.find({"hackathon_id": {"$in": hackathon_ids}}, sort=[("created_at", -1)])
    return [_serialize(d) for d in docs]


# ── Auth & Profile helpers ────────────────────────────────────────────────────

def store_otp(email: str, otp: str, role: str):
    otps_col().delete_many({"email": email})
    otps_col().insert_one({
        "email": email,
        "otp": otp,
        "role": role,
        "created_at": datetime.now(timezone.utc)
    })

def verify_otp(email: str, otp: str, role: str) -> bool:
    doc = otps_col().find_one({"email": email, "otp": otp, "role": role})
    if not doc:
        return False
    # Check if older than 5 mins
    created_at = doc["created_at"]
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    age = datetime.now(timezone.utc) - created_at
    if age.total_seconds() > 300:
        return False
    
    otps_col().delete_many({"email": email})
    
    # ensure user exists
    if not users_col().find_one({"email": email}):
        users_col().insert_one({
            "email": email,
            "role": role,
            "created_at": datetime.now(timezone.utc)
        })
    return True

def get_participant_activity(email: str) -> dict:
    registrations = list(participants_col().find({"email": email}))
    hackathon_ids = [r["hackathon_id"] for r in registrations]
    p_ids = [str(r["_id"]) for r in registrations]
    meals_claimed = meal_logs_col().count_documents({"participant_id": {"$in": p_ids}})
    return {
        "hackathons_joined": len(registrations),
        "meals_claimed": meals_claimed,
        "hackathon_ids": hackathon_ids,
        "registrations": [_serialize(r) for r in registrations]
    }

def get_organizer_activity(email: str) -> dict:
    hackathons = list(hackathons_col().find({"organizer_email": email}))
    h_ids = [str(h["_id"]) for h in hackathons]
    participants = participants_col().count_documents({"hackathon_id": {"$in": h_ids}})
    return {
        "hackathons_created": len(hackathons),
        "total_participants": participants
    }


# ── Internal helpers ──────────────────────────────────────────────────────────

def _serialize(doc: dict) -> dict:
    """Convert MongoDB _id (ObjectId) and datetime fields for JSON serialisation."""
    if doc is None:
        return doc
    doc = dict(doc)  # shallow copy — don't mutate the original
    doc["id"] = str(doc.pop("_id"))

    # Stringify any datetime objects
    for key, val in doc.items():
        if isinstance(val, datetime):
            doc[key] = val.isoformat()

    return doc
