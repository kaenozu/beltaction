import { Entity } from '../engine/Game';

export interface SpriteFrame {
  x: number;
  y: number;
  w: number;
  h: number;
}

export class Sprite extends Entity {
  public sheet: CanvasImageSource | null = null;
  public frameWidth: number = 160;
  public frameHeight: number = 192;
  
  // Color placeholder mode
  private useColor: boolean = true;
  private fillColor: string = '#ff6b6b';
  private label: string = '?';
  
  constructor(x: number = 0, y: number = 0) {
    super(x, y);
  }
  
  setColor(color: string, label: string): void {
    this.fillColor = color;
    this.label = label;
    this.useColor = true;
  }
  
  setSheet(img: CanvasImageSource): void {
    this.sheet = img;
    this.useColor = false;
  }
  
  override render(ctx: CanvasRenderingContext2D): void {
    if (this.useColor) {
      // Placeholder rectangle
      ctx.fillStyle = this.fillColor;
      ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      ctx.fillText(this.label, this.x + 5, this.y + 20);
    } else if (this.sheet) {
      // Actual sprite - draw from sheet
      ctx.drawImage(this.sheet, this.x, this.y, this.width, this.height);
    }
  }
}