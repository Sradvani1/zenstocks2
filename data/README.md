# Seed data

## `universe.json` (Phase 4)

Source file for `symbols/universe` Firestore collection. Deploy via seed script (Phase 4).

**Launch target:** ~100 largest US equities by market cap. Expand later by appending entries and re-running seed.

```json
[
  { "symbol": "AAPL", "name": "Apple Inc.", "rank": 1 },
  { "symbol": "MSFT", "name": "Microsoft Corporation", "rank": 2 }
]
```

| Field | Type | Notes |
|-------|------|-------|
| `symbol` | string | Uppercase ticker; becomes document ID |
| `name` | string | Display name for picker UI |
| `rank` | number | Sort order (1 = largest at seed time) |

**Governance:** [ADR 0002](../docs/adr/0002-fixed-symbol-universe.md)
