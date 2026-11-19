import pathlib

# Expose the actual backend FastAPI package as a top‑level ``app`` namespace.
# This makes imports like ``from app.core.database import ...`` work without moving the existing code.
__path__ = [str(pathlib.Path(__file__).resolve().parents[1] / "backend" / "app")]
