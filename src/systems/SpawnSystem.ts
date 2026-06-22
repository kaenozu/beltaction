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
import { MountingAttacker } from '../entities/MountingAttacker';
import { Strongman } from '../entities/Strongman';
import { Player } from '../entities/Player';
import { HitEffect } from '../effects/HitEffect';
import { DebugFlags } from './DebugFlags';
import { playHitHeavy, playKick } from './SoundManager';

import { rectsOverlap } from './HitboxConfig';

type EnemyActor = Enemy | ChainEnemy | MountingAttacker | Strongman;
type EnemySpawnKind = 'auto' | 'grunt' | 'chain' | 'mount' | 'strongman';

export class SpawnSystem extends Entity {
  private enemies: EnemyActor[] = [];
  private _spriteImage: HTMLImageElement | null = null;
  private _hurtImage: HTMLImageElement | null = null;
  private _heavyAttackImage: HTMLImageElement | null = null;
  private _bodyBlowImage: HTMLImageElement | null = null;
  private _downAttackImage: HTMLImageElement | null = null;
  private _chainSpriteImage: HTMLImageElement | null = null;
  private _chainHurtImage: HTMLImageElement | null = null;
  private _chainDeathImage: HTMLImageElement | null = null;
  private _chainProjectileImage: HTMLImageElement | null = null;
  private _mountSpriteImage: HTMLImageElement | null = null;
  private _mountHurtImage: HTMLImageElement | null = null;
  private _mountSweepImage: HTMLImageElement | null = null;
  private _mountAttackImage: HTMLImageElement | null = null;
  private _strongmanSpriteImage: HTMLImageElement | null = null;
  private _strongmanHurtImage: HTMLImageElement | null = null;
  private _strongmanHeavyAttackImage: HTMLImageElement | null = null;
  private _strongmanBodyBlowImage: HTMLImageElement | null = null;
  private playerAttackHits: Set<EnemyActor> = new Set();
  private effects: HitEffect[] = [];
  private readonly ENGAGE_OFFSETS = [54, -54, 104, -104, 18, -18, 148, -148];
  private readonly GRAB_FOLLOWUP_OFFSETS = [0, 26, -34, 52, -64, 78, -92];
  private readonly DOWNED_PRESSURE_OFFSETS = [64, -104, 134, -154, 38, -72, 178, -198];
  private readonly POST_GAME_PRESSURE_OFFSETS = [44, -44, 82, -82, 120, -120, 158, -158];
  private readonly GROUND_Y = CANVAS_HEIGHT - PLAYER_FRAME_HEIGHT;
  private _waveMode: boolean = false;
  get isWaveMode(): boolean { return this._waveMode; }
  private waveTimer: number = 0;
  private readonly WAVE_INTERVAL = 5;
  private readonly WAVE_COUNT = 4;
  private pendingWaveSpawns = 0;
  private waveSpawnDelay = 0;
  
  get spriteImage(): HTMLImageElement | null { return this._spriteImage; }
  set spriteImage(img: HTMLImageElement | null) {
    this._spriteImage = img;
    for (const enemy of this.enemies) {
      enemy.spriteImage = enemy instanceof ChainEnemy
        ? (this._chainSpriteImage ?? img)
        : enemy instanceof MountingAttacker
          ? (this._mountSpriteImage ?? img)
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

  get mountSpriteImage(): HTMLImageElement | null { return this._mountSpriteImage; }
  set mountSpriteImage(img: HTMLImageElement | null) {
    this._mountSpriteImage = img;
    for (const enemy of this.enemies) {
      if (enemy instanceof MountingAttacker) enemy.spriteImage = img ?? this._spriteImage;
    }
  }

  get mountHurtImage(): HTMLImageElement | null { return this._mountHurtImage; }
  set mountHurtImage(img: HTMLImageElement | null) {
    this._mountHurtImage = img;
    for (const enemy of this.enemies) {
      if (enemy instanceof MountingAttacker) enemy.hurtImage = img ?? this._hurtImage;
    }
  }

  get mountSweepImage(): HTMLImageElement | null { return this._mountSweepImage; }
  set mountSweepImage(img: HTMLImageElement | null) {
    this._mountSweepImage = img;
    for (const enemy of this.enemies) {
      if (enemy instanceof MountingAttacker) enemy.heavyAttackImage = img ?? this._heavyAttackImage;
    }
  }

  get mountAttackImage(): HTMLImageElement | null { return this._mountAttackImage; }
  set mountAttackImage(img: HTMLImageElement | null) {
    this._mountAttackImage = img;
    for (const enemy of this.enemies) {
      if (enemy instanceof MountingAttacker) enemy.bodyBlowImage = img ?? this._bodyBlowImage;
    }
  }

  get strongmanSpriteImage(): HTMLImageElement | null { return this._strongmanSpriteImage; }
  set strongmanSpriteImage(img: HTMLImageElement | null) {
    this._strongmanSpriteImage = img;
    for (const enemy of this.enemies) {
      if (enemy instanceof Strongman) enemy.spriteImage = img ?? this._mountSpriteImage ?? this._spriteImage;
    }
  }
  get strongmanHurtImage(): HTMLImageElement | null { return this._strongmanHurtImage; }
  set strongmanHurtImage(img: HTMLImageElement | null) {
    this._strongmanHurtImage = img;
    for (const enemy of this.enemies) {
      if (enemy instanceof Strongman) enemy.hurtImage = img ?? this._mountHurtImage ?? this._hurtImage;
    }
  }
  get strongmanHeavyAttackImage(): HTMLImageElement | null { return this._strongmanHeavyAttackImage; }
  set strongmanHeavyAttackImage(img: HTMLImageElement | null) {
    this._strongmanHeavyAttackImage = img;
    for (const enemy of this.enemies) {
      if (enemy instanceof Strongman) enemy.heavyAttackImage = img ?? this._strongmanHeavyAttackImage;
    }
  }
  get strongmanBodyBlowImage(): HTMLImageElement | null { return this._strongmanBodyBlowImage; }
  set strongmanBodyBlowImage(img: HTMLImageElement | null) {
    this._strongmanBodyBlowImage = img;
    for (const enemy of this.enemies) {
      if (enemy instanceof Strongman) enemy.bodyBlowImage = img ?? this._strongmanBodyBlowImage;
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

  get downAttackImage(): HTMLImageElement | null { return this._downAttackImage; }
  set downAttackImage(img: HTMLImageElement | null) {
    this._downAttackImage = img;
    for (const enemy of this.enemies) {
      if (enemy instanceof Enemy) enemy.downAttackImage = img;
    }
  }
  
  constructor(
    private getPlayer: () => Player,
    private onHitStop: (duration?: number, shakeDuration?: number, shakeMagnitude?: number) => void = () => {},
  ) {
    super(0, 0);
  }
  
  override update(dt: number): void {
    if (this._waveMode) {
      if (this.pendingWaveSpawns > 0) {
        this.waveSpawnDelay -= dt;
        if (this.waveSpawnDelay <= 0) {
          this.spawnWaveEnemy();
          this.pendingWaveSpawns--;
          this.waveSpawnDelay = 0.3;
        }
      }
      const alive = this.enemies.filter(e => e.active);
      this.waveTimer -= dt;
      if (this.waveTimer <= 0 && alive.length >= this.WAVE_COUNT) {
        this.waveTimer = this.WAVE_INTERVAL + Math.random() * 2;
        const idx = Math.floor(Math.random() * alive.length);
        alive[idx].active = false;
        this.spawnWaveEnemy();
      }
    }
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
        if (isKick) playKick(); else playHitHeavy();
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
  
  spawnEnemy(kind: EnemySpawnKind = 'auto', forceX?: number): void {
    const player = this.getPlayer();
    const spawnX = forceX ?? Math.min(player.x + player.width * 2 + Math.random() * 80, 2000 - 160);
    const resolvedKind = kind === 'auto'
      ? (this.enemies.length > 0 && this.enemies.length % 7 === 6 ? 'strongman' : this.enemies.length > 0 && this.enemies.length % 5 === 4 ? 'mount' : this.enemies.length > 0 && this.enemies.length % 4 === 3 ? 'chain' : 'grunt')
      : kind === 'strongman'
        ? 'strongman'
        : kind;
    const enemy: EnemyActor = resolvedKind === 'chain'
      ? new ChainEnemy(spawnX, this.GROUND_Y, this.getPlayer)
      : resolvedKind === 'mount'
        ? new MountingAttacker(spawnX, this.GROUND_Y, this.getPlayer)
        : resolvedKind === 'strongman'
          ? new Strongman(spawnX, this.GROUND_Y, this.getPlayer)
        : new Enemy(spawnX, this.GROUND_Y, this.getPlayer);
    enemy.spriteImage = enemy instanceof ChainEnemy
      ? (this.chainSpriteImage ?? this.spriteImage)
      : enemy instanceof MountingAttacker
        ? (this.mountSpriteImage ?? this.spriteImage)
        : enemy instanceof Strongman
          ? (this.strongmanSpriteImage ?? this.mountSpriteImage ?? this.spriteImage)
        : this.spriteImage;
    if (enemy instanceof ChainEnemy) {
      enemy.useFallbackDetails = this.chainSpriteImage === null;
      enemy.chainImage = this.chainProjectileImage;
      enemy.hurtImage = this.chainHurtImage;
      enemy.deathImage = this.chainDeathImage;
      enemy.heavyAttackImage = this.heavyAttackImage;
      enemy.bodyBlowImage = this.bodyBlowImage;
    } else if (enemy instanceof MountingAttacker) {
      enemy.hurtImage = this.mountHurtImage ?? this.hurtImage;
      enemy.heavyAttackImage = this.mountSweepImage ?? this.heavyAttackImage;
      enemy.bodyBlowImage = this.mountAttackImage ?? this.bodyBlowImage;
    } else {
      enemy.hurtImage = this.hurtImage;
      enemy.heavyAttackImage = this.heavyAttackImage;
      enemy.bodyBlowImage = this.bodyBlowImage;
      if (enemy instanceof Enemy) enemy.downAttackImage = this.downAttackImage;
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
  
  enableWaveMode(enabled: boolean): void {
    this._waveMode = enabled;
    this.restart();
    if (enabled) {
      this.waveTimer = this.WAVE_INTERVAL;
      this.pendingWaveSpawns = this.WAVE_COUNT;
      this.waveSpawnDelay = 0.3;
    }
  }

  private readonly WAVE_OFFSETS = [210, -210, 310, -310, 140, -140, 400, -400];

  private spawnWaveEnemy(): void {
    const player = this.getPlayer();
    const offset = this.WAVE_OFFSETS[this.enemies.length % this.WAVE_OFFSETS.length];
    const spawnX = Math.max(80, Math.min(player.x + offset, 2000 - 160));
    const kinds: EnemySpawnKind[] = ['grunt', 'chain', 'mount', 'strongman'];
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    this.spawnEnemy(kind, spawnX);
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
    for (const enemy of sorted) {
      if (enemy.active) enemy.renderOverlay(ctx);
    }
    for (const effect of this.effects) {
      if (effect.active && effect.overlay) effect.render(ctx);
    }
  }
}
