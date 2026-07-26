"""
config.py — HackOS AI Backend
Centralised configuration loaded from .env via python-dotenv.
All other modules import from here; nothing is hardcoded.
"""

import os
from dotenv import load_dotenv

# Load .env from the same directory as this file
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"), override=True)


# ── MongoDB ───────────────────────────────────────────────────────────────────
MONGO_URI: str = os.environ["MONGO_URI"]          # raises KeyError if missing
MONGO_DB_NAME: str = os.getenv("MONGO_DB_NAME", "hackos_ai")

# ── Gemini (Primary AI) ───────────────────────────────────────────────────────
GEMINI_API_KEY: str = os.environ["GEMINI_API_KEY"]
GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

# ── Groq (Fallback AI) ────────────────────────────────────────────────────────
GROQ_API_KEY: str = os.environ["GROQ_API_KEY"]
GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

# ── Flask ─────────────────────────────────────────────────────────────────────
FLASK_ENV: str = os.getenv("FLASK_ENV", "production")
FLASK_DEBUG: bool = os.getenv("FLASK_DEBUG", "false").lower() == "true"
PORT: int = int(os.getenv("PORT", "5000"))

# ── Uploads ───────────────────────────────────────────────────────────────────
MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", "10"))
MAX_FILE_SIZE_BYTES: int = MAX_FILE_SIZE_MB * 1024 * 1024
UPLOAD_FOLDER: str = os.path.join(os.path.dirname(__file__), os.getenv("UPLOAD_FOLDER", "uploads"))
ALLOWED_EXTENSIONS: set[str] = {".pdf", ".docx", ".png", ".jpg", ".jpeg"}

# ── QR ────────────────────────────────────────────────────────────────────────
QR_SECRET: str = os.getenv("QR_SECRET", "default_insecure_secret_change_me")

# ── SMTP Auth ─────────────────────────────────────────────────────────────────
SMTP_SERVER: str = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME: str = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")


