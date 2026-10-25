"""
Automated Transliteration and Alias Expansion Utility.

Generates and maintains `data/aliases.json` by mapping:
  1. Exact Sinhala titles -> song_id
  2. Normalized Sinhala titles -> song_id
  3. Phonetic Singlish transliterations -> song_id
  4. Parenthesized English titles (e.g. from curated songs) -> song_id
  5. Preserves ALL existing manual overrides in `aliases.json`.

Usage:
    python build_aliases.py
"""

import json
import re
from pathlib import Path
import pandas as pd

from entity_extractor import normalize, _transliterate_sinhala

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

# Find Excel path
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


def simplify_singlish(text: str) -> str:
    """Produce simplified Singlish with single vowels and common phonetic variants."""
    t = text.lower()
    t = t.replace("ee", "e")
    t = t.replace("oo", "o")
    t = t.replace("aa", "a")
    t = t.replace("ae", "e")
    t = t.replace("th", "t")
    t = t.replace("sh", "s")
    t = re.sub(r"([a-z])\1+", r"\1", t)
    return re.sub(r"\s+", " ", t).strip()


def build_aliases():
    print(f"Loading Excel dataset from {EXCEL_PATH}...")
    _sheet1 = pd.read_excel(EXCEL_PATH, sheet_name="Strict Classical Maestros")
    _sheet2 = pd.read_excel(EXCEL_PATH, sheet_name="Classical & Golden Era")
    songs_df = pd.concat([_sheet1, _sheet2], ignore_index=True)
    songs_df = songs_df.drop_duplicates(subset=["song_id"], keep="first")
    songs_df = songs_df.dropna(subset=["lyrics"])

    curated_path = DATA_DIR / "curated_songs.json"
    if curated_path.exists():
        curated_data = json.loads(curated_path.read_text(encoding="utf-8"))
        songs_df = pd.concat([pd.DataFrame(curated_data), songs_df], ignore_index=True)
        songs_df = songs_df.drop_duplicates(subset=["song_id"], keep="first")

    print(f"Catalog has {len(songs_df)} unique songs.")

    # Load existing aliases to preserve manual overrides
    aliases_file = DATA_DIR / "aliases.json"
    existing_aliases = {}
    if aliases_file.exists():
        try:
            raw = json.loads(aliases_file.read_text(encoding="utf-8"))
            existing_aliases = raw.get("aliases", raw)
        except Exception as e:
            print(f"Warning reading existing aliases: {e}")

    # Build new alias mapping
    # Precedence: existing manual overrides come first!
    new_aliases: dict[str, str] = {}

    # Preserve all existing manual aliases (pre-normalized)
    for k, v in existing_aliases.items():
        if k.startswith("_"):
            continue
        if v is not None:
            norm_k = normalize(str(k))
            if norm_k and len(norm_k) >= 3:
                new_aliases[norm_k] = str(v)

    print(f"Preserved {len(new_aliases)} existing manual aliases.")

    _si_re = re.compile(r"[\u0D80-\u0DFF]")
    _paren_re = re.compile(r"\(([^)]+)\)")

    # Expand from all songs in catalog
    added_count = 0
    for _, row in songs_df.iterrows():
        sid = str(row["song_id"]).strip()
        raw_title = str(row["song_title"]).strip()
        if not raw_title or raw_title == "nan":
            continue

        norm_title = normalize(raw_title)
        if norm_title and len(norm_title) >= 3:
            if norm_title not in new_aliases:
                new_aliases[norm_title] = sid
                added_count += 1

        # Check for English parenthesized title, e.g. "නින්ද නේන රාත්‍රියේ (Ninda Nena Rathriye)"
        paren_match = _paren_re.search(raw_title)
        if paren_match:
            paren_title = paren_match.group(1).strip()
            norm_paren = normalize(paren_title)
            if norm_paren and len(norm_paren) >= 3 and norm_paren not in new_aliases:
                new_aliases[norm_paren] = sid
                added_count += 1
            # Also title before parenthesis
            main_part = _paren_re.sub("", raw_title).strip()
            norm_main = normalize(main_part)
            if norm_main and len(norm_main) >= 3 and norm_main not in new_aliases:
                new_aliases[norm_main] = sid
                added_count += 1

        # If Sinhala characters, generate transliterated Singlish aliases
        if _si_re.search(raw_title):
            clean_sinhala = _paren_re.sub("", raw_title).strip()
            singlish = _transliterate_sinhala(clean_sinhala)
            norm_singlish = normalize(singlish)
            if norm_singlish and len(norm_singlish) >= 4 and norm_singlish not in new_aliases:
                new_aliases[norm_singlish] = sid
                added_count += 1

            # Also simplified Singlish
            simple = simplify_singlish(norm_singlish)
            norm_simple = normalize(simple)
            if norm_simple and len(norm_simple) >= 4 and norm_simple not in new_aliases:
                new_aliases[norm_simple] = sid
                added_count += 1

    print(f"Total aliases after expansion: {len(new_aliases)} (+{added_count} generated)")

    output = {
        "_comment": "Maps alternative title spellings (Singlish, English transliteration, common misspellings) to song_id values from the Excel dataset or curated songs.",
        "aliases": dict(sorted(new_aliases.items())),
    }

    aliases_file.write_text(json.dumps(output, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Saved to {aliases_file}")


if __name__ == "__main__":
    build_aliases()
