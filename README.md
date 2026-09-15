# CloneTrace

> **Detect the clone. Survive the disguise. Explain the evidence.**

## Overview

CloneTrace is an explainable Android APK clone and brand-impersonation analysis system using deterministic static evidence fusion. It compares a **baseline APK** and a **candidate APK** to produce an auditable forensic verdict — identifying repackaged apps, lookalikes, and trojanized variants.

## Key Features

- **APK Identity Analysis** — package name, signing certificates, version codes
- **Clone Confidence Scoring** — code structure similarity across 7 dimensions
- **Brand Impersonation Detection** — visual/icon hashing & brand signals
- **Threat Detection** — security-sensitive capability & correlation analysis
- **Smoking Gun Evidence** — pinpoint findings with full context
- **Clone DNA** — per-dimension evidence availability & reliability scoring
- **Forensic Delta Viewer** — preserved/added/modified/removed artifact tracking
- **Judge Mode** — full-screen presentation report
- **JSON Report Export** — auditable forensic output

## Detection Philosophy

**Single signals are insufficient.**
- Certificate mismatch ≠ malware
- Package rename ≠ unrelated app
- Threat evidence is isolated from clone evidence
- Missing evidence ≠ negative evidence (marked unavailable)

## Architecture

```
Baseline APK + Candidate APK
        ↓
   APK Ingestion Layer     (Androguard)
        ↓
Identity | Content | Code
        ↓
 Evidence Engine           (Pydantic models)
        ↓
Clone | Brand | Threat
        ↓
 Delta Engine
        ↓
Smoking Gun / Clone DNA / Correlations
        ↓
Dashboard / Reports
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python, FastAPI, Androguard, Pillow/ImageHash, Pydantic |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React |
| **Deployment** | Docker, Render.com (Python + Node services) |

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Windows: PowerShell

### Backend
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python run.py
```

### Frontend
```powershell
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Running CloneTrace
1. Ensure both backend (`:8000`) and frontend (`:5173`) are running
2. Open the UI in your browser
3. Click **"UPLOAD BASELINE APK"** → select the original/reference APK
4. Click **"UPLOAD CANDIDATE APK"** → select the APK to analyze
5. Click **"ANALYZE EVIDENCE"**
6. Review the forensic verdict dashboard
7. (Optional) Click **"Enter Judge Mode"** for full-screen report
8. (Optional) Click **"Export JSON"** to download the forensic report

### One-Command Deploy (Docker)
```bash
docker-compose up --build
```

## Benchmark Results

| Variant | Clone | Brand | Threat | Description |
|---------|-------|-------|--------|-------------|
| B0 | 100 | 100 | 0 | Original baseline |
| B1 | 80 | 0 | 0 | Package rename |
| B2 | 94 | 100 | 0 | Re-signed |
| B3 | 80 | 0 | 0 | Package + re-sign |
| B4 | 85 | 100 | 0 | Class rename |
| B5 | 85 | 100 | 0 | String modify |
| B6 | 85 | 100 | 0 | Icon modify |
| B7 | 85 | 100 | 15 | +SMS permission |
| B8 | 85 | 100 | 15 | +Accessibility service |
| B9 | 85 | 100 | 10 | +Network endpoints |
| B10 | 80 | 0 | 55 | Trojanized clone |
| B11 | 57 | 0 | 10 | Unrelated app |

B10 vs B11 demonstrates 23-point Clone Confidence separation.

## Project Structure
```
CloneTrace/
├── backend/           # FastAPI engine & static APK analyzers
│   ├── app/
│   │   ├── analyzers/ # Identity, manifest, structural, visual, network, native, API
│   │   ├── engine/    # Comparator, Scorer, SecurityAnalyzer, IntelligenceEngine
│   │   ├── models/    # Pydantic data models
│   │   └── main.py    # API endpoints
│   └── requirements.txt
├── frontend/          # React/Vite/Tailwind forensic dashboard
└── benchmark/         # Automated B0-B11 variant generator
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/analyze` | Compare two APKs (multipart upload) |
| `GET` | `/api/v1/benchmark` | Run benchmark suite |
| `GET` | `/api/v1/health` | Health check |

## Deployment

### Render.com (Recommended)
1. Fork/deploy this repo to GitHub
2. **Backend Service:** Python, root dir: `backend/`, build: `pip install -r requirements.txt`, start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. **Frontend Service:** Node, root dir: `frontend/`, build: `npm install && npm run build`, start: `npx serve -s dist`, env: `VITE_API_URL=https://<your-backend>.onrender.com`

### Docker
```bash
docker build -t clonetrace-api -f backend/Dockerfile .
docker build -t clonetrace-ui -f frontend/Dockerfile .
docker-compose up -d --build
```

## File Upload Limits

APK files must be under **10MB** per file. This limit ensures analysis completes within the memory constraints of shared hosting environments.

## Limitations

- **Static Analysis Only**: No dynamic sandboxing or execution
- **Adaptive XML Icons**: Visual evidence may be unavailable for certain adaptive icon formats
- **Third-Party SDK Overlap**: Bundled SDKs can inflate structural similarity for unrelated apps
- **Controlled Benchmark**: Validates mathematical separation, not large-scale statistical accuracy

## Responsible Use

APK analysis should be performed on **authorized, controlled samples** in an isolated environment. This tool is designed for security research, malware analysis, and application integrity verification.

## License

Currently, this repository has no explicit license. All rights reserved.
