/*
 * src/entities/ChainEnemyRenderer.ts
 * チェーン敵（中ボス）の描画処理
 * スプライト・鎖・シグネチャ詳細・デバッグ当たり判定を担当
 * 関連: ChainEnemy.ts（描画委譲元）, HitboxConfig.ts（当たり判定描画）
 */

import { DebugFlags } from '../systems/DebugFlags';
import type { HitboxRect } from '../systems/HitboxConfig';
import type { ChainEnemy } from './ChainEnemy';

export class ChainEnemyRenderer {
  constructor(private enemy: ChainEnemy) {}

  render(ctx: CanvasRenderingContext2D): void {
    this.drawShadow(ctx);

    if (!this.enemy.spriteImage) {
      ctx.fillStyle = '#465842';
      ctx.fillRect(this.enemy.x, this.enemy.y, this.enemy.width, this.enemy.height);
      this.drawChain(ctx);
      this.renderLabels(ctx);
      return;
    }

    const image = this.enemy.state === 'hurt' && this.enemy.hurtImage ? this.enemy.hurtImage : this.enemy.spriteImage;
    const frameIdx = this.enemy.getFrameIndex();
    const sx = frameIdx * this.enemy.spriteFrameWidth;

    ctx.save();
    ctx.translate(this.enemy.x + this.enemy.width / 2, 0);
    ctx.scale(-this.enemy.facing, 1);
    ctx.drawImage(image, sx, 0, this.enemy.spriteFrameWidth, this.enemy.frameHeight, -this.enemy.spriteFrameWidth / 2, this.enemy.y, this.enemy.spriteFrameWidth, this.enemy.height);
    ctx.restore();

    if (this.enemy.useFallbackDetails) this.drawSignatureDetails(ctx);
    this.drawChain(ctx);
    this.renderLabels(ctx);
    this.renderDebugHitboxes(ctx);
  }

  private drawChain(ctx: CanvasRenderingContext2D): void {
    if (this.enemy.state !== 'chainShot' && this.enemy.state !== 'boundPull' && this.enemy.state !== 'downDrag') return;
    const anchor = this.enemy.getChainAnchor();
    const progress = this.enemy.getChainDrawProgress();
    if (progress <= 0) return;
    const startX = anchor.x;
    const startY = anchor.y;
    const endX = startX + (this.enemy.chainTargetX - startX) * progress;
    const endY = startY + (this.enemy.chainTargetY - startY) * progress;
    if (this.enemy.chainImage) {
      this.drawSpriteChain(ctx, startX, startY, endX, endY);
      return;
    }
    ctx.save();
    ctx.strokeStyle = '#b7c0aa';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 5]);
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = '#4b554a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(startX, startY + 4);
    ctx.lineTo(endX, endY + 4);
    ctx.stroke();
    ctx.restore();
  }

  private drawSpriteChain(ctx: CanvasRenderingContext2D, startX: number, startY: number, endX: number, endY: number): void {
    if (!this.enemy.chainImage) return;
    const dx = endX - startX;
    const dy = endY - startY;
    const length = Math.hypot(dx, dy);
    if (length < 12) return;
    const tileW = 32;
    const tipW = 48;
    const h = 18;
    const bodyLength = Math.max(0, length - tipW + 8);
    ctx.save();
    ctx.translate(startX, startY);
    ctx.rotate(Math.atan2(dy, dx));
    for (let x = 0; x < bodyLength; x += tileW) {
      const drawW = Math.min(tileW, bodyLength - x + 4);
      ctx.drawImage(this.enemy.chainImage, 0, 0, tileW, h, x, -h / 2, drawW, h);
    }
    ctx.drawImage(this.enemy.chainImage, tileW, 0, tipW, h, Math.max(0, length - tipW), -h / 2, tipW, h);
    ctx.restore();
  }

  private drawSignatureDetails(ctx: CanvasRenderingContext2D): void {
    const centerX = this.enemy.x + this.enemy.width / 2;
    const headY = this.enemy.y + 36;
    const torsoY = this.enemy.y + 82;
    const hipY = this.enemy.y + 126;
    const facingOffset = this.enemy.facing * 18;
    ctx.save();
    ctx.fillStyle = '#1a3024';
    ctx.beginPath();
    ctx.ellipse(centerX, headY + 12, 31, 35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#101915';
    ctx.fillRect(centerX - 18, headY + 2, 36, 28);
    ctx.fillStyle = '#d8e9b8';
    ctx.fillRect(centerX + this.enemy.facing * 5 - 10, headY + 13, 7, 3);
    ctx.fillRect(centerX + this.enemy.facing * 5 + 6, headY + 13, 7, 3);
    ctx.fillStyle = '#6f684d';
    ctx.fillRect(centerX - 45, torsoY - 10, 28, 12);
    ctx.fillRect(centerX + 17, torsoY - 10, 28, 12);
    ctx.strokeStyle = '#2a1d16';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(centerX - 35, torsoY - 4);
    ctx.lineTo(centerX + 35, hipY + 10);
    ctx.stroke();
    ctx.strokeStyle = '#c8c2a5';
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.ellipse(centerX - 18 + i * 12, hipY, 8, 5, -0.2, 0, Math.PI * 2);
      ctx.stroke();
    }
    const handX = centerX + facingOffset + this.enemy.facing * 28;
    const handY = torsoY + 22;
    const attacking = this.enemy.state === 'chainShot' || this.enemy.state === 'boundPull' || this.enemy.state === 'downDrag';
    ctx.fillStyle = attacking ? '#e5d283' : '#8f8262';
    ctx.fillRect(handX - 8, handY - 7, 16, 14);
    ctx.strokeStyle = attacking ? '#fff0a5' : '#4b554a';
    ctx.lineWidth = attacking ? 3 : 2;
    ctx.beginPath();
    ctx.arc(handX + this.enemy.facing * 10, handY, 12, -0.8, 0.9);
    ctx.stroke();
    if (this.enemy.state === 'lowSweep') {
      ctx.strokeStyle = '#d0c58d';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(centerX + this.enemy.facing * 18, this.enemy.y + 150);
      ctx.lineTo(centerX + this.enemy.facing * 74, this.enemy.y + 162);
      ctx.stroke();
    }
    ctx.restore();
  }

  private renderLabels(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#d9f5d4';
    ctx.font = '10px monospace';
    ctx.fillText(`CHAIN HP:${this.enemy.health}`, this.enemy.x, this.enemy.y - 5);
  }

  private renderDebugHitboxes(ctx: CanvasRenderingContext2D): void {
    if (!DebugFlags.showHitboxes) return;
    ctx.strokeStyle = '#8f8';
    ctx.lineWidth = 1;
    const body: HitboxRect = this.enemy.getBodyHitbox();
    ctx.strokeRect(body.x, body.y, body.w, body.h);
    ctx.strokeStyle = '#0ff';
    const hurt: HitboxRect = this.enemy.getHurtHitbox();
    ctx.strokeRect(hurt.x, hurt.y, hurt.w, hurt.h);
    const atk = this.enemy.getAttackHitbox();
    if (atk) {
      ctx.strokeStyle = '#fd0';
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
