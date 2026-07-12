"""Endpoints router implementing the API specification."""

import time
import os
from datetime import datetime
from typing import List, Optional
from urllib.parse import urlparse
from fastapi import APIRouter, HTTPException, UploadFile, File, Request, Depends, status

from payment_scanner.scanner import PaymentScanner
from payment_scanner.fetcher import FetcherError
from payment_scanner.signature_matcher import load_signatures, SignatureLoadError
from payment_scanner.api.rate_limiter import rate_limit_dependency
from payment_scanner.api.schemas import (
    ScanRequest,
    ScanResponse,
    ScanEnvelopeResponse,
    ErrorResponse,
    GatewayMatchResponse,
    ScanStatsResponse,
    TrustAssessmentResponse,
    GatewaysResponse,
    HealthResponse,
    VersionResponse,
)

router = APIRouter()

# Global start time of api to calculate uptime
API_START_TIME = time.time()
VERSION = "1.0.0"
SIGNATURE_FILE_PATH = "signatures.json"


def get_signatures_path() -> str:
    """Helper to locate signatures.json path."""
    if os.path.exists(SIGNATURE_FILE_PATH):
        return SIGNATURE_FILE_PATH
    # Fallback to local package directory relative to parent
    package_fallback = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "signatures.json"
    )
    if os.path.exists(package_fallback):
        return package_fallback
    return SIGNATURE_FILE_PATH


def validate_url(url: str) -> None:
    """Validates that a URL string is parseable and has valid scheme."""
    try:
        parsed = urlparse(url)
        if not parsed.scheme or parsed.scheme not in ("http", "https"):
            raise ValueError("URL scheme must be http or https")
        if not parsed.netloc:
            raise ValueError("URL must contain a host destination")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Malformed or invalid scan URL target: {e}",
        )


@router.post(
    "/scan",
    response_model=ScanEnvelopeResponse,
    status_code=status.HTTP_200_OK,
    summary="Scan remote Webpage",
    description="Fetches a remote URL using Fetcher, parses its elements, and executes signature and heuristic analysis.",
    responses={
        400: {"model": ErrorResponse, "description": "Invalid URL format"},
        429: {"model": ErrorResponse, "description": "Too many requests"},
        502: {"model": ErrorResponse, "description": "Remote host connection failure"},
        504: {"model": ErrorResponse, "description": "Connection timeout reaching host"},
        500: {"model": ErrorResponse, "description": "Internal server execution failure"},
    },
)
async def scan_endpoint(
    payload: ScanRequest,
    request: Request,
    _rate_limit: None = Depends(rate_limit_dependency),
) -> ScanEnvelopeResponse:
    target_url = payload.url.strip()
    validate_url(target_url)

    try:
        scanner = PaymentScanner(signatures_path=get_signatures_path())
        result = scanner.scan_url(target_url)
    except FetcherError as e:
        error_str = str(e).lower()
        if "timeout" in error_str:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail=f"Connection timeout while reaching target URL: {e}",
            )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch content from remote target: {e}",
        )
    except SignatureLoadError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Scanner signature load failure: {e}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Scan execution failed: {e}",
        )

    # Access Request ID from request.state set by middleware
    request_id = getattr(request.state, "request_id", "unknown-request-id")

    scan_result = ScanResponse(
        url=result.target,
        gateways=[
            GatewayMatchResponse(
                name=g.name,
                confidence=g.confidence,
                score=g.score,
                matches=g.reasons,
            )
            for g in result.gateways
        ],
        suspicious=[f"{s.description} ({s.details})" for s in result.suspicious],
        statistics=ScanStatsResponse(
            duration_seconds=result.stats.duration_seconds,
            num_scripts_analyzed=result.stats.num_scripts,
            num_forms_analyzed=result.stats.num_forms,
            num_elements_analyzed=result.stats.num_elements,
        ),
        trust_assessment=TrustAssessmentResponse(
            status=result.trust_assessment.status,
            explanation=result.trust_assessment.explanation,
            risk_score=result.trust_assessment.risk_score,
            risk_level=result.trust_assessment.risk_level,
        ) if result.trust_assessment else None,
    )

    return ScanEnvelopeResponse(
        request_id=request_id,
        scan_result=scan_result
    )



@router.post(
    "/scan-file",
    response_model=ScanEnvelopeResponse,
    status_code=status.HTTP_200_OK,
    summary="Scan uploaded HTML File",
    description="Loads a local HTML file stream, processes elements, and performs audits without making external requests.",
    responses={
        400: {"model": ErrorResponse, "description": "Unsupported file extension"},
        413: {"model": ErrorResponse, "description": "File upload exceeds 10MB limit"},
        429: {"model": ErrorResponse, "description": "Too many requests"},
        500: {"model": ErrorResponse, "description": "Internal server execution failure"},
    },
)
async def scan_file_endpoint(
    request: Request,
    file: UploadFile = File(...),
    _rate_limit: None = Depends(rate_limit_dependency),
) -> ScanEnvelopeResponse:
    # 1. Validate file extension
    filename = file.filename if file.filename else "uploaded_file.html"
    _, ext = os.path.splitext(filename.lower())
    if ext not in (".html", ".htm"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file extension. Only .html or .htm files are permitted.",
        )

    # 2. Restrict upload size to 10MB
    max_bytes = 10 * 1024 * 1024  # 10MB
    file_bytes = bytearray()
    chunk_size = 1024 * 1024  # 1MB chunk size

    try:
        while True:
            chunk = await file.read(chunk_size)
            if not chunk:
                break
            file_bytes.extend(chunk)
            if len(file_bytes) > max_bytes:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail="File too large. Maximum permitted file upload is 10MB.",
                )
    finally:
        await file.close()

    try:
        scanner = PaymentScanner(signatures_path=get_signatures_path())
        result = scanner.scan_html(bytes(file_bytes), filename)
    except SignatureLoadError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Scanner signature load failure: {e}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Scan execution failed: {e}",
        )

    request_id = getattr(request.state, "request_id", "unknown-request-id")

    scan_result = ScanResponse(
        url=result.target,
        gateways=[
            GatewayMatchResponse(
                name=g.name,
                confidence=g.confidence,
                score=g.score,
                matches=g.reasons,
            )
            for g in result.gateways
        ],
        suspicious=[f"{s.description} ({s.details})" for s in result.suspicious],
        statistics=ScanStatsResponse(
            duration_seconds=result.stats.duration_seconds,
            num_scripts_analyzed=result.stats.num_scripts,
            num_forms_analyzed=result.stats.num_forms,
            num_elements_analyzed=result.stats.num_elements,
        ),
        trust_assessment=TrustAssessmentResponse(
            status=result.trust_assessment.status,
            explanation=result.trust_assessment.explanation,
            risk_score=result.trust_assessment.risk_score,
            risk_level=result.trust_assessment.risk_level,
        ) if result.trust_assessment else None,
    )

    return ScanEnvelopeResponse(
        request_id=request_id,
        scan_result=scan_result
    )



@router.get(
    "/gateways",
    response_model=GatewaysResponse,
    status_code=status.HTTP_200_OK,
    summary="List Supported Gateways",
    description="Loads the active signatures definition file and reports list of configured gateways.",
)
async def list_gateways() -> GatewaysResponse:
    try:
        signatures = load_signatures(get_signatures_path())
        return GatewaysResponse(supported_gateways=list(signatures.keys()))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to query signatures database: {e}",
        )


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Health check Probe",
    description="Reports connectivity and configurations check indicators.",
)
async def health_check() -> HealthResponse:
    uptime = time.time() - API_START_TIME
    scanner_ready = os.path.exists(get_signatures_path())
    return HealthResponse(
        status="healthy",
        uptime=uptime,
        version=VERSION,
        scanner_ready=scanner_ready,
    )


@router.get(
    "/version",
    response_model=VersionResponse,
    status_code=status.HTTP_200_OK,
    summary="Get System Metadata Version",
    description="Detailed specifications mapping the platform and scanner specifications.",
)
async def get_version() -> VersionResponse:
    sig_path = get_signatures_path()
    supported = []
    if os.path.exists(sig_path):
        try:
            supported = list(load_signatures(sig_path).keys())
        except Exception:
            pass

    return VersionResponse(
        version=VERSION,
        scanner_engine="python-static",
        supported_gateways=supported,
        analysis_mode="Static Signature & Heuristics Mapping",
        signature_version=sig_path,
        timestamp=datetime.utcnow().isoformat() + "Z",
    )
