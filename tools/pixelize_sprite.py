"""
Pixelize a transparent or chroma-key sprite into a controlled pixel-art PNG.

Typical flow:
  python tools/pixelize_sprite.py input.png output.png --remove-bg
  python tools/pixelize_sprite.py input.png output.png --palette public/assets/maki_idle.png

The script keeps alpha, limits colors, and uses nearest-neighbor scaling so the
result can replace the pixel-snapper step in the local sprite pipeline.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


DEFAULT_KEY_COLORS = ((0, 255, 0), (255, 0, 255))


def remove_chroma_key(
    src: Image.Image,
    tolerance: int,
    key_colors: tuple[tuple[int, int, int], ...] = DEFAULT_KEY_COLORS,
) -> Image.Image:
    arr = np.array(src.convert("RGBA"))
    rgb = arr[:, :, :3].astype(np.int32)
    mask = np.zeros(arr.shape[:2], dtype=bool)

    for key in key_colors:
      key_arr = np.array(key, dtype=np.int32)
      dist = np.sqrt(((rgb - key_arr) ** 2).sum(axis=2))
      mask |= dist <= tolerance

    arr[mask, 3] = 0
    return Image.fromarray(arr, "RGBA")


def despill_green(src: Image.Image, strength: float) -> Image.Image:
    if strength <= 0:
        return src

    arr = np.array(src.convert("RGBA")).astype(np.float32)
    visible = arr[:, :, 3] > 0
    r = arr[:, :, 0]
    g = arr[:, :, 1]
    b = arr[:, :, 2]
    max_rb = np.maximum(r, b)
    spill = visible & (g > max_rb)
    g[spill] = g[spill] * (1 - strength) + max_rb[spill] * strength
    arr[:, :, 1] = g
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGBA")


def harden_alpha(src: Image.Image, threshold: int) -> Image.Image:
    img = src.convert("RGBA")
    r, g, b, a = img.split()
    a = a.point(lambda value: 255 if value > threshold else 0)
    img.putalpha(a)
    return img


def crop_visible(src: Image.Image, padding: int) -> Image.Image:
    bbox = src.getbbox()
    if bbox is None:
        raise ValueError("input image has no visible pixels")

    left = max(0, bbox[0] - padding)
    top = max(0, bbox[1] - padding)
    right = min(src.width, bbox[2] + padding)
    bottom = min(src.height, bbox[3] + padding)
    return src.crop((left, top, right, bottom))


def fit_to_frame(
    src: Image.Image,
    width: int,
    height: int,
    scale: float,
    resample: Image.Resampling,
) -> Image.Image:
    max_w = max(1, round(width * scale))
    max_h = max(1, round(height * scale))
    fit = min(max_w / src.width, max_h / src.height, 1.0)
    out_w = max(1, round(src.width * fit))
    out_h = max(1, round(src.height * fit))
    content = src.resize((out_w, out_h), resample)

    canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    x = (width - out_w) // 2
    y = height - out_h
    canvas.alpha_composite(content, (x, y))
    return canvas


def load_palette_colors(path: Path, max_colors: int) -> list[tuple[int, int, int]]:
    img = Image.open(path).convert("RGBA")
    arr = np.array(img)
    mask = arr[:, :, 3] > 0
    pixels = arr[mask][:, :3]
    if pixels.size == 0:
        raise ValueError(f"palette image has no visible pixels: {path}")

    colors, counts = np.unique(pixels, axis=0, return_counts=True)
    order = np.argsort(counts)[::-1][:max_colors]
    return [tuple(int(v) for v in colors[i]) for i in order]


def quantize_rgb(src: Image.Image, colors: int, palette_path: Path | None) -> Image.Image:
    img = src.convert("RGBA")
    alpha = img.getchannel("A")

    if palette_path is not None:
        palette_colors = load_palette_colors(palette_path, 256)
        palette_img = Image.new("P", (1, 1))
        flat_palette: list[int] = []
        for color in palette_colors[:256]:
            flat_palette.extend(color)
        flat_palette.extend([0, 0, 0] * (256 - len(palette_colors[:256])))
        palette_img.putpalette(flat_palette)
        quantized = img.convert("RGB").quantize(palette=palette_img, dither=Image.Dither.NONE)
    else:
        quantized = img.convert("RGB").quantize(colors=colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)

    out = quantized.convert("RGBA")
    out.putalpha(alpha)
    return out


def pixelize(
    input_path: Path,
    output_path: Path,
    width: int,
    height: int,
    pixel_scale: int,
    colors: int,
    palette_path: Path | None,
    remove_bg: bool,
    chroma_tolerance: int,
    alpha_threshold: int,
    despill: float,
    padding: int,
    content_scale: float,
    outline: bool,
    fit_resample: str,
) -> None:
    if pixel_scale < 1:
        raise ValueError("--pixel-scale must be 1 or greater")

    img = Image.open(input_path).convert("RGBA")
    if remove_bg:
        img = remove_chroma_key(img, chroma_tolerance)
        img = despill_green(img, despill)
    img = harden_alpha(img, alpha_threshold)
    img = crop_visible(img, padding)

    low_w = max(1, width // pixel_scale)
    low_h = max(1, height // pixel_scale)
    resample = Image.Resampling.LANCZOS if fit_resample == "lanczos" else Image.Resampling.NEAREST
    low = fit_to_frame(img, low_w, low_h, content_scale, resample)
    low = quantize_rgb(low, colors, palette_path)
    low = harden_alpha(low, alpha_threshold)

    if outline:
        low = add_shadow_outline(low)

    out = low.resize((width, height), Image.Resampling.NEAREST)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    out.save(output_path)

    alpha = np.array(out)[:, :, 3]
    visible = int((alpha > 0).sum())
    print(f"input: {input_path}")
    print(f"output: {output_path}")
    print(f"low-res grid: {low_w}x{low_h}")
    print(f"visible pixels: {visible}")


def add_shadow_outline(src: Image.Image) -> Image.Image:
    img = src.convert("RGBA")
    alpha = img.getchannel("A")
    expanded = alpha.filter(ImageFilter.MaxFilter(3))
    outline_alpha = Image.fromarray(np.maximum(np.array(expanded) - np.array(alpha), 0).astype(np.uint8), "L")

    outline = Image.new("RGBA", img.size, (24, 24, 32, 255))
    outline.putalpha(outline_alpha)
    out = Image.alpha_composite(outline, img)
    return out


def main() -> None:
    parser = argparse.ArgumentParser(description="Pixelize a sprite PNG with alpha preservation.")
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--width", type=int, default=160)
    parser.add_argument("--height", type=int, default=192)
    parser.add_argument("--pixel-scale", type=int, default=1, help="Downscale factor before nearest-neighbor upscale.")
    parser.add_argument("--colors", type=int, default=32, help="Color count when no reference palette is supplied.")
    parser.add_argument("--palette", type=Path, default=None, help="Optional reference sprite palette.")
    parser.add_argument("--remove-bg", action="store_true", help="Remove green or magenta chroma-key background.")
    parser.add_argument("--chroma-tolerance", type=int, default=80)
    parser.add_argument("--alpha-threshold", type=int, default=8)
    parser.add_argument("--despill", type=float, default=0.85, help="Reduce green fringe on visible pixels after chroma removal.")
    parser.add_argument("--padding", type=int, default=2)
    parser.add_argument("--content-scale", type=float, default=1.0)
    parser.add_argument("--outline", action="store_true", help="Add a one-pixel dark outline on the low-res grid.")
    parser.add_argument(
        "--fit-resample",
        choices=("nearest", "lanczos"),
        default="nearest",
        help="Resampling used when fitting the source into the low-res frame.",
    )
    args = parser.parse_args()

    pixelize(
        input_path=args.input,
        output_path=args.output,
        width=args.width,
        height=args.height,
        pixel_scale=args.pixel_scale,
        colors=args.colors,
        palette_path=args.palette,
        remove_bg=args.remove_bg,
        chroma_tolerance=args.chroma_tolerance,
        alpha_threshold=args.alpha_threshold,
        despill=args.despill,
        padding=args.padding,
        content_scale=args.content_scale,
        outline=args.outline,
        fit_resample=args.fit_resample,
    )


if __name__ == "__main__":
    main()
