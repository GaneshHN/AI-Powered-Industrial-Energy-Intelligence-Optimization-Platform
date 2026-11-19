# Ingestion utilities for the data pipeline

"""Command‑line tool to validate and (optionally) upload generated CSV files.

Usage example::

    python -m backend.data_pipeline.ingest \
        --base-url http://localhost:8000 \
        --username alice@example.com \
        --password secret \
        --energy-csv data/energy.csv \
        --production-csv data/production.csv

    # Preview only (default) – shows how many rows would be sent.
    # Add ``--send`` to actually POST the data to the API.
"""

import argparse
import json
import sys
from pathlib import Path
from typing import List, Dict, Tuple

import httpx

from .validate import validate_energy_csv, validate_production_csv


def _login(base_url: str, username: str, password: str, timeout: float = 10.0) -> str:
    """Authenticate against ``/api/auth/login`` and return a bearer token.

    The endpoint is expected to return JSON ``{"access_token": "..."}``.
    Raises ``RuntimeError`` with a clear message on failure.
    """
    login_url = f"{base_url.rstrip('/')}/api/auth/login"
    try:
        resp = httpx.post(
            login_url,
            json={"username": username, "password": password},
            timeout=timeout,
        )
    except Exception as exc:
        raise RuntimeError(f"Login request failed: {exc}") from exc
    if resp.status_code != 200:
        raise RuntimeError(
            f"Login failed (status {resp.status_code}): {resp.text}"
        )
    try:
        token = resp.json()["access_token"]
    except Exception as exc:
        raise RuntimeError("Login response missing 'access_token' field") from exc
    return token


def _post_rows(
    rows: List[Dict[str, str]],
    endpoint: str,
    token: str,
    timeout: float = 10.0,
) -> Tuple[int, str]:
    """POST a list of row dicts to ``endpoint`` using Bearer auth.

    Returns ``(status_code, response_text)``.
    """
    headers = {"Authorization": f"Bearer {token}"}
    try:
        resp = httpx.post(
            endpoint,
            json=rows,
            headers=headers,
            timeout=timeout,
        )
    except Exception as exc:
        return 0, f"Request error: {exc}"
    return resp.status_code, resp.text


def _preview(rows: List[Dict[str, str]], name: str) -> None:
    """Print a short preview of the rows that would be uploaded."""
    print(f"--- {name} preview ---")
    print(f"Total rows: {len(rows)}")
    if rows:
        sample = rows[:3]
        print("Sample rows (first 3):")
        print(json.dumps(sample, indent=2))
    print("--- end preview ---\n")


def main(argv: List[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Validate and optionally upload data pipeline CSVs")
    parser.add_argument("--base-url", required=True, help="Base URL of the backend API (e.g., http://localhost:8000)")
    parser.add_argument("--username", required=True, help="Username for API login")
    parser.add_argument("--password", required=True, help="Password for API login")
    parser.add_argument("--energy-csv", required=True, type=Path, help="Path to the energy CSV file")
    parser.add_argument("--production-csv", required=True, type=Path, help="Path to the production CSV file")
    parser.add_argument(
        "--send",
        action="store_true",
        help="If supplied, data will be POSTed to the API after successful validation",
    )
    args = parser.parse_args(argv)

    # Validate CSVs first
    energy_valid, energy_errors = validate_energy_csv(str(args.energy_csv))
    prod_valid, prod_errors = validate_production_csv(str(args.production_csv))
    if energy_errors:
        print("Energy CSV validation errors:")
        for e in energy_errors:
            print(e)
    if prod_errors:
        print("Production CSV validation errors:")
        for e in prod_errors:
            print(e)
    if energy_errors or prod_errors:
        print("Validation failed – aborting.")
        return 1

    # Preview mode (default)
    _preview(energy_valid, "Energy")
    _preview(prod_valid, "Production")

    if not args.send:
        print("Preview only – no data sent. Use --send to upload.")
        return 0

    # Perform upload
    try:
        token = _login(args.base_url, args.username, args.password)
    except RuntimeError as exc:
        print(f"Authentication error: {exc}")
        return 1

    # Energy endpoint
    energy_endpoint = f"{args.base_url.rstrip('/')}/api/energy/readings"
    status, text = _post_rows(energy_valid, energy_endpoint, token)
    print(f"Energy upload response: {status}\n{text}\n")

    # Production endpoint
    prod_endpoint = f"{args.base_url.rstrip('/')}/api/production"
    status, text = _post_rows(prod_valid, prod_endpoint, token)
    print(f"Production upload response: {status}\n{text}\n")

    return 0


if __name__ == "__main__":
    sys.exit(main())
