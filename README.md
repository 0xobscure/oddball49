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
