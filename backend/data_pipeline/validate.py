# Validation utilities for the data pipeline

import csv
import uuid
from datetime import datetime
from typing import List, Tuple, Dict

# Helper validation functions

def _is_valid_uuid(value: str) -> bool:
    try:
        uuid.UUID(value)
        return True
    except ValueError:
        return False


def _is_iso8601_with_tz(value: str) -> bool:
    try:
        dt = datetime.fromisoformat(value)
        return dt.tzinfo is not None
    except ValueError:
        return False


def _float_in_range(value: str, min_val: float, max_val: float) -> bool:
    try:
        f = float(value)
        return min_val <= f <= max_val and not (f != f)  # check finite
    except ValueError:
        return False


def _int_in_range(value: str, min_val: int, max_val: int) -> bool:
    try:
        i = int(value)
        return min_val <= i <= max_val
    except ValueError:
        return False

# Energy CSV validation

def validate_energy_csv(path: str) -> Tuple[List[Dict[str, str]], List[str]]:
    """Validate an energy CSV file.

    Returns a tuple of (valid_rows, errors). ``valid_rows`` is a list of dicts
    (as read by ``csv.DictReader``) that passed all checks. ``errors`` is a list
    of human‑readable messages, each prefixed with the CSV line number (starting
    at 2 for the first data row).
    """
    required_fields = ["machine_id", "timestamp", "energy_kwh", "power_kw"]
    errors: List[str] = []
    valid_rows: List[Dict[str, str]] = []
    seen = set()
    with open(path, newline="") as f:
        reader = csv.DictReader(f)
        if reader.fieldnames is None:
            errors.append("File has no header row")
            return [], errors
        missing = set(required_fields) - set(reader.fieldnames)
        if missing:
            errors.append(f"Missing columns: {', '.join(sorted(missing))}")
            # continue to collect other errors
        for line_no, row in enumerate(reader, start=2):
            # Duplicate detection based on (machine_id, timestamp)
            dup_key = (row.get("machine_id"), row.get("timestamp"))
            if dup_key in seen:
                errors.append(f"Line {line_no}: duplicate record for machine_id {dup_key[0]} at {dup_key[1]}")
                continue
            seen.add(dup_key)
            # Per‑row error collection
            row_errors: List[str] = []
            if not _is_valid_uuid(row.get("machine_id", "")):
                row_errors.append(f"Line {line_no}: invalid machine_id UUID")
            if not _is_iso8601_with_tz(row.get("timestamp", "")):
                row_errors.append(f"Line {line_no}: timestamp must be ISO-8601 with timezone")
            if not _float_in_range(row.get("energy_kwh", ""), 0, 1_000_000):
                row_errors.append(f"Line {line_no}: energy_kwh out of range 0-1,000,000")
            if not _float_in_range(row.get("power_kw", ""), 0, 100_000):
                row_errors.append(f"Line {line_no}: power_kw out of range 0-100,000")
            if row_errors:
                errors.extend(row_errors)
            else:
                valid_rows.append(row)
    return valid_rows, errors

# Production CSV validation

def validate_production_csv(path: str) -> Tuple[List[Dict[str, str]], List[str]]:
    """Validate a production CSV file.

    Returns (valid_rows, errors) analogous to ``validate_energy_csv``.
    """
    required_fields = ["factory_id", "production_line_id", "timestamp", "production_units", "shift"]
    optional_fields = ["machine_id"]
    errors: List[str] = []
    valid_rows: List[Dict[str, str]] = []
    seen = set()
    with open(path, newline="") as f:
        reader = csv.DictReader(f)
        if reader.fieldnames is None:
            errors.append("File has no header row")
            return [], errors
        missing = set(required_fields) - set(reader.fieldnames)
        if missing:
            errors.append(f"Missing columns: {', '.join(sorted(missing))}")
        unexpected = set(reader.fieldnames) - set(required_fields) - set(optional_fields)
        if unexpected:
            errors.append(f"Unexpected columns: {', '.join(sorted(unexpected))}")
        for line_no, row in enumerate(reader, start=2):
            dup_key = (
                row.get("factory_id"),
                row.get("production_line_id"),
                row.get("machine_id"),
                row.get("timestamp"),
            )
            if dup_key in seen:
                errors.append(f"Line {line_no}: duplicate production record")
                continue
            seen.add(dup_key)
            row_errors: List[str] = []
            if not _is_valid_uuid(row.get("factory_id", "")):
                row_errors.append(f"Line {line_no}: invalid factory_id UUID")
            if not _is_valid_uuid(row.get("production_line_id", "")):
                row_errors.append(f"Line {line_no}: invalid production_line_id UUID")
            machine_id_val = row.get("machine_id", "")
            if machine_id_val and not _is_valid_uuid(machine_id_val):
                row_errors.append(f"Line {line_no}: invalid machine_id UUID")
            if not _is_iso8601_with_tz(row.get("timestamp", "")):
                row_errors.append(f"Line {line_no}: timestamp must be ISO-8601 with timezone")
            if not _int_in_range(row.get("production_units", ""), 0, 10_000_000):
                row_errors.append(f"Line {line_no}: production_units out of range 0-10,000,000")
            if row.get("shift", "").lower() not in {"night", "day", "evening"}:
                row_errors.append(f"Line {line_no}: invalid shift (must be night, day, or evening)")
            if row_errors:
                errors.extend(row_errors)
            else:
                valid_rows.append(row)
    return valid_rows, errors
