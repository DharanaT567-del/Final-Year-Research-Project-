#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
========================================================================================
Naada AI Music Tutor - Offline RAG Knowledge Base Ingestion Pipeline
========================================================================================
Processes, embeds, and ingests curated Sinhala classical songs from Excel into Pinecone.
Serves as the high-fidelity retrieval corpus for the Spring Boot RAG AI Gateway.

Authors: Antigravity / Naada Data & AI Engineering Team
========================================================================================
"""

import argparse
import json
import logging
import math
import os
import random
import re
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd
from dotenv import load_dotenv

# Ensure UTF-8 output across Windows PowerShell and Unix terminals
if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# --------------------------------------------------------------------------------------
# Logging Setup
# --------------------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("NaadaIngestion")


# --------------------------------------------------------------------------------------
# Configuration Manager
# --------------------------------------------------------------------------------------
class PipelineConfig:
    """Manages credentials, file paths, model parameters, and runtime options."""

    def __init__(self, cli_args: Optional[argparse.Namespace] = None):
        # 1. Load local .env if present
        script_dir = Path(__file__).resolve().parent
        project_root = script_dir.parents[2]  # Final-Year-Research-Project-

        env_candidates = [
            script_dir / ".env",
            project_root / ".env",
        ]
        for env_path in env_candidates:
            if env_path.is_file():
                load_dotenv(dotenv_path=env_path)
                logger.info(f"Loaded environment variables from: {env_path}")
                break

        # 2. Extract properties fallback from application.properties
        app_props = self._parse_spring_properties(
            project_root / "apps" / "apigateway" / "src" / "main" / "resources" / "application.properties"
        )

        # 3. Read API keys and configs with hierarchy: CLI > ENV > application.properties
        self.gemini_api_key = (
            (cli_args.gemini_api_key if cli_args and cli_args.gemini_api_key else None)
            or os.getenv("GEMINI_API_KEY")
            or os.getenv("AI_API_KEY")
            or app_props.get("GEMINI_API_KEY")
        )

        self.pinecone_api_key = (
            (cli_args.pinecone_api_key if cli_args and cli_args.pinecone_api_key else None)
            or os.getenv("PINECONE_API_KEY")
            or app_props.get("PINECONE_API_KEY")
        )

        self.pinecone_env = (
            (cli_args.pinecone_env if cli_args and cli_args.pinecone_env else None)
            or os.getenv("PINECONE_ENVIRONMENT")
            or app_props.get("PINECONE_ENVIRONMENT", "us-east-1")
        )

        self.index_name = (
            (cli_args.index_name if cli_args and cli_args.index_name else None)
            or os.getenv("PINECONE_INDEX_NAME")
            or app_props.get("PINECONE_INDEX_NAME")
            or "naada-music-index"
        )

        self.namespace = (
            (cli_args.namespace if cli_args and cli_args.namespace else None)
            or os.getenv("PINECONE_NAMESPACE")
            or app_props.get("PINECONE_NAMESPACE", "_default_")
        )

        # Dataset path
        default_dataset = project_root / "apps" / "docs" / "mathaka_sinhala_classical_songs (2).xlsx"
        self.dataset_path = (
            Path(cli_args.file) if cli_args and cli_args.file else default_dataset
        )

        # Embedding & Processing
        self.embedding_model = (
            (cli_args.model if cli_args and cli_args.model else None)
            or os.getenv("EMBEDDING_MODEL", "gemini-embedding-001")
        )
        self.target_dimension = (
            int(cli_args.dimension) if cli_args and cli_args.dimension
            else int(os.getenv("EMBEDDING_DIMENSION", "3072")) if os.getenv("EMBEDDING_DIMENSION")
            else None
        )

        self.sheet_name = (
            cli_args.sheet if cli_args and cli_args.sheet else "Strict Classical Maestros"
        )
        self.batch_size = (
            int(cli_args.batch_size) if cli_args and cli_args.batch_size else 25
        )
        self.batch_delay = (
            float(cli_args.delay) if cli_args and cli_args.delay is not None else 1.5
        )
        self.limit = int(cli_args.limit) if cli_args and cli_args.limit else None

        sanitized_idx = re.sub(r"[^a-zA-Z0-9_-]", "_", self.index_name)
        self.checkpoint_file = script_dir / f"checkpoint_{sanitized_idx}.json"
        self.skip_checkpoint = bool(cli_args.skip_checkpoint) if cli_args else False
        self.test_only = bool(cli_args.test_only) if cli_args else False

    def validate(self):
        """Validates that necessary credentials and dataset files exist."""
        if not self.gemini_api_key:
            raise ValueError(
                "GEMINI_API_KEY is missing! Set it in apps/scripts/ingest_rag/.env, "
                "OS environment, or pass via --gemini-api-key."
            )
        if not self.pinecone_api_key:
            raise ValueError(
                "PINECONE_API_KEY is missing! Set it in apps/scripts/ingest_rag/.env, "
                "OS environment, or pass via --pinecone-api-key."
            )
        if not self.test_only and not self.dataset_path.is_file():
            raise FileNotFoundError(
                f"Dataset Excel file not found at: {self.dataset_path.resolve()}"
            )

    @staticmethod
    def _parse_spring_properties(props_file: Path) -> Dict[str, str]:
        """Extracts configuration values from Spring Boot's application.properties."""
        values = {}
        if not props_file.is_file():
            return values

        try:
            content = props_file.read_text(encoding="utf-8")
            m_gemini = re.search(r"\$\{[^:]*GEMINI_API_KEY:([^}]+)\}", content)
            if m_gemini:
                values["GEMINI_API_KEY"] = m_gemini.group(1).strip()

            m_pinecone = re.search(r"\$\{[^:]*PINECONE_API_KEY:([^}]+)\}", content)
            if m_pinecone:
                values["PINECONE_API_KEY"] = m_pinecone.group(1).strip()

            m_env = re.search(r"\$\{[^:]*PINECONE_ENVIRONMENT:([^}]+)\}", content)
            if m_env:
                values["PINECONE_ENVIRONMENT"] = m_env.group(1).strip()

            m_idx = re.search(r"\$\{[^:]*PINECONE_INDEX_NAME:([^}]+)\}", content)
            if m_idx:
                values["PINECONE_INDEX_NAME"] = m_idx.group(1).strip()

            m_ns = re.search(r"\$\{[^:]*PINECONE_NAMESPACE:([^}]+)\}", content)
            if m_ns:
                values["PINECONE_NAMESPACE"] = m_ns.group(1).strip()

        except Exception as e:
            logger.warning(f"Could not parse application.properties: {e}")

        return values

    @staticmethod
    def mask_secret(secret: Optional[str]) -> str:
        """Safely masks credentials for display."""
        if not secret:
            return "<Not Set>"
        if len(secret) <= 10:
            return "***"
        return f"{secret[:6]}...{secret[-4:]}"


# --------------------------------------------------------------------------------------
# Pinecone Index Manager
# --------------------------------------------------------------------------------------
class PineconeIndexManager:
    """Manages Pinecone connection, index provisioning, upserting, and stats."""

    def __init__(self, api_key: str, index_name: str, environment: str = "us-east-1"):
        from pinecone import Pinecone, ServerlessSpec

        self.api_key = api_key
        self.index_name = index_name
        self.environment = environment
        self.pc = Pinecone(api_key=api_key)
        self.ServerlessSpec = ServerlessSpec
        self.index = None
        self.dimension = None

    def ensure_index(self, default_dimension: int = 3072, metric: str = "cosine") -> int:
        """
        Validates the index. If missing, creates a Serverless index.
        Returns the resolved index dimension.
        """
        logger.info(f"Connecting to Pinecone and validating index: '{self.index_name}'...")
        existing_indexes = [idx.name for idx in self.pc.list_indexes()]

        if self.index_name not in existing_indexes:
            logger.info(
                f"Index '{self.index_name}' not found. Provisioning Serverless index "
                f"(dim={default_dimension}, metric='{metric}', cloud='aws', region='{self.environment}')..."
            )
            self.pc.create_index(
                name=self.index_name,
                dimension=default_dimension,
                metric=metric,
                spec=self.ServerlessSpec(cloud="aws", region=self.environment),
            )

            while True:
                desc = self.pc.describe_index(self.index_name)
                state = desc.status.get("state") if isinstance(desc.status, dict) else desc.status.state
                if state == "Ready":
                    logger.info(f"Index '{self.index_name}' is Ready!")
                    break
                logger.info(f"Waiting for index '{self.index_name}' to become Ready...")
                time.sleep(3)

            self.dimension = default_dimension
        else:
            desc = self.pc.describe_index(self.index_name)
            self.dimension = desc.dimension
            logger.info(
                f"Found existing Pinecone index '{self.index_name}' "
                f"(dimension: {self.dimension}, metric: '{desc.metric}')."
            )

        self.index = self.pc.Index(self.index_name)
        return self.dimension

    def upsert_vectors(
        self,
        vectors: List[Tuple[str, List[float], Dict[str, Any]]],
        namespace: str = "_default_",
        sub_batch_size: int = 15,
        max_retries: int = 3,
    ):
        """
        Upserts vectors in compact sub-batches (default 15) to prevent
        large payload socket hangs on Windows with high-dimensional (3072) vectors.
        """
        if not self.index:
            raise RuntimeError("Index is not initialized. Call ensure_index() first.")

        total_vectors = len(vectors)
        for i in range(0, total_vectors, sub_batch_size):
            chunk = vectors[i : i + sub_batch_size]
            for attempt in range(1, max_retries + 1):
                try:
                    self.index.upsert(vectors=chunk, namespace=namespace)
                    break
                except Exception as e:
                    if attempt == max_retries:
                        logger.error(f"Failed to upsert sub-batch ({i}-{i+len(chunk)}) after {max_retries} attempts: {e}")
                        raise
                    sleep_time = attempt * 2.0
                    logger.warning(f"Pinecone upsert glitch: {e}. Retrying sub-batch in {sleep_time}s...")
                    time.sleep(sleep_time)

    def get_stats(self) -> Any:
        """Retrieves and returns the Pinecone index statistics."""
        if not self.index:
            raise RuntimeError("Index is not initialized. Call ensure_index() first.")
        return self.index.describe_index_stats()

    def similarity_search(self, query_vector: List[float], top_k: int = 3, namespace: str = "_default_"):
        """Performs a similarity query in Pinecone and returns matches."""
        if not self.index:
            raise RuntimeError("Index is not initialized. Call ensure_index() first.")

        return self.index.query(
            vector=query_vector,
            top_k=top_k,
            include_metadata=True,
            namespace=namespace,
        )


# --------------------------------------------------------------------------------------
# Gemini Embedder (with Robust Dimension Alignment & Backoff)
# --------------------------------------------------------------------------------------
class GeminiEmbedder:
    """
    Generates text embeddings using the official Google GenAI SDK.
    Supports gemini-embedding-001 (native 3072 dims or 768 via MRL) and text-embedding-004.
    """

    def __init__(self, api_key: str, preferred_model: str = "gemini-embedding-001", target_dimension: int = 3072):
        from google import genai
        from google.genai import types

        self.client = genai.Client(api_key=api_key)
        self.types = types
        self.preferred_model = preferred_model
        self.target_dimension = target_dimension
        self.active_model = preferred_model
        self.use_output_dim = (target_dimension != 3072)

        self._probe_model()

    def _probe_model(self):
        """Probes the requested embedding model and determines the appropriate active model."""
        test_text = "නාද සංගීත ගුරු - සිංහල සම්භාව්‍ය ගීත පද්ධතිය"
        models_to_try = [
            self.preferred_model,
            "gemini-embedding-001",
            "models/gemini-embedding-001",
            "text-embedding-004",
            "models/text-embedding-004",
        ]

        for m in models_to_try:
            try:
                config_kwargs = {"task_type": "RETRIEVAL_DOCUMENT"}
                if self.target_dimension and self.target_dimension != 3072:
                    config_kwargs["output_dimensionality"] = self.target_dimension

                config = self.types.EmbedContentConfig(**config_kwargs)
                resp = self.client.models.embed_content(
                    model=m,
                    contents=test_text,
                    config=config,
                )
                emb_len = len(resp.embeddings[0].values)
                self.active_model = m
                logger.info(
                    f"Successfully initialized embedding engine with model '{m}' "
                    f"(output dimension: {emb_len})."
                )
                return
            except Exception as e:
                logger.debug(f"Probe with model '{m}' failed: {e}")

        logger.warning(
            f"Could not verify preferred model '{self.preferred_model}'. Defaulting to 'gemini-embedding-001'."
        )
        self.active_model = "gemini-embedding-001"

    def embed_batch(
        self,
        texts: List[str],
        task_type: str = "RETRIEVAL_DOCUMENT",
        max_retries: int = 5,
    ) -> List[List[float]]:
        """
        Embeds a batch of texts with exponential backoff and jitter.
        """
        for attempt in range(1, max_retries + 1):
            try:
                config_kwargs = {"task_type": task_type}
                if self.target_dimension and self.target_dimension != 3072:
                    config_kwargs["output_dimensionality"] = self.target_dimension

                config = self.types.EmbedContentConfig(**config_kwargs)
                resp = self.client.models.embed_content(
                    model=self.active_model,
                    contents=texts,
                    config=config,
                )
                return [emb.values for emb in resp.embeddings]

            except Exception as e:
                err_str = str(e)
                is_rate_limit = any(x in err_str.lower() for x in ["429", "rate limit", "quota", "exhausted"])
                if attempt == max_retries:
                    logger.error(f"Failed to embed batch after {max_retries} attempts: {e}")
                    raise

                sleep_time = (2 ** attempt) + random.uniform(0.5, 2.0)
                if is_rate_limit:
                    sleep_time += 5.0
                    logger.warning(
                        f"[Rate Limit Hit] Backing off for {sleep_time:.1f}s before retry {attempt}/{max_retries}..."
                    )
                else:
                    logger.warning(
                        f"[Transient Error] '{e}'. Retrying in {sleep_time:.1f}s (attempt {attempt}/{max_retries})..."
                    )
                time.sleep(sleep_time)

        return []

    def embed_query(self, query_text: str) -> List[float]:
        """Embeds a single query string for similarity search."""
        vectors = self.embed_batch([query_text], task_type="RETRIEVAL_QUERY")
        return vectors[0]


# --------------------------------------------------------------------------------------
# Dataset Processor
# --------------------------------------------------------------------------------------
class DatasetProcessor:
    """Reads Excel datasets, sanitizes entries, and formats structured representations."""

    def __init__(self, file_path: Path, sheet_name: str = "Strict Classical Maestros"):
        self.file_path = file_path
        self.sheet_name = sheet_name

    def load_and_prepare(self) -> List[Dict[str, Any]]:
        """Loads and filters valid song records from the target Excel sheet."""
        logger.info(f"Reading dataset: '{self.file_path.name}' (Sheet: '{self.sheet_name}')...")
        df = pd.read_excel(self.file_path, sheet_name=self.sheet_name)
        total_rows = len(df)
        logger.info(f"Loaded {total_rows} total rows from sheet '{self.sheet_name}'.")

        # Filter out rows with null or whitespace-only lyrics
        valid_df = df[df["lyrics"].dropna().astype(str).str.strip().ne("")].copy()
        logger.info(f"Retained {len(valid_df)} rows with valid Sinhala lyrics.")

        # Identify key columns dynamically
        norm_col = next(
            (c for c in valid_df.columns if "sentence normalization" in c.lower() and "shenal" in c.lower()),
            next((c for c in valid_df.columns if "sentence normalization" in c.lower()), None),
        )
        diff_col = next(
            (c for c in valid_df.columns if "difficulty" in c.lower() and "shenal" in c.lower()),
            next((c for c in valid_df.columns if "difficulty" in c.lower()), None),
        )
        emot_cols = [
            c for c in valid_df.columns
            if any(e in c.lower() for e in ["love", "happiness", "sadness", "anger", "fear", "calmness"])
            and "total" not in c.lower()
            and "shenal" in c.lower()
        ]
        if not emot_cols:
            emot_cols = [
                c for c in valid_df.columns
                if any(e in c.lower() for e in ["love", "happiness", "sadness", "anger", "fear", "calmness"])
                and "total" not in c.lower()
            ]

        records = []
        for _, row in valid_df.iterrows():
            song_id = str(row.get("song_id", "")).strip()
            if not song_id:
                continue

            title = str(row.get("song_title", "")).strip()
            artist = str(row.get("artist_name", "")).strip()

            composer_val = row.get("composer")
            composer = str(composer_val).strip() if pd.notna(composer_val) and str(composer_val).strip() else "Unknown"

            lyricist_val = row.get("lyricist")
            lyricist = str(lyricist_val).strip() if pd.notna(lyricist_val) and str(lyricist_val).strip() else "Unknown"

            lyrics = str(row.get("lyrics", "")).strip()

            # Normalized meaning
            norm_meaning = ""
            if norm_col and pd.notna(row[norm_col]):
                norm_meaning = str(row[norm_col]).strip()

            # Difficulty
            difficulty = -1.0
            if diff_col and pd.notna(row[diff_col]):
                try:
                    difficulty = float(row[diff_col])
                except (ValueError, TypeError):
                    difficulty = -1.0

            # Dominant emotion calculation
            dominant_emotion = "Unannotated"
            max_emotion_score = 0.0
            for ec in emot_cols:
                val = row.get(ec)
                if pd.notna(val):
                    try:
                        num = float(val)
                        if num > max_emotion_score:
                            max_emotion_score = num
                            clean_label = ec.split("\n")[-1].replace("(%)", "").strip()
                            dominant_emotion = clean_label
                    except (ValueError, TypeError):
                        pass

            # Formulate structured text representation for embedding
            structured_text = (
                f"Song Title: {title}\n"
                f"Artist: {artist}\n"
                f"Composer: {composer}\n"
                f"Lyricist: {lyricist}\n"
                f"Lyrics:\n{lyrics}"
            )

            # Metadata respecting Pinecone's 40KB limit and strict primitive typing
            metadata = {
                "song_id": song_id,
                "title": title,
                "artist": artist,
                "composer": composer,
                "lyricist": lyricist,
                "genre": "Sinhala Classical",
                "sheet": self.sheet_name,
                "lyrics_preview": lyrics[:1000],
                "normalized_meaning": norm_meaning[:1500] if norm_meaning else "",
                "difficulty": difficulty,
                "dominant_emotion": dominant_emotion,
                # Spring AI PineconeVectorStore compatibility:
                "document_content": structured_text[:4000],
                "text": structured_text[:4000],
            }

            records.append({
                "song_id": song_id,
                "structured_text": structured_text,
                "metadata": metadata,
            })

        logger.info(f"Successfully processed {len(records)} song documents ready for embedding.")
        return records


# --------------------------------------------------------------------------------------
# Pipeline Orchestrator
# --------------------------------------------------------------------------------------
class IngestionPipeline:
    """Coordinates document loading, checkpointing, batch embedding, upserting, and validation."""

    def __init__(self, config: PipelineConfig):
        self.config = config
        self.pinecone_mgr = PineconeIndexManager(
            api_key=config.pinecone_api_key,
            index_name=config.index_name,
            environment=config.pinecone_env,
        )

        # Ensure index exists and determine its dimension
        self.actual_dimension = self.pinecone_mgr.ensure_index(
            default_dimension=config.target_dimension or 3072,
            metric="cosine",
        )

        # Initialize embedder with index dimension
        self.embedder = GeminiEmbedder(
            api_key=config.gemini_api_key,
            preferred_model=config.embedding_model,
            target_dimension=self.actual_dimension,
        )

    def _load_checkpoint(self) -> set:
        """Loads already processed song IDs from checkpoint."""
        if self.config.skip_checkpoint or not self.config.checkpoint_file.is_file():
            return set()
        try:
            with open(self.config.checkpoint_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                return set(data.get("upserted_ids", []))
        except Exception as e:
            logger.warning(f"Could not read checkpoint file: {e}")
            return set()

    def _save_checkpoint(self, upserted_ids: set):
        """Persists processed song IDs to disk."""
        try:
            with open(self.config.checkpoint_file, "w", encoding="utf-8") as f:
                json.dump({"upserted_ids": list(upserted_ids), "last_updated": time.time()}, f)
        except Exception as e:
            logger.warning(f"Could not write checkpoint file: {e}")

    def run(self):
        """Executes the full end-to-end ingestion pipeline."""
        logger.info("=" * 80)
        logger.info("STARTING NAADA CLASSICAL SONGS RAG INGESTION PIPELINE")
        logger.info("=" * 80)
        logger.info(f"Target Sheet:          {self.config.sheet_name}")
        logger.info(f"Index Name:            {self.config.index_name}")
        logger.info(f"Namespace:             {self.config.namespace}")
        logger.info(f"Embedding Model:       {self.embedder.active_model}")
        logger.info(f"Index Dimension:       {self.actual_dimension}")
        logger.info(f"Batch Size:            {self.config.batch_size}")
        logger.info(f"Gemini API Key:        {PipelineConfig.mask_secret(self.config.gemini_api_key)}")
        logger.info(f"Pinecone API Key:      {PipelineConfig.mask_secret(self.config.pinecone_api_key)}")
        logger.info("=" * 80)

        # Dry run / test-only mode check
        if self.config.test_only:
            logger.info("Flag --test-only active. Skipping ingestion and running verification search.")
            self.verify_retrieval()
            return

        # 1. Extract and format records
        processor = DatasetProcessor(
            file_path=self.config.dataset_path,
            sheet_name=self.config.sheet_name,
        )
        records = processor.load_and_prepare()

        if self.config.limit:
            logger.info(f"Applying limit: processing only the first {self.config.limit} songs.")
            records = records[: self.config.limit]

        # 2. Checkpointing
        completed_ids = self._load_checkpoint()
        pending_records = [r for r in records if r["song_id"] not in completed_ids]

        if completed_ids:
            logger.info(
                f"Checkpoint resumed: {len(completed_ids)} songs already upserted. "
                f"{len(pending_records)} pending records remaining."
            )

        if not pending_records:
            logger.info("All records are already ingested according to checkpoint. Proceeding to verification.")
            self.verify_retrieval()
            return

        # 3. Batch Embedding and Upserting
        total_batches = math.ceil(len(pending_records) / self.config.batch_size)
        logger.info(f"Beginning batch processing: {len(pending_records)} songs across {total_batches} batches.")

        start_time = time.time()
        for batch_idx in range(total_batches):
            batch_start = batch_idx * self.config.batch_size
            batch_end = min(batch_start + self.config.batch_size, len(pending_records))
            batch = pending_records[batch_start:batch_end]

            texts = [r["structured_text"] for r in batch]
            ids = [r["song_id"] for r in batch]
            metadatas = [r["metadata"] for r in batch]

            # Generate embeddings
            embeddings = self.embedder.embed_batch(texts, task_type="RETRIEVAL_DOCUMENT")

            # Prepare Pinecone vector tuples: (id, vector, metadata)
            vectors_to_upsert = [
                (song_id, vector, meta)
                for song_id, vector, meta in zip(ids, embeddings, metadatas)
            ]

            # Upsert into Pinecone
            self.pinecone_mgr.upsert_vectors(
                vectors=vectors_to_upsert,
                namespace=self.config.namespace,
            )

            # Update checkpoint
            completed_ids.update(ids)
            self._save_checkpoint(completed_ids)

            logger.info(
                f"[Batch {batch_idx + 1}/{total_batches}] Successfully upserted "
                f"{len(vectors_to_upsert)} songs to Pinecone "
                f"(Total Progress: {len(completed_ids)}/{len(records)} songs)."
            )

            if self.config.batch_delay > 0 and (batch_idx + 1) < total_batches:
                time.sleep(self.config.batch_delay)

        elapsed = time.time() - start_time
        logger.info("=" * 80)
        logger.info(f"INGESTION COMPLETED in {elapsed:.1f} seconds! Total songs in index: {len(completed_ids)}")
        logger.info("=" * 80)

        # 4. Verification & Dry Run Query
        self.verify_retrieval()

    def verify_retrieval(self):
        """Runs describe_index_stats and performs test similarity searches."""
        logger.info("\n" + "=" * 80)
        logger.info("STEP 5: VERIFICATION & DRY RUN SIMILARITY SEARCH")
        logger.info("=" * 80)

        # Check index stats
        stats = self.pinecone_mgr.get_stats()
        logger.info(f"Pinecone Index Stats: {stats}")

        test_queries = [
            "නින්ද නේන රාත්‍රියේ ගීතයේ තාලය සහ අර්ථය",
            "සුනිල් එදිරිසිංහ ගැයූ ගීත",
        ]

        for query_text in test_queries:
            logger.info(f"\n--- Testing Semantic Search for Query: '{query_text}' ---")
            query_vector = self.embedder.embed_query(query_text)
            results = self.pinecone_mgr.similarity_search(
                query_vector=query_vector,
                top_k=3,
                namespace=self.config.namespace,
            )

            matches = results.get("matches", []) if isinstance(results, dict) else results.matches
            if not matches:
                logger.warning("No matches found for query!")
                continue

            for rank, match in enumerate(matches, 1):
                m_score = match.get("score") if isinstance(match, dict) else match.score
                m_meta = match.get("metadata", {}) if isinstance(match, dict) else match.metadata
                m_title = m_meta.get("title", "Unknown Title")
                m_artist = m_meta.get("artist", "Unknown Artist")
                m_emotion = m_meta.get("dominant_emotion", "N/A")
                m_diff = m_meta.get("difficulty", "N/A")
                m_meaning = m_meta.get("normalized_meaning", "")
                m_lyrics = m_meta.get("lyrics_preview", "")

                print(f"\n[Rank {rank}] Similarity Score: {m_score:.4f}")
                print(f"  Song Title:        {m_title}")
                print(f"  Artist:            {m_artist}")
                print(f"  Dominant Emotion:  {m_emotion}")
                print(f"  Difficulty Score:  {m_diff}")
                if m_meaning:
                    print(f"  Expert Meaning:    {m_meaning[:120]}...")
                print(f"  Lyrics Preview:    {m_lyrics[:120].strip()}...")


# --------------------------------------------------------------------------------------
# CLI Entrypoint
# --------------------------------------------------------------------------------------
def parse_arguments() -> argparse.Namespace:
    """Parses command-line arguments for the ingestion CLI."""
    parser = argparse.ArgumentParser(
        description="Naada Classical Sinhala Songs RAG Ingestion Pipeline",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--file",
        type=str,
        default=None,
        help="Path to the Excel dataset (mathaka_sinhala_classical_songs (2).xlsx)",
    )
    parser.add_argument(
        "--sheet",
        type=str,
        default="Strict Classical Maestros",
        help="Target sheet to ingest ('Strict Classical Maestros' or 'Classical & Golden Era')",
    )
    parser.add_argument(
        "--index-name",
        type=str,
        default="naada-music-index",
        help="Target Pinecone index name",
    )
    parser.add_argument(
        "--namespace",
        type=str,
        default="_default_",
        help="Pinecone namespace to upsert records into",
    )
    parser.add_argument(
        "--pinecone-env",
        type=str,
        default="us-east-1",
        help="Pinecone serverless region/environment",
    )
    parser.add_argument(
        "--model",
        type=str,
        default="gemini-embedding-001",
        help="Gemini embedding model name",
    )
    parser.add_argument(
        "--dimension",
        type=int,
        default=None,
        help="Embedding vector dimension (if None, auto-detected from Pinecone index)",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=25,
        help="Batch size for embedding and upserting (recommended: 20-30 for free tier limits)",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=1.5,
        help="Delay in seconds between batches to respect rate limits",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Limit number of songs to ingest (useful for dry runs and validation)",
    )
    parser.add_argument(
        "--skip-checkpoint",
        action="store_true",
        help="Ignore ingestion checkpoint and re-process all songs",
    )
    parser.add_argument(
        "--test-only",
        action="store_true",
        help="Skip ingestion and run only the dry-run verification queries",
    )
    parser.add_argument(
        "--gemini-api-key",
        type=str,
        default=None,
        help="Override Gemini API key",
    )
    parser.add_argument(
        "--pinecone-api-key",
        type=str,
        default=None,
        help="Override Pinecone API key",
    )
    return parser.parse_args()


def main():
    args = parse_arguments()
    config = PipelineConfig(args)
    config.validate()

    pipeline = IngestionPipeline(config)
    pipeline.run()


if __name__ == "__main__":
    main()
