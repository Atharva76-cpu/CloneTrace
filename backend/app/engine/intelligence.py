from typing import Dict, Any, List
from app.models.delta import Delta

class IntelligenceEngine:
    def __init__(self, delta: Delta, scores: Dict[str, int]):
        self.delta = delta
        self.scores = scores if isinstance(scores, dict) else {}
        
    def get_signal_disagreements(self) -> List[Dict[str, str]]:
        disagreements = []
        c = self.scores.get("clone") or 0
        b = self.scores.get("brand") or 0
        
        has_cert_preserved = any(e.signal == "certificate" for e in self.delta.identity.preserved)
        has_pkg_preserved = any(e.signal == "package_name" for e in self.delta.identity.preserved)
        
        if c > 70 and not has_cert_preserved and not has_pkg_preserved:
            disagreements.append({
                "signal_disagreement": "High code similarity + Low identity continuity",
                "explanation": "The candidate shares high structural code similarity but differs entirely in package name and signing certificate. This often indicates unauthorized repackaging.",
                "affected_signals": ["structural", "certificate", "package_name"]
            })
            
        if b > 80 and c < 30:
            disagreements.append({
                "signal_disagreement": "High brand similarity + Low code similarity",
                "explanation": "The candidate perfectly mimics the visual branding but shares almost no code structure. This is highly indicative of a purpose-built lookalike or phishing app.",
                "affected_signals": ["visual", "structural"]
            })
            
        return disagreements

    def get_evidence_coverage(self) -> Dict[str, Any]:
        expected = ["identity", "visual", "resources", "manifest", "network", "native", "api"]
        available = []
        
        # Check if we got evidence in these categories
        def has_evidence(cat: Any) -> bool:
            return len(cat.preserved) > 0 or len(cat.added) > 0 or len(cat.removed) > 0 or len(cat.modified) > 0
            
        if has_evidence(self.delta.identity): available.append("identity")
        if has_evidence(self.delta.visual): available.append("visual")
        if has_evidence(self.delta.resources): available.append("resources")
        if has_evidence(self.delta.manifest): available.append("manifest")
        if has_evidence(self.delta.network): available.append("network")
        if has_evidence(self.delta.native): available.append("native")
        if has_evidence(self.delta.api): available.append("api")
        
        percentage = len(available) / len(expected) * 100
        
        if percentage > 80: status = "HIGH"
        elif percentage > 50: status = "MEDIUM"
        else: status = "LOW"
        
        return {
            "available_categories": available,
            "expected_categories": expected,
            "coverage_percentage": round(percentage, 1),
            "coverage_status": status
        }

    def _calc_dim_score(self, category: str, delta_cat) -> Dict[str, Any]:
        preserved = len(delta_cat.preserved)
        added = len(delta_cat.added)
        removed = len(delta_cat.removed)
        modified = len(delta_cat.modified)
        
        if preserved == 0 and added == 0 and removed == 0 and modified == 0:
            return {"score": None, "availability": False, "reliability": "N/A", "key_evidence": "No evidence extracted for this dimension."}
        
        total_baseline = preserved + removed + modified
        if total_baseline == 0 and added > 0:
            return {"score": 0, "availability": True, "reliability": "MEDIUM", "key_evidence": f"Added {added} new items."}
        elif total_baseline == 0:
            return {"score": None, "availability": False, "reliability": "N/A", "key_evidence": "No baseline evidence."}
            
        score = (preserved / total_baseline) * 100
        return {"score": int(score), "availability": True, "reliability": "HIGH", "key_evidence": f"Preserved {preserved} of {total_baseline}."}

    def get_clone_dna(self) -> Dict[str, Any]:
        return {
            "identity": self._calc_dim_score("identity", self.delta.identity),
            "visual": self._calc_dim_score("visual", self.delta.visual),
            "resources": self._calc_dim_score("resources", self.delta.resources),
            "code": self._calc_dim_score("code", self.delta.manifest), # Manifest as proxy if DEX string structural isn't its own cat
            "api": self._calc_dim_score("api", self.delta.api),
            "network": self._calc_dim_score("network", self.delta.network),
            "native": self._calc_dim_score("native", self.delta.native)
        }
