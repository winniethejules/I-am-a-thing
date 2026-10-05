#!/usr/bin/env python3
"""
The picture tools of voxelparty-kvalitet §2 and §4, for systems without PowerShell (the skill's
templates/compose/*.ps1, ported): the measured image test, before/after pairs, film-strip stacks
and contact sheets. Needs Pillow and numpy.

  python3 tools/qa.py test  qa/fas0/v2/*.png --ignore-top 0.12
  python3 tools/qa.py pair  out.png "Title" before.png after.png [before2.png after2.png ...] --labels FÖRE EFTER
  python3 tools/qa.py grid  out.png "Title" a.png b.png c.png --labels A B C --cols 3
  python3 tools/qa.py stack out.png "Title" strip1.png strip2.png --labels "FÖRE: …" "EFTER: …"
"""
import argparse
import sys
from collections import deque

import numpy as np
from PIL import Image, ImageDraw, ImageFont

BG = (18, 19, 26)


def font(size):
    for f in ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf"):
        try:
            return ImageFont.truetype(f, size)
        except OSError:
            pass
    return ImageFont.load_default()


# ---------------------------------------------------------------- the image test (§4)

def measure(path, ignore_top=0.0, ignore_bottom=0.0, dark=35, light=90):
    """[top third black share, dark, mid, light shares, biggest bright blob, dominant hues, p99]."""
    img = Image.open(path).convert("RGB")
    w = 320
    h = int(img.height * w / img.width)
    a = np.asarray(img.resize((w, h), Image.BILINEAR), dtype=np.float64)
    y0, y1 = int(h * ignore_top), h - int(h * ignore_bottom)
    a = a[y0:y1]
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
    n = lum.size
    top = lum[: lum.shape[0] // 3]
    top_black = float((top < 20).mean())
    nd, nl = float((lum < dark).mean()), float((lum >= light).mean())
    nm = 1 - nd - nl
    # Biggest connected bright blob (luminance >= 200, 4-connected).
    bright = lum >= 200
    seen = np.zeros_like(bright)
    biggest = 0
    H, W = bright.shape
    for sy, sx in zip(*np.nonzero(bright)):
        if seen[sy, sx]:
            continue
        q, size = deque([(sy, sx)]), 0
        seen[sy, sx] = True
        while q:
            y, x = q.popleft()
            size += 1
            for yy, xx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                if 0 <= yy < H and 0 <= xx < W and bright[yy, xx] and not seen[yy, xx]:
                    seen[yy, xx] = True
                    q.append((yy, xx))
        biggest = max(biggest, size)
    # Signal colours: saturated hues (12 bins of 30°) covering >= 2% each.
    mx, mn = a.max(axis=2), a.min(axis=2)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-9), 0)
    signal = (mx > 70) & (sat > 0.55)
    d = np.maximum(mx - mn, 1e-9)
    hue = np.where(mx == r, 60 * (((g - b) / d) % 6), np.where(mx == g, 60 * ((b - r) / d + 2), 60 * ((r - g) / d + 4)))
    hue = np.mod(hue, 360)
    counts = np.bincount((hue[signal] // 30).astype(int) % 12, minlength=12)
    dominant = int((counts >= n * 0.02).sum())
    p99 = float(np.sort(lum.ravel())[int(n * 0.99)])
    return top_black, nd, nm, nl, biggest / n, dominant, p99


def cmd_test(o):
    pct = lambda v: f"{v * 100:3.0f}%"
    fails = 0
    for p in o.images:
        tb, nd, nm, nl, blob, dom, p99 = measure(p, o.ignore_top, o.ignore_bottom, o.dark, o.light)
        checks = [
            ("övre tredjedelen svart", tb <= 0.85, pct(tb)),
            ("3 nivåer", nd >= 0.1 and nm >= 0.1 and nl >= 0.1, f"mörk {pct(nd)} mellan {pct(nm)} ljus {pct(nl)}"),
            ("största ljusa fläck", blob <= 0.03, pct(blob)),
            ("signalfärger", dom <= 2, str(dom)),
        ]
        fails += sum(not ok for _, ok, _ in checks)
        line = " | ".join(f"{'ok' if ok else 'FAIL'} {name}: {v}" for name, ok, v in checks)
        print(f"{p.split('/')[-1]}: {line} | ljusaste 1%: L {p99:.0f}")
    return 1 if fails and o.strict else 0


# ---------------------------------------------------------------- compositions (§2)

def labelled(draw, x, y, text, fill, f):
    tw = draw.textlength(text, font=f)
    draw.rectangle([x, y, x + tw + 20, y + f.size + 14], fill=fill)
    draw.text((x + 10, y + 6), text, font=f, fill=(255, 255, 255))


def cmd_pair(o):
    imgs = [Image.open(p).convert("RGB") for p in o.images]
    rows = [imgs[i:i + 2] for i in range(0, len(imgs), 2)]
    cw = 960
    ch = int(imgs[0].height * cw / imgs[0].width)
    pad, head = 12, 56
    sheet = Image.new("RGB", (cw * 2 + pad * 3, head + (ch + pad) * len(rows) + pad), BG)
    d = ImageDraw.Draw(sheet)
    f, s = font(26), font(20)
    d.text((pad, 12), o.title, font=f, fill=(255, 255, 255))
    y = head
    for row in rows:
        for i, im in enumerate(row):
            x = pad + i * (cw + pad)
            sheet.paste(im.resize((cw, ch), Image.LANCZOS), (x, y))
            text = o.labels[i] if o.labels and i < len(o.labels) else ("FÖRE" if i == 0 else "EFTER")
            labelled(d, x + cw // 2 - 60, y + ch - 50, text, (120, 40, 40) if i == 0 else (30, 110, 60), s)
        y += ch + pad
    sheet.save(o.out)
    print("saved", o.out)


def cmd_grid(o):
    imgs = [Image.open(p).convert("RGB") for p in o.images]
    cw = o.cell
    ch = int(imgs[0].height * cw / imgs[0].width)
    pad, head, bar = 10, 50, 34
    rows = (len(imgs) + o.cols - 1) // o.cols
    sheet = Image.new("RGB", (o.cols * (cw + pad) + pad, head + rows * (ch + bar + pad) + pad), BG)
    d = ImageDraw.Draw(sheet)
    f, s = font(24), font(18)
    d.text((pad, 10), o.title, font=f, fill=(255, 255, 255))
    for k, im in enumerate(imgs):
        x = pad + (k % o.cols) * (cw + pad)
        y = head + (k // o.cols) * (ch + bar + pad)
        sheet.paste(im.resize((cw, ch), Image.LANCZOS), (x, y))
        if o.labels and k < len(o.labels):
            d.text((x, y + ch + 6), o.labels[k], font=s, fill=(255, 255, 255))
    sheet.save(o.out)
    print("saved", o.out)


def cmd_stack(o):
    imgs = [Image.open(p).convert("RGB") for p in o.images]
    w, pad, head, bar = o.width, 12, 56, 40
    hs = [int(im.height * w / im.width) for im in imgs]
    sheet = Image.new("RGB", (w + 2 * pad, head + sum(h + bar + pad for h in hs)), BG)
    d = ImageDraw.Draw(sheet)
    f, s = font(26), font(20)
    d.text((pad, 12), o.title, font=f, fill=(255, 255, 255))
    y = head
    for k, (im, h) in enumerate(zip(imgs, hs)):
        d.text((pad, y + 8), o.labels[k] if o.labels and k < len(o.labels) else "", font=s, fill=(255, 255, 255))
        y += bar
        sheet.paste(im.resize((w, h), Image.LANCZOS), (pad, y))
        y += h + pad
    sheet.save(o.out)
    print("saved", o.out)


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    t = sub.add_parser("test")
    t.add_argument("images", nargs="+")
    t.add_argument("--ignore-top", type=float, default=0)
    t.add_argument("--ignore-bottom", type=float, default=0)
    t.add_argument("--dark", type=int, default=35)
    t.add_argument("--light", type=int, default=90)
    t.add_argument("--strict", action="store_true")
    for name in ("pair", "grid", "stack"):
        p = sub.add_parser(name)
        p.add_argument("out")
        p.add_argument("title")
        p.add_argument("images", nargs="+")
        p.add_argument("--labels", nargs="*")
        p.add_argument("--cols", type=int, default=2)
        p.add_argument("--cell", type=int, default=760)
        p.add_argument("--width", type=int, default=1400)
    o = ap.parse_args()
    sys.exit({"test": cmd_test, "pair": cmd_pair, "grid": cmd_grid, "stack": cmd_stack}[o.cmd](o) or 0)


if __name__ == "__main__":
    main()
