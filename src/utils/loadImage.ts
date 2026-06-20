/*
 * src/utils/loadImage.ts
 * 画像アセット読み込みのユーティリティ
 * HTMLImageElement を Promise ベースで読み込む
 * 関連: main.ts（アセット読み込み）, SpawnSystem.ts（敵スプライト反映）
 */

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

export function loadImages(entries: Record<string, string>): Promise<Record<string, HTMLImageElement>> {
  const names = Object.keys(entries);
  return Promise.all(names.map((name) => loadImage(entries[name]))).then(
    (images) => {
      const result: Record<string, HTMLImageElement> = {};
      names.forEach((name, i) => {
        result[name] = images[i];
      });
      return result;
    },
  );
}

export type ImageAssets = Record<string, HTMLImageElement>;
