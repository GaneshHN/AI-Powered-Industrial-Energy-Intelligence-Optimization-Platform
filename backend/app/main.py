import json
import logging
import time
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.api.routes import (
    alerts,
    anomalies,
    auth,
    copilot,
    energy,
    factories,
    forecast,
    machines,
    optimization,
    production,
    recommendations,
    root_cause,
    simulation,
)
from app.core.config import get_settings
from app.core.errors import APIError

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger("enerpilot.api")


class RequestSizeLimitMiddleware:
    def __init__(self, app, max_bytes: int):
        self.app = app
        self.max_bytes = max_bytes

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = dict(scope.get("headers", []))
        declared_length = headers.get(b"content-length")
        if declared_length:
            try:
                if int(declared_length) > self.max_bytes:
                    await self._reject(scope, receive, send)
                    return
            except ValueError:
                await self._reject(scope, receive, send)
                return

        messages = []
        size = 0
        while True:
            message = await receive()
            if message["type"] == "http.disconnect":
                return
            if message["type"] != "http.request":
                messages.append(message)
                break
            size += len(message.get("body", b""))
            if size > self.max_bytes:
                await self._reject(scope, receive, send)
                return
            messages.append(message)
            if not message.get("more_body", False):
                break

        async def replay_receive():
            if messages:
                return messages.pop(0)
            return await receive()

        await self.app(scope, replay_receive, send)

    async def _reject(self, scope, receive, send):
        response = JSONResponse(
            status_code=413,
            content={"success": False, "error": {"code": "REQUEST_TOO_LARGE", "message": "Request body exceeds the allowed size"}},
            headers={
                "X-Request-ID": str(uuid4()),
                "X-Content-Type-Options": "nosniff",
                "X-Frame-Options": "DENY",
                "Referrer-Policy": "no-referrer",
                "Cache-Control": "no-store",
            },
        )
        await response(scope, receive, send)


app = FastAPI(title="EnerPilot API", version="1.0.0")
settings = get_settings()

app.add_middleware(RequestSizeLimitMiddleware, max_bytes=settings.max_request_bytes)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
)


@app.middleware("http")
async def request_controls(request: Request, call_next):
    request_id = str(uuid4())
    request.state.request_id = request_id
    client_ip = request.client.host if request.client else "unknown"
    now = time.monotonic()
    started = time.perf_counter()
    _rate_state = getattr(app.state, "rate_state", {})
    window, count = _rate_state.get(client_ip, (now, 0))
    if now - window >= 60:
        window, count = now, 0
    count += 1
    _rate_state[client_ip] = (window, count)
    if len(_rate_state) > 10_000:
        _rate_state = {key: value for key, value in _rate_state.items() if now - value[0] < 60}
    app.state.rate_state = _rate_state

    if count > settings.rate_limit_per_minute and request.url.path != "/health":
        response = JSONResponse(
            status_code=429,
            content={"success": False, "error": {"code": "RATE_LIMITED", "message": "Too many requests"}},
            headers={"Retry-After": str(max(1, int(60 - (now - window))))},
        )
    else:
        response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Cache-Control"] = "no-store"
    latency_ms = round((time.perf_counter() - started) * 1000, 3)
    logger.info(
        json.dumps(
            {
                "request_id": request_id,
                "route": request.url.path,
                "method": request.method,
                "status": response.status_code,
                "latency_ms": latency_ms,
            }
        )
    )
    return response


@app.exception_handler(APIError)
async def api_error_handler(request: Request, exc: APIError):
    logger.warning(
        json.dumps(
            {
                "event": "request_error",
                "request_id": request.state.request_id,
                "route": request.url.path,
                "method": request.method,
                "status": exc.status_code,
                "error_code": exc.code,
            }
        )
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": {"code": exc.code, "message": exc.message}},
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    logger.warning(
        json.dumps(
            {
                "event": "request_error",
                "request_id": request.state.request_id,
                "route": request.url.path,
                "method": request.method,
                "status": 422,
                "error_code": "VALIDATION_ERROR",
            }
        )
    )
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "error": {"code": "VALIDATION_ERROR", "message": "Request validation failed"},
            "meta": {"issues": [{"location": list(error["loc"]), "type": error["type"]} for error in exc.errors()]},
        },
    )


@app.exception_handler(HTTPException)
async def http_error_handler(request: Request, exc: HTTPException):
    code = "RESOURCE_NOT_FOUND" if exc.status_code == 404 else "HTTP_ERROR"
    message = str(exc.detail) if exc.status_code < 500 else "The request could not be completed"
    logger.warning(
        json.dumps(
            {
                "event": "request_error",
                "request_id": request.state.request_id,
                "route": request.url.path,
                "method": request.method,
                "status": exc.status_code,
                "error_code": code,
            }
        )
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": {"code": code, "message": message}},
        headers=exc.headers,
    )


@app.exception_handler(SQLAlchemyError)
async def database_error_handler(request: Request, exc: SQLAlchemyError):
    logger.error(
        json.dumps(
            {
                "event": "database_error",
                "request_id": request.state.request_id,
                "route": request.url.path,
                "method": request.method,
                "status": 500,
                "error_code": "DATABASE_ERROR",
                "error_type": type(exc).__name__,
            }
        )
    )
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": {"code": "DATABASE_ERROR", "message": "A database operation failed"}},
    )


@app.exception_handler(Exception)
async def unhandled_error_handler(request: Request, exc: Exception):
    logger.error(
        json.dumps(
            {
                "event": "unhandled_error",
                "request_id": request.state.request_id,
                "route": request.url.path,
                "method": request.method,
                "status": 500,
                "error_code": "INTERNAL_SERVER_ERROR",
                "error_type": type(exc).__name__,
            }
        )
    )
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": {"code": "INTERNAL_SERVER_ERROR", "message": "An unexpected error occurred"}},
    )


@app.get("/health", tags=["health"], summary="Liveness check")
def health():
    return {"success": True, "data": {"status": "ok"}}


for route_module in (
    auth,
    factories,
    machines,
    energy,
    production,
    forecast,
    anomalies,
    root_cause,
    recommendations,
    alerts,
    simulation,
    optimization,
    copilot,
):
    app.include_router(route_module.router)
