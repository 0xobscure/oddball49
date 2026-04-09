#!/usr/bin/env python3
"""
Oddball49 — Fetch Latest TOTO Draw
Runs via GitHub Actions after each draw (Mon/Thu ~9:30 PM SGT).
Fetches the latest result, checks for duplicates, updates CSV + JSON.

Exit codes:
  0 — no new draw (already up to date)
  1 — error
  2 — new draw added (triggers commit in workflow)
"""

import csv
import json
import os
import re
import sys
from datetime import datetime

import requests
from bs4 import BeautifulSoup

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(ROOT, "data", "draws.csv")
JSON_PATH = os.path.join(ROOT, "src", "draws.json")

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; oddball49-updater/1.0)"}


# ---------------------------------------------------------------------------
# Data helpers
# ---------------------------------------------------------------------------

def load_existing() -> dict[str, dict]:
    existing = {}
    if os.path.exists(CSV_PATH):
        with open(CSV_PATH, newline="") as f:
            for row in csv.DictReader(f):
                existing[row["date"]] = row
    return existing


def save(draws: dict[str, dict]) -> int:
    rows = sorted(draws.values(), key=lambda r: r["date"])

    with open(CSV_PATH, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["date", "n1", "n2", "n3", "n4", "n5", "n6", "add"])
        writer.writeheader()
        writer.writerows(rows)

    json_draws = [
        {
            "d": r["date"],
            "n": sorted([int(r[f"n{i}"]) for i in range(1, 7)]),
            "a": int(r["add"]),
        }
        for r in rows
    ]
    with open(JSON_PATH, "w") as f:
        json.dump(json_draws, f)

    return len(rows)


# ---------------------------------------------------------------------------
# Fetcher — Singapore Pools results page
# ---------------------------------------------------------------------------

def parse_date(raw: str) -> str | None:
    """Normalise draw date to YYYY-MM-DD."""
    raw = raw.strip()
    for fmt in ("%d %b %Y", "%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y"):
        try:
            return datetime.strptime(raw, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None


def fetch_from_singapore_pools() -> dict | None:
    """
    Scrape latest draw from Singapore Pools results page.
    Returns a draw dict or None on failure.
    """
    url = "https://www.singaporepools.com.sg/en/product/sr/Pages/toto_results.aspx"
    print(f"Fetching: {url}")
    resp = requests.get(url, headers=HEADERS, timeout=20)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")

    # Draw date — look for a heading or label containing the date
    date_str = None
    for tag in soup.find_all(["h2", "h3", "h4", "p", "span", "div"]):
        text = tag.get_text(strip=True)
        # Match patterns like "09 Apr 2026" or "09/04/2026"
        m = re.search(r"\d{1,2}\s+\w{3}\s+\d{4}|\d{2}/\d{2}/\d{4}", text)
        if m:
            date_str = parse_date(m.group())
            if date_str:
                break

    if not date_str:
        print("Could not find draw date in page")
        return None

    # Winning numbers — look for 6 numbers in 1-49 range
    all_text = soup.get_text()
    number_blocks = re.findall(r"\b([1-9]|[1-3][0-9]|4[0-9])\b", all_text)

    # Find 6 consecutive unique numbers in 1-49 that make sense as a draw
    numbers = [int(x) for x in number_blocks if 1 <= int(x) <= 49]

    # Try to find a run of 6 unique numbers close together in the text
    draw_nums = None
    add_num = None
    for i in range(len(numbers) - 6):
        window = numbers[i:i+6]
        if len(set(window)) == 6 and all(1 <= n <= 49 for n in window):
            sorted_w = sorted(window)
            # Additional number is the next unique number after the 6
            for j in range(i+6, min(i+8, len(numbers))):
                candidate = numbers[j]
                if candidate not in window and 1 <= candidate <= 49:
                    draw_nums = sorted_w
                    add_num = candidate
                    break
            if draw_nums:
                break

    if not draw_nums or not add_num:
        print("Could not parse winning numbers from page")
        return None

    return {
        "date": date_str,
        "n1": draw_nums[0], "n2": draw_nums[1], "n3": draw_nums[2],
        "n4": draw_nums[3], "n5": draw_nums[4], "n6": draw_nums[5],
        "add": add_num,
    }


def fetch_from_json_api() -> dict | None:
    """
    Try Singapore Pools JSON data file (used by their mobile app).
    Returns a draw dict or None on failure.
    """
    url = "https://www.singaporepools.com.sg/DataFileArchive/Lottery/Output/toto_result_draw_sg.json"
    print(f"Trying JSON API: {url}")
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        print(f"JSON API response keys: {list(data.keys()) if isinstance(data, dict) else type(data)}")

        # Try common response shapes
        draw = None
        if isinstance(data, list):
            draw = data[0]
        elif isinstance(data, dict):
            for key in ["draws", "results", "data", "totoResult"]:
                if key in data:
                    draw = data[key][0] if isinstance(data[key], list) else data[key]
                    break
            if not draw:
                draw = data

        if not draw:
            return None

        # Extract date
        raw_date = None
        for key in ["drawDate", "date", "drawOn", "resultDate"]:
            if key in draw:
                raw_date = str(draw[key])
                break
        date_str = parse_date(raw_date) if raw_date else None

        # Extract numbers
        nums = None
        for key in ["winningNumbers", "numbers", "winNums", "num"]:
            if key in draw:
                nums = sorted([int(n) for n in draw[key]])
                break

        add = None
        for key in ["additionalNumber", "addNum", "bonus", "additional"]:
            if key in draw:
                add = int(draw[key])
                break

        if date_str and nums and len(nums) == 6 and add:
            return {
                "date": date_str,
                "n1": nums[0], "n2": nums[1], "n3": nums[2],
                "n4": nums[3], "n5": nums[4], "n6": nums[5],
                "add": add,
            }

    except Exception as e:
        print(f"JSON API failed: {e}")

    return None


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    existing = load_existing()
    latest_date = max(existing.keys()) if existing else "none"
    print(f"Dataset: {len(existing)} draws, latest: {latest_date}")

    # Try JSON API first, fall back to HTML scrape
    draw = fetch_from_json_api() or fetch_from_singapore_pools()

    if not draw:
        print("ERROR: Could not fetch latest draw from any source")
        return 1

    date = draw["date"]
    print(f"Fetched draw: {date} — {[draw[f'n{i}'] for i in range(1,7)]} + {draw['add']}")

    if date in existing:
        print(f"Already have {date} — nothing to update")
        return 0

    existing[date] = {k: str(v) for k, v in draw.items()}
    total = save(existing)
    print(f"Added {date}. Dataset now: {total} draws")
    return 2


if __name__ == "__main__":
    sys.exit(main())
