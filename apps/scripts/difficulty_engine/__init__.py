"""
Naada — AI-Based Song Difficulty Calculation Engine
===================================================

This package provides a complete ML pipeline for predicting song learning
difficulty (0–100%) by fusing acoustic features extracted via librosa with
NLP metrics computed from Sinhala lyrics.

Modules
-------
feature_extraction
    AudioFeatureExtractor and TextFeatureExtractor classes for deriving
    numerical feature vectors from raw audio files and lyrics text.
training_pipeline
    DifficultyModelPipeline class that handles feature fusion, data
    preparation, model training (Random Forest baseline + XGBoost),
    evaluation, and model export.
demo
    Synthetic data demonstration that showcases the full pipeline
    without requiring real audio files.

Quick Start
-----------
    >>> from difficulty_engine.training_pipeline import DifficultyModelPipeline
    >>> pipeline = DifficultyModelPipeline()
    >>> results = pipeline.run_full_pipeline(audio_df, text_df, scores)
"""

__version__ = "1.0.0"
__author__ = "Naada Research Team"
