# Naada NLU Tutor Engine

In-house NLU pipeline for the Naada AI Music Tutor. Replaces the Gemini API + Pinecone RAG approach with a deterministic, no-API-key solution.

## Architecture

```
User query
  │
  ├─► Normalize text (NFC, lowercase, strip ZWJ/ZWNJ)
  ├─► Extract entity (song title / artist / concept via fuzzy matching)
  ├─► Mask entity → "<SONG>" / "<ARTIST>" / "<CONCEPT>"
  ├─► Classify intent (TF-IDF + SVM, calibrated)
  ├─► Query dataset / glossary
  └─► Fill bilingual template (Sinhala / English)
       │
       ▼
  { reply, intent, confidence, entity }
```

## Intents

| Intent | Entity | Data Source |
|---|---|---|
| `Ask_Song_Meaning` | Song | normalized meaning column |
| `Ask_Song_Artist` | Song | artist_name |
| `Ask_Composer` | Song | composer |
| `Ask_Lyricist` | Song | lyricist |
| `Ask_Song_Difficulty` | Song | difficulty score |
| `Ask_Song_Emotion` | Song | emotion columns |
| `Ask_Lyrics` | Song | lyrics column |
| `Ask_Artist_Songs` | Artist | filter by artist |
| `Ask_Concept` | Concept | glossary.json |
| `Greeting` | None | static template |
| `Capabilities` | None | static template |
| `Out_Of_Scope` | None | static template |

## Setup

```bash
cd apps/scripts/nlu_engine

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or: venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Build training dataset
python build_dataset.py

# Train the intent classifier
python train_intent.py

# Run the service
uvicorn main:app --host 0.0.0.0 --port 8000
```

## API Reference

### `POST /api/v1/nlu/chat`

**Request:**
```json
{
  "message": "What is the meaning of කල්පනා ලොව මල් වනේ?",
  "userId": "user@example.com"
}
```

**Response:**
```json
{
  "reply": "🎵 The meaning of \"කල්පනා ලොව මල් වනේ\":\n\n...",
  "intent": "Ask_Song_Meaning",
  "confidence": 0.95,
  "entity": {
    "type": "song",
    "song_id": "28c00fff-...",
    "matched": "කල්පනා ලොව මල් වනේ",
    "score": 100
  }
}
```

### `GET /health`

Returns service status, loaded songs count, and model info.

## Retraining

1. Edit `data/templates_seed.json` to add/modify question templates
2. Run `python build_dataset.py` to regenerate `data/intents.csv`
3. Run `python train_intent.py` to retrain and compare models
4. The best model is saved to `models/intent_model.joblib`

## Evaluation

```bash
python evaluate.py
```

Runs intent classifier metrics, entity extractor accuracy, and end-to-end evaluation.

## Testing

```bash
python -m pytest tests/ -v
```
