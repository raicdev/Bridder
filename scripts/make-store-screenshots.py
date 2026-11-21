"""Compose Chrome Web Store screenshots and promotional tiles from supplied assets.

Requires Pillow: python -m pip install Pillow
Run from anywhere: python scripts/make-store-screenshots.py
The source captures are kept intact and are never retouched.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'store' / 'screenshots'
OUT.mkdir(parents=True, exist_ok=True)
FONT = Path('C:/Windows/Fonts/NotoSansJP-VF.ttf')
if not FONT.exists():
    FONT = Path('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc')


def font(size, weight=500):
    face = ImageFont.truetype(str(FONT), size)
    if FONT.suffix == '.ttf':
        face.set_variation_by_axes([weight])
    return face


def canvas(width=1280, height=800):
    im = Image.new('RGB', (width, height))
    pix = im.load()
    for y in range(height):
        for x in range(width):
            pix[x, y] = (12 + x // 310, 19 + y // 135, 31 + x // 210)
    draw = ImageDraw.Draw(im)
    draw.ellipse((-270, -390, 660, 540), outline=(29, 58, 77), width=2)
    draw.ellipse((width - 590, height - 410, width + 400, height + 570), outline=(29, 58, 77), width=2)
    return im, draw


def text(draw, xy, value, size, color='#f1f5f9'):
    draw.text(xy, value, font=font(size, 700 if size >= 45 else 500), fill=color, stroke_width=0)


def header(draw, number):
    draw.rounded_rectangle((64, 55, 194, 106), radius=25, fill='#1d9bf0')
    text(draw, (87, 62), 'Bridder', 24, '#ffffff')
    text(draw, (1180, 65), f'0{number} / 02', 19, '#91a4b6')


def capture(im, src, box, scale):
    original = Image.open(ROOT / src).convert('RGBA')
    target = original.resize((round(original.width * scale), round(original.height * scale)), Image.Resampling.LANCZOS)
    x, y = box
    im.paste(target, (x, y), target)


# 1 — Sidebar: bird icon, labels, menu items and white verified badge.
im, d = canvas()
header(d, 1)
text(d, (64, 154), 'あの青い鳥を、もう一度。', 51)
text(d, (66, 258), 'Xの見た目を自分好みに。', 29, '#9ccae9')
for y, title, detail in [
    (353, 'アイコン', 'Xのロゴを青い鳥に'),
    (457, 'テキスト', 'ポストを「ツイート」に'),
    (561, 'サイドバー', '不要な項目を整理'),
    (665, 'チェックマーク', '白いチェックマークに対応'),
]:
    d.rounded_rectangle((66, y + 11, 77, y + 22), radius=5, fill='#1d9bf0')
    text(d, (96, y - 2), title, 26)
    text(d, (331, y + 2), detail, 23, '#9cb0c0')
d.rounded_rectangle((850, 33, 1172, 774), radius=31, fill='#26384a')
d.rounded_rectangle((861, 44, 1161, 763), radius=25, fill='#000000')
capture(im, 'scr-1.png', (902, 73), 0.71)
im.save(OUT / '01-sidebar.png', optimize=True)

# 2 — Tweet detail: source label and text replacement from the actual capture.
im, d = canvas()
header(d, 2)
text(d, (64, 152), 'ツイートを、もっとTwitterらしく。', 48)
text(d, (66, 246), 'テキストの置き換えと投稿元ラベル', 29, '#9ccae9')
d.rounded_rectangle((318, 328, 962, 707), radius=26, fill='#26384a')
d.rounded_rectangle((331, 342, 949, 694), radius=17, fill='#000000')
capture(im, 'scr-2.png', (336, 357), 1)
text(d, (66, 747), '投稿元を確認  ·  「ポスト」を「ツイート」に変更', 23, '#9cb0c0')
im.save(OUT / '02-tweet.png', optimize=True)

PROMO = ROOT / 'store' / 'promotional'
PROMO.mkdir(parents=True, exist_ok=True)

# Small promotional tile — 440x280. Use the actual extension icon, not a new logo.
im, d = canvas(440, 280)
d.rounded_rectangle((30, 26, 37, 91), radius=3, fill='#1d9bf0')
text(d, (54, 20), 'Bridder', 49)
text(d, (54, 102), 'Xをもっと、自分らしく。', 23, '#a6d8f5')
text(d, (54, 203), '青い鳥  ·  ツイート', 17, '#bdcbd8')
bird = Image.open(ROOT / 'public' / 'blue-bird.png').convert('RGBA')
im.paste(bird, (294, 126), bird)
im.save(PROMO / 'small-tile.png', optimize=True)

# Marquee promotional tile — 1400x560. Show the supplied tweet capture intact.
im, d = canvas(1400, 560)
d.rounded_rectangle((66, 56, 210, 110), radius=27, fill='#1d9bf0')
text(d, (87, 64), 'Bridder', 25, '#ffffff')
text(d, (67, 166), 'Xを、もう一度', 52)
text(d, (67, 233), '自分好みのTwitterに。', 42)
text(d, (70, 359), '青い鳥アイコン  ·  ツイート表記', 25, '#9ccae9')
text(d, (70, 411), '投稿元ラベル  ·  表示の整理', 25, '#9ccae9')
d.rounded_rectangle((715, 91, 1370, 469), radius=25, fill='#26384a')
d.rounded_rectangle((729, 104, 1356, 456), radius=15, fill='#000000')
capture(im, 'scr-2.png', (738, 118), 1)
im.save(PROMO / 'marquee-tile.png', optimize=True)

print(f'Created screenshots in {OUT} and promotional tiles in {PROMO}')
