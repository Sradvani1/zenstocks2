#!/usr/bin/env python3
"""Generate company news articles via Gemini + Google Search grounding."""

from __future__ import annotations

import json
import os
import sys
import traceback
from datetime import date

import firebase_admin
from firebase_admin import firestore
from google import genai
from google.genai import types

JOB_NAME = "generateArticles"
MODEL_NAME = "gemini-2.5-flash"


def today_utc() -> str:
    return date.today().isoformat()


def init_firestore() -> firestore.Client:
    if not firebase_admin._apps:
        rc_path = os.path.join(os.path.dirname(__file__), "..", ".firebaserc")
        with open(rc_path, encoding="utf-8") as f:
            project_id = json.load(f)["projects"]["default"]
        print(f"Using Firestore project: {project_id}")
        cred_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
        if cred_path:
            cred = firebase_admin.credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred, options={"projectId": project_id})
        else:
            firebase_admin.initialize_app(options={"projectId": project_id})
    return firestore.client()


def universe_entries(db: firestore.Client) -> list[firestore.DocumentSnapshot]:
    col = (
        db.collection("symbols")
        .document("universe")
        .collection("entries")
    )
    return list(col.stream())


def get_company_name(db: firestore.Client, symbol: str, fallback: str) -> str:
    """Read display name from quotes/{symbol} doc if available."""
    doc = db.collection("quotes").document(symbol).get()
    if doc.exists:
        data = doc.to_dict() or {}
        return data.get("name") or fallback
    return fallback


def generate_article(client: genai.Client, symbol: str, name: str) -> dict:
    """Two-pass Gemini generation: grounded search → JSON structuring."""

    # Pass 1 — Grounded company news search
    prompt = f"""Find and summarize news from the past 7 days about {name} ({symbol}).

Focus ONLY on:
- Product launches, updates, and announcements
- Service expansions or changes
- Customer-facing developments
- Partnerships, acquisitions, or business deals
- Leadership or organizational changes that affect products

DO NOT include:
- Stock analyst commentary or ratings
- Price targets or earnings speculation
- Stock price movement narratives
- Financial analyst opinions
- Trading volume or technical analysis

Write a factual news briefing based on what you find."""

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
        config=types.GenerateContentConfig(
            tools=[types.Tool(google_search=types.GoogleSearch())],
        ),
    )
    raw_content = response.text

    # Pass 2 — JSON structuring
    structure_prompt = f"""Given this company news briefing, produce a JSON object:
{{
  "headline": "concise headline about the most notable development",
  "summary": "2-3 sentence preview suitable for a news card",
  "body": "full article in markdown, 3-5 paragraphs, factual tone"
}}

Briefing:
{raw_content}"""

    result = client.models.generate_content(
        model=MODEL_NAME,
        contents=structure_prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
        ),
    )
    article = json.loads(result.text)
    return article


def process_symbol(
    client: genai.Client, db: firestore.Client, symbol: str, name: str, run_date: str
) -> None:
    article = generate_article(client, symbol, name)

    db.collection("articles").document(symbol).collection("entries").document(run_date).set(
        {
            "symbol": symbol,
            "date": run_date,
            "headline": article["headline"],
            "summary": article["summary"],
            "body": article["body"],
            "generatedAt": firestore.SERVER_TIMESTAMP,
            "model": MODEL_NAME,
        },
        merge=True,
    )
    print(f"  {symbol}: \"{article['headline'][:60]}...\"")


def main() -> int:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("GEMINI_API_KEY environment variable is required", file=sys.stderr)
        return 1

    client = genai.Client(api_key=api_key)

    run_date = today_utc()
    run_id = f"{JOB_NAME}_{run_date}"
    db = init_firestore()
    run_ref = db.collection("pipelineRuns").document(run_id)

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

    # Determine symbols to process
    if len(sys.argv) > 1:
        target_symbol = sys.argv[1].upper()
        symbols_to_process = [(target_symbol, target_symbol)]
        print(f"Processing single symbol: {target_symbol}")
    else:
        entries = universe_entries(db)
        if not entries:
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
        symbols_to_process = []
        for doc in entries:
            data = doc.to_dict() or {}
            symbol = data.get("symbol") or doc.id
            display_name = data.get("name") or symbol
            symbols_to_process.append((symbol, display_name))
        print(f"Processing {len(symbols_to_process)} universe symbols...")

    errors: list[str] = []

    for symbol, display_name in symbols_to_process:
        name = get_company_name(db, symbol, display_name)
        try:
            process_symbol(client, db, symbol, name, run_date)
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
