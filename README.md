# Mathaka Sinhala Lyrics Dataset Scraper

This project collects Sinhala song metadata and lyrics from the Mathaka open REST API for NLP research. The script uses proof-of-work authentication, paginated `/songs` discovery, and `/songs/{uuid}` detail requests. Sinhala and English search queries are supplementary coverage; song names are never manually entered.

## Project structure

```text
.
├── mathaka_scraper.py
├── requirements.txt
├── mathaka_progress.jsonl
├── mathaka_state.json
├── mathaka_sinhala_songs_10000.csv
└── mathaka_sinhala_clean_dataset.csv
```

## Installation and run

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
py -m pip install -r requirements.txt
py mathaka_scraper.py --target 10000 --delay 0.5
```

The script writes the requested raw and cleaned CSV files. Progress is appended to `mathaka_progress.jsonl` after every song, so rerunning the command resumes completed records. `mathaka_state.json` stores collection counters. Use `--output-dir data` to keep generated files separate.

Optional controls:

```powershell
py mathaka_scraper.py --target 10500 --delay 1.0 --output-dir data
py mathaka_scraper.py --target 10000 --query "ආදර" --query "පෙම්"
py mathaka_scraper.py --target 10000 --no-clean
```

## Output

Both CSV files contain `song_id`, `song_title`, `artist_name`, `composer`, `lyricist`, `lyrics`, `album_or_movie`, `year`, `category`, and `source_url`. Missing fields remain empty. The clean dataset normalizes Sinhala Unicode to NFC, removes HTML and invisible formatting characters, removes unnecessary symbols and repeated lyric lines, and drops duplicate lyric records while preserving Sinhala text.

The client sends a descriptive `User-Agent`, retries transient failures, refreshes the five-minute API token, throttles requests, and prints `Collected songs`, `Duplicates removed`, and `Failed requests`. Increase `--target` for larger datasets; the script stops when the unique API song IDs are exhausted. Keep a conservative delay and check Mathaka's current terms at `https://mathaka.org/en/api-docs` before publishing derived data.
