from datetime import datetime, timezone
from bson.objectid import ObjectId
from bson.errors import InvalidId
import logging

logger = logging.getLogger(__name__)

def parse_isoformat_safely(date_str: str):
    """Parses an ISO format date string, stripping 'Z' if present."""
    if not date_str:
        return None
    try:
        # Replace Z with +00:00 to support Python < 3.11 fromisoformat
        clean_str = date_str.replace("Z", "+00:00")
        return datetime.fromisoformat(clean_str)
    except ValueError:
        return None

def apply_auto_expiry(reward: dict) -> dict:
    """
    Checks if a reward is ACTIVE but past its expiry_date.
    If so, updates it in the DB to EXPIRED and returns the updated dict.
    """
    if reward.get("status") == "ACTIVE" and reward.get("expiry_date"):
        expiry_dt = parse_isoformat_safely(reward["expiry_date"])
        now = datetime.now(timezone.utc)
        
        # If expiry_dt is naive, assume UTC
        if expiry_dt and expiry_dt.tzinfo is None:
            expiry_dt = expiry_dt.replace(tzinfo=timezone.utc)
            
        if expiry_dt and now > expiry_dt:
            from utils.mongodb import rewards_col
            try:
                rewards_col().update_one(
                    {"_id": ObjectId(reward["_id"])},
                    {"$set": {"status": "EXPIRED"}}
                )
                reward["status"] = "EXPIRED"
            except Exception as e:
                logger.error(f"Failed to auto-expire reward {reward['_id']}: {e}")
                
    return reward

def mask_voucher_code(reward: dict) -> dict:
    """Masks the voucher code for security before returning to the frontend."""
    if "voucher_code" in reward:
        reward["voucher_code"] = "********-****-****"
    return reward

def process_rewards_for_client(rewards_list: list) -> list:
    """Applies auto-expiry and masks voucher codes for a list of rewards."""
    processed = []
    for r in rewards_list:
        r["_id"] = str(r["_id"])
        r = apply_auto_expiry(r)
        r = mask_voucher_code(r)
        processed.append(r)
    return processed

def get_reward_dashboard_stats(hackathon_id: str) -> dict:
    """Calculates reward statistics for the organizer dashboard."""
    from utils.mongodb import rewards_col
    
    # Run auto-expiry on all active rewards before gathering stats
    # Optimization: Find all active rewards whose expiry is past now
    now_iso = datetime.now(timezone.utc).isoformat()
    rewards_col().update_many(
        {
            "hackathon_id": hackathon_id,
            "status": "ACTIVE",
            "expiry_date": {"$lt": now_iso}
        },
        {"$set": {"status": "EXPIRED"}}
    )
    
    pipeline = [
        {"$match": {"hackathon_id": hackathon_id}},
        {"$group": {
            "_id": None,
            "total_rewards": {"$sum": 1},
            "active": {"$sum": {"$cond": [{"$eq": ["$status", "ACTIVE"]}, 1, 0]}},
            "expired": {"$sum": {"$cond": [{"$eq": ["$status", "EXPIRED"]}, 1, 0]}},
            "redeemed": {"$sum": {"$cond": [{"$eq": ["$status", "REDEEMED"]}, 1, 0]}},
            "unrevealed": {"$sum": {"$cond": [{"$eq": ["$revealed", False]}, 1, 0]}},
            # Platform specific aggregations
            "amazon": {"$sum": {"$cond": [{"$eq": ["$reward_platform", "Amazon"]}, 1, 0]}},
            "flipkart": {"$sum": {"$cond": [{"$eq": ["$reward_platform", "Flipkart"]}, 1, 0]}},
            "steam": {"$sum": {"$cond": [{"$eq": ["$reward_platform", "Steam"]}, 1, 0]}},
        }}
    ]
    
    result = list(rewards_col().aggregate(pipeline))
    if not result:
        return {
            "total_rewards": 0, "active": 0, "expired": 0, "redeemed": 0,
            "unrevealed": 0, "amazon": 0, "flipkart": 0, "steam": 0
        }
        
    stats = result[0]
    stats.pop("_id", None)
    return stats
