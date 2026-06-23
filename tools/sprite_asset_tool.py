"""
Sprite asset utility for local beat-em-up sprite cleanup.

Commands:
  python tools/sprite_asset_tool.py list-missing --root assets --source assets/maki/20260622 --output docs/missing_original_assets.txt
  python tools/sprite_asset_tool.py convert input.png output.png --canvas 160 192 --scale 1.0 --offset 0 0 --remove-bg --tolerance 85

The tool prefers pre-cleaned transparent PNGs for the game runtime.
It can also remove a solid chroma background, despill green fringe,
apply scale/offset adjustments, and place the result on a fixed canvas.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image


def find_missing_originals(root: Path, source: Path) -> list[Path]:
    root_pngs = sorted(root.glob("*.png"))
    source_names = {p.name for p in source.glob("*.png")}
    return [p for p in root_pngs if p.name not in source_names]


def detect_bg_color(img: Image.Image) -> tuple[int, int, int]:
    w, h = img.size
    corners = [
        img.getpixel((0, 0)),
        img.getpixel((w - 1, 0)),
        img.getpixel((0, h - 1)),
        img.getpixel((w - 1, h - 1)),
    ]
    r = sum(c[0] for c in corners) // 4
    g = sum(c[1] for c in corners) // 4
    b = sum(c[2] for c in corners) // 4
    return (r, g, b)


def remove_chroma_key(
    src: Image.Image,
    tolerance: int,
    key_color: tuple[int, int, int],
) -> Image.Image:
    arr = np.array(src.convert("RGBA")).astype(np.int32)
    rgb = arr[:, :, :3]
    key_arr = np.array(key_color, dtype=np.int32)
    dist = np.sqrt(((rgb - key_arr) ** 2).sum(axis=2))
    mask = dist <= tolerance
    arr[mask, 3] = 0
    return Image.fromarray(arr.astype(np.uint8), "RGBA")


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
    alpha = img.getchannel("A").point(lambda value: 255 if value > threshold else 0)
    img.putalpha(alpha)
    return img


def fit_and_place(
    src: Image.Image,
    canvas_w: int,
    canvas_h: int,
    scale: float,
    offset_x: int,
    offset_y: int,
) -> Image.Image:
    if src.width == 0 or src.height == 0:
        raise ValueError("source image has invalid size")

    out_w = max(1, round(src.width * scale))
    out_h = max(1, round(src.height * scale))
    resized = src.resize((out_w, out_h), Image.Resampling.NEAREST)

    canvas = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    x = (canvas_w - out_w) // 2 + offset_x
    y = canvas_h - out_h + offset_y
    canvas.alpha_composite(resized, (x, y))
    return canvas


def convert_sprite(
    input_path: Path,
    output_path: Path,
    canvas_w: int,
    canvas_h: int,
    scale: float,
    offset_x: int,
    offset_y: int,
    remove_bg: bool,
    tolerance: int,
    despill: float,
    alpha_threshold: int,
) -> None:
    img = Image.open(input_path).convert("RGBA")
    if remove_bg:
        bg = detect_bg_color(img)
        img = remove_chroma_key(img, tolerance, bg)
        img = despill_green(img, despill)
    img = harden_alpha(img, alpha_threshold)
    out = fit_and_place(img, canvas_w, canvas_h, scale, offset_x, offset_y)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    out.save(output_path)


def write_missing_list(root: Path, source: Path, output: Path) -> None:
    missing = find_missing_originals(root, source)
    output.parent.mkdir(parents=True, exist_ok=True)
    lines = [str(path.relative_to(root).as_posix()) for path in missing]
    output.write_text("\n".join(lines) + ("\n" if lines else ""), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Sprite asset cleanup utility.")
    sub = parser.add_subparsers(dest="command", required=True)

    missing = sub.add_parser("list-missing", help="List root PNGs without matching source originals.")
    missing.add_argument("--root", type=Path, default=Path("assets"))
    missing.add_argument("--source", type=Path, default=Path("assets/maki/20260622"))
    missing.add_argument("--output", type=Path, required=True)

    convert = sub.add_parser("convert", help="Convert a sprite image into a fixed canvas PNG.")
    convert.add_argument("input", type=Path)
    convert.add_argument("output", type=Path)
    convert.add_argument("--canvas", type=int, nargs=2, metavar=("WIDTH", "HEIGHT"), default=(160, 192))
    convert.add_argument("--scale", type=float, default=1.0)
    convert.add_argument("--offset", type=int, nargs=2, metavar=("X", "Y"), default=(0, 0))
    convert.add_argument("--remove-bg", action="store_true")
    convert.add_argument("--tolerance", type=int, default=85)
    convert.add_argument("--despill", type=float, default=0.85)
    convert.add_argument("--alpha-threshold", type=int, default=8)

    args = parser.parse_args()

    if args.command == "list-missing":
        write_missing_list(args.root, args.source, args.output)
        print(f"wrote {args.output}")
        return

    convert_sprite(
        input_path=args.input,
        output_path=args.output,
        canvas_w=args.canvas[0],
        canvas_h=args.canvas[1],
        scale=args.scale,
        offset_x=args.offset[0],
        offset_y=args.offset[1],
        remove_bg=args.remove_bg,
        tolerance=args.tolerance,
        despill=args.despill,
        alpha_threshold=args.alpha_threshold,
    )
    print(f"wrote {args.output}")


if __name__ == "__main__":
    main()
