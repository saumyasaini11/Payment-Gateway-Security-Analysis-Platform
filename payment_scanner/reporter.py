"""Module for generating human-readable CLI reports and machine-readable JSON reports."""

import json
from typing import Dict, Any
from payment_scanner.utils import ScanResult


def format_json_report(result: ScanResult) -> str:
    """Formats the ScanResult as a JSON string matching the specified schema.

    Args:
        result: The ScanResult data.

    Returns:
        JSON string representation.
    """
    report_dict: Dict[str, Any] = {
        "url": result.target,
        "gateways": [],
        "suspicious": [],
    }

    for gw in result.gateways:
        report_dict["gateways"].append(
            {
                "name": gw.name,
                "confidence": gw.confidence,
                "score": gw.score,
                "matches": gw.reasons,
            }
        )

    for susp in result.suspicious:
        # Use description or a combination of description and details
        finding = susp.description
        if susp.details:
            finding += f" ({susp.details})"
        report_dict["suspicious"].append(finding)

    if result.trust_assessment:
        report_dict["trust_assessment"] = {
            "status": result.trust_assessment.status,
            "explanation": result.trust_assessment.explanation,
            "risk_score": result.trust_assessment.risk_score,
            "risk_level": result.trust_assessment.risk_level,
        }

    report_dict["statistics"] = {
        "duration_seconds": result.stats.duration_seconds,
        "num_scripts_analyzed": result.stats.num_scripts,
        "num_forms_analyzed": result.stats.num_forms,
        "num_elements_analyzed": result.stats.num_elements,
    }

    return json.dumps(report_dict, indent=4)


def format_human_report(result: ScanResult) -> str:
    """Formats the ScanResult as a premium human-readable text report.

    Args:
        result: The ScanResult data.

    Returns:
        Text report string.
    """
    lines = []
    lines.append("-------------------------------------------------")
    lines.append(f"Scanning:\n{result.target}")
    lines.append("-------------------------------------------------")

    if result.gateways:
        lines.append("Detected Gateways")
        for gw in result.gateways:
            lines.append(f"\n{gw.name}")
            lines.append("Confidence:")
            lines.append(gw.confidence)
            lines.append("Reasons")
            for r in gw.reasons:
                lines.append(f"✓ {r}")
    else:
        lines.append("No payment gateways detected.")

    lines.append("-------------------------------------------------")

    if result.trust_assessment:
        lines.append("Trust Assessment")
        lines.append(f"  Status: {result.trust_assessment.status}")
        lines.append(f"  Risk Score: {result.trust_assessment.risk_score}")
        lines.append(f"  Risk Level: {result.trust_assessment.risk_level}")
        lines.append(f"  Explanation: {result.trust_assessment.explanation}")
        lines.append("-------------------------------------------------")

    if result.suspicious:
        lines.append("Suspicious Findings")
        for susp in result.suspicious:
            lines.append(f"⚠ {susp.description}")
            if susp.details:
                lines.append(f"  Details: {susp.details}")
    else:
        lines.append("No suspicious payment patterns detected.")

    lines.append("-------------------------------------------------")
    lines.append("Scan Statistics")
    lines.append(f"  Duration: {result.stats.duration_seconds:.4f}s")
    lines.append(f"  Scripts Analyzed: {result.stats.num_scripts}")
    lines.append(f"  Forms Analyzed: {result.stats.num_forms}")
    lines.append(f"  DOM Elements Analyzed: {result.stats.num_elements}")
    lines.append("-------------------------------------------------")
    return "\n".join(lines)

