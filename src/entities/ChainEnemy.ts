/*
 * src/entities/ChainEnemy.ts
 * チェーン敵（中ボス的な位置づけ）のAI・状態管理・描画
 * 鎖攻撃・縛り引き寄せ・スイープなど特殊行動を持つ
 * 関連: Entity.ts, Player.ts（ターゲット）, SpawnSystem.ts（生成）
 */

import { Entity } from '../engine/Entity';
import { Player } from './Player';
import { DebugFlags } from '../systems/DebugFlags';
import { playRope, stopRope, playBind, stopBind } from '../systems/SoundManager';
import { CHAIN_HITBOX, HitboxConfig, HitboxRect, rectsOverlap, resolveFacingHitbox } from '../systems/HitboxConfig';
import { ChainEnemyRenderer } from './ChainEnemyRenderer';

type ChainEnemyState = 'idle' | 'walk' | 'chainShot' | 'boundPull' | 'chainBind' | 'lowSweep' | 'downDrag' | 'hurt' | 'death';

export class ChainEnemy extends Entity {
  public health: number = 38;
  public spriteImage: HTMLImageElement | null = null;
  public hurtImage: HTMLImageElement | null = null;
  public deathImage: HTMLImageElement | null = null;
  public heavyAttackImage: HTMLImageElement | null = null;
  public bodyBlowImage: HTMLImageElement | null = null;
  public chainImage: HTMLImageElement | null = null;
  public useFallbackDetails: boolean = false;
  public onHit: ((x: number, y: number, overlay?: boolean) => void) | null = null;
  public onHitStop: ((duration: number, shakeDuration?: number, shakeMagnitude?: number) => void) | null = null;
  public onDeath: ((x: number, y: number) => void) | null = null;

  public state: ChainEnemyState = 'walk';
  private stateTimer: number = 0;
  private deathAnimTimer: number = 0;
  private velocityX: number = 0;
  private attackCooldown: number = 1.0;
  private chainCooldown: number = 1.4;
  private attackHit: boolean = false;
  private targetX: number | null = null;
  public facing: number = -1;
  public currentFrame: number = 0;
  public animTimer: number = 0;
  private attackDuration: number = 0;
  public chainTargetX: number = 0;
  public chainTargetY: number = 0;
  public readonly frameWidth = 160;
  public readonly spriteFrameWidth = 220;
  public readonly hurtFrameWidth = 220;
  public readonly deathFrameWidth = 160;
  public readonly frameHeight = 192;
  private readonly MOVE_SPEED = 72;
  private readonly STOP_RANGE = 150;
  private readonly CHAIN_MIN_RANGE = 112;
  private readonly CHAIN_MAX_RANGE = 270;
  private readonly SWEEP_RANGE = 58;
  private readonly DOWN_DRAG_RANGE = 142;
  private readonly ATTACK_COOLDOWN = 1.35;
  private readonly CHAIN_COOLDOWN = 3.1;
  private readonly CHAIN_PULL_DURATION = 6.0;
  private readonly CHAIN_WRAP_DURATION = 3.6;
  private readonly CHAIN_GRAPPLE_RANGE = 34;
  private readonly CHAIN_PULL_SPEED = 72;
  private readonly CHAIN_DAMAGE = 3;
  private readonly CHAIN_HITBOX_THICKNESS = 18;
  private readonly SWEEP_DAMAGE = 8;
  private readonly DOWN_DRAG_DAMAGE = 6;
  private readonly ANIM_SPEED = 0.24;
  private readonly SWEEP_HITBOX: HitboxRect = { x: 72, y: 120, w: 82, h: 36 };
  private hitboxConfig: HitboxConfig = CHAIN_HITBOX;

  get isDead(): boolean { return this.state === 'death'; }
  get isBodyBlowGrappler(): boolean { return false; }
  get isGrapplingPlayer(): boolean { return this.state === 'boundPull' || this.state === 'chainBind'; }

  constructor(x: number, y: number, private player: () => Player) {
    super(x, y);
    this.width = this.frameWidth;
    this.height = this.frameHeight;
  }
  private chainRenderer = new ChainEnemyRenderer(this);
  private previousState: ChainEnemyState | null = null;

  override update(dt: number): void {
    const player = this.player();
    const dx = player.x - this.x;
    const dist = Math.abs(dx);
    const targetX = this.targetX ?? player.x;
    const dxToTarget = targetX - this.x;
    this.facing = dx > 0 ? 1 : -1;
    this.attackCooldown -= dt;
    this.chainCooldown -= dt;

    this.updateStateTimer(dt);

    if (this.state === 'hurt' || this.state === 'death') {
      if (this.state === 'death') {
        if (this.previousState === 'boundPull' || this.previousState === 'chainBind') {
          if (player.isBound) player.releaseBound();
          stopRope();
          stopBind();
          this.previousState = null;
        }
        this.deathAnimTimer += dt;
      }
      this.applyPhysics(dt);
      this.updateAnimation(dt);
      return;
    }

    if (this.state === 'boundPull') {
      if (!player.isBound) {
        this.cancelChainGrapple();
        this.applyPhysics(dt);
        this.updateAnimation(dt);
        return;
      }
      this.velocityX = 0;
      player.pullBoundToward(this.x + this.width / 2, dt);
      this.chainTargetX = player.x + player.width / 2;
      this.chainTargetY = player.y + player.height * 0.5;
      if (this.getBoundDistanceToPlayer(player) <= this.CHAIN_GRAPPLE_RANGE) {
        this.startChainBind(player);
      } else {
        this.stateTimer = Math.max(0, this.stateTimer - dt);
      }
      this.applyPhysics(dt);
      this.updateAnimation(dt);
      return;
    }

    if (this.state === 'chainBind') {
      if (!player.isBound) {
        this.cancelChainGrapple();
        this.applyPhysics(dt);
        this.updateAnimation(dt);
        return;
      }
      this.stateTimer = Math.max(0, this.stateTimer - dt);
      if (this.stateTimer <= 0) {
        player.releaseBound();
        this.cancelChainGrapple();
        this.applyPhysics(dt);
        this.updateAnimation(dt);
        return;
      }
      this.velocityX = 0;
      this.chainTargetX = player.x + player.width / 2;
      this.chainTargetY = player.y + player.height * 0.5;
      this.applyPhysics(dt);
      this.updateAnimation(dt);
      return;
    }

    if (this.state === 'chainShot' || this.state === 'lowSweep' || this.state === 'downDrag') {
      this.resolveAttack(player);
      this.applyPhysics(dt);
      this.updateAnimation(dt);
      return;
    }

    if (player.isGameOver && !DebugFlags.allowPostGameOverAttacks) {
      this.state = 'idle';
      this.velocityX = 0;
      this.applyPhysics(dt);
      this.updateAnimation(dt);
      return;
    }

    const canPostGame = DebugFlags.allowPostGameOverAttacks && player.canReceivePostGameHit;

    if ((player.canReceiveGroundHit || canPostGame) && dist < this.DOWN_DRAG_RANGE && this.attackCooldown <= 0) {
      this.startAttack('downDrag', 0.52, this.ATTACK_COOLDOWN);
    } else if ((player.canBeBound || canPostGame) && dist >= this.CHAIN_MIN_RANGE && dist <= this.CHAIN_MAX_RANGE && this.chainCooldown <= 0) {
      this.startAttack('chainShot', 0.62, this.CHAIN_COOLDOWN);
    } else if (!player.isDowned && !player.isGrabbed && !player.isBound && dist < this.SWEEP_RANGE && this.attackCooldown <= 0) {
      this.startAttack('lowSweep', 0.48, this.ATTACK_COOLDOWN);
    } else if (Math.abs(dxToTarget) > this.STOP_RANGE) {
      this.state = 'walk';
      this.velocityX = Math.sign(dxToTarget) * this.MOVE_SPEED;
    } else if (dist < this.CHAIN_MIN_RANGE) {
      this.state = 'walk';
      this.velocityX = -this.facing * this.MOVE_SPEED * 0.65;
    } else {
      this.state = 'idle';
      this.velocityX = 0;
    }

    this.applyPhysics(dt);
    this.updateAnimation(dt);
  }

  setTargetX(targetX: number): void {
    this.targetX = targetX;
  }

  takeDamage(amount: number, fromX?: number): boolean {
    this.health = Math.max(0, this.health - amount);
    const knockDir = fromX !== undefined ? (fromX > this.x ? 1 : -1) : this.facing;
    if (this.health <= 0) {
      this.previousState = this.state;
      this.state = 'death';
      this.stateTimer = 0.65;
      this.deathAnimTimer = 0;
      this.velocityX = knockDir * -120;
      this.attackHit = false;
      this.onDeath?.(this.x + this.width / 2, this.y + this.height / 3);
      return true;
    }
    this.state = 'hurt';
    this.stateTimer = 0.22;
    this.velocityX = knockDir * -88;
    return true;
  }

  getAttackHitbox(): HitboxRect | null {
    if (this.currentFrame !== 1) return null;
    if (this.state === 'chainShot') return this.getChainShotHitbox();
    if (this.state === 'lowSweep') return resolveFacingHitbox(this, this.SWEEP_HITBOX, this.facing);
    if (this.state === 'downDrag') return resolveFacingHitbox(this, { x: 52, y: 118, w: 112, h: 56 }, this.facing);
    return null;
  }

  getBodyHitbox(): HitboxRect {
    return resolveFacingHitbox(this, this.hitboxConfig.hitboxes.body, this.facing);
  }

  getHurtHitbox(): HitboxRect {
    return resolveFacingHitbox(this, this.hitboxConfig.hitboxes.hurt, this.facing);
  }

  override render(ctx: CanvasRenderingContext2D): void {
    this.chainRenderer.render(ctx);
  }

  private startAttack(state: 'chainShot' | 'lowSweep' | 'downDrag', duration: number, cooldown: number): void {
    this.state = state;
    this.stateTimer = duration;
    this.attackDuration = duration;
    this.attackCooldown = cooldown;
    if (state === 'chainShot') this.chainCooldown = cooldown;
    this.velocityX = 0;
    this.attackHit = false;
    this.animTimer = 0;
    this.currentFrame = 0;
    const player = this.player();
    this.chainTargetX = player.x + player.width / 2;
    this.chainTargetY = player.y + player.height * 0.5;
  }

  private updateStateTimer(dt: number): void {
    if (this.stateTimer <= 0) return;
    if (this.state === 'boundPull' || this.state === 'chainBind') return;
    this.stateTimer -= dt;
    if (this.stateTimer > 0) return;

    if (this.state === 'hurt' || this.state === 'chainShot' || this.state === 'lowSweep' || this.state === 'downDrag') {
      this.state = 'idle';
      this.velocityX = 0;
      return;
    }
    if (this.state === 'death') {
      this.active = false;
    }
  }

  private resolveAttack(player: Player): void {
    if (this.currentFrame !== 1 || this.attackHit) return;
    const atk = this.getAttackHitbox();
    const hurt = player.getHurtHitbox();
    if (!atk || !rectsOverlap(atk, hurt)) return;
    this.attackHit = true;

    if (this.state === 'chainShot') {
      const force = DebugFlags.allowPostGameOverAttacks && player.canReceivePostGameHit;
      if (player.startBound(this.x + this.width / 2, this.CHAIN_PULL_DURATION, this.CHAIN_PULL_SPEED, this.CHAIN_DAMAGE, force)) {
        this.state = 'boundPull';
        this.stateTimer = this.CHAIN_PULL_DURATION;
        playRope();
        this.onHit?.(player.x + player.width / 2, player.y + player.height * 0.5, true);
        this.onHitStop?.(0.05, 0.08, 1.5);
      }
      return;
    }

    if (player.canReceiveGroundHit || (DebugFlags.allowPostGameOverAttacks && player.canReceivePostGameHit)) {
      const reaction = this.state === 'downDrag' ? 'back' : 'body';
      player.downHit(this.x, DebugFlags.allowPostGameOverAttacks, this.DOWN_DRAG_DAMAGE, reaction);
    } else if (!player.isDefeated && !player.isWakeupInvincible) {
      const damage = this.state === 'lowSweep' ? this.SWEEP_DAMAGE : this.DOWN_DRAG_DAMAGE;
      if (this.state === 'lowSweep') {
        player.tripDown(this.x, damage);
      } else {
        player.takeDamage(damage, this.x, 'bodyBlow');
      }
    } else {
      return;
    }

    this.onHit?.(player.x + player.width / 2, player.y + player.height * 0.65);
    this.onHitStop?.(0.085, 0.14, 3);
  }

  private startChainBind(player: Player): void {
    if (!player.isBound) {
      this.cancelChainGrapple();
      return;
    }
    if (this.state === 'chainBind') return;
    stopRope();
    playBind();
    this.state = 'chainBind';
    this.stateTimer = this.CHAIN_WRAP_DURATION;
    player.boundReadyForFollowup = true;
    this.velocityX = 0;
    this.currentFrame = 1;
    this.animTimer = 0;
    this.chainTargetX = player.x + player.width / 2;
    this.chainTargetY = player.y + player.height * 0.5;
  }

  private cancelChainGrapple(): void {
    stopRope();
    stopBind();
    this.state = 'idle';
    this.stateTimer = 0;
    this.velocityX = 0;
    this.attackHit = false;
    this.attackCooldown = this.ATTACK_COOLDOWN;
    this.chainCooldown = Math.max(this.chainCooldown, this.CHAIN_COOLDOWN * 0.5);
  }

  private getBoundDistanceToPlayer(player: Player): number {
    return Math.abs((player.x + player.width / 2) - (this.x + this.width / 2));
  }

  private getChainShotHitbox(): HitboxRect {
    const base = this.getChainHitboxBase();
    const anchor = this.getChainAnchor();
    const startX = base.x;
    const startY = base.y;
    const endX = this.chainTargetX;
    const endY = this.chainTargetY;
    const visibleEndX = anchor.x + (endX - anchor.x) * this.getChainDrawProgress();
    const visibleEndY = anchor.y + (endY - anchor.y) * this.getChainDrawProgress();
    const halfThickness = this.CHAIN_HITBOX_THICKNESS / 2;
    return {
      x: Math.min(startX, visibleEndX) - halfThickness,
      y: Math.min(startY, visibleEndY) - halfThickness,
      w: Math.max(this.CHAIN_HITBOX_THICKNESS, Math.abs(visibleEndX - startX) + this.CHAIN_HITBOX_THICKNESS),
      h: Math.max(this.CHAIN_HITBOX_THICKNESS, Math.abs(visibleEndY - startY) + this.CHAIN_HITBOX_THICKNESS),
    };
  }

  private updateAnimation(dt: number): void {
    if (this.state === 'hurt') {
      this.currentFrame = 2;
      this.animTimer = 0;
      return;
    }
    if (this.state === 'death') {
      this.currentFrame = 0;
      this.animTimer = 0;
      return;
    }
    if (this.state === 'idle') {
      this.currentFrame = 0;
      this.animTimer = 0;
      return;
    }
    if (this.state === 'chainBind') {
      this.currentFrame = 1;
      this.animTimer = 0;
      return;
    }
    this.animTimer += dt;
    if (this.animTimer >= this.ANIM_SPEED) {
      this.animTimer = 0;
      this.currentFrame = (this.currentFrame + 1) % 2;
    }
  }

  public getFrameIndex(): number {
    if (this.state === 'idle') return 0;
    if (this.state === 'walk') return 1 + this.currentFrame;
    if (this.state === 'hurt') return this.currentFrame;
    return 3 + this.currentFrame;
  }

  private applyPhysics(dt: number): void {
    this.x += this.velocityX * dt;
    this.x = Math.max(0, Math.min(this.x, 2000 - this.width));
  }

  public getChainAnchor(): { x: number; y: number } {
    if (this.state === 'chainShot' || this.state === 'boundPull' || this.state === 'chainBind') {
      const windup = this.state === 'chainShot' && this.currentFrame === 0;
      return { x: this.x + this.width / 2 + this.facing * 10, y: this.y + (windup ? 52 : 76) };
    }
    if (this.state === 'downDrag') {
      return { x: this.x + this.width / 2 + this.facing * 54, y: this.y + 128 };
    }
    return { x: this.x + this.width / 2 + this.facing * 66, y: this.y + 86 };
  }

  public getChainHitboxBase(): { x: number; y: number } {
    if (this.state === 'chainShot') {
      return { x: this.x + this.width / 2 + this.facing * 10, y: this.y + 76 };
    }
    return this.getChainAnchor();
  }

  public getChainDrawProgress(): number {
    if (this.state === 'boundPull' || this.state === 'chainBind') return 1;
    if (this.state === 'downDrag') return this.easeOut(Math.min(1, this.getAttackElapsedRatio() / 0.55));
    if (this.state !== 'chainShot') return 0;
    if (this.currentFrame === 0) return 0;
    return this.easeOut(Math.min(1, this.animTimer / (this.ANIM_SPEED * 0.65)));
  }

  public getAttackElapsedRatio(): number {
    if (this.attackDuration <= 0) return 1;
    return Math.max(0, Math.min(1, 1 - this.stateTimer / this.attackDuration));
  }

  public easeOut(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

}
