import { Entity } from '../engine/Game';
import { Enemy } from '../entities/Enemy';

export class SpawnSystem extends Entity {
  private enemies: Enemy[] = [];
  private spawnTimer: number = 0;
  private readonly SPAWN_INTERVAL = 2;
  
  constructor(private playerX: () => number) {
    super(0, 0);
  }
  
  override update(dt: number): void {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnEnemy();
      this.spawnTimer = this.SPAWN_INTERVAL;
    }
  }
  
  private spawnEnemy(): void {
    const spawnX = this.playerX() + 640 + Math.random() * 200;
    const enemy = new Enemy(spawnX, 300, this.playerX);
    this.enemies.push(enemy);
  }
  
  getEnemies(): Enemy[] {
    return this.enemies;
  }
  
  override render(_ctx: CanvasRenderingContext2D): void {}
}