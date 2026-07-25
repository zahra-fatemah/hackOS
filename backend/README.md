# HackOS AI — Backend

Flask-based REST API powering **Feature 1: AI Hackathon Creation**.

---

## Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Web       | Flask + Flask-CORS                  |
| Database  | MongoDB Atlas (`pymongo`)           |
| AI (Primary) | Google Gemini (`google-genai`)   |
| AI (Fallback) | Groq (`groq`)                   |
| PDF       | `pdfplumber`                        |
| DOCX      | `python-docx`                       |
| Images    | `Pillow` + `pytesseract` (OCR)      |
| Env vars  | `python-dotenv`                     |

---

## Project Structure

```
backend/
├── app.py                  ← Flask entry-point & all routes
├── config.py               ← All config loaded from .env
├── requirements.txt
├── .env                    ← Your secrets (never commit!)
├── .gitignore
├── uploads/                ← Temporary file storage (auto-cleaned)
└── utils/
    ├── __init__.py
    ├── mongodb.py          ← MongoDB client + CRUD helpers
    ├── file_parser.py      ← PDF / DOCX / image text extraction
    ├── gemini_service.py   ← Gemini (primary) + Groq (fallback) AI
    └── validators.py       ← Request validation helpers
```

---

## Setup

### 1. Fill in `.env`

Open `backend/.env` and set your real API keys:

```env
GEMINI_API_KEY=AIza...
GROQ_API_KEY=gsk_...
```

MongoDB credentials are already pre-filled from your Atlas setup.

### 2. Install Tesseract OCR (for image files)

> **Skip this if you don't need image upload support.**

- **Windows**: Download from https://github.com/UB-Mannheim/tesseract/wiki  
  Install to `C:\Program Files\Tesseract-OCR\` and add to PATH.
- **macOS**: `brew install tesseract`
- **Linux**: `sudo apt install tesseract-ocr`

### 3. Create virtual environment & install packages

```bash
cd backend

# Create venv (already done if you ran setup)
python -m venv .venv

# Activate it
.venv\Scripts\activate          # Windows
source .venv/bin/activate       # macOS / Linux

# Install dependencies
pip install -r requirements.txt
```

### 4. Run the server

```bash
# Make sure venv is activated
python app.py
```

Server starts on **http://localhost:5000**

---

## API Reference

### `POST /api/upload-hackathon-file`

Upload a hackathon document for AI extraction.

**Request**: `multipart/form-data` with field `file`  
**Accepted types**: `.pdf`, `.docx`, `.png`, `.jpg`, `.jpeg`  
**Max size**: 10 MB

**Response**:
```json
{
  "success": true,
  "message": "Hackathon data extracted successfully.",
  "data": {
    "title": "...",
    "description": "...",
    "theme": "...",
    "venue": "...",
    "city": "...",
    "country": "...",
    "start_date": "...",
    "end_date": "...",
    "registration_deadline": "...",
    "team_size_min": "...",
    "team_size_max": "...",
    "eligibility": "...",
    "prize_pool": "...",
    "tracks": [],
    "rules": [],
    "faqs": [],
    "sponsors": [],
    "contact_email": "...",
    "contact_phone": "...",
    "website": "..."
  }
}
```

---

### `POST /api/create-hackathon`

Save an organizer-edited hackathon to MongoDB.

**Request**: `application/json` — the edited hackathon object  
**Required fields**: `title`, `description`, `start_date`, `end_date`, `registration_deadline`, `contact_email`

**Response**:
```json
{ "success": true, "message": "Hackathon published successfully!", "data": { "id": "<mongo_id>" } }
```

---

### `GET /api/hackathons`

Returns all hackathons, newest first.

---

### `GET /api/hackathon/<id>`

Returns a single hackathon by MongoDB ID.

---

### `DELETE /api/hackathon/<id>`

Deletes a hackathon by MongoDB ID.

---

### `GET /api/health`

Liveness probe: `{ "success": true, "data": { "status": "running" } }`

---

## Connecting to the React Frontend

The frontend runs on `http://localhost:5173` (Vite default).  
CORS is pre-configured to allow requests from:
- `http://localhost:3000`
- `http://localhost:5173`
- `http://localhost:4173`

In the frontend's `organizer.create.tsx`, replace the `startAi` mock timeout with:

```ts
const startAi = async (file: File) => {
  setProcessing(true);
  setMode("ai");
  
  const form = new FormData();
  form.append("file", file);
  
  try {
    const res = await fetch("http://localhost:5000/api/upload-hackathon-file", {
      method: "POST",
      body: form,
    });
    const json = await res.json();
    
    if (json.success) {
      setData(json.data);   // auto-fills all form fields
      setMode("review");
      toast.success("Draft ready", { description: "AI extracted fields from your document." });
    } else {
      toast.error("Extraction failed", { description: json.message });
      setMode("ai");
    }
  } catch {
    toast.error("Could not reach backend.");
    setMode("ai");
  } finally {
    setProcessing(false);
  }
};
```

And the Publish button:

```ts
const publish = async () => {
  const res = await fetch("http://localhost:5000/api/create-hackathon", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (json.success) toast.success("Hackathon published!");
  else toast.error(json.message);
};
```

---

## AI Fallback Logic

```
Upload → Extract Text → Gemini API
                              ↓ (fails for any reason)
                         Groq API
                              ↓ (also fails)
                         503 error returned to frontend
```

Both APIs are called with `response_format: json_object` / `response_mime_type: application/json`  
to guarantee structured output without markdown fences.
