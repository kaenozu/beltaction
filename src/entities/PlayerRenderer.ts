/*
 * src/entities/PlayerRenderer.ts
 * プレイヤー（Maki）の描画処理
 * スプライト・影・デバッグ当たり判定の描画を担当
 * 関連: Player.ts（描画委譲元）, HitboxConfig.ts（当たり判定描画）
 */

import { DebugFlags } from '../systems/DebugFlags';
import type { Player } from './Player';
import { DOWN_HIT_PRESENTATION } from './PlayerTypes';

export class PlayerRenderer {
  constructor(private player: Player) {}

  render(ctx: CanvasRenderingContext2D): void {
    this.drawShadow(ctx);
    ctx.save();
    ctx.translate(this.player.x + this.player.width / 2, 0);
    ctx.scale(this.player.facing, 1);
    this.renderSprite(ctx);
    ctx.restore();
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.fillText(`${this.player.state.toUpperCase()} [${this.player.currentFrame}] r=${this.player.rapidCount}`, this.player.x, this.player.y - 5);
    this.renderDebugHitboxes(ctx);
  }

  private renderSprite(ctx: CanvasRenderingContext2D): void {
    if (this.player.state === 'idle' && (this.player.idleImage || this.player.pinchIdleImage)) {
      const idle = this.player.isLowHealth && this.player.pinchIdleImage ? this.player.pinchIdleImage : this.player.idleImage;
      if (idle) ctx.drawImage(idle, -this.player.width / 2, this.player.y, this.player.width, this.player.height);
    } else if (this.player.state === 'walk' && this.player.spriteImage) {
      const sx = this.player.currentFrame * this.player.frameWidth;
      ctx.drawImage(this.player.spriteImage, sx, 0, this.player.frameWidth, this.player.frameHeight, -this.player.width / 2, this.player.y, this.player.width, this.player.height);
    } else if (this.player.state === 'attack' && this.player.attackImage) {
      this.renderFrameSprite(ctx, this.player.attackImage, this.player.currentFrame * this.player.frameWidth);
    } else if (this.player.state === 'kick' && this.player.kickImage) {
      const sx = this.player.currentFrame * this.player.kickFrameWidth;
      ctx.drawImage(this.player.kickImage, sx, 0, this.player.kickFrameWidth, this.player.frameHeight, -this.player.kickFrameWidth / 2, this.player.y, this.player.kickFrameWidth, this.player.height);
    } else if (this.player.state === 'jump' && this.player.jumpImage) {
      ctx.drawImage(this.player.jumpImage, -this.player.width / 2, this.player.y, this.player.width, this.player.height);
    } else if (this.player.state === 'death' && this.player.deathImage) {
      ctx.drawImage(this.player.deathImage, -this.player.width / 2, this.player.y, this.player.width, this.player.height);
    } else if (this.player.state === 'hurt' && this.player.hurtImage) {
      this.renderHurtSprite(ctx);
    } else if ((this.player.state === 'grabbed' || this.player.state === 'bound') && (this.player.grabbedImage || this.player.hurtImage)) {
      this.renderGrabbedSprite(ctx);
    } else if (this.player.state === 'down' && this.player.downImage) {
      this.drawGroundedSprite(ctx, this.player.downImage, this.player.downSource, this.player.downDrawWidth, this.player.downDrawHeight);
    } else if (this.player.state === 'downhit' && this.player.downHitImage) {
      this.renderDownHitSprite(ctx);
    } else if (this.player.state === 'getup' && this.player.getupImage) {
      this.renderFrameSprite(ctx, this.player.getupImage, this.player.currentFrame * this.player.frameWidth);
    } else if (this.player.idleImage) {
      ctx.drawImage(this.player.idleImage, -this.player.width / 2, this.player.y, this.player.width, this.player.height);
    } else {
      ctx.fillStyle = '#ff6b6b';
      ctx.fillRect(-this.player.width / 2, this.player.y, this.player.width, this.player.height);
    }
  }

  private renderFrameSprite(ctx: CanvasRenderingContext2D, image: HTMLImageElement, sx: number): void {
    ctx.drawImage(image, sx, 0, this.player.frameWidth, this.player.frameHeight, -this.player.width / 2, this.player.y, this.player.width, this.player.height);
  }

  private renderHurtSprite(ctx: CanvasRenderingContext2D): void {
    const sx = this.player.currentFrame * this.player.frameWidth;
    const s = this.player.hurtDrawScale;
    ctx.drawImage(this.player.hurtImage!, sx, 0, this.player.frameWidth, this.player.frameHeight, -this.player.width * s / 2, this.player.y - this.player.height * (s - 1), this.player.width * s, this.player.height * s);
  }

  private renderGrabbedSprite(ctx: CanvasRenderingContext2D): void {
    if (this.player.grabbedImage) {
      ctx.drawImage(this.player.grabbedImage, -this.player.width / 2, this.player.y, this.player.width, this.player.height);
    } else if (this.player.hurtImage) {
      const sx = 1 * this.player.frameWidth;
      ctx.drawImage(this.player.hurtImage, sx, 0, this.player.frameWidth, this.player.frameHeight, -this.player.width / 2, this.player.y, this.player.width, this.player.height);
    }
  }

  private renderDownHitSprite(ctx: CanvasRenderingContext2D): void {
    const presentation = DOWN_HIT_PRESENTATION[this.player.currentDownHitReaction];
    this.drawGroundedSprite(ctx, this.player.downHitImage!, this.player.downHitSource, this.player.downHitDrawWidth * presentation.drawScale, this.player.downHitDrawHeight * presentation.drawScale, presentation.drawOffsetX, presentation.drawOffsetY);
  }

  private renderDebugHitboxes(ctx: CanvasRenderingContext2D): void {
    if (!DebugFlags.showHitboxes) return;
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth = 1;
    const body = this.player.getBodyHitbox();
    ctx.strokeRect(body.x, body.y, body.w, body.h);
    ctx.strokeStyle = '#0ff';
    const hurt = this.player.getHurtHitbox();
    ctx.strokeRect(hurt.x, hurt.y, hurt.w, hurt.h);
    const atk = this.player.getAttackHitbox();
    if (atk) {
      ctx.strokeStyle = '#f80';
      ctx.lineWidth = 2;
      ctx.strokeRect(atk.x, atk.y, atk.w, atk.h);
    }
  }

  private drawGroundedSprite(ctx: CanvasRenderingContext2D, image: HTMLImageElement, source: { x: number; y: number; w: number; h: number }, drawWidth: number, drawHeight: number, offsetX: number = 0, offsetY: number = 0): void {
    ctx.drawImage(image, source.x, source.y, source.w, source.h, -drawWidth / 2 + offsetX, this.player.y + this.player.height - drawHeight + offsetY, drawWidth, drawHeight);
  }

  private drawShadow(ctx: CanvasRenderingContext2D): void {
    const groundY = this.player.y + this.player.height - 8;
    const isDown = this.player.state === 'down' || this.player.state === 'downhit';
    const shadowW = isDown ? 158 : 104;
    const shadowH = isDown ? 12 : 14;
    const alpha = this.player.state === 'jump' ? 0.08 : 0.16;
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.beginPath();
    ctx.ellipse(this.player.x + this.player.width / 2, groundY, shadowW / 2, shadowH / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
