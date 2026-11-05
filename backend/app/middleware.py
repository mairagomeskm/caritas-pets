from typing import Callable
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse

class CsrfProtectionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if request.method in ("POST", "PUT", "PATCH", "DELETE"):
            origin = request.headers.get("origin")
            referer = request.headers.get("referer")
            host = request.headers.get("host")
            if origin and host and not (host in origin or "localhost" in origin or "127.0.0.1" in origin):
                return JSONResponse({"error": "Cross-site request blocked by CSRF filter"}, status_code=403)
        return await call_next(request)

class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        try:
            return await call_next(request)
        except Exception as exc:
            return JSONResponse(
                {"error": "Internal server error", "detail": str(exc)},
                status_code=500,
            )

