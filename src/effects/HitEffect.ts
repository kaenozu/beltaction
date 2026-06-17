/*
 * src/effects/HitEffect.ts
 * 打撃ヒット時のエフェクト（白フラッシュ + 拡散リング + 火花）
 * ヒット位置に一瞬表示され、派手に炸裂して消える
 * 関連: SpawnSystem（ヒット時に生成）, Enemy, Player
 */

import { Entity } from '../engine/Game';

export class HitEffect extends Entity {
  private timer: number = 0.25;

  constructor(x: number, y: number) {
    super(x, y);
  }

  override update(dt: number): void {
    this.timer -= dt;
    if (this.timer <= 0) {
      this.active = false;
    }
  }

  override render(ctx: CanvasRenderingContext2D): void {
    const t = Math.max(0, this.timer / 0.25); // 1→0
    const r = 6 + (1 - t) * 30;

    ctx.save();

    // 1) White flash (fades fast)
    if (t > 0.6) {
      const flashA = Math.min(1, (t - 0.6) / 0.4);
      ctx.globalAlpha = flashA * 0.5;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(this.x, this.y, r * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2) Expanding ring
    ctx.globalAlpha = t * 0.9;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.stroke();

    // 3) Second smaller ring
    ctx.globalAlpha = t * 0.6;
    ctx.strokeStyle = '#ff0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 0.6, 0, Math.PI * 2);
    ctx.stroke();

    // 4) Spark rays (8 directions)
    ctx.globalAlpha = t;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + t * 3;
      const len = r * (0.8 + 0.6 * (1 - t));
      ctx.beginPath();
      ctx.moveTo(this.x + Math.cos(angle) * r * 0.3, this.y + Math.sin(angle) * r * 0.3);
      ctx.lineTo(this.x + Math.cos(angle) * len, this.y + Math.sin(angle) * len);
      ctx.stroke();
    }

    ctx.restore();
  }
}
