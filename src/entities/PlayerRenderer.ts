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
    if (this.player.isChainWrapped) this.drawChainWrap(ctx);
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

  private drawChainWrap(ctx: CanvasRenderingContext2D): void {
    const progress = this.player.chainWrappedProgress;
    const impact = this.player.chainWrappedImpactRatio;
    const cinch = 1 - impact * 0.08;
    const alpha = 0.78 + Math.sin(progress * Math.PI * 5) * 0.05;
    const bands = [
      { y: this.player.y + 78, tilt: 10, width: 58 },
      { y: this.player.y + 92, tilt: -12, width: 72 },
      { y: this.player.y + 106, tilt: 10, width: 76 },
      { y: this.player.y + 120, tilt: -8, width: 62 },
    ];

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 2;
    this.drawWrapSideRing(ctx, -39 * cinch, this.player.y + 99, 11, 33, -0.18);
    this.drawWrapSideRing(ctx, 39 * cinch, this.player.y + 99, 11, 33, 0.18);
    for (const band of bands) {
      const width = band.width * cinch;
      this.drawChainBand(ctx, -width / 2, band.y - band.tilt / 2, width / 2, band.y + band.tilt / 2);
    }
    if (impact > 0) {
      ctx.globalAlpha = impact * 0.55;
      ctx.strokeStyle = '#ffefe0';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, this.player.y + 99, 28, 18, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#bd3f36';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-15, this.player.y + 96);
      ctx.lineTo(15, this.player.y + 102);
      ctx.moveTo(-13, this.player.y + 106);
      ctx.lineTo(12, this.player.y + 92);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawChainBand(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number): void {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    const linkStep = 10;

    ctx.save();
    ctx.translate(x1, y1);
    ctx.rotate(angle);
    ctx.strokeStyle = 'rgba(22, 13, 10, 0.85)';
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.moveTo(0, 1.5);
    ctx.lineTo(length, 1.5);
    ctx.stroke();
    for (let x = 0; x <= length; x += linkStep) {
      ctx.save();
      ctx.translate(x, 0);
      ctx.rotate((x / linkStep) % 2 === 0 ? 0.35 : -0.35);
      ctx.strokeStyle = '#332118';
      ctx.lineWidth = 3;
      ctx.strokeRect(-3.7, -2.7, 7.4, 5.4);
      ctx.strokeStyle = '#d9c982';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(-2.6, -1.7, 5.2, 3.4);
      ctx.restore();
    }
    ctx.restore();
  }

  private drawWrapSideRing(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, rotation: number): void {
    ctx.save();
    ctx.strokeStyle = '#2c1b14';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rotation, -Math.PI * 0.34, Math.PI * 0.34);
    ctx.stroke();
    ctx.strokeStyle = '#d9c982';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y, rx - 2, ry - 2, rotation, -Math.PI * 0.34, Math.PI * 0.34);
    ctx.stroke();
    ctx.restore();
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
