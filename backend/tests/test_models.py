import pytest
from app.models.evidence import Evidence
from app.models.delta import Delta, DeltaCategory

def test_evidence_model():
    ev = Evidence(
        evidence_id="123",
        category="identity",
        signal="package_name",
        baseline_value="com.example.app",
        candidate_value="com.example.app",
        similarity=1.0,
        availability=True,
        reliability="HIGH",
        severity="INFO",
        explanation="Package names match.",
        source_artifact="AndroidManifest.xml"
    )
    assert ev.category == "identity"
    assert ev.baseline_value == ev.candidate_value

def test_delta_model():
    d = Delta()
    assert isinstance(d.identity, DeltaCategory)
    
    ev = Evidence(
        evidence_id="123",
        category="identity",
        signal="package_name",
        baseline_value="com.example.app",
        candidate_value="com.example.clone",
        availability=True,
        reliability="HIGH",
        severity="HIGH",
        explanation="Package changed.",
        source_artifact="AndroidManifest.xml"
    )
    d.identity.modified.append(ev)
    all_ev = d.get_all_evidence()
    assert len(all_ev) == 1
    assert all_ev[0].signal == "package_name"
