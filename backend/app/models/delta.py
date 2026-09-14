from typing import List, Dict, Any
from pydantic import BaseModel
from .evidence import Evidence

class DeltaCategory(BaseModel):
    preserved: List[Evidence] = []
    added: List[Evidence] = []
    modified: List[Evidence] = []
    removed: List[Evidence] = []

class Delta(BaseModel):
    exact_binary_match: bool = False
    identity: DeltaCategory = DeltaCategory()
    visual: DeltaCategory = DeltaCategory()
    resources: DeltaCategory = DeltaCategory()
    code: DeltaCategory = DeltaCategory()
    manifest: DeltaCategory = DeltaCategory()
    capabilities: DeltaCategory = DeltaCategory()
    # P1 features:
    api: DeltaCategory = DeltaCategory()
    network: DeltaCategory = DeltaCategory()
    native: DeltaCategory = DeltaCategory()

    def get_all_evidence(self) -> List[Evidence]:
        all_ev = []
        for cat_name in self.model_fields:
            if cat_name == "exact_binary_match":
                continue
            cat: DeltaCategory = getattr(self, cat_name)
            all_ev.extend(cat.preserved)
            all_ev.extend(cat.added)
            all_ev.extend(cat.modified)
            all_ev.extend(cat.removed)
        return all_ev
