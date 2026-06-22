/*
 * src/entities/PlayerRenderer.ts
 * プレイヤー（Maki）の描画処理
 * スプライト・影・デバッグ当たり判定の描画を担当
 * 関連: Player.ts（描画委譲元）, HitboxConfig.ts（当たり判定描画）
 */

import { DebugFlags } from '../systems/DebugFlags';
import type { Player } from './Player';
import { DOWN_HIT_PRESENTATION, HURT_FRAME_BY_REACTION } from './PlayerTypes';

export class PlayerRenderer {
  constructor(private player: Player) {}

  render(ctx: CanvasRenderingContext2D): void {
    this.drawShadow(ctx);
    ctx.save();
    ctx.translate(this.player.x + this.player.width / 2, 0);
    ctx.scale(this.player.facing, 1);
    this.renderSprite(ctx);
    if (this.player.isChainWrapped && this.player.isBoundBodyBlowHurt) this.drawChainWrap(ctx);
    ctx.restore();
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.fillText(`${this.player.state.toUpperCase()} [${this.player.currentFrame}] r=${this.player.rapidCount}`, this.player.x, this.player.y - 5);
    this.renderDebugHitboxes(ctx);
    if ((this.player.state === 'bound' || this.player.state === 'grabbed' || this.player.state === 'reverseCrab') && this.player.health > 0) this.drawBoundResistanceGauge(ctx);
  }

  private renderSprite(ctx: CanvasRenderingContext2D): void {
    if (this.player.state === 'idle' && (this.player.idleImage || this.player.pinchIdleImage)) {
      const idle = this.player.isLowHealth && this.player.pinchIdleImage ? this.player.pinchIdleImage : this.player.idleImage;
      if (idle) ctx.drawImage(idle, 0, 0, this.player.frameWidth, this.player.frameHeight, -this.player.width / 2, this.player.y, this.player.width, this.player.height);
    } else if (this.player.state === 'walk' && this.player.spriteImage) {
      const sx = this.player.currentFrame * this.player.frameWidth;
      ctx.drawImage(this.player.spriteImage, sx, 0, this.player.frameWidth, this.player.frameHeight, -this.player.width / 2, this.player.y, this.player.width, this.player.height);
    } else if (this.player.state === 'attack' && this.player.attackImage) {
      ctx.drawImage(this.player.attackImage, this.player.frameWidth, 0, this.player.frameWidth, this.player.frameHeight, -this.player.width / 2, this.player.y, this.player.width, this.player.height);
    } else if (this.player.state === 'kick' && this.player.kickImage) {
      ctx.drawImage(this.player.kickImage, this.player.kickFrameWidth, 0, this.player.kickFrameWidth, this.player.frameHeight, -this.player.width / 2, this.player.y, this.player.width, this.player.height);
    } else if (this.player.state === 'jump' && this.player.jumpImage) {
      const sx = this.player.currentFrame * this.player.frameWidth;
      ctx.drawImage(this.player.jumpImage, sx, 0, this.player.frameWidth, this.player.frameHeight, -this.player.width / 2, this.player.y, this.player.width, this.player.height);
    } else if (this.player.state === 'death' && this.player.deathImage) {
      if (this.player.hurtDrawScale > 1 && this.player.hurtImage) {
        const sx = this.player.currentFrame * this.player.frameWidth;
        const s = this.player.hurtDrawScale;
        ctx.drawImage(this.player.hurtImage, sx, 0, this.player.frameWidth, this.player.frameHeight, -this.player.width * s / 2, this.player.y - this.player.height * (s - 1), this.player.width * s, this.player.height * s);
      } else {
        ctx.drawImage(this.player.deathImage, -this.player.width / 2, this.player.y, this.player.width, this.player.height);
      }
    } else if (this.player.state === 'hurt' && this.player.hurtImage) {
      this.renderHurtSprite(ctx);
    } else if (this.player.state === 'grabbed' && (this.player.grabbedImage || this.player.hurtImage)) {
      this.renderGrabbedSprite(ctx);
    } else if (this.player.state === 'bound' && (this.player.boundImage || this.player.grabbedImage || this.player.hurtImage)) {
      this.renderBoundSprite(ctx);
    } else if (this.player.state === 'reverseCrab' && (this.player.reverseCrabImage || this.player.downImage || this.player.hurtImage)) {
      this.renderReverseCrabSprite(ctx);
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
    const hop = (this.player.state === 'bound' || this.player.state === 'grabbed') ? this.player.boundBodyBlowHurtRatio * 4 : 0;
    const y = this.player.y - hop;
    ctx.save();
    if (this.player.grabbedImage) {
      const sw = this.player.grabbedImage.naturalWidth || this.player.grabbedImage.width || this.player.frameWidth;
      const dw = sw * this.player.width / this.player.frameWidth;
      ctx.drawImage(this.player.grabbedImage, 0, 0, sw, this.player.frameHeight, -dw / 2, y, dw, this.player.height);
    } else if (this.player.hurtImage) {
      const sx = HURT_FRAME_BY_REACTION.guardHead * this.player.frameWidth;
      ctx.drawImage(this.player.hurtImage, sx, 0, this.player.frameWidth, this.player.frameHeight, -this.player.width / 2, y, this.player.width, this.player.height);
    }
    ctx.restore();
  }

  private renderBoundSprite(ctx: CanvasRenderingContext2D): void {
    const hop = this.player.boundBodyBlowHurtRatio * 4;
    const y = this.player.y - hop;
    ctx.save();
    if (this.player.boundImage) {
      const sw = this.player.boundImage.naturalWidth || this.player.boundImage.width || this.player.frameWidth;
      const dw = sw * this.player.width / this.player.frameWidth;
      ctx.drawImage(this.player.boundImage, 0, 0, sw, this.player.frameHeight, -dw / 2, y, dw, this.player.height);
    } else if (this.player.grabbedImage) {
      const sw = this.player.grabbedImage.naturalWidth || this.player.grabbedImage.width || this.player.frameWidth;
      const dw = sw * this.player.width / this.player.frameWidth;
      ctx.drawImage(this.player.grabbedImage, 0, 0, sw, this.player.frameHeight, -dw / 2, y, dw, this.player.height);
    } else if (this.player.hurtImage) {
      const sx = HURT_FRAME_BY_REACTION.guardHead * this.player.frameWidth;
      ctx.drawImage(this.player.hurtImage, sx, 0, this.player.frameWidth, this.player.frameHeight, -this.player.width / 2, y, this.player.width, this.player.height);
    }
    ctx.restore();
  }

  private renderReverseCrabSprite(ctx: CanvasRenderingContext2D): void {
    const lean = this.player.boundEscapeRatio * 6;
    const image = this.player.reverseCrabImage ?? this.player.downImage ?? this.player.hurtImage;
    if (!image) return;
    ctx.save();
    ctx.translate(0, -lean);
    ctx.rotate(-0.08);
    if (this.player.reverseCrabImage) {
      ctx.drawImage(image, -this.player.width / 2, this.player.y - 2, this.player.width, this.player.height);
    } else if (this.player.downImage) {
      this.drawGroundedSprite(ctx, this.player.downImage, this.player.downSource, this.player.downDrawWidth, this.player.downDrawHeight, 0, -4);
    } else {
      const sx = 0;
      ctx.drawImage(image, sx, 0, this.player.frameWidth, this.player.frameHeight, -this.player.width / 2, this.player.y - 2, this.player.width, this.player.height);
    }
    ctx.restore();
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
    if (this.player.currentDownHitReaction === 'mount' && this.player.mountPunchImage) {
      this.drawGroundedSprite(ctx, this.player.mountPunchImage, this.player.mountPunchSource, this.player.mountPunchDrawWidth, this.player.mountPunchDrawHeight, presentation.drawOffsetX, presentation.drawOffsetY);
      return;
    }
    if (this.player.currentDownHitReaction === 'launch' && this.player.launchImage) {
      this.drawGroundedSprite(ctx, this.player.launchImage, this.player.launchSource, this.player.launchDrawWidth * presentation.drawScale, this.player.launchDrawHeight * presentation.drawScale, presentation.drawOffsetX, presentation.drawOffsetY);
      return;
    }
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

  private drawBoundResistanceGauge(ctx: CanvasRenderingContext2D): void {
    const ratio = this.player.boundEscapeRatio;
    const cx = this.player.x + this.player.width / 2;
    const gy = this.player.y + this.player.height - 3;
    const w = 40;
    const h = 4;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(cx - w / 2 - 1, gy - h / 2 - 1, w + 2, h + 2);
    ctx.fillStyle = ratio >= 1 ? '#ffd700' : '#fff';
    ctx.fillRect(cx - w / 2, gy - h / 2, w * ratio, h);
  }
}
