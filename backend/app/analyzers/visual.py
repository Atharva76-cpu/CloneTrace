import io
import imagehash
from PIL import Image
from typing import Dict, Any, Optional
from androguard.core.apk import APK

class VisualAnalyzer:
    def __init__(self, apk: APK):
        self.apk = apk

    def extract_icon_hash(self) -> Optional[str]:
        # Try to find the icon file
        icon_path = self.apk.get_app_icon()
        if not icon_path:
            return None
            
        try:
            icon_data = self.apk.get_file(icon_path)
            if not icon_data:
                return None
                
            image = Image.open(io.BytesIO(icon_data))
            # Normalize image to RGB
            if image.mode != 'RGB':
                image = image.convert('RGB')
            # Calculate perceptual hash (phash)
            phash = str(imagehash.phash(image))
            return phash
        except Exception as e:
            return None

    def analyze(self) -> Dict[str, Any]:
        return {
            "icon_phash": self.extract_icon_hash()
        }
