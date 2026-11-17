from datetime import datetime, time
from typing import Any, Literal
from uuid import UUID
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator


class APIModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class RegisterRequest(APIModel):
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)


class LoginRequest(APIModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class TokenResponse(APIModel):
    access_token: str
    token_type: str = "bearer"


class FactoryCreate(APIModel):
    name: str = Field(min_length=1, max_length=200)
    location: str | None = Field(default=None, max_length=200)
    industry_type: str | None = Field(default=None, max_length=100)
    timezone: str = Field(default="UTC", min_length=1, max_length=64)

    @field_validator("timezone")
    @classmethod
    def validate_timezone(cls, value: str) -> str:
        try:
            ZoneInfo(value)
        except ZoneInfoNotFoundError:
            raise ValueError("timezone must be a valid IANA timezone") from None
        return value


class FactoryUpdate(APIModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    location: str | None = Field(default=None, max_length=200)
    industry_type: str | None = Field(default=None, max_length=100)
    timezone: str | None = Field(default=None, min_length=1, max_length=64)

    @field_validator("timezone")
    @classmethod
    def validate_timezone(cls, value: str | None) -> str | None:
        if value is not None:
            try:
                ZoneInfo(value)
            except ZoneInfoNotFoundError:
                raise ValueError("timezone must be a valid IANA timezone") from None
        return value

    @model_validator(mode="after")
    def validate_updates(self) -> "FactoryUpdate":
        if not self.model_fields_set:
            raise ValueError("At least one factory field must be provided")
        if any(getattr(self, field) is None for field in ("name", "timezone") if field in self.model_fields_set):
            raise ValueError("name and timezone cannot be null")
        return self


class FactoryResponse(APIModel):
    id: UUID
    name: str
    location: str | None
    industry_type: str | None
    timezone: str
    is_demo: bool
    created_at: datetime
    updated_at: datetime


class ProductionLineCreate(APIModel):
    name: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)


class MachineCreate(APIModel):
    factory_id: UUID
    production_line_id: UUID | None = None
    name: str = Field(min_length=1, max_length=200)
    machine_type: str = Field(min_length=1, max_length=100)
    rated_power_kw: float = Field(gt=0, le=100_000)
    production_rate_units_per_hour: float = Field(default=0, ge=0, le=1_000_000)
    load_factor: float = Field(default=0.8, gt=0, le=1)
    idle_power_factor: float = Field(default=0.1, ge=0, le=1)
    status: Literal["available", "running", "maintenance", "offline"] = "available"


class MachineUpdate(APIModel):
    production_line_id: UUID | None = None
    name: str | None = Field(default=None, min_length=1, max_length=200)
    machine_type: str | None = Field(default=None, min_length=1, max_length=100)
    rated_power_kw: float | None = Field(default=None, gt=0, le=100_000)
    production_rate_units_per_hour: float | None = Field(default=None, ge=0, le=1_000_000)
    load_factor: float | None = Field(default=None, gt=0, le=1)
    idle_power_factor: float | None = Field(default=None, ge=0, le=1)
    status: Literal["available", "running", "maintenance", "offline"] | None = None

    @model_validator(mode="after")
    def validate_updates(self) -> "MachineUpdate":
        if not self.model_fields_set:
            raise ValueError("At least one machine field must be provided")
        required_fields = {
            "name", "machine_type", "rated_power_kw", "production_rate_units_per_hour",
            "load_factor", "idle_power_factor", "status",
        }
        if any(getattr(self, field) is None for field in required_fields & self.model_fields_set):
            raise ValueError("Machine fields cannot be null")
        return self


class MachineResponse(APIModel):
    id: UUID
    factory_id: UUID
    production_line_id: UUID | None
    name: str
    machine_type: str
    rated_power_kw: float
    production_rate_units_per_hour: float
    load_factor: float
    idle_power_factor: float
    status: str
    created_at: datetime
    updated_at: datetime


class TimeFilter(APIModel):
    start_time: datetime | None = None
    end_time: datetime | None = None

    @model_validator(mode="after")
    def validate_range(self) -> "TimeFilter":
        for value in (self.start_time, self.end_time):
            if value is not None and (value.tzinfo is None or value.utcoffset() is None):
                raise ValueError("Time filters must include a timezone")
        if self.start_time and self.end_time and self.start_time > self.end_time:
            raise ValueError("start_time must be before end_time")
        return self


class RecommendationUpdate(APIModel):
    status: Literal["new", "reviewed", "accepted", "dismissed", "completed"]


class RecommendationGenerateRequest(APIModel):
    factory_id: UUID


class AlertUpdate(APIModel):
    is_read: bool | None = None
    status: Literal["open", "acknowledged", "resolved"] | None = None

    @model_validator(mode="after")
    def validate_updates(self) -> "AlertUpdate":
        if not self.model_fields_set:
            raise ValueError("At least one alert field must be provided")
        if any(getattr(self, field) is None for field in self.model_fields_set):
            raise ValueError("Alert fields cannot be null")
        return self


class ScheduleItem(APIModel):
    machine_id: UUID
    start: time
    end: time
    operating_hours: float | None = Field(default=None, gt=0, le=24)
    load: float = Field(default=1, gt=0, le=1)
    shift: str | None = Field(default=None, max_length=32)

    @model_validator(mode="after")
    def validate_duration(self) -> "ScheduleItem":
        if self.operating_hours is None and self.end <= self.start:
            raise ValueError("Schedule end must be after start")
        if self.operating_hours is not None and self.start == self.end:
            raise ValueError("A schedule interval must have positive duration")
        return self


class SimulationRequest(APIModel):
    factory_id: UUID
    name: str = Field(default="What-if simulation", min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    production_target: float = Field(gt=0, le=10_000_000)
    schedule: list[ScheduleItem] = Field(min_length=1, max_length=100)
    compare_with_current: bool = False


class OptimizationConstraints(APIModel):
    max_peak_kw: float | None = Field(default=None, gt=0, le=100_000)


class OptimizationRequest(APIModel):
    factory_id: UUID
    production_target: float = Field(gt=0, le=10_000_000)
    planning_horizon_hours: int = Field(default=24, ge=1, le=168)
    constraints: OptimizationConstraints = Field(default_factory=OptimizationConstraints)


class CopilotRequest(APIModel):
    factory_id: UUID
    question: str = Field(min_length=1, max_length=4000)


class MLForecastItem(APIModel):
    machine_id: UUID | None = None
    forecast_timestamp: datetime
    predicted_energy_kwh: float = Field(ge=0)
    lower_bound: float | None = Field(default=None, ge=0)
    upper_bound: float | None = Field(default=None, ge=0)
    model_version: str | None = Field(default=None, max_length=100)


class MLRecommendationItem(APIModel):
    machine_id: UUID | None = None
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1, max_length=5000)
    priority: Literal["low", "medium", "high", "critical"]
    recommendation_type: str = Field(min_length=1, max_length=100)


class MLAnomalyItem(APIModel):
    machine_id: UUID
    timestamp: datetime
    expected_energy_kwh: float = Field(ge=0)
    actual_energy_kwh: float = Field(ge=0)
    deviation_percent: float
    anomaly_score: float = Field(ge=0, le=1)
    severity: Literal["low", "medium", "high", "critical"]


class MLRootCauseResponse(APIModel):
    summary: str = Field(min_length=1, max_length=10_000)
    confidence: float = Field(ge=0, le=1)
    contributors: list[dict[str, Any]] = Field(default_factory=list, max_length=100)


class CopilotAnswer(APIModel):
    answer: str = Field(min_length=1, max_length=10_000)
    citations: list[dict[str, Any]] = Field(default_factory=list, max_length=50)


class ProductionRecordCreate(APIModel):
    factory_id: UUID
    production_line_id: UUID
    machine_id: UUID | None = None
    timestamp: datetime
    production_units: float = Field(ge=0, le=10_000_000)
    shift: str = Field(min_length=1, max_length=32)

    @field_validator("timestamp")
    @classmethod
    def require_timestamp_timezone(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("timestamp must include a timezone")
        return value


class EnergyReadingCreate(APIModel):
    machine_id: UUID
    timestamp: datetime
    energy_kwh: float = Field(ge=0, le=1_000_000)
    power_kw: float = Field(ge=0, le=100_000)

    @field_validator("timestamp")
    @classmethod
    def require_timestamp_timezone(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("timestamp must include a timezone")
        return value


class AnomalyDetectRequest(TimeFilter):
    factory_id: UUID
    machine_id: UUID | None = None


class RootCauseRequest(APIModel):
    anomaly_id: UUID
