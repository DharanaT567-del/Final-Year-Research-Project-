"""
Entity extractor for the Naada NLU tutor.

Extracts song titles, artist names, and glossary concepts from user queries
using fuzzy matching (RapidFuzz), prefix-indexed dictionaries, and an alias table.

Design: extract the entity first, mask it, then classify the intent.
The classifier learns question patterns instead of memorising song titles,
so new songs need no retraining.
"""

import re
import unicodedata
from typing import Optional

from rapidfuzz import fuzz, process


# ─── Sinhala abugida transliteration components ──────────────────
_CONSONANTS = {
    "ක": "k", "ඛ": "kh", "ග": "g", "ඝ": "gh", "ඞ": "ng",
    "ච": "ch", "ඡ": "chh", "ජ": "j", "ඣ": "jh", "ඤ": "gn",
    "ට": "t", "ඨ": "th", "ඩ": "d", "ඪ": "dh", "ණ": "n",
    "ත": "t", "ථ": "th", "ද": "d", "ධ": "dh", "න": "n",
    "ප": "p", "ඵ": "ph", "බ": "b", "භ": "bh", "ම": "m",
    "ය": "y", "ර": "r", "ල": "l", "ව": "w", "ශ": "sh",
    "ෂ": "sh", "ස": "s", "හ": "h", "ළ": "l", "ෆ": "f",
    "ඟ": "ng", "ඦ": "nj", "ඬ": "nd", "ඳ": "nd", "ඹ": "mb",
}

_VOWELS_INDEP = {
    "අ": "a", "ආ": "aa", "ඇ": "ae", "ඈ": "aee", "ඉ": "i", "ඊ": "ee",
    "උ": "u", "ඌ": "oo", "ඍ": "ru", "එ": "e", "ඒ": "ee", "ඓ": "ai",
    "ඔ": "o", "ඕ": "oo", "ඖ": "au",
}

_VOWELS_DEP = {
    "ා": "a", "ැ": "ae", "ෑ": "aee", "ි": "i", "ී": "ee",
    "ු": "u", "ූ": "oo", "ෘ": "ru", "ෙ": "e", "ේ": "ee",
    "ෛ": "ai", "ො": "o", "ෝ": "oo", "ෞ": "au",
}

_VIRAMA = "්"
_SPECIAL = {"ං": "n", "ඃ": "h"}


def _transliterate_sinhala(text: str) -> str:
    """Convert Sinhala Unicode text to approximate Singlish romanization.

    Uses Sinhala abugida vowel-consonant rules (replaces inherent vowel 'a'
    when a dependent vowel sign or virama follows).
    """
    out = []
    i = 0
    n = len(text)
    while i < n:
        ch = text[i]
        if ch in _CONSONANTS:
            cons = _CONSONANTS[ch]
            if i + 1 < n:
                nxt = text[i + 1]
                if nxt == _VIRAMA:
                    out.append(cons)
                    i += 2
                    while i < n and text[i] in ("\u200d", "\u200c"):
                        i += 1
                    continue
                elif nxt in _VOWELS_DEP:
                    out.append(cons + _VOWELS_DEP[nxt])
                    i += 2
                    continue
            out.append(cons + "a")
            i += 1
        elif ch in _VOWELS_INDEP:
            out.append(_VOWELS_INDEP[ch])
            i += 1
        elif ch in _SPECIAL:
            out.append(_SPECIAL[ch])
            i += 1
        elif ch == " ":
            out.append(" ")
            i += 1
        elif ch.isascii():
            out.append(ch.lower())
            i += 1
        else:
            i += 1
    result = "".join(out)
    return re.sub(r"\s+", " ", result).strip()


def normalize(t: str) -> str:
    """Normalize Sinhala / Singlish text for matching.

    - NFC normalization
    - Lowercase
    - Strip ZWJ / ZWNJ (invisible joiners common in Sinhala Unicode)
    - Remove punctuation (preserve Sinhala range U+0D80–U+0DFF)
    - Collapse whitespace
    """
    t = unicodedata.normalize("NFC", t).lower()
    t = t.replace("\u200d", "").replace("\u200c", "")
    t = re.sub(r"[^\w\s\u0D80-\u0DFF]", " ", t)
    return re.sub(r"\s+", " ", t).strip()


COMMON_GREETINGS = {
    "hello", "hi", "hey", "ayubowan", "ආයුබෝවන්", "ආයුබොවන්",
    "subha dawasak", "good morning", "good evening", "good afternoon",
    "thank you", "thanks", "ස්තූතියි", "kohomada", "oya kawda", "who are you"
}


class SongEntityExtractor:
    """Extract a song entity from free-text queries using high-performance matching."""

    def __init__(self, songs_df, aliases: dict | None = None):
        """
        Args:
            songs_df: DataFrame with at least ``song_id`` and ``song_title`` columns.
            aliases: Mapping of alternative title spellings to song_id (or None).
        """
        # Map: normalized title / alias -> song_id
        self.choices: dict[str, str] = {}
        self.title_lookup: dict[str, str] = {}  # normalized -> original title
        # Prefix index: first word -> list of (normalized_title, song_id)
        self.prefix_index: dict[str, list[tuple[str, str]]] = {}

        _si_re = re.compile(r"[\u0D80-\u0DFF]")

        for _, row in songs_df.iterrows():
            raw_title = str(row.get("song_title", "")).strip()
            if not raw_title or raw_title == "nan":
                continue
            norm = normalize(raw_title)
            # Pre-filter titles shorter than 3 characters
            if len(norm) < 3:
                continue

            sid = str(row["song_id"]).strip()
            self.choices[norm] = sid
            self.title_lookup[norm] = raw_title

            # Index by first word
            tokens = norm.split()
            if tokens:
                self.prefix_index.setdefault(tokens[0], []).append((norm, sid))

            # Auto-generate Singlish (romanized) alias for Sinhala titles
            if _si_re.search(raw_title):
                singlish = _transliterate_sinhala(raw_title)
                singlish_norm = normalize(singlish)
                if singlish_norm and len(singlish_norm) >= 4 and singlish_norm not in self.choices:
                    self.choices[singlish_norm] = sid
                    self.title_lookup[singlish_norm] = raw_title
                    s_tokens = singlish_norm.split()
                    if s_tokens:
                        self.prefix_index.setdefault(s_tokens[0], []).append((singlish_norm, sid))

        # Add explicit aliases
        for alias, sid in (aliases or {}).items():
            if alias.startswith("_") or sid is None:
                continue
            norm_alias = normalize(str(alias))
            if len(norm_alias) < 3:
                continue

            sid_str = str(sid).strip()
            self.choices[norm_alias] = sid_str
            self.title_lookup[norm_alias] = str(alias)
            a_tokens = norm_alias.split()
            if a_tokens:
                self.prefix_index.setdefault(a_tokens[0], []).append((norm_alias, sid_str))

        # Pre-compute candidate title list for RapidFuzz
        self.candidate_titles: list[str] = list(self.choices.keys())

    def extract(
        self, text: str, cutoff: int = 75
    ) -> tuple[Optional[dict], str]:
        """Extract a song entity from text.

        Returns:
            Tuple of (entity_dict or None, masked_text).
            entity_dict has keys: song_id, matched, score, original_title.
        """
        q = normalize(text)
        if not q or q in COMMON_GREETINGS:
            return None, q

        # Guard: if query starts with or is dominated by common greetings
        words = q.split()
        if len(words) == 1 and words[0] in COMMON_GREETINGS:
            return None, q

        # 1. Exact match of entire query
        if q in self.choices:
            sid = self.choices[q]
            return {
                "song_id": sid,
                "matched": q,
                "score": 100,
                "original_title": self.title_lookup.get(q, q),
            }, "<SONG>"

        # 2. Sliding window exact n-gram matching (O(1) dictionary lookups)
        max_window = min(len(words), 8)
        for n in range(max_window, 0, -1):
            for i in range(len(words) - n + 1):
                window = " ".join(words[i : i + n])
                if len(window) >= 4 and window in self.choices:
                    sid = self.choices[window]
                    masked = q.replace(window, " <SONG> ", 1).strip()
                    masked = re.sub(r"\s+", " ", masked)
                    return {
                        "song_id": sid,
                        "matched": window,
                        "score": 100,
                        "original_title": self.title_lookup.get(window, window),
                    }, masked

        # 3. Fast prefix matching via prefix_index (O(1) first-token lookup)
        for i in range(len(words)):
            w0 = words[i]
            if w0 in self.prefix_index:
                candidates = self.prefix_index[w0]
                for n in range(min(len(words) - i, 8), 1, -1):
                    window = " ".join(words[i : i + n])
                    if len(window) >= 5:
                        for cand, sid in candidates:
                            if cand.startswith(window):
                                masked = q.replace(window, " <SONG> ", 1).strip()
                                masked = re.sub(r"\s+", " ", masked)
                                return {
                                    "song_id": sid,
                                    "matched": cand,
                                    "score": 95,
                                    "original_title": self.title_lookup.get(cand, cand),
                                }, masked

        # 4. Fuzzy fallback using token_set_ratio
        # RapidFuzz C++ token_set_ratio over candidate list finishes in <2ms
        cutoff_actual = max(cutoff, 80) if len(words) <= 2 else cutoff
        best = process.extractOne(
            q,
            self.candidate_titles,
            scorer=fuzz.token_set_ratio,
            score_cutoff=cutoff_actual,
        )
        if not best or len(best[0]) < 3:
            return None, q

        title, score, _ = best
        sid = self.choices[title]

        # Mask the matched entity
        if title in q:
            masked = q.replace(title, " <SONG> ", 1).strip()
        else:
            # Mask the best matching token overlap or append
            masked = q + " <SONG>"
        masked = re.sub(r"\s+", " ", masked)

        return {
            "song_id": sid,
            "matched": title,
            "score": score,
            "original_title": self.title_lookup.get(title, title),
        }, masked


class ArtistEntityExtractor:
    """Extract an artist name from free-text queries using fuzzy matching."""

    def __init__(self, songs_df):
        self.artists: dict[str, str] = {}  # normalized -> original
        self.prefix_index: dict[str, list[tuple[str, str]]] = {}

        for name in songs_df["artist_name"].dropna().unique():
            name_str = str(name).strip()
            norm = normalize(name_str)
            if norm and len(norm) >= 3:
                self.artists[norm] = name_str
                tokens = norm.split()
                if tokens:
                    self.prefix_index.setdefault(tokens[0], []).append((norm, name_str))

        self.artist_keys = list(self.artists.keys())

    def extract(
        self, text: str, cutoff: int = 80
    ) -> tuple[Optional[dict], str]:
        """Extract an artist entity from text."""
        q = normalize(text)
        if not q or q in COMMON_GREETINGS:
            return None, q

        words = q.split()

        # 1. Exact match / exact n-gram
        max_w = min(len(words), 6)
        for n in range(max_w, 0, -1):
            for i in range(len(words) - n + 1):
                window = " ".join(words[i : i + n])
                if len(window) >= 3 and window in self.artists:
                    orig = self.artists[window]
                    masked = q.replace(window, " <ARTIST> ", 1).strip()
                    masked = re.sub(r"\s+", " ", masked)
                    return {"artist": orig, "matched": window, "score": 100}, masked

        # 2. Prefix match
        for i in range(len(words)):
            w0 = words[i]
            if w0 in self.prefix_index:
                for norm_name, orig in self.prefix_index[w0]:
                    if norm_name in q:
                        masked = q.replace(norm_name, " <ARTIST> ", 1).strip()
                        masked = re.sub(r"\s+", " ", masked)
                        return {"artist": orig, "matched": norm_name, "score": 95}, masked

        # 3. Fuzzy match
        best = process.extractOne(
            q, self.artist_keys, scorer=fuzz.token_set_ratio, score_cutoff=cutoff
        )
        if not best or len(best[0]) < 3:
            return None, q

        name, score, _ = best
        original = self.artists[name]
        masked = q.replace(name, " <ARTIST> ", 1).strip() if name in q else q + " <ARTIST>"
        masked = re.sub(r"\s+", " ", masked)
        return {"artist": original, "matched": name, "score": score}, masked


class ConceptExtractor:
    """Extract a glossary concept from free-text queries."""

    def __init__(self, glossary: dict):
        self.concepts: dict[str, str] = {}  # normalized -> key
        for key in glossary:
            norm = normalize(key)
            if norm and len(norm) >= 3:
                self.concepts[norm] = key

        self.concept_keys = list(self.concepts.keys())

    def extract(
        self, text: str, cutoff: int = 80
    ) -> tuple[Optional[dict], str]:
        """Extract a concept entity from text."""
        q = normalize(text)
        if not q or q in COMMON_GREETINGS:
            return None, q

        words = q.split()

        # 1. Exact match / exact n-gram
        max_w = min(len(words), 5)
        for n in range(max_w, 0, -1):
            for i in range(len(words) - n + 1):
                window = " ".join(words[i : i + n])
                if len(window) >= 3 and window in self.concepts:
                    key = self.concepts[window]
                    masked = q.replace(window, " <CONCEPT> ", 1).strip()
                    masked = re.sub(r"\s+", " ", masked)
                    return {"concept": key, "matched": window, "score": 100}, masked

        # 2. Fuzzy
        best = process.extractOne(
            q, self.concept_keys, scorer=fuzz.token_set_ratio, score_cutoff=cutoff
        )
        if not best or len(best[0]) < 3:
            return None, q

        concept, score, _ = best
        key = self.concepts[concept]
        masked = q.replace(concept, " <CONCEPT> ", 1).strip() if concept in q else q + " <CONCEPT>"
        masked = re.sub(r"\s+", " ", masked)
        return {"concept": key, "matched": concept, "score": score}, masked
