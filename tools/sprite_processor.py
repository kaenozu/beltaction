"""
sprite_processor.py — AI-assisted sprite sheet slicer

Reads a raw sprite strip, auto-detects frame boundaries by scanning
for background-color columns, removes background with edge-aware
alpha, and exports a clean 640x192 PNG sprite sheet.

Usage:
    uv run python tools/sprite_processor.py <input.png> [output.png]
"""

import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Pillow not found. Install with: uv add Pillow")
    sys.exit(1)


def dominant_bg_color(img: Image.Image) -> tuple[int, int, int]:
    """Guess the background color from the four corners of the image."""
    w, h = img.size
    corners = [
        img.getpixel((0, 0)),
        img.getpixel((w - 1, 0)),
        img.getpixel((0, h - 1)),
        img.getpixel((w - 1, h - 1)),
    ]
    # Average the corners (handles JPEG artifacts)
    r = sum(c[0] for c in corners) // 4
    g = sum(c[1] for c in corners) // 4
    b = sum(c[2] for c in corners) // 4
    return (r, g, b)


def color_dist(c1: tuple[int, int, int], c2: tuple[int, int, int]) -> float:
    return ((c1[0] - c2[0]) ** 2 + (c1[1] - c2[1]) ** 2 + (c1[2] - c2[2]) ** 2) ** 0.5


def auto_detect_frames(
    img: Image.Image, bg: tuple[int, int, int], threshold: float = 30
) -> list[tuple[int, int]]:
    """
    Scan the image horizontally to find frame boundaries.
    More robust: looks for columns where a SIGNIFICANT portion (>15%)
    of pixels differ from background, filtering out noise/artifacts.
    Returns list of (start_x, end_x) for each detected frame.
    """
    w, h = img.size

    # Score each column: fraction of non-bg pixels
    scores = []
    for x in range(w):
        non_bg = 0
        for y in range(h):
            p = img.getpixel((x, y))
            if color_dist(p[:3], bg) > threshold:
                non_bg += 1
        scores.append(non_bg / h)

    # A column is "content" if >15% of its pixels are non-background
    # This filters out JPEG artifacts and anti-aliased edges
    MIN_CONTENT_RATIO = 0.15
    MIN_FRAME_WIDTH = 50
    MIN_GAP_WIDTH = 20

    content_cols = [s > MIN_CONTENT_RATIO for s in scores]

    frames: list[tuple[int, int]] = []
    in_frame = False
    start = 0

    for x in range(w):
        if not in_frame and content_cols[x]:
            in_frame = True
            start = x
        elif in_frame and not content_cols[x]:
            # Check if this is a real gap or just a brief dip
            gap_end = x
            while gap_end < w and not content_cols[gap_end]:
                gap_end += 1
            gap_width = gap_end - x
            if gap_width >= MIN_GAP_WIDTH:
                in_frame = False
                if x - start >= MIN_FRAME_WIDTH:
                    frames.append((start, x))
            # If gap is smaller than MIN_GAP_WIDTH, treat as still in frame

    if in_frame:
        if w - start >= MIN_FRAME_WIDTH:
            frames.append((start, w))

    return frames


def remove_background(
    img: Image.Image, bg: tuple[int, int, int], threshold: float = 25
) -> Image.Image:
    """Remove background color with edge-aware alpha."""
    rgba = img.convert("RGBA")
    pixels = rgba.load()
    w, h = rgba.size

    for y in range(h):
        for x in range(w):
            p = pixels[x, y]
            d = color_dist(p[:3], bg)
            if d < threshold:
                pixels[x, y] = (p[0], p[1], p[2], 0)
            elif d < threshold + 20:
                # Edge: partial transparency for smooth transition
                alpha = int(255 * (d - threshold) / 20)
                pixels[x, y] = (p[0], p[1], p[2], alpha)

    return rgba


def content_bounds(
    img: Image.Image, x1: int, x2: int, bg: tuple[int, int, int], threshold: float = 30
) -> tuple[int, int, int, int]:
    """Find the tight bounding box of non-background content within (x1, y=0, x2, h)."""
    w, h = img.size
    min_x, max_x = x2, x1
    min_y, max_y = h, 0
    for y in range(h):
        for x in range(x1, x2):
            p = img.getpixel((x, y))
            if color_dist(p[:3], bg) > threshold:
                min_x = min(min_x, x)
                max_x = max(max_x, x)
                min_y = min(min_y, y)
                max_y = max(max_y, y)
    if max_y <= min_y:
        # No content found, fall back to full frame
        return (x1, 0, x2, h)
    return (min_x, min_y, max_x + 1, max_y + 1)


def extract_frame(
    img: Image.Image,
    x1: int,
    x2: int,
    bg: tuple[int, int, int],
    target_w: int = 160,
    target_h: int = 192,
) -> Image.Image:
    """
    Extract a frame, crop to content, and scale to target size.
    The character will fill the full 160x192 frame.
    """
    # Crop to content bounds first
    bx1, by1, bx2, by2 = content_bounds(img, x1, x2, bg)
    frame = img.crop((bx1, by1, bx2, by2))

    # Scale to fill target_h, preserving aspect
    aspect = frame.width / frame.height
    if aspect > target_w / target_h:
        # Wider than target: fit by width
        new_w = target_w
        new_h = int(new_w / aspect)
    else:
        # Taller than target: fit by height
        new_h = target_h
        new_w = int(new_h * aspect)
    frame = frame.resize((new_w, new_h), Image.NEAREST)

    # Center in target canvas
    canvas = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    ox = (target_w - new_w) // 2
    oy = (target_h - new_h) // 2
    canvas.paste(frame, (ox, oy), frame)
    return canvas


def process(input_path: str, output_path: str | None = None) -> None:
    img = Image.open(input_path).convert("RGBA")
    print(f"Loaded: {input_path} ({img.width}x{img.height})")

    # Auto-detect background color
    bg = dominant_bg_color(img)
    print(f"Detected background color: RGB{bg}")

    # Auto-detect frames
    frames = auto_detect_frames(img, bg)
    print(f"Detected {len(frames)} frame(s):")
    for i, (s, e) in enumerate(frames):
        print(f"  Frame {i + 1}: x={s}-{e} ({e - s}px wide)")

    if not frames:
        print("No frames detected. Try adjusting threshold or check the image.")
        sys.exit(1)

    # If more than 4 frames, take the 4 most prominent
    if len(frames) > 4:
        frames = sorted(frames, key=lambda f: f[1] - f[0], reverse=True)[:4]
        frames.sort(key=lambda f: f[0])
        print(f"Taking top 4 largest frames")

    # Remove background
    cleaned = remove_background(img, bg)

    # Extract and pack frames
    TARGET_W, TARGET_H = 160, 192
    sheet = Image.new("RGBA", (TARGET_W * 4, TARGET_H), (0, 0, 0, 0))

    for i, (s, e) in enumerate(frames):
        if i >= 4:
            break
        frame_img = extract_frame(cleaned, s, e, bg, TARGET_W, TARGET_H)
        sheet.paste(frame_img, (i * TARGET_W, 0), frame_img)

    # Save
    if output_path is None:
        stem = Path(input_path).stem
        output_path = f"{stem}_spritesheet.png"

    sheet.save(output_path, "PNG")
    print(f"Exported: {output_path} ({sheet.width}x{sheet.height})")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None
    process(input_path, output_path)
