/*
 * src/effects/HitEffect.ts
 * 打撃ヒット時の簡易エフェクト（白い拡散サークル）
 * ヒット位置に一瞬表示され、拡大しながらフェードアウトする
 * 関連: SpawnSystem（ヒット時に生成）, Enemy, Player
 */

import { Entity } from '../engine/Game';

export class HitEffect extends Entity {
  private timer: number = 0.18;

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
    const t = Math.max(0, this.timer / 0.18);
    const r = 8 + (1 - t) * 24;

    ctx.save();
    ctx.globalAlpha = t;
    // Outer ring
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.stroke();
    // Rays
    ctx.strokeStyle = '#ff0';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x + Math.cos(angle) * r * 1.5, this.y + Math.sin(angle) * r * 1.5);
      ctx.stroke();
    }
    ctx.restore();
  }
}
