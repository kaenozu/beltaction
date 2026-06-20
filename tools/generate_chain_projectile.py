from __future__ import annotations

from pathlib import Path

from PIL import Image


SOURCE = Path("public/assets/chain_enemy_spritesheet_generated.png")
OUT = Path("public/assets/chain_projectile_generated.png")
SHEET_OUT = Path("public/assets/chain_enemy_spritesheet_chainclear.png")
FRAME_W = 220
FRAME_INDEX = 4
TILE_W = 32
TIP_W = 48
H = 18


def alpha_crop(img: Image.Image) -> Image.Image:
    bbox = img.getchannel("A").getbbox()
    if bbox is None:
        return img
    return img.crop(bbox)


def fit_to_canvas(img: Image.Image, width: int, height: int) -> Image.Image:
    img = alpha_crop(img)
    scale = min(width / img.width, height / img.height)
    resized = img.resize((max(1, round(img.width * scale)), max(1, round(img.height * scale))), Image.Resampling.NEAREST)
    out = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    out.alpha_composite(resized, ((width - resized.width) // 2, (height - resized.height) // 2))
    return out


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    sheet = Image.open(SOURCE).convert("RGBA")
    frame = sheet.crop((FRAME_INDEX * FRAME_W, 0, (FRAME_INDEX + 1) * FRAME_W, sheet.height))

    # These regions come from the chain-shot frame itself. The source frame faces
    # left, so the hook tip is flipped to point in the local +X draw direction.
    tile_src = frame.crop((34, 48, 98, 74))
    tip_src = frame.crop((0, 45, 64, 78)).transpose(Image.Transpose.FLIP_LEFT_RIGHT)

    out = Image.new("RGBA", (TILE_W + TIP_W, H), (0, 0, 0, 0))
    out.alpha_composite(fit_to_canvas(tile_src, TILE_W, H), (0, 0))
    out.alpha_composite(fit_to_canvas(tip_src, TIP_W, H), (TILE_W, 0))
    out.save(OUT)
    cleared = sheet.copy()
    clear_frame_x = FRAME_INDEX * FRAME_W
    for x in range(clear_frame_x, clear_frame_x + 76):
        for y in range(26, 118):
            cleared.putpixel((x, y), (0, 0, 0, 0))
    cleared.save(SHEET_OUT)
    print(OUT)
    print(SHEET_OUT)


if __name__ == "__main__":
    main()
