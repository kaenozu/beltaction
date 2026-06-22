/*
 * src/entities/MountingAttackerRenderer.ts
 * マウンティングアタッカーの描画処理
 * マウント時は2Pass描画で体の一部をプレイヤーの前後に分割
 * 関連: MountingAttacker.ts, Game.ts (render loop)
 */

import { DebugFlags } from '../systems/DebugFlags';
import type { HitboxRect } from '../systems/HitboxConfig';
import type { MountingAttacker } from './MountingAttacker';

export class MountingAttackerRenderer {
  static readonly MOUNT_OFFSET_X = 40;
  static readonly MOUNT_OFFSET_Y = -16;

  constructor(private enemy: MountingAttacker) {}

  render(ctx: CanvasRenderingContext2D): void {
    this.drawShadow(ctx);

    if (!this.enemy.spriteImage) {
      ctx.fillStyle = this.enemy.state === 'mount' ? '#b84' : '#8a6b35';
      ctx.fillRect(this.enemy.x, this.enemy.y, this.enemy.width, this.enemy.height);
      this.renderHUD(ctx);
      this.renderDebugHitboxes(ctx);
      return;
    }

    if (this.enemy.state === 'mount') {
      this.drawMountSprite(ctx);
    } else {
      this.drawSprite(ctx, 1, 0, 0);
    }

    this.renderHUD(ctx);
    this.renderDebugHitboxes(ctx);
  }

  renderOverlay(ctx: CanvasRenderingContext2D): void {
    if (this.enemy.state !== 'mount') return;
    if (!this.enemy.spriteImage) return;
    this.drawMountSprite(ctx);
  }

  private drawMountSprite(ctx: CanvasRenderingContext2D): void {
    const image = this.enemy.bodyBlowImage ?? this.enemy.spriteImage!;
    const sx = this.enemy.currentFrame * this.enemy.frameWidth;
    const offsetX = this.enemy.facing >= 0
      ? MountingAttackerRenderer.MOUNT_OFFSET_X
      : -MountingAttackerRenderer.MOUNT_OFFSET_X;

    ctx.save();
    ctx.translate(this.enemy.x + this.enemy.width / 2 + offsetX, 0);
    ctx.scale(this.enemy.facing, 1);

    const drawW = this.enemy.width * 0.9;
    const drawH = this.enemy.height * 0.9;
    const drawY = this.enemy.y + this.enemy.height - drawH + MountingAttackerRenderer.MOUNT_OFFSET_Y;
    ctx.drawImage(image, sx, 0, this.enemy.frameWidth, this.enemy.frameHeight, -drawW / 2, drawY, drawW, drawH);
    ctx.restore();
  }

  private drawSprite(ctx: CanvasRenderingContext2D, scale: number, offsetX: number, offsetY: number): void {
    ctx.save();
    ctx.translate(this.enemy.x + this.enemy.width / 2 + offsetX, 0);
    ctx.scale(this.enemy.facing, 1);

    const image = this.pickImage();
    const sx = this.pickFrame() * this.enemy.frameWidth;
    const drawW = this.enemy.width * scale;
    const drawH = this.enemy.height * scale;
    const drawY = this.enemy.y + this.enemy.height - drawH + offsetY;
    ctx.drawImage(image, sx, 0, this.enemy.frameWidth, this.enemy.frameHeight, -drawW / 2, drawY, drawW, drawH);
    ctx.restore();
  }

  private pickImage(): HTMLImageElement {
    if ((this.enemy.state === 'hurt' || this.enemy.state === 'death') && this.enemy.hurtImage) return this.enemy.hurtImage;
    if (this.enemy.state === 'sweep' && this.enemy.heavyAttackImage) return this.enemy.heavyAttackImage;
    return this.enemy.spriteImage!;
  }

  private pickFrame(): number {
    if (this.enemy.state === 'hurt' || this.enemy.state === 'death') return this.enemy.state === 'death' ? 1 : 0;
    if (this.enemy.state === 'walk') return 1 + this.enemy.currentFrame;
    if (this.enemy.state === 'sweep') return this.enemy.currentFrame;
    return 0;
  }

  private renderHUD(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#ffd78a';
    ctx.font = '10px monospace';
    ctx.fillText(`MOUNT HP:${this.enemy.health}`, this.enemy.x, this.enemy.y - 5);
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
    const atk = this.enemy.getAttackHitbox();
    if (atk) {
      ctx.strokeStyle = '#f80';
      ctx.lineWidth = 2;
      ctx.strokeRect(atk.x, atk.y, atk.w, atk.h);
    }
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
