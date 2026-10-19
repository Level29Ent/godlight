from PIL import Image, ImageDraw, ImageFont, ImageFilter
import glob
import os

OUT = "/vercel/share/v0-project/resources/app-store"
CINZEL = "/tmp/fonts/Cinzel.ttf"
GEIST = glob.glob("/vercel/share/v0-project/node_modules/.pnpm/next@*/node_modules/next/dist/compiled/@vercel/og/Geist-Regular.ttf")[0]

SHOTS = [
    ("3706", "Become a God", "Tend a tiny world of followers"),
    ("3711", "Spin Your World", "A little planet in the palm of your hand"),
    ("3708", "Bless with Sunlight", "Warm your people and grow their crops"),
    ("3709", "Build a Village", "Houses, farms and wells rise by faith"),
    ("3710", "Rise Through the Ages", "From the Age of Dust to the Age of Gold"),
    ("3713", "Summon the Rain", "Water the fields and watch them feast"),
    ("3707", "Loved or Feared", "Your followers remember how you rule"),
]

SIZES = {"iphone-6.9in-1320x2868": (1320, 2868), "iphone-6.5in-1284x2778": (1284, 2778)}

BG = (6, 8, 23)
GOLD = (236, 197, 102)
CREAM = (232, 226, 210)


def font(path, size, weight=None):
    f = ImageFont.truetype(path, size)
    if weight:
        try:
            f.set_variation_by_axes([weight])
        except Exception:
            pass
    return f


def background(w, h):
    base = Image.new("RGB", (w, h), BG)
    glow = Image.new("RGB", (w, h), BG)
    ImageDraw.Draw(glow).ellipse((-w * 0.3, -h * 0.12, w * 1.3, h * 0.22), fill=(52, 42, 24))
    glow = glow.filter(ImageFilter.GaussianBlur(w * 0.12))
    return Image.blend(base, glow, 0.9)


def centered(draw, text, y, fnt, fill, w):
    draw.text(((w - draw.textlength(text, font=fnt)) / 2, y), text, font=fnt, fill=fill)


def make(src, title, subtitle, w, h):
    s = w / 1320
    canvas = background(w, h)
    draw = ImageDraw.Draw(canvas)

    title_font = font(CINZEL, int(104 * s), 700)
    while draw.textlength(title, font=title_font) > w * 0.9:
        title_font = font(CINZEL, title_font.size - 4, 700)
    centered(draw, title, int(150 * s), title_font, GOLD, w)
    centered(draw, subtitle, int(300 * s), font(GEIST, int(50 * s)), CREAM, w)

    shot = Image.open(src).convert("RGB")
    top = int(440 * s)
    margin = int(56 * s)
    ratio = min((w - 2 * margin) / shot.width, (h - top - int(60 * s)) / shot.height)
    shot = shot.resize((int(shot.width * ratio), int(shot.height * ratio)), Image.LANCZOS)

    radius = int(64 * s)
    x = (w - shot.width) // 2
    border = Image.new("L", (shot.width + 6, shot.height + 6), 0)
    ImageDraw.Draw(border).rounded_rectangle((0, 0, *border.size), radius + 3, fill=255)
    canvas.paste((120, 98, 52), (x - 3, top - 3), border)
    mask = Image.new("L", shot.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, *shot.size), radius, fill=255)
    canvas.paste(shot, (x, top), mask)
    return canvas


for folder, (w, h) in SIZES.items():
    os.makedirs(f"{OUT}/{folder}", exist_ok=True)
    for i, (num, title, sub) in enumerate(SHOTS, 1):
        img = make(f"/tmp/ss/IMG_{num}.jpg", title, sub, w, h)
        slug = title.lower().replace(" ", "-")
        img.save(f"{OUT}/{folder}/{i:02d}-{slug}.png", optimize=True)
        print(folder, i, img.size)
