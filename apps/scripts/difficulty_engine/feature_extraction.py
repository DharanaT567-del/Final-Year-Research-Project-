"""
Naada — Music Difficulty Engine: Feature Extraction Module
==========================================================

This module provides production-grade acoustic and linguistic feature extractors
tailored for predicting song learning difficulty in the Naada platform:

1. `AudioFeatureExtractor`:
   Extracts 27 multi-dimensional acoustic metrics from raw audio files (.wav, .mp3, etc.)
   using `librosa`, covering rhythmic stability, spectral brightness, timbral texture (MFCCs),
   harmonic complexity (chroma entropy), pitch range and modulation via pYIN, harmonic-to-percussive
   energy ratio, and dynamic dB headroom.

2. `TextFeatureExtractor`:
   Computes 12 lexical, structural, and diversity metrics from Sinhala lyrics,
   including word counts, vocabulary richness (TTR), average word lengths, sentence lengths,
   hapax legomena ratio, syllable density estimate, repetition score, and Yule's K
   characteristic metric of lexical diversity.
"""

from __future__ import annotations

import logging
import os
import re
from collections import Counter
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence, Union

import librosa
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

__all__ = [
    "AudioFeatureExtractor",
    "TextFeatureExtractor",
]


class AudioFeatureExtractor:
    """Extracts acoustic, rhythmic, timbral, and pitch features from audio files.

    Utilizes librosa to extract acoustic metrics for music difficulty modeling,
    including tempo, spectral characteristics, MFCCs, pitch range, and dynamic range.

    Attributes:
        sample_rate: Sampling rate used for audio processing (default: 22050 Hz).
        hop_length: Number of audio samples between successive analysis frames.
        n_mfcc: Number of Mel-Frequency Cepstral Coefficients to extract.
        fmin: Minimum fundamental frequency for pitch tracking (C2 ~ 65.4 Hz).
        fmax: Maximum fundamental frequency for pitch tracking (C7 ~ 2093.0 Hz).
    """

    FEATURE_NAMES: tuple[str, ...] = (
        "tempo_bpm",
        "tempo_stability",
        "avg_onset_strength",
        "rhythm_complexity",
        "spectral_centroid_mean",
        "spectral_centroid_std",
        "spectral_bandwidth_mean",
        "spectral_rolloff_mean",
        "zero_crossing_rate_mean",
        "mfcc_1",
        "mfcc_2",
        "mfcc_3",
        "mfcc_4",
        "mfcc_5",
        "mfcc_6",
        "mfcc_7",
        "mfcc_8",
        "mfcc_9",
        "mfcc_10",
        "mfcc_11",
        "mfcc_12",
        "mfcc_13",
        "chroma_entropy",
        "pitch_range_hz",
        "pitch_std_hz",
        "harmonic_ratio",
        "dynamic_range_db",
    )

    def __init__(
        self,
        sample_rate: int = 22050,
        hop_length: int = 512,
        n_mfcc: int = 13,
        fmin: float = 65.4,
        fmax: float = 2093.0,
    ) -> None:
        """Initialize the AudioFeatureExtractor.

        Args:
            sample_rate: Audio sampling rate (default: 22050).
            hop_length: Hop length in samples for STFT and frame analysis (default: 512).
            n_mfcc: Number of MFCC coefficients to calculate (default: 13).
            fmin: Lower pitch bound for librosa.pyin pitch tracking (default: 65.4 Hz).
            fmax: Upper pitch bound for librosa.pyin pitch tracking (default: 2093.0 Hz).
        """
        self.sample_rate = sample_rate
        self.sr = sample_rate  # Alias for convenience
        self.hop_length = hop_length
        self.n_mfcc = n_mfcc
        self.fmin = fmin
        self.fmax = fmax

    def _empty_features(self) -> Dict[str, float]:
        """Return a dictionary of zeroed acoustic features."""
        return {feat_name: 0.0 for feat_name in self.FEATURE_NAMES}

    def extract(self, audio_path: str) -> Dict[str, float]:
        """Extract acoustic features from a single audio file.

        Extracts 27 acoustic metrics:
        - `tempo_bpm`: estimated tempo
        - `tempo_stability`: std of beat intervals (lower = more stable)
        - `avg_onset_strength`: mean onset strength (rhythmic energy)
        - `rhythm_complexity`: std of onset strength envelope
        - `spectral_centroid_mean`: brightness
        - `spectral_centroid_std`: brightness variation
        - `spectral_bandwidth_mean`: tonal spread
        - `spectral_rolloff_mean`: high-frequency energy
        - `zero_crossing_rate_mean`: percussiveness
        - `mfcc_1` through `mfcc_13`: mean of first 13 MFCCs (timbral texture)
        - `chroma_entropy`: entropy of chroma features (harmonic complexity)
        - `pitch_range_hz`: range of detected fundamental frequencies using librosa.pyin
        - `pitch_std_hz`: std of detected pitches
        - `harmonic_ratio`: mean ratio of harmonic to percussive energy
        - `dynamic_range_db`: dB range between 95th and 5th percentile of RMS energy

        Args:
            audio_path: Path to the target audio file (.wav, .mp3, etc.).

        Returns:
            Dict[str, float]: Dictionary mapping feature names to numerical values.

        Raises:
            FileNotFoundError: If the specified audio file does not exist.
            ValueError: If the audio path is invalid or empty.
        """
        if not audio_path or not isinstance(audio_path, (str, Path)):
            raise ValueError(f"Invalid audio_path provided: {audio_path!r}")

        path_obj = Path(audio_path)
        if not path_obj.is_file():
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        logger.debug("Loading audio file for feature extraction: %s", path_obj)
        y, sr = librosa.load(str(path_obj), sr=self.sample_rate, mono=True)

        if y is None or len(y) == 0:
            logger.warning("Audio file '%s' is empty. Returning zeroed features.", audio_path)
            return self._empty_features()

        max_amplitude = np.max(np.abs(y))
        if max_amplitude < 1e-9:
            logger.warning("Audio file '%s' contains only silence. Returning zeroed features.", audio_path)
            return self._empty_features()

        features: Dict[str, float] = {}

        # ---------------------------------------------------------------------
        # 1. Rhythmic & Beat Features
        # ---------------------------------------------------------------------
        try:
            tempo, beat_frames = librosa.beat.beat_track(
                y=y,
                sr=self.sample_rate,
                hop_length=self.hop_length,
            )
            tempo_arr = np.atleast_1d(tempo)
            features["tempo_bpm"] = float(tempo_arr[0]) if tempo_arr.size > 0 else 0.0

            if len(beat_frames) >= 2:
                beat_times = librosa.frames_to_time(
                    beat_frames,
                    sr=self.sample_rate,
                    hop_length=self.hop_length,
                )
                intervals = np.diff(beat_times)
                features["tempo_stability"] = float(np.std(intervals)) if len(intervals) > 0 else 0.0
            else:
                features["tempo_stability"] = 0.0
        except Exception as tempo_exc:
            logger.debug("Tempo tracking fallback on '%s': %s", audio_path, tempo_exc)
            features["tempo_bpm"] = 0.0
            features["tempo_stability"] = 0.0

        # Onset strength envelope and rhythmic complexity
        try:
            onset_env = librosa.onset.onset_strength(
                y=y,
                sr=self.sample_rate,
                hop_length=self.hop_length,
            )
            features["avg_onset_strength"] = float(np.mean(onset_env)) if onset_env.size > 0 else 0.0
            features["rhythm_complexity"] = float(np.std(onset_env)) if onset_env.size > 0 else 0.0
        except Exception as onset_exc:
            logger.debug("Onset extraction error on '%s': %s", audio_path, onset_exc)
            features["avg_onset_strength"] = 0.0
            features["rhythm_complexity"] = 0.0

        # ---------------------------------------------------------------------
        # 2. Spectral Features & Brightness
        # ---------------------------------------------------------------------
        try:
            cent = librosa.feature.spectral_centroid(
                y=y,
                sr=self.sample_rate,
                hop_length=self.hop_length,
            )
            features["spectral_centroid_mean"] = float(np.mean(cent)) if cent.size > 0 else 0.0
            features["spectral_centroid_std"] = float(np.std(cent)) if cent.size > 0 else 0.0
        except Exception as cent_exc:
            logger.debug("Spectral centroid error on '%s': %s", audio_path, cent_exc)
            features["spectral_centroid_mean"] = 0.0
            features["spectral_centroid_std"] = 0.0

        try:
            bw = librosa.feature.spectral_bandwidth(
                y=y,
                sr=self.sample_rate,
                hop_length=self.hop_length,
            )
            features["spectral_bandwidth_mean"] = float(np.mean(bw)) if bw.size > 0 else 0.0
        except Exception as bw_exc:
            logger.debug("Spectral bandwidth error on '%s': %s", audio_path, bw_exc)
            features["spectral_bandwidth_mean"] = 0.0

        try:
            rolloff = librosa.feature.spectral_rolloff(
                y=y,
                sr=self.sample_rate,
                hop_length=self.hop_length,
            )
            features["spectral_rolloff_mean"] = float(np.mean(rolloff)) if rolloff.size > 0 else 0.0
        except Exception as rolloff_exc:
            logger.debug("Spectral rolloff error on '%s': %s", audio_path, rolloff_exc)
            features["spectral_rolloff_mean"] = 0.0

        try:
            zcr = librosa.feature.zero_crossing_rate(y=y, hop_length=self.hop_length)
            features["zero_crossing_rate_mean"] = float(np.mean(zcr)) if zcr.size > 0 else 0.0
        except Exception as zcr_exc:
            logger.debug("Zero crossing rate error on '%s': %s", audio_path, zcr_exc)
            features["zero_crossing_rate_mean"] = 0.0

        # ---------------------------------------------------------------------
        # 3. Timbral Texture (MFCC 1 to 13)
        # ---------------------------------------------------------------------
        try:
            mfcc = librosa.feature.mfcc(
                y=y,
                sr=self.sample_rate,
                n_mfcc=self.n_mfcc,
                hop_length=self.hop_length,
            )
            for i in range(1, 14):
                if mfcc.shape[0] >= i and mfcc.shape[1] > 0:
                    features[f"mfcc_{i}"] = float(np.mean(mfcc[i - 1]))
                else:
                    features[f"mfcc_{i}"] = 0.0
        except Exception as mfcc_exc:
            logger.debug("MFCC extraction error on '%s': %s", audio_path, mfcc_exc)
            for i in range(1, 14):
                features[f"mfcc_{i}"] = 0.0

        # ---------------------------------------------------------------------
        # 4. Harmonic Complexity: Chroma Entropy
        # ---------------------------------------------------------------------
        try:
            chroma = librosa.feature.chroma_stft(
                y=y,
                sr=self.sample_rate,
                hop_length=self.hop_length,
            )
            # Normalize each frame across 12 pitch classes to form a probability distribution
            col_sums = np.sum(chroma, axis=0, keepdims=True)
            nonzero_mask = (col_sums > 0).flatten()
            if np.any(nonzero_mask):
                p = chroma[:, nonzero_mask] / col_sums[:, nonzero_mask]
                p_safe = np.clip(p, 1e-12, 1.0)
                # Shannon entropy in bits (base 2)
                frame_entropies = -np.sum(p_safe * np.log2(p_safe), axis=0)
                features["chroma_entropy"] = float(np.mean(frame_entropies))
            else:
                features["chroma_entropy"] = 0.0
        except Exception as chroma_exc:
            logger.debug("Chroma entropy error on '%s': %s", audio_path, chroma_exc)
            features["chroma_entropy"] = 0.0

        # ---------------------------------------------------------------------
        # 5. Pitch Range & Std via librosa.pyin
        # ---------------------------------------------------------------------
        try:
            f0, voiced_flag, _ = librosa.pyin(
                y,
                fmin=self.fmin,
                fmax=self.fmax,
                sr=self.sample_rate,
                hop_length=self.hop_length,
            )
            if f0 is not None and voiced_flag is not None:
                valid_f0 = f0[voiced_flag & ~np.isnan(f0)]
                if len(valid_f0) > 0:
                    features["pitch_range_hz"] = float(np.max(valid_f0) - np.min(valid_f0))
                    features["pitch_std_hz"] = float(np.std(valid_f0))
                else:
                    features["pitch_range_hz"] = 0.0
                    features["pitch_std_hz"] = 0.0
            else:
                features["pitch_range_hz"] = 0.0
                features["pitch_std_hz"] = 0.0
        except Exception as pyin_exc:
            logger.debug("pYIN pitch tracking error on '%s': %s", audio_path, pyin_exc)
            features["pitch_range_hz"] = 0.0
            features["pitch_std_hz"] = 0.0

        # ---------------------------------------------------------------------
        # 6. Harmonic-to-Percussive Ratio (HPSS)
        # ---------------------------------------------------------------------
        try:
            y_harmonic, y_percussive = librosa.effects.hpss(y)
            harm_energy = float(np.mean(y_harmonic**2))
            perc_energy = float(np.mean(y_percussive**2))
            features["harmonic_ratio"] = float(harm_energy / (perc_energy + 1e-8))
        except Exception as hpss_exc:
            logger.debug("HPSS separation error on '%s': %s", audio_path, hpss_exc)
            features["harmonic_ratio"] = 0.0

        # ---------------------------------------------------------------------
        # 7. Dynamic Range (dB range between 95th and 5th percentile of RMS)
        # ---------------------------------------------------------------------
        try:
            rms = librosa.feature.rms(y=y, hop_length=self.hop_length)[0]
            if len(rms) > 0 and np.max(rms) > 0:
                rms_db = librosa.amplitude_to_db(rms, ref=np.max)
                p95 = float(np.percentile(rms_db, 95))
                p5 = float(np.percentile(rms_db, 5))
                features["dynamic_range_db"] = max(0.0, float(p95 - p5))
            else:
                features["dynamic_range_db"] = 0.0
        except Exception as rms_exc:
            logger.debug("RMS dynamic range error on '%s': %s", audio_path, rms_exc)
            features["dynamic_range_db"] = 0.0

        # Ensure all expected feature keys are present
        for key in self.FEATURE_NAMES:
            if key not in features:
                features[key] = 0.0

        return features

    def extract_batch(self, audio_paths: List[str]) -> pd.DataFrame:
        """Extract acoustic features for multiple audio files.

        Processes multiple audio files and returns a pandas DataFrame.
        Handles errors gracefully per file by logging a warning and skipping
        failed files without crashing the entire batch process.

        Args:
            audio_paths: Sequence of audio file paths.

        Returns:
            pd.DataFrame: DataFrame indexed by audio file paths, containing
            the 27 numerical acoustic features as columns.
        """
        records: List[Dict[str, float]] = []
        valid_indices: List[str] = []

        logger.info("Beginning batch audio extraction for %d files.", len(audio_paths))

        for path in audio_paths:
            try:
                feats = self.extract(str(path))
                records.append(feats)
                valid_indices.append(str(path))
            except Exception as exc:
                logger.warning(
                    "Skipping audio file '%s' due to extraction error: %s",
                    path,
                    exc,
                )
                continue

        if not records:
            logger.warning("No valid audio files were successfully processed.")
            empty_df = pd.DataFrame(columns=list(self.FEATURE_NAMES))
            empty_df.index.name = "audio_path"
            return empty_df

        df = pd.DataFrame(records, index=valid_indices)
        df.index.name = "audio_path"
        logger.info("Batch audio extraction completed. Extracted features for %d files.", len(df))
        return df

    def extract_directory(
        self,
        directory_path: Union[str, Path],
        extensions: Sequence[str] = (".wav", ".mp3", ".ogg", ".flac", ".m4a"),
        recursive: bool = True,
    ) -> pd.DataFrame:
        """Extract acoustic features for all audio tracks in a directory.

        Args:
            directory_path: Directory path containing audio files.
            extensions: Iterable of audio file extensions to include.
            recursive: If True, searches directory recursively.

        Returns:
            pd.DataFrame: DataFrame containing acoustic features for all matching files.
        """
        dir_path = Path(directory_path)
        if not dir_path.is_dir():
            raise NotADirectoryError(f"Directory not found: {directory_path}")

        ext_set = {ext.lower() if ext.startswith(".") else f".{ext.lower()}" for ext in extensions}
        glob_pattern = "**/*" if recursive else "*"
        audio_paths = [
            str(p)
            for p in dir_path.glob(glob_pattern)
            if p.is_file() and p.suffix.lower() in ext_set
        ]
        logger.info("Found %d audio files in '%s' matching %s", len(audio_paths), directory_path, ext_set)
        return self.extract_batch(audio_paths)


class TextFeatureExtractor:
    """Extracts lexical, structural, and diversity features from Sinhala lyrics.

    Computes 12 linguistic complexity metrics tailored for Sinhala vocal music
    difficulty assessment, including word counts, vocabulary richness, sentence lengths,
    hapax legomena, syllable density heuristics, and Yule's K diversity.
    """

    FEATURE_NAMES: tuple[str, ...] = (
        "word_count",
        "unique_word_count",
        "vocabulary_richness",
        "avg_word_length",
        "max_word_length",
        "sentence_count",
        "avg_sentence_length",
        "hapax_legomena_ratio",
        "syllable_density_estimate",
        "repetition_score",
        "longest_sentence_words",
        "lexical_diversity_yules_k",
    )

    # Sinhala sentence-ending punctuation: '.', '।', '?', '!', newlines
    SENTENCE_SPLIT_PATTERN: re.Pattern = re.compile(r"[\.।\?\!\r\n]+", re.UNICODE)

    # Punctuation delimiter characters for word extraction (preserves Sinhala letters and ZWJ)
    PUNCTUATION_PATTERN: re.Pattern = re.compile(
        r"[\.,!?;:\'\"“”‘’()\[\]{}\-—–/।॥෴\\<>*#@$%^&~`+=|_]+",
        re.UNICODE,
    )

    def __init__(self) -> None:
        """Initialize the TextFeatureExtractor."""
        pass

    def _empty_features(self) -> Dict[str, Union[int, float]]:
        """Return a dictionary of zeroed text features."""
        return {
            "word_count": 0,
            "unique_word_count": 0,
            "vocabulary_richness": 0.0,
            "avg_word_length": 0.0,
            "max_word_length": 0,
            "sentence_count": 0,
            "avg_sentence_length": 0.0,
            "hapax_legomena_ratio": 0.0,
            "syllable_density_estimate": 0.0,
            "repetition_score": 0.0,
            "longest_sentence_words": 0,
            "lexical_diversity_yules_k": 0.0,
        }

    def _tokenize_words(self, text: str) -> List[str]:
        """Tokenize text into cleaned words, stripping punctuation while preserving Sinhala characters.

        Args:
            text: Raw input text string.

        Returns:
            List[str]: List of non-empty cleaned word tokens.
        """
        if not text:
            return []
        # Replace punctuation characters with spaces, preserving Sinhala letters and ligatures
        cleaned = self.PUNCTUATION_PATTERN.sub(" ", text)
        return [w.strip() for w in cleaned.split() if w.strip()]

    def _split_sentences(self, text: str) -> List[List[str]]:
        """Split text into sentences based on Sinhala sentence punctuation and newlines.

        Args:
            text: Raw lyrics string.

        Returns:
            List[List[str]]: List of sentences, where each sentence is a list of word tokens.
        """
        if not text:
            return []

        raw_sentences = self.SENTENCE_SPLIT_PATTERN.split(text)
        sentences_words: List[List[str]] = []

        for segment in raw_sentences:
            s_words = self._tokenize_words(segment)
            if s_words:
                sentences_words.append(s_words)

        return sentences_words

    def extract(self, lyrics: str) -> Dict[str, Union[int, float]]:
        """Extract lexical and structural complexity features from Sinhala lyrics text.

        Computes:
        - `word_count`: total word count
        - `unique_word_count`: unique words
        - `vocabulary_richness`: unique/total ratio (type-token ratio)
        - `avg_word_length`: mean character length of words
        - `max_word_length`: longest word
        - `sentence_count`: number of sentences (split on Sinhala sentence-ending punctuation: '.', '।', '?', '!', newlines)
        - `avg_sentence_length`: words per sentence
        - `hapax_legomena_ratio`: ratio of words appearing exactly once
        - `syllable_density_estimate`: avg_word_length / 2.5 (Sinhala heuristic for syllables)
        - `repetition_score`: 1 - vocabulary_richness (how repetitive the lyrics are)
        - `longest_sentence_words`: word count of longest sentence
        - `lexical_diversity_yules_k`: Yule's K measure of vocabulary diversity

        Args:
            lyrics: Sinhala lyrics string.

        Returns:
            Dict[str, Union[int, float]]: Dictionary mapping feature names to metrics.
        """
        if lyrics is None or not isinstance(lyrics, str):
            logger.warning(
                "Invalid lyrics input (type: %s). Returning zeroed text features.",
                type(lyrics).__name__,
            )
            return self._empty_features()

        cleaned_text = lyrics.strip()
        if not cleaned_text:
            logger.debug("Empty lyrics text provided. Returning zeroed text features.")
            return self._empty_features()

        words = self._tokenize_words(cleaned_text)
        word_count = len(words)

        if word_count == 0:
            return self._empty_features()

        unique_word_set = set(words)
        unique_word_count = len(unique_word_set)
        vocabulary_richness = float(unique_word_count / word_count)

        word_lengths = [len(w) for w in words]
        avg_word_length = float(np.mean(word_lengths))
        max_word_length = int(max(word_lengths))

        # Sentence analysis
        sentences = self._split_sentences(cleaned_text)
        sentence_count = len(sentences)

        if sentence_count > 0:
            sentence_lengths = [len(s) for s in sentences]
            avg_sentence_length = float(np.mean(sentence_lengths))
            longest_sentence_words = int(max(sentence_lengths))
        else:
            # Fallback if no sentence boundaries detected but words exist
            sentence_count = 1
            avg_sentence_length = float(word_count)
            longest_sentence_words = int(word_count)

        # Word frequency distribution
        word_freq = Counter(words)
        hapax_count = sum(1 for count in word_freq.values() if count == 1)
        hapax_legomena_ratio = float(hapax_count / word_count)

        # Syllable density estimate: avg_word_length / 2.5 (Sinhala heuristic)
        syllable_density_estimate = float(avg_word_length / 2.5)

        # Repetition score: 1 - vocabulary_richness
        repetition_score = max(0.0, float(1.0 - vocabulary_richness))

        # Yule's K characteristic of vocabulary diversity
        # Formula: K = 10^4 * (S2 - S1) / (S1^2), where S1 = N, S2 = sum(f_i^2)
        s1 = float(word_count)
        s2 = float(sum(f**2 for f in word_freq.values()))
        if s1 > 0:
            yules_k = 10000.0 * (s2 - s1) / (s1**2)
            lexical_diversity_yules_k = max(0.0, float(yules_k))
        else:
            lexical_diversity_yules_k = 0.0

        return {
            "word_count": int(word_count),
            "unique_word_count": int(unique_word_count),
            "vocabulary_richness": float(vocabulary_richness),
            "avg_word_length": float(avg_word_length),
            "max_word_length": int(max_word_length),
            "sentence_count": int(sentence_count),
            "avg_sentence_length": float(avg_sentence_length),
            "hapax_legomena_ratio": float(hapax_legomena_ratio),
            "syllable_density_estimate": float(syllable_density_estimate),
            "repetition_score": float(repetition_score),
            "longest_sentence_words": int(longest_sentence_words),
            "lexical_diversity_yules_k": float(lexical_diversity_yules_k),
        }

    def extract_batch(self, lyrics_list: List[str]) -> pd.DataFrame:
        """Extract text features for a sequence of Sinhala lyrics strings.

        Args:
            lyrics_list: List of lyrics strings.

        Returns:
            pd.DataFrame: DataFrame containing 12 text feature columns,
            preserving 1-to-1 row correspondence with input lyrics.
        """
        records: List[Dict[str, Union[int, float]]] = []

        logger.info("Beginning batch text feature extraction for %d lyrics items.", len(lyrics_list))

        for idx, lyrics in enumerate(lyrics_list):
            try:
                feats = self.extract(lyrics)
                records.append(feats)
            except Exception as exc:
                logger.warning(
                    "Error processing lyrics at index %d: %s. Using default zero features.",
                    idx,
                    exc,
                )
                records.append(self._empty_features())

        if not records:
            return pd.DataFrame(columns=list(self.FEATURE_NAMES))

        df = pd.DataFrame(records)
        logger.info("Batch text feature extraction completed for %d items.", len(df))
        return df

    def extract_dataframe(
        self,
        df: pd.DataFrame,
        text_column: str = "lyrics",
        id_column: Optional[str] = None,
    ) -> pd.DataFrame:
        """Extract text features from a designated text column in a pandas DataFrame.

        Args:
            df: Input DataFrame containing lyrics text.
            text_column: Column name containing the lyrics strings (default: "lyrics").
            id_column: Optional column name to set as the index of the output DataFrame.

        Returns:
            pd.DataFrame: DataFrame containing extracted text features.

        Raises:
            KeyError: If text_column does not exist in df.
        """
        if text_column not in df.columns:
            raise KeyError(
                f"Column '{text_column}' not found in DataFrame. Available columns: {list(df.columns)}"
            )

        lyrics_list = df[text_column].fillna("").astype(str).tolist()
        features_df = self.extract_batch(lyrics_list)

        if id_column is not None and id_column in df.columns:
            features_df.index = df[id_column].values
            features_df.index.name = id_column

        return features_df
