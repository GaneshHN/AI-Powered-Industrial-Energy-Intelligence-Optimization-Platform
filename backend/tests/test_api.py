from datetime import datetime, timezone

from fastapi.testclient import TestClient


def _register_and_login(client, email):
    registration = client.post(
        "/api/auth/register",
        json={"email": email, "password": "valid-test-password-2026"},
    )
    assert registration.status_code == 201
    login = client.post(
        "/api/auth/login",
        json={"email": email, "password": "valid-test-password-2026"},
    )
    assert login.status_code == 200
    return {"Authorization": f"Bearer {login.json()['data']['access_token']}"}


def test_factory_resources_are_scoped_to_membership(client):
    owner_headers = _register_and_login(client, "owner@example.com")
    other_headers = _register_and_login(client, "other@example.com")
    created = client.post(
        "/api/factories",
        headers=owner_headers,
        json={"name": "Test Factory", "timezone": "UTC"},
    )
    assert created.status_code == 201
    factory_id = created.json()["data"]["id"]

    hidden = client.get(f"/api/factories/{factory_id}", headers=other_headers)
    assert hidden.status_code == 404
    assert hidden.json()["error"]["code"] == "RESOURCE_NOT_FOUND"


def test_energy_summary_uses_persisted_readings_and_production(client):
    headers = _register_and_login(client, "energy@example.com")
    factory_response = client.post(
        "/api/factories",
        headers=headers,
        json={"name": "Energy Test Factory", "timezone": "UTC"},
    )
    factory_id = factory_response.json()["data"]["id"]
    line_response = client.post(
        f"/api/factories/{factory_id}/production-lines",
        headers=headers,
        json={"name": "Line 1"},
    )
    line_id = line_response.json()["data"]["id"]
    machine_response = client.post(
        "/api/machines",
        headers=headers,
        json={
            "factory_id": factory_id,
            "production_line_id": line_id,
            "name": "CNC-01",
            "machine_type": "CNC",
            "rated_power_kw": 20,
            "production_rate_units_per_hour": 10,
        },
    )
    machine_id = machine_response.json()["data"]["id"]
    timestamp = datetime.now(timezone.utc).isoformat()
    reading = client.post(
        "/api/energy/readings",
        headers=headers,
        json={"machine_id": machine_id, "timestamp": timestamp, "energy_kwh": 12.5, "power_kw": 18},
    )
    assert reading.status_code == 201
    production = client.post(
        "/api/production",
        headers=headers,
        json={
            "factory_id": factory_id,
            "production_line_id": line_id,
            "machine_id": machine_id,
            "timestamp": timestamp,
            "production_units": 5,
            "shift": "day",
        },
    )
    assert production.status_code == 201

    response = client.get(
        "/api/energy/summary",
        headers=headers,
        params={"factory_id": factory_id},
    )
    assert response.status_code == 200
    assert response.json()["data"]["total_energy_kwh"] == 12.5
    assert response.json()["data"]["energy_per_unit"] == 2.5
    assert response.json()["data"]["peak_demand_kw"] == 18


def test_sensitive_endpoint_requires_authentication(client):
    response = client.get("/api/factories")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "AUTHENTICATION_REQUIRED"


def test_login_throttle_is_shared_across_client_ips(client):
    registration = client.post(
        "/api/auth/register",
        json={"email": "throttle@example.com", "password": "valid-test-password-2026"},
    )
    assert registration.status_code == 201

    with TestClient(client.app, client=("198.51.100.10", 12345)) as first_ip:
        with TestClient(client.app, client=("203.0.113.20", 12345)) as second_ip:
            for attempt in range(10):
                attacker = first_ip if attempt % 2 == 0 else second_ip
                response = attacker.post(
                    "/api/auth/login",
                    json={"email": "throttle@example.com", "password": "incorrect-password"},
                )
                assert response.status_code == 401

            blocked = first_ip.post(
                "/api/auth/login",
                json={"email": "throttle@example.com", "password": "valid-test-password-2026"},
            )
            assert blocked.status_code == 429
            assert blocked.json()["error"]["code"] == "LOGIN_RATE_LIMITED"


def test_successful_login_resets_failed_attempts(client):
    assert client.post(
        "/api/auth/register",
        json={"email": "reset-throttle@example.com", "password": "valid-test-password-2026"},
    ).status_code == 201
    for _ in range(3):
        assert client.post(
            "/api/auth/login",
            json={"email": "reset-throttle@example.com", "password": "incorrect-password"},
        ).status_code == 401

    logged_in = client.post(
        "/api/auth/login",
        json={"email": "reset-throttle@example.com", "password": "valid-test-password-2026"},
    )
    assert logged_in.status_code == 200


def test_request_body_size_is_limited(client):
    response = client.post(
        "/api/auth/login",
        content=b"x" * (1_048_576 + 1),
        headers={"Content-Type": "application/json"},
    )
    assert response.status_code == 413
    assert response.json()["error"]["code"] == "REQUEST_TOO_LARGE"


def test_unconfigured_ml_adapter_returns_explicit_service_error(client):
    headers = _register_and_login(client, "forecast@example.com")
    factory = client.post(
        "/api/factories",
        headers=headers,
        json={"name": "Forecast Factory", "timezone": "UTC"},
    ).json()["data"]
    machine = client.post(
        "/api/machines",
        headers=headers,
        json={
            "factory_id": factory["id"],
            "name": "CNC-01",
            "machine_type": "CNC",
            "rated_power_kw": 20,
            "production_rate_units_per_hour": 10,
        },
    ).json()["data"]

    response = client.get(
        "/api/forecast",
        headers=headers,
        params={"machine_id": machine["id"]},
    )
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "ML_SERVICE_UNAVAILABLE"


def test_simulation_api_persists_calculated_result(client):
    headers = _register_and_login(client, "simulation@example.com")
    factory = client.post(
        "/api/factories",
        headers=headers,
        json={"name": "Simulation Factory", "timezone": "UTC"},
    ).json()["data"]
    machine = client.post(
        "/api/machines",
        headers=headers,
        json={
            "factory_id": factory["id"],
            "name": "CNC-01",
            "machine_type": "CNC",
            "rated_power_kw": 20,
            "production_rate_units_per_hour": 10,
        },
    ).json()["data"]

    response = client.post(
        "/api/simulation",
        headers=headers,
        json={
            "factory_id": factory["id"],
            "production_target": 10,
            "schedule": [
                {"machine_id": machine["id"], "start": "08:00", "end": "10:00", "load": 1}
            ],
        },
    )
    assert response.status_code == 201
    result = response.json()["data"]["result"]
    assert result["production_units"] == 20
    assert result["energy_kwh"] == 32
    saved = client.get(
        f"/api/simulation/{response.json()['data']['id']}/result",
        headers=headers,
    )
    assert saved.status_code == 200
    assert saved.json()["data"]["peak_demand_kw"] == 16
