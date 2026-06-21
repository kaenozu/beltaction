/*
 * src/systems/HitboxConfig.ts
 * ヒットボックスの設定型定義
 * JSONファイル（tools/hitbox-presets/）を直接importして型付けする
 * hitbox-editor.html でJSONを編集 → 再ビルドで即反映
 * 関連: Player.ts, Enemy.ts, tools/hitbox-editor.html
 */

import makiData from '../../tools/hitbox-presets/maki_attack.json';
import gruntData from '../../tools/hitbox-presets/grunt_attack.json';
import chainData from '../../tools/hitbox-presets/chain_attack.json';

export interface HitboxRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface HitboxConfig {
  frameWidth: number;
  frameHeight: number;
  frames: number;
  hitboxes: {
    body: HitboxRect;
    hurt: HitboxRect;
    attack: HitboxRect;
  };
}

export function resolveFacingHitbox(
  entity: { x: number; y: number; width: number },
  hitbox: HitboxRect,
  facing: number,
): HitboxRect {
  if (facing >= 0) {
    return {
      x: entity.x + hitbox.x,
      y: entity.y + hitbox.y,
      w: hitbox.w,
      h: hitbox.h,
    };
  }

  return {
    x: entity.x + entity.width - hitbox.x - hitbox.w,
    y: entity.y + hitbox.y,
    w: hitbox.w,
    h: hitbox.h,
  };
}

// JSONファイルが真実のソース
export const MAKI_HITBOX: HitboxConfig = makiData as HitboxConfig;
export const GRUNT_HITBOX: HitboxConfig = gruntData as HitboxConfig;
export const CHAIN_HITBOX: HitboxConfig = chainData as HitboxConfig;

export function rectsOverlap(a: HitboxRect, b: HitboxRect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** JSON文字列からHitboxConfigをパースする（バリデーション付き） */
export function parseHitboxConfig(json: string): HitboxConfig | null {
  try {
    const data = JSON.parse(json);
    if (
      typeof data.frameWidth !== 'number' ||
      typeof data.frameHeight !== 'number' ||
      !data.hitboxes?.body || !data.hitboxes?.attack
    ) {
      return null;
    }
    return data as HitboxConfig;
  } catch {
    return null;
  }
}
