from typing import Any

from fastapi.encoders import jsonable_encoder


def success(data: Any, meta: dict[str, Any] | None = None) -> dict[str, Any]:
    result: dict[str, Any] = {"success": True, "data": jsonable_encoder(data)}
    if meta is not None:
        result["meta"] = meta
    return result
