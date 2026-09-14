from typing import Any, Optional, Dict
from pydantic import BaseModel, Field

class Evidence(BaseModel):
    evidence_id: str
    category: str
    signal: str
    baseline_value: Any
    candidate_value: Any
    similarity: Optional[float] = None  # 0.0 to 1.0 where applicable
    difference: Optional[str] = None
    availability: bool
    reliability: str  # HIGH, MEDIUM, LOW
    severity: str     # INFO, LOW, MEDIUM, HIGH, CRITICAL
    explanation: str
    source_artifact: str
