from typing import Dict, Any, List
import hashlib
from androguard.core.apk import APK
from androguard.core.dex import DEX

class StructuralAnalyzer:
    def __init__(self, apk: APK):
        self.apk = apk

    def get_resource_inventory(self) -> Dict[str, str]:
        """Returns a dict of filename to its sha256 hash."""
        resources = {}
        for filename in self.apk.get_files():
            try:
                data = self.apk.get_file(filename)
                if data:
                    sha256 = hashlib.sha256(data).hexdigest()
                    resources[filename] = sha256
            except Exception:
                pass
        return resources

    def get_string_extraction(self) -> List[str]:
        # Getting all strings from resources (arsc)
        strings = []
        arsc = self.apk.get_android_resources()
        if arsc:
            # We can extract strings from the string pool
            try:
                for pkg_name in arsc.get_packages_names():
                    pkg = arsc.get_package(pkg_name)
                    # For simplicity, we just dump strings we can find.
                    # A more thorough extraction might be needed later.
            except Exception:
                pass
        
        # We can also get strings from dex, but we'll do that in DEX analysis
        return strings
        
    def get_dex_inventory(self) -> Dict[str, Any]:
        inventory = {
            "class_count": 0,
            "method_count": 0,
            "field_count": 0,
            "dex_files": [],
            "app_classes": []
        }
        
        for dex_data in self.apk.get_all_dex():
            try:
                d = DEX(dex_data)
                inventory["dex_files"].append(hashlib.sha256(dex_data).hexdigest())
                
                for cls in d.get_classes():
                    cname = cls.get_name()
                    inventory["class_count"] += 1
                    methods = cls.get_methods()
                    fields = cls.get_fields()
                    inventory["method_count"] += len(methods)
                    inventory["field_count"] += len(fields)
                    
                    # Ignore android support libraries
                    if not (cname.startswith('Landroid') or cname.startswith('Ljava') or cname.startswith('Landroidx') or cname.startswith('Lkotlin')):
                        inventory["app_classes"].append({
                            "name": cname,
                            "methods": len(methods),
                            "fields": len(fields),
                            "superclass": cls.get_superclassname()
                        })
            except Exception:
                pass
                
        return inventory

    def analyze(self) -> Dict[str, Any]:
        return {
            "resources": self.get_resource_inventory(),
            "dex_inventory": self.get_dex_inventory(),
            # "strings": self.get_string_extraction() # Postponing full string extraction due to complexity
        }
