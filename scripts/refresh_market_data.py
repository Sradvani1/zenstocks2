#!/usr/bin/env python3
"""Manual batch ingest for universe symbols. Run locally; not deployed as Cloud Function."""

from __future__ import annotations

import sys
import traceback
import json
import os
from datetime import date, datetime, timezone

import firebase_admin
import yfinance as yf
from firebase_admin import firestore

MIN_HISTORY_DAYS = 90
JOB_NAME = "refreshMarketData"


def yfinance_ticker(symbol: str) -> str:
    return symbol.replace(".", "-")


def today_utc() -> str:
    return date.today().isoformat()


def init_firestore() -> firestore.Client:
    if not firebase_admin._apps:
        rc_path = os.path.join(os.path.dirname(__file__), "..", ".firebaserc")
        with open(rc_path, encoding="utf-8") as f:
            project_id = json.load(f)["projects"]["default"]
        print(f"Using Firestore project: {project_id}")
        firebase_admin.initialize_app(options={"projectId": project_id})
    return firestore.client()


def universe_entries(db: firestore.Client) -> list[firestore.DocumentSnapshot]:
    col = (
        db.collection("symbols")
        .document("universe")
        .collection("entries")
    )
    return list(col.stream())


def count_history_docs(db: firestore.Client, symbol: str) -> int:
    history = db.collection("quotes").document(symbol).collection("history")
    return len(list(history.limit(MIN_HISTORY_DAYS).stream()))


def upsert_quote(
    db: firestore.Client,
    symbol: str,
    name: str,
    currency: str,
    last_price: float,
    previous_close: float,
    as_of_date: str,
) -> None:
    change = last_price - previous_close
    change_percent = (change / previous_close * 100) if previous_close else 0.0
    db.collection("quotes").document(symbol).set(
        {
            "symbol": symbol,
            "name": name,
            "currency": currency,
            "lastPrice": last_price,
            "previousClose": previous_close,
            "change": change,
            "changePercent": change_percent,
            "asOfDate": as_of_date,
            "updatedAt": firestore.SERVER_TIMESTAMP,
        },
        merge=True,
    )


def upsert_history_bars(
    db: firestore.Client,
    symbol: str,
    hist,
) -> None:
    history_col = db.collection("quotes").document(symbol).collection("history")
    batch = db.batch()
    batch_count = 0

    for idx, (ts, row) in enumerate(hist.iterrows()):
        bar_date = ts.strftime("%Y-%m-%d")
        ref = history_col.document(bar_date)
        batch.set(
            ref,
            {
                "date": bar_date,
                "open": float(row["Open"]),
                "high": float(row["High"]),
                "low": float(row["Low"]),
                "close": float(row["Close"]),
                "volume": int(row["Volume"]),
            },
            merge=True,
        )
        batch_count += 1
        if batch_count >= 400:
            batch.commit()
            batch = db.batch()
            batch_count = 0

    if batch_count:
        batch.commit()


def eps_from_income_stmt(stmt) -> list[dict]:
    """Extract reported EPS per period from yfinance income statement."""
    if stmt is None or stmt.empty:
        return []

    eps_row = None
    for label in ("Diluted EPS", "Basic EPS"):
        if label in stmt.index:
            eps_row = label
            break
    if eps_row is None:
        return []

    rows: list[dict] = []
    for period_end, value in stmt.loc[eps_row].items():
        if value is None or (isinstance(value, float) and value != value):
            continue
        rows.append(
            {
                "fiscalDateEnding": period_end.strftime("%Y-%m-%d"),
                "reportedEPS": float(value),
            }
        )
    return rows


def upsert_fundamentals(db: firestore.Client, symbol: str, ticker: yf.Ticker) -> None:
    quarterly_raw = eps_from_income_stmt(ticker.quarterly_income_stmt)
    quarterly = [
        {**row, "estimatedEPS": None}
        for row in quarterly_raw
    ]
    annual = eps_from_income_stmt(ticker.income_stmt)

    db.collection("quotes").document(symbol).collection("fundamentals").document(
        "latest"
    ).set(
        {
            "quarterlyEarnings": quarterly,
            "annualEarnings": annual,
            "updatedAt": firestore.SERVER_TIMESTAMP,
        },
        merge=True,
    )


def process_symbol(db: firestore.Client, symbol: str, display_name: str) -> None:
    yf_symbol = yfinance_ticker(symbol)
    ticker = yf.Ticker(yf_symbol)
    info = ticker.info or {}
    name = info.get("shortName") or info.get("longName") or display_name
    currency = info.get("currency") or "USD"

    need_backfill = count_history_docs(db, symbol) < MIN_HISTORY_DAYS
    period = "6mo" if need_backfill else "5d"
    hist = ticker.history(period=period, auto_adjust=False)

    if hist.empty:
        raise ValueError(f"No price history returned for {symbol}")

    last_row = hist.iloc[-1]
    last_ts = hist.index[-1]
    as_of_date = last_ts.strftime("%Y-%m-%d")
    last_price = float(last_row["Close"])

    previous_close = last_price
    if len(hist) > 1:
        previous_close = float(hist.iloc[-2]["Close"])
    elif info.get("previousClose") is not None:
        previous_close = float(info["previousClose"])

    upsert_quote(
        db,
        symbol,
        name,
        currency,
        last_price,
        previous_close,
        as_of_date,
    )
    upsert_history_bars(db, symbol, hist)
    upsert_fundamentals(db, symbol, ticker)
    print(f"  {symbol}: quote asOf={as_of_date}, history rows={len(hist)}")


def main() -> int:
    run_date = today_utc()
    run_id = f"{JOB_NAME}_{run_date}"
    db = init_firestore()
    run_ref = db.collection("pipelineRuns").document(run_id)

    now = datetime.now(timezone.utc)
    weekday = now.weekday()
    if weekday >= 5:
        print(
            f"Weekend ({run_date}): ingest may use last trading day bars from yfinance."
        )

    run_ref.set(
        {
            "jobName": JOB_NAME,
            "date": run_date,
            "status": "running",
            "startedAt": firestore.SERVER_TIMESTAMP,
            "completedAt": None,
            "error": None,
            "retryCount": 0,
        },
        merge=True,
    )

    symbols = universe_entries(db)
    if not symbols:
        msg = "No symbols in symbols/universe/entries"
        run_ref.set(
            {
                "status": "failed",
                "completedAt": firestore.SERVER_TIMESTAMP,
                "error": msg,
            },
            merge=True,
        )
        print(msg, file=sys.stderr)
        return 1

    print(f"Processing {len(symbols)} universe symbols...")
    errors: list[str] = []

    for doc in symbols:
        data = doc.to_dict() or {}
        symbol = data.get("symbol") or doc.id
        display_name = data.get("name") or symbol
        try:
            process_symbol(db, symbol, display_name)
        except Exception as exc:  # noqa: BLE001 — per-symbol continue
            msg = f"{symbol}: {exc}"
            print(f"  ERROR {msg}", file=sys.stderr)
            errors.append(msg)

    status = "success" if not errors else "failed"
    error_summary = "; ".join(errors[:5])
    if len(errors) > 5:
        error_summary += f" (+{len(errors) - 5} more)"

    run_ref.set(
        {
            "status": status,
            "completedAt": firestore.SERVER_TIMESTAMP,
            "error": error_summary if errors else None,
        },
        merge=True,
    )

    print(f"Done: {status} ({len(errors)} symbol errors)")
    return 0 if status == "success" else 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception:
        traceback.print_exc()
        raise SystemExit(1) from None
