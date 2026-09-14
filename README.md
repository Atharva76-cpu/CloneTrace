# CloneTrace

## Tagline

"Detect the clone. Survive the disguise. Explain the evidence."

## What is CloneTrace?

CloneTrace is an explainable Android APK clone and brand-impersonation analysis system using deterministic static evidence fusion. 
It compares a **baseline APK** and a **candidate APK** to produce an auditable forensic verdict.

## Core Capabilities

- APK identity analysis
- certificate fingerprint comparison
- package/namespace analysis
- icon perceptual similarity
- string/resource analysis
- application-specific Class DNA
- discriminative API analysis
- manifest/component comparison
- network endpoint analysis
- native library analysis
- security-sensitive capability detection
- clone/brand/threat confidence
- evidence contribution breakdown
- delta analysis
- Smoking Gun
- Clone DNA
- Judge Mode
- JSON/report export

## Architecture

```text
Baseline APK + Candidate APK
        ↓
   APK Ingestion
        ↓
Identity | Content | Code
        ↓
  Evidence Engine
        ↓
Clone | Brand | Threat
        ↓
   Delta Engine
        ↓
Smoking Gun / Clone DNA
        ↓
 Dashboard / Reports
```

## Detection Philosophy

CloneTrace is built on the principle that **single signals are insufficient.**
- Certificate mismatch does not automatically mean malware.
- Package rename does not automatically mean an unrelated application.
- Threat evidence is isolated and separated from clone evidence.
- Missing evidence is never treated as negative evidence (it is marked unavailable, preserving math integrity).

## Benchmark

The system is validated against a controlled adversarial benchmark:

**CONTROLLED BENCHMARK RESULTS**
- **B0** (Original): 100 Clone / 100 Brand / 0 Threat
- **B1** (Pkg Rename): 80 Clone / 0 Brand / 0 Threat
- **B2** (Re-signed): 94 Clone / 100 Brand / 0 Threat
- **B3** (Pkg + Re-sign): 80 Clone / 0 Brand / 0 Threat
- **B4** (Class Rename): 85 Clone / 100 Brand / 0 Threat
- **B5** (Str Modify): 85 Clone / 100 Brand / 0 Threat
- **B6** (Icon Modify): 85 Clone / 100 Brand / 0 Threat
- **B7** (SEND_SMS): 85 Clone / 100 Brand / 15 Threat
- **B8** (Access. Svc): 85 Clone / 100 Brand / 15 Threat
- **B9** (Endpoints): 85 Clone / 100 Brand / 10 Threat
- **B10** (Trojanized): 80 Clone / 0 Brand / 55 Threat
- **B11** (Unrelated): 57 Clone / 0 Brand / 10 Threat

*Note: B10 vs B11 demonstrates a 23-point Clone Confidence separation. This validates the deterministic evidence logic separating a true trojanized clone from an unrelated app.*

## Tech Stack

**Backend:**
- Python
- FastAPI
- Androguard
- Pillow/ImageHash

**Frontend:**
- React
- Vite
- Tailwind
- Lucide

## Project Structure
```text
CloneTrace/
├── backend/          # FastAPI engine & static analyzers
├── frontend/         # React/Vite/Tailwind UI dashboard
├── benchmark/        # Automated B0-B11 variant generator
├── docs/             # Technical specifications
└── README.md
```

## Installation

**Backend Setup:**
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

**Frontend Setup:**
```powershell
cd frontend
npm install
```

## Running CloneTrace

1. Start backend: `cd backend` -> `.\venv\Scripts\Activate.ps1` -> `python run.py`
2. Start frontend: `cd frontend` -> `npm run dev`
3. Open UI in the browser at `http://localhost:5173`
4. Upload baseline APK
5. Upload candidate APK
6. Click Analyze
7. Review verdict/evidence
8. Enter Judge Mode
9. Export report

## Benchmark Generation

The benchmark requires Apktool. To regenerate the variants:
```powershell
cd benchmark
python generate.py
```

## Testing

**Backend:**
```powershell
.\venv\Scripts\Activate.ps1
$env:PYTHONPATH="backend"
pytest
```

**Frontend:**
```powershell
cd frontend
npm run build
```

## Limitations

- **Static Analysis Only**: Does not execute APKs in a dynamic sandbox.
- **Adaptive XML Icon Limitation**: B6 visual evidence is currently unavailable for adaptive XML icons in the benchmark and therefore does not prove visual robustness.
- **Third-Party SDK Overlap**: Bundled third-party SDKs can inflate structural similarity for unrelated APKs (e.g. keeping B11 at 57% rather than 10%).
- **Controlled Benchmark**: The benchmark proves mathematical separation, not large-scale statistical dataset accuracy.

## Security / Responsible Use
APK analysis should be performed on authorized/controlled samples in an isolated environment.

## License
Currently, this repository has no explicit license. All rights reserved.
