#!/usr/bin/env python3
"""
Floor plans from qa/placering.ts's data: every prop's silhouette from above, labelled, room by room.
Furniture grey, things a vätte can become orange, decoration pale; anything the audit flagged red.

  bun qa/placering.ts plan.json && python3 tools/plan.py plan.json outdir
"""
import json
import os
import sys

from PIL import Image, ImageDraw, ImageFont

PX = 110  # pixels per metre


def font(size):
    for f in ("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "/usr/share/fonts/dejavu/DejaVuSans.ttf"):
        try:
            return ImageFont.truetype(f, size)
        except OSError:
            pass
    return ImageFont.load_default()


VIEWS = {
    "kok-skafferi": (-0.5, -0.6, 8.4, 5.6),
    "vardagsrum": (-7.4, -0.6, 0.2, 5.6),
    "hall": (-7.4, 4.9, 10.4, 7.9),
    "farstu-badrum": (-2.2, 7.4, 4.7, 10.9),
    "sovrum": (-7.4, 7.4, -1.6, 12.9),
    "syrum": (4.2, 7.4, 10.4, 12.9),
    "tradgard": (-14, -10.5, 17.5, 19.5),
    "kallare": (-11.6, -9.3, -8.2, -3.3),
}


def main():
    data = json.load(open(sys.argv[1]))
    out = sys.argv[2]
    os.makedirs(out, exist_ok=True)
    small, big = font(11), font(16)
    for name, (x0, z0, x1, z1) in VIEWS.items():
        px = PX if name != "tradgard" else 28
        w, h = int((x1 - x0) * px), int((z1 - z0) * px)
        img = Image.new("RGB", (w, h + 26), (250, 247, 238))
        d = ImageDraw.Draw(img)
        T = lambda x, z: ((x - x0) * px, (z - z0) * px + 26)
        for r in data["rooms"]:
            d.rectangle([*T(r["x0"], r["z0"]), *T(r["x1"], r["z1"])], fill=(236, 230, 214))
        for b in data["walls"]:
            d.rectangle([*T(b[0], b[1]), *T(b[2], b[3])], fill=(120, 60, 50))
        for b in data["doors"]:
            d.rectangle([*T(b[0], b[1]), *T(b[2], b[3])], fill=(120, 200, 120))
        items = [p for p in data["plan"] if x0 - 1 < p["x"] < x1 + 1 and z0 - 1 < p["z"] < z1 + 1]
        if name == "kallare":
            items = [p for p in items if p["list"] == "Jordkällaren"]
        elif name == "tradgard":
            items = [p for p in items if p["list"] == "Trädgården"]
        else:
            items = [p for p in items if p["list"] not in ("Trädgården", "Jordkällaren")]
        items.sort(key=lambda p: p["y"])
        for p in items:
            thing = p["key"] not in ("rya", "ragRug", "runner", "doormat", "bathMat", "cloth")
            col = (255, 160, 60) if p.get("thing") or p["key"] in THINGS else ((150, 160, 175) if p["h"] > 0.3 else (200, 205, 215))
            if not thing:
                col = (215, 200, 170)
            if p["flag"]:
                col = (235, 70, 60)
            for cx, cz in p["cells"]:
                d.rectangle([*T(cx / 20, cz / 20), *T((cx + 1) / 20, (cz + 1) / 20)], fill=col)
        for p in items:
            if p["key"] in ("rya", "ragRug", "runner", "cloth"):
                continue
            x, y = T(p["x"], p["z"])
            label = f'{p["key"]}{"" if p["y"] < 0.05 and p["y"] > -0.6 else " ↑%.2f" % p["y"]}'
            d.text((x + 3, y - 6), label, fill=(20, 20, 30), font=small)
            d.ellipse([x - 2, y - 2, x + 2, y + 2], fill=(0, 0, 0))
        d.text((6, 4), f"{name}  (norr upp, {px} px/m, röd = flaggad, orange = sak man kan bli)", fill=(20, 20, 30), font=big)
        img.save(os.path.join(out, f"plan-{name}.png"))
        print(os.path.join(out, f"plan-{name}.png"))


THINGS = set()

if __name__ == "__main__":
    main()
