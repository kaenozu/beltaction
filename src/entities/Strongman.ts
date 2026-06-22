/*
 * src/entities/Strongman.ts
 * 逆エビ固め専用の怪力系敵
 * 関連: Player.ts, SpawnSystem.ts, StrongmanRenderer.ts
 */

import { Entity } from '../engine/Entity';

import { GRUNT_HITBOX, HitboxRect, rectsOverlap, resolveFacingHitbox } from '../systems/HitboxConfig';
import { playGrab, playHeavyImpact, playSwish } from '../systems/SoundManager';
import { Player } from './Player';
import { StrongmanRenderer } from './StrongmanRenderer';

type StrongmanState = 'idle' | 'walk' | 'setup' | 'reverseCrab' | 'hurt' | 'death';

export class Strongman extends Entity {
  public health: number = 42;
  public damage: number = 6;
  public state: StrongmanState = 'walk';
  public facing: number = -1;
  public currentFrame: number = 0;
  public readonly frameWidth = 160;
  public readonly frameHeight = 192;
  public spriteImage: HTMLImageElement | null = null;
  public hurtImage: HTMLImageElement | null = null;
  public heavyAttackImage: HTMLImageElement | null = null;
  public bodyBlowImage: HTMLImageElement | null = null;
  public onHit: ((x: number, y: number, overlay?: boolean) => void) | null = null;
  public onHitStop: ((duration: number, shakeDuration?: number, shakeMagnitude?: number) => void) | null = null;
  public onDeath: ((x: number, y: number) => void) | null = null;

  private velocityX = 0;
  private stateTimer = 0;
  private attackCooldown = 0.7;
  private attackHit = false;
  private animTimer = 0;
  private targetX: number | null = null;
  private reverseCrabTickTimer = 0;
  private readonly MOVE_SPEED = 88;
  private readonly SETUP_RANGE = 92;
  private readonly REVERSE_DURATION = 3.4;
  private readonly REVERSE_TICK = 0.42;
  private readonly REVERSE_DAMAGE = 4;
  private readonly SETUP_COOLDOWN = 2.1;
  private readonly ANIM_SPEED = 0.18;
  private readonly HOLD_HITBOX: HitboxRect = { x: 66, y: 88, w: 82, h: 46 };
  private readonly renderer = new StrongmanRenderer(this);

  constructor(x: number, y: number, private player: () => Player) {
    super(x, y);
    this.width = this.frameWidth;
    this.height = this.frameHeight;
  }

  get isDead(): boolean { return this.state === 'death'; }
  get isGrapplingPlayer(): boolean { return this.state === 'reverseCrab'; }
  get isBodyBlowGrappler(): boolean { return false; }

  setTargetX(targetX: number): void { this.targetX = targetX; }

  override update(dt: number): void {
    const player = this.player();
    const dx = player.x - this.x;
    this.facing = dx > 0 ? 1 : -1;
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);

    if (this.state === 'hurt' || this.state === 'death') {
      this.applyPhysics(dt);
      this.updateAnimation(dt);
      return;
    }

    if (this.state === 'reverseCrab') {
      this.updateReverseCrab(player, dt);
      this.applyPhysics(dt);
      this.updateAnimation(dt);
      return;
    }

    if (this.stateTimer > 0) {
      this.stateTimer = Math.max(0, this.stateTimer - dt);
      if (this.stateTimer <= 0) {
        this.state = 'walk';
        this.velocityX = 0;
      }
    }

    const targetX = this.targetX ?? player.x;
    const dist = Math.abs(player.x - this.x);
    const canGrab = player.isDowned && !player.canReceiveGroundHit && !player.isReverseCrabbed;

    if (canGrab && dist <= this.SETUP_RANGE && this.attackCooldown <= 0) {
      this.startReverseCrab(player);
      this.applyPhysics(dt);
      this.updateAnimation(dt);
      return;
    }

    if (this.state === 'setup' && this.tryReverseCrabHit(player)) {
      this.applyPhysics(dt);
      this.updateAnimation(dt);
      return;
    }

    const moveTarget = targetX - this.x;
    this.state = Math.abs(moveTarget) < 10 ? 'idle' : 'walk';
    this.velocityX = Math.sign(moveTarget) * this.MOVE_SPEED;
    this.applyPhysics(dt);
    this.updateAnimation(dt);
  }

  takeDamage(amount: number, fromX?: number): boolean {
    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) {
      this.state = 'death';
      this.velocityX = fromX !== undefined && fromX > this.x ? -120 : 120;
      this.onDeath?.(this.x + this.width / 2, this.y + this.height / 3);
      return true;
    }
    this.state = 'hurt';
    this.velocityX = fromX !== undefined && fromX > this.x ? -80 : 80;
    return true;
  }

  getAttackHitbox(): HitboxRect | null {
    if (this.state === 'setup' && this.currentFrame === 1) return resolveFacingHitbox(this, this.HOLD_HITBOX, this.facing);
    if (this.state === 'reverseCrab' && this.currentFrame === 1) return resolveFacingHitbox(this, this.HOLD_HITBOX, this.facing);
    return null;
  }

  getBodyHitbox(): HitboxRect { return resolveFacingHitbox(this, GRUNT_HITBOX.hitboxes.body, this.facing); }
  getHurtHitbox(): HitboxRect { return resolveFacingHitbox(this, GRUNT_HITBOX.hitboxes.hurt, this.facing); }
  override render(ctx: CanvasRenderingContext2D): void { this.renderer.render(ctx); }

  private startReverseCrab(player: Player): void {
    playGrab();
    player.startReverseCrab(this.x);
    this.state = 'reverseCrab';
    this.stateTimer = this.REVERSE_DURATION;
    this.reverseCrabTickTimer = 0;
    this.attackCooldown = this.SETUP_COOLDOWN;
    this.attackHit = false;
    this.velocityX = 0;
    this.targetX = player.x;
  }

  private tryReverseCrabHit(player: Player): boolean {
    if (this.state !== 'setup' || this.currentFrame !== 1 || this.attackHit) return false;
    this.attackHit = true;
    const atk = this.getAttackHitbox();
    if (!atk || !rectsOverlap(atk, player.getHurtHitbox())) return false;
    playSwish();
    player.startReverseCrab(this.x);
    this.state = 'reverseCrab';
    this.stateTimer = this.REVERSE_DURATION;
    this.reverseCrabTickTimer = 0;
    this.onHitStop?.(0.06, 0.08, 1.5);
    return true;
  }

  private updateReverseCrab(player: Player, dt: number): void {
    if (!player.isReverseCrabbed) {
      this.state = 'idle';
      this.velocityX = 0;
      return;
    }
    this.x = player.x - this.facing * 30;
    this.velocityX = 0;
    this.reverseCrabTickTimer -= dt;
    if (this.reverseCrabTickTimer <= 0) {
      this.reverseCrabTickTimer = this.REVERSE_TICK;
      playHeavyImpact();
      player.downHit(this.x, false, this.REVERSE_DAMAGE, 'body');
      this.onHit?.(player.x + player.width / 2, player.y + player.height / 2, true);
      this.onHitStop?.(0.055, 0.06, 1.5);
    }
  }

  private applyPhysics(dt: number): void {
    this.x += this.velocityX * dt;
  }

  private updateAnimation(dt: number): void {
    if (this.state === 'hurt' || this.state === 'death') {
      this.currentFrame = 0;
      this.animTimer = 0;
      return;
    }
    if (this.state === 'walk' || this.state === 'setup' || this.state === 'reverseCrab') {
      this.animTimer += dt;
      if (this.animTimer >= this.ANIM_SPEED) {
        this.animTimer = 0;
        this.currentFrame = (this.currentFrame + 1) % 2;
      }
      return;
    }
    this.currentFrame = 0;
    this.animTimer = 0;
  }
}
