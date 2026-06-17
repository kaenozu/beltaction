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

// マキ（プレイヤー）のデフォルト値
export const MAKI_HITBOX: HitboxConfig = {
  frameWidth: 160,
  frameHeight: 192,
  frames: 3,
  hitboxes: {
    body: { x: 0, y: 0, w: 160, h: 192 },
    hurt: { x: 0, y: 0, w: 160, h: 192 },
    attack: { x: 160, y: 40, w: 70, h: 80 },
  },
};

// グラント（敵）のデフォルト値
export const GRUNT_HITBOX: HitboxConfig = {
  frameWidth: 160,
  frameHeight: 192,
  frames: 2,
  hitboxes: {
    body: { x: 0, y: 0, w: 160, h: 192 },
    hurt: { x: 0, y: 0, w: 160, h: 192 },
    attack: { x: 160, y: 40, w: 70, h: 80 },
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
