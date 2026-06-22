/*
 * src/entities/MountingAttacker.ts
 * ダウン中のプレイヤーへマウントして3連打する敵AI
 * 関連: Player.ts, SpawnSystem.ts, MountingAttackerRenderer.ts, PlayerTypes.ts
 */

import { Entity } from '../engine/Entity';
import { DebugFlags } from '../systems/DebugFlags';
import { GRUNT_HITBOX, HitboxRect, rectsOverlap, resolveFacingHitbox } from '../systems/HitboxConfig';
import { playHeavyImpact, playSwish } from '../systems/SoundManager';
import { Player } from './Player';
import { MountingAttackerRenderer } from './MountingAttackerRenderer';

type MountingAttackerState = 'idle' | 'walk' | 'sweep' | 'mount' | 'recover' | 'hurt' | 'death';

export class MountingAttacker extends Entity {
  public health: number = 26;
  public damage: number = 4;
  public state: MountingAttackerState = 'walk';
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

  private velocityX: number = 0;
  private stateTimer: number = 0;
  private attackCooldown: number = 0.6;
  private attackHit: boolean = false;
  private animTimer: number = 0;
  private targetX: number | null = null;
  private mountPunchesRemaining: number = 0;
  private mountWindupTimer: number = 0;
  private mountStrikeTimer: number = 0;
  private readonly MOVE_SPEED = 92;
  private readonly RETREAT_SPEED = 118;
  private readonly PREFERRED_RANGE = 132;
  private readonly SWEEP_RANGE = 76;
  private readonly MOUNT_RANGE = 104;
  private readonly SWEEP_COOLDOWN = 1.25;
  private readonly MOUNT_COOLDOWN = 2.4;
  private readonly SWEEP_DAMAGE = 3;
  private readonly MOUNT_PUNCH_DAMAGE = 4;
  private readonly MOUNT_PUNCH_WINDUP = 0.5;
  private readonly MOUNT_STRIKE_HOLD = 0.32;
  private readonly MOUNT_DURATION = 3.2;
  private readonly ANIM_SPEED = 0.18;
  private readonly SWEEP_HITBOX: HitboxRect = { x: 70, y: 128, w: 78, h: 42 };
  private readonly MOUNT_HITBOX: HitboxRect = { x: 14, y: 20, w: 50, h: 50 };
  private readonly renderer = new MountingAttackerRenderer(this);

  constructor(x: number, y: number, private player: () => Player) {
    super(x, y);
    this.width = this.frameWidth;
    this.height = this.frameHeight;
  }

  get isDead(): boolean { return this.state === 'death'; }
  get isHoldingPlayer(): boolean { return this.state === 'mount'; }
  get isBodyBlowGrappler(): boolean { return false; }
  get isGrapplingPlayer(): boolean { return this.isHoldingPlayer; }

  override update(dt: number): void {
    const player = this.player();
    const dx = player.x - this.x;
    this.facing = dx > 0 ? 1 : -1;
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);

    this.handleTimedState(dt);
    if (this.state === 'hurt' || this.state === 'death') {
      this.applyPhysics(dt);
      this.updateAnimation(dt);
      return;
    }

    if (this.state === 'mount') {
      this.updateMount(player, dt);
      this.applyPhysics(dt);
      this.updateAnimation(dt);
      return;
    }

    if (this.state === 'sweep') {
      this.updateSweep(player);
      this.applyPhysics(dt);
      this.updateAnimation(dt);
      return;
    }

    if (this.tryStartMount(player)) {
      this.applyPhysics(dt);
      this.updateAnimation(dt);
      return;
    }

    if (this.prepareDownedMount(player, dx)) {
      this.applyPhysics(dt);
      this.updateAnimation(dt);
      return;
    }

    if (this.tryStartSweep(player, Math.abs(dx))) {
      this.applyPhysics(dt);
      this.updateAnimation(dt);
      return;
    }

    if (this.pressSweepOpening(player, dx)) {
      this.applyPhysics(dt);
      this.updateAnimation(dt);
      return;
    }

    this.kitePlayer(player, dx);
    this.applyPhysics(dt);
    this.updateAnimation(dt);
  }

  setTargetX(targetX: number): void {
    this.targetX = targetX;
  }

  takeDamage(amount: number, fromX?: number): boolean {
    this.health = Math.max(0, this.health - amount);
    const knockDir = fromX !== undefined ? (fromX > this.x ? 1 : -1) : this.facing;
    this.cancelMountIfNeeded();
    if (this.health <= 0) {
      this.state = 'death';
      this.stateTimer = 0.5;
      this.velocityX = knockDir * -120;
      this.onDeath?.(this.x + this.width / 2, this.y + this.height / 3);
      return true;
    }
    this.state = 'hurt';
    this.stateTimer = 0.2;
    this.velocityX = knockDir * -80;
    return true;
  }

  getAttackHitbox(): HitboxRect | null {
    if (this.state === 'sweep' && this.currentFrame === 1) {
      return resolveFacingHitbox(this, this.SWEEP_HITBOX, this.facing);
    }
    if (this.state === 'mount' && this.currentFrame === 1) {
      return resolveFacingHitbox(this, this.MOUNT_HITBOX, this.facing);
    }
    return null;
  }

  getBodyHitbox(): HitboxRect {
    return resolveFacingHitbox(this, GRUNT_HITBOX.hitboxes.body, this.facing);
  }

  getHurtHitbox(): HitboxRect {
    return resolveFacingHitbox(this, GRUNT_HITBOX.hitboxes.hurt, this.facing);
  }

  override render(ctx: CanvasRenderingContext2D): void {
    this.renderer.render(ctx);
  }

  override renderOverlay(ctx: CanvasRenderingContext2D): void {
    this.renderer.renderOverlay(ctx);
  }

  private handleTimedState(dt: number): void {
    if (this.stateTimer <= 0) return;
    this.stateTimer -= dt;
    if (this.stateTimer > 0) return;
    if (this.state === 'death') {
      this.active = false;
      return;
    }
    if (this.state === 'mount') {
      this.finishMount();
      return;
    }
    if (this.state === 'hurt' || this.state === 'sweep' || this.state === 'recover') {
      this.state = 'idle';
      this.velocityX = 0;
    }
  }

  private tryStartSweep(player: Player, dist: number): boolean {
    if (this.attackCooldown > 0 || dist > this.SWEEP_RANGE) return false;
    if (player.isDowned || player.isGrabbed || player.isBound || player.isDefeated) return false;
    this.state = 'sweep';
    this.stateTimer = 0.46;
    this.velocityX = 0;
    this.attackHit = false;
    this.currentFrame = 0;
    this.animTimer = 0;
    this.attackCooldown = this.SWEEP_COOLDOWN;
    return true;
  }

  private pressSweepOpening(player: Player, dx: number): boolean {
    if (this.attackCooldown > 0) return false;
    if (player.isDowned || player.isGrabbed || player.isBound || player.isDefeated) return false;
    const dist = Math.abs(dx);
    if (dist <= this.SWEEP_RANGE || dist > this.PREFERRED_RANGE * 1.45) return false;
    this.state = 'walk';
    this.velocityX = Math.sign(dx) * this.MOVE_SPEED * 1.15;
    return true;
  }

  private updateSweep(player: Player): void {
    if (this.currentFrame !== 1 || this.attackHit) return;
    this.attackHit = true;
    const atk = this.getAttackHitbox();
    if (!atk || !rectsOverlap(atk, player.getHurtHitbox())) return;
    playSwish();
    player.tripDown(this.x, this.SWEEP_DAMAGE);
    this.onHit?.(atk.x + atk.w / 2, atk.y + atk.h / 2);
    this.onHitStop?.(0.075, 0.12, 2.5);
  }

  private tryStartMount(player: Player): boolean {
    const dist = Math.abs(player.x - this.x);
    if (this.attackCooldown > 0 || dist > this.MOUNT_RANGE) return false;
    if (player.isMounted) return false;
    const forcePostGame = DebugFlags.allowPostGameOverAttacks && player.canReceivePostGameHit;
    if (!player.canReceiveGroundHit && !forcePostGame) return false;
    this.state = 'mount';
    this.stateTimer = this.MOUNT_DURATION;
    this.mountPunchesRemaining = 3;
    this.mountWindupTimer = this.MOUNT_PUNCH_WINDUP;
    this.mountStrikeTimer = 0;
    this.velocityX = 0;
    this.attackHit = false;
    this.currentFrame = 0;
    this.animTimer = 0;
    this.attackCooldown = this.MOUNT_COOLDOWN;
    this.zIndex = -2;
    this.snapToMountPosition(player);
    player.setMounted(true);
    return true;
  }

  private prepareDownedMount(player: Player, dx: number): boolean {
    const forcePostGame = DebugFlags.allowPostGameOverAttacks && player.canReceivePostGameHit;
    if (!player.canReceiveGroundHit && !forcePostGame) return false;
    const dist = Math.abs(dx);
    this.state = dist > this.MOUNT_RANGE ? 'walk' : 'idle';
    this.velocityX = dist > this.MOUNT_RANGE ? Math.sign(dx) * this.MOVE_SPEED : 0;
    return true;
  }

private updateMount(player: Player, dt: number): void {
    const forcePostGame = DebugFlags.allowPostGameOverAttacks && player.canReceivePostGameHit;
    if (!forcePostGame && !player.canReceiveGroundHit) {
      this.finishMount();
      return;
    }
    this.snapToMountPosition(player);

    // Windup phase: rearing back the fist (frame 0)
    if (this.mountWindupTimer > 0) {
        this.mountWindupTimer -= dt;
        this.currentFrame = 0;
        if (this.mountWindupTimer <= 0) {
            // Windup complete → deliver the punch, then hold strike pose (frame 1)
            this.deliverMountPunch(player, forcePostGame);
            this.currentFrame = 1;
            this.mountStrikeTimer = this.MOUNT_STRIKE_HOLD;
        }
        return;
    }

    // Strike phase: hold the punching pose for visual follow-through (frame 1)
    this.mountStrikeTimer -= dt;
    this.currentFrame = 1;
    if (this.mountStrikeTimer > 0) return;

    // Ready for next windup, or finish if all punches delivered
    if (this.mountPunchesRemaining <= 0) {
        this.finishMount();
    } else {
        this.mountWindupTimer = this.MOUNT_PUNCH_WINDUP;
    }
}

private deliverMountPunch(player: Player, forcePostGame: boolean): void {
    this.mountPunchesRemaining--;
    playHeavyImpact();
    player.downHit(this.x, forcePostGame, this.MOUNT_PUNCH_DAMAGE, 'mount');
    const headX = player.x + (player.facing >= 0 ? 45 : 115);
    this.onHit?.(headX, player.y + player.height * 0.7, true);
    this.onHitStop?.(0.07, 0.1, 2.2);
}

  private finishMount(): void {
    this.state = 'recover';
    this.stateTimer = 0.38;
    this.velocityX = -this.facing * this.RETREAT_SPEED * 0.55;
    this.mountPunchesRemaining = 0;
    this.mountWindupTimer = 0;
    this.mountStrikeTimer = 0;
    this.zIndex = 0;
    this.player().setMounted(false);
  }

  private cancelMountIfNeeded(): void {
    if (this.state !== 'mount') return;
    this.mountPunchesRemaining = 0;
    this.mountWindupTimer = 0;
    this.mountStrikeTimer = 0;
    this.zIndex = 0;
    this.player().setMounted(false);
  }

  private snapToMountPosition(player: Player): void {
    const torsoOffset = player.facing >= 0 ? 86 : 74;
    const mountCenterOffset = 80;
    this.facing = player.facing;
    this.x = player.x + torsoOffset - mountCenterOffset;
    this.velocityX = 0;
  }

  private kitePlayer(player: Player, dx: number): void {
    const dist = Math.abs(dx);
    const targetX = this.targetX ?? (player.x - Math.sign(dx || this.facing) * this.PREFERRED_RANGE);
    if (dist < this.PREFERRED_RANGE * 0.85) {
      this.state = 'walk';
      this.velocityX = -this.facing * this.RETREAT_SPEED;
      return;
    }
    if (Math.abs(targetX - this.x) > 14) {
      this.state = 'walk';
      this.velocityX = Math.sign(targetX - this.x) * this.MOVE_SPEED;
      return;
    }
    this.state = 'idle';
    this.velocityX = 0;
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
    if (this.state === 'mount') {
      this.animTimer = 0;
      return;
    }
    if (this.state === 'walk' || this.state === 'sweep') {
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
