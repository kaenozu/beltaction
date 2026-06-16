/*
 * src/effects/HitEffect.ts
 * 打撃ヒット時の簡易エフェクト（白い拡散サークル）
 * ヒット位置に一瞬表示され、拡大しながらフェードアウトする
 * 関連: SpawnSystem（ヒット時に生成）, Enemy, Player
 */

import { Entity } from '../engine/Game';

export class HitEffect extends Entity {
  private timer: number = 0.15;
  private readonly maxRadius: number = 20;

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
    const progress = 1 - this.timer / 0.15;
    const radius = 4 + progress * this.maxRadius;
    const alpha = Math.max(0, 1 - progress * 1.2);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    // Inner flash
    ctx.fillStyle = '#ff0';
    ctx.globalAlpha = alpha * 0.4;
    ctx.beginPath();
    ctx.arc(this.x, this.y, radius * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
