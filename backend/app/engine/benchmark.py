import os
from typing import Dict, Any, List

class BenchmarkRunner:
    def __init__(self, samples_dir: str):
        self.samples_dir = samples_dir
        self.variants = [
            {"id": "B0", "name": "Original"},
            {"id": "B1", "name": "Package rename"},
            {"id": "B2", "name": "Re-sign"},
            {"id": "B3", "name": "Package rename + re-sign"},
            {"id": "B4", "name": "Class/method rename"},
            {"id": "B5", "name": "String modification"},
            {"id": "B6", "name": "Icon modification"},
            {"id": "B7", "name": "SMS capability injection"},
            {"id": "B8", "name": "Accessibility capability injection"},
            {"id": "B9", "name": "New endpoint"},
            {"id": "B10", "name": "Combined clone + malicious modification"},
            {"id": "B11", "name": "Unrelated/brand-similar app"}
        ]
        
    def check_artifacts(self) -> Dict[str, bool]:
        status = {}
        for v in self.variants:
            apk_path = os.path.join(self.samples_dir, f"{v['id']}.apk")
            status[v['id']] = os.path.exists(apk_path)
        return status

    def run(self) -> Dict[str, Any]:
        results = {
            "status": "pending_artifacts",
            "message": "Benchmark requires APK artifacts (B0.apk - B11.apk) to run real evaluations. Currently missing.",
            "variants_status": self.check_artifacts(),
            "metrics": {
                "precision": None,
                "recall": None,
                "f1": None,
                "false_positives": None,
                "false_negatives": None
            }
        }
        return results

class BaselineDetector:
    def __init__(self, baseline_results: Dict[str, Any], candidate_results: Dict[str, Any]):
        self.b = baseline_results
        self.c = candidate_results
        
    def is_clone(self) -> bool:
        # Simple detector: Must match exactly in certificate OR package OR icon
        b_certs = {c['sha256'] for c in self.b.get('identity', {}).get('certificates', [])}
        c_certs = {c['sha256'] for c in self.c.get('identity', {}).get('certificates', [])}
        if b_certs.intersection(c_certs) and len(b_certs) > 0:
            return True
            
        b_pkg = self.b.get('identity', {}).get('metadata', {}).get('package_name')
        c_pkg = self.c.get('identity', {}).get('metadata', {}).get('package_name')
        if b_pkg and c_pkg and b_pkg == c_pkg:
            return True
            
        b_icon = self.b.get('visual', {}).get('icon_phash')
        c_icon = self.c.get('visual', {}).get('icon_phash')
        if b_icon and c_icon and b_icon == c_icon:
            return True
            
        return False
