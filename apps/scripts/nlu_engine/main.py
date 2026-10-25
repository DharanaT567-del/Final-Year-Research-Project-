"""
Naada NLU Tutor — FastAPI microservice.

Pipeline per request:
  1. Normalize the incoming text
  2. Try to extract a song entity (fuzzy match)
  3. Try to extract an artist / concept entity (if no song found)
  4. Mask the entity → "<SONG>" / "<ARTIST>" / "<CONCEPT>"
  5. Classify intent (+ confidence)
  6. Query dataset / glossary
  7. Fill a Sinhala/English template
  8. Return { reply, intent, confidence, entity }

Usage:
    uvicorn main:app --host 0.0.0.0 --port 8000
"""

import json
import logging
import re
import time
from pathlib import Path
from threading import Lock
from typing import Optional

import joblib
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel

from entity_extractor import (
    ArtistEntityExtractor,
    ConceptExtractor,
    SongEntityExtractor,
    normalize,
)
from responder import detect_language, respond

# ─── Logging ─────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nlu_engine")

# ─── Paths ───────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
MODEL_DIR = BASE_DIR / "models"

# ─── Locate Excel file ───────────────────────────────────────────
EXCEL_CANDIDATES = [
    DATA_DIR / "mathaka_sinhala_classical_songs (2).xlsx",
    BASE_DIR / ".." / ".." / "docs" / "mathaka_sinhala_classical_songs (2).xlsx",
]
EXCEL_PATH = None
for p in EXCEL_CANDIDATES:
    if p.exists():
        EXCEL_PATH = p
        break

if not EXCEL_PATH:
    raise FileNotFoundError("Could not locate mathaka_sinhala_classical_songs (2).xlsx")

# ─── Load resources at startup ───────────────────────────────────
CACHE_PATH = DATA_DIR / ".catalog_cache.pkl"
use_cache = CACHE_PATH.exists() and CACHE_PATH.stat().st_mtime >= EXCEL_PATH.stat().st_mtime

if use_cache:
    logger.info(f"Loading cached catalog from {CACHE_PATH}...")
    songs_df = pd.read_pickle(CACHE_PATH)
else:
    logger.info(f"Loading Excel dataset from {EXCEL_PATH} (both sheets)...")
    _sheet1 = pd.read_excel(EXCEL_PATH, sheet_name="Strict Classical Maestros")
    _sheet2 = pd.read_excel(EXCEL_PATH, sheet_name="Classical & Golden Era")
    logger.info(f"Sheet1: {len(_sheet1)} rows, Sheet2: {len(_sheet2)} rows")

    # Concat — Sheet1 first so its richer annotations are preferred on dedup
    songs_df = pd.concat([_sheet1, _sheet2], ignore_index=True)
    songs_df = songs_df.drop_duplicates(subset=["song_id"], keep="first")
    songs_df = songs_df.dropna(subset=["lyrics"])

    # Fill missing columns with safe defaults
    for col in ["song_title", "artist_name", "composer", "lyricist", "lyrics"]:
        if col in songs_df.columns:
            songs_df[col] = songs_df[col].fillna("")

    # Save to cache for sub-second future startup
    try:
        songs_df.to_pickle(CACHE_PATH)
    except Exception as e:
        logger.warning(f"Could not write catalog cache: {e}")

    del _sheet1, _sheet2  # free memory

logger.info(f"Merged & deduped: {len(songs_df)} unique songs")

curated_path = DATA_DIR / "curated_songs.json"
if curated_path.exists():
    curated_data = json.loads(curated_path.read_text(encoding="utf-8"))
    songs_df = pd.concat([pd.DataFrame(curated_data), songs_df], ignore_index=True)
    songs_df = songs_df.drop_duplicates(subset=["song_id"], keep="first")
logger.info(f"Final catalog: {len(songs_df)} songs (including curated)")

# Unified in-memory lookup dictionary indexed by song_id for O(1) response generation
songs_lookup: dict[str, pd.Series] = {str(row["song_id"]).strip(): row for _, row in songs_df.iterrows()}
logger.info(f"Indexed {len(songs_lookup)} songs in O(1) lookup dictionary")

logger.info("Loading glossary...")
glossary = json.loads((DATA_DIR / "glossary.json").read_text(encoding="utf-8"))

logger.info("Loading aliases...")
aliases_raw = json.loads((DATA_DIR / "aliases.json").read_text(encoding="utf-8"))
aliases = aliases_raw.get("aliases", aliases_raw)

logger.info("Loading intent model...")
model = joblib.load(MODEL_DIR / "intent_model.joblib")
logger.info(f"Model classes: {list(model.classes_)}")

# ─── Initialize extractors ──────────────────────────────────────
song_extractor = SongEntityExtractor(songs_df, aliases)
artist_extractor = ArtistEntityExtractor(songs_df)
concept_extractor = ConceptExtractor(glossary)

# ─── Session memory (last entity per user) ───────────────────────
_sessions: dict[str, dict] = {}  # userId -> {"song_id": ..., "ts": ...}
_sessions_lock = Lock()
SESSION_TTL = 600  # 10 minutes


def _get_last_entity(user_id: str) -> Optional[str]:
    """Get the last song_id for a user if within TTL."""
    with _sessions_lock:
        entry = _sessions.get(user_id)
        if entry and (time.time() - entry["ts"]) < SESSION_TTL:
            return entry["song_id"]
        return None


def _set_last_entity(user_id: str, song_id: str):
    """Save the last song_id for a user."""
    with _sessions_lock:
        _sessions[user_id] = {"song_id": song_id, "ts": time.time()}


# ─── Confidence threshold ───────────────────────────────────────
CONFIDENCE_THRESHOLD = 0.55

# Intents that require a song entity
SONG_ENTITY_INTENTS = {
    "Ask_Song_Meaning",
    "Ask_Song_Artist",
    "Ask_Composer",
    "Ask_Lyricist",
    "Ask_Song_Difficulty",
    "Ask_Song_Emotion",
    "Ask_Lyrics",
}

# ─── FastAPI app ─────────────────────────────────────────────────
app = FastAPI(
    title="Naada NLU Tutor",
    description="In-house NLU pipeline for Sinhala classical music education",
    version="1.0.0",
)


class ChatIn(BaseModel):
    message: str
    userId: str | None = None


class ChatOut(BaseModel):
    reply: str
    intent: str
    confidence: float
    entity: dict | None = None


@app.get("/health")
def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "songs_loaded": len(songs_df),
        "glossary_terms": len(glossary),
        "model_intents": list(model.classes_),
    }


@app.post("/api/v1/nlu/chat", response_model=ChatOut)
def chat(req: ChatIn):
    """Main NLU chat endpoint."""
    user_id = req.userId or "anonymous"
    raw_text = req.message.strip()

    if not raw_text:
        return ChatOut(
            reply="Please enter a question.",
            intent="Fallback",
            confidence=0.0,
            entity=None,
        )

    # 1. Try to extract song entity
    song_entity, masked_text = song_extractor.extract(raw_text)

    # 2. Try artist entity if no song found
    artist_entity = None
    concept_entity = None
    if not song_entity:
        artist_entity, masked_text_artist = artist_extractor.extract(raw_text)
        if artist_entity:
            masked_text = masked_text_artist
        else:
            # 3. Try concept entity
            concept_entity, masked_text_concept = concept_extractor.extract(raw_text)
            if concept_entity:
                masked_text = masked_text_concept

    # 4. Classify intent
    probs = model.predict_proba([masked_text])[0]
    intent = model.classes_[probs.argmax()]
    confidence = float(probs.max())

    # 4b. Contextual override for bare song names or generic "about this song" inquiries
    clean_residual = re.sub(r"<\w+>", "", masked_text).strip()
    filler_words = {
        "tell", "me", "about", "can", "you", "please", "song", "geethaya", "geethe",
        "gana", "kiyanna", "visthara", "wistara", "eka", "the", "a", "an", "oya",
        "danne", "mokakda", "monawada", "කියන්න", "ගැන", "විස්තර", "ගීතය", "ගීතයේ"
    }
    residual_words = [w for w in clean_residual.lower().split() if w not in filler_words]

    if song_entity:
        if len(residual_words) == 0:
            # Bare song name or generic "tell me about <SONG>"
            intent = "Ask_Song_Meaning"
            confidence = max(confidence, 0.95)
        elif confidence < CONFIDENCE_THRESHOLD:
            # Low classifier confidence, but we have a valid song entity
            intent = "Ask_Song_Meaning"
            confidence = 0.85

    logger.info(
        f"User [{user_id}]: '{raw_text}' -> entity={song_entity or artist_entity or concept_entity}, "
        f"intent={intent} ({confidence:.2f}), masked='{masked_text}'"
    )

    # 5. Low confidence → fallback
    if confidence < CONFIDENCE_THRESHOLD:
        lang = detect_language(raw_text)
        if lang == "si":
            fallback_reply = (
                "මට කණගාටුයි, ඔබගේ ප්‍රශ්නය මට හරියටම තේරුණේ නැත. 🤔\n\n"
                "ගීතයක තේරුම, ගායකයා, අපහසුතා මට්ටම, හෝ සංගීත සංකල්පයක් ගැන අහන්න උත්සාහ කරන්න."
            )
        else:
            fallback_reply = (
                "I'm not sure I understood. 🤔\n\n"
                "Try asking about a song's meaning, artist, or difficulty."
            )
        return ChatOut(
            reply=fallback_reply,
            intent="Fallback",
            confidence=confidence,
            entity=None,
        )

    # 6. Handle entity requirements
    song_row = None

    if intent in SONG_ENTITY_INTENTS:
        # Need a song entity
        if song_entity:
            # Look up the song row in O(1)
            song_row = songs_lookup.get(str(song_entity["song_id"]).strip())
            if song_row is not None:
                _set_last_entity(user_id, str(song_entity["song_id"]).strip())
        elif not song_entity:
            # Try session memory (follow-up question) in O(1)
            last_sid = _get_last_entity(user_id)
            if last_sid:
                song_row = songs_lookup.get(str(last_sid).strip())
                if song_row is not None:
                    song_entity = {"song_id": last_sid, "matched": "session", "score": 0}
            else:
                # Ask clarifying question
                lang = detect_language(raw_text)
                if lang == "si":
                    clarify = "ඔබ කුමන ගීතය ගැන අසන්නේද? ගීතයේ නම කියන්න. 🎵"
                else:
                    clarify = "Which song are you asking about? Please mention the song name. 🎵"
                return ChatOut(
                    reply=clarify,
                    intent=intent,
                    confidence=confidence,
                    entity=None,
                )

    # 7. Generate response
    reply = respond(
        intent=intent,
        user_text=raw_text,
        song_row=song_row,
        artist_name=artist_entity["artist"] if artist_entity else None,
        songs_df=songs_df,
        glossary=glossary,
        concept_key=concept_entity["concept"] if concept_entity else None,
    )

    # Build entity info for response
    entity_info = None
    if song_entity:
        entity_info = {"type": "song", **song_entity}
    elif artist_entity:
        entity_info = {"type": "artist", **artist_entity}
    elif concept_entity:
        entity_info = {"type": "concept", **concept_entity}

    return ChatOut(
        reply=reply,
        intent=intent,
        confidence=confidence,
        entity=entity_info,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
