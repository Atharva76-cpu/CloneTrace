# CloneTrace Limitations

Never overclaim. The current MVP has the following known boundaries:

## Supported Features
- Static analysis of un-obfuscated or lightly obfuscated APKs.
- Manifest, Network URL (via DEX strings), API references (via DEX classes), and `.so` library comparisons.
- Icon perceptual hashing for standard PNG resources.

## Unsupported/Limitations
1. **Dynamic Evasion**: CloneTrace is a purely static engine. It does not run APKs in a sandbox and will miss endpoints constructed dynamically at runtime (e.g., via string decryption routines).
2. **Heavy Obfuscation**: Advanced commercial packers (e.g., DexGuard) that encrypt the entire DEX will render the structural similarity and API extraction useless. 
3. **Adaptive Icons**: Icon extraction relies on standard `res/drawable` PNGs. Modern XML adaptive icons may fail perceptual hashing in this version.
4. **Full String Extraction**: Currently limited to DEX string pools; ARSC string pools are not exhaustively dumped for delta comparisons to save memory.
5. **No External Network Requests**: Extracted endpoints are reported but never contacted.
6. **No Universal Resistance**: The engine is susceptible to basic adversarial evasion (like complete package renaming combined with massive dead-code injection) if it dilutes the ratios sufficiently.
