import hashlib
from typing import Dict, Any, List
from androguard.core.apk import APK

class NativeAnalyzer:
    def __init__(self, apk: APK):
        self.apk = apk

    def extract_libraries(self) -> List[Dict[str, Any]]:
        libraries = []
        
        # Look for files in lib/
        for filename in self.apk.get_files():
            if filename.startswith('lib/') and filename.endswith('.so'):
                try:
                    data = self.apk.get_file(filename)
                    if data:
                        sha256 = hashlib.sha256(data).hexdigest()
                        
                        # path example: lib/arm64-v8a/libfoo.so
                        parts = filename.split('/')
                        arch = parts[1] if len(parts) > 1 else 'unknown'
                        
                        libraries.append({
                            "path": filename,
                            "arch": arch,
                            "sha256": sha256,
                            "size": len(data)
                        })
                except Exception:
                    pass
                    
        return libraries

    def analyze(self) -> Dict[str, Any]:
        return {
            "libraries": self.extract_libraries()
        }
