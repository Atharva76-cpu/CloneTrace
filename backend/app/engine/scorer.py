from typing import Dict, Any, List
from app.models.delta import Delta

class Scorer:
    def __init__(self, delta: Delta):
        self.delta = delta
        self.scores = {
            "clone": None,
            "brand": None,
            "threat": 0
        }
        self.contributions = {
            "clone": {},
            "brand": {},
            "threat": {}
        }
        self.verdict = "INSUFFICIENT EVIDENCE"
        self.verdict_reason = ""
        self.smoking_gun = ""
        
    def _calculate_clone_confidence(self):
        score = 0
        max_weight = 0
        
        # 1. Discriminative APIs Preserved (Very Strong invariant structural evidence)
        api_disc_pres = next((e.baseline_value for e in self.delta.api.preserved if e.signal == "discriminative_api_packages_preserved"), 0)
        api_disc_removed = next((e.baseline_value for e in self.delta.api.removed if e.signal == "discriminative_api_packages_removed"), 0)
        total_api_disc = api_disc_pres + api_disc_removed
        
        if total_api_disc > 0:
            max_weight += 30
            api_score = (api_disc_pres / total_api_disc) * 30
            score += api_score
            self.contributions['clone']['discriminative_api'] = api_score
            
        # 1.5 Generic APIs (Very low weight)
        api_gen_pres = next((e.baseline_value for e in self.delta.api.preserved if e.signal == "generic_api_packages_preserved"), 0)
        if api_gen_pres > 0:
            max_weight += 5
            score += 5
            self.contributions['clone']['generic_api'] = 5

        # 2. App Class DNA Preserved (Invariant to obfuscation/renaming)
        dna_pres = next((e.baseline_value for e in self.delta.resources.preserved if e.signal == "app_class_dna_preserved"), 0)
        dna_removed = next((e.baseline_value for e in self.delta.resources.removed if e.signal == "app_class_dna_removed"), 0)
        total_dna = dna_pres + dna_removed
        
        if total_dna > 0:
            max_weight += 40
            dna_score = (dna_pres / total_dna) * 40
            score += dna_score
            self.contributions['clone']['class_dna'] = dna_score

        # 3. Resources Preserved (Invariant structural layout)
        res_pres = next((e.baseline_value for e in self.delta.resources.preserved if e.signal == "resources_preserved"), 0)
        res_removed = next((e.baseline_value for e in self.delta.resources.removed if e.signal == "resources_removed"), 0)
        total_res = res_pres + res_removed
        
        if total_res > 0:
            max_weight += 15
            res_score = (res_pres / total_res) * 15
            score += res_score
            self.contributions['clone']['resources'] = res_score

        # 4. Package Continuity (Contextual)
        has_pkg_ev = any(e.signal == "package_name" for l in [self.delta.identity.preserved, self.delta.identity.modified, self.delta.identity.added, self.delta.identity.removed] for e in l)
        if has_pkg_ev:
            max_weight += 5
            if any(e.signal == "package_name" for e in self.delta.identity.preserved):
                score += 5
                self.contributions['clone']['package'] = 5
            else:
                self.contributions['clone']['package'] = 0

        # 5. Certificate Continuity (Contextual)
        has_cert_ev = any(e.signal == "certificate" for l in [self.delta.identity.preserved, self.delta.identity.modified, self.delta.identity.added, self.delta.identity.removed] for e in l)
        if has_cert_ev:
            max_weight += 5
            if any(e.signal == "certificate" for e in self.delta.identity.preserved):
                score += 5
                self.contributions['clone']['certificate'] = 5
            else:
                self.contributions['clone']['certificate'] = 0
                
        if max_weight == 0:
            self.scores['clone'] = None
        else:
            scaled = (score / max_weight) * 100
            self.scores['clone'] = min(100, max(0, int(scaled)))
        
    def _calculate_brand_confidence(self):
        score = 0
        max_weight = 0
        
        # 1. Icon similarity
        has_icon_ev = any(e.signal == "icon_phash" for l in [self.delta.visual.preserved, self.delta.visual.modified, self.delta.visual.added, self.delta.visual.removed] for e in l)
        if has_icon_ev:
            max_weight += 50
            if any(e.signal == "icon_phash" for e in self.delta.visual.preserved):
                score += 50
                self.contributions['brand']['icon'] = 50
            else:
                self.contributions['brand']['icon'] = 0
                
        # 2. Package similarity
        has_pkg_ev = any(e.signal == "package_name" for l in [self.delta.identity.preserved, self.delta.identity.modified, self.delta.identity.added, self.delta.identity.removed] for e in l)
        if has_pkg_ev:
            max_weight += 30
            if any(e.signal == "package_name" for e in self.delta.identity.preserved):
                score += 30
                self.contributions['brand']['package'] = 30
            else:
                self.contributions['brand']['package'] = 0
                
        if max_weight == 0:
            self.scores['brand'] = None
        else:
            scaled = (score / max_weight) * 100
            self.scores['brand'] = min(100, max(0, int(scaled)))
        
    def _calculate_threat_confidence(self):
        score = 0
        
        # Threat shouldn't be scaled up if things are missing; if missing, threat is just 0
        perms_added = next((e.candidate_value for e in self.delta.manifest.added if e.signal == "permissions_added"), [])
        sensitive_perms = [
            "android.permission.RECEIVE_SMS",
            "android.permission.READ_SMS",
            "android.permission.SEND_SMS",
            "android.permission.BIND_ACCESSIBILITY_SERVICE",
            "android.permission.SYSTEM_ALERT_WINDOW"
        ]
        
        added_sensitive = [p for p in perms_added if p in sensitive_perms]
        if added_sensitive:
            score += len(added_sensitive) * 15
            self.contributions['threat']['permissions'] = len(added_sensitive) * 15
            
        endpoints_added = next((e.candidate_value for e in self.delta.network.added if e.signal == "endpoints_added"), 0)
        if endpoints_added > 0:
            base_score = 10
            if added_sensitive:
                base_score = 25
            score += base_score
            self.contributions['threat']['network'] = base_score
            
        libs_modified = next((e.candidate_value for e in self.delta.native.modified if e.signal == "libraries_modified"), 0)
        if libs_modified > 0:
            score += 15
            self.contributions['threat']['native_libs'] = 15
            
        self.scores['threat'] = min(100, max(0, int(score)))

    def _determine_verdict(self):
        if self.delta.exact_binary_match:
            self.verdict = "EXACT BINARY MATCH"
            self.verdict_reason = "The candidate APK is a bit-for-bit identical copy of the baseline APK (SHA256 match)."
            self.smoking_gun = "File SHA256 hashes are identical."
            return

        c = self.scores['clone'] if self.scores['clone'] is not None else 0
        b = self.scores['brand'] if self.scores['brand'] is not None else 0
        t = self.scores['threat'] if self.scores['threat'] is not None else 0
        
        if c > 80 and b > 80 and t < 20:
            self.verdict = "REPACKAGED APPLICATION"
            self.verdict_reason = "High clone and brand similarity with minimal threat indicators. Likely an unauthorized copy or benign fork."
        elif c > 70 and t > 40:
            self.verdict = "TROJANIZED CLONE"
            self.verdict_reason = "High clone similarity but significant threat indicators added."
            self.smoking_gun = "Application preserves structural integrity but introduces high-risk capabilities or endpoints."
        elif b > 70 and c < 40:
            self.verdict = "POSSIBLE LOOKALIKE"
            self.verdict_reason = "High brand similarity but low structural similarity. Likely built from scratch to imitate."
        elif c > 40 and c <= 70:
            self.verdict = "SUSPICIOUS DERIVATIVE"
            self.verdict_reason = "Moderate structural overlap suggesting partial code reuse."
        elif c < 20 and b < 20:
            self.verdict = "UNRELATED"
            self.verdict_reason = "No significant structural or visual similarity found."
        else:
            self.verdict = "INSUFFICIENT EVIDENCE"
            self.verdict_reason = "Analysis scores do not strongly match known impersonation profiles."
            
    def compute(self):
        self._calculate_clone_confidence()
        self._calculate_brand_confidence()
        self._calculate_threat_confidence()
        self._determine_verdict()
        
    def get_results(self) -> Dict[str, Any]:
        return {
            "scores": self.scores,
            "contributions": self.contributions,
            "verdict": self.verdict,
            "verdict_reason": self.verdict_reason,
            "smoking_gun": self.smoking_gun
        }
