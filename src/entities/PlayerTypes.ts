/*
 * src/entities/PlayerTypes.ts
 * プレイヤー関連の型定義と定数
 * 状態・リアクション・ダウン演出データを一元管理
 * 関連: Player.ts（使用）, Enemy.ts（参照）
 */

export type HitReactionType = 'light' | 'guardHead' | 'bodyBlow' | 'kneeBuckle';
export type DownHitReactionType = 'body' | 'back' | 'launch' | 'mount';

export const HURT_FRAME_BY_REACTION: Record<HitReactionType, number> = {
  light: 0,
  guardHead: 1,
  bodyBlow: 2,
  kneeBuckle: 3,
};

export const HURT_STUN_BY_REACTION: Record<HitReactionType, number> = {
  light: 0.22,
  guardHead: 0.48,
  bodyBlow: 0.58,
  kneeBuckle: 0.85,
};

export const LOW_HEALTH_HURT_STUN_BONUS = 0.08;

export const HURT_KNOCKBACK_BY_REACTION: Record<HitReactionType, number> = {
  light: 95,
  guardHead: 220,
  bodyBlow: 72,
  kneeBuckle: 15,
};

export const HURT_DRAW_SCALE_BY_REACTION: Record<HitReactionType, number> = {
  light: 1.04,
  guardHead: 1.04,
  bodyBlow: 1.0,
  kneeBuckle: 1.12,
};

export const HURT_HITSTOP_BY_REACTION: Record<HitReactionType, number> = {
  light: 0.03,
  guardHead: 0.08,
  bodyBlow: 0.05,
  kneeBuckle: 0.12,
};

export type GroundHitPresentation = {
  stun: number;
  knockback: number;
  drawOffsetX: number;
  drawOffsetY: number;
  drawScale: number;
};

export const DOWN_HIT_PRESENTATION: Record<DownHitReactionType, GroundHitPresentation> = {
  body: { stun: 0.38, knockback: 54, drawOffsetX: 0, drawOffsetY: 0, drawScale: 1 },
  back: { stun: 0.44, knockback: 72, drawOffsetX: -6, drawOffsetY: -3, drawScale: 1.03 },
  launch: { stun: 0.5, knockback: 92, drawOffsetX: 8, drawOffsetY: -8, drawScale: 1.06 },
  mount: { stun: 0.55, knockback: 18, drawOffsetX: 0, drawOffsetY: 0, drawScale: 1 },
};
