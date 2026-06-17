"""
Normalize a generated Maki sprite into the in-game 160x192 frame.

What it does:
- Uses public/assets/maki_idle.png as the color and baseline reference by default.
- Optionally removes green/pink chroma backgrounds.
- Binarizes alpha so character pixels are fully opaque and background pixels are transparent.
- Crops to visible content, scales with nearest-neighbor, and aligns feet to the idle baseline.
- Applies a light color transfer toward the idle sprite palette.

Usage:
  python tools/normalize_maki_sprite.py input.png output.png
  python tools/normalize_maki_sprite.py input.png output.png --remove-bg
  python tools/normalize_maki_sprite.py input.png output.png --target-height 157
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image


FRAME_W = 160
FRAME_H = 192
DEFAULT_IDLE = Path("public/assets/maki_idle.png")


def remove_background(src: Image.Image) -> Image.Image:
    arr = np.array(src.convert("RGBA"))
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    green = (g > 130) & (g - r > 30) & (g - b > 30)
    pink = (r > 200) & (b > 200) & (g < 80)
    arr[green | pink] = (0, 0, 0, 0)
    return Image.fromarray(arr, "RGBA")


def harden_alpha(src: Image.Image, threshold: int) -> Image.Image:
    img = src.convert("RGBA")
    r, g, b, a = img.split()
    a = a.point(lambda value: 255 if value > threshold else 0)
    img.putalpha(a)
    return img


def masked_stats(img: Image.Image) -> tuple[np.ndarray, np.ndarray]:
    arr = np.array(img.convert("RGBA"))
    mask = arr[:, :, 3] > 0
    if not mask.any():
        raise ValueError("reference image has no visible pixels")
    rgb = arr[:, :, :3][mask].astype(np.float32)
    return rgb.mean(axis=0), np.maximum(rgb.std(axis=0), 1.0)


def transfer_palette(
    src: Image.Image,
    target_mean: np.ndarray,
    target_std: np.ndarray,
    strength: float,
) -> Image.Image:
    if strength <= 0:
        return src

    img = src.convert("RGBA")
    arr = np.array(img).astype(np.float32)
    mask = arr[:, :, 3] > 0
    if not mask.any():
        return img

    src_rgb = arr[:, :, :3][mask]
    src_mean = src_rgb.mean(axis=0)
    src_std = np.maximum(src_rgb.std(axis=0), 1.0)
    matched = (src_rgb - src_mean) / src_std * target_std + target_mean
    blended = src_rgb * (1 - strength) + matched * strength
    arr[:, :, :3][mask] = np.clip(blended, 0, 255)
    return Image.fromarray(arr.astype(np.uint8), "RGBA")


def normalize_sprite(
    input_path: Path,
    output_path: Path,
    idle_path: Path,
    target_height: int | None,
    baseline_y: int | None,
    alpha_threshold: int,
    color_strength: float,
    should_remove_bg: bool,
) -> None:
    idle = harden_alpha(Image.open(idle_path), alpha_threshold)
    idle_bbox = idle.getbbox()
    if idle_bbox is None:
        raise ValueError(f"idle reference has no visible pixels: {idle_path}")

    target_mean, target_std = masked_stats(idle)
    if target_height is None:
        target_height = idle_bbox[3] - idle_bbox[1]
    if baseline_y is None:
        baseline_y = idle_bbox[3]

    src = Image.open(input_path).convert("RGBA")
    if should_remove_bg:
        src = remove_background(src)
    src = harden_alpha(src, alpha_threshold)

    bbox = src.getbbox()
    if bbox is None:
        raise ValueError(f"input has no visible pixels: {input_path}")

    content = src.crop(bbox)
    scale = min(target_height / content.height, FRAME_W / content.width, FRAME_H / content.height)
    new_w = max(1, round(content.width * scale))
    new_h = max(1, round(content.height * scale))
    content = content.resize((new_w, new_h), Image.Resampling.NEAREST)
    content = harden_alpha(content, alpha_threshold)
    content = transfer_palette(content, target_mean, target_std, color_strength)
    content = harden_alpha(content, alpha_threshold)

    canvas = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    x = (FRAME_W - content.width) // 2
    y = baseline_y - content.height
    y = max(0, min(FRAME_H - content.height, y))
    canvas.alpha_composite(content, (x, y))

    output_path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(output_path)

    alpha = np.array(canvas)[:, :, 3]
    semi = int(((alpha > 0) & (alpha < 255)).sum())
    print(f"input: {input_path}")
    print(f"output: {output_path}")
    print(f"source bounds: {bbox[2] - bbox[0]}x{bbox[3] - bbox[1]}")
    print(f"scaled to: {new_w}x{new_h}")
    print(f"placed at: ({x},{y})")
    print(f"baseline: {baseline_y}")
    print(f"semi-transparent pixels: {semi}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Normalize a generated Maki sprite to 160x192.")
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--idle", type=Path, default=DEFAULT_IDLE)
    parser.add_argument("--target-height", type=int, default=None)
    parser.add_argument("--baseline-y", type=int, default=None)
    parser.add_argument("--alpha-threshold", type=int, default=8)
    parser.add_argument("--color-strength", type=float, default=0.55)
    parser.add_argument("--remove-bg", action="store_true")
    args = parser.parse_args()

    normalize_sprite(
        input_path=args.input,
        output_path=args.output,
        idle_path=args.idle,
        target_height=args.target_height,
        baseline_y=args.baseline_y,
        alpha_threshold=args.alpha_threshold,
        color_strength=args.color_strength,
        should_remove_bg=args.remove_bg,
    )


if __name__ == "__main__":
    main()
