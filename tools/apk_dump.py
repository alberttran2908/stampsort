#!/usr/bin/env python3
"""Bóc tách APK/XAPK (hoặc thư mục đã giải nén) để phục vụ nghiên cứu game design.

Kết quả ghi vào <out>/<package>/:
  report.md        – tóm tắt: manifest, engine, SDK, kích thước, asset text đáng chú ý
  inventory.json   – danh sách file trong APK kèm kích thước
  strings.json     – string resources (res/values/strings.xml) nếu đọc được
  extracted/       – các file text (json/csv/txt/xml/yaml/ini/properties) trong assets/ và res/raw/
  unity/           – TextAsset và tên MonoBehaviour/ScriptableObject lấy từ Unity bundle (nếu là Unity)

Cách dùng:
  python3 tools/apk_dump.py game.apk --out research/apk
  python3 tools/apk_dump.py path/to/unzipped_dir --out research/apk --package com.example.game
  python3 tools/apk_dump.py game.xapk --out research/apk

Phụ thuộc (tuỳ chọn, script vẫn chạy khi thiếu):
  pip install --ignore-installed androguard UnityPy
"""
from __future__ import annotations

import argparse
import io
import json
import os
import re
import shutil
import sys
import tempfile
import zipfile
from collections import Counter, defaultdict
from pathlib import Path

TEXT_EXT = {".json", ".csv", ".txt", ".xml", ".yaml", ".yml", ".ini", ".properties", ".tsv", ".cfg", ".lua", ".js"}
MAX_TEXT_BYTES = 20 * 1024 * 1024

# Nhận diện SDK qua prefix package trong DEX hoặc tên file .so
SDK_SIGNATURES = {
    "AppLovin MAX": ["com.applovin"],
    "AdMob / Google Ads": ["com.google.android.gms.ads"],
    "Unity Ads": ["com.unity3d.ads", "com.unity3d.services"],
    "ironSource / LevelPlay": ["com.ironsource"],
    "Facebook Audience Network": ["com.facebook.ads"],
    "Facebook SDK": ["com.facebook.appevents", "com.facebook.login"],
    "Mintegral": ["com.mbridge"],
    "Vungle / Liftoff": ["com.vungle"],
    "Chartboost": ["com.chartboost"],
    "Pangle": ["com.bytedance.sdk.openadsdk"],
    "InMobi": ["com.inmobi"],
    "Fyber / DT Exchange": ["com.fyber"],
    "Moloco": ["com.moloco"],
    "BIGO Ads": ["sg.bigo.ads"],
    "Yandex Ads": ["com.yandex.mobile.ads"],
    "AppsFlyer": ["com.appsflyer"],
    "Adjust": ["com.adjust.sdk"],
    "Branch": ["io.branch"],
    "Firebase Analytics": ["com.google.firebase.analytics"],
    "Firebase Remote Config": ["com.google.firebase.remoteconfig"],
    "Firebase Crashlytics": ["com.google.firebase.crashlytics"],
    "Firebase Messaging": ["com.google.firebase.messaging"],
    "Google Play Billing": ["com.android.billingclient"],
    "Google Play Games": ["com.google.android.gms.games"],
    "GameAnalytics": ["com.gameanalytics"],
    "Amplitude": ["com.amplitude"],
    "Singular": ["com.singular"],
    "Tenjin": ["com.tenjin"],
    "Unity Engine (Java)": ["com.unity3d.player"],
    "Cocos (Java)": ["org.cocos2dx"],
    "Godot (Java)": ["org.godotengine"],
    "Unreal (Java)": ["com.epicgames"],
    "Flutter": ["io.flutter"],
    "React Native": ["com.facebook.react"],
    "Capacitor": ["com.getcapacitor"],
    "Cordova": ["org.apache.cordova"],
}

ENGINE_SO = {
    "libunity.so": "Unity",
    "libil2cpp.so": "Unity (IL2CPP)",
    "libmono.so": "Unity (Mono)",
    "libcocos2djs.so": "Cocos Creator (JS)",
    "libcocos2dlua.so": "Cocos2d-x (Lua)",
    "libcocos2dcpp.so": "Cocos2d-x (C++)",
    "libgodot_android.so": "Godot",
    "libUE4.so": "Unreal Engine 4",
    "libUnreal.so": "Unreal Engine 5",
    "libflutter.so": "Flutter",
    "libdefold.so": "Defold",
}


def human(n: int) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024:
            return f"{n:.0f}{unit}" if unit == "B" else f"{n:.1f}{unit}"
        n /= 1024
    return f"{n:.1f}TB"


# ---------------------------------------------------------------------------
# Nguồn: thư mục đã giải nén hoặc zip. Chuẩn hoá về một thư mục tạm.
# ---------------------------------------------------------------------------
def materialize(src: Path, workdir: Path) -> tuple[Path, list[Path]]:
    """Trả về (thư mục gốc APK chính, danh sách APK phụ nếu là XAPK/split)."""
    if src.is_dir():
        return src, []
    suffix = src.suffix.lower()
    if suffix in (".xapk", ".apks", ".zip"):
        outer = workdir / "outer"
        with zipfile.ZipFile(src) as z:
            z.extractall(outer)
        apks = sorted(outer.rglob("*.apk"))
        if not apks:
            sys.exit("Không tìm thấy .apk bên trong gói.")
        base = next((a for a in apks if a.name in ("base.apk",) or "config." not in a.name), apks[0])
        base_dir = workdir / "base"
        with zipfile.ZipFile(base) as z:
            z.extractall(base_dir)
        others = []
        for a in apks:
            if a == base:
                continue
            d = workdir / ("split_" + a.stem)
            with zipfile.ZipFile(a) as z:
                z.extractall(d)
            others.append(d)
        return base_dir, others
    base_dir = workdir / "base"
    with zipfile.ZipFile(src) as z:
        z.extractall(base_dir)
    return base_dir, []


def inventory(roots: list[Path]) -> list[dict]:
    items = []
    for root in roots:
        for p in root.rglob("*"):
            if p.is_file():
                items.append({"path": str(p.relative_to(root)).replace(os.sep, "/"), "size": p.stat().st_size})
    return sorted(items, key=lambda x: -x["size"])


def size_by_top(items: list[dict]) -> list[tuple[str, int]]:
    agg: Counter = Counter()
    for it in items:
        top = it["path"].split("/", 1)[0] if "/" in it["path"] else it["path"]
        agg[top] += it["size"]
    return agg.most_common()


# ---------------------------------------------------------------------------
# Manifest & DEX qua androguard (tuỳ chọn)
# ---------------------------------------------------------------------------
def analyze_with_androguard(apk_path: Path | None) -> dict:
    info: dict = {}
    if apk_path is None:
        return info
    try:  # androguard dùng loguru, tắt để không làm ồn stdout
        from loguru import logger  # type: ignore
        logger.remove()
    except Exception:
        pass
    try:
        from androguard.core.apk import APK  # type: ignore
    except Exception:
        try:
            from androguard.core.bytecodes.apk import APK  # type: ignore
        except Exception as e:  # pragma: no cover
            info["error"] = f"androguard không khả dụng: {e}"
            return info
    try:
        a = APK(str(apk_path))
        info["package"] = a.get_package()
        info["version_name"] = a.get_androidversion_name()
        info["version_code"] = a.get_androidversion_code()
        info["min_sdk"] = a.get_min_sdk_version()
        info["target_sdk"] = a.get_target_sdk_version()
        info["app_name"] = a.get_app_name()
        info["permissions"] = sorted(a.get_permissions())
        info["main_activity"] = a.get_main_activity()
        info["activities"] = a.get_activities()[:60]
        try:
            info["meta_data"] = _manifest_meta(a)
        except Exception:
            pass
        # String resources
        try:
            res = a.get_android_resources()
            pkg = res.get_packages_names()[0]
            strings = {}
            for k, v in res.get_resolved_strings()[pkg].get("DEFAULT", {}).items():
                strings[k] = v
            info["strings"] = strings
        except Exception:
            pass
    except Exception as e:
        info["error"] = f"androguard lỗi khi đọc manifest: {e}"
    return info


def _manifest_meta(a) -> dict:
    """Lấy các <meta-data> (Firebase app id, AppLovin key, AdMob app id ...)."""
    out = {}
    xml = a.get_android_manifest_xml()
    ns = "{http://schemas.android.com/apk/res/android}"
    for md in xml.iter("meta-data"):
        name = md.get(ns + "name")
        val = md.get(ns + "value") or md.get(ns + "resource")
        if name:
            out[name] = val
    return out


def detect_sdks_from_dex(roots: list[Path]) -> dict[str, int]:
    """Đếm class theo prefix package trong classes*.dex (không cần androguard nặng)."""
    found: Counter = Counter()
    dex_files = [p for r in roots for p in r.glob("classes*.dex")]
    if not dex_files:
        return {}
    pat = re.compile(rb"L([a-z][a-z0-9_]*(?:/[a-z][a-zA-Z0-9_]*){1,5})/")
    for dex in dex_files:
        data = dex.read_bytes()
        for m in pat.finditer(data):
            pkg = m.group(1).decode("ascii", "ignore").replace("/", ".")
            for sdk, prefixes in SDK_SIGNATURES.items():
                if any(pkg == p or pkg.startswith(p + ".") for p in prefixes):
                    found[sdk] += 1
                    break
    return dict(found.most_common())


def detect_engine(items: list[dict]) -> list[str]:
    hits = set()
    for it in items:
        name = it["path"].rsplit("/", 1)[-1]
        if name in ENGINE_SO:
            hits.add(ENGINE_SO[name])
        if it["path"].startswith("assets/bin/Data/"):
            hits.add("Unity (assets/bin/Data)")
        if it["path"].startswith("assets/aa/"):
            hits.add("Unity Addressables (assets/aa)")
        if it["path"] == "assets/bin/Data/Managed/Metadata/global-metadata.dat":
            hits.add("Unity IL2CPP metadata")
    return sorted(hits)


def native_libs(items: list[dict]) -> dict[str, list[str]]:
    libs: defaultdict = defaultdict(set)
    for it in items:
        if it["path"].startswith("lib/"):
            parts = it["path"].split("/")
            if len(parts) >= 3:
                libs[parts[1]].add(parts[2])
    return {k: sorted(v) for k, v in libs.items()}


# ---------------------------------------------------------------------------
# Trích xuất file text đáng chú ý
# ---------------------------------------------------------------------------
def extract_text_assets(roots: list[Path], dest: Path) -> list[str]:
    copied = []
    for root in roots:
        for sub in ("assets", "res/raw"):
            base = root / sub
            if not base.exists():
                continue
            for p in base.rglob("*"):
                if not p.is_file() or p.suffix.lower() not in TEXT_EXT:
                    continue
                if p.stat().st_size > MAX_TEXT_BYTES:
                    continue
                if "/bin/Data/" in str(p).replace(os.sep, "/"):
                    continue  # Unity binary, xử lý riêng
                rel = p.relative_to(root)
                target = dest / rel
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(p, target)
                copied.append(str(rel).replace(os.sep, "/"))
    return sorted(copied)


KEYWORDS = ["level", "stage", "difficult", "booster", "hint", "undo", "shuffle", "coin", "gem", "reward",
            "daily", "event", "streak", "tutorial", "remote", "config", "price", "iap", "ads", "interstitial",
            "cooldown", "lives", "energy", "heart", "shop", "collection", "album", "stamp"]


def interesting_files(copied: list[str]) -> list[str]:
    return [c for c in copied if any(k in c.lower() for k in KEYWORDS)]


# ---------------------------------------------------------------------------
# Unity: liệt kê TextAsset / MonoBehaviour trong bundle
# ---------------------------------------------------------------------------
def dump_unity(roots: list[Path], dest: Path, limit_objects: int = 20000) -> dict:
    summary: dict = {"text_assets": [], "monobehaviour_names": {}, "containers": [], "errors": []}
    try:
        import UnityPy  # type: ignore
    except Exception as e:
        summary["errors"].append(f"UnityPy không khả dụng: {e}")
        return summary

    candidates: list[Path] = []
    for root in roots:
        data_dir = root / "assets" / "bin" / "Data"
        if data_dir.exists():
            for p in data_dir.rglob("*"):
                if p.is_file() and (p.name.startswith(("level", "sharedassets", "globalgamemanagers", "resources"))
                                    or p.suffix in (".assets", ".unity3d", ".bundle", ".resS") or p.name == "data.unity3d"):
                    candidates.append(p)
        for extra in ("assets/aa", "assets/StreamingAssets"):
            d = root / extra
            if d.exists():
                candidates += [p for p in d.rglob("*") if p.is_file() and p.suffix in (".bundle", ".unity3d", ".assets", "")]
    if not candidates:
        return summary

    seen = 0
    mono_names: Counter = Counter()
    for c in candidates:
        try:
            env = UnityPy.load(str(c))
        except Exception as e:
            summary["errors"].append(f"{c.name}: {e}")
            continue
        try:
            for path, obj in env.container.items():
                summary["containers"].append(path)
        except Exception:
            pass
        for obj in env.objects:
            seen += 1
            if seen > limit_objects:
                summary["errors"].append(f"Dừng sau {limit_objects} object; tăng --unity-limit nếu cần.")
                break
            try:
                if obj.type.name == "TextAsset":
                    data = obj.read()
                    name = getattr(data, "m_Name", None) or getattr(data, "name", f"obj_{obj.path_id}")
                    raw = getattr(data, "m_Script", None) or getattr(data, "script", b"")
                    if isinstance(raw, str):
                        raw = raw.encode("utf-8", "ignore")
                    out = dest / "TextAsset" / f"{name}.txt"
                    out.parent.mkdir(parents=True, exist_ok=True)
                    out.write_bytes(raw[:MAX_TEXT_BYTES])
                    summary["text_assets"].append(f"TextAsset/{name}.txt ({human(len(raw))})")
                elif obj.type.name == "MonoBehaviour":
                    try:
                        tree = obj.read_typetree()
                        n = tree.get("m_Name") or ""
                        script = tree.get("m_Script", {})
                        mono_names[n or f"<noname:{obj.path_id}>"] += 1
                        # Ghi ScriptableObject có tên (thường là config/level data)
                        if n:
                            out = dest / "MonoBehaviour" / f"{n}.json"
                            out.parent.mkdir(parents=True, exist_ok=True)
                            if not out.exists():
                                out.write_text(json.dumps(tree, ensure_ascii=False, indent=1, default=str)[:MAX_TEXT_BYTES])
                    except Exception:
                        mono_names["<unreadable typetree>"] += 1
            except Exception as e:
                summary["errors"].append(f"{c.name}#{obj.path_id}: {e}")
        if seen > limit_objects:
            break
    summary["monobehaviour_names"] = dict(mono_names.most_common(300))
    summary["containers"] = sorted(set(summary["containers"]))[:2000]
    return summary


# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------
def write_report(out: Path, src: Path, ag: dict, items: list[dict], engines: list[str], sdks: dict,
                 libs: dict, copied: list[str], unity: dict) -> None:
    total = sum(i["size"] for i in items)
    lines = [f"# Báo cáo bóc tách: {ag.get('package') or src.name}", ""]
    lines += ["## Manifest", ""]
    for k in ("package", "app_name", "version_name", "version_code", "min_sdk", "target_sdk", "main_activity"):
        if ag.get(k) is not None:
            lines.append(f"- **{k}**: {ag[k]}")
    if ag.get("error"):
        lines.append(f"- _Lỗi manifest_: {ag['error']}")
    if ag.get("meta_data"):
        lines += ["", "### meta-data đáng chú ý", ""]
        for k, v in sorted(ag["meta_data"].items()):
            if any(s in k.lower() for s in ("applovin", "admob", "ads", "firebase", "appsflyer", "unity", "facebook", "game", "sdk")):
                lines.append(f"- `{k}` = `{v}`")
    if ag.get("permissions"):
        lines += ["", "### Permissions", ""] + [f"- {p}" for p in ag["permissions"]]

    lines += ["", "## Engine", ""] + ([f"- {e}" for e in engines] or ["- Không nhận diện được (xem lib/ và assets/)"])
    lines += ["", "## Native libs", ""]
    for abi, names in libs.items():
        lines.append(f"- **{abi}** ({len(names)}): " + ", ".join(names[:40]) + (" ..." if len(names) > 40 else ""))

    lines += ["", "## SDK nhận diện từ DEX (số class)", ""]
    lines += [f"- {k}: {v}" for k, v in sdks.items()] or ["- Không tìm thấy classes*.dex hoặc không khớp signature"]

    lines += ["", f"## Kích thước ({human(total)} tổng, {len(items)} file)", "", "| Thư mục | Kích thước |", "|---|---|"]
    lines += [f"| {k} | {human(v)} |" for k, v in size_by_top(items)[:15]]
    lines += ["", "### 25 file lớn nhất", ""] + [f"- {i['path']} ({human(i['size'])})" for i in items[:25]]

    lines += ["", f"## File text đã trích xuất ({len(copied)}) → `extracted/`", ""]
    hot = interesting_files(copied)
    if hot:
        lines += ["### Có từ khoá game design", ""] + [f"- {c}" for c in hot[:200]]
    if len(copied) > len(hot):
        lines += ["", "### Còn lại", ""] + [f"- {c}" for c in copied if c not in hot][:200]

    if unity.get("text_assets") or unity.get("monobehaviour_names") or unity.get("errors"):
        lines += ["", "## Unity → `unity/`", ""]
        if unity.get("text_assets"):
            lines += ["### TextAsset", ""] + [f"- {t}" for t in unity["text_assets"][:300]]
        if unity.get("monobehaviour_names"):
            lines += ["", "### MonoBehaviour / ScriptableObject (tên: số lượng)", ""]
            lines += [f"- {k}: {v}" for k, v in list(unity["monobehaviour_names"].items())[:300]]
        if unity.get("containers"):
            lines += ["", f"### Container paths ({len(unity['containers'])})", ""] + [f"- {c}" for c in unity["containers"][:300]]
        if unity.get("errors"):
            lines += ["", "### Lỗi khi đọc Unity", ""] + [f"- {e}" for e in unity["errors"][:50]]

    lines += ["", "## Gợi ý bước tiếp theo", "",
              "- Grep `extracted/` và `unity/` theo: level, difficulty, booster, coin, reward, interstitial, cooldown, price.",
              "- Nếu là Unity IL2CPP: `global-metadata.dat` + `libil2cpp.so` cho phép dump tên class/method (Il2CppDumper) để hiểu hệ thống.",
              "- Nếu có Firebase Remote Config: tìm file `remote_config_defaults` / `*.xml` trong res/xml.",
              "- Đối chiếu string resources (`strings.json`) để xác định tên tính năng, event, booster hiển thị cho người chơi."]
    (out / "report.md").write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("src", help=".apk / .xapk / .apks hoặc thư mục đã giải nén")
    ap.add_argument("--out", default="research/apk", help="thư mục gốc kết quả")
    ap.add_argument("--package", help="tên package (bắt buộc nếu src là thư mục và không đọc được manifest)")
    ap.add_argument("--no-unity", action="store_true", help="bỏ qua bước đọc Unity bundle")
    ap.add_argument("--unity-limit", type=int, default=20000, help="số object Unity tối đa sẽ duyệt")
    args = ap.parse_args()

    src = Path(args.src).expanduser().resolve()
    if not src.exists():
        sys.exit(f"Không thấy: {src}")

    with tempfile.TemporaryDirectory(prefix="apkdump_") as tmp:
        workdir = Path(tmp)
        base_dir, splits = materialize(src, workdir)
        roots = [base_dir] + splits
        items = inventory(roots)

        apk_for_manifest: Path | None = None
        if src.is_file() and src.suffix.lower() == ".apk":
            apk_for_manifest = src
        elif src.is_file():
            cands = sorted(workdir.rglob("*.apk"))
            apk_for_manifest = next((c for c in cands if c.name == "base.apk"), cands[0] if cands else None)
        elif (src / "AndroidManifest.xml").exists():
            # Thư mục giải nén: gói tạm lại manifest + resources để androguard đọc
            tmp_apk = workdir / "manifest_only.apk"
            with zipfile.ZipFile(tmp_apk, "w") as z:
                for name in ("AndroidManifest.xml", "resources.arsc"):
                    if (src / name).exists():
                        z.write(src / name, name)
            apk_for_manifest = tmp_apk

        ag = analyze_with_androguard(apk_for_manifest)
        package = ag.get("package") or args.package or src.stem
        out = Path(args.out).expanduser().resolve() / package
        out.mkdir(parents=True, exist_ok=True)

        engines = detect_engine(items)
        sdks = detect_sdks_from_dex(roots)
        libs = native_libs(items)
        copied = extract_text_assets(roots, out / "extracted")
        unity = {} if args.no_unity else dump_unity(roots, out / "unity", args.unity_limit)

        (out / "inventory.json").write_text(json.dumps(items, ensure_ascii=False, indent=0), encoding="utf-8")
        if ag.get("strings"):
            (out / "strings.json").write_text(json.dumps(ag["strings"], ensure_ascii=False, indent=1), encoding="utf-8")
        write_report(out, src, ag, items, engines, sdks, libs, copied, unity)

    print(f"Xong. Xem {out / 'report.md'}")
    print(f"  engine: {', '.join(engines) or '?'}")
    print(f"  SDK: {', '.join(list(sdks)[:12]) or '?'}")
    print(f"  file text: {len(copied)}; unity TextAsset: {len(unity.get('text_assets', []))}")


if __name__ == "__main__":
    main()
