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
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
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
    if (this.backgroundEntity) this.backgroundEntity.update(dt);
    for (const entity of this.entities) {
      if (entity.active) entity.update(dt);
    }
  }
  
  private render(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.backgroundEntity) this.backgroundEntity.render(this.ctx);
    for (const entity of this.entities) {
      if (entity.active) entity.render(this.ctx);
    }
  }
}