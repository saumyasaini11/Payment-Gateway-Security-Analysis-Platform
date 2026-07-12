# Payment Gateway Security Analysis Platform

A tool to scan webpages and detect payment gateway integrations along with suspicious security patterns — available as both a CLI tool and a web app.

---

## What It Does

- Detects payment gateways (Stripe, Razorpay, PayPal, Paytm, PhonePe, etc.) on any webpage
- Flags suspicious patterns like hidden iframes, forms posting to raw IPs, and JS form rewrites
- Produces a risk score and trust verdict with a clear, evidence-based explanation
- Works on live URLs or local HTML files

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, FastAPI, BeautifulSoup |
| Frontend | React, TypeScript, Vite, TailwindCSS |
| State | Zustand |
| HTTP Client | Axios, TanStack Query |

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/saumyasaini11/Payment-Gateway-Security-Analysis-Platform.git
cd Payment-Gateway-Security-Analysis-Platform
```

### 2. Install backend dependencies

```bash
pip install -r requirements.txt
```

### 3. Start the API server

Run this from the **project root**:

```bash
python -m uvicorn payment_scanner.api.main:app --reload --host 127.0.0.1 --port 8000
```

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## CLI Usage

You can also run scans directly from the terminal without the web UI:

```bash
# Scan a live URL
python scanner.py https://example.com

# Scan a local HTML file
python scanner.py --file test_page.html

# Output as JSON
python scanner.py https://example.com --json
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/scan` | Scan a remote URL |
| `POST` | `/scan-file` | Upload and scan an HTML file |
| `GET` | `/gateways` | List all supported gateways |
| `GET` | `/health` | Health check |
| `GET` | `/version` | Engine version info |

Interactive docs available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## Adding a New Gateway

No Python changes needed — just add an entry to `signatures.json`:

```json
"MyGateway": {
  "script_patterns": ["sdk\\.mygateway\\.com"],
  "keywords": ["mygateway"],
  "form_action_patterns": ["api\\.mygateway\\.com/pay"],
  "button_ids": ["mygateway-btn"]
}
```

---

## Running Tests

```bash
python -m pytest tests/ -v
```

---

## Project Structure

```
Payment-Gateway/
├── payment_scanner/       # Core scanner engine
│   ├── api/               # FastAPI routes, schemas, middleware
│   ├── html_parser.py     # BeautifulSoup page parsing
│   ├── signature_matcher.py
│   ├── heuristics.py
│   ├── trust_assessment.py
│   └── reporter.py
├── frontend/              # React web app
├── signatures.json        # Gateway signature definitions
├── scanner.py             # CLI entrypoint
├── requirements.txt
└── tests/
```
