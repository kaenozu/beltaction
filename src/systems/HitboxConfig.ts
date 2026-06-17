/*
 * src/systems/HitboxConfig.ts
 * ヒットボックスの設定型定義とデフォルト値
 * hitbox-editor.html のJSON出力を取り込んで使用する
 * 関連: Player.ts, Enemy.ts, hitbox-editor.html
 */

export interface HitboxRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface HitboxConfig {
  /** フレーム幅（スプライト1コマの横幅） */
  frameWidth: number;
  /** フレーム高さ */
  frameHeight: number;
  /** 総フレーム数 */
  frames: number;
  hitboxes: {
    /** 体の当たり判定（全フレーム共通） */
    body: HitboxRect;
    /** 被弾判定（全フレーム共通） */
    hurt: HitboxRect;
    /** 攻撃判定（攻撃フレーム用） */
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

// マキ（プレイヤー）のデフォルト値
export const MAKI_HITBOX: HitboxConfig = {
  frameWidth: 160,
  frameHeight: 192,
  frames: 3,
  hitboxes: {
    body: { x: 34, y: 10, w: 92, h: 176 },
    hurt: { x: 32, y: 10, w: 96, h: 176 },
    attack: { x: 88, y: 46, w: 68, h: 44 },
  },
};

// グラント（敵）のデフォルト値
export const GRUNT_HITBOX: HitboxConfig = {
  frameWidth: 160,
  frameHeight: 192,
  frames: 2,
  hitboxes: {
    body: { x: 28, y: 4, w: 104, h: 184 },
    hurt: { x: 26, y: 4, w: 108, h: 184 },
    attack: { x: 78, y: 40, w: 62, h: 58 },
  },
};

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
