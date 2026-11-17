import math
import os
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models import (
    Alert,
    Anomaly,
    EnergyReading,
    Factory,
    FactoryMembership,
    Machine,
    MaintenanceRecord,
    ProductionLine,
    ProductionRecord,
    Recommendation,
    User,
)


def seed_demo_data() -> None:
    email = os.getenv("SEED_USER_EMAIL", "").strip().lower()
    password = os.getenv("SEED_USER_PASSWORD", "")
    if not email or len(password) < 12:
        raise RuntimeError("Set SEED_USER_EMAIL and a SEED_USER_PASSWORD of at least 12 characters to seed demo data")

    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == email))
        if user is None:
            user = User(email=email, password_hash=hash_password(password))
            db.add(user)
            db.flush()
        factory = db.scalar(select(Factory).where(Factory.name == "Precision Components Manufacturing Plant", Factory.is_demo.is_(True)))
        if factory is not None:
            print("Demo factory already exists; no changes made.")
            return

        factory = Factory(
            name="Precision Components Manufacturing Plant",
            location="Simulated Demo Facility",
            industry_type="Precision Manufacturing",
            timezone="UTC",
            is_demo=True,
            created_by=user.id,
        )
        db.add(factory)
        db.flush()
        db.add(FactoryMembership(factory_id=factory.id, user_id=user.id, role="owner"))
        line = ProductionLine(factory_id=factory.id, name="Precision Components Line", description="Simulated demo production line")
        db.add(line)
        db.flush()

        definitions = [
            ("CNC-01", "CNC", 30.0, 38.0),
            ("CNC-02", "CNC", 32.0, 40.0),
            ("CNC-03", "CNC", 28.0, 36.0),
            ("Compressor-01", "Compressor", 40.0, 0.0),
            ("HVAC-01", "HVAC", 18.0, 0.0),
            ("Furnace-01", "Furnace", 70.0, 65.0),
            ("Assembly-01", "Assembly", 12.0, 54.0),
        ]
        machines = [
            Machine(
                factory_id=factory.id,
                production_line_id=line.id,
                name=name,
                machine_type=kind,
                rated_power_kw=power,
                production_rate_units_per_hour=rate,
                load_factor=0.78,
                idle_power_factor=0.12,
            )
            for name, kind, power, rate in definitions
        ]
        db.add_all(machines)
        db.flush()

        now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
        for day in range(7, 0, -1):
            for hour in range(24):
                timestamp = now - timedelta(days=day) + timedelta(hours=hour)
                shift = ("night", "day", "evening")[hour // 8]
                for index, machine in enumerate(machines):
                    running = machine.production_rate_units_per_hour > 0 and (hour + index * 2) % 8 < 6
                    load = (0.72 + 0.15 * math.sin((hour + index) / 3)) if running else 0.12
                    energy = machine.rated_power_kw * load
                    power = machine.rated_power_kw * load
                    if machine.name == "CNC-03" and day == 1 and hour == 14:
                        energy *= 2.8
                        power *= 2.8
                    db.add(EnergyReading(machine_id=machine.id, timestamp=timestamp, energy_kwh=round(energy, 3), power_kw=round(power, 3)))
                    if running:
                        db.add(
                            ProductionRecord(
                                production_line_id=line.id,
                                machine_id=machine.id,
                                timestamp=timestamp,
                                production_units=round(machine.production_rate_units_per_hour * load, 2),
                                shift=shift,
                            )
                        )

        maintenance_start = now - timedelta(days=2, hours=3)
        db.add(
            MaintenanceRecord(
                machine_id=machines[1].id,
                maintenance_type="Preventive maintenance",
                start_time=maintenance_start,
                end_time=maintenance_start + timedelta(hours=2),
                status="completed",
                notes="Simulated demo maintenance period",
            )
        )
        db.add(
            Anomaly(
                factory_id=factory.id,
                machine_id=machines[2].id,
                timestamp=now - timedelta(days=1) + timedelta(hours=14),
                expected_energy_kwh=machines[2].rated_power_kw * 0.75,
                actual_energy_kwh=machines[2].rated_power_kw * 0.75 * 2.8,
                deviation_percent=180,
                anomaly_score=0.98,
                severity="high",
                status="new",
            )
        )
        db.add(
            Recommendation(
                factory_id=factory.id,
                machine_id=machines[2].id,
                title="Review simulated CNC-03 energy spike",
                description="Investigate the labeled simulated demo energy spike before applying operational changes.",
                priority="high",
                status="new",
                recommendation_type="energy_efficiency",
            )
        )
        db.add(
            Alert(
                factory_id=factory.id,
                machine_id=machines[2].id,
                type="energy_anomaly",
                severity="high",
                title="Simulated high energy deviation",
                message="Demo-only alert corresponding to the simulated CNC-03 energy pattern.",
            )
        )
        db.commit()
        print(f"Seeded DEMO / SIMULATED data for {factory.name}.")


if __name__ == "__main__":
    seed_demo_data()
