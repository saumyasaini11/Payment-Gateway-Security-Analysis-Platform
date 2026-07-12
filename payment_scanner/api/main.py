"""FastAPI application initializer mapping middleware and router definitions."""

import logging
import time
import uuid
from fastapi import FastAPI, Request
from starlette.middleware.cors import CORSMiddleware
from payment_scanner.api.routes import router

logger = logging.getLogger("payment_scanner.api")

app = FastAPI(
    title="Payment Gateway Security Analysis Platform API",
    description=(
        "REST API interface querying HTML structures to verify "
        "payment integrations and security heuristics."
    ),
    version="1.0.0",
    contact={
        "name": "Security Engineering Team",
    },
    license_info={
        "name": "MIT License",
    },
)

# Enable CORS for React App Integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_request_middleware(request: Request, call_next):
    request_id = str(uuid.uuid4())
    start_time = time.perf_counter()
    client_ip = request.client.host if request.client else "unknown"
    request.state.request_id = request_id


    # Process request
    response = await call_next(request)

    # Attach Request ID correlation token
    response.headers["X-Request-ID"] = request_id
    duration = time.perf_counter() - start_time

    # Key-value logging output
    logger.info(
        "request_id=%s client_ip=%s method=%s path=%s status_code=%d duration_seconds=%.4fs",
        request_id,
        client_ip,
        request.method,
        request.url.path,
        response.status_code,
        duration,
    )

    return response


app.include_router(router)
