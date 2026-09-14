from typing import Dict, Any, List
from androguard.core.apk import APK

class ManifestAnalyzer:
    def __init__(self, apk: APK):
        self.apk = apk

    def extract_components(self) -> Dict[str, Any]:
        return {
            "permissions": self.apk.get_permissions(),
            "activities": self.apk.get_activities(),
            "services": self.apk.get_services(),
            "receivers": self.apk.get_receivers(),
            "providers": self.apk.get_providers(),
            # Intent filters are a bit more involved in androguard
            "intent_filters": self._extract_intent_filters()
        }

    def _extract_intent_filters(self) -> Dict[str, List[Dict[str, str]]]:
        """
        Extracts intent filters mapping component name to its filters.
        """
        filters = {}
        # This requires parsing the xml directly in some cases, but androguard has get_intent_filters
        try:
            # We'll just grab activity intent filters for now as an example,
            # we should expand to services and receivers.
            for activity in self.apk.get_activities():
                act_filters = self.apk.get_intent_filters('activity', activity)
                if act_filters:
                    filters[activity] = act_filters
                    
            for service in self.apk.get_services():
                srv_filters = self.apk.get_intent_filters('service', service)
                if srv_filters:
                    filters[service] = srv_filters
                    
            for receiver in self.apk.get_receivers():
                recv_filters = self.apk.get_intent_filters('receiver', receiver)
                if recv_filters:
                    filters[receiver] = recv_filters
        except Exception as e:
            pass
            
        return filters

    def analyze(self) -> Dict[str, Any]:
        return self.extract_components()
