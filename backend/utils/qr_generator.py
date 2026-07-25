"""
utils/qr_generator.py — HackOS AI Backend
Generates QR codes for participant registration.
"""

import json
import os
import qrcode
import hmac
import hashlib
from config import UPLOAD_FOLDER, QR_SECRET

QR_FOLDER = os.path.join(UPLOAD_FOLDER, "qr")
os.makedirs(QR_FOLDER, exist_ok=True)

def generate_qr(participant_id: str, registration_id: str, hackathon_id: str) -> str:
    """
    Generates a QR code containing participant details as JSON.
    Saves the QR code image to uploads/qr/<registration_id>.png.
    Returns the relative path to the QR code image.
    """
    msg = f"{participant_id}:{registration_id}:{hackathon_id}".encode("utf-8")
    sig = hmac.new(QR_SECRET.encode("utf-8"), msg, hashlib.sha256).hexdigest()
    
    payload = {
        "participant_id": participant_id,
        "registration_id": registration_id,
        "hackathon_id": hackathon_id,
        "sig": sig
    }
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(json.dumps(payload))
    qr.make(fit=True)

    img = qr.make_image(fill_color="#0f0f1f", back_color="#ffffff")
    
    filename = f"{registration_id}.png"
    filepath = os.path.join(QR_FOLDER, filename)
    
    img.save(filepath)
    
    return f"uploads/qr/{filename}"

def verify_qr_payload(payload: dict) -> bool:
    participant_id = payload.get("participant_id")
    registration_id = payload.get("registration_id")
    hackathon_id = payload.get("hackathon_id")
    sig = payload.get("sig")
    
    if not all([participant_id, registration_id, hackathon_id, sig]):
        return False
        
    msg = f"{participant_id}:{registration_id}:{hackathon_id}".encode("utf-8")
    expected_sig = hmac.new(QR_SECRET.encode("utf-8"), msg, hashlib.sha256).hexdigest()
    
    return hmac.compare_digest(sig, expected_sig)
