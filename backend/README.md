# EnerPilot backend

FastAPI service for factory-scoped energy and production data, ML-service adapters, digital-twin simulation, and schedule optimization.

## Setup

Use Python 3.11+ and PostgreSQL. From `backend`:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Set `DATABASE_URL` and a randomly generated `JWT_SECRET` (at least 32 characters). `ML_SERVICE_URL` is optional; forecast, anomaly detection, root-cause analysis, recommendation generation, and Copilot requests return an explicit service-unavailable error until Member 2's service is configured. The adapter contract is JSON `POST` to `/forecast`, `/anomalies/detect`, `/root-cause/analyze`, `/recommendations`, and `/copilot`; schemas are in `app/schemas.py`.

Login failures for a known account are tracked in the database across workers: ten failures within 15 minutes trigger a 15-minute account lockout. The general IP request limiter remains process-local; use a shared gateway/limiter for multi-instance deployments.

Run migrations with `alembic upgrade head`, then start the API with `uvicorn app.main:app --reload`. OpenAPI documentation is available at `/docs`.

To insert development fixtures, set `SEED_USER_EMAIL` and `SEED_USER_PASSWORD` (minimum 12 characters), then run `python -m app.seed`. The created factory and generated readings are explicitly marked as demo/simulated. No demo user password or JWT secret is embedded in the code.

## Calculation assumptions

- Energy cost is `measured kWh × ENERGY_COST_PER_KWH`; emissions are `measured kWh × CO2_KG_PER_KWH`. Both factors default to zero until configured.
- The digital twin estimates machine energy from rated power, configured load factor, scenario load, idle power factor, and operating hours. Production uses the configured machine production rate. These are scenario estimates, not telemetry.
- Optimization uses OR-Tools CP-SAT with one-hour slots, a 5-second solver limit, at most 168 hours and 100 eligible machines. A `feasible` result is distinct from an `optimal` result.
- Energy-by-shift uses fixed eight-hour UTC blocks (`night`, `day`, `evening`) because energy readings do not carry a shift identifier. Production-by-shift uses the shift recorded with each production record.
- Machine utilization/runtime is an estimate derived from energy readings and rated power. Reported fields explicitly identify it as estimated.
