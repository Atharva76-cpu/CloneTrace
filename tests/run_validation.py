import httpx
import json
import time

def test_apks(baseline_path, candidate_path):
    print(f"Testing {baseline_path} vs {candidate_path}")
    start_time = time.time()
    with open(baseline_path, "rb") as b, open(candidate_path, "rb") as c:
        files = {
            "baseline": (baseline_path, b, "application/vnd.android.package-archive"),
            "candidate": (candidate_path, c, "application/vnd.android.package-archive")
        }
        response = httpx.post("http://localhost:8000/api/v1/analyze", files=files, timeout=120.0)
    
    elapsed = time.time() - start_time
    print(f"Analysis took {elapsed:.2f} seconds")
    
    if response.status_code != 200:
        print("ERROR:", response.text)
        return None
        
    data = response.json()
    print("Clone Score:", data['scores']['clone'])
    print("Brand Score:", data['scores']['brand'])
    print("Threat Score:", data['scores']['threat'])
    print("Verdict:", data['verdict'])
    print("Coverage:", data['intelligence']['evidence_coverage']['coverage_percentage'])
    print("Clone DNA:", json.dumps(data['intelligence']['clone_dna'], indent=2))
    print("--------------------------------------------------")
    return data

if __name__ == "__main__":
    print("=== SAME APK TEST ===")
    test_apks("samples/calculator.apk", "samples/calculator.apk")

    print("=== DIFFERENT APK TEST ===")
    test_apks("samples/calculator.apk", "samples/flashlight.apk")
