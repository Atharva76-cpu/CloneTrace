import os
import shutil
import subprocess
import zipfile
import json
import hashlib
from datetime import datetime

# Paths
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
APKTOOL_JAR = os.path.join(BASE_DIR, 'scripts', 'apktool.jar')
KEYSTORE = os.path.join(BASE_DIR, 'scripts', 'test.keystore')
ORIGINAL_APK = os.path.abspath(os.path.join(BASE_DIR, '..', 'samples', 'calculator.apk'))
UNRELATED_APK = os.path.abspath(os.path.join(BASE_DIR, '..', 'samples', 'flashlight.apk'))

B0_APK = os.path.join(BASE_DIR, 'original', 'B0.apk')
UNPACKED_DIR = os.path.join(BASE_DIR, 'scripts', 'unpacked')

def get_sha256(filepath):
    if not os.path.exists(filepath):
        return None
    h = hashlib.sha256()
    with open(filepath, 'rb') as f:
        for chunk in iter(lambda: f.read(4096), b""):
            h.update(chunk)
    return h.hexdigest()

def run_cmd(cmd):
    print(f"Running: {cmd}")
    subprocess.run(cmd, shell=True, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def sign_apk(apk_path):
    cmd = f'jarsigner -keystore {KEYSTORE} -storepass password -keypass password -sigalg SHA256withRSA -digestalg SHA-256 {apk_path} testkey'
    run_cmd(cmd)

def write_metadata(variant, expected_rel, transformations, expected_sec, source_sha, out_sha, success=True, reason=""):
    meta = {
        "variant": variant,
        "base": "B0",
        "expected_relationship": expected_rel,
        "expected_transformations": transformations,
        "expected_security_delta": expected_sec,
        "source_sha256": source_sha,
        "output_sha256": out_sha,
        "timestamp": datetime.utcnow().isoformat(),
        "generated": success,
        "reason": reason
    }
    with open(os.path.join(BASE_DIR, 'metadata', f'{variant}.json'), 'w') as f:
        json.dump(meta, f, indent=2)

def strip_signature(in_apk, out_apk):
    with zipfile.ZipFile(in_apk, 'r') as zin:
        with zipfile.ZipFile(out_apk, 'w') as zout:
            for item in zin.infolist():
                if not item.filename.startswith('META-INF/'):
                    zout.writestr(item, zin.read(item.filename))

def replace_in_file(filepath, old, new):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace(old, new)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def build_variant(variant_name, unpack_dir, transformations_fn):
    variant_dir = os.path.join(BASE_DIR, 'scripts', f'{variant_name}_dir')
    if os.path.exists(variant_dir):
        shutil.rmtree(variant_dir)
    shutil.copytree(unpack_dir, variant_dir)
    
    transformations_fn(variant_dir)
    
    out_apk = os.path.join(BASE_DIR, 'variants', f'{variant_name}.apk')
    if os.path.exists(out_apk):
        os.remove(out_apk)
        
    try:
        run_cmd(f'java -jar {APKTOOL_JAR} b {variant_dir} -o {out_apk}')
        sign_apk(out_apk)
        return True, ""
    except Exception as e:
        return False, str(e)

def main():
    print("Starting B0-B11 Generation...")
    shutil.copy(ORIGINAL_APK, B0_APK)
    b0_sha = get_sha256(B0_APK)
    write_metadata("B0", "ORIGINAL", [], False, b0_sha, b0_sha)

    # B11 Unrelated
    b11_apk = os.path.join(BASE_DIR, 'variants', 'B11.apk')
    shutil.copy(UNRELATED_APK, b11_apk)
    write_metadata("B11", "UNRELATED", ["unrelated_apk"], "unknown", b0_sha, get_sha256(b11_apk))

    # B2 Re-sign
    b2_apk = os.path.join(BASE_DIR, 'variants', 'B2.apk')
    strip_signature(B0_APK, b2_apk)
    sign_apk(b2_apk)
    write_metadata("B2", "CLONE", ["resign"], False, b0_sha, get_sha256(b2_apk))

    # Unpack B0
    if os.path.exists(UNPACKED_DIR):
        shutil.rmtree(UNPACKED_DIR)
    print("Unpacking B0...")
    run_cmd(f'java -jar {APKTOOL_JAR} d {B0_APK} -o {UNPACKED_DIR} -f')

    # B1 Package rename
    def mod_b1(d):
        replace_in_file(os.path.join(d, 'AndroidManifest.xml'), 'package="com.simplemobiletools.calculator"', 'package="com.clone.calculator"')
    succ, err = build_variant("B1", UNPACKED_DIR, mod_b1)
    write_metadata("B1", "CLONE", ["package_rename"], False, b0_sha, get_sha256(os.path.join(BASE_DIR, 'variants', 'B1.apk')) if succ else None, succ, err)

    # B3 Package rename + resign (same as B1 since we always sign)
    def mod_b3(d):
        replace_in_file(os.path.join(d, 'AndroidManifest.xml'), 'package="com.simplemobiletools.calculator"', 'package="com.clone.calculator"')
    succ, err = build_variant("B3", UNPACKED_DIR, mod_b3)
    write_metadata("B3", "CLONE", ["package_rename", "resign"], False, b0_sha, get_sha256(os.path.join(BASE_DIR, 'variants', 'B3.apk')) if succ else None, succ, err)

    # B4 Class/method rename
    def mod_b4(d):
        smali_dir = os.path.join(d, 'smali', 'com', 'simplemobiletools', 'calculator')
        if os.path.exists(smali_dir):
            replace_in_file(os.path.join(smali_dir, 'activities', 'MainActivity.smali'), 'MainActivity', 'CloneActivity')
    succ, err = build_variant("B4", UNPACKED_DIR, mod_b4)
    write_metadata("B4", "CLONE", ["class_rename"], False, b0_sha, get_sha256(os.path.join(BASE_DIR, 'variants', 'B4.apk')) if succ else None, succ, err)

    # B5 String mod
    def mod_b5(d):
        replace_in_file(os.path.join(d, 'res', 'values', 'strings.xml'), 'Calculator', 'CloneCalc')
    succ, err = build_variant("B5", UNPACKED_DIR, mod_b5)
    write_metadata("B5", "CLONE", ["string_mod"], False, b0_sha, get_sha256(os.path.join(BASE_DIR, 'variants', 'B5.apk')) if succ else None, succ, err)

    # B6 Icon mod
    def mod_b6(d):
        # To make a valid PNG mutation, we copy an icon from another APK or just a 1x1 png.
        # Here we just write a tiny valid 1x1 transparent PNG.
        valid_png = bytes.fromhex('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082')
        import glob
        for f in glob.glob(os.path.join(d, 'res', 'mipmap*', '*.png')):
            with open(f, 'wb') as img:
                img.write(valid_png)
    succ, err = build_variant("B6", UNPACKED_DIR, mod_b6)
    write_metadata("B6", "CLONE", ["icon_mod"], False, b0_sha, get_sha256(os.path.join(BASE_DIR, 'variants', 'B6.apk')) if succ else None, succ, err)

    # B7 SMS
    def mod_b7(d):
        replace_in_file(os.path.join(d, 'AndroidManifest.xml'), '<application', '<uses-permission android:name="android.permission.SEND_SMS"/>\n    <application')
    succ, err = build_variant("B7", UNPACKED_DIR, mod_b7)
    write_metadata("B7", "CLONE", ["sms_capability_added"], True, b0_sha, get_sha256(os.path.join(BASE_DIR, 'variants', 'B7.apk')) if succ else None, succ, err)

    # B8 Accessibility
    def mod_b8(d):
        replace_in_file(os.path.join(d, 'AndroidManifest.xml'), '<application', '<uses-permission android:name="android.permission.BIND_ACCESSIBILITY_SERVICE"/>\n    <application')
    succ, err = build_variant("B8", UNPACKED_DIR, mod_b8)
    write_metadata("B8", "CLONE", ["accessibility_capability_added"], True, b0_sha, get_sha256(os.path.join(BASE_DIR, 'variants', 'B8.apk')) if succ else None, succ, err)

    # B9 Endpoint
    def mod_b9(d):
        smali_dir = os.path.join(d, 'smali', 'com', 'simplemobiletools', 'calculator')
        if os.path.exists(smali_dir):
            replace_in_file(os.path.join(smali_dir, 'activities', 'MainActivity.smali'), 'return-void', 'const-string v0, "http://malicious.clone.com/api/steal"\n    return-void')
    succ, err = build_variant("B9", UNPACKED_DIR, mod_b9)
    write_metadata("B9", "CLONE", ["endpoint_added"], True, b0_sha, get_sha256(os.path.join(BASE_DIR, 'variants', 'B9.apk')) if succ else None, succ, err)

    # B10 Clone + Malicious
    def mod_b10(d):
        mod_b1(d)
        mod_b5(d)
        mod_b7(d)
        mod_b8(d)
        mod_b9(d)
    succ, err = build_variant("B10", UNPACKED_DIR, mod_b10)
    write_metadata("B10", "CLONE", ["package_rename", "string_mod", "sms_capability_added", "accessibility_capability_added", "endpoint_added"], True, b0_sha, get_sha256(os.path.join(BASE_DIR, 'variants', 'B10.apk')) if succ else None, succ, err)

    print("Generation complete!")

if __name__ == '__main__':
    main()
