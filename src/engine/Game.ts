/*
 * src/engine/Game.ts
 * ゲームループの制御（更新・描画・HitStop・画面シェイク）
 * Entityの管理とフレーム毎の update/render を実行する
 * 関連: Entity.ts（基底クラス）, main.ts（エントリポイント）
 */

import { Entity } from './Entity';

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private entities: Entity[] = [];
  private backgroundEntity?: Entity;
  private lastTime: number = 0;
  private running: boolean = false;
  private hitStopTimer: number = 0;
  private slowMotionTimer: number = 0;
  private slowMotionFactor: number = 1;
  private screenShakeTimer: number = 0;
  private screenShakeDuration: number = 0;
  private screenShakeMagnitude: number = 0;
  cameraX: number = 0;
  onFrame: (() => void) | null = null;
  drawUI: ((ctx: CanvasRenderingContext2D) => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;
  }

  setBackground(entity: Entity): void {
    this.backgroundEntity = entity;
  }

  start(): void {
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }

  stop(): void {
    this.running = false;
  }

  addEntity(entity: Entity): void {
    this.entities.push(entity);
  }

  restart(): void {
    this.entities = this.entities.filter(e => e.persistOnRestart);
    this.cameraX = 0;
    this.hitStopTimer = 0;
    this.slowMotionTimer = 0;
    this.slowMotionFactor = 1;
    this.screenShakeTimer = 0;
    this.screenShakeDuration = 0;
    this.screenShakeMagnitude = 0;
    for (const entity of this.entities) {
      entity.restart?.();
    }
  }

  requestHitStop(duration: number): void {
    this.hitStopTimer = Math.max(this.hitStopTimer, duration);
  }

  requestSlowMotion(duration: number, factor: number): void {
    if (factor >= 1) return;
    this.slowMotionTimer = Math.max(this.slowMotionTimer, duration);
    this.slowMotionFactor = Math.min(this.slowMotionFactor, factor);
  }

  requestScreenShake(duration: number, magnitude: number): void {
    this.screenShakeTimer = Math.max(this.screenShakeTimer, duration);
    this.screenShakeDuration = Math.max(this.screenShakeDuration, duration);
    this.screenShakeMagnitude = Math.max(this.screenShakeMagnitude, magnitude);
  }

  private loop(currentTime: number): void {
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    this.onFrame?.();
    this.update(dt);
    this.render();

    if (this.running) {
      requestAnimationFrame(this.loop.bind(this));
    }
  }

  private update(dt: number): void {
    if (this.slowMotionTimer > 0) {
      this.slowMotionTimer = Math.max(0, this.slowMotionTimer - dt);
      dt *= this.slowMotionFactor;
      if (this.slowMotionTimer <= 0) this.slowMotionFactor = 1;
    }

    if (this.screenShakeTimer > 0) {
      this.screenShakeTimer = Math.max(0, this.screenShakeTimer - dt);
      if (this.screenShakeTimer <= 0) {
        this.screenShakeDuration = 0;
        this.screenShakeMagnitude = 0;
      }
    }

    if (this.hitStopTimer > 0) {
      this.hitStopTimer = Math.max(0, this.hitStopTimer - dt);
      return;
    }

    if (this.backgroundEntity) this.backgroundEntity.update(dt);
    for (const entity of this.entities) {
      if (entity.active) entity.update(dt);
    }
  }

  private render(): void {
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const shakeX = this.getShakeOffset();

    this.ctx.save();
    this.ctx.translate(shakeX, 0);
    if (this.backgroundEntity) this.backgroundEntity.render(this.ctx);
    this.ctx.restore();

    this.ctx.save();
    this.ctx.translate(-this.cameraX + shakeX, 0);
    const sorted = [...this.entities].sort((a, b) => a.zIndex - b.zIndex);
    for (const entity of sorted) {
      if (entity.active) entity.render(this.ctx);
    }
    for (const entity of sorted) {
      if (entity.active) entity.renderOverlay(this.ctx);
    }
    this.ctx.restore();

    this.drawUI?.(this.ctx);
  }

  private getShakeOffset(): number {
    if (this.screenShakeTimer <= 0 || this.screenShakeDuration <= 0) return 0;
    const t = this.screenShakeTimer / this.screenShakeDuration;
    const direction = Math.random() < 0.5 ? -1 : 1;
    return direction * this.screenShakeMagnitude * t;
  }
}
