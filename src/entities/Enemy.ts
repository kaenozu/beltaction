import { Entity } from '../engine/Game';

export class Enemy extends Entity {
  public health: number = 30;
  public damage: number = 10;
  private velocityX: number = 0;
  private readonly GRAVITY = 800;
  
  constructor(x: number, y: number, private playerX: () => number) {
    super(x, y);
    this.width = 160;
    this.height = 192;
  }
  
  override update(dt: number): void {
    const playerPos = this.playerX();
    const distance = playerPos - this.x;
    
    if (Math.abs(distance) < 200) {
      this.velocityX = distance > 0 ? 80 : -80;
    } else {
      this.velocityX = distance > 0 ? 40 : -40;
    }
    
    this.x += this.velocityX * dt;
    this.y += this.GRAVITY * dt;
    
    if (this.y > 480 - this.height) {
      this.y = 480 - this.height;
    }
  }
  
  takeDamage(amount: number): void {
    this.health -= amount;
  }
  
  override render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#777';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.fillText(`HP:${this.health}`, this.x, this.y - 5);
  }
}