from typing import Any, Literal

from fastapi import APIRouter
from fastapi.routing import APIRoute
from pydantic import BaseModel


class SuccessEnvelope(BaseModel):
    success: Literal[True]
    data: Any
    meta: dict[str, Any] | None = None


class ErrorDetail(BaseModel):
    code: str
    message: str


class ErrorEnvelope(BaseModel):
    success: Literal[False]
    error: ErrorDetail
    meta: dict[str, Any] | None = None


class EnvelopeRoute(APIRoute):
    def __init__(self, *args, **kwargs):
        if kwargs.get("status_code") != 204 and kwargs.get("response_model") is None:
            kwargs["response_model"] = SuccessEnvelope
        super().__init__(*args, **kwargs)


ERROR_RESPONSES = {
    status: {"model": ErrorEnvelope, "description": description}
    for status, description in (
        (401, "Authentication required or invalid"),
        (403, "Permission denied"),
        (404, "Resource not found"),
        (409, "Resource conflict"),
        (413, "Request body too large"),
        (422, "Request validation failed"),
        (429, "Rate limit exceeded"),
        (500, "Internal server error"),
        (502, "External service error"),
        (503, "Service unavailable"),
        (504, "External service timeout"),
    )
}


def create_api_router(prefix: str, tags: list[str]) -> APIRouter:
    return APIRouter(prefix=prefix, tags=tags, route_class=EnvelopeRoute, responses=ERROR_RESPONSES)
