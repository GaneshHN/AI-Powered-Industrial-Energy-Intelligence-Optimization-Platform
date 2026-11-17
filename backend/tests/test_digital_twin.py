from datetime import time

import pytest

from app.core.config import get_settings
from app.core.errors import APIError
from app.core.database import SessionLocal
from app.models import Factory, FactoryMembership, Machine, ProductionLine, User
from app.schemas import ScheduleItem
from app.services.digital_twin import simulate_schedule


def test_simulation_sums_overlapping_machine_demand(client):
    with SessionLocal() as db:
        user = User(email="twin@example.test", password_hash="unused")
        db.add(user)
        db.flush()
        factory = Factory(name="Twin Factory", created_by=user.id)
        db.add(factory)
        db.flush()
        db.add(FactoryMembership(factory_id=factory.id, user_id=user.id, role="owner"))
        line = ProductionLine(factory_id=factory.id, name="Line")
        db.add(line)
        db.flush()
        first = Machine(
            factory_id=factory.id,
            production_line_id=line.id,
            name="Machine 1",
            machine_type="CNC",
            rated_power_kw=10,
            production_rate_units_per_hour=10,
            load_factor=0.8,
            idle_power_factor=0.1,
        )
        second = Machine(
            factory_id=factory.id,
            production_line_id=line.id,
            name="Machine 2",
            machine_type="CNC",
            rated_power_kw=10,
            production_rate_units_per_hour=10,
            load_factor=0.8,
            idle_power_factor=0.1,
        )
        db.add_all([first, second])
        db.flush()
        schedule = [
            ScheduleItem(machine_id=first.id, start=time(8), end=time(10), load=1),
            ScheduleItem(machine_id=second.id, start=time(8), end=time(10), load=1),
        ]
        result = simulate_schedule(db, factory.id, schedule, 30, get_settings())
        assert result["production_units"] == 40
        assert result["energy_kwh"] == 32
        assert result["peak_demand_kw"] == 16


def test_simulation_rejects_unmet_production_target(client):
    with SessionLocal() as db:
        user = User(email="twin2@example.test", password_hash="unused")
        db.add(user)
        db.flush()
        factory = Factory(name="Twin Factory 2", created_by=user.id)
        db.add(factory)
        db.flush()
        line = ProductionLine(factory_id=factory.id, name="Line")
        db.add(line)
        db.flush()
        machine = Machine(
            factory_id=factory.id,
            production_line_id=line.id,
            name="Machine",
            machine_type="CNC",
            rated_power_kw=10,
            production_rate_units_per_hour=5,
        )
        db.add(machine)
        db.flush()
        with pytest.raises(APIError) as error:
            simulate_schedule(
                db,
                factory.id,
                [ScheduleItem(machine_id=machine.id, start=time(8), end=time(9))],
                100,
                get_settings(),
            )
        assert error.value.code == "PRODUCTION_TARGET_NOT_MET"
