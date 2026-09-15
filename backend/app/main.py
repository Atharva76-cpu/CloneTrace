from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import tempfile
import os
import uuid
import gc
import traceback
import logging
import datetime
from typing import Dict, Any

from app.analyzers.identity import IdentityAnalyzer
from app.analyzers.manifest import ManifestAnalyzer
from app.analyzers.structural import StructuralAnalyzer
from app.analyzers.visual import VisualAnalyzer
from app.analyzers.network import NetworkAnalyzer
from app.analyzers.native import NativeAnalyzer
from app.analyzers.api import ApiAnalyzer
from app.engine.comparator import Comparator
from app.engine.scorer import Scorer
from app.models.delta import Delta

from androguard.core.apk import APK

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MAX_APK_SIZE = 10 * 1024 * 1024  # 10MB per APK

app = FastAPI(title="CloneTrace Forensic Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "error": type(exc).__name__},
    )

def analyze_apk(file_path: str) -> Dict[str, Any]:
    apk = APK(file_path)
    
    identity_analyzer = IdentityAnalyzer(apk, file_path)
    manifest_analyzer = ManifestAnalyzer(apk)
    structural_analyzer = StructuralAnalyzer(apk)
    visual_analyzer = VisualAnalyzer(apk)
    network_analyzer = NetworkAnalyzer(apk)
    native_analyzer = NativeAnalyzer(apk)
    api_analyzer = ApiAnalyzer(apk)
    
    return {
        "identity": identity_analyzer.analyze(),
        "manifest": manifest_analyzer.analyze(),
        "structural": structural_analyzer.analyze(),
        "visual": visual_analyzer.analyze(),
        "network": network_analyzer.analyze(),
        "native": native_analyzer.analyze(),
        "api": api_analyzer.analyze()
    }

@app.post("/api/v1/analyze")
async def compare_apks(baseline: UploadFile = File(...), candidate: UploadFile = File(...)):
    b_path = None
    c_path = None
    
    try:
        b_content = await baseline.read()
        c_content = await candidate.read()

        if len(b_content) > MAX_APK_SIZE or len(c_content) > MAX_APK_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"APK files must be under {MAX_APK_SIZE // (1024*1024)}MB. "
                       f"Got {len(b_content) // (1024*1024)}MB and {len(c_content) // (1024*1024)}MB."
            )

        b_path = os.path.join(tempfile.gettempdir(), f"baseline_{uuid.uuid4()}.apk")
        c_path = os.path.join(tempfile.gettempdir(), f"candidate_{uuid.uuid4()}.apk")
        
        logger.info(f"Writing baseline APK ({len(b_content)} bytes) to {b_path}")
        with open(b_path, "wb") as b_out:
            b_out.write(b_content)

        logger.info(f"Writing candidate APK ({len(c_content)} bytes) to {c_path}")
        with open(c_path, "wb") as c_out:
            c_out.write(c_content)

        # Analyze baseline
        logger.info("Analyzing baseline APK...")
        b_results = analyze_apk(b_path)
        gc.collect()

        # Analyze candidate
        logger.info("Analyzing candidate APK...")
        c_results = analyze_apk(c_path)
        gc.collect()
        
        # Compare
        logger.info("Comparing APKs...")
        comparator = Comparator(b_results, c_results)
        delta = comparator.generate_delta()
        
        # Score
        logger.info("Scoring...")
        scorer = Scorer(delta)
        scorer.compute()
        score_results = scorer.get_results()
        
        logger.info(f"Verdict: {score_results['verdict']}")
        
        # Security Analysis
        from app.engine.security import SecurityAnalyzer
        sec_analyzer = SecurityAnalyzer(delta)
        sec_results = sec_analyzer.analyze()
        
        # Intelligence Analysis
        from app.engine.intelligence import IntelligenceEngine
        intel_engine = IntelligenceEngine(delta, score_results["scores"])
        
        return {
            "timestamp": datetime.datetime.now().isoformat(),
            "status": "success",
            "delta": delta.model_dump(),
            "scores": score_results["scores"],
            "contributions": score_results["contributions"],
            "verdict": score_results["verdict"],
            "verdict_reason": score_results["verdict_reason"],
            "smoking_gun": score_results["smoking_gun"],
            "security": sec_results,
            "intelligence": {
                "signal_disagreements": intel_engine.get_signal_disagreements(),
                "evidence_coverage": intel_engine.get_evidence_coverage(),
                "clone_dna": intel_engine.get_clone_dna()
            },
            "limitations": [
                "API extraction relies on DEX strings and may miss dynamic usage.",
                "Icon similarity uses perceptual hashing which is vulnerable to rotation/scaling.",
                "String extraction is currently limited to DEX string pools."
            ],
            "baseline_summary": b_results['identity'],
            "candidate_summary": c_results['identity']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in compare_apks: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"{type(e).__name__}: {str(e)}"
        )
    finally:
        for p in [b_path, c_path]:
            if p and os.path.exists(p):
                try:
                    os.remove(p)
                except:
                    pass
        gc.collect()

@app.get("/api/v1/benchmark")
def run_benchmark():
    from app.engine.benchmark import BenchmarkRunner
    runner = BenchmarkRunner(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "samples"))
    return runner.run()

@app.get("/api/v1/health")
def health_check():
    return {"status": "ok"}
