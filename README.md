# 🎱 Oddball49

**The numbers nobody picks.**

A game theory engine for Singapore Pools TOTO that optimizes *conditional payout* — not win probability. Built on 100+ draws of statistical analysis.

## The Core Insight

All TOTO combinations have equal probability (1 in 13,983,816). But they don't have equal *expected payout*. When you win, you split the jackpot with co-winners. Oddball49 picks the numbers that other players avoid — maximizing your share if you hit.

## Features

- 📊 100-draw frequency analysis with Chi-Square testing
- 🔥 Hot/Cold number tracking across configurable windows
- 📈 Sum trends, odd/even splits, consecutive pair detection
- 🧠 Nash Equilibrium payout matrix
- ❄️ Birthday zone bias analysis (1-31 vs 32-49)
- 🎲 Strategy-informed number generator (Contrarian, Balanced, Overdue, Random)

## Strategies

| Strategy | Approach | Edge |
|----------|----------|------|
| Contrarian | Cold + high-zone numbers | Fewest co-winners |
| Balanced | Even spread across 1-49 | Structural coverage |
| Overdue | Longest gap since drawn | Gambler's fallacy hedge |
| Anti-Pattern | Avoid popular combos | Shape-based divergence |

## Disclaimer

Educational and entertainment only. Lottery outcomes are random. No strategy improves win probability — only conditional payout. Please gamble responsibly.

## License

MIT
