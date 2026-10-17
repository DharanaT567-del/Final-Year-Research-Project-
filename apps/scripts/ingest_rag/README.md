# Naada AI Music Tutor — Offline RAG Vector Ingestion Pipeline

High-performance offline data ingestion and embedding pipeline designed to process, vectorize, and ingest curated Sinhala classical songs into **Pinecone** for retrieval-augmented generation (RAG) in the **Naada Spring Boot AI Gateway**.

---

## 📌 Architecture & Design Overview

```
                                  +─────────────────────────────────────────+
                                  | mathaka_sinhala_classical_songs (2).xlsx |
                                  | - Primary: Strict Classical Maestros     |
                                  | - Secondary: Classical & Golden Era     |
                                  +────────────────────┬────────────────────+
                                                       |
                                                       v
                                       +───────────────────────────────+
                                       |       Dataset Processor       |
                                       | - Filters empty lyrics        |
                                       | - Formulates structured text  |
                                       | - Normalizes emotions (0-100%)|
                                       | - Normalizes difficulty (0-10)|
                                       | - Previews & sanitizes meta   |
                                       +───────────────┬───────────────+
                                                       |
                                                       v
                                       +───────────────────────────────+
                                       |        Gemini Embedder        |
                                       | - Model: gemini-embedding-001 |
                                       |   (or text-embedding-004)     |
                                       | - Auto-aligns dimension (3072)|
                                       | - Task: RETRIEVAL_DOCUMENT    |
                                       | - Exponential backoff/retry   |
                                       +───────────────┬───────────────+
                                                       |
                                                       v
                                       +───────────────────────────────+
                                       |        Pinecone Manager       |
                                       | - Index: naada-music-index    |
                                       | - Metric: cosine              |
                                       | - Namespace: _default_        |
                                       | - Compatible with Spring AI   |
                                       |   (document_content & text)   |
                                       +───────────────┬───────────────+
                                                       |
                                                       v
                                  +─────────────────────────────────────────+
                                  |       Spring Boot AI Gateway            |
                                  | - TutorService (ChatClient + Advisor)   |
                                  | - VectorStore similarity search (top_k) |
                                  +─────────────────────────────────────────+
```

---

## 📁 Directory Layout

```
apps/scripts/ingest_rag/
├── .env                          # Local credentials (ignored by git)
├── .env.example                  # Environment configuration template
├── requirements.txt              # Pipeline dependencies (pandas, pinecone, etc.)
├── ingest_songs.py               # Complete, executable ingestion CLI
├── ingestion_checkpoint.json     # State tracking for interrupted runs
└── README.md                     # Engineering documentation
```

---

## ⚙️ Configuration & Key Precedence

The pipeline resolves configuration in the following order:
1. **CLI Arguments** (e.g., `--index-name`, `--batch-size`)
2. **Local `.env` File** (`apps/scripts/ingest_rag/.env`)
3. **OS Environment Variables** (`GEMINI_API_KEY`, `PINECONE_API_KEY`)
4. **Spring Boot `application.properties`** (`apps/apigateway/src/main/resources/application.properties`)

### `.env` Parameters:
```dotenv
GEMINI_API_KEY=your_gemini_api_key_here
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_NAME=naada-music-index
PINECONE_ENVIRONMENT=us-east-1
PINECONE_NAMESPACE=_default_
EMBEDDING_MODEL=gemini-embedding-001
EMBEDDING_DIMENSION=3072
BATCH_SIZE=50
BATCH_DELAY_SECONDS=0.5
```

> **Spring Boot Compatibility Note**: `naada-music-index` in Pinecone operates at **dimension 3072**, matching Spring AI's default Gemini embedding configuration. Metadata records store both `document_content` (used by Spring AI's `QuestionAnswerAdvisor`) and `text` for universal compatibility.

---

## 🚀 Setup & Execution

### 1. Activate the Virtual Environment
On Windows (PowerShell):
```powershell
.\apps\scripts\ingest_rag\.venv\Scripts\Activate.ps1
```
Or run directly via the `.venv` Python executable:
```powershell
& ".\apps\scripts\ingest_rag\.venv\Scripts\python.exe" apps/scripts/ingest_rag/ingest_songs.py --help
```

### 2. Verify Pinecone Connectivity & Dry-Run Search
Run a quick test search without re-ingesting documents:
```powershell
& ".\apps\scripts\ingest_rag\.venv\Scripts\python.exe" apps/scripts/ingest_rag/ingest_songs.py --test-only
```

### 3. Run a Dry Run with Sample Batch (e.g., First 10 Records)
```powershell
& ".\apps\scripts\ingest_rag\.venv\Scripts\python.exe" apps/scripts/ingest_rag/ingest_songs.py --limit 10 --skip-checkpoint
```

### 4. Run Full Dataset Ingestion
Ingests the primary verified classical songs sheet (`Strict Classical Maestros`, 2,028 songs):
```powershell
& ".\apps\scripts\ingest_rag\.venv\Scripts\python.exe" apps/scripts/ingest_rag/ingest_songs.py --batch-size 50 --delay 0.5
```

### 5. Ingest Secondary Target Sheet (Optional)
To ingest the secondary sheet (`Classical & Golden Era`, 3,159 songs):
```powershell
& ".\apps\scripts\ingest_rag\.venv\Scripts\python.exe" apps/scripts/ingest_rag/ingest_songs.py --sheet "Classical & Golden Era" --batch-size 50 --delay 0.5
```

---

## 🛠️ CLI Options Reference

| Flag | Default | Description |
|---|---|---|
| `--file` | `apps/docs/mathaka_sinhala_classical_songs (2).xlsx` | Path to dataset Excel file |
| `--sheet` | `Strict Classical Maestros` | Target sheet name |
| `--index-name` | `naada-music-index` | Pinecone index name |
| `--namespace` | `_default_` | Pinecone namespace |
| `--pinecone-env` | `us-east-1` | Pinecone Serverless cloud region |
| `--model` | `gemini-embedding-001` | Google GenAI embedding model |
| `--dimension` | Auto-detected (3072) | Vector dimension |
| `--batch-size` | `50` | Batch size per upsert request |
| `--delay` | `0.5` | Sleep delay (seconds) between batches to prevent rate limits |
| `--limit` | `None` (all) | Limit number of songs to process |
| `--skip-checkpoint`| `False` | Ignore checkpoint and re-process songs |
| `--test-only` | `False` | Run only the dry-run semantic verification search |
| `--gemini-api-key` | Env / Properties | Override Gemini API Key |
| `--pinecone-api-key`| Env / Properties | Override Pinecone API Key |

---

## 🧠 Checkpoint & Fault-Tolerance

- Every successful batch automatically saves its progress into `checkpoint_<index_name>.json`.
- If an API rate limit, network failure, or manual cancellation (`Ctrl+C`) occurs, re-running the script will automatically **resume from where it stopped**, avoiding redundant embedding costs and upserts.
- Use `--skip-checkpoint` if you wish to overwrite existing records.
