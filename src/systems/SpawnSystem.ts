/*
 * src/systems/SpawnSystem.ts
 * 敵の生成・ターゲット割り当て・プレイヤー攻撃判定・エフェクト管理
 * Entityを継承しているがシステムとして動作（敵を管理し、自らは描画されない）
 * 関連: Enemy.ts, ChainEnemy.ts, HitEffect.ts
 */

import { CANVAS_HEIGHT, PLAYER_FRAME_HEIGHT } from '../engine/Constants';
import { Entity } from '../engine/Entity';
import { ChainEnemy } from '../entities/ChainEnemy';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { HitEffect } from '../effects/HitEffect';
import { DebugFlags } from './DebugFlags';
import { rectsOverlap } from './HitboxConfig';

type EnemyActor = Enemy | ChainEnemy;
type EnemySpawnKind = 'auto' | 'grunt' | 'chain';

export class SpawnSystem extends Entity {
  private enemies: EnemyActor[] = [];
  private _spriteImage: HTMLImageElement | null = null;
  private _hurtImage: HTMLImageElement | null = null;
  private _heavyAttackImage: HTMLImageElement | null = null;
  private _bodyBlowImage: HTMLImageElement | null = null;
  private _chainSpriteImage: HTMLImageElement | null = null;
  private _chainHurtImage: HTMLImageElement | null = null;
  private _chainDeathImage: HTMLImageElement | null = null;
  private _chainProjectileImage: HTMLImageElement | null = null;
  private playerAttackHits: Set<EnemyActor> = new Set();
  private effects: HitEffect[] = [];
  private readonly ENGAGE_OFFSETS = [54, -54, 104, -104, 18, -18, 148, -148];
  private readonly GRAB_FOLLOWUP_OFFSETS = [0, 26, -34, 52, -64, 78, -92];
  private readonly DOWNED_PRESSURE_OFFSETS = [64, -104, 134, -154, 38, -72, 178, -198];
  private readonly POST_GAME_PRESSURE_OFFSETS = [44, -44, 82, -82, 120, -120, 158, -158];
  private readonly GROUND_Y = CANVAS_HEIGHT - PLAYER_FRAME_HEIGHT;
  
  get spriteImage(): HTMLImageElement | null { return this._spriteImage; }
  set spriteImage(img: HTMLImageElement | null) {
    this._spriteImage = img;
    for (const enemy of this.enemies) {
      enemy.spriteImage = enemy instanceof ChainEnemy
        ? (this._chainSpriteImage ?? img)
        : img;
      if (enemy instanceof ChainEnemy) {
        enemy.useFallbackDetails = this._chainSpriteImage === null;
      }
    }
  }

  get chainSpriteImage(): HTMLImageElement | null { return this._chainSpriteImage; }
  set chainSpriteImage(img: HTMLImageElement | null) {
    this._chainSpriteImage = img;
    for (const enemy of this.enemies) {
      if (enemy instanceof ChainEnemy) {
        enemy.spriteImage = img ?? this._spriteImage;
        enemy.useFallbackDetails = img === null;
      }
    }
  }

  get chainHurtImage(): HTMLImageElement | null { return this._chainHurtImage; }
  set chainHurtImage(img: HTMLImageElement | null) {
    this._chainHurtImage = img;
    for (const enemy of this.enemies) {
      if (enemy instanceof ChainEnemy) enemy.hurtImage = img;
    }
  }

  get chainDeathImage(): HTMLImageElement | null { return this._chainDeathImage; }
  set chainDeathImage(img: HTMLImageElement | null) {
    this._chainDeathImage = img;
    for (const enemy of this.enemies) {
      if (enemy instanceof ChainEnemy) enemy.deathImage = img;
    }
  }

  get chainProjectileImage(): HTMLImageElement | null { return this._chainProjectileImage; }
  set chainProjectileImage(img: HTMLImageElement | null) {
    this._chainProjectileImage = img;
    for (const enemy of this.enemies) {
      if (enemy instanceof ChainEnemy) enemy.chainImage = img;
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

  get bodyBlowImage(): HTMLImageElement | null { return this._bodyBlowImage; }
  set bodyBlowImage(img: HTMLImageElement | null) {
    this._bodyBlowImage = img;
    for (const enemy of this.enemies) {
      enemy.bodyBlowImage = img;
    }
  }
  
  constructor(
    private getPlayer: () => Player,
    private onHitStop: (duration?: number, shakeDuration?: number, shakeMagnitude?: number) => void = () => {},
  ) {
    super(0, 0);
  }
  
  override update(dt: number): void {
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
    
    if (player.state !== 'attack' && player.state !== 'kick') {
      this.playerAttackHits.clear();
      return;
    }
    
    const atk = player.getAttackHitbox();
    if (!atk) return;

    const isKick = player.currentAttackKind === 'kick';
    const hitStopDuration = isKick ? 0.085 : 0.055;
    const shakeDuration = isKick ? 0.12 : 0;
    const shakeMagnitude = isKick ? 2.5 : 0;

    for (const enemy of this.enemies) {
      if (this.playerAttackHits.has(enemy)) continue;
      const hurt = enemy.getHurtHitbox();

      if (rectsOverlap(atk, hurt)) {
        const left = Math.max(atk.x, hurt.x);
        const right = Math.min(atk.x + atk.w, hurt.x + hurt.w);
        const top = Math.max(atk.y, hurt.y);
        const bottom = Math.min(atk.y + atk.h, hurt.y + hurt.h);
        enemy.takeDamage(player.getAttackDamage(), player.x);
        this.playerAttackHits.add(enemy);
        if (!enemy.isDead) {
          this.spawnHitEffect((left + right) / 2, (top + bottom) / 2);
        }
        this.onHitStop(hitStopDuration, shakeDuration, shakeMagnitude);
      }
    }
  }

  private assignEnemyTargets(): void {
    const player = this.getPlayer();
    const activeEnemies = this.enemies.filter(enemy => enemy.active);
    let grabFollowupIndex = 0;

    activeEnemies
      .sort((a, b) => Math.abs(a.x - player.x) - Math.abs(b.x - player.x))
      .forEach((enemy, index) => {
        const isRestrainedForFollowup = player.isGrabbed || player.isChainWrapped;
        if (isRestrainedForFollowup && enemy.isGrapplingPlayer) {
          enemy.setTargetX(enemy.x);
          return;
        }

        const fallbackStep = Math.floor(index / 2) + 1;
        const fallbackSide = index % 2 === 0 ? 1 : -1;
        const postGamePressure = player.isGameOver && DebugFlags.allowPostGameOverAttacks;
        if (isRestrainedForFollowup) {
          const offset = this.GRAB_FOLLOWUP_OFFSETS[grabFollowupIndex]
            ?? grabFollowupIndex * 24;
          grabFollowupIndex++;
          enemy.setTargetX(player.grabFollowupX + offset);
          return;
        }

        const offsets = postGamePressure
          ? this.POST_GAME_PRESSURE_OFFSETS
          : player.isDowned ? this.DOWNED_PRESSURE_OFFSETS : this.ENGAGE_OFFSETS;
        const fallbackBase = postGamePressure ? 90 : player.isDowned ? 150 : 90;
        const fallbackSpread = postGamePressure ? 36 : player.isDowned ? 45 : 55;
        const offset = offsets[index] ?? fallbackSide * (fallbackBase + fallbackStep * fallbackSpread);
        enemy.setTargetX(player.x + offset);
      });
  }
  
  spawnEnemy(kind: EnemySpawnKind = 'auto'): void {
    const player = this.getPlayer();
    const spawnX = Math.min(player.x + player.width * 2 + Math.random() * 80, 2000 - 160);
    const resolvedKind = kind === 'auto'
      ? (this.enemies.length > 0 && this.enemies.length % 4 === 3 ? 'chain' : 'grunt')
      : kind;
    const enemy: EnemyActor = resolvedKind === 'chain'
      ? new ChainEnemy(spawnX, this.GROUND_Y, this.getPlayer)
      : new Enemy(spawnX, this.GROUND_Y, this.getPlayer);
    enemy.spriteImage = enemy instanceof ChainEnemy
      ? (this.chainSpriteImage ?? this.spriteImage)
      : this.spriteImage;
    if (enemy instanceof ChainEnemy) {
      enemy.useFallbackDetails = this.chainSpriteImage === null;
      enemy.chainImage = this.chainProjectileImage;
      enemy.hurtImage = this.chainHurtImage;
      enemy.deathImage = this.chainDeathImage;
      enemy.heavyAttackImage = this.heavyAttackImage;
      enemy.bodyBlowImage = this.bodyBlowImage;
    } else {
      enemy.hurtImage = this.hurtImage;
      enemy.heavyAttackImage = this.heavyAttackImage;
      enemy.bodyBlowImage = this.bodyBlowImage;
    }
    enemy.onHit = (x: number, y: number, overlay: boolean = false) => this.spawnHitEffect(x, y, overlay);
    enemy.onHitStop = this.onHitStop;
    enemy.onDeath = (x: number, y: number) => this.spawnHitEffect(x, y);
    this.enemies.push(enemy);
  }

  spawnChainEnemy(): void {
    this.spawnEnemy('chain');
  }
  
  private spawnHitEffect(x: number, y: number, overlay: boolean = false): void {
    this.effects.push(new HitEffect(x, y, overlay));
  }
  
  restart(): void {
    this.enemies = [];
    this.playerAttackHits.clear();
    this.effects = [];
  }

  getEnemies(): EnemyActor[] {
    return this.enemies.filter(enemy => enemy.active);
  }
  
  private getSortedEnemies(): EnemyActor[] {
    return [...this.enemies].sort((a, b) => a.y - b.y);
  }

  override render(ctx: CanvasRenderingContext2D): void {
    const sorted = this.getSortedEnemies();
    for (const enemy of sorted) {
      if (enemy.active && !enemy.isBodyBlowGrappler) enemy.render(ctx);
    }
    for (const effect of this.effects) {
      if (effect.active && !effect.overlay) effect.render(ctx);
    }
  }

  override renderOverlay(ctx: CanvasRenderingContext2D): void {
    const sorted = this.getSortedEnemies();
    for (const enemy of sorted) {
      if (enemy.active && enemy.isBodyBlowGrappler) enemy.render(ctx);
    }
    for (const effect of this.effects) {
      if (effect.active && effect.overlay) effect.render(ctx);
    }
  }
}
