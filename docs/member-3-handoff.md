# EnerPilot Member 3 Backend Handoff

## Status

The backend foundation and public API contracts are implemented. Member 1's
frontend, Member 2's ML service, and Member 4's ingestion pipeline were not in
this workspace, so end-to-end integration with those members is not verified.
Factories and telemetry from the included seeder are explicitly demo/simulated;
production data must come from an authorized real data source.

## Backend and API

Start from `backend/`:

```powershell
pip install -r requirements.txt
Copy-Item .env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```

OpenAPI/Swagger UI is at `/docs`; liveness is `/health`. API responses use the
shared `success/data/meta` or `success/error` envelope.

| Area | Routes |
|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Factories | `GET/POST /api/factories`, `GET/PUT/DELETE /api/factories/{id}`, `GET/POST /api/factories/{id}/production-lines` |
| Machines | `GET/POST /api/machines`, `GET/PATCH /api/machines/{id}` |
| Energy | `POST /api/energy/readings`, `GET /api/energy/summary`, `/trend`, `/by-machine`, `/by-shift`, `/intensity` |
| Production | `GET/POST /api/production`, `GET /api/production/summary`, `/by-machine`, `/by-shift` |
| AI integration | `GET /api/forecast`, `GET/POST /api/anomalies` and `/api/anomalies/{id}`, `GET /api/root-cause/{anomaly_id}`, `POST /api/root-cause/analyze`, `POST /api/recommendations/generate`, `GET /api/recommendations`, `GET/PATCH /api/recommendations/{id}` |
| Alerts | `GET /api/alerts`, `GET/PATCH /api/alerts/{id}` |
| Digital Twin | `POST /api/simulation`, `GET /api/simulation/{id}`, `GET /api/simulation/{id}/result` |
| Optimization | `POST /api/optimization`, `GET /api/optimization/{id}`, `GET /api/optimization/{id}/result` |
| Copilot | `POST /api/copilot` |

Protected routes use bearer JWTs. Factory access is checked through factory
memberships in the backend, not frontend-supplied identity or permissions.
Factories are private to their creator until an authorized membership is
created through an administrative/invitation workflow.

## Database

SQLAlchemy models and the initial Alembic migration cover:

- `users`, `factories`, `factory_memberships`, `production_lines`, `machines`
- `energy_readings`, `production_records`, `maintenance_records`
- `forecasts`, `anomalies`, `root_cause_analyses`, `recommendations`, `alerts`
- `simulations`, `simulation_inputs`, `simulation_results`, `optimization_runs`

Factory → lines/machines and factory → memberships use one-to-many relationships.
Machines reference their factory and optional line; readings, production,
maintenance, forecasts, anomalies, recommendations, alerts, simulations, and
optimization runs use foreign keys to their owning resource. Root-cause analyses
are unique per anomaly; simulation inputs/results are unique per simulation.
Memberships are unique per factory/user pair. See `backend/app/models/entities.py`
and `backend/migrations/versions/` for the indexed and constrained schema.

The login-failure fields added to `users` require applying the follow-up Alembic
migration before deployment.

## Digital Twin

Inputs include a factory, production target, and per-machine schedule intervals,
operating hours, and load. The engine rejects unavailable machines,
cross-factory machines, overlapping intervals, maintenance conflicts, and
schedules that miss the production target.

Outputs include estimated production, kWh, peak demand, and configured energy
cost. Production is machine rate × load × operating hours. Energy uses rated
power, load factor, operating load, and idle-power factor. Peak demand sums
simultaneous machine demand. These are scenario estimates, not measured
telemetry; shift effects and detailed physical process dynamics are not modeled.
Optional current-scenario comparison uses the latest 24 hours of measured data
and requires a measured energy baseline.

## Optimization

The OR-Tools CP-SAT engine minimizes hourly energy plus a peak-demand penalty.
It enforces production target, machine availability, maintenance windows, and
optional peak kW limit. Inputs are bounded to 168 hours, 100 eligible machines,
and 10 million production units; solver time is capped at five seconds. Results
distinguish `optimal`, `feasible`, `infeasible`, and `timeout`; no feasible
schedule is returned as optimal.

The optimization does not yet include shift-specific constraints, explicit
machine-allocation inputs, or production-changeover costs.

## AI Integration

`backend/app/integrations/ml_service.py` isolates Member 2's service behind JSON
POST adapters. Configure `ML_SERVICE_URL`; the expected paths are
`/forecast`, `/anomalies/detect`, `/root-cause/analyze`, `/recommendations`, and
`/copilot`. Response schemas and bounded output validation are in
`backend/app/schemas.py`. Missing services, timeouts, and invalid responses
produce explicit safe errors; no ML algorithms or success-shaped fallback
predictions are implemented in this backend.

The Copilot sends scoped, server-retrieved factory context and a fixed tool
allowlist. It does not expose SQL, shell, direct database writes, or arbitrary
factory access to the model. The AI adapter contract still needs coordination
with Member 2's actual service.

## Frontend and data integration

Member 1 can consume the documented REST paths and OpenAPI schemas. Member 2
must provide the ML adapter endpoints above. Member 4 can post validated energy
readings and production records to the ingestion endpoints and use the schema
constraints as validation. Neither the frontend nor external member services
were present to verify these integrations.

## Environment and security

`DATABASE_URL` and a randomly generated `JWT_SECRET` are required for
deployment. Set `APP_ENV=production`, restrict `CORS_ORIGINS` to the actual
frontend origins, and configure `ML_SERVICE_URL` to use HTTPS in deployed
environments. `ENERGY_COST_PER_KWH` and `CO2_KG_PER_KWH` are configurable factors
and default to zero. See `.env.example` for the full variable list.

Controls include Argon2 password hashes, JWT expiry/issuer validation,
membership-based factory authorization, request schema validation, ORM
parameterized queries, bounded pagination and analytics inputs, structured
request/error logs without credential values, safe error envelopes, restrictive
CORS, security headers, request-body size limits, and rate limiting. Login
failures are counted atomically per account in the database: ten failures in a
15-minute window trigger a 15-minute lockout across app workers and IPs. The
general IP limiter and computational-route limits are in-process and are not a
distributed rate limiter; deploy behind a shared gateway/limiter for
multi-worker or multi-instance abuse protection.

## Verification and limitations

Run tests from `backend/` with `python -m pytest -q`; apply/check schema changes
with Alembic. Automated tests use SQLite and cover API authentication and
factory scoping, energy calculations, simulation calculations, request limits,
and login throttling.

This workspace did not include Member 1/2/4 projects or a PostgreSQL service, so
their integration and a live PostgreSQL migration were not verified. Windows
Application Control prevented loading the native PostgreSQL driver and
OR-Tools binaries in the local environment. The API and migration were tested
with SQLite; optimization explicitly reports solver unavailability if OR-Tools
cannot load. The included demo seed data is synthetic and clearly labeled;
set `SEED_USER_EMAIL` and `SEED_USER_PASSWORD` rather than using embedded
credentials.
