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
  private readonly ATTACK_RANGE = 60;
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
    if (player.currentFrame !== 1) return;
    
    // Attack hitbox: in front of player
    const ax = player.facing > 0 ? player.x + player.width : player.x - this.ATTACK_RANGE;
    const ay = player.y;
    const aw = this.ATTACK_RANGE;
    const ah = player.height;
    
    const bx = this.enemy.x;
    const by = this.enemy.y;
    const bw = this.enemy.width;
    const bh = this.enemy.height;
    
    if (rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh)) {
      this.enemy.takeDamage(20);
      this.playerAttackHit = true;
      // Effect at midpoint between attack box origin and contact edge
      const contactX = Math.max(ax, bx);
      this.spawnHitEffect((ax + contactX) / 2, by + bh / 2);
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
