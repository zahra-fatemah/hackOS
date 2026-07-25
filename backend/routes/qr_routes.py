from flask import Blueprint, request, jsonify
from utils.qr_generator import verify_qr_payload
from utils.mongodb import claim_meal

qr_bp = Blueprint("qr", __name__)

@qr_bp.post("/api/qr/redeem")
def redeem_qr():
    payload = request.get_json(silent=True)
    if not payload:
        return jsonify({"status": "invalid_request"}), 400
        
    qr_payload = payload.get("qr_payload")
    meal_type = payload.get("meal_type")
    
    if not isinstance(qr_payload, dict) or not meal_type:
        return jsonify({"status": "invalid_request", "message": "qr_payload (dict) and meal_type are required"}), 400
        
    if not verify_qr_payload(qr_payload):
        return jsonify({"status": "invalid_qr"}), 400
        
    participant_id = qr_payload.get("participant_id")
    hackathon_id = qr_payload.get("hackathon_id")
    
    success, created_at = claim_meal(participant_id, meal_type, hackathon_id)
    
    if not success:
        return jsonify({
            "status": "already_claimed", 
            "at": created_at.isoformat() if hasattr(created_at, "isoformat") else str(created_at)
        }), 409
        
    return jsonify({"status": "success"}), 200
