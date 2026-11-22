"""Generate placeholder (DUMMY) media for the Syasya&Realis site.
Usage: python3 make_dummy.py <out_dir>
All imagery is abstract and original; every file is clearly labelled DUMMY."""
import math, os, random, subprocess, sys, tempfile
from PIL import Image, ImageDraw, ImageFilter, ImageFont

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
SERIF = "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"
SANS = "/usr/share/fonts/opentype/inter/Inter-Regular.otf"
MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
RED, INK, BLUE, CREAM = (226, 10, 33), (10, 8, 7), (157, 217, 243), (248, 245, 239)

# ---------- films ----------
# (slug, title, size WxH, colours c0..c3)
FILMS = [
    ("showreel",      "Showreel",                 (1280, 720),  ["0A0807", "E20A21", "1A1413", "9DD9F3"]),
    ("jluxe-teaser",  "J Luxe — Teaser",          (1280, 800),  ["0A0807", "8C1B2A", "E9C9A8", "1A1413"]),
    ("jluxe-ig",      "J Luxe — Instagram Teaser",(540, 960),   ["1A1413", "E20A21", "F8F5EF", "0A0807"]),
    ("pilihan-hidup", "Pilihan Hidup",            (960, 720),   ["0A0807", "2B4A5C", "9DD9F3", "141010"]),
    ("respect",       "Respect & Responsibility", (960, 720),   ["0A0807", "3A1F5C", "E20A21", "101418"]),
    ("unisel-promo",  "Unisel FSSR — Promo",      (540, 960),   ["0A0807", "1F5C4A", "9DD9F3", "141010"]),
    ("jluxe-rtw",     "J Luxe — Ready-to-Wear",   (960, 720),   ["1A1413", "C9A27A", "E20A21", "0A0807"]),
    ("unisel",        "Unisel FSSR",              (960, 720),   ["0A0807", "1F3A5C", "F8F5EF", "101418"]),
]

def esc(s):  # drawtext value escaping
    return s.replace("\\", "\\\\").replace(":", "\\:").replace("'", "\\'")

tmp = tempfile.mkdtemp()
for slug, title, (w, h), c in FILMS:
    tf = os.path.join(tmp, slug + ".txt")
    open(tf, "w").write(title)
    big = max(22, int(min(min(w, h) * 0.075, w * 0.86 / (len(title) * 0.6))))
    small = max(14, int(min(w, h) * 0.024))
    vf = ",".join([
        "noise=alls=10:allf=t",
        "vignette=PI/4",
        f"drawtext=fontfile={SERIF}:textfile={tf}:fontcolor=0xF8F5EF:fontsize={big}:x=(w-tw)/2:y=(h-th)/2",
        f"drawtext=fontfile={MONO}:text='{esc('DUMMY · PLACEHOLDER')}':fontcolor=0xE20A21:fontsize={small}:x={small*2}:y={small*2}",
        f"drawtext=fontfile={MONO}:text='%{{pts\\:hms}}':fontcolor=0xF8F5EF@0.7:fontsize={small}:x=w-tw-{small*2}:y={small*2}",
        f"drawtext=fontfile={MONO}:text='{esc('replace with the real film')}':fontcolor=0xF8F5EF@0.55:fontsize={small}:x=(w-tw)/2:y=h-th-{small*2}",
        "format=yuv420p",
    ])
    src = f"gradients=s={w}x{h}:c0=0x{c[0]}:c1=0x{c[1]}:c2=0x{c[2]}:c3=0x{c[3]}:n=4:speed=0.015:d=12:r=24:seed={len(slug)*7}"
    mp4 = os.path.join(OUT, slug + ".mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", src, "-vf", vf,
                    "-c:v", "libx264", "-preset", "veryfast", "-crf", "30", "-movflags", "+faststart", "-an", mp4], check=True)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", "2", "-i", mp4, "-frames:v", "1", "-q:v", "4",
                    os.path.join(OUT, slug + ".jpg")], check=True)

# ---------- helpers ----------
def grain(im, amt=14, seed=0):
    rnd = random.Random(seed)
    n = Image.effect_noise(im.size, amt).convert("L")
    return Image.blend(im, Image.merge("RGB", (n, n, n)), 0.06)

def blobs(size, colours, seed):
    rnd = random.Random(seed)
    w, h = size
    im = Image.new("RGB", size, INK)
    d = ImageDraw.Draw(im)
    for i in range(6):
        col = rnd.choice(colours)
        r = rnd.randint(int(min(w, h) * .25), int(max(w, h) * .55))
        x, y = rnd.randint(-r // 3, w), rnd.randint(-r // 3, h)
        d.ellipse([x - r, y - r, x + r, y + r], fill=col)
    return im.filter(ImageFilter.GaussianBlur(min(w, h) * .12))

def label(im, text, sub, seed):
    w, h = im.size
    d = ImageDraw.Draw(im)
    s = max(16, int(min(w, h) * .028))
    d.text((s * 2, s * 2), "DUMMY · PLACEHOLDER", font=ImageFont.truetype(MONO, s), fill=RED)
    d.text((s * 2, s * 3.6), f"{text} · ar {sub}", font=ImageFont.truetype(MONO, s), fill=CREAM)

# ---------- photos ----------
AR = {"2/3": (1000, 1500), "3/2": (1500, 1000), "4/5": (1200, 1500)}
PAL = [[RED, BLUE, (60, 30, 30)], [(201, 162, 122), RED, (40, 30, 28)], [BLUE, (31, 58, 92), (230, 220, 205)],
       [(140, 27, 42), (233, 201, 168), (20, 16, 15)], [(31, 92, 74), BLUE, (35, 30, 28)]]
for i in range(27):
    ar = ["2/3", "3/2", "2/3", "4/5", "3/2", "2/3"][i % 6]
    size = AR[ar]
    im = blobs(size, PAL[i % len(PAL)], seed=100 + i)
    d = ImageDraw.Draw(im)
    w, h = size
    # a simple "horizon"/subject shape so it reads as a photo frame
    rnd = random.Random(i)
    if i % 3 == 0:
        d.rectangle([0, int(h * rnd.uniform(.6, .75)), w, h], fill=(12, 10, 9))
    elif i % 3 == 1:
        cx, cy, r = w * rnd.uniform(.35, .65), h * rnd.uniform(.35, .6), min(w, h) * .18
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(248, 245, 239))
    im = im.filter(ImageFilter.GaussianBlur(2))
    im = grain(im, seed=i)
    label(im, f"PHOTO {i+1:02d}", ar, i)
    im.save(os.path.join(OUT, f"photo-{i+1:02d}.jpg"), quality=78, optimize=True, progressive=True)

# ---------- designs ----------
DES = [("01", "Branding", (1600, 900)), ("02", "Social kit", (1200, 1500)), ("03", "Poster", (1200, 1600)),
       ("04", "Social kit", (1200, 1200)), ("05", "Print", (1200, 1600)), ("06", "Key visual", (1200, 1500))]
for k, (n, cat, size) in enumerate(DES):
    w, h = size
    bg = [INK, CREAM, RED, INK, CREAM, (20, 30, 40)][k]
    fg = CREAM if bg in (INK, RED, (20, 30, 40)) else INK
    acc = RED if bg != RED else INK
    im = Image.new("RGB", size, bg)
    d = ImageDraw.Draw(im)
    m = int(min(w, h) * .06)
    # grid
    for gx in range(1, 6):
        x = m + (w - 2 * m) * gx / 6
        d.line([x, m, x, h - m], fill=tuple(int(a * .85 + b * .15) for a, b in zip(bg, fg)), width=1)
    d.rectangle([m, m, w - m, h - m], outline=fg, width=2)
    # shape motif
    if k % 3 == 0:
        r = min(w, h) * .24
        d.ellipse([w - m * 2 - 2 * r, m * 2.5, w - m * 2, m * 2.5 + 2 * r], fill=acc)
    elif k % 3 == 1:
        d.rectangle([m, h * .18, w * .62, h * .55], fill=acc)
    else:
        d.polygon([(w - m, m), (w - m, h * .6), (w * .35, m)], fill=acc)
    big = ImageFont.truetype(SERIF, int(min(w, h) * .13))
    s = int(min(w, h) * .026)
    txt = f"Design\npiece {n}"; sp = int(min(w, h) * .02)
    bb = d.multiline_textbbox((0, 0), txt, font=big, spacing=sp)
    d.multiline_text((m * 1.5, h - m * 1.5 - s * 3 - bb[3]), txt, font=big, fill=fg, spacing=sp)
    mono = ImageFont.truetype(MONO, s)
    d.text((m * 1.5, m * 1.5), "DUMMY · PLACEHOLDER", font=mono, fill=acc if bg != RED else CREAM)
    d.text((w - m * 1.5, m * 1.5), cat.upper(), font=mono, fill=fg, anchor="ra")
    d.text((m * 1.5, h - m * 1.5 - s), "Syasya&Realis — sample layout", font=ImageFont.truetype(SANS, s), fill=fg)
    im = grain(im, amt=10, seed=k)
    im.save(os.path.join(OUT, f"design-{n}.jpg"), quality=82, optimize=True, progressive=True)

print("done")
