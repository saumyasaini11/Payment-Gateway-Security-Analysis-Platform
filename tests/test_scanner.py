"""Unit and Integration tests for scanner.py CLI and orchestration."""

from pathlib import Path
from payment_scanner.scanner import run_scan


def test_run_scan_local_file() -> None:
    """Verifies that run_scan runs successfully on test_page.html."""
    test_file_path = Path(__file__).resolve().parent.parent / "test_page.html"
    signatures_path = Path(__file__).resolve().parent.parent / "signatures.json"

    assert test_file_path.exists()
    assert signatures_path.exists()

    # Scan with human report output
    exit_code = run_scan(
        target=str(test_file_path),
        is_file=True,
        signatures_path=str(signatures_path),
        timeout=5,
        use_json=False,
    )
    assert exit_code == 2

    # Scan with JSON report output
    exit_code_json = run_scan(
        target=str(test_file_path),
        is_file=True,
        signatures_path=str(signatures_path),
        timeout=5,
        use_json=True,
    )
    assert exit_code_json == 2

