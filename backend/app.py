"""
app.py — HackOS AI Backend
Flask entry-point exposing all REST endpoints for Feature 1 (AI Hackathon Creation).

Endpoints
─────────
POST   /api/upload-hackathon-file   Upload a file, extract text, call AI, return JSON
POST   /api/create-hackathon        Validate + persist hackathon to MongoDB
GET    /api/hackathons              List all hackathons (newest-first)
GET    /api/hackathon/<id>          Fetch a single hackathon by ID
DELETE /api/hackathon/<id>          Delete a hackathon by ID
GET    /api/health                  Health-check / ping
"""

from __future__ import annotations

import logging
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

import config
from utils.file_parser import extract_text
from utils.gemini_service import extract_hackathon_data
from utils.resume_parser import extract_participant_data
from utils.qr_generator import generate_qr
from utils.mongodb import (
    delete_hackathon_by_id,
    fetch_all_hackathons,
    fetch_hackathon_by_id,
    insert_hackathon,
    insert_participant,
    check_duplicate_registration,
    fetch_participant_by_id,
    fetch_participant_by_custom_id,
    fetch_participants_by_hackathon,
    delete_participant_by_id,
    insert_food_claim,
    ensure_food_claims_index,
    check_duplicate_food_claim,
    fetch_food_claims_for_hackathons,
    fetch_participants_for_hackathons,
    update_participant_meal_status,
    insert_scan_code,
    fetch_scan_code,
    insert_meal_log,
    fetch_meal_history_by_participant,
    fetch_meal_logs_for_hackathon,
    fetch_recent_meal_logs,
    store_otp,
    verify_otp,
    get_participant_activity,
    get_organizer_activity,
)
from utils.email_service import generate_otp, send_otp_email
from utils.scan_code_service import (
    generate_6_digit_code,
    get_expiration_time,
    is_code_expired
)
from utils.validators import (
    validate_hackathon_payload,
    validate_uploaded_file,
    validate_participant_payload,
)

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# ── Flask app ─────────────────────────────────────────────────────────────────
app = Flask(__name__)

from routes.qr_routes import qr_bp
app.register_blueprint(qr_bp)

# Allow requests from the React dev server (Vite default: 3000 / 5173)
# and production origins. Adjust origins list to match your deployment.
CORS(
    app,
    origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:4173",
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8080",
    ],
    supports_credentials=True,
)

# Ensure the upload directory exists
os.makedirs(config.UPLOAD_FOLDER, exist_ok=True)

# ── Helpers ───────────────────────────────────────────────────────────────────

def success(data=None, message: str = "OK", status: int = 200):
    """Standard success response envelope."""
    body = {"success": True, "message": message}
    if data is not None:
        body["data"] = data
    return jsonify(body), status


def error(message: str, status: int = 400, errors: list | None = None):
    """Standard error response envelope."""
    body = {"success": False, "message": message}
    if errors:
        body["errors"] = errors
    return jsonify(body), status


def save_upload(file) -> str:
    """
    Save an uploaded FileStorage object to UPLOAD_FOLDER with a unique filename.
    Returns the absolute path to the saved file.
    """
    ext = Path(file.filename).suffix.lower()
    unique_name = f"{uuid.uuid4().hex}{ext}"
    dest = os.path.join(config.UPLOAD_FOLDER, unique_name)
    file.save(dest)
    return dest


def cleanup(file_path: str):
    """Remove a temporary uploaded file silently."""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except OSError as exc:
        logger.warning("Could not delete temp file %s: %s", file_path, exc)


# ═════════════════════════════════════════════════════════════════════════════
# ROUTE: Health Check
# ═════════════════════════════════════════════════════════════════════════════

@app.get("/api/health")
def health():
    """Simple liveness probe."""
    return success({"status": "running", "service": "HackOS AI Backend"})


# ═════════════════════════════════════════════════════════════════════════════
# ROUTE: Serve QR Code Images
# ═════════════════════════════════════════════════════════════════════════════

@app.route("/uploads/qr/<path:filename>")
def serve_qr(filename):
    """Serve generated QR codes."""
    qr_dir = os.path.join(config.UPLOAD_FOLDER, "qr")
    return send_from_directory(qr_dir, filename)


# ═════════════════════════════════════════════════════════════════════════════
# ROUTE: POST /api/upload-hackathon-file
# ─────────────────────────────────────────────────────────────────────────────
# 1. Receive multipart/form-data with field "file"
# 2. Validate file type & size
# 3. Extract text (PDF / DOCX / image OCR)
# 4. Send to Gemini → Groq fallback
# 5. Return structured JSON to frontend for auto-fill
# ═════════════════════════════════════════════════════════════════════════════

@app.post("/api/upload-hackathon-file")
def upload_hackathon_file():
    """Upload a hackathon document and get AI-extracted JSON in return."""

    # ── 1. File presence check ────────────────────────────────────────────────
    if "file" not in request.files:
        return error("No 'file' field in the request. Use multipart/form-data.")

    file = request.files["file"]

    # ── 2. Validation ─────────────────────────────────────────────────────────
    is_valid, err_msg = validate_uploaded_file(file)
    if not is_valid:
        return error(err_msg, status=422)

    # ── 3. Save to disk temporarily ───────────────────────────────────────────
    saved_path = save_upload(file)
    logger.info("Saved upload: %s", saved_path)

    try:
        # ── 4. Extract text ───────────────────────────────────────────────────
        try:
            text = extract_text(saved_path)
        except Exception as exc:
            logger.error("Text extraction failed: %s", exc)
            return error(f"Could not extract text from the uploaded file: {exc}", status=422)

        if not text.strip():
            return error(
                "No readable text could be extracted from this file. "
                "Please upload a file with legible content.",
                status=422,
            )

        # ── 5. AI extraction ──────────────────────────────────────────────────
        try:
            hackathon_data = extract_hackathon_data(text)
        except RuntimeError as exc:
            logger.error("AI extraction failed: %s", exc)
            return error(str(exc), status=503)
        except ValueError as exc:
            logger.error("AI returned bad JSON: %s", exc)
            return error(f"AI returned an invalid response: {exc}", status=502)

        return success(
            data=hackathon_data,
            message="Hackathon data extracted successfully.",
        )

    finally:
        # Always clean up the temporary file
        cleanup(saved_path)


# ═════════════════════════════════════════════════════════════════════════════
# ROUTE: POST /api/create-hackathon
# ─────────────────────────────────────────────────────────────────────────────
# 1. Receive edited hackathon JSON from the frontend
# 2. Validate required fields
# 3. Persist to MongoDB
# 4. Return success + new document ID
# ═════════════════════════════════════════════════════════════════════════════

@app.post("/api/create-hackathon")
def create_hackathon():
    """Save a (possibly organizer-edited) hackathon to MongoDB."""

    payload = request.get_json(silent=True)
    if payload is None:
        return error(
            "Request body must be JSON with Content-Type: application/json."
        )

    # ── Validate ──────────────────────────────────────────────────────────────
    is_valid, validation_errors = validate_hackathon_payload(payload)
    if not is_valid:
        return error(
            "Validation failed. Please fix the highlighted fields.",
            status=422,
            errors=validation_errors,
        )

    # ── Persist ───────────────────────────────────────────────────────────────
    try:
        new_id = insert_hackathon(payload)
        logger.info("Hackathon created — id: %s, title: %s", new_id, payload.get("title"))
    except Exception as exc:
        logger.error("MongoDB insert failed: %s", exc)
        return error("Database error while saving the hackathon.", status=500)

    return success(
        data={"id": new_id},
        message="Hackathon published successfully!",
        status=201,
    )


# ═════════════════════════════════════════════════════════════════════════════
# ROUTE: GET /api/hackathons
# ═════════════════════════════════════════════════════════════════════════════

@app.get("/api/hackathons")
def list_hackathons():
    """Return all hackathons sorted newest-first."""
    organizer_email = request.args.get("organizer_email")
    try:
        hackathons = fetch_all_hackathons(organizer_email)
    except Exception as exc:
        logger.error("MongoDB fetch failed: %s", exc)
        return error("Database error while fetching hackathons.", status=500)

    return success(data=hackathons, message=f"{len(hackathons)} hackathon(s) found.")


# ═════════════════════════════════════════════════════════════════════════════
# ROUTE: GET /api/hackathon/<id>
# ═════════════════════════════════════════════════════════════════════════════

@app.get("/api/hackathon/<string:hackathon_id>")
def get_hackathon(hackathon_id: str):
    """Fetch a single hackathon by MongoDB ObjectId string."""
    try:
        doc = fetch_hackathon_by_id(hackathon_id)
    except Exception as exc:
        logger.error("MongoDB fetch failed: %s", exc)
        return error("Database error while fetching the hackathon.", status=500)

    if doc is None:
        return error(f"Hackathon with id '{hackathon_id}' not found.", status=404)

    return success(data=doc)


# ═════════════════════════════════════════════════════════════════════════════
# ROUTE: DELETE /api/hackathon/<id>
# ═════════════════════════════════════════════════════════════════════════════

@app.delete("/api/hackathon/<string:hackathon_id>")
def delete_hackathon(hackathon_id: str):
    """Delete a hackathon by ID."""
    try:
        deleted = delete_hackathon_by_id(hackathon_id)
    except Exception as exc:
        logger.error("MongoDB delete failed: %s", exc)
        return error("Database error while deleting the hackathon.", status=500)

    if not deleted:
        return error(f"Hackathon with id '{hackathon_id}' not found.", status=404)

    logger.info("Hackathon deleted — id: %s", hackathon_id)
    return success(message="Hackathon deleted successfully.")


# ═════════════════════════════════════════════════════════════════════════════
# ROUTE: POST /api/upload-resume
# ═════════════════════════════════════════════════════════════════════════════

@app.post("/api/upload-resume")
def upload_resume():
    """Upload a resume document and get AI-extracted JSON for the participant."""
    if "file" not in request.files:
        return error("No 'file' field in the request. Use multipart/form-data.")

    file = request.files["file"]

    is_valid, err_msg = validate_uploaded_file(file)
    if not is_valid:
        return error(err_msg, status=422)

    saved_path = save_upload(file)
    logger.info("Saved resume upload: %s", saved_path)

    try:
        try:
            text = extract_text(saved_path)
        except Exception as exc:
            logger.error("Text extraction failed: %s", exc)
            return error(f"Could not extract text from the uploaded file: {exc}", status=422)

        if not text.strip():
            return error(
                "No readable text could be extracted from this file.",
                status=422,
            )

        try:
            participant_data = extract_participant_data(text)
        except RuntimeError as exc:
            logger.error("AI extraction failed: %s", exc)
            return error(str(exc), status=503)
        except ValueError as exc:
            logger.error("AI returned bad JSON: %s", exc)
            return error(f"AI returned an invalid response: {exc}", status=502)

        return success(
            data=participant_data,
            message="Resume data extracted successfully.",
        )
    finally:
        cleanup(saved_path)


# ═════════════════════════════════════════════════════════════════════════════
# ROUTE: POST /api/register-participant
# ═════════════════════════════════════════════════════════════════════════════

@app.post("/api/register-participant")
def register_participant():
    """Save a participant registration, generate ID and QR code."""
    payload = request.get_json(silent=True)
    if payload is None:
        return error("Request body must be JSON with Content-Type: application/json.")

    is_valid, validation_errors = validate_participant_payload(payload)
    if not is_valid:
        return error(
            "Validation failed. Please fix the highlighted fields.",
            status=422,
            errors=validation_errors,
        )

    # Duplicate check
    email = payload.get("email")
    hackathon_id = payload.get("hackathon_id")
    if check_duplicate_registration(email, hackathon_id):
        return error("This email is already registered for this hackathon.", status=409)

    # Generate IDs
    participant_id = f"P-{uuid.uuid4().hex[:8].upper()}"
    registration_id = f"REG-{uuid.uuid4().hex[:8].upper()}"
    
    payload["participant_id"] = participant_id
    payload["registration_id"] = registration_id
    payload["registration_status"] = "registered"

    try:
        # Generate QR code
        qr_url = generate_qr(participant_id, registration_id, hackathon_id)
        payload["qr_code"] = qr_url
        
        # Persist to DB
        new_id = insert_participant(payload)
        logger.info("Participant registered — id: %s", new_id)
    except Exception as exc:
        logger.error("Registration failed: %s", exc)
        return error("Database error while registering participant.", status=500)

    return success(
        data={
            "participant_id": participant_id,
            "registration_id": registration_id,
            "qr_url": qr_url
        },
        message="Participant registered successfully!",
        status=201,
    )


# ═════════════════════════════════════════════════════════════════════════════
# ROUTE: GET /api/participant/<id>
# ═════════════════════════════════════════════════════════════════════════════

@app.get("/api/participant/<string:participant_id>")
def get_participant(participant_id: str):
    """Fetch a single participant by MongoDB ObjectId string."""
    try:
        doc = fetch_participant_by_custom_id(participant_id)
        if not doc:
            doc = fetch_participant_by_id(participant_id)
    except Exception as exc:
        logger.error("MongoDB fetch failed: %s", exc)
        return error("Database error while fetching the participant.", status=500)

    if doc is None:
        return error(f"Participant with id '{participant_id}' not found.", status=404)

    return success(data=doc)


# ═════════════════════════════════════════════════════════════════════════════
# ROUTE: GET /api/hackathon/<id>/participants
# ═════════════════════════════════════════════════════════════════════════════

@app.get("/api/hackathon/<string:hackathon_id>/participants")
def get_hackathon_participants(hackathon_id: str):
    """Fetch all participants for a hackathon."""
    try:
        participants = fetch_participants_by_hackathon(hackathon_id)
    except Exception as exc:
        logger.error("MongoDB fetch failed: %s", exc)
        return error("Database error while fetching participants.", status=500)

    return success(data=participants, message=f"{len(participants)} participant(s) found.")


# ═════════════════════════════════════════════════════════════════════════════
# ROUTE: DELETE /api/participant/<id>
# ═════════════════════════════════════════════════════════════════════════════

@app.delete("/api/participant/<string:participant_id>")
def delete_participant(participant_id: str):
    """Delete a participant by ID."""
    try:
        doc = fetch_participant_by_id(participant_id)
        if not doc:
            return error(f"Participant with id '{participant_id}' not found.", status=404)
        
        # Delete the QR image
        qr_path = doc.get("qr_code")
        if qr_path:
            full_path = os.path.join(os.getcwd(), qr_path)
            cleanup(full_path)
            
        deleted = delete_participant_by_id(participant_id)
    except Exception as exc:
        logger.error("MongoDB delete failed: %s", exc)
        return error("Database error while deleting the participant.", status=500)

    logger.info("Participant deleted — id: %s", participant_id)
    return success(message="Participant deleted successfully.")


# ═════════════════════════════════════════════════════════════════════════════
# ROUTE: GET /api/organizer/participants
# ═════════════════════════════════════════════════════════════════════════════

@app.get("/api/organizer/participants")
def list_organizer_participants():
    """Return all participants across all hackathons for an organizer."""
    organizer_email = request.args.get("organizer_email")
    if not organizer_email:
        return error("organizer_email query param is required.", status=400)
        
    try:
        hackathons = fetch_all_hackathons(organizer_email)
        h_ids = [h["id"] for h in hackathons]
        participants = fetch_participants_for_hackathons(h_ids)
    except Exception as exc:
        logger.error("MongoDB fetch failed: %s", exc)
        return error("Database error while fetching participants.", status=500)

    return success(data=participants, message=f"{len(participants)} participant(s) found.")


# ═════════════════════════════════════════════════════════════════════════════
# ROUTE: GET /api/organizer/food-stats
# ═════════════════════════════════════════════════════════════════════════════

@app.get("/api/organizer/food-stats")
def get_organizer_food_stats():
    organizer_email = request.args.get("organizer_email")
    if not organizer_email:
        return error("organizer_email query param is required.", status=400)
        
    try:
        hackathons = fetch_all_hackathons(organizer_email)
        h_ids = [h["id"] for h in hackathons]
        participants = fetch_participants_for_hackathons(h_ids)
        claims = fetch_food_claims_for_hackathons(h_ids)
    except Exception as exc:
        logger.error("MongoDB fetch failed: %s", exc)
        return error("Database error while fetching food stats.", status=500)

    total_p = len(participants)
    
    stats = {
        "breakfast": {"claimed": sum(1 for c in claims if c["meal_type"] == "Breakfast"), "total": total_p},
        "lunch": {"claimed": sum(1 for c in claims if c["meal_type"] == "Lunch"), "total": total_p},
        "dinner": {"claimed": sum(1 for c in claims if c["meal_type"] == "Dinner"), "total": total_p},
        "recent": []
    }
    
    sorted_claims = sorted(claims, key=lambda c: c["created_at"], reverse=True)[:5]
    p_map = {p["id"]: p for p in participants}
    
    for c in sorted_claims:
        p = p_map.get(c["participant_id"])
        if p:
            from datetime import datetime
            dt = datetime.fromisoformat(c["created_at"]) if isinstance(c["created_at"], str) else c["created_at"]
            stats["recent"].append({
                "name": p["full_name"],
                "meal": c["meal_type"],
                "time": dt.strftime("%I:%M %p"),
                "status": "ok"
            })
            
    return success(data=stats)


# ═════════════════════════════════════════════════════════════════════════════
# ═════════════════════════════════════════════════════════════════════════════
# ROUTE: POST /api/organizer/scan
# ═════════════════════════════════════════════════════════════════════════════

@app.post("/api/organizer/scan")
def scan_qr():
    payload = request.get_json(silent=True)
    if not payload:
        return error("JSON body required.")
        
    qr_payload = payload.get("qr_payload")
    scan_type = payload.get("scan_type")
    sub_type = payload.get("sub_type")
    organizer_email = payload.get("organizer_email")
    
    if not isinstance(qr_payload, dict) or not scan_type or not organizer_email:
        return error("qr_payload (dict), scan_type, and organizer_email are required.", status=400)
        
    from utils.qr_generator import verify_qr_payload
    if not verify_qr_payload(qr_payload):
        return jsonify({"status": "invalid_qr"}), 400
        
    participant_id = qr_payload.get("participant_id")
    hackathon_id = qr_payload.get("hackathon_id")
    
    try:
        from utils.mongodb import fetch_hackathon_by_id
        hackathon = fetch_hackathon_by_id(hackathon_id)
        if not hackathon:
            return error("Hackathon not found.", status=404)
            
        if hackathon.get("organizer_email") != organizer_email:
            return error("Unauthorized. You are not the organizer of this hackathon.", status=403)
            
        p = fetch_participant_by_custom_id(participant_id)
        if not p:
            p = fetch_participant_by_id(participant_id)
            
        if not p:
            return error("Participant not found.", status=404)
            
        from utils.mongodb import record_scan
        # Use the actual string representation of the participant's ID
        pid = p["id"]
        
        success_claim, created_at = record_scan(pid, hackathon_id, scan_type, sub_type, organizer_email)
        
        if not success_claim:
            return error("Duplicate scan.", status=409, errors=[{"status": "duplicate", "name": p["full_name"], "at": created_at.isoformat() if created_at else None}])
            
    except Exception as exc:
        logger.error("Scan failed: %s", exc)
        return error("Database error.", status=500)
        
    return success(data={"status": "ok", "name": p["full_name"]})


# ═════════════════════════════════════════════════════════════════════════════
# ROUTE: GET /api/organizer/scan-logs
# ═════════════════════════════════════════════════════════════════════════════

@app.get("/api/organizer/scan-logs")
def get_scan_logs():
    hackathon_id = request.args.get("hackathon_id")
    organizer_email = request.args.get("organizer_email")
    
    if not hackathon_id or not organizer_email:
        return error("hackathon_id and organizer_email are required.", status=400)
        
    try:
        from utils.mongodb import fetch_hackathon_by_id, scan_logs_col, _serialize
        hackathon = fetch_hackathon_by_id(hackathon_id)
        if not hackathon:
            return error("Hackathon not found.", status=404)
            
        if hackathon.get("organizer_email") != organizer_email:
            return error("Unauthorized. You are not the organizer of this hackathon.", status=403)
            
        logs = list(scan_logs_col().find({"hackathon_id": hackathon_id}).sort("scanned_at", -1))
        serialized_logs = []
        for log in logs:
            ser = _serialize(log)
            # Fetch participant name
            p = fetch_participant_by_id(ser["participant_id"])
            if not p:
                p = fetch_participant_by_custom_id(ser["participant_id"])
            ser["participant_name"] = p["full_name"] if p else "Unknown Participant"
            serialized_logs.append(ser)
            
        return success(data=serialized_logs)
    except Exception as exc:
        logger.error("Failed to fetch scan logs: %s", exc)
        return error("Database error.", status=500)



# ═════════════════════════════════════════════════════════════════════════════
# ROUTE: POST /api/generate-scan-code
# ═════════════════════════════════════════════════════════════════════════════

@app.post("/api/generate-scan-code")
def generate_scan_code():
    payload = request.get_json(silent=True)
    if not payload:
        return error("JSON body required.")
    hackathon_id = payload.get("hackathon_id")
    organizer_id = payload.get("organizer_id")
    if not hackathon_id or not organizer_id:
        return error("hackathon_id and organizer_id are required.", status=400)
    
    code = generate_6_digit_code()
    expires_at = get_expiration_time(24)
    doc = {
        "hackathon_id": hackathon_id,
        "generated_by": organizer_id,
        "scan_code": code,
        "expires_at": expires_at.isoformat()
    }
    try:
        insert_scan_code(doc)
    except Exception as exc:
        logger.error("Failed to generate scan code: %s", exc)
        return error("Database error.", status=500)
    
    return success(data={"scan_code": code, "expires_at": doc["expires_at"]})


# ═════════════════════════════════════════════════════════════════════════════
# ROUTE: POST /api/verify-scan-code
# ═════════════════════════════════════════════════════════════════════════════

@app.post("/api/verify-scan-code")
def verify_scan_code():
    payload = request.get_json(silent=True)
    if not payload:
        return error("JSON body required.")
    scan_code = payload.get("scan_code")
    hackathon_id = payload.get("hackathon_id")
    if not scan_code or not hackathon_id:
        return error("scan_code and hackathon_id are required.", status=400)
        
    try:
        doc = fetch_scan_code(scan_code, hackathon_id)
        if not doc or is_code_expired(doc["expires_at"]):
            return error("Invalid Organizer Scan Code", status=403)
    except Exception as exc:
        logger.error("Failed to verify scan code: %s", exc)
        return error("Database error.", status=500)
        
    return success(message="Access Granted")


# ═════════════════════════════════════════════════════════════════════════════
# ROUTE: POST /api/scan-meal
# ═════════════════════════════════════════════════════════════════════════════

@app.post("/api/scan-meal")
def api_scan_meal():
    payload = request.get_json(silent=True)
    if not payload:
        return error("JSON body required.")
    hackathon_id = payload.get("hackathon_id")
    scan_code = payload.get("scan_code")
    meal_type = payload.get("meal_type")
    qr_data = payload.get("participant_qr_data", {})
    
    participant_id = qr_data.get("participant_id")
    registration_id = qr_data.get("registration_id")
    
    if not all([hackathon_id, scan_code, meal_type, participant_id, registration_id]):
        return error("Missing required fields.", status=400)
    
    if meal_type not in ["Breakfast", "Lunch", "Dinner"]:
        return error("Invalid meal type.", status=400)
        
    try:
        # Verify scan code
        code_doc = fetch_scan_code(scan_code, hackathon_id)
        if not code_doc or is_code_expired(code_doc["expires_at"]):
            return error("Invalid or expired Organizer Scan Code", status=403)
            
        # Verify participant
        p = fetch_participant_by_custom_id(participant_id)
        if not p:
            p = fetch_participant_by_id(participant_id)
            
        if not p or p.get("registration_id") != registration_id or p.get("hackathon_id") != hackathon_id:
            return error("Invalid Participant QR.", status=404)
            
        # Check meal status
        meals = p.get("meals", {})
        if meals.get(meal_type.lower()) is True:
            return error("Meal Already Claimed", status=409)
            
        # Update Participant and insert meal log
        update_participant_meal_status(p["participant_id"], meal_type)
        log_id = insert_meal_log({
            "hackathon_id": hackathon_id,
            "participant_id": p["id"],
            "registration_id": registration_id,
            "meal_type": meal_type,
            "claimed": True,
            "claimed_by": code_doc["generated_by"]
        })
    except Exception as exc:
        logger.error("Meal scan failed: %s", exc)
        return error("Database error.", status=500)
        
    return success(data={
        "participant_name": p.get("full_name"),
        "meal": meal_type,
        "claimed_at": datetime.now(timezone.utc).isoformat()
    })


# ═════════════════════════════════════════════════════════════════════════════
# ROUTE: GET /api/meal-history/<participant_id>
# ═════════════════════════════════════════════════════════════════════════════

@app.get("/api/meal-history/<string:participant_id>")
def get_meal_history(participant_id: str):
    try:
        logs = fetch_meal_history_by_participant(participant_id)
    except Exception as exc:
        logger.error("Failed to fetch meal history: %s", exc)
        return error("Database error.", status=500)
    return success(data=logs)


# ═════════════════════════════════════════════════════════════════════════════
# ROUTE: GET /api/meal-dashboard/<hackathon_id>
# ═════════════════════════════════════════════════════════════════════════════

@app.get("/api/meal-dashboard/<string:hackathon_id>")
def get_meal_dashboard(hackathon_id: str):
    try:
        participants = fetch_participants_by_hackathon(hackathon_id)
        logs = fetch_meal_logs_for_hackathon(hackathon_id)
    except Exception as exc:
        logger.error("Failed to fetch dashboard stats: %s", exc)
        return error("Database error.", status=500)
        
    total = len(participants)
    b_claimed = sum(1 for l in logs if l["meal_type"] == "Breakfast")
    l_claimed = sum(1 for l in logs if l["meal_type"] == "Lunch")
    d_claimed = sum(1 for l in logs if l["meal_type"] == "Dinner")
    
    return success(data={
        "total_participants": total,
        "breakfast_claimed": b_claimed,
        "lunch_claimed": l_claimed,
        "dinner_claimed": d_claimed,
        "remaining_breakfast": max(0, total - b_claimed),
        "remaining_lunch": max(0, total - l_claimed),
        "remaining_dinner": max(0, total - d_claimed)
    })


# ═════════════════════════════════════════════════════════════════════════════
# ROUTE: GET /api/recent-meal-scans/<hackathon_id>
# ═════════════════════════════════════════════════════════════════════════════

@app.get("/api/recent-meal-scans/<string:hackathon_id>")
def get_recent_meal_scans(hackathon_id: str):
    try:
        logs = fetch_recent_meal_logs(hackathon_id, limit=20)
    except Exception as exc:
        logger.error("Failed to fetch recent scans: %s", exc)
        return error("Database error.", status=500)
    return success(data=logs)


# ═════════════════════════════════════════════════════════════════════════════
# ROUTE: POST /api/auth/request-otp
# ═════════════════════════════════════════════════════════════════════════════

@app.post("/api/auth/request-otp")
def request_otp():
    payload = request.get_json(silent=True)
    if not payload:
        return error("JSON body required.")
    email = payload.get("email")
    role = payload.get("role")
    
    if not email or not role:
        return error("email and role are required.", status=400)
    
    otp = generate_otp(6)
    store_otp(email, otp, role)
    success_email = send_otp_email(email, otp, role)
    
    if not success_email:
        return error("Failed to send email. Check SMTP configuration.", status=500)
        
    return success(message="OTP sent to email.")


# ═════════════════════════════════════════════════════════════════════════════
# ROUTE: POST /api/auth/verify-otp
# ═════════════════════════════════════════════════════════════════════════════

@app.post("/api/auth/verify-otp")
def verify_otp_endpoint():
    payload = request.get_json(silent=True)
    if not payload:
        return error("JSON body required.")
    email = payload.get("email")
    otp = payload.get("otp")
    role = payload.get("role")
    
    if not all([email, otp, role]):
        return error("email, otp, and role are required.", status=400)
        
    if verify_otp(email, otp, role):
        return success(message="Login successful.", data={"email": email, "role": role})
    else:
        return error("Invalid or expired OTP.", status=403)


# ═════════════════════════════════════════════════════════════════════════════
# ROUTE: GET /api/profile
# ═════════════════════════════════════════════════════════════════════════════

@app.get("/api/profile")
def get_profile():
    email = request.args.get("email")
    role = request.args.get("role")
    
    if not email or not role:
        return error("email and role are required.", status=400)
        
    try:
        if role == "participant":
            data = get_participant_activity(email)
        elif role == "organizer":
            data = get_organizer_activity(email)
        else:
            return error("Invalid role.", status=400)
            
        return success(data=data)
    except Exception as exc:
        logger.error("Failed to fetch profile: %s", exc)
        return error("Database error.", status=500)


# ═════════════════════════════════════════════════════════════════════════════
# GLOBAL ERROR HANDLERS
# ═════════════════════════════════════════════════════════════════════════════

@app.errorhandler(404)
def not_found(_e):
    return error("The requested endpoint does not exist.", status=404)


@app.errorhandler(405)
def method_not_allowed(_e):
    return error("HTTP method not allowed for this endpoint.", status=405)


@app.errorhandler(413)
def request_entity_too_large(_e):
    max_mb = config.MAX_FILE_SIZE_BYTES // (1024 * 1024)
    return error(f"File is too large. Maximum allowed size is {max_mb} MB.", status=413)


@app.errorhandler(500)
def internal_server_error(exc):
    logger.exception("Unhandled server error: %s", exc)
    return error("An unexpected server error occurred.", status=500)


# ═════════════════════════════════════════════════════════════════════════════
# ENTRY POINT
# ═════════════════════════════════════════════════════════════════════════════

try:
    from utils.mongodb import ensure_food_claims_index, ensure_scan_logs_index
    ensure_food_claims_index()
    ensure_scan_logs_index()
    logger.info("MongoDB indexes ensured.")
except Exception as e:
    logger.warning("Could not ensure indexes: %s", e)

if __name__ == "__main__":
    logger.info("🚀  HackOS AI Backend starting on port %d …", config.PORT)
    app.run(
        host="0.0.0.0",
        port=config.PORT,
        debug=config.FLASK_DEBUG,
    )
