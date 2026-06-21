/*
 * src/entities/Enemy.ts
 * グラント（雑魚敵）のAI・状態管理・描画・当たり判定
 * パターン攻撃・グラブ・追撃など複数の行動を持つ
 * 関連: Entity.ts, Player.ts（ターゲット）, SpawnSystem.ts（生成）
 */

import { Entity } from '../engine/Entity';
import { Player } from './Player';
import { type DownHitReactionType, type HitReactionType } from './PlayerTypes';
import { EnemyRenderer } from './EnemyRenderer';
import { DebugFlags } from '../systems/DebugFlags';
import { HitboxConfig, HitboxRect, GRUNT_HITBOX, resolveFacingHitbox, rectsOverlap } from '../systems/HitboxConfig';

type EnemyState = 'idle' | 'walk' | 'attack' | 'heavyAttack' | 'bodyBlow' | 'downAttack' | 'grab' | 'grabFollowup' | 'hurt' | 'death';
type StandingAttackKind = 'light' | 'bodyBlow' | 'heavy';

export class Enemy extends Entity {
  public health: number = 30;
  public damage: number = 5;
  private velocityX: number = 0;
  private readonly MOVE_SPEED = 60;
  private readonly STOP_RANGE = 90;
  private readonly ATTACK_RANGE = 70;
  private readonly DOWN_ATTACK_RANGE = 104;
  private readonly GRAB_RANGE = 42;
  private readonly GRAB_APPROACH_RANGE = 86;
  private readonly GRAB_ATTEMPT_CHANCE = 0.34;
  private readonly ATTACK_COOLDOWN = 1.5;
  private readonly GRAB_COOLDOWN = 4.2;
  private readonly GRAB_DURATION = 2.8;
  private readonly GRAB_TICK_INTERVAL = 0.38;
  private readonly GRAB_TICK_DAMAGE = 2;
  private readonly GRAB_FOLLOWUP_DURATION = 2.4;
  private readonly GRAB_FOLLOWUP_COOLDOWN = 1.35;
  private readonly GRAB_FOLLOWUP_TICK_INTERVAL = 0.42;
  private readonly GRAB_FOLLOWUP_DAMAGE = 5;
  private readonly GRAB_FOLLOWUP_JOIN_RANGE = 92;
  private readonly BODY_BLOW_DAMAGE = 9;
  private readonly DOWN_ATTACK_DAMAGE = 7;
  private readonly DOWNED_ATTACK_COOLDOWN = 2.1;
  private readonly POST_GAME_GRAB_ATTEMPT_CHANCE = 0.15;
  private readonly RETREAT_RANGE = 130;
  private readonly RETREAT_SPEED = 45;
  private readonly FLANK_DISTANCE = 58;
  private readonly FLANK_SPEED = 105;
  public state: EnemyState = 'walk';
  private stateTimer: number = 0;
  private attackCooldown: number = 0;
  private grabCooldown: number = 1.2;
  private grabTickTimer: number = 0;
  private grabFollowupTickTimer: number = 0;
  private behaviorTimer: number = 0.5;
  private attackHit: boolean = false;
  private tryingGrab: boolean = false;
  private attackPatternIndex: number = 0;
  private currentAttackReaction: HitReactionType = 'light';
  private currentDownHitReaction: DownHitReactionType = 'body';
  private currentAttackDamage: number = 5;
  private flankTargetX: number | null = null;
  private flankCooldown: number = 0;
  private readonly BEHAVIOR_WALK_DURATION = 1.5;
  private readonly BEHAVIOR_IDLE_DURATION = 0.8;
  public facing: number = -1;
  public currentFrame: number = 0;
  private animTimer: number = 0;
  private readonly ANIM_SPEED = 0.25;
  
  public spriteImage: HTMLImageElement | null = null;
  public hurtImage: HTMLImageElement | null = null;
  public heavyAttackImage: HTMLImageElement | null = null;
  public bodyBlowImage: HTMLImageElement | null = null;
  public mirrorGrabFollowupBodyBlow: boolean = false;
  public onHit: ((x: number, y: number, overlay?: boolean) => void) | null = null;
  public onHitStop: ((duration: number, shakeDuration?: number, shakeMagnitude?: number) => void) | null = null;
  public onDeath: ((x: number, y: number) => void) | null = null;
  get isDead(): boolean { return this.state === 'death'; }
  get isHoldingPlayer(): boolean { return this.state === 'grab'; }
  get isBodyBlowGrappler(): boolean { return this.state === 'grabFollowup'; }
  get isGrapplingPlayer(): boolean { return this.state === 'grab' || this.state === 'grabFollowup'; }
  private targetX: number | null = null;
  public readonly frameWidth = 160;
  public readonly frameHeight = 192;
  private readonly HEAVY_ATTACK_HITBOX: HitboxRect = { x: 88, y: 78, w: 54, h: 34 };
  private hitboxConfig: HitboxConfig = GRUNT_HITBOX;
  
  constructor(x: number, y: number, private player: () => Player) {
    super(x, y);
    this.width = this.frameWidth;
    this.height = this.frameHeight;
  }
  private enemyRenderer = new EnemyRenderer(this);
  
  override update(dt: number): void {
    const player = this.player();
    const dx = player.x - this.x;
    this.facing = dx > 0 ? 1 : -1;

    this.attackCooldown -= dt;
    this.grabCooldown -= dt;
    this.behaviorTimer -= dt;

    this.handleStateTimer(player, dt);

    if (this.state === 'hurt' || this.state === 'death') {
      this.applyPhysics(dt);
      this.updateAnimation(dt);
      return;
    }

    if (this.tryGameOverRetreat(player, dt)) return;
    if (this.tryGrabBehaviour(player, dt)) return;
    if (this.tryGrabFollowupBehaviour(player, dt)) return;
    if (this.tryAttackBehaviour(player, dt)) return;
    if (this.tryBoundBodyBlowBehaviour(player, dt)) return;
    if (this.tryRetreatFromDowned(player, dt)) return;

    const targetX = this.targetX ?? player.x;
    const dxToTarget = targetX - this.x;
    const dist = Math.abs(dx);
    const targetDist = Math.abs(dxToTarget);
    const canGrab = (player.canBeGrabbed || (DebugFlags.allowPostGameOverAttacks && player.canReceivePostGameHit)) && this.grabCooldown <= 0 && dx * player.facing > 0;

    this.updateFlankTarget(player, dt);

    if (this.tryDownedAttack(player, dist)) {
    } else if (this.tryJoinGrabFollowup(player)) {
    } else if (this.tryGrabAttempt(player, dx, dist, canGrab)) {
      this.applyPhysics(dt);
      this.updateAnimation(dt);
      return;
    } else if (this.tryStandingAttack(player, dx, dist, canGrab)) {
      this.applyPhysics(dt);
      this.updateAnimation(dt);
      return;
    } else if (this.flankTargetX !== null) {
      this.state = 'walk';
      this.velocityX = Math.sign(this.flankTargetX - this.x) * this.FLANK_SPEED;
    } else if (this.tryCooldownStrafe(player, dx, dist)) {
    } else if (this.tryAdvanceInRange(dist)) {
    } else {
      this.moveTowardTarget(dxToTarget, targetDist);
    }

    this.applyPhysics(dt);
    this.updateAnimation(dt);
  }

  private handleStateTimer(player: Player, dt: number): void {
    if (this.stateTimer <= 0) return;
    this.stateTimer -= dt;
    if (this.stateTimer > 0) return;

    switch (this.state) {
      case 'hurt':
      case 'attack':
      case 'heavyAttack':
      case 'bodyBlow':
      case 'downAttack':
        this.state = 'idle';
        this.velocityX = 0;
        break;
      case 'grab':
        player.finishGrab(this.x);
        this.state = 'idle';
        this.velocityX = 0;
        this.attackCooldown = this.ATTACK_COOLDOWN;
        this.grabCooldown = this.GRAB_COOLDOWN;
        this.tryingGrab = false;
        break;
      case 'grabFollowup':
        player.finishGrabFollowup();
        this.state = 'idle';
        this.velocityX = 0;
        this.attackCooldown = this.GRAB_FOLLOWUP_COOLDOWN;
        this.mirrorGrabFollowupBodyBlow = false;
        break;
      case 'death':
        this.active = false;
        break;
    }
  }

  private tryGameOverRetreat(player: Player, dt: number): boolean {
    if (!player.isGameOver || DebugFlags.allowPostGameOverAttacks) return false;
    this.flankTargetX = null;
    this.attackHit = false;
    this.tryingGrab = false;
    const retreat = Math.abs(player.x - this.x) < this.RETREAT_RANGE;
    this.state = retreat ? 'walk' : 'idle';
    this.velocityX = retreat ? -this.facing * this.RETREAT_SPEED : 0;
    this.applyPhysics(dt);
    this.updateAnimation(dt);
    return true;
  }

  private tryGrabBehaviour(player: Player, dt: number): boolean {
    if (this.state !== 'grab') return false;
    player.updateGrabbedPosition(this.x);
    this.velocityX = 0;
    this.grabTickTimer -= dt;
    if (this.grabTickTimer <= 0) {
      this.grabTickTimer = this.GRAB_TICK_INTERVAL;
      player.applyGrabDamage(this.GRAB_TICK_DAMAGE);
      if (player.state === 'grabbed' || player.state === 'death') {
        this.onHit?.(player.x + player.width / 2, player.y + player.height / 2);
        this.onHitStop?.(0.035, 0.04, 1);
      }
    }
    this.applyPhysics(dt);
    this.updateAnimation(dt);
    return true;
  }

  private tryGrabFollowupBehaviour(player: Player, dt: number): boolean {
    if (this.state !== 'grabFollowup') return false;
    if (!player.isDoubleGrabbed) {
      player.finishGrabFollowup();
      this.state = 'idle';
      this.velocityX = 0;
      this.applyPhysics(dt);
      this.updateAnimation(dt);
      return true;
    }
    this.x = player.grabFollowupX;
    this.facing = player.x > this.x ? 1 : -1;
    player.updateGrabFollowupPosition(this.x);
    this.velocityX = 0;
    this.grabFollowupTickTimer -= dt;
    if (this.grabFollowupTickTimer <= 0) {
      this.grabFollowupTickTimer = this.GRAB_FOLLOWUP_TICK_INTERVAL;
      player.receiveGrabFollowupHit(this.x, this.GRAB_FOLLOWUP_DAMAGE);
      this.onHit?.(player.grabFollowupHitX, player.grabFollowupHitY, true);
      this.onHitStop?.(0.055, 0.08, 2);
    }
    this.applyPhysics(dt);
    this.updateAnimation(dt);
    return true;
  }

  private tryBoundBodyBlowBehaviour(player: Player, dt: number): boolean {
    if (!player.isBound && !player.isGrabbed) return false;
    if (player.isBound && !player.boundReadyForFollowup) return false;
    if (this.attackCooldown > 0) return false;

    const centerDx = this.getCenterDxToPlayer(player);
    const dist = Math.abs(centerDx);
    const direction = centerDx === 0 ? this.facing : Math.sign(centerDx);
    this.facing = direction;
    this.flankTargetX = null;
    this.tryingGrab = false;
    if (dist < this.ATTACK_RANGE) {
      if (player.startGrabFollowup(this.x)) {
        this.state = 'grabFollowup';
        this.stateTimer = this.GRAB_FOLLOWUP_DURATION;
        this.grabFollowupTickTimer = 0;
        this.velocityX = 0;
        this.attackHit = false;
        this.mirrorGrabFollowupBodyBlow = player.grabFollowupDirection > 0;
        this.currentAttackReaction = 'bodyBlow';
        this.currentAttackDamage = this.BODY_BLOW_DAMAGE;
        this.animTimer = 0;
        this.currentFrame = 0;
        this.applyPhysics(dt);
        this.updateAnimation(dt);
        return true;
      }
    }
    return false;
  }

  private tryAttackBehaviour(player: Player, dt: number): boolean {
    if (this.state !== 'attack' && this.state !== 'heavyAttack' && this.state !== 'bodyBlow' && this.state !== 'downAttack') return false;
    if (this.currentFrame === 1 && !this.attackHit) {
      this.attackHit = true;
      this.resolveHit(player);
    }
    this.applyPhysics(dt);
    this.updateAnimation(dt);
    return true;
  }

  private resolveHit(player: Player): void {
    const atk = this.getAttackHitbox();
    const hurt = player.getHurtHitbox();
    if (!atk || !rectsOverlap(atk, hurt)) return;

    let hitResolved = false;
    if (player.canReceiveGroundHit || player.canBeKnockedDownByFollowup || (DebugFlags.allowPostGameOverAttacks && player.canReceivePostGameHit)) {
      player.downHit(this.x, DebugFlags.allowPostGameOverAttacks, this.currentAttackDamage, this.currentDownHitReaction);
      this.attackCooldown = Math.max(this.attackCooldown, this.DOWNED_ATTACK_COOLDOWN);
      hitResolved = true;
    } else if ((player.isBound || player.isGrabbed) && this.currentAttackReaction === 'bodyBlow') {
      hitResolved = player.receiveBoundBodyBlow(this.x + this.width / 2, this.currentAttackDamage);
    } else if (this.currentAttackReaction === 'bodyBlow') {
      return;
    } else {
      hitResolved = player.takeDamage(this.currentAttackDamage, this.x, this.currentAttackReaction);
    }
    if (!hitResolved) return;

    const cx = (atk.x + atk.x + atk.w + hurt.x + hurt.x + hurt.w) / 4;
    const cy = (atk.y + atk.y + atk.h + hurt.y + hurt.y + hurt.h) / 4;
    this.onHit?.(cx, cy);

    const heavy = this.state === 'heavyAttack' || this.state === 'bodyBlow' || this.state === 'downAttack' || this.currentAttackReaction === 'guardHead';
    this.onHitStop?.(heavy ? 0.095 : 0.045, heavy ? 0.16 : 0.06, heavy ? 4 : 1.5);
  }

  private tryRetreatFromDowned(player: Player, dt: number): boolean {
    const dx = player.x - this.x;
    const dist = Math.abs(dx);
    if (!player.isDowned || player.canReceiveGroundHit || (DebugFlags.allowPostGameOverAttacks && player.canReceivePostGameHit)) return false;
    this.flankTargetX = null;
    this.tryingGrab = false;
    this.state = dist < this.RETREAT_RANGE ? 'walk' : 'idle';
    this.velocityX = dist < this.RETREAT_RANGE ? -this.facing * this.RETREAT_SPEED : 0;
    this.applyPhysics(dt);
    this.updateAnimation(dt);
    return true;
  }

  private updateFlankTarget(player: Player, dt: number): void {
    this.flankCooldown = Math.max(0, this.flankCooldown - dt);
    if (this.flankTargetX !== null && Math.abs(this.flankTargetX - this.x) < 8) {
      this.flankTargetX = null;
      this.flankCooldown = 1.5;
    }
    if (this.flankTargetX === null && this.flankCooldown <= 0 && this.attackCooldown <= 0 && Math.abs(player.x - this.x) < this.ATTACK_RANGE * 1.5) {
      this.flankTargetX = player.x - player.facing * this.FLANK_DISTANCE;
      this.flankCooldown = 2.0;
    }
  }

  private tryDownedAttack(player: Player, dist: number): boolean {
    if (dist >= this.DOWN_ATTACK_RANGE || this.attackCooldown > 0) return false;
    if (!player.canReceiveGroundHit && !(DebugFlags.allowPostGameOverAttacks && player.canReceivePostGameHit)) return false;
    this.state = 'downAttack';
    this.stateTimer = 0.5;
    this.animTimer = 0;
    this.currentFrame = 0;
    this.attackCooldown = this.DOWNED_ATTACK_COOLDOWN;
    this.velocityX = 0;
    this.attackHit = false;
    this.tryingGrab = false;
    this.currentAttackReaction = 'bodyBlow';
    this.currentDownHitReaction = this.nextDownHitReaction();
    this.currentAttackDamage = this.DOWN_ATTACK_DAMAGE;
    return true;
  }

  private tryJoinGrabFollowup(player: Player): boolean {
    const canJoin = player.isGrabbed && !this.isHoldingPlayer && !player.isDoubleGrabbed && this.attackCooldown <= 0;
    if (!canJoin) return false;

    const followupDist = Math.abs(player.grabFollowupX - this.x);
    if (followupDist < this.GRAB_FOLLOWUP_JOIN_RANGE) {
      if (player.startGrabFollowup(this.x)) {
        this.state = 'grabFollowup';
        this.stateTimer = this.GRAB_FOLLOWUP_DURATION;
        this.grabFollowupTickTimer = 0;
        this.velocityX = 0;
        this.attackHit = false;
        this.tryingGrab = false;
        this.mirrorGrabFollowupBodyBlow = false;
      }
    } else if (followupDist >= 8) {
      this.state = 'walk';
      this.velocityX = Math.sign(player.grabFollowupX - this.x) * this.MOVE_SPEED * 0.9;
    } else {
      this.state = 'idle';
      this.velocityX = 0;
    }
    return true;
  }

  private tryGrabAttempt(player: Player, dx: number, dist: number, canGrab: boolean): boolean {
    const grabChance = player.canReceivePostGameHit ? this.POST_GAME_GRAB_ATTEMPT_CHANCE : this.GRAB_ATTEMPT_CHANCE;
    if (player.isGrabbed && !this.isHoldingPlayer) {
      this.state = 'idle';
      this.velocityX = 0;
      return true;
    }

    if (this.tryingGrab && !canGrab) {
      this.tryingGrab = false;
      return false;
    }

    if (canGrab && dist < this.GRAB_APPROACH_RANGE && dist >= this.GRAB_RANGE && this.tryingGrab) {
      this.state = 'walk';
      this.velocityX = Math.sign(dx) * this.MOVE_SPEED * 0.85;
      return true;
    }

    if (canGrab && dist < this.GRAB_RANGE && (this.tryingGrab || Math.random() < grabChance)) {
      this.state = 'grab';
      this.stateTimer = this.GRAB_DURATION;
      this.grabTickTimer = 0;
      this.attackCooldown = this.ATTACK_COOLDOWN;
      this.velocityX = 0;
      this.attackHit = false;
      this.tryingGrab = false;
      if (player.canReceivePostGameHit) {
        player.startPostGameGrabbed(this.x);
      } else {
        player.startGrabbed(this.x);
      }
      return true;
    }
    return false;
  }

  private tryStandingAttack(_player: Player, dx: number, dist: number, canGrab: boolean): boolean {
    if (dist >= this.ATTACK_RANGE || this.attackCooldown > 0) return false;

    const grabChance = _player.canReceivePostGameHit ? this.POST_GAME_GRAB_ATTEMPT_CHANCE : this.GRAB_ATTEMPT_CHANCE;
    if (canGrab && dist < this.GRAB_APPROACH_RANGE && Math.random() < grabChance) {
      this.tryingGrab = true;
      this.state = 'walk';
      this.velocityX = Math.sign(dx) * this.MOVE_SPEED * 0.85;
      return true;
    }

    const attackKind = this.nextStandingAttackKind();
    this.startStandingAttack(attackKind);
    return true;
  }

  private startStandingAttack(attackKind: StandingAttackKind): void {
    this.state = attackKind === 'heavy' ? 'heavyAttack' : attackKind === 'bodyBlow' ? 'bodyBlow' : 'attack';
    this.stateTimer = attackKind === 'heavy' ? 0.58 : attackKind === 'bodyBlow' ? 0.54 : 0.4;
    this.animTimer = 0;
    this.currentFrame = 0;
    this.attackCooldown = this.ATTACK_COOLDOWN;
    this.velocityX = 0;
    this.attackHit = false;
    this.tryingGrab = false;
    this.currentAttackReaction = this.getStandingAttackReaction(attackKind);
    this.currentDownHitReaction = attackKind === 'heavy' ? 'launch' : this.nextDownHitReaction();
    this.currentAttackDamage = attackKind === 'heavy' ? 12 : attackKind === 'bodyBlow' ? this.BODY_BLOW_DAMAGE : this.damage;
  }

  private getCenterDxToPlayer(player: Player): number {
    return (player.x + player.width / 2) - (this.x + this.width / 2);
  }

  private tryCooldownStrafe(player: Player, dx: number, dist: number): boolean {
    if (this.attackCooldown <= 0 || dist >= this.RETREAT_RANGE) return false;
    if (this.flankTargetX !== null && Math.abs(this.flankTargetX - this.x) < 8) {
      this.flankTargetX = null;
    }
    if (this.flankTargetX === null && Math.random() < 0.03) {
      const side = Math.random() < 0.5 ? 1 : -1;
      this.flankTargetX = player.x + side * this.FLANK_DISTANCE;
    }
    this.state = 'walk';
    this.velocityX = this.flankTargetX !== null
      ? Math.sign(this.flankTargetX - this.x) * this.FLANK_SPEED
      : Math.sign(dx) * this.MOVE_SPEED * 0.4;
    return true;
  }

  private tryAdvanceInRange(dist: number): boolean {
    if (dist >= this.ATTACK_RANGE) return false;
    this.state = 'walk';
    this.velocityX = 0;
    return true;
  }

  private moveTowardTarget(dxToTarget: number, targetDist: number): void {
    if (targetDist < 12) {
      this.velocityX = 0;
      this.state = 'idle';
    } else if (targetDist < this.STOP_RANGE) {
      this.state = 'walk';
      this.velocityX = Math.sign(dxToTarget) * this.MOVE_SPEED * 0.5;
    } else {
      if (this.behaviorTimer <= 0) {
        if (this.state === 'walk') {
          this.state = 'idle';
          this.velocityX = 0;
          this.behaviorTimer = this.BEHAVIOR_IDLE_DURATION + Math.random() * 0.5;
        } else {
          this.state = 'walk';
          this.behaviorTimer = this.BEHAVIOR_WALK_DURATION + Math.random() * 1.0;
        }
      }
      if (this.state === 'walk') {
        this.velocityX = Math.sign(dxToTarget) * this.MOVE_SPEED;
      }
    }
  }

  setTargetX(targetX: number): void {
    this.targetX = targetX;
  }

  private nextStandingAttackKind(): StandingAttackKind {
    const pattern: StandingAttackKind[] = ['light', 'heavy', 'light', 'light'];
    const attack = pattern[this.attackPatternIndex % pattern.length];
    this.attackPatternIndex++;
    return attack;
  }

  private getStandingAttackReaction(attackKind: StandingAttackKind): HitReactionType {
    if (attackKind === 'heavy') return 'guardHead';
    if (attackKind === 'bodyBlow') return 'bodyBlow';
    return 'light';
  }

  private nextDownHitReaction(): DownHitReactionType {
    const pattern: DownHitReactionType[] = ['body', 'back', 'body'];
    return pattern[this.attackPatternIndex % pattern.length];
  }
  
  private applyPhysics(dt: number): void {
    this.x += this.velocityX * dt;
  }
  
  private updateAnimation(dt: number): void {
    if (this.state === 'hurt' || this.state === 'death') {
      this.currentFrame = 0;
      this.animTimer = 0;
    } else if (this.state === 'walk' || this.state === 'attack' || this.state === 'heavyAttack' || this.state === 'bodyBlow' || this.state === 'downAttack' || this.state === 'grab' || this.state === 'grabFollowup') {
      this.animTimer += dt;
      if (this.animTimer >= this.ANIM_SPEED) {
        this.animTimer = 0;
        this.currentFrame = (this.currentFrame + 1) % 2;
      }
    } else {
      this.currentFrame = 0;
      this.animTimer = 0;
    }
  }
  
  takeDamage(amount: number, fromX?: number): boolean {
    this.health = Math.max(0, this.health - amount);
    const knockDir = fromX !== undefined ? (fromX > this.x ? 1 : -1) : this.facing;
    if (this.health <= 0) {
      this.state = 'death';
      this.stateTimer = 0.5;
      this.velocityX = knockDir * -120;
      this.attackHit = false;
      this.onDeath?.(this.x + this.width / 2, this.y + this.height / 3);
      return true;
    }
    this.state = 'hurt';
    this.stateTimer = 0.2;
    this.velocityX = knockDir * -80;
    return true;
  }
  
  /** Current attack hitbox in world coords, or null if not on strike frame */
  getAttackHitbox(): HitboxRect | null {
    if (this.currentFrame !== 1) return null;
    if (this.state === 'attack') return resolveFacingHitbox(this, this.hitboxConfig.hitboxes.attack, this.facing);
    if (this.state === 'heavyAttack') return resolveFacingHitbox(this, this.HEAVY_ATTACK_HITBOX, this.facing);
    if (this.state === 'bodyBlow') return resolveFacingHitbox(this, { x: 78, y: 82, w: 68, h: 42 }, this.facing);
    if (this.state === 'downAttack') return resolveFacingHitbox(this, { x: 72, y: 112, w: 78, h: 50 }, this.facing);
    if (this.state === 'grab') return resolveFacingHitbox(this, { x: 82, y: 42, w: 58, h: 92 }, this.facing);
    if (this.state === 'grabFollowup') return resolveFacingHitbox(this, { x: 82, y: 60, w: 58, h: 64 }, this.facing);
    return null;
  }

  getBodyHitbox(): HitboxRect {
    return resolveFacingHitbox(this, this.hitboxConfig.hitboxes.body, this.facing);
  }

  getHurtHitbox(): HitboxRect {
    return resolveFacingHitbox(this, this.hitboxConfig.hitboxes.hurt, this.facing);
  }
  
  override render(ctx: CanvasRenderingContext2D): void {
    this.enemyRenderer.render(ctx);
  }
}
