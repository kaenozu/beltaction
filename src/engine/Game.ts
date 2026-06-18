export class Entity {
  x: number = 0;
  y: number = 0;
  width: number = 32;
  height: number = 48;
  active: boolean = true;
  
  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }
  
  update(_dt: number): void {}
  render(_ctx: CanvasRenderingContext2D): void {}
}

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private entities: Entity[] = [];
  private backgroundEntity?: Entity;
  private lastTime: number = 0;
  private running: boolean = false;
  private hitStopTimer: number = 0;
  private screenShakeTimer: number = 0;
  private screenShakeDuration: number = 0;
  private screenShakeMagnitude: number = 0;
  cameraX: number = 0;
  
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

  requestHitStop(duration: number): void {
    this.hitStopTimer = Math.max(this.hitStopTimer, duration);
  }

  requestScreenShake(duration: number, magnitude: number): void {
    this.screenShakeTimer = Math.max(this.screenShakeTimer, duration);
    this.screenShakeDuration = Math.max(this.screenShakeDuration, duration);
    this.screenShakeMagnitude = Math.max(this.screenShakeMagnitude, magnitude);
  }
  
  private loop(currentTime: number): void {
    const dt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    
    this.update(dt);
    this.render();
    
    if (this.running) {
      requestAnimationFrame(this.loop.bind(this));
    }
  }
  
  private update(dt: number): void {
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
    for (const entity of this.entities) {
      if (entity.active) entity.render(this.ctx);
    }
    this.ctx.restore();
  }

  private getShakeOffset(): number {
    if (this.screenShakeTimer <= 0 || this.screenShakeDuration <= 0) return 0;
    const t = this.screenShakeTimer / this.screenShakeDuration;
    const direction = Math.random() < 0.5 ? -1 : 1;
    return direction * this.screenShakeMagnitude * t;
  }
}
