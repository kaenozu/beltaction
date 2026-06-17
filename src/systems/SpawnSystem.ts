import { Entity } from '../engine/Game';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { HitEffect } from '../effects/HitEffect';

function rectsOverlap(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export class SpawnSystem extends Entity {
  private enemy: Enemy | null = null;
  private _spriteImage: HTMLImageElement | null = null;
  private playerAttackHit: boolean = false;
  private effects: HitEffect[] = [];
  
  get spriteImage(): HTMLImageElement | null { return this._spriteImage; }
  set spriteImage(img: HTMLImageElement | null) {
    this._spriteImage = img;
    if (this.enemy) this.enemy.spriteImage = img;
  }
  
  constructor(private getPlayer: () => Player) {
    super(0, 0);
  }
  
  override update(dt: number): void {
    if (!this._spriteImage) return;
    if (!this.enemy || !this.enemy.active) {
      this.spawnEnemy();
    }
    if (this.enemy) this.enemy.update(dt);
    this.checkPlayerAttack();
    
    // Update effects
    for (const effect of this.effects) {
      if (effect.active) effect.update(dt);
    }
    this.effects = this.effects.filter(e => e.active);
  }
  
  private checkPlayerAttack(): void {
    const player = this.getPlayer();
    if (!this.enemy || !this.enemy.active) return;
    
    // Reset if player is not in attack state
    if (player.state !== 'attack') {
      this.playerAttackHit = false;
      return;
    }
    
    // Only hit on strike frame and once per attack
    if (this.playerAttackHit) return;
    
    const atk = player.getAttackHitbox();
    if (!atk) return;
    
    const bx = this.enemy.x;
    const by = this.enemy.y;
    const bw = this.enemy.width;
    const bh = this.enemy.height;
    
    if (rectsOverlap(atk.x, atk.y, atk.w, atk.h, bx, by, bw, bh)) {
      this.enemy.takeDamage(20);
      this.playerAttackHit = true;
      // Effect at center of overlap between attack box and enemy hitbox
      const left = Math.max(atk.x, bx);
      const right = Math.min(atk.x + atk.w, bx + bw);
      this.spawnHitEffect((left + right) / 2, by + bh / 2);
    }
  }
  
  private spawnEnemy(): void {
    const player = this.getPlayer();
    const spawnX = player.x + player.width * 2 + Math.random() * 80;
    const enemy = new Enemy(spawnX, 300, this.getPlayer);
    enemy.spriteImage = this.spriteImage;
    enemy.onHit = (x: number, y: number) => this.spawnHitEffect(x, y);
    this.enemy = enemy;
  }
  
  private spawnHitEffect(x: number, y: number): void {
    this.effects.push(new HitEffect(x, y));
  }
  
  getEnemies(): Enemy[] {
    return this.enemy ? [this.enemy] : [];
  }
  
  override render(ctx: CanvasRenderingContext2D): void {
    if (this.enemy && this.enemy.active) this.enemy.render(ctx);
    for (const effect of this.effects) {
      if (effect.active) effect.render(ctx);
    }
  }
}
