# Payment Gateway Security Analysis Platform

A production-quality Python security analysis engine and CLI tool designed to scan webpages for integrated payment gateways and identify suspicious or insecure payment implementations.

## Project Overview

This tool implements signature-based detection for payment gateways and heuristics-based checking for common security anti-patterns (such as forms posting directly to IP addresses, missing form actions, runtime form action manipulation, and hidden iframes).

Designed following a modular pipeline architecture, the core scanner engine is fully decoupled from the CLI representation. This ensures that the engine can be integrated into web backends (e.g., FastAPI) or automation pipelines in the future without modifications to the scanning logic.

## Architecture

The system uses a sequential pipeline:

```
URL / HTML File ──► Fetcher ──► HTML Parser ──► Heuristics Engine & Signature Matcher ──► ScanResult ──► Reporter (CLI/JSON)
```

- **`fetcher.py`**: Handles network requests using `requests` with timeouts, user-agent configuration, and robust exception handling (DNS, SSL, HTTP status codes, etc.).
- **`html_parser.py`**: Parses content using BeautifulSoup, isolating script sources, inline JavaScript, form fields, and creating a searchable text blob.
- **`signature_matcher.py`**: Runs signature-based matching configured by a static `signatures.json` configuration. Calculates confidence scores.
- **`heuristics.py`**: Checks for security anti-patterns (IP address forms, hidden iframes, dynamic JavaScript action rewrites, and missing form actions on sensitive inputs).
- **`reporter.py`**: Formats structured results to human-readable text output or JSON schema format.
- **`scanner.py`**: Handles CLI arguments and orchestrates the module interactions.

## Installation

Ensure you have Python 3.10+ installed.

1. Clone or download this project.
2. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Usage

Run the scanner directly from the root workspace:

```bash
python scanner.py [URL] [OPTIONS]
```

### CLI Options

- `url`: Positional argument specifying the target remote webpage (e.g. `https://example.com`).
- `--file`: Scan a local HTML file instead of a live URL (e.g. `--file test_page.html`).
- `--json`: Output the result in structured machine-readable JSON format.
- `--signatures [path]`: Specify a custom path to a signatures file (default is `signatures.json`).
- `--timeout [seconds]`: Set request timeout (default is 10).
- `--verbose` / `-v`: Enable debug level logging for detailed trace outputs.

### CLI Examples

**Scan a live website (human-readable):**
```bash
python scanner.py https://example.com
```

**Scan a local HTML file:**
```bash
python scanner.py --file test_page.html
```

**Format output as JSON:**
```bash
python scanner.py https://example.com --json
```

**Custom signatures file and timeout:**
```bash
python scanner.py https://example.com --signatures custom_sigs.json --timeout 5
```

## JSON Format

The JSON report returns structured data mapping detection confidence and heuristic findings:

```json
{
    "url": "test_page.html",
    "gateways": [
        {
            "name": "Razorpay",
            "confidence": "Medium",
            "score": 75,
            "matches": [
                "Script matched: https://checkout.razorpay.com/v1/checkout.js",
                "Button ID matched: rzp-button"
            ]
        }
    ],
    "suspicious": [
        "Form posts directly to an IP address. (Action: http://192.168.0.5/pay)",
        "Hidden iframe detected. (HTML: <iframe id='hidden-iframe-1' class='' src='about:blank'>)"
    ]
}
```

## REST API Backend

The platform integrates a lightweight REST API backend built on FastAPI that exposes the core static scanner engine over HTTP.

### Running the API Server

Start the development server with reload capabilities:
```bash
python -m uvicorn payment_scanner.api.main:app --reload --host 127.0.0.1 --port 8000
```

Once running, interactive Swagger documentation is available at:
- **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

### API Endpoints

#### 1. `POST /scan`
Submits a remote URL destination for security analysis.
- **Request Body**:
  ```json
  {
    "url": "https://example.com"
  }
  ```
- **Error Codes**:
  - `400 Bad Request`: Malformed or invalid target URL scheme.
  - `502 Bad Gateway`: Connection/DNS error fetching target page content.
  - `504 Gateway Timeout`: Target server response timed out.

#### 2. `POST /scan-file`
Processes an uploaded HTML file directly.
- **Request Body**: Multipart Form Data (`file: UploadFile`)
- **Restrictions**: Permits `.html` or `.htm` files only. Maximum file size restricted to 10MB.
- **Error Codes**:
  - `400 Bad Request`: Unsupported file type.
  - `413 Payload Too Large`: Upload file exceeds 10MB limit.

#### 3. `GET /gateways`
Returns a list of all payment gateway signatures configured on the platform.
- **Response**:
  ```json
  {
    "supported_gateways": ["Razorpay", "Stripe", "PayPal", ...]
  }
  ```

#### 4. `GET /health`
Performs health checking and uptime inspection.

#### 5. `GET /version`
Obtains application engine metadata specifications and active configurations.

## How to Add a New Payment Gateway

Gateways are entirely configuration-driven. You do not need to modify any Python code.

Open `signatures.json` and append a new JSON key object:

```json
  "NewGateway": {
    "script_patterns": [
      "sdk\\.newgateway\\.com"
    ],
    "keywords": [
      "newgateway",
      "new-pay-btn"
    ],
    "form_action_patterns": [
      "api\\.newgateway\\.com/pay"
    ],
    "button_ids": [
      "new-pay-btn"
    ]
  }
```

### Matching Rules:
- **`script_patterns`**: List of regexes matched against the `src` attribute of script tags (+50 confidence score).
- **`form_action_patterns`**: List of regexes matched against form action destinations (+40 confidence score).
- **`button_ids`**: Case-insensitive exact matches against element IDs (+25 confidence score).
- **`keywords`**: String matches checked against the lowercased page text and inline JavaScript (+10 confidence score).

## Exit Codes

The CLI tool returns standard exit codes reflecting the scan outcome:
- `0`: Scan completed successfully, and **no** suspicious payment patterns/heuristics were detected.
- `1`: Scan failed due to an execution error (e.g., connection timeout, DNS failures, file not found, or malformed JSON signatures).
- `2`: Scan completed successfully, but one or more **suspicious** findings were flagged.

## Scan Statistics

Every report includes parsing metrics:
- **Duration**: Total time taken to fetch, parse, and analyze the page in seconds.
- **Scripts Analyzed**: The number of script tags examined.
- **Forms Analyzed**: The number of HTML forms inspected.
- **DOM Elements Analyzed**: The total count of HTML DOM tags traversed in the document.

## Known Limitations, False Positives, and False Negatives

As a static auditing utility, the platform operates with certain security assumptions and boundaries:

### False Positives
- **JS Rewriting Patterns**: Flagging generic property assignments like `.action =` can occasionally catch unrelated JavaScript objects (e.g., setting `state.action = "delete"` on state managers). This is a trade-off to capture stealthy inline form modifications.
- **Common Keyword Clashes**: Gateways with common brand terms (e.g., "square") may occasionally trigger keyword scores (+10) on generic content, though this alone will only lead to `Low` confidence.

### False Negatives
- **No JavaScript Execution**: Single Page Applications (SPAs) built with React, Angular, Vue, or Next.js that inject checkout markup dynamically after the page loads will return minimal static HTML. The scanner will not execute JS, potentially missing these elements.
- **CSS-hidden Iframes**: Iframes hidden using external stylesheets (e.g., `.hidden-frame { display: none; }` inside a stylesheet file) will not be flagged by the inline style analyzer.
- **POST requests via Fetch/XHR**: Insecure payment flows submitting card data via JavaScript Fetch or XMLHttpRequest endpoints instead of standard HTML form post actions will not trigger "IP action" or "Missing form action" heuristics.

## Future Improvements

- **Playwright/Headless Browser support**: Add dynamic browser automation scanning to execute JS before analysis.
- **FastAPI Endpoint integration**: Expose the core scanner as an asynchronous REST API.
- **Batch Scanning**: Implement queuing mechanisms for scanning multiple pages or bulk domains.
- **SQLite Caching**: Cache fetched HTML content to reduce repeated network overhead during repeat audits.

