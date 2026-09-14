from typing import Dict, Any, List
from app.models.delta import Delta
from app.models.evidence import Evidence

class SecurityAnalyzer:
    def __init__(self, delta: Delta):
        self.delta = delta
        self.total_changes = 0
        self.security_sensitive_changes = 0
        self.high_risk_changes = 0
        self.findings = []
        self.correlations = []
        
    def _check_evidence(self, ev: Evidence):
        if not ev: return
        self.total_changes += 1
        
        is_sensitive = False
        is_high_risk = False
        reason = ""
        
        # 1. New Endpoints
        if ev.signal == "endpoints_added":
            is_sensitive = True
            reason = "New network endpoint added."
            if ev.severity == "HIGH":
                is_high_risk = True
                
        # 2. Permissions
        if ev.signal == "permissions_added":
            added_perms = ev.candidate_value if isinstance(ev.candidate_value, list) else []
            for p in added_perms:
                if "SMS" in p or "ACCESSIBILITY" in p or "SYSTEM_ALERT_WINDOW" in p:
                    is_sensitive = True
                    is_high_risk = True
                    reason = f"High-risk permission added: {p}"
                elif "INTERNET" in p or "LOCATION" in p:
                    is_sensitive = True
                    if not reason:
                        reason = f"Sensitive permission added: {p}"
                        
        # 3. Native Libs
        if ev.signal == "libraries_modified" or ev.signal == "libraries_added":
            is_sensitive = True
            reason = f"Native library {ev.signal.split('_')[1]}"
            if ev.severity == "HIGH":
                is_high_risk = True
                
        # 4. APIs
        if ev.signal == "api_packages_added":
            added_apis = ev.candidate_value if isinstance(ev.candidate_value, list) else []
            for a in added_apis:
                if "telephony" in a.lower() or "sms" in a.lower():
                    is_sensitive = True
                    is_high_risk = True
                    reason = f"Sensitive API added: {a}"
                    
        if is_sensitive:
            self.security_sensitive_changes += 1
            if is_high_risk:
                self.high_risk_changes += 1
                
            self.findings.append({
                "reason": reason,
                "severity": "HIGH" if is_high_risk else "MEDIUM",
                "baseline": ev.baseline_value,
                "candidate": ev.candidate_value,
                "source": ev.source_artifact
            })
            
    def _run_correlations(self):
        # High Risk Correlation Rules
        has_sms_perm = any("SMS" in str(p) for e in self.delta.manifest.added if e.signal == "permissions_added" for p in (e.candidate_value or []))
        has_new_endpoint = any(e.signal == "endpoints_added" for e in self.delta.network.added)
        has_overlay_perm = any("SYSTEM_ALERT_WINDOW" in str(p) for e in self.delta.manifest.added if e.signal == "permissions_added" for p in (e.candidate_value or []))
        has_accessibility = any("ACCESSIBILITY" in str(p) for e in self.delta.manifest.added if e.signal == "permissions_added" for p in (e.candidate_value or []))
        
        if has_sms_perm and has_new_endpoint:
            self.correlations.append({
                "rule": "SMS + New Endpoint",
                "risk": "HIGH-RISK CORRELATION",
                "explanation": "App added SMS capabilities along with new network endpoints, suggesting potential data exfiltration."
            })
            
        if has_overlay_perm and has_new_endpoint:
            self.correlations.append({
                "rule": "Overlay + New Endpoint",
                "risk": "HIGH-RISK CORRELATION",
                "explanation": "App added screen overlay (SYSTEM_ALERT_WINDOW) and network capabilities, a common phishing pattern."
            })
            
        if has_accessibility and has_new_endpoint:
            self.correlations.append({
                "rule": "Accessibility + New Endpoint",
                "risk": "HIGH-RISK CORRELATION",
                "explanation": "App added Accessibility services and network capabilities, suggesting potential credential harvesting."
            })

    def analyze(self) -> Dict[str, Any]:
        all_ev = self.delta.get_all_evidence()
        for ev in all_ev:
            if ev.category != "preserved": # Ignore preserved for deltas
                if ev.signal.endswith("_preserved"):
                    continue
                self._check_evidence(ev)
                
        self._run_correlations()
        
        return {
            "total_changes": self.total_changes,
            "security_sensitive_changes": self.security_sensitive_changes,
            "high_risk_changes": self.high_risk_changes,
            "findings": self.findings,
            "correlations": self.correlations
        }
