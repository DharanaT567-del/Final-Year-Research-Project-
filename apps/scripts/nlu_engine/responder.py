"""
Template-based response generator for the Naada NLU Tutor.

Generates bilingual (Sinhala / English) responses by filling templates
with data from the song dataset or glossary.
"""

import re

# Sinhala Unicode range detector
_SI = re.compile(r"[\u0D80-\u0DFF]")

# ─── Emotion mapping ────────────────────────────────────────────
EMOTION_COLS = {
    "Love": "Love (%)",
    "Happiness": "Happiness (%)",
    "Sadness": "Sadness (%)",
    "Anger": "Anger (%)",
    "Fear": "Fear (%)",
    "Calmness": "Calmness (%)",
}


def detect_language(text: str) -> str:
    """Detect if text is Sinhala ('si') or English ('en')."""
    return "si" if _SI.search(text) else "en"


def _get_difficulty_label(score) -> tuple[str, str]:
    """Convert numeric difficulty to bilingual label."""
    try:
        s = float(score)
    except (TypeError, ValueError):
        return "Unknown", "නොදනී"
    if s < 4:
        return "Beginner", "ආරම්භක"
    elif s < 7:
        return "Intermediate", "මධ්‍යම"
    else:
        return "Advanced", "උසස්"


def _get_dominant_emotion(row) -> tuple[str, int]:
    """Get the dominant emotion and its percentage from a song row."""
    max_emotion = "Unknown"
    max_pct = 0
    for emotion, col_suffix in EMOTION_COLS.items():
        # Column names in the Excel have expert prefix
        for col in row.index:
            if col_suffix in str(col):
                try:
                    pct = int(row[col])
                    if pct > max_pct:
                        max_pct = pct
                        max_emotion = emotion
                except (TypeError, ValueError):
                    continue
    return max_emotion, max_pct


# ─── Response templates ─────────────────────────────────────────
TEMPLATES = {
    "Ask_Song_Meaning": {
        "si": "🎵 \"{title}\" ගීතයේ සරල අර්ථය:\n\n{meaning}",
        "en": "🎵 The meaning of \"{title}\":\n\n{meaning}",
        "no_data_si": "මට කණගාටුයි, \"{title}\" ගීතයේ සරල අර්ථය දත්ත සමුදායේ නොමැත.",
        "no_data_en": "Sorry, I don't have the simplified meaning for \"{title}\" in my database.",
    },
    "Ask_Song_Artist": {
        "si": "🎤 \"{title}\" ගීතය ගායනා කළේ {artist}.",
        "en": "🎤 \"{title}\" is sung by {artist}.",
    },
    "Ask_Composer": {
        "si": "🎼 \"{title}\" ගීතය සංගීතවත් කළේ {composer}.",
        "en": "🎼 \"{title}\" was composed by {composer}.",
        "no_data_si": "මට කණගාටුයි, \"{title}\" ගීතයේ සංගීත අධ්‍යක්ෂක තොරතුරු දත්ත සමුදායේ නොමැත.",
        "no_data_en": "Sorry, I don't have the composer information for \"{title}\" in my database.",
    },
    "Ask_Lyricist": {
        "si": "✍️ \"{title}\" ගීතයේ පද ලියූයේ {lyricist}.",
        "en": "✍️ The lyrics of \"{title}\" were written by {lyricist}.",
        "no_data_si": "මට කණගාටුයි, \"{title}\" ගීතයේ ගීත රචක තොරතුරු දත්ත සමුදායේ නොමැත.",
        "no_data_en": "Sorry, I don't have the lyricist information for \"{title}\" in my database.",
    },
    "Ask_Song_Difficulty": {
        "si": "📊 \"{title}\" ගීතයේ අපහසුතා මට්ටම: {difficulty_label_si} ({difficulty_score}/10).\n\n{difficulty_detail_si}",
        "en": "📊 The difficulty level of \"{title}\": {difficulty_label_en} ({difficulty_score}/10).\n\n{difficulty_detail_en}",
    },
    "Ask_Song_Emotion": {
        "si": "💫 \"{title}\" ගීතයේ ප්‍රධාන හැඟීම: {emotion} ({emotion_pct}%).\n\n{emotion_detail}",
        "en": "💫 The dominant emotion of \"{title}\": {emotion} ({emotion_pct}%).\n\n{emotion_detail}",
    },
    "Ask_Lyrics": {
        "si": "📝 \"{title}\" ගීතයේ පද:\n\n{lyrics}",
        "en": "📝 Lyrics of \"{title}\":\n\n{lyrics}",
        "no_data_si": "මට කණගාටුයි, \"{title}\" ගීතයේ පද දත්ත සමුදායේ නොමැත.",
        "no_data_en": "Sorry, I don't have the lyrics for \"{title}\" in my database.",
    },
    "Ask_Artist_Songs": {
        "si": "🎵 {artist} ගායනා කළ ගීත:\n\n{song_list}",
        "en": "🎵 Songs by {artist}:\n\n{song_list}",
    },
    "Ask_Concept": {
        "si": "📚 {concept_answer}",
        "en": "📚 {concept_answer}",
    },
    "Greeting": {
        "si": "ආයුබෝවන්! 🙏 මම නාද AI ගුරුතුමා. සිංහල ශාස්ත්‍රීය සංගීතය, රාග, තාල, සහ ගීත පද අර්ථ විග්‍රහය ගැන මගෙන් ඕනෑම දෙයක් අහන්න!\n\n🎵 ගීතයක තේරුම, ගායකයා, අපහසුතා මට්ටම, හැඟීම් ගැන ඔබට මගෙන් දැනගන්න පුලුවන්.",
        "en": "Ayubowan! 🙏 I'm the Naada AI Tutor, specialized in Sinhala classical music, ragas, taals, and lyric interpretation.\n\n🎵 Ask me about any song's meaning, artist, difficulty level, or emotional tone!",
    },
    "Capabilities": {
        "si": "මට මේ දේවල් ගැන උදව් කරන්න පුලුවන් 🎶:\n\n"
             "• ගීතයක සරල අර්ථය (5,100+ ගීත)\n"
             "• ගායකයා, සංගීතකරු, ගීත රචකයා\n"
             "• ගීතයේ අපහසුතා මට්ටම\n"
             "• ගීතයේ ප්‍රධාන හැඟීම\n"
             "• ගීත පද\n"
             "• සංගීත සංකල්ප (තාල, රාග, වාද්‍ය භාණ්ඩ)\n\n"
             "ඕනෑම ගීතයක් ගැන අහන්න!",
        "en": "I can help you with 🎶:\n\n"
             "• Song meaning / lyric interpretation (5,100+ songs)\n"
             "• Singer, composer, lyricist information\n"
             "• Song difficulty level\n"
             "• Dominant emotion of a song\n"
             "• Song lyrics\n"
             "• Musical concepts (taals, ragas, instruments)\n\n"
             "Just ask about any song!",
    },
    "Fallback": {
        "si": "මට කණගාටුයි, ඔබගේ ප්‍රශ්නය මට හරියටම තේරුණේ නැත. 🤔\n\nගීතයක තේරුම, ගායකයා, අපහසුතා මට්ටම, හෝ සංගීත සංකල්පයක් ගැන අහන්න උත්සාහ කරන්න.",
        "en": "I'm not sure I understood your question. 🤔\n\nTry asking about a song's meaning, artist, difficulty, or a musical concept like Dadra taal.",
    },
    "Out_Of_Scope": {
        "si": "මට කණගාටුයි, එම ප්‍රශ්නයට මට පිළිතුරු දීමට නොහැක. 😊\n\nමම සිංහල ශාස්ත්‍රීය සංගීතය ගැන විශේෂඥයෙක්. ගීතයක් ගැන හෝ සංගීත සංකල්පයක් ගැන අහන්න!",
        "en": "Sorry, I can't answer that question. 😊\n\nI'm specialized in Sinhala classical music. Ask me about songs, artists, ragas, or taals!",
    },
}

# ─── Difficulty detail templates ─────────────────────────────────
DIFFICULTY_DETAILS = {
    "Beginner": {
        "en": "This is a beginner-friendly song, suitable for students starting their journey in Sinhala classical music.",
        "si": "මෙය ආරම්භක මට්ටමේ ගීතයකි. සිංහල ශාස්ත්‍රීය සංගීතය ඉගෙන ගැනීම ආරම්භ කරන ශිෂ්‍යයන්ට සුදුසුය.",
    },
    "Intermediate": {
        "en": "This is an intermediate-level song. It requires some familiarity with classical techniques and raga patterns.",
        "si": "මෙය මධ්‍යම මට්ටමේ ගීතයකි. ශාස්ත්‍රීය තාක්ෂණික ක්‍රම සහ රාග රටා පිළිබඳ යම් දැනුමක් අවශ්‍ය වේ.",
    },
    "Advanced": {
        "en": "This is an advanced song requiring mastery of classical vocal techniques, complex raga patterns, and precise taal control.",
        "si": "මෙය උසස් මට්ටමේ ගීතයකි. ශාස්ත්‍රීය ගායන ශිල්පීය ක්‍රම, සංකීර්ණ රාග රටා, සහ නිවැරදි තාල පාලනය අවශ්‍ය වේ.",
    },
}


def respond(
    intent: str,
    user_text: str,
    song_row=None,
    artist_name: str | None = None,
    songs_df=None,
    glossary: dict | None = None,
    concept_key: str | None = None,
) -> str:
    """Generate a template-based response for the given intent.

    Args:
        intent: Classified intent (e.g. "Ask_Song_Meaning").
        user_text: Original user query (for language detection).
        song_row: Pandas Series for the matched song (if applicable).
        artist_name: Matched artist name (for Ask_Artist_Songs).
        songs_df: Full songs DataFrame (for listing artist songs).
        glossary: Loaded glossary dict (for Ask_Concept).
        concept_key: Matched glossary key (for Ask_Concept).

    Returns:
        Response string in the appropriate language.
    """
    lang = detect_language(user_text)
    template_set = TEMPLATES.get(intent, TEMPLATES["Fallback"])

    # ── Static intents (no entity needed) ────────────────────────
    if intent in ("Greeting", "Capabilities", "Out_Of_Scope", "Fallback"):
        return template_set.get(lang, template_set.get("en", ""))

    # ── Ask_Concept ──────────────────────────────────────────────
    if intent == "Ask_Concept":
        if glossary and concept_key and concept_key in glossary:
            entry = glossary[concept_key]
            answer = entry.get(lang, entry.get("en", ""))
            return template_set[lang].format(concept_answer=answer)
        return TEMPLATES["Fallback"][lang]

    # ── Ask_Artist_Songs ─────────────────────────────────────────
    if intent == "Ask_Artist_Songs":
        if artist_name and songs_df is not None:
            artist_songs = songs_df[
                songs_df["artist_name"].str.strip() == artist_name.strip()
            ]["song_title"].tolist()
            if artist_songs:
                song_list = "\n".join(f"  • {t}" for t in artist_songs[:20])
                if len(artist_songs) > 20:
                    song_list += f"\n  ... and {len(artist_songs) - 20} more"
                return template_set[lang].format(artist=artist_name, song_list=song_list)
        return TEMPLATES["Fallback"][lang]

    # ── Song-specific intents ────────────────────────────────────
    if song_row is None:
        return TEMPLATES["Fallback"][lang]

    title = str(song_row.get("song_title", "Unknown")).strip()

    if intent == "Ask_Song_Meaning":
        # Find the normalized meaning or theme column
        meaning = None
        for key in ("meaning", "theme", "normalized_meaning"):
            val = song_row.get(key)
            if pd.notna(val) and str(val).strip():
                meaning = str(val).strip()
                break

        if not meaning:
            for col in song_row.index:
                if "normalization" in str(col).lower() or "sentence normalization" in str(col).lower():
                    val = song_row[col]
                    if pd.notna(val) and str(val).strip():
                        meaning = str(val).strip()
                        break

        if meaning:
            base_reply = template_set[lang].format(title=title, meaning=meaning)
            extra_lines = []
            artist = song_row.get("artist_name")
            if pd.notna(artist) and str(artist).strip() and str(artist).strip() != "Unknown":
                extra_lines.append(f"🎤 Artist: {artist}" if lang == "en" else f"🎤 ගායනය: {artist}")
            taal = song_row.get("taal")
            if pd.notna(taal) and str(taal).strip():
                extra_lines.append(f"🥁 Taal: {taal}" if lang == "en" else f"🥁 තාලය: {taal}")
            composer = song_row.get("composer")
            if pd.notna(composer) and str(composer).strip():
                extra_lines.append(f"🎼 Music: {composer}" if lang == "en" else f"🎼 සංගීතය: {composer}")
            lyricist = song_row.get("lyricist")
            if pd.notna(lyricist) and str(lyricist).strip():
                extra_lines.append(f"✍️ Lyrics: {lyricist}" if lang == "en" else f"✍️ රචනය: {lyricist}")
            diff = song_row.get("difficulty_score") or song_row.get("Shenal Bandara\nDifficulty (0–10)")
            if pd.notna(diff) and str(diff).strip():
                label_en, label_si = _get_difficulty_label(diff)
                extra_lines.append(f"📊 Level: {label_en} ({diff}/10)" if lang == "en" else f"📊 මට්ටම: {label_si} ({diff}/10)")

            if extra_lines:
                base_reply += "\n\n" + "\n".join(extra_lines)
            return base_reply

        # Graceful fallback for unannotated songs
        artist_val = song_row.get("artist_name")
        if pd.notna(artist_val) and str(artist_val).strip() and str(artist_val).strip() != "Unknown":
            artist_str = str(artist_val).strip()
        else:
            artist_str = "විශිෂ්ට ශිල්පීන්" if lang == "si" else "the artist"

        if lang == "si":
            return f"'{title}' ගීතයේ පද්යමය අර්ථ විවරණය තවමත් සකස් වෙමින් පවතී. කෙසේ වෙතත්, මෙහි ගායනය {artist_str} විසින් සිදු කර ඇති අතර සම්පූර්ණ පද මාලාව ලබාගත හැක."
        else:
            return f'The detailed lyrical interpretation for "{title}" is currently being annotated. However, it is performed by {artist_str}, and you can view its lyrics or explore related compositions.'

    elif intent == "Ask_Song_Artist":
        artist = song_row.get("artist_name")
        if pd.notna(artist) and str(artist).strip() and str(artist).strip() != "Unknown":
            return template_set[lang].format(title=title, artist=str(artist).strip())
        # Fallback for missing artist
        if lang == "si":
            return f"මට කණගාටුයි, \"{title}\" ගීතයේ ගායකයා පිළිබඳ තොරතුරු දත්ත සමුදායේ නොමැත."
        return f"Sorry, I don't have the artist information for \"{title}\" in my database."

    elif intent == "Ask_Composer":
        composer = song_row.get("composer")
        if pd.notna(composer) and str(composer).strip():
            return template_set[lang].format(title=title, composer=str(composer))
        no_data_key = f"no_data_{lang}"
        return template_set.get(no_data_key, template_set[lang]).format(title=title, composer="N/A")

    elif intent == "Ask_Lyricist":
        lyricist = song_row.get("lyricist")
        if pd.notna(lyricist) and str(lyricist).strip():
            return template_set[lang].format(title=title, lyricist=str(lyricist))
        no_data_key = f"no_data_{lang}"
        return template_set.get(no_data_key, template_set[lang]).format(title=title, lyricist="N/A")

    elif intent == "Ask_Song_Difficulty":
        # Find the difficulty column
        difficulty_score = None
        for col in song_row.index:
            if "Difficulty" in str(col) and "0" in str(col):
                val = song_row[col]
                try:
                    difficulty_score = float(val)
                    break
                except (TypeError, ValueError):
                    continue

        if difficulty_score is not None:
            label_en, label_si = _get_difficulty_label(difficulty_score)
            detail = DIFFICULTY_DETAILS.get(label_en, DIFFICULTY_DETAILS["Intermediate"])
            return template_set[lang].format(
                title=title,
                difficulty_label_en=label_en,
                difficulty_label_si=label_si,
                difficulty_score=difficulty_score,
                difficulty_detail_en=detail["en"],
                difficulty_detail_si=detail["si"],
            )
        return f"Sorry, difficulty data is not available for \"{title}\"."

    elif intent == "Ask_Song_Emotion":
        emotion, pct = _get_dominant_emotion(song_row)
        # Find the emotion detail from the check column
        emotion_detail = ""
        for col in song_row.index:
            if "total check" in str(col).lower() or "Emotion total check" in str(col):
                val = song_row[col]
                if pd.notna(val) and str(val).strip():
                    emotion_detail = str(val).strip()
                    break
        return template_set[lang].format(
            title=title,
            emotion=emotion,
            emotion_pct=pct,
            emotion_detail=emotion_detail if emotion_detail else "",
        )

    elif intent == "Ask_Lyrics":
        lyrics = song_row.get("lyrics")
        if pd.notna(lyrics) and str(lyrics).strip():
            lyrics_text = str(lyrics).strip()
            # Truncate very long lyrics
            if len(lyrics_text) > 1500:
                lyrics_text = lyrics_text[:1500] + "\n\n... (truncated)"
            return template_set[lang].format(title=title, lyrics=lyrics_text)
        no_data_key = f"no_data_{lang}"
        return template_set.get(no_data_key, template_set[lang]).format(title=title, lyrics="N/A")

    return TEMPLATES["Fallback"][lang]


# Need pandas import for pd.notna checks
import pandas as pd
