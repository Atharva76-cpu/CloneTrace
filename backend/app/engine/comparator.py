from typing import Dict, Any, List, Optional
from app.models.evidence import Evidence
from app.models.delta import Delta, DeltaCategory
import uuid

class Comparator:
    def __init__(self, baseline_results: Dict[str, Any], candidate_results: Dict[str, Any]):
        self.b = baseline_results
        self.c = candidate_results
        
    def _create_evidence(self, category: str, signal: str, b_val: Any, c_val: Any, severity: str = "INFO", explanation: str = "", similarity: Optional[float] = None) -> Evidence:
        difference = None
        if b_val != c_val:
            difference = f"Changed from {b_val} to {c_val}"
            
        return Evidence(
            evidence_id=str(uuid.uuid4()),
            category=category,
            signal=signal,
            baseline_value=b_val,
            candidate_value=c_val,
            similarity=similarity,
            difference=difference,
            availability=True,
            reliability="HIGH",
            severity=severity,
            explanation=explanation,
            source_artifact=category
        )

    def compare_identity(self) -> DeltaCategory:
        dc = DeltaCategory()
        b_meta = self.b.get('identity', {}).get('metadata', {})
        c_meta = self.c.get('identity', {}).get('metadata', {})
        
        # Package Name
        pkg_b = b_meta.get('package_name')
        pkg_c = c_meta.get('package_name')
        ev = self._create_evidence("identity", "package_name", pkg_b, pkg_c, "HIGH" if pkg_b != pkg_c else "INFO")
        if pkg_b == pkg_c:
            dc.preserved.append(ev)
        else:
            dc.modified.append(ev)

        # Version Code
        vc_b = b_meta.get('version_code')
        vc_c = c_meta.get('version_code')
        ev = self._create_evidence("identity", "version_code", vc_b, vc_c)
        if vc_b == vc_c:
            dc.preserved.append(ev)
        else:
            dc.modified.append(ev)
            
        # Certificates (simplified: check if exact same cert list)
        b_certs = self.b.get('identity', {}).get('certificates', [])
        c_certs = self.c.get('identity', {}).get('certificates', [])
        b_cert_hashes = {c['sha256'] for c in b_certs}
        c_cert_hashes = {c['sha256'] for c in c_certs}
        
        if b_cert_hashes == c_cert_hashes and len(b_cert_hashes) > 0:
            ev = self._create_evidence("identity", "certificate", list(b_cert_hashes), list(c_cert_hashes), "INFO", "Certificates are identical.")
            dc.preserved.append(ev)
        else:
            ev = self._create_evidence("identity", "certificate", list(b_cert_hashes), list(c_cert_hashes), "CRITICAL", "Signing certificates differ.")
            dc.modified.append(ev)

        return dc
        
    def compare_visual(self) -> DeltaCategory:
        dc = DeltaCategory()
        b_hash = self.b.get('visual', {}).get('icon_phash')
        c_hash = self.c.get('visual', {}).get('icon_phash')
        
        ev = self._create_evidence("visual", "icon_phash", b_hash, c_hash)
        if b_hash and c_hash:
            if b_hash == c_hash:
                dc.preserved.append(ev)
            else:
                # Calculate hamming distance of perceptual hash for similarity (simplified here)
                dc.modified.append(ev)
        elif b_hash and not c_hash:
            dc.removed.append(ev)
        elif not b_hash and c_hash:
            dc.added.append(ev)
            
        return dc
        
    def compare_manifest(self) -> DeltaCategory:
        dc = DeltaCategory()
        b_perms = set(self.b.get('manifest', {}).get('permissions', []))
        c_perms = set(self.c.get('manifest', {}).get('permissions', []))
        
        added = c_perms - b_perms
        removed = b_perms - c_perms
        preserved = b_perms.intersection(c_perms)
        
        if preserved:
            dc.preserved.append(self._create_evidence("manifest", "permissions", list(preserved), list(preserved)))
        if added:
            dc.added.append(self._create_evidence("manifest", "permissions_added", None, list(added), "MEDIUM"))
        if removed:
            dc.removed.append(self._create_evidence("manifest", "permissions_removed", list(removed), None))
            
        return dc
        
    def compare_structural(self) -> DeltaCategory:
        dc = DeltaCategory()
        b_res = self.b.get('structural', {}).get('resources', {})
        c_res = self.c.get('structural', {}).get('resources', {})
        
        # Invariant 1: Resource Topology
        added = set(c_res.keys()) - set(b_res.keys())
        removed = set(b_res.keys()) - set(c_res.keys())
        common = set(b_res.keys()).intersection(set(c_res.keys()))
        
        if common:
            dc.preserved.append(self._create_evidence("structural", "resources_preserved", len(common), len(common)))
        if added:
            dc.added.append(self._create_evidence("structural", "resources_added", 0, len(added)))
        if removed:
            dc.removed.append(self._create_evidence("structural", "resources_removed", len(removed), 0))
            
        # Invariant 2: App Class DNA (Methods count + Fields count + Superclass)
        b_classes = self.b.get('structural', {}).get('dex_inventory', {}).get('app_classes', [])
        c_classes = self.c.get('structural', {}).get('dex_inventory', {}).get('app_classes', [])
        
        b_dna = [f"{c.get('methods')}_{c.get('fields')}_{c.get('superclass')}" for c in b_classes]
        c_dna = [f"{c.get('methods')}_{c.get('fields')}_{c.get('superclass')}" for c in c_classes]
        
        # We use Counter to do multiset intersection
        from collections import Counter
        b_counts = Counter(b_dna)
        c_counts = Counter(c_dna)
        
        common_dna_count = sum((b_counts & c_counts).values())
        added_dna_count = sum((c_counts - b_counts).values())
        removed_dna_count = sum((b_counts - c_counts).values())
        
        if common_dna_count > 0:
            dc.preserved.append(self._create_evidence("structural", "app_class_dna_preserved", common_dna_count, common_dna_count))
        if added_dna_count > 0:
            dc.added.append(self._create_evidence("structural", "app_class_dna_added", 0, added_dna_count))
        if removed_dna_count > 0:
            dc.removed.append(self._create_evidence("structural", "app_class_dna_removed", removed_dna_count, 0))
            
        return dc

    def compare_network(self) -> DeltaCategory:
        dc = DeltaCategory()
        b_urls = set(self.b.get('network', {}).get('urls', []))
        c_urls = set(self.c.get('network', {}).get('urls', []))
        
        added = c_urls - b_urls
        removed = b_urls - c_urls
        preserved = b_urls.intersection(c_urls)
        
        if preserved:
            dc.preserved.append(self._create_evidence("network", "endpoints_preserved", len(preserved), len(preserved)))
        if added:
            dc.added.append(self._create_evidence("network", "endpoints_added", 0, len(added), "WARNING", "Added Endpoints"))
        if removed:
            dc.removed.append(self._create_evidence("network", "endpoints_removed", len(removed), 0))
            
        return dc
        
    def compare_native(self) -> DeltaCategory:
        dc = DeltaCategory()
        b_libs_raw = self.b.get('native', {}).get('libraries', [])
        c_libs_raw = self.c.get('native', {}).get('libraries', [])
        
        b_libs = {lib['path']: lib['sha256'] for lib in b_libs_raw}
        c_libs = {lib['path']: lib['sha256'] for lib in c_libs_raw}
        
        added = set(c_libs.keys()) - set(b_libs.keys())
        removed = set(b_libs.keys()) - set(c_libs.keys())
        common = set(b_libs.keys()).intersection(set(c_libs.keys()))
        
        modified = []
        preserved = []
        for lib in common:
            if b_libs[lib] == c_libs[lib]:
                preserved.append(lib)
            else:
                modified.append(lib)
                
        if preserved:
            dc.preserved.append(self._create_evidence("native", "libraries_preserved", len(preserved), len(preserved)))
        if added:
            dc.added.append(self._create_evidence("native", "libraries_added", 0, len(added)))
        if modified:
            dc.modified.append(self._create_evidence("native", "libraries_modified", 0, len(modified), "WARNING", "Modified Native Libs"))
        if removed:
            dc.removed.append(self._create_evidence("native", "libraries_removed", len(removed), 0))
            
        return dc

    def compare_api(self) -> DeltaCategory:
        dc = DeltaCategory()
        
        # Generic API
        b_gen = set(self.b.get('api', {}).get('generic_api_packages', []))
        c_gen = set(self.c.get('api', {}).get('generic_api_packages', []))
        common_gen = b_gen.intersection(c_gen)
        if common_gen:
            dc.preserved.append(self._create_evidence("api", "generic_api_packages_preserved", len(common_gen), len(common_gen)))
            
        # Discriminative API
        b_disc = set(self.b.get('api', {}).get('discriminative_api_packages', []))
        c_disc = set(self.c.get('api', {}).get('discriminative_api_packages', []))
        common_disc = b_disc.intersection(c_disc)
        added_disc = c_disc - b_disc
        removed_disc = b_disc - c_disc
        
        if common_disc:
            dc.preserved.append(self._create_evidence("api", "discriminative_api_packages_preserved", len(common_disc), len(common_disc)))
        if added_disc:
            dc.added.append(self._create_evidence("api", "discriminative_api_packages_added", 0, len(added_disc), "INFO", "Added Custom APIs"))
        if removed_disc:
            dc.removed.append(self._create_evidence("api", "discriminative_api_packages_removed", len(removed_disc), 0))
            
        return dc

    def generate_delta(self) -> Delta:
        delta = Delta()
        b_hash = self.b.get('identity', {}).get('file_sha256')
        c_hash = self.c.get('identity', {}).get('file_sha256')
        if b_hash and c_hash and b_hash == c_hash:
            delta.exact_binary_match = True
            
        delta.identity = self.compare_identity()
        delta.visual = self.compare_visual()
        delta.manifest = self.compare_manifest()
        delta.resources = self.compare_structural()
        delta.network = self.compare_network()
        delta.native = self.compare_native()
        delta.api = self.compare_api()
        return delta
