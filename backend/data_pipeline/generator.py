# Data generator for simulated energy & production CSVs

"""Utility functions to generate deterministic CSV files for the EnerPilot
hackathon. The generator never touches the database and uses only the standard
library.
"""

import csv
import uuid
import random
import math
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import List, Tuple


def _hourly_timestamps(start_date: datetime, days: int) -> List[datetime]:
    """Return a list of hourly UTC timestamps for ``days`` days starting at
    ``start_date`` (midnight)."""
    timestamps: List[datetime] = []
    total_hours = days * 24
    for i in range(total_hours):
        ts = start_date + timedelta(hours=i)
        timestamps.append(ts.replace(tzinfo=timezone.utc))
    return timestamps


def generate_energy_csv(
    output_path: Path,
    machine_ids: List[uuid.UUID],
    days: int = 7,
    seed: int = 42,
) -> Path:
    """Generate a deterministic CSV of hourly energy readings.

    Columns: ``machine_id``, ``timestamp``, ``energy_kwh``, ``power_kw``.
    """
    random.seed(seed)
    start_date = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    timestamps = _hourly_timestamps(start_date, days)

    with output_path.open("w", newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["machine_id", "timestamp", "energy_kwh", "power_kw"],
        )
        writer.writeheader()
        for machine_id in machine_ids:
            base_power = random.uniform(10_000, 50_000)  # kW base load
            for ts in timestamps:
                hour = ts.hour
                daily_factor = 0.5 * (1 + math.sin((hour - 12) / 24 * 2 * math.pi))
                power = max(0, base_power * (0.5 + daily_factor) + random.gauss(0, 2_000))
                power = min(power, 100_000)  # API max
                energy = power * random.uniform(0.9, 1.1)
                energy = min(energy, 1_000_000)
                writer.writerow(
                    {
                        "machine_id": str(machine_id),
                        "timestamp": ts.isoformat(),
                        "energy_kwh": f"{energy:.3f}",
                        "power_kw": f"{power:.3f}",
                    }
                )
    return output_path


def generate_production_csv(
    output_path: Path,
    factory_id: uuid.UUID,
    line_id: uuid.UUID,
    machine_ids: List[uuid.UUID] | None,
    days: int = 7,
    seed: int = 42,
) -> Path:
    """Generate a deterministic CSV of hourly production data.

    Columns: ``factory_id``, ``production_line_id``, ``machine_id`` (optional),
    ``timestamp``, ``production_units``, ``shift``.
    """
    random.seed(seed)
    start_date = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    timestamps = _hourly_timestamps(start_date, days)
    shifts = ["night", "day", "evening"]

    with output_path.open("w", newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "factory_id",
                "production_line_id",
                "machine_id",
                "timestamp",
                "production_units",
                "shift",
            ],
        )
        writer.writeheader()
        for ts in timestamps:
            # Determine shift based on hour of day
            if 0 <= ts.hour < 8:
                shift = "night"
            elif 8 <= ts.hour < 16:
                shift = "day"
            else:
                shift = "evening"
            base_units = random.uniform(1_000, 10_000)
            daily_factor = 0.5 * (1 + math.sin((ts.hour - 12) / 24 * 2 * math.pi))
            units = int(base_units * (0.5 + daily_factor) + random.gauss(0, 500))
            units = max(0, min(units, 10_000_000))
            machine_id = ""
            if machine_ids and random.random() < 0.5:
                machine_id = str(random.choice(machine_ids))
            writer.writerow(
                {
                    "factory_id": str(factory_id),
                    "production_line_id": str(line_id),
                    "machine_id": machine_id,
                    "timestamp": ts.isoformat(),
                    "production_units": units,
                    "shift": shift,
                }
            )
    return output_path


def generate_all(
    base_dir: Path,
    factory_id: uuid.UUID,
    line_id: uuid.UUID,
    machine_ids: List[uuid.UUID],
    days: int = 7,
    seed: int = 42,
) -> Tuple[Path, Path]:
    """Generate both energy and production CSVs under ``base_dir`` and return the
    two file paths.
    """
    base_dir.mkdir(parents=True, exist_ok=True)
    energy_path = base_dir / "energy.csv"
    prod_path = base_dir / "production.csv"
    generate_energy_csv(energy_path, machine_ids, days, seed)
    generate_production_csv(prod_path, factory_id, line_id, machine_ids, days, seed)
    return energy_path, prod_path

# End of module
