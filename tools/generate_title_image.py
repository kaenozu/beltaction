from PIL import Image, ImageDraw, ImageFont
import os

OUTPUT_PATH = "public/assets/title_image.png"
WIDTH, HEIGHT = 640, 480

# Color palette matching the game
BG_COLOR = (8, 0, 0)  # #080000 dark
GRADIENT_TOP = (16, 4, 4)
GRADIENT_BOTTOM = (64, 8, 8)

# Title colors
TITLE_SHADOW = (0, 0, 0)
TITLE_OUTLINE = (128, 32, 0)
TITLE_MAIN = (255, 136, 0)     # bright orange-red
TITLE_HIGHLIGHT = (255, 200, 100)  # light yellow highlight

# Subtitle colors
SUBTITLE = (200, 80, 0)
SUBTITLE_SHADOW = (80, 20, 0)

# Decorative colors
ACCENT_RED = (180, 0, 0)
ACCENT_GOLD = (220, 160, 40)
BORDER_COLOR = (120, 24, 0)

img = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# Draw gradient background
for y in range(HEIGHT):
    t = y / HEIGHT
    r = int(GRADIENT_TOP[0] + (GRADIENT_BOTTOM[0] - GRADIENT_TOP[0]) * t)
    g = int(GRADIENT_TOP[1] + (GRADIENT_BOTTOM[1] - GRADIENT_TOP[1]) * t)
    b = int(GRADIENT_TOP[2] + (GRADIENT_BOTTOM[2] - GRADIENT_TOP[2]) * t)
    draw.line([(0, y), (WIDTH, y)], fill=(r, g, b, 255))

# Draw inner border frame
border_w = 4
draw.rectangle([0, 0, WIDTH-1, HEIGHT-1], outline=BORDER_COLOR, width=border_w)
draw.rectangle([border_w, border_w, WIDTH-1-border_w, HEIGHT-1-border_w], outline=(80, 16, 0), width=2)

# Draw corner decorations (small pixel-art diamonds)
corner_size = 8
for cx, cy in [(12, 12), (WIDTH-12, 12), (12, HEIGHT-12), (WIDTH-12, HEIGHT-12)]:
    draw.polygon([
        (cx, cy - corner_size),
        (cx + corner_size, cy),
        (cx, cy + corner_size),
        (cx - corner_size, cy),
    ], fill=ACCENT_GOLD, outline=TITLE_OUTLINE)

# Draw horizontal decorative lines
draw.rectangle([40, 60, WIDTH-40, 64], fill=(100, 20, 0))
draw.rectangle([40, HEIGHT-110, WIDTH-40, HEIGHT-106], fill=(100, 20, 0))

# Draw vertical accent bars
draw.rectangle([50, 64, 54, HEIGHT-110], fill=(140, 30, 0))
draw.rectangle([WIDTH-54, 64, WIDTH-50, HEIGHT-110], fill=(140, 30, 0))

# Load fonts - try bold fonts first
font_paths = [
    "C:\\Windows\\Fonts\\arialbd.ttf",
    "C:\\Windows\\Fonts\\arialbi.ttf",
    "C:\\Windows\\Fonts\\arial.ttf",
    "C:\\Windows\\Fonts\\calibrib.ttf",
]

try:
    # Main title font - very large
    title_font = ImageFont.truetype(font_paths[0], 120)
except:
    try:
        title_font = ImageFont.truetype(font_paths[1], 120)
    except:
        title_font = ImageFont.truetype(font_paths[2], 120)

try:
    sub_font = ImageFont.truetype(font_paths[0], 32)
except:
    try:
        sub_font = ImageFont.truetype(font_paths[1], 32)
    except:
        sub_font = ImageFont.truetype(font_paths[2], 32)

try:
    small_font = ImageFont.truetype(font_paths[0], 18)
except:
    try:
        small_font = ImageFont.truetype(font_paths[1], 18)
    except:
        small_font = ImageFont.truetype(font_paths[2], 18)

# Title text
title_text = "MAKI"
subtitle_text = "STREET BRAWLER"
prompt_text = "PRESS ENTER TO START"

# Measure and center title
title_bbox = draw.textbbox((0, 0), title_text, font=title_font)
title_w = title_bbox[2] - title_bbox[0]
title_h = title_bbox[3] - title_bbox[1]
title_x = (WIDTH - title_w) // 2
title_y = 110

# Draw title with layered shadows for depth
# Far shadow
draw.text((title_x + 4, title_y + 4), title_text, font=title_font, fill=(60, 16, 0))
# Near shadow
draw.text((title_x + 2, title_y + 2), title_text, font=title_font, fill=(100, 24, 0))
# Outline (dark red)
outline_offset = 2
for dx in [-outline_offset, 0, outline_offset]:
    for dy in [-outline_offset, 0, outline_offset]:
        if dx != 0 or dy != 0:
            draw.text((title_x + dx, title_y + dy), title_text, font=title_font, fill=BORDER_COLOR)
# Main fill
draw.text((title_x, title_y), title_text, font=title_font, fill=TITLE_MAIN)
# Highlight top edge (simulate 3D bevel)
for i in range(3):
    highlight_y = title_y - 2 + i
    if highlight_y >= 0:
        # Draw thin highlight strip at top of each letter
        pass  # Simplified - just keep the main color

# Subtitle
sub_bbox = draw.textbbox((0, 0), subtitle_text, font=sub_font)
sub_w = sub_bbox[2] - sub_bbox[0]
sub_x = (WIDTH - sub_w) // 2
sub_y = title_y + title_h + 15

draw.text((sub_x + 2, sub_y + 2), subtitle_text, font=sub_font, fill=SUBTITLE_SHADOW)
draw.text((sub_x, sub_y), subtitle_text, font=sub_font, fill=SUBTITLE)
draw.text((sub_x, sub_y), subtitle_text, font=sub_font, fill=ACCENT_GOLD)

# Draw underline under subtitle
underline_y = sub_y + 28
draw.rectangle([sub_x, underline_y, sub_x + sub_w, underline_y + 2], fill=ACCENT_GOLD)

# Prompt text at bottom
prompt_bbox = draw.textbbox((0, 0), prompt_text, font=small_font)
prompt_w = prompt_bbox[2] - prompt_bbox[0]
prompt_x = (WIDTH - prompt_w) // 2
prompt_y = HEIGHT - 60

# Blinking effect: use a medium brightness color (the blinking will be done in game code, or we add both)
draw.text((prompt_x + 1, prompt_y + 1), prompt_text, font=small_font, fill=(40, 10, 0))
draw.text((prompt_x, prompt_y), prompt_text, font=small_font, fill=(255, 220, 160))

# Add version text
version_text = "v1.0"
v_bbox = draw.textbbox((0, 0), version_text, font=small_font)
v_w = v_bbox[2] - v_bbox[0]
draw.text((WIDTH - v_w - 10, HEIGHT - 20), version_text, font=small_font, fill=(80, 80, 80))

# Add small decorative dots pattern in background
for i in range(0, WIDTH, 40):
    for j in range(0, HEIGHT, 40):
        draw.point((i, j), fill=(30, 8, 8))

# Ensure output directory exists
os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
img.save(OUTPUT_PATH, "PNG")
print(f"Saved title image to {OUTPUT_PATH}")
