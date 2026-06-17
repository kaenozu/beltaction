"""
 * tools/frame_to_canvas.py
 * スプライトを160x192のキャンバスに配置する
 * - 通常スプライト（idle/walk/attack等）: 等倍で中央配置
 * - ダウンスプライト（横たわり）: 横長入力を水平にフィットさせる
 * - ダウン回転モード: 縦ポーズを90度回転して横倒しにする
 * - グリーンバック/ピンクバックを自動除去
 * 使い方: python tools/frame_to_canvas.py <入力画像> <出力パス> [--mode normal|down|down-rotate] [--keep-alpha]
 * 関連: SPRITE_PROMPTS.md, public/assets/
"""

import sys
from PIL import Image
import numpy as np


FRAME_W = 160
FRAME_H = 192


def remove_background(src: Image.Image) -> Image.Image:
    arr = np.array(src.convert("RGBA"))
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    # グリーンバック除去
    green = (g > 130) & (g - r > 30) & (g - b > 30)
    # ピンクバック除去
    pink = (r > 200) & (b > 200) & (g < 80)
    arr[green | pink] = (0, 0, 0, 0)
    return Image.fromarray(arr, "RGBA")


def place_normal(src: Image.Image, canvas: Image.Image) -> None:
    """等倍中央配置"""
    x = (FRAME_W - src.width) // 2
    y = (FRAME_H - src.height) // 2
    canvas.paste(src, (x, y), src)
    print(f"  placed at ({x},{y}) (no scaling)")


def place_down(src: Image.Image, canvas: Image.Image, remove_bg: bool = True) -> None:
    """横たわりスプライト: 160幅にフィットするよう拡縮、下端揃え"""
    # まず背景除去して実質的なバウンディングボックスを取得
    cleaned = remove_background(src) if remove_bg else src
    arr = np.array(cleaned)
    alpha = arr[:, :, 3]
    rows = np.where(alpha > 0)[0]
    cols = np.where(alpha > 0)[1]

    if len(rows) == 0 or len(cols) == 0:
        print("  WARNING: empty content, placing raw image")
        x = (FRAME_W - src.width) // 2
        y = (FRAME_H - src.height) // 2
        canvas.paste(src, (x, y), src)
        return

    # コンテンツ領域を切り出し
    content = cleaned.crop((cols.min(), rows.min(), cols.max() + 1, rows.max() + 1))
    cw, ch = content.size
    print(f"  content bounds: {cw}x{ch}")

    # 横たわりキャラの理想: 160幅に収め、高さは縦横比維持
    # 幅が160を超えるなら幅基準、そうでなければそのまま
    if cw > FRAME_W:
        scale = FRAME_W / cw
        nw, nh = FRAME_W, max(1, int(ch * scale))
        scaled = content.resize((nw, nh), Image.NEAREST)
        print(f"  scaled by width: {cw}x{ch} -> {nw}x{nh}")
    elif ch > FRAME_H:
        scale = FRAME_H / ch
        nw, nh = max(1, int(cw * scale)), FRAME_H
        scaled = content.resize((nw, nh), Image.NEAREST)
        print(f"  scaled by height: {cw}x{ch} -> {nw}x{nh}")
    else:
        scaled = content
        nw, nh = cw, ch
        print(f"  no scaling needed: {cw}x{ch}")

    # 下端揃え、水平中央
    x = (FRAME_W - nw) // 2
    y = FRAME_H - nh
    canvas.paste(scaled, (x, y), scaled)
    print(f"  placed at ({x},{y}) scaled to {nw}x{nh}")


def place_down_rotate(src: Image.Image, canvas: Image.Image, remove_bg: bool = True) -> None:
    """
    縦ポーズ（ragdoll/ぐったり）を90度回転して横倒しにする。
    pixel-snapper出力（4フレームストリップ or シングルフレーム）を想定。
    """
    # ストリップか判定: 横幅が200px以上なら4フレームストリップとみなす
    if src.width >= src.height * 1.5:
        # ストリップ → 左端のフレームのみ抽出 (1/4幅)
        fw = src.width // 4
        fh = src.height
        frame = src.crop((0, 0, fw, fh))
        print(f"  strip detected: extracted frame 1 ({fw}x{fh})")
    else:
        frame = src
        fw, fh = src.size
        print(f"  single frame: {fw}x{fh}")

    # 背景除去
    cleaned = remove_background(frame) if remove_bg else frame

    # コンテンツ領域を切り出し
    arr = np.array(cleaned)
    alpha = arr[:, :, 3]
    rows = np.where(alpha > 0)[0]
    cols = np.where(alpha > 0)[1]
    if len(rows) == 0 or len(cols) == 0:
        print("  WARNING: empty frame, placing raw image")
        canvas.paste(frame, (0, 0), frame)
        return

    content = cleaned.crop((cols.min(), rows.min(), cols.max() + 1, rows.max() + 1))
    cw, ch = content.size
    print(f"  content bounds: {cw}x{ch}")

    # 90度回転（時計回り: 頭→右、足→左）
    rotated = content.rotate(-90, expand=True)
    rw, rh = rotated.size
    print(f"  rotated: {rw}x{rh}")

    # コンテンツ再切り出し（回転で透明領域が増えるため）
    arr2 = np.array(rotated)
    alpha2 = arr2[:, :, 3]
    rows2 = np.where(alpha2 > 0)[0]
    cols2 = np.where(alpha2 > 0)[1]
    content2 = rotated.crop((cols2.min(), rows2.min(), cols2.max() + 1, rows2.max() + 1))
    cw2, ch2 = content2.size
    print(f"  rotated content: {cw2}x{ch2}")

    # 160幅にフィットするよう拡縮
    if cw2 > FRAME_W:
        scale = FRAME_W / cw2
        nw, nh = FRAME_W, max(1, int(ch2 * scale))
        scaled = content2.resize((nw, nh), Image.NEAREST)
        print(f"  scaled by width: {cw2}x{ch2} -> {nw}x{nh}")
    elif ch2 > FRAME_H:
        scale = FRAME_H / ch2
        nw, nh = max(1, int(cw2 * scale)), FRAME_H
        scaled = content2.resize((nw, nh), Image.NEAREST)
        print(f"  scaled by height: {cw2}x{ch2} -> {nw}x{nh}")
    else:
        scaled = content2
        nw, nh = cw2, ch2
        print(f"  no scaling needed: {cw2}x{ch2}")

    # 下端揃え、水平中央
    x = (FRAME_W - nw) // 2
    y = FRAME_H - nh
    canvas.paste(scaled, (x, y), scaled)
    print(f"  placed at ({x},{y}) scaled to {nw}x{nh}")


def place_on_canvas(input_path: str, output_path: str, mode: str = "normal", remove_bg: bool = True) -> None:
    src = Image.open(input_path).convert("RGBA")
    canvas = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))

    if mode == "down":
        place_down(src, canvas, remove_bg)
    elif mode == "down-rotate":
        place_down_rotate(src, canvas, remove_bg)
    else:
        # まず背景除去
        cleaned = remove_background(src) if remove_bg else src
        place_normal(cleaned, canvas)

    canvas.save(output_path)
    print(f"Saved: {output_path}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python tools/frame_to_canvas.py <input.png> <output.png> [--mode down|normal|down-rotate] [--keep-alpha]")
        sys.exit(1)

    mode = "normal"
    remove_bg = True
    args = sys.argv[1:]
    if "--mode" in args:
        idx = args.index("--mode")
        mode = args[idx + 1]
        args = args[:idx] + args[idx + 2:]
    if "--keep-alpha" in args:
        remove_bg = False
        args = [arg for arg in args if arg != "--keep-alpha"]

    place_on_canvas(args[0], args[1], mode, remove_bg)
