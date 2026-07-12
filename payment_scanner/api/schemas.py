"""Pydantic schemas and serialization models for API endpoints."""

from typing import List, Optional
from pydantic import BaseModel, Field, HttpUrl


class ScanRequest(BaseModel):
    """Payload representing a scan request for a remote web URL."""

    url: str = Field(
        ...,
        description="The remote HTTP/HTTPS URL target to scan.",
        examples=["https://example.com"],
    )


class TrustAssessmentResponse(BaseModel):
    """Trust and risk level assessment outcome for a scanned page."""

    status: str = Field(..., description="Trust status: Verified, Review Recommended, or Needs Investigation.")
    explanation: str = Field(..., description="Human-readable explanation of the trust assessment outcome.")
    risk_score: int = Field(..., description="Numeric risk score from 0 to 100.")
    risk_level: str = Field(..., description="Risk level classification: LOW, MEDIUM, or HIGH.")


class GatewayMatchResponse(BaseModel):
    """Description of a matched payment gateway integration."""

    name: str = Field(..., description="The name of the payment gateway.")
    confidence: str = Field(
        ..., description="Confidence rating (High, Medium, Low, None)."
    )
    score: int = Field(..., description="The weighted numeric score calculated.")
    matches: List[str] = Field(
        ..., description="List of matched signature details (the evidence)."
    )


class ScanStatsResponse(BaseModel):
    """Execution timing and parsing statistics for the scan."""

    duration_seconds: float = Field(..., description="Time taken to analyze the source page.")
    num_scripts_analyzed: int = Field(..., description="Count of script tags parsed.")
    num_forms_analyzed: int = Field(..., description="Count of form tags parsed.")
    num_elements_analyzed: int = Field(..., description="Total count of HTML elements walked.")


class ScanResponse(BaseModel):
    """Full outcome report matching the CLI JSON schema."""

    url: str = Field(..., description="Target URL or source context scanned.")
    gateways: List[GatewayMatchResponse] = Field(
        default_factory=list,
        description="List of detected payment gateways matching signatures.",
    )
    suspicious: List[str] = Field(
        default_factory=list,
        description="Heuristic findings flagging insecure payment behaviors.",
    )
    statistics: ScanStatsResponse = Field(
        ..., description="Scan performance and HTML tag parsing statistics."
    )
    trust_assessment: Optional[TrustAssessmentResponse] = Field(
        default=None, description="Trust and risk level assessment derived from heuristic findings."
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "url": "https://example.com",
                "gateways": [
                    {
                        "name": "Stripe",
                        "confidence": "High",
                        "score": 85,
                        "matches": [
                            "Script matched: https://js.stripe.com/v3/",
                            "Button ID matched: stripe-button",
                        ],
                    }
                ],
                "suspicious": [
                    "Form posts directly to an IP address. (Action: http://192.168.0.5/pay)"
                ],
                "statistics": {
                    "duration_seconds": 0.045,
                    "num_scripts_analyzed": 2,
                    "num_forms_analyzed": 1,
                    "num_elements_analyzed": 42,
                },
            }
        }
    }


class GatewaysResponse(BaseModel):
    """List of gateways supported by the analysis platform."""

    supported_gateways: List[str] = Field(
        ..., description="Payment gateways defined in the active signatures."
    )


class HealthResponse(BaseModel):
    """System health check outcome."""

    status: str = Field(..., description="General health flag.")
    uptime: float = Field(..., description="System uptime in seconds.")
    version: str = Field(..., description="API system version.")
    scanner_ready: bool = Field(..., description="Indicates if scanner signatures are loaded.")


class VersionResponse(BaseModel):
    """Application metadata specifications."""

    version: str = Field(..., description="The platform package version.")
    scanner_engine: str = Field(..., description="Underlying scanner technology identifier.")
    supported_gateways: List[str] = Field(..., description="List of gateways configurable.")
    analysis_mode: str = Field(..., description="Analysis strategy description.")
    signature_version: str = Field(..., description="Hash/identifier or path of active signatures.")
    timestamp: str = Field(..., description="Current server time ISO timestamp.")


class ScanEnvelopeResponse(BaseModel):
    """Enveloped response wrapping the ScanResult and its execution correlation Request ID."""

    request_id: str = Field(..., description="The unique request tracking identifier.")
    scan_result: ScanResponse = Field(..., description="The nested payload of the execution results.")

    model_config = {
        "json_schema_extra": {
            "example": {
                "request_id": "8b5f36e4-4cd0-4d32-8419-f59781cf434e",
                "scan_result": {
                    "url": "https://example.com",
                    "gateways": [
                        {
                            "name": "Stripe",
                            "confidence": "High",
                            "score": 85,
                            "matches": [
                                "Script matched: https://js.stripe.com/v3/",
                                "Button ID matched: stripe-button",
                            ],
                        }
                    ],
                    "suspicious": [
                        "Form posts directly to an IP address. (Action: http://192.168.0.5/pay)"
                    ],
                    "statistics": {
                        "duration_seconds": 0.045,
                        "num_scripts_analyzed": 2,
                        "num_forms_analyzed": 1,
                        "num_elements_analyzed": 42,
                    },
                }
            }
        }
    }


class ErrorResponse(BaseModel):
    """Standardized API Error detail payload."""

    detail: str = Field(..., description="Human-readable description of the error.")

    model_config = {
        "json_schema_extra": {
            "example": {
                "detail": "Failed to fetch content from remote target: DNS resolution failed."
            }
        }
    }

