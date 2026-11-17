from datetime import datetime

from app.core.errors import APIError


def validate_time_range(start_time: datetime | None, end_time: datetime | None) -> None:
    for value in (start_time, end_time):
        if value is not None and (value.tzinfo is None or value.utcoffset() is None):
            raise APIError(422, "INVALID_TIME_RANGE", "Time filters must include a timezone")
    if start_time and end_time and start_time > end_time:
        raise APIError(422, "INVALID_TIME_RANGE", "start_time must be before end_time")
