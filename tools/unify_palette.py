"""
 * tools/unify_palette.py
 * 参照スプライトのパレット（実際のピクセル色）を基準に、他のスプライトの色を統一する
 * 使い方: python tools/unify_palette.py <参照.png> <対象.png>... -o <出力先>
 * 例: python tools/unify_palette.py public/assets/maki_idle.png public/assets/maki_*.png
 * 関連: SPRITE_PROMPTS.md, frame_to_canvas.py
"""

import sys
import os
import argparse
from PIL import Image
import numpy as np
from scipy.spatial import KDTree


def get_exact_colors(img_path: str) -> tuple[list, np.ndarray]:
    """参照画像の実際のピクセル色（非透明のみ）を返す"""
    img = Image.open(img_path).convert("RGBA")
    arr = np.array(img)
    mask = arr[:, :, 3] > 0
    pixels = arr[mask][:, :3]
    unique = np.unique(pixels, axis=0)
    print(f"  reference: {len(unique)} unique raw colors")
    return [tuple(c) for c in unique], arr


def unify_images(ref_path: str, target_paths: list[str],
                 output_dir: str) -> None:
    """KDTreeで各ピクセルを参照の最近似色に置き換え"""

    ref_colors, ref_arr = get_exact_colors(ref_path)
    tree = KDTree(ref_colors)

    cache: dict[tuple, tuple] = {}

    def nearest(pixel: tuple) -> tuple:
        if pixel not in cache:
            dist, idx = tree.query(pixel)
            cache[pixel] = ref_colors[idx]
        return cache[pixel]

    # 参照自身も統一（自身のパレットにマッピング → 不変）
    for tp in target_paths:
        if not os.path.exists(tp):
            print(f"  SKIP: {tp}")
            continue

        img = Image.open(tp).convert("RGBA")
        arr = np.array(img)
        mask = arr[:, :, 3] > 0
        pixels = arr[mask][:, :3]

        new_pixels = np.array([nearest(tuple(p)) for p in pixels])

        arr2 = arr.copy()
        arr2[mask, :3] = new_pixels

        out_path = os.path.join(output_dir, os.path.basename(tp))
        if out_path == tp:
            out_path = tp + ".tmp.png"
            Image.fromarray(arr2).save(out_path)
            os.replace(out_path, tp)
            print(f"  overwritten: {tp}")
        else:
            Image.fromarray(arr2).save(out_path)
            print(f"  saved: {out_path}")


def main():
    parser = argparse.ArgumentParser(
        description="Unify sprite palette to match a reference")
    parser.add_argument("reference", help="Reference sprite")
    parser.add_argument("targets", nargs="+", help="Target sprites")
    parser.add_argument("-o", "--output-dir", default=None,
                        help="Output dir (default: in-place)")
    args = parser.parse_args()

    if not os.path.exists(args.reference):
        print(f"Reference not found: {args.reference}")
        sys.exit(1)

    print(f"Reference: {args.reference}")
    unify_images(
        args.reference, args.targets,
        args.output_dir or os.path.dirname(args.targets[0]))


if __name__ == "__main__":
    main()
