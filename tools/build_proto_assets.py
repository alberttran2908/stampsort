#!/usr/bin/env python3
"""Copy art/audio TẠM THỜI (trích từ APK Stamp Solitaire) vào prototype/stamp/assets/.

Thư mục đích bị .gitignore: art của đối thủ chỉ dùng trên máy, không push.
Khi có art order riêng, thay file trong assets/ theo đúng tên (xem ASSET_MAP) là xong.

Chạy: .venv/bin/python tools/build_proto_assets.py
Yêu cầu: đã chạy tools/stamp_levels_decode.py --export-assets; có Pillow và ffmpeg.
"""
from __future__ import annotations

import glob
import json
import os
import shutil
import subprocess
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
EXPORT = ROOT / "research/apk/com.stamp.solit/assets_export"
TOPICS_JSON = ROOT / "research/apk/com.stamp.solit/levels/topics.json"
DEST = ROOT / "prototype/stamp/assets"

# Tên file trong prototype  <-  sprite nguồn trong APK
ASSET_MAP = {
    "ui/face_1.png": "frame_1", "ui/face_2.png": "frame_2", "ui/face_3.png": "frame_3__2",
    "ui/face_4.png": "frame_4", "ui/face_5.png": "frame_5", "ui/face_6.png": "frame_6",
    "ui/back.png": "stamp_back_",
    "ui/topic_frame.png": "Gold_Stamp_01", "ui/crown.png": "Gold_Stamp_02",
    "ui/slot_empty.png": "Box_Frame_01", "ui/slot_crown.png": "Box_Frame_03",
    "ui/moves_box.png": "Box_Move_01", "ui/booster_btn.png": "booster",
    "ui/joker_card.png": "GoldenStamp_01",
    "ui/envelope_flap.png": "Envelope_01", "ui/envelope_side.png": "Envelope_02",
    "ui/envelope_closed.png": "BG_Letter_02", "ui/wax.png": "Wax", "ui/seal.png": "Seal",
    "ui/postmark.png": "stamp_1", "ui/hand.png": "tutorial_hand_3", "ui/recycle.png": "backbutton",
    "ui/radial.png": "Radial Shine", "ui/btn_green.png": "button_green", "ui/btn_orange.png": "button_orange",
    "ui/header_win.png": "header_win", "ui/lock.png": "lock_", "ui/star.png": "Icon_Star",
    "ui/coin.png": "coin", "ui/heart.png": "heart", "ui/plus.png": "Btn_Plus",
    "ui/ic_hint.png": "Hint", "ui/ic_joker.png": "Icon_Booster_Joker", "ui/ic_undo.png": "backbutton",
    "ui/ic_pack.png": "Icon_Booster_Magnet", "ui/ic_pack_big.png": "Pack", "ui/ic_stamper.png": "Icon_Booster_Stamp",
    "ui/ic_slot.png": "Box_Small_02",
    "ui/logo.png": "Logo", "ui/card_glow.png": "card_glow", "ui/label.png": "frame_tab",
    "ui/wax_seal_red.png": "Wax",
}

# 32 topic dễ nhận diện, không trùng hình (chọn từ topics_sheet)
TOPICS = [
    # level 1-9 dựng từ video (tên topic tương ứng trong APK)
    "Cat", "Fruit", "Pizza", "Ball", "Dog", "Noodle", "Phone", "Bird", "Car", "Hoofed", "Ship", "Candy",
    "Balloon", "Time", "Hat", "Glasses", "Pets", "Dinosaur", "Fast food", "Chess", "Flower", "Leaf", "Train",
    "Tree", "Soda", "Ice cream", "Truck", "Kite", "Soft drink", "Planet", "Beast", "Notes", "Sauce",
    "Vegetable", "Insect", "Sea life", "Float", "Tea", "Zoo", "Footwear", "Raw meat", "Outerwear", "Cocktail",
    "Desserts", "Grilled", "Bouquet", "Sculpture", "Sashimi", "Pet Care", "Water Plants", "Gardening",
    # level 10 và dự phòng
    "Coffee", "Music Inst", "Cake", "Aircraft", "Mushroom", "Gems", "Sushi", "Tool",
]

AUDIO = ["PickCard", "AddCardNormal", "SFNDockTopic", "EndAddTopic", "ChangeFaceCard", "BackCard",
         "SpawnCard", "Suggest", "Magnet", "BoosterChooseTopic", "NewFeature", "UnlockDock", "WinS",
         "OutOfMove", "Coin", "CoinCollect", "EndClaimCoin", "Click", "Close", "IconMove",
         "etfx_spawn", "etfx_explosion_magic2"] + [f"Collectable_Card_Flying_V2_var-{i:02d}" for i in range(1, 12)]


def slug(s: str) -> str:
    return s.lower().replace(" ", "_").replace("&", "and")


def bake_effects(ui: Path) -> None:
    """Vẽ sẵn bóng đổ và viền sáng thành PNG (thay cho CSS filter: drop-shadow, vốn bị raster bằng CPU
    mỗi lần repaint, rất nặng trên GPU Mali). Mỗi file dùng chung cho mọi lá."""
    from PIL import ImageFilter
    W, H = 165, 214                       # kích thước lá trong game
    mask = Image.open(ui / "face_1.png").convert("RGBA").resize((W, H)).split()[-1]

    def shadow(name, pad, dy, blur, alpha):
        im = Image.new("L", (W + 2 * pad, H + 2 * pad), 0)
        im.paste(mask.point(lambda v: int(v * alpha)), (pad, pad + dy))
        im = im.filter(ImageFilter.GaussianBlur(blur))
        out = Image.new("RGBA", im.size, (0, 0, 0, 0))
        out.putalpha(im)
        out.save(ui / name, optimize=True)

    shadow("shadow.png", 12, 3, 2.5, 0.30)       # bóng thường
    shadow("shadow_lift.png", 30, 16, 9, 0.38)   # bóng khi nhấc lá
    pad = 26                                      # viền sáng vàng cho hint / đích hợp lệ
    g = Image.new("L", (W + 2 * pad, H + 2 * pad), 0)
    g.paste(mask, (pad, pad))
    g = g.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(9))
    glow = Image.new("RGBA", g.size, (255, 236, 120, 0))
    glow.putalpha(g.point(lambda v: min(255, int(v * 1.6))))
    glow.save(ui / "glow.png", optimize=True)


def main() -> None:
    if DEST.exists():
        shutil.rmtree(DEST)
    (DEST / "ui").mkdir(parents=True)
    ui = EXPORT / "sprites/ui"
    for dst, src in ASSET_MAP.items():
        f = ui / f"{src}.png"
        if not f.exists():
            print("thiếu", src)
            continue
        im = Image.open(f).convert("RGBA")
        if max(im.size) > 1024:
            im.thumbnail((1024, 1024))
        im.save(DEST / dst, optimize=True)

    idx = {Path(p).stem: p for p in glob.glob(str(EXPORT / "sprites/cards/*/*.png"))}
    topics = {t["topic"]: t for t in json.loads(TOPICS_JSON.read_text())}
    manifest = {}
    for name in TOPICS:
        t = topics[name]
        d = DEST / "cards" / slug(name)
        d.mkdir(parents=True)
        arts = []
        for i, a in enumerate(t["arts"]):
            if a not in idx:
                continue
            Image.open(idx[a]).convert("RGBA").save(d / f"{i}.png", optimize=True)
            arts.append(f"{i}.png")
        icon = EXPORT / "sprites/topic_icons" / f"{name}.png"
        Image.open(icon).convert("RGBA").save(d / "icon.png", optimize=True)
        manifest[name] = {"dir": f"cards/{slug(name)}", "arts": len(arts)}
    (DEST / "manifest.json").write_text(json.dumps(manifest, indent=1))

    bake_effects(DEST / "ui")

    (DEST / "audio").mkdir()
    for a in AUDIO:
        src = EXPORT / "audio" / f"{a}.wav"
        if not src.exists():
            print("thiếu audio", a)
            continue
        out = DEST / "audio" / f"{slug(a).replace('-', '_')}.mp3"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-t", "3", "-ac", "1",
                        "-b:a", "96k", str(out)], check=True)
    size = sum(f.stat().st_size for f in DEST.rglob("*") if f.is_file())
    print(f"xong: {len(manifest)} topic, {len(ASSET_MAP)} ui, {len(AUDIO)} audio, {size / 1e6:.1f} MB -> {DEST}")


if __name__ == "__main__":
    main()
