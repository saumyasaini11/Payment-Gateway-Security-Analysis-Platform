"""Utility module containing data models, configuration, and logging setup."""

import logging
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional

# Configurations
DEFAULT_TIMEOUT = 10
DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)

# Confidence Scoring Weights
WEIGHTS = {
    "script": 50,
    "form_action": 40,
    "button_id": 25,
    "keyword": 10,
}


@dataclass
class ParsedForm:
    """Represents an HTML form extracted from a webpage."""

    action: str = ""
    method: str = ""
    input_names: List[str] = field(default_factory=list)
    input_ids: List[str] = field(default_factory=list)
    input_types: List[str] = field(default_factory=list)


@dataclass
class ParsedPage:
    """Structured representation of a parsed HTML page."""

    url: str
    script_srcs: List[str] = field(default_factory=list)
    inline_scripts: List[str] = field(default_factory=list)
    forms: List[ParsedForm] = field(default_factory=list)
    element_ids: List[str] = field(default_factory=list)
    element_classes: List[str] = field(default_factory=list)
    searchable_text: str = ""
    hidden_iframes: List[str] = field(default_factory=list)
    js_rewrite_patterns: List[str] = field(default_factory=list)



@dataclass
class GatewayMatch:
    """Details of a payment gateway signature match."""

    name: str
    confidence: str  # High, Medium, Low, None
    score: int
    reasons: List[str] = field(default_factory=list)


@dataclass
class SuspiciousFinding:
    """Details of a suspicious heuristic detection."""

    pattern_type: str
    description: str
    details: str = ""


@dataclass
class TrustAssessment:
    """Details of the trust and risk assessment."""

    status: str  # 'Verified', 'Review Recommended', 'Needs Investigation'
    explanation: str
    risk_score: int
    risk_level: str  # 'LOW', 'MEDIUM', 'HIGH'


@dataclass
class ScanStats:
    """Statistics captured during the scanning process."""

    duration_seconds: float = 0.0
    num_scripts: int = 0
    num_forms: int = 0
    num_elements: int = 0


@dataclass
class ScanResult:
    """Overall outcome of a webpage scan."""

    target: str
    gateways: List[GatewayMatch] = field(default_factory=list)
    suspicious: List[SuspiciousFinding] = field(default_factory=list)
    stats: ScanStats = field(default_factory=ScanStats)
    trust_assessment: Optional[TrustAssessment] = None


def setup_logging(verbose: bool = False) -> None:
    """Configures the application-wide logging format and level.

    Args:
        verbose: If True, set logging level to DEBUG. Otherwise, INFO.
    """
    log_level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=log_level,
        format="time=%(asctime)s level=%(levelname)s logger=%(name)s msg=\"%(message)s\"",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

