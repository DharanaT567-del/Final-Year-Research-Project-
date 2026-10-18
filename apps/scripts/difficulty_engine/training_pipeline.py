"""
Naada — Song Difficulty Calculation Engine: ML Training Pipeline
================================================================

This module implements the primary machine learning training pipeline for
the AI-based Song Difficulty Calculation Engine. It fuses multi-modal acoustic
and lyrics NLP features, prepares and standardizes training datasets, trains
a baseline Random Forest regressor, performs hyperparameter optimization on
an XGBoost regressor using cross-validated grid search, evaluates regression
metrics (MAE, RMSE, R^2), and exports deployment-ready artifacts and metadata.

Usage
-----
    >>> from difficulty_engine.training_pipeline import DifficultyModelPipeline
    >>> pipeline = DifficultyModelPipeline(output_dir="models")
    >>> results = pipeline.run_full_pipeline(audio_df, text_df, difficulty_scores)
"""

import json
import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import GridSearchCV, cross_val_score, train_test_split
from sklearn.preprocessing import StandardScaler
from xgboost import XGBRegressor


class DifficultyModelPipeline:
    """End-to-end ML training pipeline for predicting song difficulty scores (0–100%).

    This pipeline orchestrates:
      1. Feature fusion: Horizontal concatenation of audio and text feature matrices.
      2. Data preparation: Quantile-stratified train/test split and feature standardization.
      3. Baseline training: Random Forest Regressor benchmark.
      4. Advanced training: GridSearchCV-tuned XGBoost Regressor with 5-fold CV.
      5. Evaluation: Comparative metrics (MAE, RMSE, R^2) across models.
      6. Artifact export: Serializing models, scalers, feature names, and metadata.

    Attributes
    ----------
    random_state : int
        Seed for reproducible random operations.
    test_size : float
        Fraction of dataset withheld for testing.
    output_dir : Path
        Directory where exported model artifacts and metadata are persisted.
    logger : logging.Logger
        Pipeline execution logger.
    scaler : Optional[StandardScaler]
        Fitted feature standardizer.
    feature_names : List[str]
        Ordered list of feature column names after fusion.
    baseline_model : Optional[RandomForestRegressor]
        Fitted baseline Random Forest model.
    xgb_model : Optional[XGBRegressor]
        Fitted and hyperparameter-tuned XGBoost model.
    baseline_metrics : Dict[str, float]
        Evaluation metrics for the baseline model.
    xgb_metrics : Dict[str, Any]
        Evaluation metrics and CV scores for the tuned XGBoost model.
    """

    def __init__(
        self,
        random_state: int = 42,
        test_size: float = 0.2,
        output_dir: Union[str, Path] = "models",
    ) -> None:
        """Initialize pipeline configuration, directory structure, and logger.

        Parameters
        ----------
        random_state : int, default=42
            Random seed for data splitting and model training reproducibility.
        test_size : float, default=0.2
            Proportion of the dataset to allocate to the test split (0.0 to 1.0).
        output_dir : Union[str, Path], default='models'
            Path to directory for persisting model artifacts and metadata.
        """
        self.random_state: int = random_state
        self.test_size: float = test_size
        self.output_dir: Path = Path(output_dir)

        # Configure logger
        self.logger: logging.Logger = logging.getLogger(self.__class__.__name__)
        if not self.logger.handlers and not logging.getLogger().handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                "[%(asctime)s] [%(name)s] [%(levelname)s] %(message)s",
                datefmt="%Y-%m-%d %H:%M:%S",
            )
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)
            self.logger.setLevel(logging.INFO)
        elif not self.logger.handlers:
            self.logger.setLevel(logging.INFO)

        # Ensure output directory exists
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.logger.info(
            f"Initialized {self.__class__.__name__} with output_dir='{self.output_dir}', "
            f"test_size={self.test_size}, random_state={self.random_state}"
        )

        # Pipeline state placeholders
        self.scaler: Optional[StandardScaler] = None
        self.feature_names: List[str] = []
        self.baseline_model: Optional[RandomForestRegressor] = None
        self.xgb_model: Optional[XGBRegressor] = None
        self.baseline_metrics: Dict[str, float] = {}
        self.xgb_metrics: Dict[str, Any] = {}

    def fuse_features(
        self,
        audio_features_df: pd.DataFrame,
        text_features_df: pd.DataFrame,
        difficulty_scores: pd.Series,
    ) -> pd.DataFrame:
        """Validate, prefix, and horizontally concatenate multi-modal features and target.

        Parameters
        ----------
        audio_features_df : pd.DataFrame
            Numerical features extracted from acoustic signals (e.g., tempo, MFCCs, chroma).
        text_features_df : pd.DataFrame
            Numerical features extracted from lyrics (e.g., syllable counts, unique words).
        difficulty_scores : pd.Series
            Target difficulty labels/scores (0 to 100).

        Returns
        -------
        pd.DataFrame
            Unified DataFrame containing prefixed feature columns and the 'difficulty_score' target.

        Raises
        ------
        ValueError
            If row counts differ between inputs or if any input DataFrame is empty.
        """
        if len(audio_features_df) == 0 or len(text_features_df) == 0:
            raise ValueError("Input feature DataFrames must not be empty.")

        if len(audio_features_df) != len(text_features_df):
            raise ValueError(
                f"Row count mismatch between feature matrices: audio has {len(audio_features_df)} rows, "
                f"while text has {len(text_features_df)} rows."
            )

        if len(audio_features_df) != len(difficulty_scores):
            raise ValueError(
                f"Row count mismatch between features and target: features have {len(audio_features_df)} rows, "
                f"while difficulty_scores has {len(difficulty_scores)} rows."
            )

        # Ensure index alignment across inputs
        audio_df = audio_features_df.copy().reset_index(drop=True)
        text_df = text_features_df.copy().reset_index(drop=True)
        target = difficulty_scores.copy().reset_index(drop=True)

        # Apply prefixing if columns are not already prefixed
        audio_col_map = {
            col: col if str(col).startswith("audio_") else f"audio_{col}"
            for col in audio_df.columns
        }
        audio_df.rename(columns=audio_col_map, inplace=True)

        text_col_map = {
            col: col if str(col).startswith("text_") else f"text_{col}"
            for col in text_df.columns
        }
        text_df.rename(columns=text_col_map, inplace=True)

        # Concatenate horizontally and append target
        fused_df = pd.concat([audio_df, text_df], axis=1)
        fused_df["difficulty_score"] = target.values

        self.logger.info(
            f"Feature fusion completed: {audio_df.shape[1]} audio features + "
            f"{text_df.shape[1]} text features + 1 target column -> Total shape: {fused_df.shape}"
        )
        return fused_df

    def prepare_data(
        self, fused_df: pd.DataFrame
    ) -> Tuple[np.ndarray, np.ndarray, pd.Series, pd.Series, List[str]]:
        """Split dataset into train/test sets using quantile stratification and scale features.

        Parameters
        ----------
        fused_df : pd.DataFrame
            Fused dataset containing feature columns and the 'difficulty_score' column.

        Returns
        -------
        Tuple[np.ndarray, np.ndarray, pd.Series, pd.Series, List[str]]
            - X_train_scaled: Standardized training feature array.
            - X_test_scaled: Standardized test feature array.
            - y_train: Training target series.
            - y_test: Test target series.
            - feature_names: Ordered list of feature names.

        Raises
        ------
        ValueError
            If 'difficulty_score' is missing from fused_df.
        """
        if "difficulty_score" not in fused_df.columns:
            raise ValueError(
                "fused_df must contain the 'difficulty_score' target column."
            )

        X = fused_df.drop(columns=["difficulty_score"])
        y = fused_df["difficulty_score"]
        self.feature_names = list(X.columns)

        # Discretize continuous target into 5 quantile bins for stratified train/test split
        stratify = None
        try:
            strat_bins = pd.qcut(y, q=5, labels=False, duplicates="drop")
            bin_counts = strat_bins.value_counts()
            # Stratification requires each bin to contain at least 2 samples
            if (bin_counts < 2).any() or strat_bins.nunique() < 2:
                self.logger.warning(
                    "Stratification bins contain fewer than 2 samples per bin. "
                    "Proceeding with standard random split."
                )
            else:
                stratify = strat_bins
        except Exception as exc:
            self.logger.warning(
                f"Quantile binning for stratification failed ({exc}). "
                "Proceeding with standard random split."
            )

        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=self.test_size,
            random_state=self.random_state,
            stratify=stratify,
        )

        # Fit feature standardizer on training split only
        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        self.logger.info(
            f"Data prepared: X_train shape={X_train_scaled.shape}, "
            f"X_test shape={X_test_scaled.shape}, "
            f"stratified={stratify is not None}, features={len(self.feature_names)}"
        )

        return X_train_scaled, X_test_scaled, y_train, y_test, self.feature_names

    def evaluate_model(
        self,
        model: Any,
        X_test: np.ndarray,
        y_test: Union[pd.Series, np.ndarray],
        model_name: str,
    ) -> Dict[str, float]:
        """Compute standard regression metrics (MAE, RMSE, R^2) on the test split.

        Parameters
        ----------
        model : Any
            Fitted regression estimator supporting `predict`.
        X_test : np.ndarray
            Standardized test feature matrix.
        y_test : Union[pd.Series, np.ndarray]
            Ground truth target difficulty values.
        model_name : str
            Human-readable label for logging and metric recording.

        Returns
        -------
        Dict[str, float]
            Dictionary containing 'mae', 'rmse', and 'r2' scores.
        """
        y_pred = model.predict(X_test)
        mae = float(mean_absolute_error(y_test, y_pred))
        rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
        r2 = float(r2_score(y_test, y_pred))

        self.logger.info(
            f"[{model_name}] Test Set Metrics -> MAE: {mae:.4f}, RMSE: {rmse:.4f}, R²: {r2:.4f}"
        )
        return {"mae": mae, "rmse": rmse, "r2": r2}

    def train_baseline(
        self,
        X_train: np.ndarray,
        y_train: Union[pd.Series, np.ndarray],
        X_test: np.ndarray,
        y_test: Union[pd.Series, np.ndarray],
    ) -> Dict[str, float]:
        """Train a baseline Random Forest Regressor and evaluate test performance.

        Parameters
        ----------
        X_train : np.ndarray
            Scaled training feature matrix.
        y_train : Union[pd.Series, np.ndarray]
            Training target values.
        X_test : np.ndarray
            Scaled test feature matrix.
        y_test : Union[pd.Series, np.ndarray]
            Test target values.

        Returns
        -------
        Dict[str, float]
            Baseline model evaluation metrics (MAE, RMSE, R^2).
        """
        self.logger.info(
            "Training baseline RandomForestRegressor (n_estimators=200, max_depth=15)..."
        )
        rf = RandomForestRegressor(
            n_estimators=200,
            max_depth=15,
            random_state=self.random_state,
            n_jobs=-1,
        )
        rf.fit(X_train, y_train)

        self.baseline_model = rf
        metrics = self.evaluate_model(rf, X_test, y_test, model_name="RandomForest Baseline")
        self.baseline_metrics = metrics
        return metrics

    def train_xgboost(
        self,
        X_train: np.ndarray,
        y_train: Union[pd.Series, np.ndarray],
        X_test: np.ndarray,
        y_test: Union[pd.Series, np.ndarray],
        param_grid: Optional[Dict[str, List[Any]]] = None,
    ) -> Dict[str, Any]:
        """Perform GridSearchCV hyperparameter optimization on XGBoost Regressor.

        Conducts 5-fold cross-validated grid search optimizing for negative MAE,
        evaluates the best estimator on the test split, and logs cross-validation
        mean and standard deviation.

        Parameters
        ----------
        X_train : np.ndarray
            Scaled training feature matrix.
        y_train : Union[pd.Series, np.ndarray]
            Training target values.
        X_test : np.ndarray
            Scaled test feature matrix.
        y_test : Union[pd.Series, np.ndarray]
            Test target values.
        param_grid : Optional[Dict[str, List[Any]]], default=None
            Hyperparameter search space. If None, uses the comprehensive default grid.

        Returns
        -------
        Dict[str, Any]
            Dictionary containing test metrics ('mae', 'rmse', 'r2'),
            5-fold CV statistics ('cv_mae_mean', 'cv_mae_std'), and 'best_params'.
        """
        if param_grid is None:
            param_grid = {
                "n_estimators": [100, 200, 300],
                "max_depth": [3, 5, 7],
                "learning_rate": [0.01, 0.05, 0.1],
                "subsample": [0.8, 1.0],
                "colsample_bytree": [0.8, 1.0],
                "reg_alpha": [0.0, 0.1],
                "reg_lambda": [1.0, 1.5],
            }

        self.logger.info(
            f"Initiating XGBoost hyperparameter tuning with GridSearchCV across "
            f"{np.prod([len(v) for v in param_grid.values()])} candidate combinations..."
        )

        base_xgb = XGBRegressor(
            random_state=self.random_state,
            objective="reg:squarederror",
            n_jobs=1,  # Keep inner estimator single-threaded; parallelize in GridSearchCV
        )

        # Adapt cross-validation folds if dataset is small
        cv_folds = 5 if len(X_train) >= 5 else max(2, len(X_train))

        # On Windows (particularly with Python 3.13), multiprocessing resource tracking
        # can raise ModuleNotFoundError: No module named '_posixsubprocess'.
        # Using the threading backend avoids this while preserving multi-core execution.
        parallel_backend = "threading" if os.name == "nt" else "loky"

        grid_search = GridSearchCV(
            estimator=base_xgb,
            param_grid=param_grid,
            cv=cv_folds,
            scoring="neg_mean_absolute_error",
            n_jobs=-1,
            verbose=0,
        )
        with joblib.parallel_backend(parallel_backend):
            grid_search.fit(X_train, y_train)

        best_xgb = grid_search.best_estimator_
        best_params = grid_search.best_params_
        self.xgb_model = best_xgb

        self.logger.info(f"XGBoost Best Hyperparameters: {best_params}")

        # Evaluate best estimator on holdout test set
        metrics = self.evaluate_model(best_xgb, X_test, y_test, model_name="XGBoost Tuned")

        # 5-fold cross-validation on the training set using best estimator
        with joblib.parallel_backend(parallel_backend):
            cv_scores = cross_val_score(
                best_xgb,
                X_train,
                y_train,
                cv=cv_folds,
                scoring="neg_mean_absolute_error",
                n_jobs=-1,
            )
        cv_mae_scores = -cv_scores
        cv_mae_mean = float(np.mean(cv_mae_scores))
        cv_mae_std = float(np.std(cv_mae_scores))

        self.logger.info(
            f"[XGBoost Tuned] {cv_folds}-Fold CV MAE: {cv_mae_mean:.4f} ± {cv_mae_std:.4f}"
        )

        result: Dict[str, Any] = {
            "mae": metrics["mae"],
            "rmse": metrics["rmse"],
            "r2": metrics["r2"],
            "cv_mae_mean": cv_mae_mean,
            "cv_mae_std": cv_mae_std,
            "best_params": best_params,
        }
        self.xgb_metrics = result
        return result

    def export_model(self, model_name: str = "xgb_difficulty_model") -> Dict[str, str]:
        """Serialize trained XGBoost model, feature scaler, feature list, and metadata.

        Parameters
        ----------
        model_name : str, default='xgb_difficulty_model'
            Base filename for the saved model artifact.

        Returns
        -------
        Dict[str, str]
            Absolute filesystem paths for all saved artifacts.

        Raises
        ------
        RuntimeError
            If XGBoost model or feature scaler have not been trained/fitted.
        """
        if self.xgb_model is None:
            raise RuntimeError(
                "Cannot export model: XGBoost model has not been trained yet. Call train_xgboost first."
            )
        if self.scaler is None:
            raise RuntimeError(
                "Cannot export scaler: Feature scaler has not been fitted yet. Call prepare_data first."
            )

        self.output_dir.mkdir(parents=True, exist_ok=True)

        model_path = self.output_dir / f"{model_name}.joblib"
        scaler_path = self.output_dir / "feature_scaler.joblib"
        feature_names_path = self.output_dir / "feature_names.json"
        metadata_path = self.output_dir / "model_metadata.json"

        # 1. Save model and scaler via joblib
        joblib.dump(self.xgb_model, str(model_path.resolve()))
        joblib.dump(self.scaler, str(scaler_path.resolve()))

        # 2. Save feature names
        with open(feature_names_path, "w", encoding="utf-8") as f:
            json.dump(self.feature_names, f, indent=2)

        # 3. Save training metadata
        metadata: Dict[str, Any] = {
            "model_name": model_name,
            "model_version": "1.0.0",
            "timestamp": datetime.now().isoformat(),
            "random_state": self.random_state,
            "test_size": self.test_size,
            "feature_count": len(self.feature_names),
            "feature_names": self.feature_names,
            "baseline_metrics": self.baseline_metrics,
            "xgb_metrics": self.xgb_metrics,
            "best_params": self.xgb_metrics.get("best_params", {}),
        }

        with open(metadata_path, "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2)

        self.logger.info(f"Exported model: {model_path}")
        self.logger.info(f"Exported scaler: {scaler_path}")
        self.logger.info(f"Exported feature names: {feature_names_path}")
        self.logger.info(f"Exported metadata: {metadata_path}")

        saved_paths: Dict[str, str] = {
            "model_path": str(model_path.resolve()),
            "scaler_path": str(scaler_path.resolve()),
            "feature_names_path": str(feature_names_path.resolve()),
            "metadata_path": str(metadata_path.resolve()),
        }
        return saved_paths

    def run_full_pipeline(
        self,
        audio_features_df: pd.DataFrame,
        text_features_df: pd.DataFrame,
        difficulty_scores: pd.Series,
        param_grid: Optional[Dict[str, List[Any]]] = None,
    ) -> Dict[str, Any]:
        """Orchestrate the full end-to-end training, evaluation, and export pipeline.

        Executes:
          1. Feature Fusion
          2. Data Preparation & Scaling
          3. Baseline Training (Random Forest)
          4. XGBoost Training & Tuning (GridSearchCV)
          5. Artifact Export
          6. Tabular performance comparison display

        Parameters
        ----------
        audio_features_df : pd.DataFrame
            Extracted acoustic features DataFrame.
        text_features_df : pd.DataFrame
            Extracted text NLP features DataFrame.
        difficulty_scores : pd.Series
            Continuous target difficulty values (0 to 100).
        param_grid : Optional[Dict[str, List[Any]]], default=None
            Optional hyperparameter grid for XGBoost tuning.

        Returns
        -------
        Dict[str, Any]
            Summary dictionary containing fused DataFrame shape, feature count,
            baseline metrics, XGBoost metrics, and paths to saved artifacts.
        """
        self.logger.info("=" * 72)
        self.logger.info("Starting Song Difficulty Model Full Training Pipeline")
        self.logger.info("=" * 72)

        # Step 1: Feature Fusion
        fused_df = self.fuse_features(
            audio_features_df=audio_features_df,
            text_features_df=text_features_df,
            difficulty_scores=difficulty_scores,
        )

        # Step 2: Data Preparation & Standardization
        X_train, X_test, y_train, y_test, feature_names = self.prepare_data(fused_df)

        # Step 3: Train Baseline Model
        baseline_metrics = self.train_baseline(
            X_train=X_train,
            y_train=y_train,
            X_test=X_test,
            y_test=y_test,
        )

        # Step 4: Train & Tune XGBoost Model
        xgb_metrics = self.train_xgboost(
            X_train=X_train,
            y_train=y_train,
            X_test=X_test,
            y_test=y_test,
            param_grid=param_grid,
        )

        # Step 5: Export Models and Metadata
        saved_paths = self.export_model()

        # Step 6: Print Performance Comparison Table
        comparison_table = self._format_comparison_table(
            baseline_metrics=baseline_metrics,
            xgb_metrics=xgb_metrics,
        )
        print("\n" + comparison_table + "\n")
        self.logger.info("Song Difficulty Model Training Pipeline completed successfully.")

        return {
            "fused_df_shape": fused_df.shape,
            "feature_count": len(feature_names),
            "baseline_metrics": baseline_metrics,
            "xgb_metrics": xgb_metrics,
            "saved_paths": saved_paths,
        }

    @staticmethod
    def _format_comparison_table(
        baseline_metrics: Dict[str, float],
        xgb_metrics: Dict[str, Any],
    ) -> str:
        """Format an ASCII comparison table of baseline vs tuned XGBoost performance.

        Parameters
        ----------
        baseline_metrics : Dict[str, float]
            Baseline model evaluation metrics.
        xgb_metrics : Dict[str, Any]
            XGBoost model evaluation metrics and CV scores.

        Returns
        -------
        str
            Formatted ASCII table string.
        """
        b_mae = baseline_metrics.get("mae", 0.0)
        b_rmse = baseline_metrics.get("rmse", 0.0)
        b_r2 = baseline_metrics.get("r2", 0.0)

        x_mae = xgb_metrics.get("mae", 0.0)
        x_rmse = xgb_metrics.get("rmse", 0.0)
        x_r2 = xgb_metrics.get("r2", 0.0)
        cv_mean = xgb_metrics.get("cv_mae_mean", 0.0)
        cv_std = xgb_metrics.get("cv_mae_std", 0.0)

        lines = [
            "=" * 72,
            "               SONG DIFFICULTY MODEL TRAINING SUMMARY",
            "=" * 72,
            f"{'Metric':<20} | {'Baseline (Random Forest)':<24} | {'Tuned XGBoost':<22}",
            "-" * 72,
            f"{'MAE':<20} | {b_mae:<24.4f} | {x_mae:<22.4f}",
            f"{'RMSE':<20} | {b_rmse:<24.4f} | {x_rmse:<22.4f}",
            f"{'R² Score':<20} | {b_r2:<24.4f} | {x_r2:<22.4f}",
            f"{'CV MAE (5-Fold)':<20} | {'N/A':<24} | {f'{cv_mean:.4f} ± {cv_std:.4f}':<22}",
            "=" * 72,
        ]
        return "\n".join(lines)


if __name__ == "__main__":
    # Demonstration / smoke test with synthetic features
    logging.basicConfig(level=logging.INFO)
    print("Running synthetic self-test for DifficultyModelPipeline...")

    rng = np.random.RandomState(42)
    n_samples = 120

    # Synthetic acoustic features
    synthetic_audio_df = pd.DataFrame(
        {
            "tempo": rng.uniform(60.0, 160.0, size=n_samples),
            "pitch_std": rng.uniform(10.0, 50.0, size=n_samples),
            "spectral_centroid": rng.uniform(1000.0, 4000.0, size=n_samples),
            "zero_crossing_rate": rng.uniform(0.01, 0.20, size=n_samples),
            "spectral_rolloff": rng.uniform(1500.0, 5000.0, size=n_samples),
        }
    )

    # Synthetic NLP lyrics features
    synthetic_text_df = pd.DataFrame(
        {
            "syllable_count": rng.randint(40, 250, size=n_samples),
            "unique_words_ratio": rng.uniform(0.3, 0.9, size=n_samples),
            "char_count": rng.randint(150, 1200, size=n_samples),
            "vowel_consonant_ratio": rng.uniform(0.4, 0.8, size=n_samples),
        }
    )

    # Synthetic ground truth difficulty score (0 - 100)
    synthetic_scores = pd.Series(
        0.2 * synthetic_audio_df["tempo"]
        + 0.4 * synthetic_audio_df["pitch_std"]
        + 0.1 * synthetic_text_df["syllable_count"]
        + rng.normal(0, 3, size=n_samples),
        name="difficulty_score",
    ).clip(0, 100)

    demo_pipeline = DifficultyModelPipeline(
        output_dir="demo_models",
        random_state=42,
        test_size=0.2,
    )

    # Use a fast subset grid for demo self-test
    fast_grid = {
        "n_estimators": [50, 100],
        "max_depth": [3, 5],
        "learning_rate": [0.05, 0.1],
        "subsample": [0.8],
        "colsample_bytree": [0.8],
        "reg_alpha": [0.0],
        "reg_lambda": [1.0],
    }

    fused = demo_pipeline.fuse_features(
        synthetic_audio_df, synthetic_text_df, synthetic_scores
    )
    X_tr, X_te, y_tr, y_te, f_names = demo_pipeline.prepare_data(fused)
    base_res = demo_pipeline.train_baseline(X_tr, y_tr, X_te, y_te)
    xgb_res = demo_pipeline.train_xgboost(X_tr, y_tr, X_te, y_te, param_grid=fast_grid)
    exp_res = demo_pipeline.export_model()
    print("\n" + demo_pipeline._format_comparison_table(base_res, xgb_res) + "\n")
    print("Demo self-test completed successfully. Exported files:", exp_res)
