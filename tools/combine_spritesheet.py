"""
Combine frame PNGs into a horizontal sprite sheet.

Example:
  python tools/combine_spritesheet.py public/assets/maki_walk_1.png public/assets/maki_walk_2.png -o public/assets/maki_spritesheet.png
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def fit_frame(src: Image.Image, width: int, height: int) -> Image.Image:
    img = src.convert("RGBA")
    if img.size == (width, height):
        return img

    scale = min(width / img.width, height / img.height)
    new_w = max(1, round(img.width * scale))
    new_h = max(1, round(img.height * scale))
    resized = img.resize((new_w, new_h), Image.Resampling.NEAREST)
    canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    canvas.alpha_composite(resized, ((width - new_w) // 2, height - new_h))
    return canvas


def combine(inputs: list[Path], output: Path, width: int, height: int) -> None:
    if not inputs:
        raise ValueError("at least one input frame is required")

    sheet = Image.new("RGBA", (width * len(inputs), height), (0, 0, 0, 0))
    for index, path in enumerate(inputs):
        frame = fit_frame(Image.open(path), width, height)
        sheet.alpha_composite(frame, (index * width, 0))

    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output)
    print(f"frames: {len(inputs)}")
    print(f"output: {output} ({sheet.width}x{sheet.height})")


def main() -> None:
    parser = argparse.ArgumentParser(description="Combine frame PNGs into a horizontal sprite sheet.")
    parser.add_argument("inputs", nargs="+", type=Path)
    parser.add_argument("-o", "--output", required=True, type=Path)
    parser.add_argument("--width", type=int, default=160)
    parser.add_argument("--height", type=int, default=192)
    args = parser.parse_args()

    combine(args.inputs, args.output, args.width, args.height)


if __name__ == "__main__":
    main()
