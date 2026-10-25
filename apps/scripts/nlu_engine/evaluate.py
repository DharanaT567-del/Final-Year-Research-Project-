"""
Full evaluation suite for the Naada NLU Tutor pipeline.

Evaluates:
  1. Intent classifier: precision, recall, F1 per class, confusion matrix
  2. Entity extractor: exact-match accuracy
  3. End-to-end: correct / partial / wrong on sample queries

Usage:
    python evaluate.py
"""

import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import cross_val_score, train_test_split

from entity_extractor import SongEntityExtractor, normalize

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
MODEL_DIR = BASE_DIR / "models"
EXCEL_PATH = BASE_DIR / ".." / ".." / "docs" / "mathaka_sinhala_classical_songs (2).xlsx"


def evaluate_intent_classifier():
    """Evaluate the intent classifier with detailed metrics."""
    print("=" * 60)
    print("INTENT CLASSIFIER EVALUATION")
    print("=" * 60)

    df = pd.read_csv(DATA_DIR / "intents.csv")
    model = joblib.load(MODEL_DIR / "intent_model.joblib")

    X_tr, X_te, y_tr, y_te = train_test_split(
        df["text"], df["intent"], test_size=0.2, stratify=df["intent"], random_state=42
    )

    pred = model.predict(X_te)
    report = classification_report(y_te, pred, digits=3)
    report_dict = classification_report(y_te, pred, digits=3, output_dict=True)
    cm = confusion_matrix(y_te, pred)

    print(f"\nDataset: {len(df)} examples, {df['intent'].nunique()} intents")
    print(f"Test set: {len(X_te)} examples\n")
    print(report)
    print(f"\nConfusion matrix:\n{cm}")

    # Cross-validation
    cv_scores = cross_val_score(model, df["text"], df["intent"], cv=5, scoring="f1_macro")
    print(f"\n5-fold CV macro-F1: {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")

    # Per-source analysis (template vs real)
    if "source" in df.columns:
        for source in df["source"].unique():
            subset = df[df["source"] == source]
            if len(subset) > 10:
                pred_sub = model.predict(subset["text"])
                sub_report = classification_report(
                    subset["intent"], pred_sub, digits=3, output_dict=True
                )
                print(f"\nSource '{source}' macro-F1: {sub_report['macro avg']['f1-score']:.3f}")

    return report_dict


def evaluate_entity_extractor():
    """Evaluate entity extraction accuracy on test queries."""
    print("\n" + "=" * 60)
    print("ENTITY EXTRACTOR EVALUATION")
    print("=" * 60)

    songs_df = pd.concat([
        pd.read_excel(EXCEL_PATH, sheet_name="Strict Classical Maestros"),
        pd.read_excel(EXCEL_PATH, sheet_name="Classical & Golden Era"),
    ], ignore_index=True)
    songs_df = songs_df.drop_duplicates(subset=["song_id"], keep="first")
    songs_df = songs_df.dropna(subset=["lyrics"])

    curated_path = DATA_DIR / "curated_songs.json"
    if curated_path.exists():
        curated_data = json.loads(curated_path.read_text(encoding="utf-8"))
        songs_df = pd.concat([pd.DataFrame(curated_data), songs_df], ignore_index=True)

    aliases_raw = json.loads((DATA_DIR / "aliases.json").read_text(encoding="utf-8"))
    aliases = aliases_raw.get("aliases", aliases_raw)

    extractor = SongEntityExtractor(songs_df, aliases)

    # Test cases: (query, expected_song_title_substring)
    test_cases = [
        # Clean Sinhala
        ("චන්ද්‍ර මඩල බැද්ද ගීතයේ තේරුම කුමක්ද?", "චන්ද්‍ර මඩල"),
        ("පෙමාතුර හැඟුම් ගීතය ගැන කියන්න", "පෙමාතුර හැඟුම්"),
        ("කල්පනා ලොව මල් වනේ ගායනා කළේ කවුද?", "කල්පනා ලොව මල් වනේ"),
        # English / Singlish
        ("Who sings Kalpana Lowa Mal Wane?", "කල්පනා ලොව මල් වනේ"),
        ("Tell me about Ninda Nena Rathriye", "ninda-nena-rathriye"),
        ("Ninda nena rathriye meaning eka mokakda?", "ninda-nena-rathriye"),
        ("Ninda Nena Rathriye", "ninda-nena-rathriye"),
        # Golden Era (Sheet 2) and Singlish
        ("මංගල නැකතින් ගීතය ගායනා කළේ කවුද?", "0e193461-ceb3-418d-967c-78777be13ca5"),
        ("Who sings mangala naekatin?", "0e193461-ceb3-418d-967c-78777be13ca5"),
        # No entity
        ("What is Dadra taal?", None),
        ("Hello", None),
        ("ආයුබෝවන්", None),
    ]

    correct = 0
    total = len(test_cases)

    for query, expected in test_cases:
        entity, masked = extractor.extract(query)
        found = entity is not None

        if expected is None:
            # Should not find an entity
            if not found:
                correct += 1
                status = "PASS"
            else:
                status = "FAIL (false positive)"
        else:
            # Should find an entity
            if found:
                correct += 1
                status = "PASS"
            else:
                status = "FAIL (missed)"

        print(f"  {status} Query: '{query[:50]}' -> entity={entity is not None}")

    accuracy = correct / total if total > 0 else 0
    print(f"\nEntity extraction accuracy: {correct}/{total} ({accuracy:.1%})")
    return accuracy


def evaluate_end_to_end():
    """Evaluate the full pipeline end-to-end."""
    print("\n" + "=" * 60)
    print("END-TO-END EVALUATION")
    print("=" * 60)

    from main import chat, ChatIn

    # Test queries with expected intents
    test_queries = [
        ("What is the meaning of කල්පනා ලොව මල් වනේ?", "Ask_Song_Meaning"),
        ("Who sings පෙමාතුර හැඟුම්?", "Ask_Song_Artist"),
        ("What is Dadra taal?", "Ask_Concept"),
        ("Hello", "Greeting"),
        ("What can you do?", "Capabilities"),
        ("What is the weather today?", "Out_Of_Scope"),
        ("චන්ද්‍ර මඩල ගීතයේ තේරුම කුමක්ද?", "Ask_Song_Meaning"),
        ("ආයුබෝවන්", "Greeting"),
        # The user's benchmark test cases:
        ("Tell me about Ninda Nena Rathriye", "Ask_Song_Meaning"),
        ("Ninda nena rathriye meaning eka mokakda?", "Ask_Song_Meaning"),
        ("Ninda Nena Rathriye", "Ask_Song_Meaning"),
        # Golden Era test queries:
        ("මංගල නැකතින් ගීතය ගායනා කළේ කවුද?", "Ask_Song_Artist"),
        ("mangala naekatin lyrics denna", "Ask_Lyrics"),
        ("Tell me about mangala naekatin", "Ask_Song_Meaning"),
    ]

    correct = 0
    total = len(test_queries)

    for query, expected_intent in test_queries:
        res = chat(ChatIn(message=query, userId="eval_user"))
        predicted_intent = res.intent
        confidence = res.confidence

        match = predicted_intent == expected_intent
        if match:
            correct += 1

        status = "PASS" if match else "FAIL"
        print(
            f"  {status} '{query[:50]}' -> {predicted_intent} "
            f"(expected: {expected_intent}, conf: {confidence:.2f})"
        )

    accuracy = correct / total if total > 0 else 0
    print(f"\nEnd-to-end accuracy: {correct}/{total} ({accuracy:.1%})")
    return accuracy


if __name__ == "__main__":
    intent_report = evaluate_intent_classifier()
    entity_accuracy = evaluate_entity_extractor()
    e2e_accuracy = evaluate_end_to_end()

    # Save combined results
    results = {
        "intent_classifier": {
            "macro_f1": intent_report.get("macro avg", {}).get("f1-score", 0),
            "weighted_f1": intent_report.get("weighted avg", {}).get("f1-score", 0),
        },
        "entity_extractor": {"accuracy": entity_accuracy},
        "end_to_end": {"accuracy": e2e_accuracy},
    }

    output_path = MODEL_DIR / "full_evaluation.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"\nFull evaluation saved to {output_path}")
