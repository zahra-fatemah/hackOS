"""
utils/file_parser.py — HackOS AI Backend
Extract plain text from PDF, DOCX, and image files.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path

logger = logging.getLogger(__name__)


def extract_text(file_path: str) -> str:
    """
    Dispatch to the correct extractor based on file extension.
    Returns extracted plain text (may be empty string if nothing found).
    Raises ValueError for unsupported file types.
    """
    ext = Path(file_path).suffix.lower()

    dispatchers = {
        ".pdf":  _extract_pdf,
        ".docx": _extract_docx,
        ".png":  _extract_image,
        ".jpg":  _extract_image,
        ".jpeg": _extract_image,
    }

    handler = dispatchers.get(ext)
    if handler is None:
        raise ValueError(f"Unsupported file type: '{ext}'")

    logger.info("Extracting text from %s (type=%s)", file_path, ext)
    text = handler(file_path)
    logger.info("Extracted %d characters from %s", len(text), file_path)
    return text


# ── PDF ───────────────────────────────────────────────────────────────────────

def _extract_pdf(file_path: str) -> str:
    """Use pdfplumber to extract text from all pages."""
    import pdfplumber

    pages_text: list[str] = []
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                pages_text.append(page_text.strip())

    return "\n\n".join(pages_text)


# ── DOCX ──────────────────────────────────────────────────────────────────────

def _extract_docx(file_path: str) -> str:
    """Use python-docx to extract paragraph text from a .docx file."""
    from docx import Document  # type: ignore[import]

    doc = Document(file_path)
    paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
    return "\n\n".join(paragraphs)


# ── Images (OCR) ──────────────────────────────────────────────────────────────

def _extract_image(file_path: str) -> str:
    """
    Use Pillow + pytesseract to OCR text from PNG / JPG / JPEG.
    Tesseract must be installed and on PATH.
    Pre-processes the image (greyscale, contrast boost) for better accuracy.
    """
    from PIL import Image, ImageEnhance, ImageFilter
    import pytesseract

    image = Image.open(file_path)

    # ── Pre-processing: greyscale → sharpen → boost contrast ─────────────────
    image = image.convert("L")                           # greyscale
    image = image.filter(ImageFilter.SHARPEN)            # sharpen edges
    image = ImageEnhance.Contrast(image).enhance(2.0)    # boost contrast

    # OCR with a config that helps with structured documents / posters
    custom_config = r"--oem 3 --psm 6"
    text: str = pytesseract.image_to_string(image, config=custom_config)
    return text.strip()
