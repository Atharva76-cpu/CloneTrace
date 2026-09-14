# CloneTrace Architecture

## Components

### 1. Extractors (Analyzers)
Located in `backend/app/analyzers`.
- `IdentityAnalyzer`: SHA256, package name, signatures.
- `ManifestAnalyzer`: Permissions, components.
- `StructuralAnalyzer`: Resources and DEX counting.
- `VisualAnalyzer`: Icon pHash.
- `NetworkAnalyzer`: URL and domain regex against DEX strings.
- `NativeAnalyzer`: `.so` file hashing.
- `ApiAnalyzer`: Class reference extraction.

### 2. Delta Engine
`Comparator` takes two sets of analyzer outputs and produces a unified `Delta` object containing `preserved`, `added`, `removed`, and `modified` evidence.

### 3. Intelligence Layer
Located in `backend/app/engine/scorer.py` and `backend/app/engine/intelligence.py`.
- Computes Clone, Brand, and Threat scores based on heuristics.
- Generates Verdict.
- Correlates security-sensitive changes.
- Maps `Clone DNA`.

### 4. API (FastAPI)
`main.py` exposes `/api/v1/analyze` (APK upload) and `/api/v1/benchmark`.

### 5. Frontend (React)
Dashboard rendering the JSON data deterministically without modifying the findings.
