# Naada AI Tutor: NLU Implementation Plan

**Goal:** Replace the API-key-based RAG tutor (Gemini + Pinecone + Spring AI) with an in-house NLU pipeline: an intent classifier, a song entity extractor and a template-based response generator. It is served by a FastAPI service and called by the existing Spring Boot gateway.

**Why:** No external API keys, no quotas or per-call cost, deterministic answers with no hallucination, and a measurable ML component (precision / recall / F1) for the final-year research.

---

## 1. Scope

### In scope
- Intent classification (scikit-learn: TF-IDF + SVM, compared against Naive Bayes and Random Forest)
- Song entity extraction (fuzzy matching against the song-title list)
- Template-based answers in Sinhala and English from the song dataset
- FastAPI NLU microservice, same pattern as `difficulty_engine`
- Spring Boot `TutorService` rewired to call the NLU service
- Evaluation suite and baseline comparison against the existing Gemini/RAG tutor

### Out of scope (state these as limitations in the report)
- Free-form generative answers
- Multi-turn reasoning beyond a simple "last entity" session memory
- Questions about data not in the dataset or glossary

### What stays unchanged
- `ChatController`, `ChatRequestDto`, `ChatResponseDto`
- Mobile app (`AiTutorScreen.js`, `axiosClient.js`): same endpoint `/api/v1/tutor/chat`, same `reply` field
- Firebase JWT authentication

---

## 2. Target Architecture

```
Mobile app (React Native)
   │  POST /api/v1/tutor/chat  { message }   + Firebase JWT
   ▼
Spring Boot API Gateway
   ChatController ──► TutorService ──► RestClient
   │                                        │ POST /api/v1/nlu/chat
   ▼                                        ▼
                         FastAPI NLU Service (apps/scripts/nlu_engine)
                           1. Normalize text
                           2. Extract song entity (fuzzy match)
                           3. Mask entity  -> "<SONG> ගීතයේ තේරුම කුමක්ද?"
                           4. Classify intent (+ confidence)
                           5. Query dataset / glossary
                           6. Fill Sinhala/English template
                           ▼
                         { reply, intent, confidence, entity }
```

**Design decision:** extract the entity first, mask it, then classify. The classifier learns question patterns instead of memorising song titles, so new songs need no retraining.

---

## 3. Intents

The responder can only answer what the data contains. The Excel sheet has: title, artist, composer, lyricist, lyrics, normalized meaning, difficulty and emotion scores. Taal and instruments are currently only in `classicalSongs.js`.

| Intent | Needs entity | Data source |
|---|---|---|
| `Ask_Song_Meaning` | Yes | normalized meaning column |
| `Ask_Song_Artist` | Yes | artist_name |
| `Ask_Composer` | Yes | composer |
| `Ask_Lyricist` | Yes | lyricist |
| `Ask_Song_Difficulty` | Yes | difficulty column (or XGBoost engine output) |
| `Ask_Song_Emotion` | Yes | dominant emotion |
| `Ask_Lyrics` | Yes | lyrics column |
| `Ask_Artist_Songs` | Artist | filter by artist |
| `Ask_Concept` | No (concept term) | `glossary.json` (e.g. Dadra taal) |
| `Greeting` | No | static |
| `Capabilities` | No | static |
| `Out_Of_Scope` / `Fallback` | No | static |

> Decision needed: add taal and instrument columns to the dataset, or put them in the glossary, if you want those questions answered.

---

## 4. Folder Structure

```
apps/scripts/nlu_engine/
├── data/
│   ├── intents.csv            # text,intent
│   ├── templates_seed.json    # question templates per intent and language
│   ├── glossary.json          # music concepts (taal, raga, instruments)
│   └── aliases.json           # alternative title spellings (Sinhala / Singlish)
├── build_dataset.py           # generates intents.csv
├── entity_extractor.py
├── train_intent.py
├── evaluate.py                # full evaluation + baseline comparison
├── responder.py
├── main.py                    # FastAPI app
├── models/
│   └── intent_model.joblib
├── tests/
│   └── test_pipeline.py
├── requirements.txt
└── README.md
```

`requirements.txt`:
```
scikit-learn>=1.3,<2
pandas>=2.0,<3
openpyxl>=3.1
rapidfuzz>=3.0
fastapi>=0.110
uvicorn>=0.27
joblib>=1.3
pydantic>=2
```

---

## 5. Phased Plan

Estimates assume one person working part-time alongside coursework. Adjust to your own deadlines.

### Phase 0: Decisions and setup (about 2 days)
- [ ] Confirm the intent list (Section 3)
- [ ] Decide where taal / instrument data comes from
- [ ] Create branch (e.g. `ashen-nlu-tutor`) and the `nlu_engine` folder
- [ ] Create a virtual environment and install `requirements.txt`
- [ ] Copy the Excel dataset path into config; confirm sheet name `Strict Classical Maestros`

**Done when:** folder exists, environment installs cleanly, the Excel file loads in a notebook.

### Phase 1: Data foundation (about 3 days)
- [ ] Load the Excel sheet; drop rows with empty lyrics; keep `song_id`, `song_title`, `artist_name`, `composer`, `lyricist`, `lyrics`, normalized meaning, difficulty, dominant emotion
- [ ] Compute the difficulty label (Beginner < 4, Intermediate < 7, Advanced) to match the existing ingestion logic
- [ ] Write `glossary.json` for the main concepts (Dadra, Keherwa, Rupak, raga, tanpura, tabla, sitar...)
- [ ] Start `aliases.json`: Sinhala and Singlish spellings for the most popular songs (note: the app and backend already spell some titles differently, e.g. "නින්ද නැති රැයේ" vs "නින්ද නේන රාත්‍රියේ")

**Done when:** a clean `songs` DataFrame is available and the glossary has at least 15 entries.

### Phase 2: Training dataset (about 1 week, the largest effort)
- [ ] Write 15–30 question templates per intent, in three styles: Sinhala, English, Singlish
- [ ] Use a `<SONG>` slot in the templates (the entity is masked at inference, so train on the placeholder)
- [ ] Collect **real student questions** (classmates, LILIT or school students): target at least 20–30 per intent. These are the most valuable examples and the most defensible in the report
- [ ] Add noise variants: typos, missing punctuation, mixed script
- [ ] Generate `intents.csv` with `build_dataset.py` (target 100–300 examples per intent)
- [ ] Tag each row with a `source` column (`template` or `real`) so you can report results on real questions separately

**Done when:** `intents.csv` has balanced classes and a held-out set of real questions that no template overlaps with.

### Phase 3: Entity extractor (about 3 days)
- [ ] Implement `normalize()`: NFC, lowercase, strip ZWJ/ZWNJ, remove punctuation (keep Sinhala range `\u0D80-\u0DFF`)
- [ ] Implement `SongEntityExtractor` with RapidFuzz + alias table
- [ ] Return `(entity, masked_text)`; return `None` when the score is below the cutoff
- [ ] Add artist and concept detection (artist names, glossary terms)
- [ ] Build a small labelled test set (about 100 queries with typos / Singlish / Sinhala) and measure accuracy

**Done when:** entity accuracy is measured and documented; failures are listed so the alias table can be improved.

### Phase 4: Intent classifier (about 4 days)
- [ ] Features: character n-grams (`char_wb`, 2–5) + word n-grams (1–2) TF-IDF
- [ ] Models: LinearSVC (calibrated), Multinomial Naive Bayes, Random Forest; optionally a small Keras dense network
- [ ] Stratified 80/20 split, 5-fold cross-validation
- [ ] Report precision, recall, F1 per class, macro-F1 and the confusion matrix
- [ ] Choose the best model; set the confidence threshold (start at 0.55, tune using the held-out real questions)
- [ ] Save with `joblib` to `models/intent_model.joblib`

**Done when:** the best model is saved, and metrics (including on the real-question subset) are in `evaluation_results.json`.

### Phase 5: Responder and FastAPI service (about 4 days)
- [ ] Implement `responder.py`: language detection (Sinhala Unicode range present, else English), one template per intent per language
- [ ] Handle edge cases: entity needed but missing (ask "Which song do you mean?"), entity not found, empty field in the dataset, low confidence (fallback message)
- [ ] Implement `main.py` with `POST /api/v1/nlu/chat` and `GET /health`
- [ ] Add simple session memory: keep the last entity per `userId` (in-memory dict with expiry) for follow-ups like "and its difficulty?"
- [ ] Load the Excel data and model once at startup

**Done when:** `uvicorn main:app --port 8000` answers every intent correctly via curl or Swagger UI.

### Phase 6: Spring Boot integration (about 2 days)
- [ ] Add property `nlu.service.url=http://localhost:8000`
- [ ] Rewrite `TutorService` to call the NLU service (Section 7); wrap connection errors in `IllegalStateException` so the existing 503 handler still works
- [ ] Optionally pass `userId` so the NLU service can keep session memory
- [ ] Remove Spring AI, Gemini and Pinecone dependencies and properties; remove `DataInitializer.java`
- [ ] Keep the old RAG code on a separate branch as the evaluation baseline

> Check the real Spring Boot version first. `RestClient` needs Boot 3.2+; on 3.1 use `RestTemplate`. `CLAUDE.md` says 3.1.1, but the Spring AI APIs in `TutorService` suggest a newer version.

**Done when:** the mobile app chat works end to end against the new service with no API keys configured.

### Phase 7: Evaluation and baseline comparison (about 1 week)
- [ ] Intent classifier: precision, recall, F1, confusion matrix, cross-validation
- [ ] Entity extractor: exact-match and top-1 accuracy, split by clean / typo / Singlish
- [ ] End-to-end: about 100 real questions scored as correct / partially correct / wrong
- [ ] Baseline: run the same question set through the Gemini/RAG tutor; compare accuracy, hallucination rate, latency, cost
- [ ] Error analysis: list the main failure categories and fixes

**Done when:** results tables and charts are ready for the report.

### Phase 8: Testing, deployment and documentation (about 4 days)
- [ ] Unit tests for `normalize`, entity extraction, each template, fallback paths
- [ ] Integration test: Spring Boot to FastAPI
- [ ] Docker or run script to start both services
- [ ] README in `nlu_engine/` with setup, retraining, and API reference
- [ ] Update `CLAUDE.md` (tutor architecture section, run instructions)

---

## 6. Key Code Skeletons

### 6.1 `entity_extractor.py`
```python
import re, unicodedata
from rapidfuzz import process, fuzz

def normalize(t: str) -> str:
    t = unicodedata.normalize("NFC", t).lower()
    t = t.replace("\u200d", "").replace("\u200c", "")
    t = re.sub(r"[^\w\s\u0D80-\u0DFF]", " ", t)
    return re.sub(r"\s+", " ", t).strip()

class SongEntityExtractor:
    def __init__(self, songs_df, aliases: dict | None = None):
        self.choices = {}
        for _, r in songs_df.iterrows():
            self.choices[normalize(r["song_title"])] = r["song_id"]
        for alias, sid in (aliases or {}).items():
            self.choices[normalize(alias)] = sid

    def extract(self, text: str, cutoff: int = 82):
        q = normalize(text)
        best = process.extractOne(q, self.choices.keys(),
                                  scorer=fuzz.partial_ratio, score_cutoff=cutoff)
        if not best or len(best[0]) < 4:
            return None, q
        title, score, _ = best
        masked = re.sub(re.escape(title), " <SONG> ", q) if title in q else q + " <SONG>"
        return {"song_id": self.choices[title], "matched": title, "score": score}, masked
```

### 6.2 `train_intent.py`
```python
import pandas as pd, joblib
from sklearn.pipeline import Pipeline, make_union
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix

df = pd.read_csv("data/intents.csv")
X_tr, X_te, y_tr, y_te = train_test_split(
    df.text, df.intent, test_size=0.2, stratify=df.intent, random_state=42)

pipe = Pipeline([
    ("tfidf", make_union(
        TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 5), sublinear_tf=True),
        TfidfVectorizer(analyzer="word", ngram_range=(1, 2), sublinear_tf=True))),
    ("clf", CalibratedClassifierCV(LinearSVC(C=1.0), cv=5)),
])
pipe.fit(X_tr, y_tr)

pred = pipe.predict(X_te)
print(classification_report(y_te, pred, digits=3))
print(confusion_matrix(y_te, pred))
joblib.dump(pipe, "models/intent_model.joblib")
```

### 6.3 `responder.py`
```python
import re
SI = re.compile(r"[\u0D80-\u0DFF]")

TEMPLATES = {
  "Ask_Song_Meaning": {
    "si": "{title} ගීතයේ සරල අර්ථය: {meaning}",
    "en": "The simple meaning of \"{title}\": {meaning}"},
  "Ask_Song_Artist": {
    "si": "{title} ගීතය ගායනා කළේ {artist}.",
    "en": "\"{title}\" is sung by {artist}."},
  # ... one entry per intent and language
}

def respond(intent: str, song_row: dict, user_text: str) -> str:
    lang = "si" if SI.search(user_text) else "en"
    return TEMPLATES[intent][lang].format(**song_row)
```

### 6.4 `main.py`
```python
from fastapi import FastAPI
from pydantic import BaseModel
import joblib, pandas as pd
from entity_extractor import SongEntityExtractor
from responder import respond

app = FastAPI(title="Naada NLU Tutor")
songs = pd.read_excel("../../docs/mathaka_sinhala_classical_songs (2).xlsx",
                      sheet_name="Strict Classical Maestros")
model = joblib.load("models/intent_model.joblib")
extractor = SongEntityExtractor(songs)
THRESHOLD = 0.55

class ChatIn(BaseModel):
    message: str
    userId: str | None = None

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/api/v1/nlu/chat")
def chat(req: ChatIn):
    entity, masked = extractor.extract(req.message)
    probs = model.predict_proba([masked])[0]
    intent, conf = model.classes_[probs.argmax()], float(probs.max())
    if conf < THRESHOLD:
        return {"reply": "I'm not sure I understood. Try asking about a song's meaning, artist or difficulty.",
                "intent": "Fallback", "confidence": conf, "entity": None}
    # 1. if the intent needs an entity and none was found -> ask a clarifying question
    # 2. look up the song row / glossary entry
    # 3. fill the template with respond(intent, row, req.message)
    ...
```

---

## 7. Spring Boot Changes

`TutorService.java`:
```java
@Service
public class TutorService {
    private final RestClient rest;

    public TutorService(@Value("${nlu.service.url:http://localhost:8000}") String baseUrl) {
        this.rest = RestClient.builder().baseUrl(baseUrl).build();
    }

    public ChatResponseDto askTutor(String userId, String message) {
        try {
            NluReply r = rest.post().uri("/api/v1/nlu/chat")
                .body(Map.of("message", message, "userId", userId))
                .retrieve().body(NluReply.class);
            return new ChatResponseDto(r.reply(), System.currentTimeMillis());
        } catch (RestClientException e) {
            throw new IllegalStateException("NLU service is unavailable", e);
        }
    }

    record NluReply(String reply, String intent, double confidence) {}
}
```

Cleanup checklist:
- [ ] Remove `spring-ai-*` dependencies from `pom.xml`
- [ ] Remove `GEMINI_API_KEY`, `PINECONE_*` properties from `application.properties`
- [ ] Delete `DataInitializer.java`
- [ ] Keep `ingest_songs.py` on the baseline branch only

---

## 8. Evaluation Plan

| What | Metric | Data |
|---|---|---|
| Intent classifier | Precision, recall, F1 (per class and macro), confusion matrix, 5-fold CV | Held-out split + real-question subset |
| Entity extractor | Exact-match and top-1 accuracy | About 100 labelled queries: clean, typo, Singlish, Sinhala |
| End-to-end | Correct / partial / wrong rate | About 100 real student questions |
| Baseline comparison | Accuracy, hallucination rate, latency, cost | Same question set run through Gemini/RAG |

**Avoid data leakage:** the same template phrasing must not appear in both the train and test sets. Report results on the real-question subset separately, because it is the honest number.

---

## 9. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Sinhala / Singlish spelling variants of titles | Entity not found | Alias table, fuzzy matching, clarifying question on failure |
| Template-only training data inflates the score | Weak research claim | Collect real student questions; report them separately |
| Imbalanced classes | Biased classifier | Class weights, balanced sampling |
| Missing fields in the dataset (taal, instruments) | Cannot answer some intents | Glossary or extra dataset columns; drop unsupported intents |
| Follow-up questions without a song name | Wrong or missing answer | Session memory for last entity |
| Out-of-domain questions | Wrong intent with high confidence | Include `Out_Of_Scope` training examples; tune the threshold |
| Spring Boot version mismatch (`RestClient`) | Build error | Check version; fall back to `RestTemplate` |
| NLU service down | Chat fails | Health check, clear 503 message already handled in `ChatController` |

---

## 10. Definition of Done

- [ ] Chat works end to end from the mobile app with no external AI API keys
- [ ] Intent macro-F1 and entity accuracy measured and documented
- [ ] Baseline comparison against the Gemini/RAG tutor completed
- [ ] Unit and integration tests pass
- [ ] README and `CLAUDE.md` updated
- [ ] Limitations section written (closed domain, no free-form generation, limited memory)

---

## 11. Suggested Report Outline

1. Problem statement and motivation (cost, hallucination, offline control)
2. Related work (RAG tutors, intent/slot NLU, Sinhala NLP)
3. System design (Section 2)
4. Dataset construction (templates + real questions + Singlish handling)
5. Models and training (feature extraction, model comparison)
6. Entity extraction and normalization for Sinhala
7. Integration with the Spring Boot gateway and mobile app
8. Evaluation and baseline comparison
9. Limitations and future work (sequence-labelling NER, embeddings, hybrid fallback to RAG for low-confidence queries)

---

## 12. Next Immediate Steps

1. Finalise the intent list and the data sources for taal / instruments
2. Create the branch and folder skeleton
3. Write `build_dataset.py` and the first template set
4. Start collecting real student questions in parallel (it takes the longest)
