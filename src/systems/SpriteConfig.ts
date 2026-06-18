/*
 * src/systems/SpriteConfig.ts
 * スプライト設定の型定義とテンプレート
 * 関連: main.ts, Enemy.ts
 */

export interface AnimationConfig {
  name: string;
  frames: number[];
  speed: number;
}

export interface SpriteConfig {
  imagePath: string;
  frameWidth: number;
  frameHeight: number;
  animations: AnimationConfig[];
}

export const GRUNT_SPRITE_CONFIG: SpriteConfig = {
  imagePath: '/assets/grunt_spritesheet.png',
  frameWidth: 160,
  frameHeight: 192,
  animations: [
    { name: 'idle', frames: [0], speed: 0 },
    { name: 'walk', frames: [1, 2], speed: 0.3 },
    { name: 'attack', frames: [3, 4], speed: 0.2 },
  ],
};
