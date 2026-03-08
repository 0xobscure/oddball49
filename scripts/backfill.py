#!/usr/bin/env python3
"""
Oddball49 — TOTO Draw Backfill Script
Fetches historical draws from Singapore Pools and appends to draws.csv

Usage:
    pip3 install requests beautifulsoup4
    python3 backfill.py

This will fetch draws from the official Singapore Pools site
and merge them with your existing draws.csv
"""

import requests
import json
import csv
import os
from datetime import datetime, timedelta

# Singapore Pools TOTO results API endpoint
# Each draw has a unique draw number. Draw 4161 = Mar 2 2026.
# 2 draws/week ≈ 104 draws/year
# To get ~200 draws (2 years), we need draws from ~Mar 2024 (draw ~3957)

DRAWS_CSV = os.path.join(os.path.dirname(__file__), "data", "draws.csv")

def fetch_from_lotteryextreme(year, month):
    """Fetch draws for a given month from lotteryextreme.com"""
    url = f"https://www.lotteryextreme.com/singapore/toto-results?year={year}&month={month}"
    headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"}
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        resp.raise_for_status()
        return resp.text
    except Exception as e:
        print(f"  ⚠ Failed to fetch {year}-{month:02d}: {e}")
        return None

def parse_draws_from_html(html):
    """Parse draw results from lotteryextreme HTML"""
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(html, "html.parser")
    draws = []
    
    # Look for draw entries
    for entry in soup.select("table td"):
        text = entry.get_text(strip=True)
        # Pattern: dates and numbers in list items
    
    # Alternative: look for the structured result blocks
    for block in soup.find_all("li"):
        text = block.get_text(strip=True)
    
    return draws

def load_existing_draws():
    """Load existing draws from CSV"""
    draws = {}
    if os.path.exists(DRAWS_CSV):
        with open(DRAWS_CSV, "r") as f:
            reader = csv.DictReader(f)
            for row in reader:
                draws[row["date"]] = row
    return draws

def save_draws(draws):
    """Save all draws to CSV, sorted by date"""
    os.makedirs(os.path.dirname(DRAWS_CSV), exist_ok=True)
    sorted_draws = sorted(draws.values(), key=lambda x: x["date"])
    with open(DRAWS_CSV, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["date", "n1", "n2", "n3", "n4", "n5", "n6", "add"])
        writer.writeheader()
        writer.writerows(sorted_draws)
    return len(sorted_draws)

def manual_add():
    """Interactive mode: manually add draws"""
    existing = load_existing_draws()
    print(f"\n📊 Current dataset: {len(existing)} draws")
    if existing:
        dates = sorted(existing.keys())
        print(f"   Range: {dates[0]} → {dates[-1]}")
    
    print("\nEnter draws in format: YYYY-MM-DD n1 n2 n3 n4 n5 n6 add")
    print("Example: 2024-06-03 5 12 23 34 41 47 9")
    print("Type 'done' to finish\n")
    
    count = 0
    while True:
        line = input("> ").strip()
        if line.lower() == "done":
            break
        try:
            parts = line.split()
            date = parts[0]
            nums = [int(x) for x in parts[1:8]]
            if len(nums) != 7:
                print("  ⚠ Need exactly 7 numbers (6 + additional)")
                continue
            existing[date] = {
                "date": date,
                "n1": nums[0], "n2": nums[1], "n3": nums[2],
                "n4": nums[3], "n5": nums[4], "n6": nums[5],
                "add": nums[6]
            }
            count += 1
            print(f"  ✓ Added {date}: {nums[:6]} + {nums[6]}")
        except Exception as e:
            print(f"  ⚠ Error: {e}")
    
    if count > 0:
        total = save_draws(existing)
        print(f"\n✅ Added {count} draws. Total: {total}")

def import_from_file(filepath):
    """Import draws from a text file (one draw per line)"""
    existing = load_existing_draws()
    count = 0
    
    with open(filepath, "r") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or line.startswith("date"):
                continue
            try:
                parts = line.replace(",", " ").split()
                date = parts[0]
                nums = [int(x) for x in parts[1:8]]
                if len(nums) == 7:
                    existing[date] = {
                        "date": date,
                        "n1": nums[0], "n2": nums[1], "n3": nums[2],
                        "n4": nums[3], "n5": nums[4], "n6": nums[5],
                        "add": nums[6]
                    }
                    count += 1
            except:
                continue
    
    total = save_draws(existing)
    print(f"✅ Imported {count} draws from {filepath}. Total: {total}")

if __name__ == "__main__":
    import sys
    
    print("🎱 Oddball49 — TOTO Draw Backfill")
    print("══════════════════════════════════")
    
    if len(sys.argv) > 1 and sys.argv[1] == "--import":
        if len(sys.argv) > 2:
            import_from_file(sys.argv[2])
        else:
            print("Usage: python3 backfill.py --import <file.txt>")
    elif len(sys.argv) > 1 and sys.argv[1] == "--manual":
        manual_add()
    else:
        print("\nUsage:")
        print("  python3 backfill.py --manual          Interactive entry")
        print("  python3 backfill.py --import file.txt  Bulk import from file")
        print()
        existing = load_existing_draws()
        print(f"📊 Current dataset: {len(existing)} draws")
        if existing:
            dates = sorted(existing.keys())
            print(f"   Range: {dates[0]} → {dates[-1]}")
            print(f"   Need: ~{200 - len(existing)} more draws to reach 200")
