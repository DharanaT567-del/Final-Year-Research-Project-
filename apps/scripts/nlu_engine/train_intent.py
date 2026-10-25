"""
Train the intent classifier and compare models.

Models compared:
  1. LinearSVC (calibrated) — primary
  2. Multinomial Naive Bayes
  3. Random Forest

Features: character n-grams (char_wb, 2-5) + word n-grams (1-2) via TF-IDF.

Usage:
    python train_intent.py
"""

import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline, make_union
from sklearn.svm import LinearSVC

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
MODEL_DIR = BASE_DIR / "models"
MODEL_DIR.mkdir(exist_ok=True)

# ─── Load dataset ────────────────────────────────────────────────
df = pd.read_csv(DATA_DIR / "intents.csv")
print(f"Dataset: {len(df)} examples, {df['intent'].nunique()} intents")
print(f"Intent distribution:\n{df['intent'].value_counts().to_string()}\n")

# ─── Train/test split ───────────────────────────────────────────
X_tr, X_te, y_tr, y_te = train_test_split(
    df["text"], df["intent"], test_size=0.2, stratify=df["intent"], random_state=42
)
print(f"Train: {len(X_tr)}, Test: {len(X_te)}\n")

# ─── Feature extraction ─────────────────────────────────────────
tfidf = make_union(
    TfidfVectorizer(
        analyzer="char_wb", ngram_range=(2, 5), sublinear_tf=True, max_features=30000
    ),
    TfidfVectorizer(
        analyzer="word", ngram_range=(1, 2), sublinear_tf=True, max_features=15000
    ),
)

# ─── Model definitions ──────────────────────────────────────────
models = {
    "LinearSVC": Pipeline([
        ("tfidf", tfidf),
        ("clf", CalibratedClassifierCV(LinearSVC(C=1.0, max_iter=5000), cv=5)),
    ]),
    "MultinomialNB": Pipeline([
        ("tfidf", make_union(
            TfidfVectorizer(
                analyzer="char_wb", ngram_range=(2, 5), sublinear_tf=True, max_features=30000
            ),
            TfidfVectorizer(
                analyzer="word", ngram_range=(1, 2), sublinear_tf=True, max_features=15000
            ),
        )),
        ("clf", MultinomialNB(alpha=0.1)),
    ]),
    "RandomForest": Pipeline([
        ("tfidf", make_union(
            TfidfVectorizer(
                analyzer="char_wb", ngram_range=(2, 5), sublinear_tf=True, max_features=30000
            ),
            TfidfVectorizer(
                analyzer="word", ngram_range=(1, 2), sublinear_tf=True, max_features=15000
            ),
        )),
        ("clf", RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=-1)),
    ]),
}

# ─── Train and evaluate ─────────────────────────────────────────
results = {}
best_model_name = None
best_f1 = 0.0

for name, pipe in models.items():
    print(f"{'='*60}")
    print(f"Training: {name}")
    print(f"{'='*60}")

    pipe.fit(X_tr, y_tr)
    pred = pipe.predict(X_te)

    report = classification_report(y_te, pred, digits=3, output_dict=True)
    report_str = classification_report(y_te, pred, digits=3)
    cm = confusion_matrix(y_te, pred)

    print(report_str)
    print(f"Confusion matrix:\n{cm}\n")

    # Cross-validation on full dataset
    cv_scores = cross_val_score(pipe, df["text"], df["intent"], cv=5, scoring="f1_macro")
    print(f"5-fold CV macro-F1: {cv_scores.mean():.3f} ± {cv_scores.std():.3f}\n")

    macro_f1 = report["macro avg"]["f1-score"]
    results[name] = {
        "macro_f1": macro_f1,
        "cv_f1_mean": float(cv_scores.mean()),
        "cv_f1_std": float(cv_scores.std()),
        "report": {k: v for k, v in report.items() if isinstance(v, dict)},
    }

    if macro_f1 > best_f1:
        best_f1 = macro_f1
        best_model_name = name

# ─── Save the best model ────────────────────────────────────────
print(f"\n{'='*60}")
print(f"Best model: {best_model_name} (macro-F1: {best_f1:.3f})")
print(f"{'='*60}")

best_pipe = models[best_model_name]
# Retrain on full dataset for production
best_pipe.fit(df["text"], df["intent"])
model_path = MODEL_DIR / "intent_model.joblib"
joblib.dump(best_pipe, model_path)
print(f"Saved to {model_path}")

# Save evaluation results
eval_path = MODEL_DIR / "evaluation_results.json"
eval_data = {
    "best_model": best_model_name,
    "best_macro_f1": best_f1,
    "dataset_size": len(df),
    "num_intents": df["intent"].nunique(),
    "intents": sorted(df["intent"].unique().tolist()),
    "model_results": results,
}
with open(eval_path, "w", encoding="utf-8") as f:
    json.dump(eval_data, f, indent=2, ensure_ascii=False)
print(f"Evaluation results saved to {eval_path}")
