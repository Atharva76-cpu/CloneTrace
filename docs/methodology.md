# CloneTrace Methodology

## Core Principles
1. **Deterministic Analysis**: CloneTrace relies on exact hashing, string matching, and structural counting, avoiding hallucination.
2. **Evidence Normalization**: Every finding (identity, visual, structural) is normalized into a standard `Evidence` schema containing `signal`, `similarity`, `availability`, and `reliability`.
3. **Missing != Dissimilar**: If a signal (like a perceptual icon hash) cannot be extracted, it does not artificially lower similarity scores.

## Three Score Engine
CloneTrace uses a weighted evidence model to compute three independent metrics:

1. **Clone Confidence**: Measures direct code/resource reuse. Highly weighted on cryptographic certificate matching, package names, preserved DEX strings, and API similarities.
2. **Brand Confidence**: Measures visual and identity imitation. Weighted on icon perceptual hashing (pHash) and app label strings.
3. **Threat Confidence**: Measures added malicious capability. Weighted on new sensitive permissions (SMS, Accessibility), new native libraries, and new network endpoints.

## Security-Sensitive Correlator
Single permissions do not flag an app as malware. The engine looks for combinations, e.g.:
- `RECEIVE_SMS` + `New Network Endpoint` = High Risk Exfiltration
- `SYSTEM_ALERT_WINDOW` + `New Network Endpoint` = High Risk Overlay/Phishing

## Verdict Generation
Verdicts are deterministically mapped from the three scores:
- **Repackaged Application**: High Clone, High Brand, Low Threat.
- **Trojanized Clone**: High Clone, High Threat.
- **Possible Lookalike**: High Brand, Low Clone.
