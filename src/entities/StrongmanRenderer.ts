/*
 * src/entities/StrongmanRenderer.ts
 * Strongman の描画処理（影、スプライト、デバッグヒットボックス）
 * 関連: Strongman.ts, EnemyRenderer.ts, DebugFlags.ts
 */

import { DebugFlags } from '../systems/DebugFlags';
import type { HitboxRect } from '../systems/HitboxConfig';
import type { Strongman } from './Strongman';

export class StrongmanRenderer {
  constructor(private enemy: Strongman) {}

  render(ctx: CanvasRenderingContext2D): void {
    this.drawShadow(ctx);
    if (!this.enemy.spriteImage) {
      ctx.fillStyle = '#8a5';
      ctx.fillRect(this.enemy.x, this.enemy.y, this.enemy.width, this.enemy.height);
      return;
    }

    ctx.save();
    ctx.translate(this.enemy.x + this.enemy.width / 2, 0);
    ctx.scale(this.enemy.facing, 1);
    const image = this.enemy.bodyBlowImage ?? this.enemy.spriteImage;
    const sx = this.enemy.currentFrame * this.enemy.frameWidth;
    const drawW = this.enemy.width * 0.96;
    const drawH = this.enemy.height * 0.96;
    const y = this.enemy.state === 'reverseCrab' ? this.enemy.y + 14 : this.enemy.y;
    ctx.drawImage(image!, sx, 0, this.enemy.frameWidth, this.enemy.frameHeight, -drawW / 2, y + this.enemy.height - drawH, drawW, drawH);
    ctx.restore();
    this.renderDebugHitboxes(ctx);
  }

  private renderDebugHitboxes(ctx: CanvasRenderingContext2D): void {
    if (!DebugFlags.showHitboxes) return;
    ctx.strokeStyle = '#f00';
    ctx.lineWidth = 1;
    const body: HitboxRect = this.enemy.getBodyHitbox();
    ctx.strokeRect(body.x, body.y, body.w, body.h);
    ctx.strokeStyle = '#0ff';
    const hurt: HitboxRect = this.enemy.getHurtHitbox();
    ctx.strokeRect(hurt.x, hurt.y, hurt.w, hurt.h);
  }

  private drawShadow(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
    ctx.beginPath();
    ctx.ellipse(this.enemy.x + this.enemy.width / 2, this.enemy.y + this.enemy.height - 8, 50, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
