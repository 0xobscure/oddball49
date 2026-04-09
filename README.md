# Oddball49

**The numbers nobody picks.**

A game theory engine for Singapore Pools TOTO that optimizes *conditional payout* — not win probability. Built on 1,832 verified draws spanning 2008–2026.

## Live Demo

[oddball49.github.io](https://0xobscure.github.io/oddball49/)

## The Core Insight

All TOTO combinations have equal probability (1 in 13,983,816). But they don't have equal *expected payout*. When you win, you split the jackpot with co-winners. Oddball49 picks the numbers that other players avoid — maximizing your share if you hit.

## Features

- 1,832-draw frequency analysis with Chi-Square testing
- Hot/Cold number tracking across configurable windows (All / 50 / 20)
- Sum trends with moving average, odd/even splits, consecutive pairs
- Nash Equilibrium payout matrix & EV analysis
- Birthday zone bias analysis (1-31 vs 32-49)
- Strategy-informed number generator (6 modes)
- Serial independence testing between draws

## Strategies

| Strategy | Approach | Edge |
|----------|----------|------|
| **Contrarian** | Cold + high-zone numbers | Fewest co-winners → largest payout |
| **Balanced** | Even spread across 1-49 | Structural coverage |
| **Overdue** | Longest gap since drawn | Anti-recency hedge |
| **Hot** | Most frequently drawn | Baseline comparison |
| **High Zone** | Anti-birthday bias (32-49) | Exploits documented player bias |
| **Composite Contrarian** | All edges combined | High zone + anti-hot + min spacing |

## Data

- `data/draws.csv` — Canonical draw history (1,832 draws, 2008–2026)
- `src/draws.json` — Pre-processed JSON for the dashboard
- `scripts/backfill.py` — Utility to extend the dataset

### Adding New Draws

**Manual entry:**
```bash
python3 scripts/backfill.py --manual
# Enter: YYYY-MM-DD n1 n2 n3 n4 n5 n6 additional
# Type 'done' to finish
```

**Bulk import from file:**
```bash
python3 scripts/backfill.py --import draws.txt
```
File format: one draw per line — `YYYY-MM-DD n1 n2 n3 n4 n5 n6 additional`

After adding draws, regenerate the JSON:
```bash
python3 -c "
import csv, json
rows = list(csv.DictReader(open('data/draws.csv')))
draws = [{'d':r['date'],'n':sorted([int(r[f'n{i}']) for i in range(1,7)]),'a':int(r['add'])} for r in rows]
json.dump(draws, open('src/draws.json','w'))
print(f'Updated {len(draws)} draws')
"
```

All statistics are computed client-side — even 1,800+ draws take milliseconds.

## Development

```bash
npm install
npm run dev
```

Open [localhost:5173](http://localhost:5173)

## Deploy

Push to `main` — GitHub Actions builds and deploys to GitHub Pages automatically.

## Tech Stack

- React 18 + Vite
- Recharts for data visualization
- Pure inline styles (no CSS dependencies)
- GitHub Pages via GitHub Actions

## Disclaimer

Educational and entertainment only. Lottery outcomes are random. No strategy improves win probability — only conditional payout. The house always has a mathematical edge. Please gamble responsibly.

## License

MIT
