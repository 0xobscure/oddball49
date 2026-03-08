# 🎱 Oddball49

**The numbers nobody picks.**

A game theory engine for Singapore Pools TOTO that optimizes *conditional payout* — not win probability. Built on 100+ draws of statistical analysis.

## Live Demo

👉 [**oddball49.github.io**](https://0xobscure.github.io/oddball49/)

## The Core Insight

All TOTO combinations have equal probability (1 in 13,983,816). But they don't have equal *expected payout*. When you win, you split the jackpot with co-winners. Oddball49 picks the numbers that other players avoid — maximizing your share if you hit.

## Features

- 📊 100+ draw frequency analysis with Chi-Square testing
- 🔥 Hot/Cold number tracking across configurable windows (All / 50 / 20)
- 📈 Sum trends with moving average, odd/even splits, consecutive pairs
- 🧠 Nash Equilibrium payout matrix & EV analysis
- ❄️ Birthday zone bias analysis (1-31 vs 32-49)
- 🎲 Strategy-informed number generator (Contrarian, Balanced, Overdue, Random)
- 🔬 Serial independence testing between draws

## Strategies

| Strategy | Approach | Edge |
|----------|----------|------|
| **Contrarian** | Cold + high-zone numbers | Fewest co-winners → largest payout |
| **Balanced** | Even spread across 1-49 | Structural coverage |
| **Overdue** | Longest gap since drawn | Gambler's fallacy hedge |
| **Random** | Uniform baseline | Control group |

## Data

- `data/draws.csv` — Verified TOTO draw results
- `src/draws.json` — JSON format for the dashboard
- `scripts/backfill.py` — Utility to extend the dataset

### Adding New Draws

**Option 1 — Manual entry:**
```bash
python3 scripts/backfill.py --manual
# Enter: YYYY-MM-DD n1 n2 n3 n4 n5 n6 additional
# Example: 2026-03-10 5 12 23 34 41 47 9
# Type 'done' to finish
```

**Option 2 — Bulk import from file:**
```bash
python3 scripts/backfill.py --import draws.txt
```
File format: one draw per line — `YYYY-MM-DD n1 n2 n3 n4 n5 n6 additional`

Both options update `data/draws.csv`. After adding draws, update the dashboard JSON:
```bash
python3 -c "
import csv, json
rows = list(csv.DictReader(open('data/draws.csv')))
draws = [{'d':r['date'],'n':sorted([int(r[f'n{i}']) for i in range(1,7)]),'a':int(r['add'])} for r in rows]
json.dump(draws, open('src/draws.json','w'))
print(f'Updated {len(draws)} draws')
"
```

Then rebuild: `npm run build`

**Re-analysis is instant** — all statistics are computed client-side. Even 500+ draws take milliseconds.

## Development

```bash
npm install
npm run dev
```

Open [localhost:5173](http://localhost:5173)

## Deploy to GitHub Pages

Push to `main` — GitHub Actions handles the rest.

## Tech Stack

- React 18 + Vite
- Recharts for data visualization
- Pure inline styles (zero CSS dependencies)
- GitHub Pages deployment

## Disclaimer

Educational and entertainment only. Lottery outcomes are random. No strategy improves win probability — only conditional payout. The house always has a mathematical edge. Please gamble responsibly.

## License

MIT
