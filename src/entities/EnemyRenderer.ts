/*
 * src/entities/EnemyRenderer.ts
 * グラント（雑魚敵）の描画処理
 * スプライト・影・デバッグ当たり判定の描画を担当
 * 関連: Enemy.ts（描画委譲元）, HitboxConfig.ts（当たり判定描画）
 */

import { DebugFlags } from '../systems/DebugFlags';
import type { HitboxRect } from '../systems/HitboxConfig';
import type { Enemy } from './Enemy';

export class EnemyRenderer {
  constructor(private enemy: Enemy) {}

  render(ctx: CanvasRenderingContext2D): void {
    this.drawShadow(ctx);

    if (!this.enemy.spriteImage) {
      ctx.fillStyle = '#777';
      ctx.fillRect(this.enemy.x, this.enemy.y, this.enemy.width, this.enemy.height);
      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      ctx.fillText(`HP:${this.enemy.health}`, this.enemy.x, this.enemy.y - 5);
      return;
    }

    ctx.save();
    ctx.translate(this.enemy.x + this.enemy.width / 2, 0);
    ctx.scale(-this.enemy.facing, 1);

    if (this.renderDeath(ctx)) { ctx.restore(); return; }
    if (this.renderHurt(ctx)) { ctx.restore(); this.renderHUD(ctx); this.renderDebugHitboxes(ctx); return; }
    if (this.renderBodyBlow(ctx)) { ctx.restore(); this.renderHUD(ctx); this.renderDebugHitboxes(ctx); return; }
    if (this.renderDownAttack(ctx)) { ctx.restore(); this.renderHUD(ctx); this.renderDebugHitboxes(ctx); return; }
    if (this.renderGrab(ctx)) { ctx.restore(); this.renderHUD(ctx); this.renderDebugHitboxes(ctx); return; }
    if (this.renderGrabFollowup(ctx)) { ctx.restore(); this.renderHUD(ctx); this.renderDebugHitboxes(ctx); return; }
    if (this.renderReverseCrab(ctx)) { ctx.restore(); this.renderHUD(ctx); this.renderDebugHitboxes(ctx); return; }

    this.renderDefault(ctx);
    ctx.restore();
    this.renderHUD(ctx);
    this.renderDebugHitboxes(ctx);
  }

  private drawSpriteFull(ctx: CanvasRenderingContext2D, image: HTMLImageElement, sx: number): void {
    const s = this.enemy.renderScale;
    const dw = this.enemy.width * s;
    const dh = this.enemy.height * s;
    ctx.drawImage(image, sx, 0, this.enemy.frameWidth, this.enemy.frameHeight, -dw / 2, this.enemy.y + this.enemy.height - dh, dw, dh);
  }

  private renderDeath(ctx: CanvasRenderingContext2D): boolean {
    if (this.enemy.state !== 'death' || !this.enemy.hurtImage) return false;
    this.drawSpriteFull(ctx, this.enemy.hurtImage, this.enemy.frameWidth);
    return true;
  }

  private renderHurt(ctx: CanvasRenderingContext2D): boolean {
    if (this.enemy.state !== 'hurt' || !this.enemy.hurtImage) return false;
    this.drawSpriteFull(ctx, this.enemy.hurtImage, this.enemy.currentFrame * this.enemy.frameWidth);
    return true;
  }

  private renderHeavyAttack(ctx: CanvasRenderingContext2D): boolean {
    return false; // 重撃は削除済み
  }

  private renderBodyBlow(ctx: CanvasRenderingContext2D): boolean {
    if (this.enemy.state !== 'bodyBlow' || !this.enemy.bodyBlowImage) return false;
    const sx = this.enemy.currentFrame * this.enemy.frameWidth;
    ctx.scale(-1, 1);
    const drawScale = 0.9;
    const drawW = this.enemy.width * drawScale;
    const drawH = this.enemy.height * drawScale;
    ctx.drawImage(this.enemy.bodyBlowImage, sx, 0, this.enemy.frameWidth, this.enemy.frameHeight, -drawW / 2, this.enemy.y + this.enemy.height - drawH, drawW, drawH);
    return true;
  }

  private renderDownAttack(ctx: CanvasRenderingContext2D): boolean {
    if (this.enemy.state !== 'downAttack') return false;
    const image = this.enemy.downAttackImage ?? this.enemy.bodyBlowImage;
    if (!image) return false;
    const sourceWidth = this.getImageWidth(image);
    const frameCount = Math.max(1, Math.floor(sourceWidth / this.enemy.frameWidth));
    const sx = (this.enemy.currentFrame % frameCount) * this.enemy.frameWidth;
    const drawScale = 0.92;
    const drawW = this.enemy.width * drawScale;
    const drawH = this.enemy.height * drawScale;
    ctx.drawImage(image, sx, 0, this.enemy.frameWidth, this.enemy.frameHeight, -drawW / 2, this.enemy.y + this.enemy.height - drawH, drawW, drawH);
    return true;
  }

  private getImageWidth(image: HTMLImageElement): number {
    return image.naturalWidth || image.width || this.enemy.frameWidth;
  }

  private renderGrab(_ctx: CanvasRenderingContext2D): boolean {
    if (this.enemy.state !== 'grab') return false;
    return true;
  }

  private renderGrabFollowup(_ctx: CanvasRenderingContext2D): boolean {
    if (this.enemy.state !== 'grabFollowup') return false;
    return true;
  }

  private renderReverseCrab(_ctx: CanvasRenderingContext2D): boolean {
    if (this.enemy.state !== 'reverseCrab') return false;
    return true;
  }

  private renderDefault(ctx: CanvasRenderingContext2D): void {
    let frameIdx = 0;
    if (this.enemy.state === 'idle') frameIdx = 0;
    else if (this.enemy.state === 'walk') frameIdx = 1 + this.enemy.currentFrame;
    else if (this.enemy.state === 'attack') frameIdx = 3 + this.enemy.currentFrame;
    this.drawSpriteFull(ctx, this.enemy.spriteImage!, frameIdx * this.enemy.frameWidth);
  }

  private renderHUD(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.fillText(`HP:${this.enemy.health}`, this.enemy.x, this.enemy.y - 5);
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
    ctx.ellipse(this.enemy.x + this.enemy.width / 2, this.enemy.y + this.enemy.height - 8, 48, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
