"""
 * tools/frame_to_canvas.py
 * pixel-snapperでトリミング済みのスプライトを160x192のキャンバスに中央配置する（等倍、拡縮なし）
 * 使い方: python tools/frame_to_canvas.py <入力画像> <出力パス>
 * 関連: SPRITE_PROMPTS.md, public/assets/
"""

import sys
from PIL import Image

FRAME_W = 160
FRAME_H = 192

def place_on_canvas(input_path: str, output_path: str) -> None:
    src = Image.open(input_path).convert("RGBA")
    canvas = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))

    # 等倍で中央配置（枠からはみ出た部分は自動クリップ）
    x = (FRAME_W - src.width) // 2
    y = (FRAME_H - src.height) // 2
    canvas.paste(src, (x, y), src)

    canvas.save(output_path)
    print(f"Saved: {output_path} ({src.width}x{src.height} at ({x},{y}) on {FRAME_W}x{FRAME_H})")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python tools/frame_to_canvas.py <input.png> <output.png>")
        sys.exit(1)
    place_on_canvas(sys.argv[1], sys.argv[2])
