"""
Build the intent classification training dataset from templates + song titles.

Generates ``data/intents.csv`` with columns: text, intent, source, language.
Each template's <SONG>/<ARTIST>/<CONCEPT> placeholder is expanded with a sample
of real song titles / artist names / glossary terms to produce diverse training
examples.  The final entity is masked back to the placeholder so the classifier
learns question *patterns*, not song *names*.

Usage:
    python build_dataset.py
"""

import csv
import json
import random
import re
from pathlib import Path

import pandas as pd

from entity_extractor import normalize

SEED = 42
random.seed(SEED)

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

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

# ─── Load resources ──────────────────────────────────────────────
templates = json.loads((DATA_DIR / "templates_seed.json").read_text(encoding="utf-8"))
glossary = json.loads((DATA_DIR / "glossary.json").read_text(encoding="utf-8"))

# Load BOTH Excel sheets and merge
_sheet1 = pd.read_excel(EXCEL_PATH, sheet_name="Strict Classical Maestros")
_sheet2 = pd.read_excel(EXCEL_PATH, sheet_name="Classical & Golden Era")
songs_df = pd.concat([_sheet1, _sheet2], ignore_index=True)
songs_df = songs_df.drop_duplicates(subset=["song_id"], keep="first")
songs_df = songs_df.dropna(subset=["lyrics"])

for col in ["song_title", "artist_name", "composer", "lyricist", "lyrics"]:
    if col in songs_df.columns:
        songs_df[col] = songs_df[col].fillna("")

print(f"Loaded {len(songs_df)} unique songs from both sheets")

curated_path = DATA_DIR / "curated_songs.json"
if curated_path.exists():
    curated_data = json.loads(curated_path.read_text(encoding="utf-8"))
    songs_df = pd.concat([pd.DataFrame(curated_data), songs_df], ignore_index=True)
    songs_df = songs_df.drop_duplicates(subset=["song_id"], keep="first")
del _sheet1, _sheet2

# Collect song titles and artist names
all_titles = [str(t) for t in songs_df["song_title"].dropna().unique()]
all_artists = [str(a) for a in songs_df["artist_name"].dropna().unique()]
concept_keys = list(glossary.keys())

# Sample titles for expansion (use a subset to keep dataset balanced)
SAMPLE_TITLES = random.sample(all_titles, min(50, len(all_titles)))
SAMPLE_ARTISTS = random.sample(all_artists, min(15, len(all_artists)))

# ─── Noise variants ─────────────────────────────────────────────

def add_typos(text: str) -> str:
    """Introduce random typos / missing chars for robustness."""
    if len(text) < 8 or random.random() > 0.3:
        return text
    idx = random.randint(1, len(text) - 2)
    op = random.choice(["drop", "swap", "double"])
    if op == "drop":
        return text[:idx] + text[idx + 1:]
    elif op == "swap" and idx < len(text) - 1:
        return text[:idx] + text[idx + 1] + text[idx] + text[idx + 2:]
    else:  # double
        return text[:idx] + text[idx] + text[idx:]


def strip_punctuation(text: str) -> str:
    """Remove punctuation (simulates informal typing)."""
    return re.sub(r"[?!.,;:\"'()]", "", text)


# ─── Generate rows ──────────────────────────────────────────────

rows: list[dict] = []

for intent, lang_templates in templates.items():
    if intent.startswith("_"):
        continue

    for lang, tpls in lang_templates.items():
        for tpl in tpls:
            # Determine which entities to expand
            if "<SONG>" in tpl:
                entities = SAMPLE_TITLES
                placeholder = "<SONG>"
            elif "<ARTIST>" in tpl:
                entities = SAMPLE_ARTISTS
                placeholder = "<ARTIST>"
            elif "<CONCEPT>" in tpl:
                entities = concept_keys
                placeholder = "<CONCEPT>"
            else:
                # No entity placeholder (Greeting, Capabilities, Out_Of_Scope)
                # Use template as-is
                rows.append({
                    "text": tpl,
                    "intent": intent,
                    "source": "template",
                    "language": lang,
                })
                # Add noise variant
                noisy = strip_punctuation(add_typos(tpl))
                if noisy != tpl:
                    rows.append({
                        "text": noisy,
                        "intent": intent,
                        "source": "template_noisy",
                        "language": lang,
                    })
                continue

            # Expand template with entities, then mask back to placeholder
            for entity in entities:
                filled = tpl.replace(placeholder, entity)
                # For training: we use the masked version
                masked = tpl  # already has <SONG>/<ARTIST>/<CONCEPT>

                rows.append({
                    "text": masked,
                    "intent": intent,
                    "source": "template",
                    "language": lang,
                })

                # Also add the filled version (normalized) for diversity
                rows.append({
                    "text": normalize(filled),
                    "intent": intent,
                    "source": "template_filled",
                    "language": lang,
                })

                # Noise variant of the filled version (masked)
                noisy = strip_punctuation(add_typos(masked))
                if noisy != masked:
                    rows.append({
                        "text": noisy,
                        "intent": intent,
                        "source": "template_noisy",
                        "language": lang,
                    })

# Deduplicate (text, intent) pairs
seen = set()
deduped = []
for row in rows:
    key = (row["text"], row["intent"])
    if key not in seen:
        seen.add(key)
        deduped.append(row)

# ─── Balance classes ─────────────────────────────────────────────
# Ensure each intent has a reasonable number of examples
from collections import Counter

intent_counts = Counter(r["intent"] for r in deduped)
print("Intent distribution:")
for intent, count in sorted(intent_counts.items()):
    print(f"  {intent}: {count}")

# ─── Write CSV ───────────────────────────────────────────────────
output_path = DATA_DIR / "intents.csv"
with open(output_path, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["text", "intent", "source", "language"])
    writer.writeheader()
    writer.writerows(deduped)

print(f"\nGenerated {len(deduped)} training examples -> {output_path}")
print(f"Intents: {len(intent_counts)}")
