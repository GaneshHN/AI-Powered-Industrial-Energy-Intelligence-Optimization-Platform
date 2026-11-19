import json
import uuid
import tempfile
from pathlib import Path
from unittest import mock

import pytest

from backend.data_pipeline.generator import generate_all
from backend.data_pipeline.validate import (
    validate_energy_csv,
    validate_production_csv,
)
from backend.data_pipeline import ingest

# ----------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------
def _run_ingest(args: list[str], capsys) -> tuple[int, str]:
    """Call ingest.main() with supplied args and capture its stdout+stderr.
    Returns (exit_code, combined_output)."""
    exit_code = ingest.main(args)
    captured = capsys.readouterr()
    return exit_code, captured.out + captured.err

# ----------------------------------------------------------------------
# 1. Deterministic generation – two runs with same seed produce identical files
# ----------------------------------------------------------------------
def test_generate_deterministic_repeatable():
    factory = uuid.UUID("11111111-1111-1111-1111-111111111111")
    line = uuid.UUID("22222222-2222-2222-2222-222222222222")
    machines = [uuid.UUID("33333333-3333-3333-3333-333333333333")]

    with tempfile.TemporaryDirectory() as td1, tempfile.TemporaryDirectory() as td2:
        base1 = Path(td1)
        base2 = Path(td2)
        e1, p1 = generate_all(base1, factory, line, machines, days=1, seed=123)
        e2, p2 = generate_all(base2, factory, line, machines, days=1, seed=123)
        # compare file contents byte‑for‑byte
        assert e1.read_bytes() == e2.read_bytes()
        assert p1.read_bytes() == p2.read_bytes()

# ----------------------------------------------------------------------
# 2. Validation edge cases – missing columns, invalid UUID, naive timestamp, etc.
# ----------------------------------------------------------------------
def _write_csv(path: Path, header: str, rows: list[str]):
    with open(path, "w", newline="") as f:
        f.write(header + "\n")
        f.writelines("\n".join(rows))

def test_missing_columns():
    with tempfile.TemporaryDirectory() as td:
        csv_path = Path(td) / "energy.csv"
        _write_csv(csv_path, "machine_id,timestamp,energy_kwh", ["a,b,1"])
        _, errors = validate_energy_csv(str(csv_path))
        assert any("Missing columns" in e for e in errors)

def test_invalid_uuid():
    with tempfile.TemporaryDirectory() as td:
        csv_path = Path(td) / "energy.csv"
        _write_csv(csv_path, "machine_id,timestamp,energy_kwh,power_kw", ["not-a-uuid,2023-01-01T00:00:00+00:00,10,100"])
        _, errors = validate_energy_csv(str(csv_path))
        assert any("invalid machine_id UUID" in e for e in errors)

def test_naive_timestamp():
    with tempfile.TemporaryDirectory() as td:
        csv_path = Path(td) / "energy.csv"
        _write_csv(csv_path, "machine_id,timestamp,energy_kwh,power_kw", ["11111111-1111-1111-1111-111111111111,2023-01-01T00:00:00,10,100"])
        _, errors = validate_energy_csv(str(csv_path))
        assert any("timestamp must be ISO-8601 with timezone" in e for e in errors)

def test_negative_values():
    with tempfile.TemporaryDirectory() as td:
        csv_path = Path(td) / "energy.csv"
        _write_csv(csv_path, "machine_id,timestamp,energy_kwh,power_kw", ["11111111-1111-1111-1111-111111111111,2023-01-01T00:00:00+00:00,-5,100"])
        _, errors = validate_energy_csv(str(csv_path))
        assert any("energy_kwh out of range" in e for e in errors)

def test_exceed_limits():
    with tempfile.TemporaryDirectory() as td:
        csv_path = Path(td) / "energy.csv"
        _write_csv(csv_path, "machine_id,timestamp,energy_kwh,power_kw", ["11111111-1111-1111-1111-111111111111,2023-01-01T00:00:00+00:00,2000000,200000"])
        _, errors = validate_energy_csv(str(csv_path))
        assert any("energy_kwh out of range" in e for e in errors)
        assert any("power_kw out of range" in e for e in errors)

def test_invalid_shift():
    with tempfile.TemporaryDirectory() as td:
        csv_path = Path(td) / "prod.csv"
        _write_csv(
            csv_path,
            "factory_id,production_line_id,machine_id,timestamp,production_units,shift",
            [
                "11111111-1111-1111-1111-111111111111,22222222-2222-2222-2222-222222222222,,2023-01-01T00:00:00+00:00,100,invalid"
            ],
        )
        _, errors = validate_production_csv(str(csv_path))
        assert any("invalid shift" in e for e in errors)

def test_duplicate_records():
    with tempfile.TemporaryDirectory() as td:
        csv_path = Path(td) / "energy.csv"
        rows = [
            "11111111-1111-1111-1111-111111111111,2023-01-01T00:00:00+00:00,10,100",
            "11111111-1111-1111-1111-111111111111,2023-01-01T00:00:00+00:00,20,200",
        ]
        _write_csv(csv_path, "machine_id,timestamp,energy_kwh,power_kw", rows)
        _, errors = validate_energy_csv(str(csv_path))
        assert any("duplicate record" in e for e in errors)

def test_empty_input():
    with tempfile.TemporaryDirectory() as td:
        csv_path = Path(td) / "energy.csv"
        _write_csv(csv_path, "machine_id,timestamp,energy_kwh,power_kw", [])
        rows, errors = validate_energy_csv(str(csv_path))
        assert rows == [] and errors == []

# ----------------------------------------------------------------------
# 3. Ingest preview – must make absolutely zero HTTP requests (including login)
# ----------------------------------------------------------------------
@mock.patch("httpx.post")
def test_ingest_preview_no_http(mock_post, capsys):
    with tempfile.TemporaryDirectory() as td:
        base = Path(td)
        energy_path, prod_path = generate_all(
            base,
            uuid.UUID("11111111-1111-1111-1111-111111111111"),
            uuid.UUID("22222222-2222-2222-2222-222222222222"),
            [uuid.UUID("33333333-3333-3333-3333-333333333333")],
            days=1,
            seed=0,
        )
        rc, out = _run_ingest(
            [
                "--base-url",
                "http://dummy",
                "--username",
                "u",
                "--password",
                "p",
                "--energy-csv",
                str(energy_path),
                "--production-csv",
                str(prod_path),
            ],
            capsys,
        )
        assert rc == 0
        assert "Preview only" in out
        mock_post.assert_not_called()

# ----------------------------------------------------------------------
# 4. Ingest with validation failure – must abort before any POST (login or data)
# ----------------------------------------------------------------------
@mock.patch("httpx.post")
def test_ingest_fails_on_invalid_csv(mock_post, capsys):
    with tempfile.TemporaryDirectory() as td:
        # invalid energy CSV (negative value)
        energy_csv = Path(td) / "energy.csv"
        _write_csv(
            energy_csv,
            "machine_id,timestamp,energy_kwh,power_kw",
            ["11111111-1111-1111-1111-111111111111,2023-01-01T00:00:00+00:00,-5,100"],
        )
        # valid production CSV
        prod_csv = Path(td) / "prod.csv"
        _write_csv(
            prod_csv,
            "factory_id,production_line_id,machine_id,timestamp,production_units,shift",
            ["11111111-1111-1111-1111-111111111111,22222222-2222-2222-2222-222222222222,,2023-01-01T00:00:00+00:00,100,day"],
        )
        rc, out = _run_ingest(
            [
                "--base-url",
                "http://dummy",
                "--username",
                "u",
                "--password",
                "p",
                "--energy-csv",
                str(energy_csv),
                "--production-csv",
                str(prod_csv),
                "--send",
            ],
            capsys,
        )
        assert rc == 1
        assert "Validation failed" in out
        # No HTTP calls at all (login or upload)
        mock_post.assert_not_called()
