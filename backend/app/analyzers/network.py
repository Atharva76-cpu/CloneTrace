import re
from typing import Dict, Any, List, Set
from androguard.core.apk import APK
from androguard.core.dex import DEX

class NetworkAnalyzer:
    def __init__(self, apk: APK):
        self.apk = apk
        # Regex for basic URL extraction (http/https)
        self.url_pattern = re.compile(r'https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+[/\w\.-]*')

    def extract_endpoints(self) -> Dict[str, List[str]]:
        urls = set()
        domains = set()
        
        # We need to extract strings from DEX
        dex_strings = set()
        for dex_data in self.apk.get_all_dex():
            try:
                d = DEX(dex_data)
                # DEX.get_strings returns a list of strings
                for s in d.get_strings():
                    dex_strings.add(s)
            except Exception:
                pass
                
        # Also extract strings from resources (AndroidManifest and resources.arsc) if needed
        # We'll stick to DEX for endpoints as that's where most API endpoints are
        
        for s in dex_strings:
            if isinstance(s, bytes):
                try:
                    s = s.decode('utf-8', 'ignore')
                except:
                    continue
            if not isinstance(s, str):
                continue
                
            found_urls = self.url_pattern.findall(s)
            for url in found_urls:
                # Normalize URL: lowercase, strip trailing slash
                url = url.lower().rstrip('/')
                urls.add(url)
                
                # Extract domain
                # e.g. https://api.example.com/v1/ -> api.example.com
                match = re.search(r'https?://([^/:]+)', url)
                if match:
                    domains.add(match.group(1))

        return {
            "urls": list(urls),
            "domains": list(domains)
        }

    def analyze(self) -> Dict[str, Any]:
        return self.extract_endpoints()
