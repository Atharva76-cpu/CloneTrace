# CloneTrace Adversarial Benchmark (B0-B11)

This repository contains the methodology, variants, and results for the controlled CloneTrace robustness evaluation. 
The goal is to determine the operational limits of CloneTrace against deterministic transformation techniques.

## Methodology
The benchmark operates entirely statically.
1. `B0` (the baseline APK) is unpacked via `apktool`.
2. Targeted transformations (namespace, strings, resources, certificates, smali injection) are statically applied.
3. The variant is repacked and signed with a test keystore.
4. Each variant is analyzed against B0 using the unmodified CloneTrace `/api/v1/analyze` pipeline.

## Transformations & Ground Truth

| Variant | Name | Expected Relationship | Security Delta? |
|---------|------|-----------------------|----------------|
| **B0** | Original | ORIGINAL | False |
| **B1** | Package Rename | CLONE | False |
| **B2** | Re-signed | CLONE | False |
| **B3** | Package Rename + Re-sign | CLONE | False |
| **B4** | Class/Method Rename | CLONE | False |
| **B5** | String Mod | CLONE | False |
| **B6** | Icon Mod | CLONE | False |
| **B7** | Injected SEND_SMS | CLONE | **True** |
| **B8** | Injected ACCESSIBILITY | CLONE | **True** |
| **B9** | Injected Malicious Endpoint | CLONE | **True** |
| **B10**| Combined Clone + Malicious | CLONE | **True** |
| **B11**| Unrelated App | UNRELATED | unknown |

## Limitations
- Static analysis only. Does not cover dynamic packing or encryption.
- F-Droid adaptive XML icons bypass standard pHash.
- Repacking breaks the original signature. B1 technically acts as B3 (repack + resign).

## Tools Used
- `apktool 2.9.3`: Disassembly and assembly of `.apk`
- `jarsigner`: Test key signature generation
- `androguard 4.1.4`: Core CloneTrace pipeline engine
