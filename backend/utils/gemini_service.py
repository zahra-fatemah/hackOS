"""
utils/gemini_service.py — HackOS AI Backend
Call Gemini (primary) with automatic Groq fallback.
Returns a validated hackathon JSON dict.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any

from config import (
    GEMINI_API_KEY, GEMINI_MODEL,
    GROQ_API_KEY, GROQ_MODEL,
)

logger = logging.getLogger(__name__)

# ── Shared prompt ─────────────────────────────────────────────────────────────

_SYSTEM_PROMPT = """You are a hackathon data extraction assistant.
Your ONLY job is to extract hackathon information from the provided text and
return it as a single, valid JSON object.

Rules you MUST follow:
1. Return ONLY the JSON object. No markdown fences, no explanations, no extra text.
2. If a field cannot be found, use an empty string "" for text fields or an
   empty array [] for array fields.
3. Dates must be human-readable strings (e.g. "August 22–24, 2026").
4. team_size_min and team_size_max must be strings (e.g. "1", "4").
5. tracks, rules, faqs, sponsors must always be JSON arrays.
   - tracks: array of strings
   - rules: array of strings
   - faqs: array of {"question":"...","answer":"..."} objects
   - sponsors: array of strings

Required JSON schema (return exactly these keys):
{
  "title": "",
  "description": "",
  "theme": "",
  "venue": "",
  "city": "",
  "country": "",
  "start_date": "",
  "end_date": "",
  "registration_deadline": "",
  "team_size_min": "",
  "team_size_max": "",
  "eligibility": "",
  "prize_pool": "",
  "tracks": [],
  "rules": [],
  "faqs": [],
  "sponsors": [],
  "contact_email": "",
  "contact_phone": "",
  "website": ""
}"""


def extract_hackathon_data(text: str) -> dict[str, Any]:
    """
    Send extracted document text to Gemini.
    Falls back to Groq automatically on any failure.
    Returns the parsed hackathon dict.
    """
    user_message = f"Extract hackathon data from the following text:\n\n{text}"

    # Try Gemini first ─────────────────────────────────────────────────────────
    try:
        logger.info("🤖  Calling Gemini (%s) …", GEMINI_MODEL)
        raw = _call_gemini(user_message)
        result = _parse_json(raw)
        logger.info("✅  Gemini responded successfully.")
        return result
    except Exception as exc:
        logger.warning("⚠️   Gemini failed (%s). Switching to Groq …", exc)

    # Fallback: Groq ───────────────────────────────────────────────────────────
    try:
        logger.info("🤖  Calling Groq (%s) …", GROQ_MODEL)
        raw = _call_groq(user_message)
        result = _parse_json(raw)
        logger.info("✅  Groq responded successfully.")
        return result
    except Exception as exc:
        logger.error("❌  Groq also failed: %s", exc)
        raise RuntimeError(
            "Both Gemini and Groq failed to extract hackathon data."
        ) from exc


# ── Gemini call ───────────────────────────────────────────────────────────────

def _call_gemini(user_message: str, system_prompt: str = _SYSTEM_PROMPT) -> str:
    """Call the Gemini API via the google-genai SDK and return raw text."""
    from google import genai  # type: ignore[import]
    from google.genai import types  # type: ignore[import]

    client = genai.Client(api_key=GEMINI_API_KEY)

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=user_message,
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=0.2,         # low temperature = more deterministic JSON
            max_output_tokens=4096,
            response_mime_type="application/json",  # force JSON output mode
        ),
    )

    return response.text.strip()


# ── Groq call ─────────────────────────────────────────────────────────────────

def _call_groq(user_message: str, system_prompt: str = _SYSTEM_PROMPT) -> str:
    """Call the Groq API and return raw text."""
    from groq import Groq  # type: ignore[import]

    client = Groq(api_key=GROQ_API_KEY)

    completion = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_message},
        ],
        temperature=0.2,
        max_tokens=4096,
        response_format={"type": "json_object"},  # JSON mode
    )

    return completion.choices[0].message.content.strip()


# ── JSON parser / sanitiser ───────────────────────────────────────────────────

def _parse_json(raw: str) -> dict[str, Any]:
    """
    Parse the AI response as JSON.
    Strips accidental markdown fences before parsing.
    Raises ValueError on invalid JSON.
    """
    # Strip ```json ... ``` or ``` ... ``` fences just in case
    cleaned = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.MULTILINE)
    cleaned = re.sub(r"\s*```$", "", cleaned, flags=re.MULTILINE)
    cleaned = cleaned.strip()

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        logger.error("JSON parse error. Raw response:\n%s", raw)
        raise ValueError(f"AI returned invalid JSON: {exc}") from exc

    return _sanitise(data)


def _sanitise(data: dict[str, Any]) -> dict[str, Any]:
    """
    Ensure every expected key exists and has the right default type.
    This protects the frontend from missing fields.
    """
    str_fields = [
        "title", "description", "theme", "venue", "city", "country",
        "start_date", "end_date", "registration_deadline",
        "team_size_min", "team_size_max", "eligibility", "prize_pool",
        "contact_email", "contact_phone", "website",
    ]
    list_fields = ["tracks", "rules", "faqs", "sponsors"]

    for field in str_fields:
        if not isinstance(data.get(field), str):
            data[field] = str(data.get(field, "") or "")

    for field in list_fields:
        if not isinstance(data.get(field), list):
            data[field] = []

    return data
