import httpx
import json
import time
import os
import csv

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
VARIANTS_DIR = os.path.join(BASE_DIR, 'variants')
B0_APK = os.path.join(BASE_DIR, 'original', 'B0.apk')
RESULTS_JSON = os.path.join(BASE_DIR, 'results.json')
RESULTS_CSV = os.path.join(BASE_DIR, 'results.csv')

VARIANTS = [f"B{i}" for i in range(12)]

def analyze(candidate_path):
    print(f"Testing B0 vs {os.path.basename(candidate_path)}")
    start_time = time.time()
    try:
        with open(B0_APK, "rb") as b, open(candidate_path, "rb") as c:
            files = {
                "baseline": (B0_APK, b, "application/vnd.android.package-archive"),
                "candidate": (candidate_path, c, "application/vnd.android.package-archive")
            }
            response = httpx.post("http://localhost:8000/api/v1/analyze", files=files, timeout=300.0)
            
        elapsed = time.time() - start_time
        if response.status_code != 200:
            print("ERROR:", response.text)
            return None, elapsed
        return response.json(), elapsed
    except Exception as e:
        print(f"Failed to analyze: {e}")
        return None, time.time() - start_time

def main():
    results = {}
    
    csv_rows = []
    
    for variant in VARIANTS:
        v_apk = os.path.join(VARIANTS_DIR, f"{variant}.apk")
        if variant == "B0":
            v_apk = B0_APK
            
        if not os.path.exists(v_apk):
            print(f"Skipping {variant}, file not found")
            continue
            
        data, runtime = analyze(v_apk)
        if not data:
            continue
            
        # Extract baseline vs multidimensional CloneTrace
        # Baseline = certificate + package + icon
        meta_path = os.path.join(BASE_DIR, 'metadata', f"{variant}.json")
        meta = {}
        if os.path.exists(meta_path):
            with open(meta_path, 'r') as mf:
                meta = json.load(mf)
                
        # Parse output
        scores = data['scores']
        dna = data['intelligence']['clone_dna']
        threat = scores['threat'] or 0
        
        # Calculate naive baseline
        c_cert = dna.get('identity', {}).get('score', 0) or 0
        v_icon = dna.get('visual', {}).get('score', 0) or 0
        
        res = {
            "variant": variant,
            "generated": True,
            "clone_score": scores['clone'],
            "brand_score": scores['brand'],
            "threat_score": threat,
            "coverage": data['intelligence']['evidence_coverage']['coverage_percentage'],
            "verdict": data['verdict'],
            "exact_match": data['delta'].get('exact_binary_match', False),
            "certificate_similarity": c_cert,
            "package_similarity": c_cert, # Package bundled with identity
            "icon_similarity": v_icon,
            "string_similarity": dna.get('resources', {}).get('score'),
            "resource_similarity": dna.get('resources', {}).get('score'),
            "dex_similarity": dna.get('code', {}).get('score'),
            "api_similarity": dna.get('api', {}).get('score'),
            "security_delta_count": len(data['intelligence'].get('security_deltas', [])),
            "smoking_gun_count": 1 if data.get('smoking_gun') else 0,
            "disagreement_count": len(data['intelligence'].get('signal_disagreements', [])),
            "runtime_seconds": runtime
        }
        
        results[variant] = res
        csv_rows.append(res)
        
    with open(RESULTS_JSON, 'w') as f:
        json.dump(results, f, indent=2)
        
    if csv_rows:
        keys = csv_rows[0].keys()
        with open(RESULTS_CSV, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=keys)
            writer.writeheader()
            writer.writerows(csv_rows)
            
    print("Done!")

if __name__ == '__main__':
    main()
