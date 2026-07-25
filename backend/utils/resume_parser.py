"""
utils/resume_parser.py — HackOS AI Backend
Call Gemini (primary) with automatic Groq fallback for parsing resumes.
Returns a validated participant JSON dict.
"""

from __future__ import annotations

import logging
from typing import Any

from utils.gemini_service import _call_gemini, _call_groq, _parse_json

logger = logging.getLogger(__name__)

_RESUME_PROMPT = """You are a resume data extraction assistant.
Your ONLY job is to extract participant information from the provided resume text and
return it as a single, valid JSON object.

Rules you MUST follow:
1. Return ONLY the JSON object. No markdown fences, no explanations, no extra text.
2. If a field cannot be found, use an empty string "" for text fields or an
   empty array [] for array fields.
3. skills must be a JSON array of strings.

Required JSON schema (return exactly these keys):
{
  "full_name": "",
  "email": "",
  "phone": "",
  "college": "",
  "department": "",
  "year": "",
  "skills": [],
  "github": "",
  "linkedin": "",
  "portfolio": ""
}"""


def extract_participant_data(text: str) -> dict[str, Any]:
    """
    Send extracted resume text to Gemini.
    Falls back to Groq automatically on any failure.
    Returns the parsed participant dict.
    """
    user_message = f"Extract participant data from the following resume text:\n\n{text}"

    # Try Gemini first
    try:
        logger.info("🤖  Calling Gemini for Resume …")
        raw = _call_gemini(user_message, system_prompt=_RESUME_PROMPT)
        result = _parse_json(raw)
        return _sanitise_participant(result)
    except Exception as exc:
        logger.warning("⚠️   Gemini failed for resume (%s). Switching to Groq …", exc)

    # Fallback: Groq
    try:
        logger.info("🤖  Calling Groq for Resume …")
        raw = _call_groq(user_message, system_prompt=_RESUME_PROMPT)
        result = _parse_json(raw)
        return _sanitise_participant(result)
    except Exception as exc:
        logger.error("❌  Groq also failed for resume: %s", exc)
        raise RuntimeError(
            "Both Gemini and Groq failed to extract resume data."
        ) from exc


def _sanitise_participant(data: dict[str, Any]) -> dict[str, Any]:
    """
    Ensure every expected key exists and has the right default type.
    """
    str_fields = [
        "full_name", "email", "phone", "college",
        "department", "year", "github", "linkedin", "portfolio"
    ]
    
    for field in str_fields:
        if not isinstance(data.get(field), str):
            data[field] = str(data.get(field, "") or "")
            
    if not isinstance(data.get("skills"), list):
        data["skills"] = []
        
    return data
