import { Entity } from '../engine/Game';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { HitEffect } from '../effects/HitEffect';
import { HitboxRect } from './HitboxConfig';

function rectsOverlap(a: HitboxRect, b: HitboxRect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export class SpawnSystem extends Entity {
  private enemies: Enemy[] = [];
  private _spriteImage: HTMLImageElement | null = null;
  private _hurtImage: HTMLImageElement | null = null;
  private playerAttackHits: Set<Enemy> = new Set();
  private effects: HitEffect[] = [];
  private readonly ENGAGE_OFFSETS = [58, -58, 30, -30, 0, 45, -45];
  private readonly GROUND_Y = 480 - 192;
  
  get spriteImage(): HTMLImageElement | null { return this._spriteImage; }
  set spriteImage(img: HTMLImageElement | null) {
    this._spriteImage = img;
    for (const enemy of this.enemies) {
      enemy.spriteImage = img;
    }
  }

  get hurtImage(): HTMLImageElement | null { return this._hurtImage; }
  set hurtImage(img: HTMLImageElement | null) {
    this._hurtImage = img;
    for (const enemy of this.enemies) {
      enemy.hurtImage = img;
    }
  }
  
  constructor(private getPlayer: () => Player, private onHitStop: () => void = () => {}) {
    super(0, 0);
  }
  
  override update(dt: number): void {
    if (!this._spriteImage) return;
    this.assignEnemyTargets();
    for (const enemy of this.enemies) {
      if (enemy.active) enemy.update(dt);
    }
    this.enemies = this.enemies.filter(enemy => enemy.active);
    this.checkPlayerAttack();
    
    // Update effects
    for (const effect of this.effects) {
      if (effect.active) effect.update(dt);
    }
    this.effects = this.effects.filter(e => e.active);
  }
  
  private checkPlayerAttack(): void {
    const player = this.getPlayer();
    
    // Reset if player is not in attack state
    if (player.state !== 'attack') {
      this.playerAttackHits.clear();
      return;
    }
    
    const atk = player.getAttackHitbox();
    if (!atk) return;

    for (const enemy of this.enemies) {
      if (this.playerAttackHits.has(enemy)) continue;
      const hurt = enemy.getHurtHitbox();

      if (rectsOverlap(atk, hurt)) {
        const left = Math.max(atk.x, hurt.x);
        const right = Math.min(atk.x + atk.w, hurt.x + hurt.w);
        const top = Math.max(atk.y, hurt.y);
        const bottom = Math.min(atk.y + atk.h, hurt.y + hurt.h);
        enemy.takeDamage(20);
        this.playerAttackHits.add(enemy);
        if (!enemy.isDead) {
          this.spawnHitEffect((left + right) / 2, (top + bottom) / 2);
        }
        this.onHitStop();
      }
    }
  }

  private assignEnemyTargets(): void {
    const player = this.getPlayer();
    const activeEnemies = this.enemies.filter(enemy => enemy.active);

    activeEnemies
      .sort((a, b) => Math.abs(a.x - player.x) - Math.abs(b.x - player.x))
      .forEach((enemy, index) => {
        const fallbackStep = Math.floor(index / 2) + 1;
        const fallbackSide = index % 2 === 0 ? 1 : -1;
        const offset = this.ENGAGE_OFFSETS[index] ?? fallbackSide * (90 + fallbackStep * 55);
        enemy.setTargetX(player.x + offset);
      });
  }
  
  spawnEnemy(): void {
    const player = this.getPlayer();
    const spawnX = Math.min(player.x + player.width * 2 + Math.random() * 80, 2000 - 160);
    const enemy = new Enemy(spawnX, this.GROUND_Y, this.getPlayer);
    enemy.spriteImage = this.spriteImage;
    enemy.hurtImage = this.hurtImage;
    enemy.onHit = (x: number, y: number) => this.spawnHitEffect(x, y);
    enemy.onHitStop = this.onHitStop;
    enemy.onDeath = (x: number, y: number) => this.spawnHitEffect(x, y);
    this.enemies.push(enemy);
  }
  
  private spawnHitEffect(x: number, y: number): void {
    this.effects.push(new HitEffect(x, y));
  }
  
  getEnemies(): Enemy[] {
    return this.enemies.filter(enemy => enemy.active);
  }
  
  override render(ctx: CanvasRenderingContext2D): void {
    const enemiesToRender = [...this.enemies].sort((a, b) => a.y - b.y);
    for (const enemy of enemiesToRender) {
      if (enemy.active) enemy.render(ctx);
    }
    for (const effect of this.effects) {
      if (effect.active) effect.render(ctx);
    }
  }
}
