"""Integration tests for the FastAPI web backend routes."""

import io
from unittest.mock import patch
from fastapi.testclient import TestClient
import pytest

from payment_scanner.api.main import app
from payment_scanner.fetcher import FetcherError

client = TestClient(app)


def test_health_check() -> None:
    """Verifies that the /health endpoint responds successfully."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "uptime" in data
    assert data["scanner_ready"] is True


def test_version() -> None:
    """Verifies that the /version endpoint returns system metadata."""
    response = client.get("/version")
    assert response.status_code == 200
    data = response.json()
    assert data["version"] == "1.0.0"
    assert data["scanner_engine"] == "python-static"
    assert "supported_gateways" in data


def test_list_gateways() -> None:
    """Verifies that the /gateways endpoint lists supported gateways."""
    response = client.get("/gateways")
    assert response.status_code == 200
    data = response.json()
    assert "supported_gateways" in data
    assert "Stripe" in data["supported_gateways"]
    assert "Razorpay" in data["supported_gateways"]


def test_scan_url_success() -> None:
    """Verifies scanning a mock valid URL successfully."""
    html_mock = b"""
    <html>
        <head>
            <script src="https://js.stripe.com/v3/"></script>
        </head>
        <body>
            stripe page
            <button id="stripe-button">Pay</button>
        </body>
    </html>
    """
    with patch("payment_scanner.scanner.fetch_content", return_value=html_mock):
        response = client.post("/scan", json={"url": "https://example.com"})
        assert response.status_code == 200
        data = response.json()
        assert "request_id" in data
        scan_res = data["scan_result"]
        assert scan_res["url"] == "https://example.com"
        assert len(scan_res["gateways"]) == 1
        assert scan_res["gateways"][0]["name"] == "Stripe"
        assert scan_res["gateways"][0]["confidence"] == "High"
        assert scan_res["statistics"]["num_elements_analyzed"] > 0


def test_scan_url_invalid() -> None:
    """Verifies scanning an invalid URL scheme rejects request with 400."""
    response = client.post("/scan", json={"url": "ftp://example.com"})
    assert response.status_code == 400
    assert "detail" in response.json()


def test_scan_url_timeout() -> None:
    """Verifies that network timeout is caught and returns 504."""
    with patch(
        "payment_scanner.scanner.fetch_content",
        side_effect=FetcherError("Connection timeout"),
    ):
        response = client.post("/scan", json={"url": "https://example.com"})
        assert response.status_code == 504
        assert "detail" in response.json()


def test_scan_file_success() -> None:
    """Verifies scanning an uploaded HTML file successfully."""
    html_mock = b"<html><body><iframe style='display:none'></iframe></body></html>"
    file_payload = {"file": ("test.html", io.BytesIO(html_mock), "text/html")}
    response = client.post("/scan-file", files=file_payload)
    assert response.status_code == 200
    data = response.json()
    assert "request_id" in data
    scan_res = data["scan_result"]
    assert scan_res["url"] == "test.html"
    assert len(scan_res["suspicious"]) == 1
    assert "hidden iframe" in scan_res["suspicious"][0].lower()



def test_scan_file_unsupported_extension() -> None:
    """Verifies uploading an unsupported file format fails with 400."""
    file_payload = {
        "file": ("test.png", io.BytesIO(b"dummy data"), "image/png")
    }
    response = client.post("/scan-file", files=file_payload)
    assert response.status_code == 400
    assert "extension" in response.json()["detail"].lower()


def test_scan_file_too_large() -> None:
    """Verifies uploading file exceeding 10MB fails with 413."""
    large_data = b"a" * (11 * 1024 * 1024)  # 11MB
    file_payload = {"file": ("test.html", io.BytesIO(large_data), "text/html")}
    response = client.post("/scan-file", files=file_payload)
    assert response.status_code == 413
    assert "too large" in response.json()["detail"].lower()
