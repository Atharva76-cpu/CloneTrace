from typing import Dict, Any, List, Set
from androguard.core.apk import APK
from androguard.core.dex import DEX

class ApiAnalyzer:
    def __init__(self, apk: APK):
        self.apk = apk

    def extract_api_fingerprint(self) -> Dict[str, List[str]]:
        api_packages = set()
        api_classes = set()
        
        generic_frameworks = ('Landroid/view/', 'Landroid/app/', 'Landroid/content/', 'Landroid/os/', 'Landroid/widget/', 'Ljava/lang/', 'Ljava/util/', 'Landroidx/')
        
        for dex_data in self.apk.get_all_dex():
            try:
                d = DEX(dex_data)
                defined_classes = {cls.get_name() for cls in d.get_classes()}
                
                for s in d.get_strings():
                    if isinstance(s, bytes):
                        try:
                            s = s.decode('utf-8', 'ignore')
                        except:
                            continue
                    if not isinstance(s, str):
                        continue
                        
                    # All external references
                    if s.startswith('L') and s.endswith(';') and '/' in s:
                        if s not in defined_classes:
                            # It's an external API
                            api_classes.add(s)
                            parts = s.split('/')
                            pkg = ".".join(parts[:-1]).lstrip('L')
                            api_packages.add(pkg)
                            
            except Exception:
                pass
                
        generic_api = [p for p in api_packages if any(p.replace('.', '/').startswith(g.lstrip('L')) for g in generic_frameworks)]
        discriminative_api = [p for p in api_packages if p not in generic_api]
                
        return {
            "api_packages": list(api_packages),
            "generic_api_packages": generic_api,
            "discriminative_api_packages": discriminative_api,
            "api_classes": list(api_classes)
        }

    def analyze(self) -> Dict[str, Any]:
        return self.extract_api_fingerprint()
