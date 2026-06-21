from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

OUTPUT = "public/assets/title_portrait.png"
W, H = 640, 480

# Load Maki idle sprite
maki_idle = Image.open("public/assets/maki_idle_generated_v2_despill.png").convert("RGBA")
print(f"Maki idle: {maki_idle.size}")

# Create base image (dark background)
base = Image.new("RGBA", (W, H), (8, 0, 0, 255))
draw = ImageDraw.Draw(base)

# Add subtle radial vignette
for y in range(H):
    for x in range(W):
        dx, dy = x - W//2, y - H//2 - 40
        dist = (dx*dx + dy*dy) ** 0.5
        max_dist = (W*W + H*H) ** 0.5 / 2
        shade = int(20 + 40 * (1 - dist / max_dist))
        draw.point((x, y), fill=(shade, shade//4, shade//4, 255))

# Add horizontal scanline effect
for y in range(0, H, 3):
    draw.line([(0, y), (W, y)], fill=(0, 0, 0, 40), width=1)

# Resize Maki to fit nicely as a title portrait
# Target about 300px wide, maintain aspect
maki_w, maki_h = maki_idle.size
target_w = 320
scale = target_w / maki_w
target_h = int(maki_h * scale)

maki_resized = maki_idle.resize((target_w, target_h), Image.NEAREST)
# Position Maki on right side, slightly lower
mx = W - target_w - 40
my = H - target_h - 20

# Add drop shadow behind Maki
shadow = Image.new("RGBA", (target_w + 20, target_h + 20), (0, 0, 0, 0))
shadow_draw = ImageDraw.Draw(shadow)
shadow_draw.rectangle([10, 10, target_w + 10, target_h + 10], fill=(0, 0, 0, 120))
shadow = shadow.filter(ImageFilter.GaussianBlur(radius=8))
shadow = shadow.resize((target_w + 20, target_h + 20), Image.NEAREST)
base.paste(shadow, (mx - 10 + 5, my - 10 + 5), shadow)

# Paste Maki
base.paste(maki_resized, (mx, my), maki_resized)

# Add title text
try:
    title_font = ImageFont.truetype("C:\\Windows\\Fonts\\arialbd.ttf", 72)
except:
    try:
        title_font = ImageFont.truetype("C:\\Windows\\Fonts\\arial.ttf", 72)
    except:
        title_font = ImageFont.load_default()

try:
    sub_font = ImageFont.truetype("C:\\Windows\\Fonts\\arialbd.ttf", 28)
except:
    try:
        sub_font = ImageFont.truetype("C:\\Windows\\Fonts\\arial.ttf", 28)
    except:
        sub_font = ImageFont.load_default()

try:
    small_font = ImageFont.truetype("C:\\Windows\\Fonts\\arial.ttf", 16)
except:
    small_font = ImageFont.load_default()

# Title on left side
title_text = "MAKI"
subtitle_text = "STREET BRAWLER"
# Measure
title_bbox = draw.textbbox((0, 0), title_text, font=title_font)
title_w = title_bbox[2] - title_bbox[0]
title_h = title_bbox[3] - title_bbox[1]
title_x = 40
title_y = 80

# Draw title with shadow
draw.text((title_x + 4, title_y + 4), title_text, font=title_font, fill=(40, 0, 0, 255))
draw.text((title_x + 2, title_y + 2), title_text, font=title_font, fill=(100, 20, 0, 255))
# Outline
for dx, dy in [(-2,0),(2,0),(0,-2),(0,2)]:
    draw.text((title_x + dx, title_y + dy), title_text, font=title_font, fill=(128, 32, 0, 255))
draw.text((title_x, title_y), title_text, font=title_font, fill=(255, 136, 0, 255))

# Subtitle
sub_bbox = draw.textbbox((0, 0), subtitle_text, font=sub_font)
sub_w = sub_bbox[2] - sub_bbox[0]
sub_x = title_x
sub_y = title_y + title_h + 20

draw.text((sub_x + 2, sub_y + 2), subtitle_text, font=sub_font, fill=(40, 10, 0, 255))
draw.text((sub_x, sub_y), subtitle_text, font=sub_font, fill=(200, 80, 0, 255))
# Gold underline
ul_y = sub_y + 30
draw.rectangle([sub_x, ul_y, sub_x + sub_w, ul_y + 3], fill=(220, 160, 40, 255))

# Bottom text
prompt = "PRESS ENTER TO START"
p_bbox = draw.textbbox((0, 0), prompt, font=small_font)
p_w = p_bbox[2] - p_bbox[0]
p_x = (W - p_w) // 2
p_y = H - 80
draw.text((p_x, p_y), prompt, font=small_font, fill=(255, 220, 160, 255))

# Version
v_text = "v1.0"
v_bbox = draw.textbbox((0, 0), v_text, font=small_font)
draw.text((W - v_bbox[2] - 10, H - 25), v_text, font=small_font, fill=(60, 60, 60, 255))

# Save
os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
base.save(OUTPUT, "PNG")
print(f"Saved {OUTPUT}")
print(f"Final size: {base.size}")
