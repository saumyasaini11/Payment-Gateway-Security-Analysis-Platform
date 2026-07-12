"""CLI Entrypoint and orchestrator for the Payment Gateway Security Analysis Platform."""

import argparse
import logging
import sys
import time
from pathlib import Path
from typing import Optional

from payment_scanner.fetcher import fetch_content, FetcherError
from payment_scanner.html_parser import parse_html
from payment_scanner.signature_matcher import load_signatures, match_signatures, SignatureLoadError
from payment_scanner.heuristics import detect_heuristics
from payment_scanner.trust_assessment import assess_trust
from payment_scanner.reporter import format_human_report, format_json_report
from payment_scanner.utils import setup_logging, ScanResult, ScanStats, DEFAULT_TIMEOUT

logger = logging.getLogger(__name__)


class PaymentScanner:
    """High-level service API for the Payment Gateway Security Analysis Platform."""

    def __init__(self, signatures_path: str = "signatures.json", timeout: int = DEFAULT_TIMEOUT):
        self.signatures_path = signatures_path
        self.timeout = timeout

    def scan_url(self, url: str) -> ScanResult:
        """Fetches a remote URL and runs the analysis pipeline."""
        start_time = time.perf_counter()
        html_content = fetch_content(
            source=url, is_file=False, timeout=self.timeout
        )
        if html_content is None:
            raise FetcherError("No HTML content was retrieved.")
        return self._process_html(html_content, url, start_time)

    def scan_file(self, file_path: str) -> ScanResult:
        """Reads a local file path and runs the analysis pipeline."""
        start_time = time.perf_counter()
        html_content = fetch_content(
            source=file_path, is_file=True, timeout=self.timeout
        )
        if html_content is None:
            raise FetcherError("No HTML content was retrieved.")
        return self._process_html(html_content, file_path, start_time)

    def scan_html(self, html_bytes: bytes, source_name: str) -> ScanResult:
        """Runs the analysis pipeline directly on a raw HTML byte stream."""
        start_time = time.perf_counter()
        return self._process_html(html_bytes, source_name, start_time)

    def _process_html(self, html_content: bytes, target: str, start_time: float) -> ScanResult:
        """Orchestrates parsing, matching, and statistics extraction."""
        parsed_page = parse_html(html_content=html_content, url=target)
        signatures = load_signatures(self.signatures_path)
        gateway_matches = match_signatures(parsed_page, signatures)
        suspicious_findings = detect_heuristics(parsed_page)
        trust_val = assess_trust(suspicious_findings)

        duration = time.perf_counter() - start_time
        stats = ScanStats(
            duration_seconds=duration,
            num_scripts=getattr(parsed_page, "num_scripts", 0),
            num_forms=getattr(parsed_page, "num_forms", 0),
            num_elements=getattr(parsed_page, "num_elements", 0),
        )

        return ScanResult(
            target=target,
            gateways=gateway_matches,
            suspicious=suspicious_findings,
            stats=stats,
            trust_assessment=trust_val,
        )


def run_scan(
    target: str,
    is_file: bool,
    signatures_path: str,
    timeout: int,
    use_json: bool,
) -> int:
    """CLI helper invoking the PaymentScanner service API."""
    logger.info("Starting scan for target: %s (is_file=%s)", target, is_file)
    try:
        scanner = PaymentScanner(signatures_path=signatures_path, timeout=timeout)
        if is_file:
            result = scanner.scan_file(target)
        else:
            result = scanner.scan_url(target)
    except FetcherError as e:
        logger.error("Fetching failed: %s", e)
        return 1
    except SignatureLoadError as e:
        logger.error("Loading signatures failed: %s", e)
        return 1
    except Exception as e:
        logger.error("Scan failed: %s", e)
        return 1

    if use_json:
        report = format_json_report(result)
    else:
        report = format_human_report(result)

    print(report)

    if result.suspicious:
        logger.info("Scan completed successfully, but suspicious findings were detected")
        return 2

    logger.info("Scan completed successfully")
    return 0




def main() -> None:
    """Main CLI entry point parsing arguments and calling the orchestrator."""
    parser = argparse.ArgumentParser(
        description="Payment Gateway Security Analysis Platform"
    )

    # Positional target (URL), optional if --file is specified
    parser.add_argument(
        "url",
        nargs="?",
        help="Target webpage URL to scan (e.g. https://example.com)",
    )

    parser.add_argument(
        "--file",
        help="Local HTML file path to scan",
    )

    parser.add_argument(
        "--json",
        action="store_true",
        help="Output the results in JSON format",
    )

    parser.add_argument(
        "--signatures",
        default="signatures.json",
        help="Path to custom signatures JSON file (default: signatures.json)",
    )

    parser.add_argument(
        "--timeout",
        type=int,
        default=DEFAULT_TIMEOUT,
        help=f"Timeout for network requests in seconds (default: {DEFAULT_TIMEOUT})",
    )

    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Enable detailed debug logging",
    )

    args = parser.parse_args()

    # Configure stdout/stderr encoding to utf-8 to avoid encoding errors on Windows
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass
    if hasattr(sys.stderr, "reconfigure"):
        try:
            sys.stderr.reconfigure(encoding="utf-8")
        except Exception:
            pass

    # Setup Logging
    setup_logging(verbose=args.verbose)

    # Validate inputs: must provide either url or --file, but not both or neither.
    if args.url and args.file:
        logger.error("Provide either a URL or a file to scan, not both.")
        sys.exit(1)

    if not args.url and not args.file:
        parser.print_help()
        sys.exit(1)

    # Determine scanner source and type
    target = args.file if args.file else args.url
    is_file = bool(args.file)

    # Ensure signatures file exists
    sig_path = Path(args.signatures)
    if not sig_path.exists():
        # Try local signatures.json fallback relative to run location
        fallback_path = Path(__file__).resolve().parent.parent / "signatures.json"
        if fallback_path.exists():
            args.signatures = str(fallback_path)
        else:
            logger.error("Signatures file not found at '%s'", args.signatures)
            sys.exit(1)

    exit_code = run_scan(
        target=target,
        is_file=is_file,
        signatures_path=args.signatures,
        timeout=args.timeout,
        use_json=args.json,
    )
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
