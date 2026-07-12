"""Module for assessing the trust and risk level of a scanned page."""

from typing import List
from payment_scanner.utils import SuspiciousFinding, TrustAssessment


def assess_trust(suspicious_findings: List[SuspiciousFinding]) -> TrustAssessment:
    """Evaluates the trust level, risk score, risk level, and explanation based on findings.

    Rules:
    - Verified: No suspicious findings.
    - Review Recommended: Only low-severity findings present ('Hidden Iframe').
    - Needs Investigation: At least one medium/high severity finding present
      ('Raw IP Form Action', 'Missing Form Action', 'JS Action Rewrite').

    The explanation always references the specific findings that drove the verdict.
    """
    if not suspicious_findings:
        return TrustAssessment(
            status="Verified",
            explanation="No suspicious findings detected. All heuristic checks passed.",
            risk_score=0,
            risk_level="LOW"
        )

    # Bucket findings by severity and type
    HIGH_MEDIUM_TYPES = {"Raw IP Form Action", "Missing Form Action", "JS Action Rewrite"}
    LOW_TYPES = {"Hidden Iframe"}

    # Count occurrences per type for explainability
    type_counts: dict = {}
    for finding in suspicious_findings:
        p_type = finding.pattern_type
        type_counts[p_type] = type_counts.get(p_type, 0) + 1

    high_medium_types = [t for t in type_counts if t in HIGH_MEDIUM_TYPES]
    low_types = [t for t in type_counts if t in LOW_TYPES]
    unknown_types = [t for t in type_counts if t not in HIGH_MEDIUM_TYPES and t not in LOW_TYPES]

    # Unknown findings escalate to high/medium severity by default
    high_medium_types += unknown_types

    def _describe_finding(finding_type: str, count: int) -> str:
        """Returns a brief human-readable description for a finding type."""
        descriptions = {
            "Raw IP Form Action": (
                f"{count} form(s) post directly to a raw IP address "
                "(bypasses DNS/SSL validation)"
            ),
            "Missing Form Action": (
                f"{count} payment form(s) have no destination action "
                "(card data may be intercepted)"
            ),
            "JS Action Rewrite": (
                f"{count} inline script(s) dynamically rewrite form actions "
                "(potential phishing redirect)"
            ),
            "Hidden Iframe": (
                f"{count} hidden iframe(s) detected "
                "(may load off-origin scripts or clickjack inputs)"
            ),
        }
        if finding_type in descriptions:
            return descriptions[finding_type]
        return f"{count} instance(s) of '{finding_type}'"

    # Determine status and risk score
    if high_medium_types:
        status = "Needs Investigation"
        # Risk score: 25 per finding, capped at 100
        risk_score = min(len(suspicious_findings) * 25, 100)

        # Build evidence-grounded explanation
        finding_descriptions = [
            _describe_finding(t, type_counts[t])
            for t in sorted(high_medium_types + low_types)
        ]
        explanation = (
            f"Elevated risk detected. "
            f"{len(suspicious_findings)} suspicious finding(s): "
            + "; ".join(finding_descriptions) + "."
        )
    else:
        status = "Review Recommended"
        # Risk score: 15 per low-severity finding, capped at 50
        risk_score = min(len(suspicious_findings) * 15, 50)

        finding_descriptions = [
            _describe_finding(t, type_counts[t])
            for t in sorted(low_types)
        ]
        explanation = (
            f"Low-severity finding(s) present. "
            f"{len(suspicious_findings)} item(s): "
            + "; ".join(finding_descriptions)
            + ". Investigate if iframe sources are unexpected."
        )

    # Determine risk level
    if risk_score >= 75:
        risk_level = "HIGH"
    elif risk_score >= 40:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    return TrustAssessment(
        status=status,
        explanation=explanation,
        risk_score=risk_score,
        risk_level=risk_level
    )
