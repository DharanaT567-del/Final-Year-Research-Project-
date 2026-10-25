"""
Unit tests for the NLU pipeline components.

Run with:  python -m pytest tests/test_pipeline.py -v
"""

import json
import sys
from pathlib import Path

import pytest

# Add parent dir to path for imports
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from entity_extractor import ConceptExtractor, SongEntityExtractor, normalize


# ── normalize() tests ────────────────────────────────────────────

class TestNormalize:
    def test_lowercase(self):
        assert normalize("Hello World") == "hello world"

    def test_strip_zwj(self):
        """Zero-width joiner should be removed."""
        assert "\u200d" not in normalize("චන්ද්\u200dර")

    def test_strip_zwnj(self):
        """Zero-width non-joiner should be removed."""
        assert "\u200c" not in normalize("test\u200cword")

    def test_nfc_normalization(self):
        """NFC normalization should produce consistent output."""
        result = normalize("test")
        assert result == "test"

    def test_collapse_whitespace(self):
        assert normalize("hello   world") == "hello world"

    def test_preserve_sinhala(self):
        """Sinhala characters should be preserved."""
        result = normalize("ආයුබෝවන්")
        assert "ආයුබෝවන" in result

    def test_remove_punctuation(self):
        result = normalize("What is this?!")
        assert "?" not in result
        assert "!" not in result


# ── SongEntityExtractor tests ────────────────────────────────────

class TestSongEntityExtractor:
    @pytest.fixture
    def sample_songs_df(self):
        import pandas as pd

        return pd.DataFrame({
            "song_id": ["id1", "id2", "id3"],
            "song_title": [
                "චන්ද්‍ර මඩල බැද්ද වටින් මෝදු වෙලා",
                "පෙමාතුර හැඟුම් ඇගේ නෙත් කැළුම්",
                "කල්පනා ලොව මල් වනේ",
            ],
        })

    @pytest.fixture
    def extractor(self, sample_songs_df):
        return SongEntityExtractor(sample_songs_df)

    def test_exact_match(self, extractor):
        entity, masked = extractor.extract("කල්පනා ලොව මල් වනේ ගීතයේ තේරුම කුමක්ද?")
        assert entity is not None
        assert entity["song_id"] == "id3"
        assert "<SONG>" in masked

    def test_no_match(self, extractor):
        entity, masked = extractor.extract("What is Dadra taal?")
        assert entity is None

    def test_fuzzy_match(self, extractor):
        entity, masked = extractor.extract("චන්ද්‍ර මඩල ගීතයේ තේරුම?")
        assert entity is not None
        assert entity["song_id"] == "id1"

    def test_short_query_no_false_positive(self, extractor):
        entity, masked = extractor.extract("hi")
        assert entity is None

    def test_extraction_latency_under_50ms(self, extractor):
        import time

        queries = [
            "චන්ද්‍ර මඩල ගීතයේ තේරුම?",
            "What is the meaning of this unknown query?",
            "hello",
        ]
        for q in queries:
            t0 = time.perf_counter()
            extractor.extract(q)
            lat_ms = (time.perf_counter() - t0) * 1000
            assert lat_ms < 50.0, f"Query '{q}' took {lat_ms:.2f}ms which exceeds 50ms"



# ── ConceptExtractor tests ───────────────────────────────────────

class TestConceptExtractor:
    @pytest.fixture
    def glossary(self):
        return {
            "dadra": {"en": "Dadra taal is a 6-beat cycle", "si": "දද්‍රා තාලය"},
            "raga": {"en": "A melodic framework", "si": "රාග"},
        }

    @pytest.fixture
    def extractor(self, glossary):
        return ConceptExtractor(glossary)

    def test_concept_match(self, extractor):
        entity, masked = extractor.extract("What is dadra?")
        assert entity is not None
        assert entity["concept"] == "dadra"
        assert "<CONCEPT>" in masked

    def test_no_match(self, extractor):
        entity, masked = extractor.extract("Hello")
        assert entity is None


# ── Responder tests ──────────────────────────────────────────────

class TestResponder:
    def test_detect_sinhala(self):
        from responder import detect_language

        assert detect_language("ආයුබෝවන්") == "si"
        assert detect_language("Hello") == "en"

    def test_greeting_response(self):
        from responder import respond

        reply = respond("Greeting", "Hello")
        assert "Ayubowan" in reply or "Naada" in reply

    def test_capabilities_response(self):
        from responder import respond

        reply = respond("Capabilities", "What can you do?")
        assert "song" in reply.lower() or "help" in reply.lower()

    def test_fallback_response(self):
        from responder import respond

        reply = respond("Fallback", "Something random")
        assert len(reply) > 0

    def test_sinhala_greeting(self):
        from responder import respond

        reply = respond("Greeting", "ආයුබෝවන්")
        assert "ආයුබෝවන්" in reply or "නාද" in reply

    def test_unannotated_song_fallback_sinhala(self):
        from responder import respond
        import pandas as pd

        unannotated_row = pd.Series({
            "song_id": "test-id-1",
            "song_title": "මංගල නැකතින් යන්නට",
            "artist_name": "මිල්ටන් මල්ලවාරච්චි",
            "lyrics": "මංගල නැකතින් යන්නට සූදානම් වන මේ මොහොතේ...",
        })
        reply = respond("Ask_Song_Meaning", "මංගල නැකතින් තේරුම මොකක්ද?", song_row=unannotated_row)
        assert "පද්යමය අර්ථ විවරණය තවමත් සකස් වෙමින් පවතී" in reply
        assert "මිල්ටන් මල්ලවාරච්චි" in reply

    def test_unannotated_song_fallback_english(self):
        from responder import respond
        import pandas as pd

        unannotated_row = pd.Series({
            "song_id": "test-id-2",
            "song_title": "Mangala Nakathin",
            "artist_name": "Milton Mallawarachchi",
            "lyrics": "Some lyrics...",
        })
        reply = respond("Ask_Song_Meaning", "What is the meaning of Mangala Nakathin?", song_row=unannotated_row)
        assert "detailed lyrical interpretation" in reply
        assert "Milton Mallawarachchi" in reply

    def test_lyrics_and_artist_always_work(self):
        from responder import respond
        import pandas as pd

        row = pd.Series({
            "song_id": "test-id-3",
            "song_title": "මංගල නැකතින් යන්නට",
            "artist_name": "මිල්ටන් මල්ලවාරච්චි",
            "lyrics": "මංගල නැකතින් යන්නට සූදානම්...",
        })
        artist_reply = respond("Ask_Song_Artist", "Who sings this?", song_row=row)
        lyrics_reply = respond("Ask_Lyrics", "Give me the lyrics", song_row=row)
        assert "මිල්ටන් මල්ලවාරච්චි" in artist_reply
        assert "මංගල නැකතින් යන්නට සූදානම්" in lyrics_reply


if __name__ == "__main__":
    pytest.main([__file__, "-v"])


