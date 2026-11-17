from datetime import datetime, timezone
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
    Uuid,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("login_failed_attempts >= 0", name="ck_user_login_failed_attempts_nonnegative"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    login_failed_attempts: Mapped[int] = mapped_column(
        Integer, default=0, server_default=text("0"), nullable=False
    )
    login_window_started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    login_locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    memberships: Mapped[list["FactoryMembership"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Factory(Base):
    __tablename__ = "factories"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    location: Mapped[str | None] = mapped_column(String(200))
    industry_type: Mapped[str | None] = mapped_column(String(100))
    timezone: Mapped[str] = mapped_column(String(64), default="UTC", nullable=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_by: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)
    memberships: Mapped[list["FactoryMembership"]] = relationship(back_populates="factory", cascade="all, delete-orphan")
    production_lines: Mapped[list["ProductionLine"]] = relationship(back_populates="factory", cascade="all, delete-orphan")
    machines: Mapped[list["Machine"]] = relationship(back_populates="factory", cascade="all, delete-orphan")


class FactoryMembership(Base):
    __tablename__ = "factory_memberships"
    __table_args__ = (
        UniqueConstraint("factory_id", "user_id", name="uq_factory_membership"),
        CheckConstraint("role IN ('owner', 'member')", name="ck_factory_membership_role"),
        Index("ix_factory_memberships_user_factory", "user_id", "factory_id"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    factory_id: Mapped[UUID] = mapped_column(ForeignKey("factories.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role: Mapped[str] = mapped_column(String(16), default="member", nullable=False)
    user: Mapped[User] = relationship(back_populates="memberships")
    factory: Mapped[Factory] = relationship(back_populates="memberships")


class ProductionLine(Base):
    __tablename__ = "production_lines"
    __table_args__ = (Index("ix_production_lines_factory", "factory_id"),)

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    factory_id: Mapped[UUID] = mapped_column(ForeignKey("factories.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)
    factory: Mapped[Factory] = relationship(back_populates="production_lines")


class Machine(Base):
    __tablename__ = "machines"
    __table_args__ = (
        CheckConstraint("rated_power_kw > 0", name="ck_machine_power_positive"),
        CheckConstraint("production_rate_units_per_hour >= 0", name="ck_machine_rate_nonnegative"),
        CheckConstraint("idle_power_factor >= 0 AND idle_power_factor <= 1", name="ck_machine_idle_factor"),
        CheckConstraint("load_factor > 0 AND load_factor <= 1", name="ck_machine_load_factor"),
        CheckConstraint("status IN ('available', 'running', 'maintenance', 'offline')", name="ck_machine_status"),
        Index("ix_machines_factory_status", "factory_id", "status"),
        Index("ix_machines_line", "production_line_id"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    factory_id: Mapped[UUID] = mapped_column(ForeignKey("factories.id", ondelete="CASCADE"), nullable=False)
    production_line_id: Mapped[UUID | None] = mapped_column(ForeignKey("production_lines.id", ondelete="SET NULL"))
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    machine_type: Mapped[str] = mapped_column(String(100), nullable=False)
    rated_power_kw: Mapped[float] = mapped_column(Float, nullable=False)
    production_rate_units_per_hour: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    load_factor: Mapped[float] = mapped_column(Float, default=0.8, nullable=False)
    idle_power_factor: Mapped[float] = mapped_column(Float, default=0.1, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="available", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)
    factory: Mapped[Factory] = relationship(back_populates="machines")


class EnergyReading(Base):
    __tablename__ = "energy_readings"
    __table_args__ = (
        CheckConstraint("energy_kwh >= 0 AND power_kw >= 0", name="ck_energy_nonnegative"),
        Index("ix_energy_machine_timestamp", "machine_id", "timestamp"),
        Index("ix_energy_timestamp", "timestamp"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    machine_id: Mapped[UUID] = mapped_column(ForeignKey("machines.id", ondelete="CASCADE"), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    energy_kwh: Mapped[float] = mapped_column(Float, nullable=False)
    power_kw: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class ProductionRecord(Base):
    __tablename__ = "production_records"
    __table_args__ = (
        CheckConstraint("production_units >= 0", name="ck_production_units_nonnegative"),
        Index("ix_production_line_timestamp", "production_line_id", "timestamp"),
        Index("ix_production_machine_timestamp", "machine_id", "timestamp"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    production_line_id: Mapped[UUID] = mapped_column(ForeignKey("production_lines.id", ondelete="CASCADE"), nullable=False)
    machine_id: Mapped[UUID | None] = mapped_column(ForeignKey("machines.id", ondelete="SET NULL"))
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    production_units: Mapped[float] = mapped_column(Float, nullable=False)
    shift: Mapped[str] = mapped_column(String(32), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"
    __table_args__ = (Index("ix_maintenance_machine_start", "machine_id", "start_time"),)

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    machine_id: Mapped[UUID] = mapped_column(ForeignKey("machines.id", ondelete="CASCADE"), nullable=False)
    maintenance_type: Mapped[str] = mapped_column(String(100), nullable=False)
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String(32), default="scheduled", nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class Forecast(Base):
    __tablename__ = "forecasts"
    __table_args__ = (Index("ix_forecasts_machine_time", "machine_id", "forecast_timestamp"),)

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    machine_id: Mapped[UUID] = mapped_column(ForeignKey("machines.id", ondelete="CASCADE"), nullable=False)
    forecast_timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    predicted_energy_kwh: Mapped[float] = mapped_column(Float, nullable=False)
    lower_bound: Mapped[float | None] = mapped_column(Float)
    upper_bound: Mapped[float | None] = mapped_column(Float)
    model_version: Mapped[str | None] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class Anomaly(Base):
    __tablename__ = "anomalies"
    __table_args__ = (
        Index("ix_anomalies_factory_time", "factory_id", "timestamp"),
        Index("ix_anomalies_status_severity", "status", "severity"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    factory_id: Mapped[UUID] = mapped_column(ForeignKey("factories.id", ondelete="CASCADE"), nullable=False)
    machine_id: Mapped[UUID] = mapped_column(ForeignKey("machines.id", ondelete="CASCADE"), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    expected_energy_kwh: Mapped[float] = mapped_column(Float, nullable=False)
    actual_energy_kwh: Mapped[float] = mapped_column(Float, nullable=False)
    deviation_percent: Mapped[float] = mapped_column(Float, nullable=False)
    anomaly_score: Mapped[float] = mapped_column(Float, nullable=False)
    severity: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="new", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class RootCauseAnalysis(Base):
    __tablename__ = "root_cause_analyses"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    anomaly_id: Mapped[UUID] = mapped_column(ForeignKey("anomalies.id", ondelete="CASCADE"), unique=True, nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    contributors: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class Recommendation(Base):
    __tablename__ = "recommendations"
    __table_args__ = (
        CheckConstraint("status IN ('new', 'reviewed', 'accepted', 'dismissed', 'completed')", name="ck_recommendation_status"),
        Index("ix_recommendations_factory_status", "factory_id", "status"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    factory_id: Mapped[UUID] = mapped_column(ForeignKey("factories.id", ondelete="CASCADE"), nullable=False)
    machine_id: Mapped[UUID | None] = mapped_column(ForeignKey("machines.id", ondelete="SET NULL"))
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="new", nullable=False)
    recommendation_type: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)


class Simulation(Base):
    __tablename__ = "simulations"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    factory_id: Mapped[UUID] = mapped_column(ForeignKey("factories.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(32), default="completed", nullable=False)
    created_by: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class SimulationInput(Base):
    __tablename__ = "simulation_inputs"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    simulation_id: Mapped[UUID] = mapped_column(ForeignKey("simulations.id", ondelete="CASCADE"), unique=True, nullable=False)
    payload: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)


class SimulationResult(Base):
    __tablename__ = "simulation_results"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    simulation_id: Mapped[UUID] = mapped_column(ForeignKey("simulations.id", ondelete="CASCADE"), unique=True, nullable=False)
    production_units: Mapped[float] = mapped_column(Float, nullable=False)
    energy_kwh: Mapped[float] = mapped_column(Float, nullable=False)
    peak_demand_kw: Mapped[float] = mapped_column(Float, nullable=False)
    estimated_cost: Mapped[float] = mapped_column(Float, nullable=False)
    metrics: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)


class OptimizationRun(Base):
    __tablename__ = "optimization_runs"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    factory_id: Mapped[UUID] = mapped_column(ForeignKey("factories.id", ondelete="CASCADE"), nullable=False)
    production_target: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    request_payload: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    result_payload: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    explanation: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Alert(Base):
    __tablename__ = "alerts"
    __table_args__ = (
        Index("ix_alerts_factory_status_created", "factory_id", "status", "created_at"),
        Index("ix_alerts_severity", "severity"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    factory_id: Mapped[UUID] = mapped_column(ForeignKey("factories.id", ondelete="CASCADE"), nullable=False)
    machine_id: Mapped[UUID | None] = mapped_column(ForeignKey("machines.id", ondelete="SET NULL"))
    type: Mapped[str] = mapped_column(String(100), nullable=False)
    severity: Mapped[str] = mapped_column(String(32), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="open", nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
