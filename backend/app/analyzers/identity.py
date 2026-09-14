import hashlib
import os
from typing import Dict, Any, List
from androguard.core.apk import APK

class IdentityAnalyzer:
    def __init__(self, apk_path: str):
        self.apk_path = apk_path
        self.apk = APK(apk_path)
        
    def get_file_sha256(self) -> str:
        sha256_hash = hashlib.sha256()
        with open(self.apk_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()
        
    def extract_metadata(self) -> Dict[str, Any]:
        return {
            "package_name": self.apk.get_package(),
            "app_label": self.apk.get_app_name(),
            "version_name": self.apk.get_androidversion_name(),
            "version_code": self.apk.get_androidversion_code(),
            "min_sdk": self.apk.get_min_sdk_version(),
            "target_sdk": self.apk.get_target_sdk_version(),
        }
        
    def extract_certificates(self) -> List[Dict[str, Any]]:
        certs = []
        try:
            # androguard get_certificates returns a list of x509.Certificate
            for cert in self.apk.get_certificates():
                # Extract details
                sha256 = cert.sha256.hex()
                sha1 = cert.sha1.hex()
                issuer = cert.issuer.human_friendly
                subject = cert.subject.human_friendly
                serial = hex(cert.serial_number)
                
                certs.append({
                    "sha256": sha256,
                    "sha1": sha1,
                    "issuer": issuer,
                    "subject": subject,
                    "serial": serial
                })
        except Exception as e:
            # Fallback if cert extraction fails
            pass
            
        return certs

    def analyze(self) -> Dict[str, Any]:
        return {
            "file_sha256": self.get_file_sha256(),
            "metadata": self.extract_metadata(),
            "certificates": self.extract_certificates()
        }
