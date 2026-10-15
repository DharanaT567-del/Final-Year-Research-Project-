"""Collect and clean Sinhala song lyrics from the Mathaka open API."""

from __future__ import annotations

import argparse
import csv
import hashlib
import html
import json
import logging
import re
import time
import unicodedata
from pathlib import Path
from typing import Any, Iterator
from urllib.parse import quote, urljoin

import pandas as pd
import requests
from bs4 import BeautifulSoup
from requests.adapters import HTTPAdapter
from tqdm import tqdm
from urllib3.util.retry import Retry

BASE_URL = "https://mathaka.org"
API_URL = f"{BASE_URL}/api"
RAW_OUTPUT = "mathaka_sinhala_songs_10000.csv"
CLEAN_OUTPUT = "mathaka_sinhala_clean_dataset.csv"
CHECKPOINT = "mathaka_progress.jsonl"
STATE_FILE = "mathaka_state.json"
FIELDS = [
    "song_id", "song_title", "artist_name", "composer", "lyricist",
    "lyrics", "album_or_movie", "year", "category", "source_url",
]


class MathakaClient:
    """API client with proof-of-work refresh, retries, and rate limiting."""

    def __init__(self, delay: float = 0.35, timeout: float = 30.0) -> None:
        self.delay = delay
        self.timeout = timeout
        self.last_request = 0.0
        self.token = ""
        self.token_expires_at = 0
        self.session = requests.Session()
        retry = Retry(
            total=4,
            backoff_factor=1,
            status_forcelist=(429, 500, 502, 503, 504),
            allowed_methods=frozenset({"GET", "POST"}),
            raise_on_status=False,
        )
        self.session.mount("https://", HTTPAdapter(max_retries=retry))
        self.session.headers.update({
            "User-Agent": "MathakaSinhalaResearchDataset/1.0 (academic research)",
            "Accept": "application/json, text/html;q=0.9",
        })

    def _wait(self) -> None:
        elapsed = time.monotonic() - self.last_request
        if elapsed < self.delay:
            time.sleep(self.delay - elapsed)

    def _request(self, method: str, url: str, **kwargs: Any) -> requests.Response:
        self._wait()
        response = self.session.request(method, url, timeout=self.timeout, **kwargs)
        self.last_request = time.monotonic()
        response.raise_for_status()
        return response

    def authenticate(self) -> None:
        challenge = self._request("POST", f"{API_URL}/request-challenge").json()
        prefix = challenge["prefix"]
        target = int(challenge["target"], 16)
        nonce = 0
        while True:
            candidate = str(nonce)
            digest = hashlib.sha256((prefix + candidate).encode("utf-8")).hexdigest()
            if int(digest, 16) <= target:
                self.token = f"{prefix}:{candidate}"
                self.token_expires_at = int(challenge["expiresAt"])
                return
            nonce += 1

    def get_json(self, path: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
        now_ms = int(time.time() * 1000)
        if not self.token or now_ms >= self.token_expires_at - 30_000:
            self.authenticate()
        headers = {"Authorization": f"Bearer {self.token}"}
        try:
            return self._request("GET", f"{API_URL}{path}", params=params, headers=headers).json()
        except requests.HTTPError as error:
            if error.response is not None and error.response.status_code in (401, 403):
                self.authenticate()
                headers["Authorization"] = f"Bearer {self.token}"
                return self._request("GET", f"{API_URL}{path}", params=params, headers=headers).json()
            raise

    def get_html(self, url: str) -> str:
        return self._request("GET", url).text


def read_checkpoint(path: Path) -> dict[str, dict[str, Any]]:
    records: dict[str, dict[str, Any]] = {}
    if not path.exists():
        return records
    with path.open("r", encoding="utf-8") as stream:
        for line in stream:
            try:
                record = json.loads(line)
            except json.JSONDecodeError:
                continue
            key = str(record.get("song_id") or record.get("source_url") or "")
            if key:
                records[key] = record
    return records


def write_state(path: Path, records: dict[str, dict[str, Any]], failed: int) -> None:
    path.write_text(
        json.dumps({"collected": len(records), "failed_requests": failed}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def iter_song_summaries(client: MathakaClient, queries: list[str]) -> Iterator[dict[str, Any]]:
    """Yield unique songs from the paginated listing and optional searches."""
    seen: set[str] = set()

    def pages(path: str, params: dict[str, Any], key: str) -> Iterator[dict[str, Any]]:
        page = 1
        total_pages = 1
        while page <= total_pages:
            payload = client.get_json(path, {**params, "page": page, "limit": 50})
            pagination = payload.get("pagination", {})
            total_pages = int(pagination.get("pages", page))
            for song in payload.get(key, []):
                song_id = str(song.get("id") or "")
                if song_id and song_id not in seen:
                    seen.add(song_id)
                    yield song
            page += 1

    try:
        yield from pages("/songs", {}, "songs")
    except requests.RequestException as error:
        logging.error("Song listing failed: %s", error)
    for query in queries:
        try:
            yield from pages("/search", {"q": query}, "songs")
        except requests.RequestException as error:
            logging.error("Search failed for %r: %s", query, error)


def make_source_url(summary: dict[str, Any]) -> str:
    for key in ("source_url", "url", "path"):
        value = summary.get(key)
        if value:
            return urljoin(BASE_URL, str(value))
    return f"{API_URL}/songs/{quote(str(summary['id']))}"


def parse_html_detail(client: MathakaClient, url: str, summary: dict[str, Any]) -> dict[str, Any]:
    soup = BeautifulSoup(client.get_html(url), "html.parser")
    heading = soup.find(lambda tag: tag.name in {"h2", "h3"} and "Lyrics" in tag.get_text())
    lyrics = ""
    if heading:
        parts: list[str] = []
        for sibling in heading.find_all_next():
            if sibling.name in {"h2", "h3"} and sibling is not heading:
                break
            if sibling.name in {"p", "div"}:
                value = sibling.get_text("\n", strip=True)
                if value:
                    parts.append(value)
        lyrics = "\n".join(parts)
    return {**summary, "lyrics": lyrics, "source_url": url}


def detail_record(client: MathakaClient, summary: dict[str, Any]) -> dict[str, Any]:
    song_id = str(summary["id"])
    try:
        detail = client.get_json(f"/songs/{quote(song_id)}")
    except (requests.RequestException, ValueError, KeyError):
        source_url = make_source_url(summary)
        if source_url.startswith(f"{API_URL}/"):
            raise
        return parse_html_detail(client, source_url, summary)
    singers = detail.get("singers", [])
    artist = detail.get("artist_names_si") or detail.get("artist_names")
    if not artist:
        artist = ", ".join(str(item.get("name_si") or item.get("name") or "") for item in singers)
    return {
        "song_id": song_id,
        "song_title": detail.get("name_si") or detail.get("name") or summary.get("name_si") or summary.get("name"),
        "artist_name": artist or "",
        "composer": detail.get("composer_name_si") or detail.get("composer_name") or "",
        "lyricist": detail.get("writer_name_si") or detail.get("writer_name") or "",
        "lyrics": detail.get("lyrics") or "",
        "album_or_movie": detail.get("album") or "",
        "year": detail.get("year") or detail.get("release_year") or "",
        "category": detail.get("category") or "",
        "source_url": make_source_url({**summary, **detail}),
    }


def clean_sinhala_text(value: Any) -> str:
    text = html.unescape(str(value or ""))
    text = BeautifulSoup(text, "html.parser").get_text(" ")
    text = unicodedata.normalize("NFC", text).replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[\u200b\u200c\u200d\ufeff]", "", text)
    text = re.sub(r"[ \t]+", " ", text)
    lines: list[str] = []
    seen: set[str] = set()
    for line in text.split("\n"):
        line = re.sub(r"[^\w\s,.'!?;:()\-\u0d80-\u0dff]", "", line, flags=re.UNICODE).strip()
        if line and line not in seen:
            seen.add(line)
            lines.append(line)
    return "\n".join(lines)


def write_csv(path: Path, records: list[dict[str, Any]]) -> None:
    with path.open("w", newline="", encoding="utf-8-sig") as stream:
        writer = csv.DictWriter(stream, fieldnames=FIELDS, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(records)


def clean_dataset(raw_path: Path, clean_path: Path) -> int:
    frame = pd.read_csv(raw_path, dtype=str, keep_default_na=False)
    for column in ("song_title", "artist_name", "composer", "lyricist", "lyrics", "album_or_movie", "category"):
        frame[column] = frame[column].map(clean_sinhala_text)
    frame["year"] = frame["year"].fillna("")
    before = len(frame)
    frame = frame.drop_duplicates(subset=["song_id"], keep="first")
    frame = frame[frame["lyrics"].str.strip().ne("")]
    frame = frame.drop_duplicates(subset=["lyrics"], keep="first")
    frame.to_csv(clean_path, index=False, encoding="utf-8-sig")
    return before - len(frame)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--target", type=int, default=10000)
    parser.add_argument("--delay", type=float, default=0.35)
    parser.add_argument("--output-dir", type=Path, default=Path("."))
    parser.add_argument("--query", action="append", default=[])
    parser.add_argument("--no-clean", action="store_true")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)
    checkpoint_path = args.output_dir / CHECKPOINT
    records = read_checkpoint(checkpoint_path)
    failed = 0
    queries = args.query or list("අආඇඈඈඉඊඋඑඔකගචජටඩතදනපබමයරලවශසහ") + list("abcdefghijklmnopqrstuvwxyz")
    client = MathakaClient(delay=args.delay)
    with checkpoint_path.open("a", encoding="utf-8") as checkpoint:
        progress = tqdm(total=args.target, initial=min(len(records), args.target), desc="Collecting songs", unit="song")
        for summary in iter_song_summaries(client, queries):
            song_id = str(summary.get("id") or "")
            if len(records) >= args.target:
                break
            if not song_id or song_id in records:
                continue
            try:
                record = detail_record(client, summary)
                records[song_id] = record
                checkpoint.write(json.dumps(record, ensure_ascii=False) + "\n")
                checkpoint.flush()
                progress.update(1)
                if len(records) % 25 == 0:
                    write_state(args.output_dir / STATE_FILE, records, failed)
                    tqdm.write(f"Collected songs: {len(records)}/{args.target} | Duplicates removed: 0 | Failed requests: {failed}")
            except (requests.RequestException, ValueError, KeyError) as error:
                failed += 1
                logging.error("Failed song %s: %s", song_id, error)
        progress.close()
    write_csv(args.output_dir / RAW_OUTPUT, list(records.values()))
    duplicate_count = 0 if args.no_clean else clean_dataset(args.output_dir / RAW_OUTPUT, args.output_dir / CLEAN_OUTPUT)
    write_state(args.output_dir / STATE_FILE, records, failed)
    print(f"Collected songs: {len(records)}/{args.target}")
    print(f"Duplicates removed: {duplicate_count}")
    print(f"Failed requests: {failed}")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    main()