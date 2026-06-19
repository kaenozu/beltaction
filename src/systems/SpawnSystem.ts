import { Entity } from '../engine/Game';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { HitEffect } from '../effects/HitEffect';
import { rectsOverlap } from './HitboxConfig';

export class SpawnSystem extends Entity {
  private enemies: Enemy[] = [];
  private _spriteImage: HTMLImageElement | null = null;
  private _hurtImage: HTMLImageElement | null = null;
  private _heavyAttackImage: HTMLImageElement | null = null;
  private playerAttackHits: Set<Enemy> = new Set();
  private effects: HitEffect[] = [];
  private readonly ENGAGE_OFFSETS = [54, -54, 104, -104, 18, -18, 148, -148];
  private readonly DOWNED_PRESSURE_OFFSETS = [64, -104, 134, -154, 38, -72, 178, -198];
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

  get heavyAttackImage(): HTMLImageElement | null { return this._heavyAttackImage; }
  set heavyAttackImage(img: HTMLImageElement | null) {
    this._heavyAttackImage = img;
    for (const enemy of this.enemies) {
      enemy.heavyAttackImage = img;
    }
  }
  
  constructor(
    private getPlayer: () => Player,
    private onHitStop: (duration?: number, shakeDuration?: number, shakeMagnitude?: number) => void = () => {},
  ) {
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
    
    // Reset if player is not in an attack state
    if (player.state !== 'attack' && player.state !== 'kick') {
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
        enemy.takeDamage(player.getAttackDamage());
        this.playerAttackHits.add(enemy);
        if (!enemy.isDead) {
          this.spawnHitEffect((left + right) / 2, (top + bottom) / 2);
        }
        this.onHitStop(0.06);
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
        const offsets = player.isDowned ? this.DOWNED_PRESSURE_OFFSETS : this.ENGAGE_OFFSETS;
        const offset = offsets[index] ?? fallbackSide * (player.isDowned ? 150 + fallbackStep * 45 : 90 + fallbackStep * 55);
        enemy.setTargetX(player.x + offset);
      });
  }
  
  spawnEnemy(): void {
    const player = this.getPlayer();
    const spawnX = Math.min(player.x + player.width * 2 + Math.random() * 80, 2000 - 160);
    const enemy = new Enemy(spawnX, this.GROUND_Y, this.getPlayer);
    enemy.spriteImage = this.spriteImage;
    enemy.hurtImage = this.hurtImage;
    enemy.heavyAttackImage = this.heavyAttackImage;
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
