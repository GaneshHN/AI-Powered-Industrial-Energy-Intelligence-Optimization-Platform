# Member 4 – Data Pipeline Documentation

## Overview

The **Data Pipeline** package (`backend/data_pipeline/`) provides a self‑contained set of utilities for:

1. **Generating** deterministic CSV files that simulate realistic industrial energy and production data.
2. **Validating** those CSV files against the backend API contracts.
3. **Ingesting** the CSV data into the existing FastAPI backend via the authenticated REST endpoints.

All three components are completely isolated from the rest of the code‑base – they live in a separate package and never modify existing teammate files.

---

## 1. Generator (`generator.py`)

### Public API
```python
from pathlib import Path
import uuid
from backend.data_pipeline.generator import generate_all, generate_energy_csv, generate_production_csv
```
* `generate_energy_csv(output_path, machine_ids, days=7, seed=42) -> Path`
* `generate_production_csv(output_path, factory_id, line_id, machine_ids=None, days=7, seed=42) -> Path`
* `generate_all(base_dir, factory_id, line_id, machine_ids, days=7, seed=42) -> Tuple[Path, Path]`

### Behaviour
* **Deterministic** – the same `seed` produces identical CSV contents.
* **Configurable** – you supply the UUIDs for factories, production lines and machines, plus the number of days.
* **Hourly timestamps** – UTC timestamps (`+00:00`) at the start of each hour.
* **Realistic patterns** – a sinusoidal daily pattern plus normally‑distributed noise.
* **Limits** – values are capped to the backend API maximums (`energy_kwh ≤ 1 000 000`, `power_kw ≤ 100 000`, `production_units ≤ 10 000 000`).

### Example usage
```bash
python - <<PY
import uuid, pathlib
from backend.data_pipeline.generator import generate_all

base = pathlib.Path("./generated")
factory = uuid.UUID("11111111-1111-1111-1111-111111111111")
line    = uuid.UUID("22222222-2222-2222-2222-222222222222")
machines = [uuid.UUID("33333333-3333-3333-3333-333333333333")]

energy_csv, prod_csv = generate_all(base, factory, line, machines, days=3, seed=123)
print("Energy CSV:", energy_csv)
print("Production CSV:", prod_csv)
PY
```
The command creates `energy.csv` and `production.csv` under `./generated/`.

---

## 2. Validator (`validate.py`)

Two helper functions perform CSV validation and return **valid rows** together with a list of **human‑readable error messages**.

```python
from backend.data_pipeline.validate import validate_energy_csv, validate_production_csv
```
* `validate_energy_csv(path) -> (List[Dict], List[str])`
* `validate_production_csv(path) -> (List[Dict], List[str])`

### Validation rules
| Field | Requirement |
|-------|--------------|
| UUID columns (`machine_id`, `factory_id`, `production_line_id`) | Must be a valid UUID string. |
| `timestamp` | ISO‑8601 with timezone (`datetime.fromisoformat` must yield a `tzinfo`). |
| Numeric columns (`energy_kwh`, `power_kw`, `production_units`) | Must be a finite number within the API limits and non‑negative. |
| `shift` (production) | One of `night`, `day`, `evening` (case‑insensitive). |
| Required columns | All columns listed in the contract must be present. |
| Duplicate rows | Detected by primary‑key combinations and reported as errors. |

The validator **does not modify** the CSV file; it only reads it.

---

## 3. Ingestion CLI (`ingest.py`)

A small command‑line tool that ties generation, validation and the backend API together.

### Invocation
```bash
python -m backend.data_pipeline.ingest \
    --base-url http://localhost:8000 \
    --username alice@example.com \
    --password secret \
    --energy-csv path/to/energy.csv \
    --production-csv path/to/production.csv   # preview (default)
```
Add `--send` to actually POST the data after successful validation.

### Behaviour
1. **Validate** both CSV files first. If any validation error is present the program prints the errors and exits with status `1` – **no HTTP request is made**.
2. **Preview mode** (default) prints the number of rows and a JSON‑style sample of the first three rows for each file, then exits with status `0`.
3. When `--send` is supplied:
   * Authenticates against `POST /api/auth/login` (expects JSON `{"username":…, "password":…}`) and extracts `access_token`.
   * POSTs the list of validated rows to `POST /api/energy/readings` and `/api/production` using the Bearer token.
   * Prints the HTTP status code and response body for each upload.
4. All network calls use **httpx** with a configurable timeout (default 10 s).

### Safety notes
* **Never** uploads when validation fails.
* No credentials are stored on disk; they are passed via CLI arguments only.
* The tool does **not** write to the database directly – it always goes through the existing API endpoints.
* The generator never contacts the backend; it only writes CSV files.

---

## 4. Testing

The test suite (`backend/tests/test_data_pipeline.py`) covers:
* Deterministic generation (identical output for the same seed).
* All validation edge‑cases (missing columns, bad UUIDs, naive timestamps, negative values, limits, invalid shift, duplicates, empty input).
* Preview mode – asserts that **no** `httpx.post` calls (including login) are performed.
* Failure path – confirms that an invalid CSV aborts the entire upload process.

Run the full suite with:
```bash
python -m pytest -q
```
All existing backend tests plus the new data‑pipeline tests must pass.

---

## 5. CI / GitHub Actions

The workflow file `.github/workflows/backend-ci.yml` (see below) runs on every PR to `main` and on pushes to any `feature/**` branch. It:
* Checks out the repository.
* Sets up **Python 3.12**.
* Installs `backend/requirements.txt` and `pytest`.
* Exposes the required test‑only environment variables.
* Executes `python -m pytest -q backend/tests` which includes the data‑pipeline tests.

---

## 6. Safety & Operational Guidelines
* Work only on the branch `feature/member-4-data-integration-qa`.
* Do not modify any existing teammates' files – the new package lives in its own directory.
* Do not commit or push any generated CSVs or secret credentials.
* Use `--send` **only** after you have reviewed the preview output and confirmed validation passed.

---

*End of documentation*
