"""Unit and Integration tests for scanner.py CLI and orchestration."""

import json
from pathlib import Path

import pytest

from payment_scanner.reporter import format_human_report, format_json_report
from payment_scanner.scanner import PaymentScanner, run_scan
from payment_scanner.utils import ScanResult, SuspiciousFinding


SIGNATURES = str(Path(__file__).resolve().parent.parent / "signatures.json")


@pytest.mark.parametrize("use_json", [False, True])
@pytest.mark.parametrize("suspicious", [False, True])
def test_run_scan_local_file(tmp_path, capsys, use_json, suspicious) -> None:
    """Assert report contents and exit codes using self-contained HTML fixtures."""
    page = tmp_path / "checkout.html"
    html = '<script src="https://js.stripe.com/v3/"></script><p>Pay</p>'
    if suspicious:
        html += '<form action="http://192.0.2.1/pay"><input name="card"></form>'
    page.write_text(html, encoding="utf-8")

    exit_code = run_scan(str(page), True, SIGNATURES, 5, use_json)

    assert exit_code == (2 if suspicious else 0)
    output = capsys.readouterr().out
    if use_json:
        report = json.loads(output)
        assert report["url"] == str(page)
        assert report["gateways"][0]["name"] == "Stripe"
        assert bool(report["suspicious"]) is suspicious
        assert report["statistics"]["num_scripts_analyzed"] == 1
        assert report["trust_assessment"]["risk_score"] == (25 if suspicious else 0)
    else:
        assert str(page) in output
        assert "Stripe" in output
        assert "Trust Assessment" in output
        assert "Scan Statistics" in output
        assert ("Suspicious Findings" in output) is suspicious


@pytest.mark.parametrize("missing_signatures", [False, True])
def test_run_scan_failure(tmp_path, capsys, missing_signatures) -> None:
    page = tmp_path / "checkout.html"
    if missing_signatures:
        page.write_text("<p>Pay</p>", encoding="utf-8")
    signatures = str(tmp_path / "missing.json") if missing_signatures else SIGNATURES

    assert run_scan(str(page), True, signatures, 5, True) == 1
    assert capsys.readouterr().out == ""


def test_reports_without_assessment_or_finding_details() -> None:
    result = ScanResult(
        target="checkout.html",
        suspicious=[SuspiciousFinding("Hidden Iframe", "Hidden iframe detected.")],
    )
    report = json.loads(format_json_report(result))
    assert report["suspicious"] == ["Hidden iframe detected."]
    assert "trust_assessment" not in report
    assert "Details:" not in format_human_report(result)


def test_form_action_reads_do_not_inflate_risk() -> None:
    scanner = PaymentScanner(signatures_path=SIGNATURES)
    result = scanner.scan_html(
        b'<script>console.log(document.forms[0].action); '
        b'if (form.action === expected) { submit(); }</script>',
        "checkout.html",
    )
    assert result.suspicious == []
    assert result.trust_assessment.risk_score == 0

