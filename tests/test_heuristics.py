"""Unit tests for heuristics.py."""

from payment_scanner.utils import ParsedPage, ParsedForm
from payment_scanner.heuristics import detect_heuristics


def test_detect_heuristics() -> None:
    """Tests all heuristic detections (IP action, missing action, JS rewrites, hidden iframes)."""
    # 1. IP Form action
    page_ip = ParsedPage(
        url="test_url",
        forms=[ParsedForm(action="http://192.168.1.100/submit")],
    )
    findings = detect_heuristics(page_ip)
    assert len(findings) == 1
    assert findings[0].pattern_type == "Raw IP Form Action"

    # 2. Missing form action with sensitive fields
    page_missing = ParsedPage(
        url="test_url",
        forms=[
            ParsedForm(
                action="",
                input_names=["username", "card_number", "cvv"],
            )
        ],
    )
    findings = detect_heuristics(page_missing)
    assert len(findings) == 1
    assert findings[0].pattern_type == "Missing Form Action"

    # 3. JS rewrites
    page_js = ParsedPage(
        url="test_url",
        js_rewrite_patterns=[".action ="],
    )
    findings = detect_heuristics(page_js)
    assert len(findings) == 1
    assert findings[0].pattern_type == "JS Action Rewrite"

    # 4. Hidden iframes
    page_iframe = ParsedPage(
        url="test_url",
        hidden_iframes=["<iframe style='display:none'>"],
    )
    findings = detect_heuristics(page_iframe)
    assert len(findings) == 1
    assert findings[0].pattern_type == "Hidden Iframe"
