/*
 * src/stages/StageManager.ts
 * ステージのスクロール制御とパララックス背景描画
 * 3層パララックス（遠景/中景/近景）+ 地面
 * 関連: Game.ts（setBackground）, main.ts（スクロール連動）
 */

import { Entity } from '../engine/Entity';

export class StageManager extends Entity {
  private scrollX: number = 0;
  private readonly STAGE_WIDTH = 2000;
  
  constructor() {
    super(0, 0);
    this.active = true;
    this.persistOnRestart = true;
  }
  
  update(_dt: number): void {
    // No update needed, controlled externally
  }
  
  setPosition(centerX: number): void {
    const targetScroll = centerX - 320;
    this.scrollX = Math.max(0, Math.min(targetScroll, this.STAGE_WIDTH - 640));
  }
  
  getScrollX(): number {
    return this.scrollX;
  }
  
  override render(ctx: CanvasRenderingContext2D): void {
    const sx = this.scrollX * 0.5;
    const mx = this.scrollX * 0.7;
    const fx = this.scrollX * 0.9;
    
    // Far background (sky + distant buildings with sx parallax)
    ctx.fillStyle = '#1a3a5a';
    ctx.fillRect(0, 0, 640, 200);
    const wrapX = (x: number) => ((x % 640) + 640) % 640;
    for (let i = 0; i < 6; i++) {
      ctx.fillRect(wrapX(i * 300 - sx), 100, 40, 100);
    }
    
    // Mid background (tall buildings with mx parallax)
    ctx.fillStyle = '#2d5a87';
    for (let i = 0; i < 8; i++) {
      ctx.fillRect(wrapX(i * 250 - mx), 150, 50, 150);
    }
    
    // Near background (street lamps with fx parallax)
    ctx.fillStyle = '#555';
    for (let i = 0; i < 15; i++) {
      ctx.fillRect(wrapX(i * 100 - fx), 380, 10, 20);
    }
    
    // Foreground (ground)
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 400, 640, 80);
  }
}