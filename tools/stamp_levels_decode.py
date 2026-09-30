#!/usr/bin/env python3
"""Giải mã level data, topic table, booster config của Stamp Solitaire (com.stamp.solit, Unity IL2CPP).

Bundle không có typetree, nên script đọc byte thô của MonoBehaviour theo layout đã dò tay
(xem docs/design/teardown-video-apk-0.9.5.md mục 3).

Cách dùng:
  python3 tools/stamp_levels_decode.py research/raw/com.stamp.solit/assets/bin/Data \
      --out research/apk/com.stamp.solit/levels [--export-assets research/apk/com.stamp.solit/assets_export]

Phụ thuộc: pip install UnityPy
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import re
import struct
from pathlib import Path

import UnityPy


# ---------- đọc byte thô (Unity serialize: little-endian, string = int32 len + utf8, align 4) ----------
class Reader:
    def __init__(self, b: bytes, p: int = 0):
        self.b, self.p = b, p

    def i32(self) -> int:
        v = struct.unpack_from("<i", self.b, self.p)[0]
        self.p += 4
        return v

    def f32(self) -> float:
        v = struct.unpack_from("<f", self.b, self.p)[0]
        self.p += 4
        return v

    def pptr(self) -> int:  # PPtr = int32 fileID + int64 pathID; trả pathID
        self.p += 4
        v = struct.unpack_from("<q", self.b, self.p)[0]
        self.p += 8
        return v

    def string(self) -> str:
        n = self.i32()
        v = self.b[self.p:self.p + n].decode("utf8")
        self.p = (self.p + n + 3) & ~3
        return v

    def skip_mono_header(self) -> str:
        """m_GameObject(PPtr) m_Enabled(u8+align) m_Script(PPtr) m_Name(string)."""
        self.p = 0
        self.pptr(); self.i32(); self.pptr()
        return self.string()


def read_card(r: Reader) -> dict:
    kind = r.i32()          # 1 = topic stamp (lá mở foundation), 2 = stamp thường
    topic = r.string()
    r.pptr()                # PPtr<Sprite> của art
    art = r.string()        # tên sprite, rỗng với topic stamp
    count = r.i32()         # topic stamp: số stamp thường cần gom; stamp thường: 0
    c = {"t": topic, "k": "topic" if kind == 1 else "stamp", "art": art or None}
    if kind == 1:
        c["n"] = count
    return c


def read_cards(r: Reader) -> list[dict]:
    return [read_card(r) for _ in range(r.i32())]


def read_columns(r: Reader) -> list[list[dict]]:
    cols = []
    for _ in range(r.i32()):
        r.i32(); r.i32()    # 2 int luôn = 0 trong 0.9.5
        cols.append(read_cards(r))
    return cols


def parse_level(raw: bytes) -> dict:
    r = Reader(raw)
    name = r.skip_mono_header()
    tutorial, _unk1, moves, n_topics_hint, _unk2 = (r.i32() for _ in range(5))
    topics = [r.string() for _ in range(r.i32())]   # chỉ có ở vài level đầu; nguồn thật là topic stamp
    all_cards = read_cards(r)
    read_cards(r)                                     # bản sao y hệt all_cards
    columns = read_columns(r)
    preplaced = [c for c in read_columns(r) if c]     # foundation mở sẵn (lá đầu là topic stamp)
    deck = read_cards(r)
    foundations = r.i32()
    tail = [r.i32(), r.f32(), r.i32(), r.i32(), r.i32()]
    assert r.p == len(raw), f"{name}: còn {len(raw) - r.p} byte chưa đọc"
    need = {c["t"]: c["n"] for c in all_cards if c["k"] == "topic"}
    return {
        "name": name, "moves": None if moves >= 99999 else moves, "foundations": foundations,
        "tutorial": bool(tutorial), "topics": need, "columns": columns,
        "preplacedFoundations": preplaced, "deck": deck, "_tail": tail, "_topicList": topics,
    }


def parse_level_manager(raw: bytes) -> list[int]:
    r = Reader(raw)
    r.skip_mono_header()
    r.string()                                         # đường dẫn thư mục level trong project
    return [r.pptr() for _ in range(r.i32())]


def parse_topics(raw: bytes, sprite_names: dict[int, str]) -> list[dict]:
    r = Reader(raw)
    r.skip_mono_header()
    # header: tên prefab BackCard/NormalCard + khối float tuning + vài list PPtr; topic list bắt đầu
    # ngay trước chuỗi "Accessory" (topic đầu tiên theo alphabet)
    start = raw.find(b"\x09\x00\x00\x00Accessory") - 4
    r.p = start
    out = []
    for _ in range(r.i32()):
        name = r.string()
        icon = r.pptr()
        arts = [sprite_names.get(r.pptr(), "?") for _ in range(r.i32())]
        out.append({"topic": name, "icon": sprite_names.get(icon, "?"), "arts": arts})
    return out


def parse_boosters(raw: bytes) -> list[dict]:
    r = Reader(raw)
    r.skip_mono_header()
    out = []
    for _ in range(r.i32()):
        name, desc, btype = r.string(), r.string(), r.i32()
        flag = r.i32()          # 0 với Hint/Pack/Indicate, 1 với Joker; ý nghĩa chưa rõ
        r.pptr()                # icon
        price, unlock = r.i32(), r.i32()
        out.append({"name": name.strip(), "desc": desc, "type": btype, "priceCoin": price,
                    "unlockLevel": unlock, "flag": flag})
    return out


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("data_dir", help="thư mục assets/bin/Data đã giải nén (base + UnityDataAssetPack)")
    ap.add_argument("--out", required=True)
    ap.add_argument("--export-assets", help="nếu có: export sprite/texture/audio vào thư mục này")
    a = ap.parse_args()

    env = UnityPy.load(a.data_dir)
    by_class: dict[str, list] = {}
    sprite_names: dict[int, str] = {}
    for o in env.objects:
        if o.type.name == "Sprite" and o.assets_file.name == "sharedassets1.assets":
            sprite_names[o.path_id] = o.peek_name()
        if o.type.name != "MonoBehaviour":
            continue
        try:
            cls = o.read(check_read=False).m_Script.read().m_ClassName
        except Exception:
            continue
        by_class.setdefault(cls, []).append(o)

    levels_by_id = {o.path_id: o for o in by_class["LevelDataBase"]}
    lm = next(o for o in by_class["LevelManager"])
    order = parse_level_manager(lm.get_raw_data())
    levels = []
    for idx, pid in enumerate(order, 1):
        lv = parse_level(levels_by_id[pid].get_raw_data())
        lv["level"] = idx
        levels.append(lv)

    dgm = max(by_class["DataGameManager"], key=lambda o: len(o.get_raw_data()))
    topics = parse_topics(dgm.get_raw_data(), sprite_names)
    boosters = parse_boosters(by_class["BoosterManager"][0].get_raw_data())

    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    meta = {
        "source": "com.stamp.solit 0.9.5 (APKPure XAPK), LevelManager -> LevelDataBase",
        "convention": "columns[i][0] = đáy cột, phần tử cuối = top (ngửa); các lá khác úp. "
                      "topics = {topic: số stamp thường cần gom}; topic stamp tự nó không tính vào n.",
    }
    clean = [{k: v for k, v in l.items() if not k.startswith("_")} for l in levels]
    (out / "levels.json").write_text(json.dumps({**meta, "levels": clean}, ensure_ascii=False))
    (out / "topics.json").write_text(json.dumps(topics, ensure_ascii=False, indent=1))
    (out / "boosters.json").write_text(json.dumps(boosters, ensure_ascii=False, indent=1))
    with open(out / "levels.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["level", "moves", "cards", "topics", "foundations", "col_sizes", "tableau_cards", "deck",
                    "topic_in_deck", "min_n", "max_n", "moves_per_card", "preplaced"])
        for l in levels:
            n = sum(map(len, l["columns"])) + len(l["deck"]) + sum(map(len, l["preplacedFoundations"]))
            ns = list(l["topics"].values())
            w.writerow([l["level"], l["moves"] or "inf", n, len(ns), l["foundations"],
                        "-".join(str(len(c)) for c in l["columns"]), sum(map(len, l["columns"])), len(l["deck"]),
                        sum(1 for c in l["deck"] if c["k"] == "topic"), min(ns), max(ns),
                        round(l["moves"] / n, 2) if l["moves"] else "", len(l["preplacedFoundations"])])
    print(f"levels {len(levels)}, topics {len(topics)}, boosters {[b['name'] for b in boosters]} -> {out}")

    if a.export_assets:
        export_assets(env, Path(a.export_assets), topics_raw=dgm.get_raw_data())


def export_assets(env, dest: Path, topics_raw: bytes) -> None:
    safe = lambda n: re.sub(r"[^\w\-. &]", "_", n) or "unnamed"
    counts: dict[str, int] = {}
    r = Reader(topics_raw)
    r.p = topics_raw.find(b"\x09\x00\x00\x00Accessory") - 4
    icon_of = {}
    for _ in range(r.i32()):
        name = r.string()
        icon_of[r.pptr()] = name
        n_arts = r.i32()
        r.p += 12 * n_arts           # bỏ qua list PPtr art
    for o in env.objects:
        t = o.type.name
        if t not in ("Sprite", "Texture2D", "AudioClip"):
            continue
        try:
            d = o.read()
            if t == "Sprite" and o.path_id in icon_of and o.assets_file.name == "sharedassets1.assets":
                folder, name = dest / "sprites/topic_icons", safe(icon_of[o.path_id])
            elif t == "Sprite":
                m = re.match(r"(.+?)_P\d+$", d.m_Name)
                folder, name = dest / ("sprites/cards/" + safe(m.group(1)) if m else "sprites/ui"), safe(d.m_Name)
            elif t == "Texture2D":
                folder, name = dest / "textures", safe(d.m_Name)
            else:
                folder, name = dest / "audio", safe(d.m_Name)
            folder.mkdir(parents=True, exist_ok=True)
            path = folder / name
            k = str(path); counts[k] = counts.get(k, 0) + 1
            if counts[k] > 1:
                path = folder / f"{name}__{counts[k]}"
            if t == "AudioClip":
                for fn, data in d.samples.items():
                    Path(f"{path}.wav").write_bytes(data)
            else:
                d.image.save(f"{path}.png")
        except Exception as e:  # texture nén lạ, clip lỗi: bỏ qua
            print("skip", t, getattr(o, "path_id", "?"), type(e).__name__)
    print("assets ->", dest)


if __name__ == "__main__":
    main()
