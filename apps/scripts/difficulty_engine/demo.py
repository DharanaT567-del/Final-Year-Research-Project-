"""Naada — AI-Based Song Difficulty Calculation Engine: Synthetic Data Demo
==========================================================================

This demonstration script generates realistic synthetic multi-modal feature
DataFrames mimicking the acoustic representations from ``feature_extraction.py``
(via librosa) and Sinhala lyrics NLP complexity metrics, and then executes the
complete machine learning training, evaluation, and artifact serialization pipeline.

Purpose
-------
Because raw audio recordings and proprietary annotated datasets may not be
checked into version control, this script provides a self-contained, reproducible
smoke test and validation harness for the end-to-end model training engine.

Usage
-----
From the module directory:
    $ python demo.py

With custom configuration:
    $ python demo.py --n-samples 1000 --output-dir models --seed 42

Programmatic invocation:
    >>> from apps.scripts.difficulty_engine.demo import run_demo
    >>> results = run_demo(n_samples=500, output_dir="models")
"""

import argparse
import logging
import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

import numpy as np
import pandas as pd

# ---------------------------------------------------------------------------
# Module path resolution & dynamic imports
# ---------------------------------------------------------------------------
_SCRIPT_DIR = Path(__file__).resolve().parent
if str(_SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(_SCRIPT_DIR))

# Repository root fallback for package-style execution
_REPO_ROOT = _SCRIPT_DIR.parents[2]
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

try:
    from training_pipeline import DifficultyModelPipeline
except ImportError:
    try:
        from apps.scripts.difficulty_engine.training_pipeline import (
            DifficultyModelPipeline,
        )
    except ImportError:
        DifficultyModelPipeline = None

logger = logging.getLogger("difficulty_engine.demo")


# ---------------------------------------------------------------------------
# Synthetic Data Generation
# ---------------------------------------------------------------------------
def generate_synthetic_audio_features(
    n_samples: int = 500, random_state: Optional[int] = 42
) -> pd.DataFrame:
    """Generate synthetic audio features mimicking librosa output.

    Synthesizes realistic distributions for 27 acoustic metrics spanning:
      - Rhythm & Tempo (BPM, stability, onset strength, complexity)
      - Timbral Spectral Moments (centroid, bandwidth, rolloff, zero-crossing)
      - Timbral Cepstrum (13 MFCC coefficients with decaying variance)
      - Harmonic & Pitch Dynamics (chroma entropy, f0 range, std, harmonic ratio, dynamic range)

    Parameters
    ----------
    n_samples : int, default=500
        Number of synthetic audio feature records to generate.
    random_state : Optional[int], default=42
        Seed for the NumPy pseudo-random number generator for reproducibility.

    Returns
    -------
    pd.DataFrame
        DataFrame of shape (n_samples, 27) containing numerical acoustic features.

    Raises
    ------
    ValueError
        If n_samples is not a positive integer.
    """
    if not isinstance(n_samples, int) or n_samples <= 0:
        raise ValueError(f"n_samples must be a positive integer, got {n_samples!r}")

    if random_state is not None:
        np.random.seed(random_state)

    data = {
        "tempo_bpm": np.random.uniform(60, 200, n_samples),
        "tempo_stability": np.random.exponential(0.05, n_samples),
        "avg_onset_strength": np.random.uniform(1, 15, n_samples),
        "rhythm_complexity": np.random.uniform(0.5, 8, n_samples),
        "spectral_centroid_mean": np.random.uniform(800, 4000, n_samples),
        "spectral_centroid_std": np.random.uniform(200, 1500, n_samples),
        "spectral_bandwidth_mean": np.random.uniform(1000, 4000, n_samples),
        "spectral_rolloff_mean": np.random.uniform(2000, 8000, n_samples),
        "zero_crossing_rate_mean": np.random.uniform(0.01, 0.2, n_samples),
    }

    # 13 Mel-Frequency Cepstral Coefficients (MFCCs)
    for i in range(1, 14):
        data[f"mfcc_{i}"] = np.random.normal(0, 20 - i, n_samples)

    data.update(
        {
            "chroma_entropy": np.random.uniform(2, 4, n_samples),
            "pitch_range_hz": np.random.uniform(50, 800, n_samples),
            "pitch_std_hz": np.random.uniform(10, 200, n_samples),
            "harmonic_ratio": np.random.uniform(0.3, 0.95, n_samples),
            "dynamic_range_db": np.random.uniform(5, 40, n_samples),
        }
    )

    df = pd.DataFrame(data)
    logger.debug(f"Generated synthetic audio DataFrame with shape {df.shape}")
    return df


def generate_synthetic_text_features(
    n_samples: int = 500, random_state: Optional[int] = 42
) -> pd.DataFrame:
    """Generate synthetic NLP features mimicking Sinhala lyrics analysis.

    Synthesizes realistic distributions for 12 linguistic complexity metrics:
      - Lexical Breadth (word count, unique word count, vocabulary richness)
      - Word Complexity (average word length, max word length)
      - Sentence Structure (sentence count, avg sentence length, longest sentence)
      - Orthography & Phonetics (hapax legomena ratio, syllable density, repetition, Yule's K)

    Parameters
    ----------
    n_samples : int, default=500
        Number of synthetic text feature records to generate.
    random_state : Optional[int], default=42
        Seed for the NumPy pseudo-random number generator for reproducibility.

    Returns
    -------
    pd.DataFrame
        DataFrame of shape (n_samples, 12) containing numerical NLP features.

    Raises
    ------
    ValueError
        If n_samples is not a positive integer.
    """
    if not isinstance(n_samples, int) or n_samples <= 0:
        raise ValueError(f"n_samples must be a positive integer, got {n_samples!r}")

    if random_state is not None:
        np.random.seed(random_state)

    word_counts = np.random.randint(20, 500, n_samples)
    unique_words = (
        word_counts * np.random.uniform(0.3, 0.95, n_samples)
    ).astype(int)

    data = {
        "word_count": word_counts,
        "unique_word_count": unique_words,
        "vocabulary_richness": unique_words / word_counts,
        "avg_word_length": np.random.uniform(3, 8, n_samples),
        "max_word_length": np.random.randint(5, 20, n_samples),
        "sentence_count": np.random.randint(5, 60, n_samples),
        "avg_sentence_length": np.random.uniform(3, 15, n_samples),
        "hapax_legomena_ratio": np.random.uniform(0.1, 0.7, n_samples),
        "syllable_density_estimate": np.random.uniform(1.2, 3.2, n_samples),
        "repetition_score": np.random.uniform(0.05, 0.7, n_samples),
        "longest_sentence_words": np.random.randint(8, 40, n_samples),
        "lexical_diversity_yules_k": np.random.uniform(50, 300, n_samples),
    }

    df = pd.DataFrame(data)
    logger.debug(f"Generated synthetic text DataFrame with shape {df.shape}")
    return df


def generate_synthetic_difficulty_scores(
    audio_df: pd.DataFrame,
    text_df: pd.DataFrame,
    n_samples: Optional[int] = 500,
    random_state: Optional[int] = 42,
) -> pd.Series:
    """Generate difficulty scores with realistic correlations to features.

    Difficulty is modeled as a composite pedagogical function:
      - Faster tempo (+20% weight)
      - Complex rhythmic subdivisions (+20% weight)
      - Wide vocal pitch range (+15% weight)
      - Elevated vocabulary richness (+25% weight)
      - Extended sentence / melodic phrase length (+20% weight)
      - Gaussian performance variation noise (sigma = 0.05)

    The composite value is scaled to the 0–100% pedagogical rating scale and clipped.

    Parameters
    ----------
    audio_df : pd.DataFrame
        DataFrame of extracted or synthetic audio features.
    text_df : pd.DataFrame
        DataFrame of extracted or synthetic text features.
    n_samples : Optional[int], default=500
        Number of samples. If None, derived from len(audio_df).
    random_state : Optional[int], default=42
        Seed for pseudo-random noise generation.

    Returns
    -------
    pd.Series
        Continuous difficulty target scores between 0.0% and 100.0%.

    Raises
    ------
    ValueError
        If inputs are not DataFrames, row counts mismatch, or required columns are absent.
    """
    if not isinstance(audio_df, pd.DataFrame) or not isinstance(text_df, pd.DataFrame):
        raise ValueError("audio_df and text_df must both be pandas DataFrames.")

    if len(audio_df) == 0 or len(text_df) == 0:
        raise ValueError("audio_df and text_df cannot be empty.")

    if len(audio_df) != len(text_df):
        raise ValueError(
            f"Row count mismatch: audio_df has {len(audio_df)} rows, "
            f"text_df has {len(text_df)} rows."
        )

    effective_n = n_samples if n_samples is not None else len(audio_df)
    if effective_n != len(audio_df):
        raise ValueError(
            f"Specified n_samples ({effective_n}) does not match DataFrame row count ({len(audio_df)})."
        )

    # Validate presence of correlation anchor columns
    required_audio = ["tempo_bpm", "rhythm_complexity", "pitch_range_hz"]
    missing_audio = [col for col in required_audio if col not in audio_df.columns]
    if missing_audio:
        raise KeyError(
            f"Missing required columns in audio_df for difficulty synthesis: {missing_audio}"
        )

    required_text = ["vocabulary_richness", "avg_sentence_length"]
    missing_text = [col for col in required_text if col not in text_df.columns]
    if missing_text:
        raise KeyError(
            f"Missing required columns in text_df for difficulty synthesis: {missing_text}"
        )

    if random_state is not None:
        np.random.seed(random_state)

    # Normalize key acoustic features to 0-1 range
    tempo_norm = (audio_df["tempo_bpm"] - 60.0) / 140.0
    rhythm_norm = (audio_df["rhythm_complexity"] - 0.5) / 7.5
    pitch_norm = (audio_df["pitch_range_hz"] - 50.0) / 750.0

    # Normalize text features (vocabulary_richness is naturally bounded ~0.3-0.95)
    vocab_norm = text_df["vocabulary_richness"]
    sent_len_norm = (text_df["avg_sentence_length"] - 3.0) / 12.0

    # Weighted combination + Gaussian stochastic noise
    difficulty = (
        0.20 * tempo_norm
        + 0.20 * rhythm_norm
        + 0.15 * pitch_norm
        + 0.25 * vocab_norm
        + 0.20 * sent_len_norm
        + np.random.normal(0, 0.05, effective_n)  # noise
    )

    # Clip and scale to 0-100%
    difficulty = np.clip(difficulty * 100.0, 0.0, 100.0)
    series = pd.Series(
        difficulty,
        index=audio_df.index,
        name="difficulty_score",
    )
    logger.debug(
        f"Generated difficulty scores: min={series.min():.2f}, "
        f"mean={series.mean():.2f}, max={series.max():.2f}"
    )
    return series


# ---------------------------------------------------------------------------
# Demonstration Runner
# ---------------------------------------------------------------------------
def run_demo(
    n_samples: int = 500,
    output_dir: Union[str, Path] = "models",
    random_state: int = 42,
    test_size: float = 0.2,
) -> Dict[str, Any]:
    """Execute the end-to-end difficulty model demonstration pipeline.

    Steps:
      1. Synthesize multi-modal acoustic and NLP feature DataFrames.
      2. Synthesize correlated continuous ground-truth difficulty scores.
      3. Instantiate and run DifficultyModelPipeline.
      4. Display diagnostic summary and exported model artifacts.

    Parameters
    ----------
    n_samples : int, default=500
        Number of synthetic song records to generate and train upon.
    output_dir : Union[str, Path], default='models'
        Target filesystem directory for exported model artifacts.
    random_state : int, default=42
        Reproducibility seed for data generation and model splitting.
    test_size : float, default=0.2
        Holdout proportion for evaluating model generalization.

    Returns
    -------
    Dict[str, Any]
        Results dictionary returned by DifficultyModelPipeline.run_full_pipeline,
        augmented with an 'exported_files' mapping.

    Raises
    ------
    ImportError
        If DifficultyModelPipeline cannot be imported from training_pipeline.py.
    RuntimeError
        If model training fails during execution.
    """
    if DifficultyModelPipeline is None:
        raise ImportError(
            "Could not import 'DifficultyModelPipeline' from 'training_pipeline'. "
            "Ensure that 'training_pipeline.py' is present in the difficulty_engine "
            f"directory ({_SCRIPT_DIR})."
        )

    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    print("=" * 70)
    print("  NAADA — AI-Based Song Difficulty Calculation Engine")
    print("  Synthetic Data Demo")
    print("=" * 70)
    print()

    # Step 1 & 2: Generate synthetic multi-modal data
    logger.info(f"Generating {n_samples} synthetic training observations...")
    audio_df = generate_synthetic_audio_features(
        n_samples=n_samples, random_state=random_state
    )
    text_df = generate_synthetic_text_features(
        n_samples=n_samples, random_state=random_state
    )
    difficulty_scores = generate_synthetic_difficulty_scores(
        audio_df=audio_df,
        text_df=text_df,
        n_samples=n_samples,
        random_state=random_state,
    )

    print(f"  Generated {n_samples} synthetic samples")
    print(f"  Audio features: {audio_df.shape[1]} columns")
    print(f"  Text features:  {text_df.shape[1]} columns")
    print(
        f"  Difficulty score range: {difficulty_scores.min():.1f}% – {difficulty_scores.max():.1f}%"
    )
    print(
        f"  Difficulty distribution: mean={difficulty_scores.mean():.1f}%, std={difficulty_scores.std():.1f}%"
    )
    print()

    # Step 3: Run full training pipeline
    logger.info(
        f"Initializing DifficultyModelPipeline(output_dir='{output_path}', "
        f"test_size={test_size}, random_state={random_state})..."
    )
    pipeline = DifficultyModelPipeline(
        random_state=random_state,
        test_size=test_size,
        output_dir=str(output_path),
    )

    demo_grid = {
        "n_estimators": [100, 200],
        "max_depth": [3, 5],
        "learning_rate": [0.05, 0.1],
        "subsample": [0.8],
        "colsample_bytree": [0.8],
        "reg_alpha": [0.0],
        "reg_lambda": [1.0],
    }

    try:
        results = pipeline.run_full_pipeline(
            audio_features_df=audio_df,
            text_features_df=text_df,
            difficulty_scores=difficulty_scores,
            param_grid=demo_grid,
        )
    except TypeError:
        # Fallback to alternate keyword arguments if implemented by variant pipeline
        logger.warning(
            "run_full_pipeline signature variant detected, falling back to alternative keywords."
        )
        results = pipeline.run_full_pipeline(
            audio_df=audio_df,
            text_df=text_df,
            target_scores=difficulty_scores,
        )
    except Exception as exc:
        logger.error(f"Pipeline execution encountered an error: {exc}", exc_info=True)
        raise RuntimeError(f"Pipeline execution failed: {exc}") from exc

    # Harmonize saved_paths / exported_files dictionary keys
    exported = results.get("exported_files") or results.get("saved_paths", {})
    if "exported_files" not in results and exported:
        results["exported_files"] = exported

    # Step 4: Display exported artifacts
    print()
    print("=" * 70)
    print("  Pipeline complete. Exported artifacts:")
    if exported:
        for name, path_str in exported.items():
            p = Path(path_str)
            if p.exists():
                size_kb = p.stat().st_size / 1024.0
                print(f"    • {name:20s}: {path_str} ({size_kb:.1f} KB)")
            else:
                print(f"    • {name:20s}: {path_str}")
    else:
        print("    (No files exported)")
    print("=" * 70)

    return results


# ---------------------------------------------------------------------------
# Command-Line Interface
# ---------------------------------------------------------------------------
def parse_args(args: Optional[List[str]] = None) -> argparse.Namespace:
    """Parse command line arguments for the demonstration script."""
    parser = argparse.ArgumentParser(
        description="NAADA — AI-Based Song Difficulty Calculation Engine Demo",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--n-samples",
        type=int,
        default=500,
        help="Number of synthetic song records to generate",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="models",
        help="Directory to save exported model artifacts and metadata",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Seed for reproducible data generation and model splitting",
    )
    parser.add_argument(
        "--test-size",
        type=float,
        default=0.2,
        help="Fraction of data withheld for model validation (0.0 to 1.0)",
    )
    parser.add_argument(
        "--log-level",
        type=str,
        default="INFO",
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
        help="Logging verbosity level",
    )
    return parser.parse_args(args)


def main(args: Optional[List[str]] = None) -> int:
    """Entry point for command-line execution."""
    parsed = parse_args(args)

    # Configure logging exactly as requested
    logging.basicConfig(
        level=getattr(logging, parsed.log_level.upper(), logging.INFO),
        format="%(asctime)s │ %(name)-30s │ %(levelname)-8s │ %(message)s",
        datefmt="%H:%M:%S",
    )

    try:
        run_demo(
            n_samples=parsed.n_samples,
            output_dir=parsed.output_dir,
            random_state=parsed.seed,
            test_size=parsed.test_size,
        )
        return 0
    except Exception as exc:
        logger.critical(f"Demo failed: {exc}", exc_info=True)
        print(f"\n[FATAL ERROR] Demonstration aborted: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
