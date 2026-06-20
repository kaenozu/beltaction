/*
 * src/entities/Player.ts
 * プレイヤーキャラクター（Maki）の状態管理・描画・当たり判定
 * アイドル/歩行/攻撃/被弾/ダウン/死亡などのステートマシン
 * 関連: Entity.ts, InputManager.ts（入力）, Enemy.ts（衝突）
 */

import { Entity } from '../engine/Entity';
import { InputState } from '../engine/InputManager';
import { DebugFlags } from '../systems/DebugFlags';
import { HitboxConfig, HitboxRect, MAKI_HITBOX, resolveFacingHitbox } from '../systems/HitboxConfig';

export type HitReactionType = 'light' | 'guardHead' | 'bodyBlow';
export type DownHitReactionType = 'body' | 'back' | 'launch';

const HURT_FRAME_BY_REACTION: Record<HitReactionType, number> = {
  light: 0,
  guardHead: 1,
  bodyBlow: 1,
};

const HURT_STUN_BY_REACTION: Record<HitReactionType, number> = {
  light: 0.22,
  guardHead: 0.48,
  bodyBlow: 0.58,
};

const LOW_HEALTH_HURT_STUN_BONUS = 0.08;

const HURT_KNOCKBACK_BY_REACTION: Record<HitReactionType, number> = {
  light: 95,
  guardHead: 220,
  bodyBlow: 72,
};

const HURT_DRAW_SCALE_BY_REACTION: Record<HitReactionType, number> = {
  light: 1.04,
  guardHead: 1.04,
  bodyBlow: 1.08,
};

type GroundHitPresentation = {
  stun: number;
  knockback: number;
  drawOffsetX: number;
  drawOffsetY: number;
  drawScale: number;
};

const DOWN_HIT_PRESENTATION: Record<DownHitReactionType, GroundHitPresentation> = {
  body: { stun: 0.38, knockback: 54, drawOffsetX: 0, drawOffsetY: 0, drawScale: 1 },
  back: { stun: 0.44, knockback: 72, drawOffsetX: -6, drawOffsetY: -3, drawScale: 1.03 },
  launch: { stun: 0.5, knockback: 92, drawOffsetX: 8, drawOffsetY: -8, drawScale: 1.06 },
};

export class Player extends Entity {
  private inputState!: InputState;
  public health: number = 100;
  public velocityX: number = 0;
  public velocityY: number = 0;
  private onGround: boolean = true;
  private facing: number = 1;
  state: 'idle' | 'walk' | 'jump' | 'attack' | 'kick' | 'hurt' | 'death' | 'down' | 'downhit' | 'getup' | 'grabbed' | 'bound' = 'idle';

  private setState(s: typeof this.state): void {
    this.state = s;
    this.zIndex = (s === 'down' || s === 'downhit' || s === 'getup') ? -1 : 0;
  }
  onDeath: (() => void) | null = null;
  private stateTimer: number = 0;
  private recoveryTimer: number = 0;
  private postGameGroundHitCount: number = 0;
  private downGraceTimer: number = 0;
  private downPressureHitCount: number = 0;
  private forceGetupAfterDownHit: boolean = false;
  private wakeupInvincibleTimer: number = 0;
  private gameOverAnnounced: boolean = false;
  private currentHitReaction: HitReactionType = 'light';
  private currentDownHitReaction: DownHitReactionType = 'body';
  private grabberX: number = 0;
  private grabOffsetX: number = 0;
  private followupGrabberX: number | null = null;
  private grabImpactTimer: number = 0;
  private grabImpactDirection: number = 0;
  private boundAnchorX: number = 0;
  private boundPullSpeed: number = 0;
  private readonly POST_GAME_DEATH_REPLAY_HITS = 3;
  private readonly DOWN_GRACE_DURATION = 1.0;
  private readonly DOWN_RECOVERY_DURATION = 0.95;
  private readonly LOW_HEALTH_DOWN_RECOVERY_DURATION = 1.2;
  private readonly MAX_DOWN_PRESSURE_HITS = 3;
  private readonly WAKEUP_INVINCIBLE_DURATION = 1.05;
  private readonly GETUP_DURATION = 0.36;
  private readonly LOW_HEALTH_THRESHOLD = 30;
  private readonly LOW_HEALTH_MOVE_SPEED_MULTIPLIER = 0.88;
  private readonly GRAB_FOLLOWUP_IMPACT_DURATION = 0.18;
  private readonly GRAB_FOLLOWUP_IMPACT_DISTANCE = 10;
  private readonly GRAVITY = 1200;
  private readonly MOVE_SPEED = 220;
  private readonly JUMP_FORCE = -500;

  /** 統一ダメージ処理: noPlayerHpDamage/無敵/死亡チェックを含む */
  takeDamage(amount: number, fromX: number, reaction: HitReactionType = 'light'): boolean {
    if (this.isDefeated || this.isWakeupInvincible || DebugFlags.noPlayerHpDamage) return false;
    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) {
      this.die(fromX);
    } else {
      this.hurt(fromX, reaction);
    }
    return true;
  }
  
  public spriteImage: HTMLImageElement | null = null;
  public idleImage: HTMLImageElement | null = null;
  public pinchIdleImage: HTMLImageElement | null = null;
  public attackImage: HTMLImageElement | null = null;
  public kickImage: HTMLImageElement | null = null;
  public jumpImage: HTMLImageElement | null = null;
  public hurtImage: HTMLImageElement | null = null;
  public grabbedImage: HTMLImageElement | null = null;
  public deathImage: HTMLImageElement | null = null;
  public downImage: HTMLImageElement | null = null;
  public downHitImage: HTMLImageElement | null = null;
  public getupImage: HTMLImageElement | null = null;
  private readonly FRAME_WIDTH = 160;
  private readonly FRAME_HEIGHT = 192;
  private readonly KICK_FRAME_WIDTH = 220;
  currentFrame: number = 0;
  private animTimer: number = 0;
  private readonly WALK_FRAME_COUNT = 4;
  private readonly HURT_FRAME_COUNT = 2;
  private readonly GETUP_FRAME_COUNT = 2;
  private readonly ANIM_SPEED = 0.15;
  private prevAttack: boolean = false;
  private prevKick: boolean = false;
  private rapidCount: number = 0;
  private hurtDrawScale: number = 1.1;
  /** attack/kick開始時のstateTimerを保存（アニメーションのフレーム閾値に使う） */
  private attackDuration: number = 0;
  private hitboxConfig: HitboxConfig = MAKI_HITBOX;
  private readonly KICK_HITBOX: HitboxRect = { x: 116, y: 58, w: 64, h: 34 };
  private readonly DOWNED_HURT_HITBOX: HitboxRect = { x: -24, y: 72, w: 208, h: 120 };
  private readonly DOWN_SOURCE = { x: 0, y: 0, w: 320, h: 192 };
  private readonly DOWN_HIT_SOURCE = { x: 0, y: 0, w: 320, h: 192 };
  private readonly DOWN_DRAW_WIDTH = 224;
  private readonly DOWN_HIT_DRAW_WIDTH = 208;
  private readonly DOWN_DRAW_HEIGHT = 134;
  private readonly DOWN_HIT_DRAW_HEIGHT = 125;
  get isDefeated(): boolean { return this.health <= 0 && (this.state === 'death' || this.state === 'down' || this.state === 'downhit'); }
  get isGameOver(): boolean { return this.gameOverAnnounced; }
  get isLowHealth(): boolean { return this.health > 0 && this.health <= this.LOW_HEALTH_THRESHOLD; }
  get isDowned(): boolean { return this.state === 'down' || this.state === 'downhit' || this.state === 'getup'; }
  get isWakeupInvincible(): boolean { return this.wakeupInvincibleTimer > 0 || this.state === 'getup'; }
  get isGrabbed(): boolean { return this.state === 'grabbed'; }
  get isBound(): boolean { return this.state === 'bound'; }
  get isDoubleGrabbed(): boolean { return this.state === 'grabbed' && this.followupGrabberX !== null; }
  get canBeGrabbed(): boolean { return this.onGround && !this.isDefeated && !this.isDowned && !this.isGrabbed && !this.isBound && !this.isWakeupInvincible; }
  get canBeBound(): boolean { return this.onGround && !this.isDefeated && !this.isDowned && !this.isGrabbed && !this.isBound && !this.isWakeupInvincible; }
  get facingDirection(): number { return this.facing; }
  get grabberDirection(): number { return this.grabberX >= this.x ? 1 : -1; }
  get grabFollowupX(): number { return this.x - this.grabberDirection * 68; }
  get grabFollowupHitX(): number { return this.x + this.width / 2 - this.grabberDirection * 8; }
  get grabFollowupHitY(): number { return this.y + this.height * 0.54; }
  get canBeKnockedDownByFollowup(): boolean {
    return this.state === 'hurt' && this.currentHitReaction === 'guardHead';
  }
  get canReceiveGroundHit(): boolean {
    return (this.state === 'down' || this.state === 'downhit') && !this.gameOverAnnounced && !this.forceGetupAfterDownHit && !this.isWakeupInvincible;
  }
  get canReceivePostGameHit(): boolean {
    return this.health <= 0 && this.gameOverAnnounced && (this.state === 'down' || this.state === 'downhit');
  }
  
  constructor(x: number, y: number, private name: string) {
    super(x, y);
    this.width = this.FRAME_WIDTH;
    this.height = this.FRAME_HEIGHT;
  }
  
  setInput(state: InputState): void {
    this.inputState = state;
  }
  
  override update(dt: number): void {
    this.handleInput();
    this.updateStateTimer(dt);
    this.updateRecovery(dt);
    this.updateDownGrace(dt);
    this.updateWakeupInvincibility(dt);
    this.updateGrabImpact(dt);
    this.applyPhysics(dt);
    this.updateAnimation(dt);
  }

  private updateGrabImpact(dt: number): void {
    if (this.grabImpactTimer <= 0) return;
    this.grabImpactTimer = Math.max(0, this.grabImpactTimer - dt);
    if (this.state === 'grabbed') {
      this.x = this.grabberX + this.grabOffsetX + this.getGrabImpactOffset();
    }
  }

  private getGrabImpactOffset(): number {
    if (this.grabImpactTimer <= 0) return 0;
    const t = this.grabImpactTimer / this.GRAB_FOLLOWUP_IMPACT_DURATION;
    return this.grabImpactDirection * this.GRAB_FOLLOWUP_IMPACT_DISTANCE * t;
  }
  
  private updateAnimation(dt: number): void {
    if (this.state === 'walk') {
      this.animTimer += dt;
      if (this.animTimer >= this.ANIM_SPEED) {
        this.animTimer = 0;
        this.currentFrame = (this.currentFrame + 1) % this.WALK_FRAME_COUNT;
      }
    } else if (this.state === 'attack' || this.state === 'kick') {
      const half = this.attackDuration / 2;
      this.currentFrame = this.animTimer >= half ? 1 : 0;
      this.animTimer += dt;
    } else if (this.state === 'getup') {
      const frameDuration = this.GETUP_DURATION / this.GETUP_FRAME_COUNT;
      this.currentFrame = Math.min(this.GETUP_FRAME_COUNT - 1, Math.floor(this.animTimer / frameDuration));
      this.animTimer += dt;
    } else if (this.state === 'hurt') {
      this.animTimer = 0;
    } else {
      this.currentFrame = 0;
      this.animTimer = 0;
    }
  }
  
  private handleInput(): void {
    if (this.state === 'hurt' || this.state === 'attack' || this.state === 'kick' || this.state === 'death' || this.state === 'down' || this.state === 'downhit' || this.state === 'getup' || this.state === 'grabbed' || this.state === 'bound') return;
    
    // Horizontal movement
    const moveSpeed = this.isLowHealth ? this.MOVE_SPEED * this.LOW_HEALTH_MOVE_SPEED_MULTIPLIER : this.MOVE_SPEED;
    if (this.inputState.left) {
      this.velocityX = -moveSpeed;
      this.facing = -1;
      if (this.onGround) this.setState('walk');
    } else if (this.inputState.right) {
      this.velocityX = moveSpeed;
      this.facing = 1;
      if (this.onGround) this.setState('walk');
    } else {
      this.velocityX = 0;
      if (this.onGround) this.setState('idle');
    }
    
    // Jump
    if (this.inputState.up && this.onGround) {
      this.velocityY = this.JUMP_FORCE;
      this.onGround = false;
      this.setState('jump');
    }
    
    // Attack (edge trigger: only on key down, not held)
    const attackDown = this.inputState.attack && !this.prevAttack;
    this.prevAttack = this.inputState.attack;
    if (attackDown && this.onGround) {
      this.setState('attack');
      this.animTimer = 0;
      this.rapidCount++;
      // Each rapid press makes attack faster (0.3 → 0.15 min)
      this.stateTimer = Math.max(0.12, 0.3 - this.rapidCount * 0.03);
      this.attackDuration = this.stateTimer;
      this.velocityX = 0;
    }

    const kickDown = this.inputState.kick && !this.prevKick;
    this.prevKick = this.inputState.kick;
    if (kickDown && this.onGround) {
      this.setState('kick');
      this.animTimer = 0;
      this.currentFrame = 0;
      this.stateTimer = 0.34;
      this.attackDuration = this.stateTimer;
      this.velocityX = 0;
    }
    
    // Space for jump is handled via InputManager (up binding)
  }
  
  private updateStateTimer(dt: number): void {
    if (this.stateTimer > 0) {
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        if (this.state === 'attack') {
          this.rapidCount = Math.max(0, this.rapidCount - 1);
        } else if (this.state === 'death') {
          this.setState('down');
          this.velocityX = 0;
          this.velocityY = 0;
          this.downGraceTimer = this.DOWN_GRACE_DURATION;
          this.recoveryTimer = 0;
          return;
        } else if (this.state === 'downhit') {
          this.velocityX = 0;
          if (this.health <= 0) {
            this.setState('down');
            this.announceGameOver();
          } else if (this.forceGetupAfterDownHit) {
            this.startGetup(true);
          } else {
            this.setState('down');
            this.recoveryTimer = this.getDownRecoveryDuration();
          }
          return;
        } else if (this.state === 'hurt' && this.currentHitReaction === 'guardHead') {
          this.enterDownedRecovery();
          return;
        } else if (this.state === 'getup') {
          this.velocityX = 0;
          this.velocityY = 0;
          this.setState('idle');
          return;
        } else if (this.state === 'grabbed') {
          this.releaseGrab();
          return;
        } else if (this.state === 'bound') {
          this.releaseBound();
          return;
        }
        this.velocityX = 0;
        this.setState(this.onGround ? 'idle' : 'jump');
      }
    }
  }

  private updateRecovery(dt: number): void {
    if (this.health <= 0 || this.state !== 'down' || this.recoveryTimer <= 0) return;
    this.recoveryTimer = Math.max(0, this.recoveryTimer - dt);
    if (this.recoveryTimer <= 0) {
      this.startGetup(false);
    }
  }

  private updateDownGrace(dt: number): void {
    if (this.health > 0 || this.state !== 'down' || this.gameOverAnnounced) return;
    this.downGraceTimer = Math.max(0, this.downGraceTimer - dt);
    if (this.downGraceTimer <= 0) this.announceGameOver();
  }

  private updateWakeupInvincibility(dt: number): void {
    if (this.wakeupInvincibleTimer <= 0) return;
    this.wakeupInvincibleTimer = Math.max(0, this.wakeupInvincibleTimer - dt);
  }

  private announceGameOver(): void {
    if (this.gameOverAnnounced) return;
    this.gameOverAnnounced = true;
    this.velocityX = 0;
    this.velocityY = 0;
    this.onDeath?.();
  }
  
  public die(fromX: number): void {
    if (this.isDefeated) return;
    this.health = 0;
    this.setState('death');
    this.stateTimer = 0.5;
    this.postGameGroundHitCount = 0;
    this.downPressureHitCount = 0;
    this.forceGetupAfterDownHit = false;
    this.wakeupInvincibleTimer = 0;
    this.downGraceTimer = 0;
    this.recoveryTimer = 0;
    this.gameOverAnnounced = false;
    this.animTimer = 0;
    this.currentFrame = 0;
    this.velocityX = fromX > this.x ? -120 : 120;
    this.velocityY = -250;
    this.facing = fromX > this.x ? 1 : -1;
  }

  public downHit(fromX: number, force: boolean = false, damage: number = 0, reaction: DownHitReactionType = 'body'): void {
    if (!force && !this.canReceiveGroundHit && !this.canBeKnockedDownByFollowup) return;
    if (force && !this.canReceivePostGameHit) return;
    if (force) {
      this.postGameGroundHitCount++;
      if (this.postGameGroundHitCount >= this.POST_GAME_DEATH_REPLAY_HITS) {
        this.replayDeathFromGround(fromX);
        return;
      }
    } else if (this.health > 0 && (this.state === 'down' || this.state === 'downhit')) {
      this.downPressureHitCount++;
    }
    if (!force && !DebugFlags.noPlayerHpDamage && this.health > 0 && damage > 0) {
      this.health = Math.max(0, this.health - damage);
      if (this.health <= 0) {
        this.die(fromX);
        return;
      }
    }
    this.currentDownHitReaction = reaction;
    const presentation = DOWN_HIT_PRESENTATION[reaction];
    if (!force && this.health > 0 && this.downPressureHitCount >= this.MAX_DOWN_PRESSURE_HITS) {
      this.forceGetupAfterDownHit = true;
      this.downPressureHitCount = 0;
    }
    this.setState('downhit');
    this.stateTimer = presentation.stun;
    this.recoveryTimer = 0;
    this.animTimer = 0;
    this.currentFrame = 0;
    this.velocityX = fromX > this.x ? -presentation.knockback : presentation.knockback;
    this.facing = fromX > this.x ? 1 : -1;
  }

  public tripDown(fromX: number, damage: number = 0): void {
    if (this.isDefeated || this.isDowned || this.isGrabbed || this.isBound) return;
    if (!DebugFlags.noPlayerHpDamage && damage > 0) {
      this.health = Math.max(0, this.health - damage);
      if (this.health <= 0) {
        this.die(fromX);
        return;
      }
    }
    this.currentDownHitReaction = 'back';
    this.downPressureHitCount = 0;
    this.forceGetupAfterDownHit = false;
    const presentation = DOWN_HIT_PRESENTATION.back;
    this.setState('downhit');
    this.stateTimer = presentation.stun;
    this.recoveryTimer = 0;
    this.animTimer = 0;
    this.currentFrame = 0;
    this.velocityX = fromX > this.x ? -presentation.knockback : presentation.knockback;
    this.velocityY = 0;
    this.facing = fromX > this.x ? 1 : -1;
  }

  private replayDeathFromGround(fromX: number): void {
    this.postGameGroundHitCount = 0;
    this.setState('death');
    this.stateTimer = 0.45;
    this.recoveryTimer = 0;
    this.animTimer = 0;
    this.currentFrame = 0;
    this.velocityX = fromX > this.x ? -140 : 140;
    this.velocityY = -230;
    this.facing = fromX > this.x ? 1 : -1;
  }

  public hurt(fromX?: number, reaction: HitReactionType = 'light'): void {
    if (this.state === 'grabbed') return;
    this.setState('hurt');
    this.stateTimer = HURT_STUN_BY_REACTION[reaction] + (this.isLowHealth ? LOW_HEALTH_HURT_STUN_BONUS : 0);
    this.currentHitReaction = reaction;
    this.recoveryTimer = 0;
    this.animTimer = 0;
    this.currentFrame = HURT_FRAME_BY_REACTION[reaction] % this.HURT_FRAME_COUNT;
    this.hurtDrawScale = HURT_DRAW_SCALE_BY_REACTION[reaction];
    if (fromX !== undefined) {
      this.facing = fromX > this.x ? 1 : -1;
      const knockback = HURT_KNOCKBACK_BY_REACTION[reaction];
      this.velocityX = fromX > this.x ? -knockback : knockback;
    } else {
      this.velocityX = 0;
    }
  }

  public startGrabbed(grabberX: number): void {
    if (!this.canBeGrabbed) return;
    this.grabberX = grabberX;
    this.grabOffsetX = grabberX > this.x ? -42 : 42;
    this.facing = grabberX > this.x ? 1 : -1;
    this.setState('grabbed');
    this.stateTimer = 0;
    this.recoveryTimer = 0;
    this.velocityX = 0;
    this.velocityY = 0;
    this.animTimer = 0;
    this.currentFrame = HURT_FRAME_BY_REACTION.guardHead;
    this.hurtDrawScale = 1;
    this.followupGrabberX = null;
    this.grabImpactTimer = 0;
    this.grabImpactDirection = 0;
  }

  public startBound(attackerX: number, duration: number, pullSpeed: number, damage: number): boolean {
    if (!this.canBeBound) return false;
    if (!DebugFlags.noPlayerHpDamage && damage > 0) {
      this.health = Math.max(0, this.health - damage);
      if (this.health <= 0) {
        this.die(attackerX);
        return false;
      }
    }
    this.boundAnchorX = attackerX;
    this.boundPullSpeed = pullSpeed;
    this.facing = attackerX > this.x ? 1 : -1;
    this.setState('bound');
    this.stateTimer = duration;
    this.recoveryTimer = 0;
    this.velocityX = 0;
    this.velocityY = 0;
    this.animTimer = 0;
    this.currentFrame = HURT_FRAME_BY_REACTION.guardHead;
    this.hurtDrawScale = 1;
    return true;
  }

  public pullBoundToward(anchorX: number, dt: number): void {
    if (this.state !== 'bound') return;
    this.boundAnchorX = anchorX;
    const center = this.x + this.width / 2;
    const distance = this.boundAnchorX - center;
    const maxStep = this.boundPullSpeed * dt;
    const step = Math.max(-maxStep, Math.min(maxStep, distance));
    this.x += step;
    this.velocityX = 0;
    this.velocityY = 0;
  }

  public updateGrabbedPosition(grabberX: number): void {
    if (this.state !== 'grabbed') return;
    this.grabberX = grabberX;
    this.x = grabberX + this.grabOffsetX + this.getGrabImpactOffset();
    this.velocityX = 0;
    this.velocityY = 0;
  }

  public applyGrabDamage(amount: number): void {
    if (this.state !== 'grabbed' || DebugFlags.noPlayerHpDamage || this.health <= 0) return;
    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) this.die(this.grabberX);
  }

  public startGrabFollowup(grabberX: number): boolean {
    if (this.state !== 'grabbed' || this.followupGrabberX !== null || this.health <= 0) return false;
    this.followupGrabberX = grabberX;
    return true;
  }

  public updateGrabFollowupPosition(grabberX: number): void {
    if (this.state !== 'grabbed' || this.followupGrabberX === null) return;
    this.followupGrabberX = grabberX;
  }

  public finishGrabFollowup(): void {
    this.followupGrabberX = null;
  }

  public receiveGrabFollowupHit(fromX: number, damage: number): void {
    if (!this.isDoubleGrabbed || this.health <= 0) return;
    this.grabImpactDirection = fromX > this.x ? -1 : 1;
    this.grabImpactTimer = this.GRAB_FOLLOWUP_IMPACT_DURATION;
    if (!DebugFlags.noPlayerHpDamage) {
      this.health = Math.max(0, this.health - damage);
      if (this.health <= 0) {
        this.die(fromX);
        return;
      }
    }
  }

  public finishGrab(fromX: number): void {
    if (this.state !== 'grabbed') return;
    this.followupGrabberX = null;
    this.currentDownHitReaction = 'back';
    const presentation = DOWN_HIT_PRESENTATION.back;
    this.setState('downhit');
    this.stateTimer = presentation.stun;
    this.recoveryTimer = 0;
    this.animTimer = 0;
    this.currentFrame = 0;
    this.velocityX = fromX > this.x ? -presentation.knockback : presentation.knockback;
    this.velocityY = 0;
    this.facing = fromX > this.x ? 1 : -1;
  }

  public releaseGrab(): void {
    if (this.state !== 'grabbed') return;
    this.followupGrabberX = null;
    this.velocityX = 0;
    this.velocityY = 0;
    this.setState('idle');
  }

  public releaseBound(): void {
    if (this.state !== 'bound') return;
    this.boundPullSpeed = 0;
    this.velocityX = 0;
    this.velocityY = 0;
    this.setState('idle');
  }

  private enterDownedRecovery(): void {
    this.setState('down');
    this.stateTimer = 0;
    this.recoveryTimer = this.getDownRecoveryDuration();
    this.velocityX = 0;
    this.velocityY = 0;
  }

  private getDownRecoveryDuration(): number {
    return this.isLowHealth ? this.LOW_HEALTH_DOWN_RECOVERY_DURATION : this.DOWN_RECOVERY_DURATION;
  }

  private startGetup(forceInvincible: boolean): void {
    this.setState('getup');
    this.stateTimer = this.GETUP_DURATION;
    this.forceGetupAfterDownHit = false;
    this.downPressureHitCount = 0;
    this.wakeupInvincibleTimer = forceInvincible
      ? this.WAKEUP_INVINCIBLE_DURATION
      : Math.max(this.wakeupInvincibleTimer, this.GETUP_DURATION);
    this.velocityX = 0;
    this.velocityY = 0;
    this.animTimer = 0;
    this.currentFrame = 0;
  }
  
  /** Current attack hitbox in world coords, or null if not on strike frame */
  getAttackHitbox(): HitboxRect | null {
    if (this.currentFrame !== 1) return null;
    if (this.state === 'attack') return resolveFacingHitbox(this, this.hitboxConfig.hitboxes.attack, this.facing);
    if (this.state === 'kick') return resolveFacingHitbox(this, this.KICK_HITBOX, this.facing);
    return null;
  }

  getAttackDamage(): number {
    return this.state === 'kick' ? 28 : 20;
  }

  getBodyHitbox(): HitboxRect {
    return resolveFacingHitbox(this, this.hitboxConfig.hitboxes.body, this.facing);
  }

  getHurtHitbox(): HitboxRect {
    if (this.state === 'down' || this.state === 'downhit') {
      return resolveFacingHitbox(this, this.DOWNED_HURT_HITBOX, this.facing);
    }
    return resolveFacingHitbox(this, this.hitboxConfig.hitboxes.hurt, this.facing);
  }
  
  private applyPhysics(dt: number): void {
    this.velocityY += this.GRAVITY * dt;
    this.x += this.velocityX * dt;
    this.y += this.velocityY * dt;
    
    // Ground collision
    if (this.y > 480 - this.height) {
      this.y = 480 - this.height;
      this.velocityY = 0;
      this.onGround = true;
    }

    // Stage boundary
    this.x = Math.max(0, Math.min(this.x, 2000 - this.width));
  }
  
  override render(ctx: CanvasRenderingContext2D): void {
    this.drawShadow(ctx);

    ctx.save();
    ctx.translate(this.x + this.width / 2, 0);
    ctx.scale(this.facing, 1);

    this.renderSprite(ctx);

    ctx.restore();

    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.fillText(`${this.state.toUpperCase()} [${this.currentFrame}] r=${this.rapidCount}`, this.x, this.y - 5);

    this.renderDebugHitboxes(ctx);
  }

  private renderSprite(ctx: CanvasRenderingContext2D): void {
    if (this.state === 'idle' && (this.idleImage || this.pinchIdleImage)) {
      const idle = this.isLowHealth && this.pinchIdleImage ? this.pinchIdleImage : this.idleImage;
      if (idle) ctx.drawImage(idle, -this.width / 2, this.y, this.width, this.height);
    } else if (this.state === 'walk' && this.spriteImage) {
      const sx = this.currentFrame * this.FRAME_WIDTH;
      ctx.drawImage(
        this.spriteImage,
        sx, 0, this.FRAME_WIDTH, this.FRAME_HEIGHT,
        -this.width / 2, this.y, this.width, this.height,
      );
    } else if (this.state === 'attack' && this.attackImage) {
      this.renderFrameSprite(ctx, this.attackImage, this.currentFrame * this.FRAME_WIDTH);
    } else if (this.state === 'kick' && this.kickImage) {
      const sx = this.currentFrame * this.KICK_FRAME_WIDTH;
      ctx.drawImage(
        this.kickImage,
        sx, 0, this.KICK_FRAME_WIDTH, this.FRAME_HEIGHT,
        -this.KICK_FRAME_WIDTH / 2, this.y, this.KICK_FRAME_WIDTH, this.height,
      );
    } else if (this.state === 'jump' && this.jumpImage) {
      ctx.drawImage(this.jumpImage, -this.width / 2, this.y, this.width, this.height);
    } else if (this.state === 'death' && this.deathImage) {
      ctx.drawImage(this.deathImage, -this.width / 2, this.y, this.width, this.height);
    } else if (this.state === 'hurt' && this.hurtImage) {
      this.renderHurtSprite(ctx);
    } else if ((this.state === 'grabbed' || this.state === 'bound') && (this.grabbedImage || this.hurtImage)) {
      this.renderGrabbedSprite(ctx);
    } else if (this.state === 'down' && this.downImage) {
      this.drawGroundedSprite(ctx, this.downImage, this.DOWN_SOURCE, this.DOWN_DRAW_WIDTH, this.DOWN_DRAW_HEIGHT);
    } else if (this.state === 'downhit' && this.downHitImage) {
      this.renderDownHitSprite(ctx);
    } else if (this.state === 'getup' && this.getupImage) {
      this.renderFrameSprite(ctx, this.getupImage, this.currentFrame * this.FRAME_WIDTH);
    } else if (this.idleImage) {
      ctx.drawImage(this.idleImage, -this.width / 2, this.y, this.width, this.height);
    } else {
      ctx.fillStyle = this.name === 'Maki' ? '#ff6b6b' : '#4dabf7';
      ctx.fillRect(-this.width / 2, this.y, this.width, this.height);
    }
  }

  private renderFrameSprite(ctx: CanvasRenderingContext2D, image: HTMLImageElement, sx: number): void {
    ctx.drawImage(
      image,
      sx, 0, this.FRAME_WIDTH, this.FRAME_HEIGHT,
      -this.width / 2, this.y, this.width, this.height,
    );
  }

  private renderHurtSprite(ctx: CanvasRenderingContext2D): void {
    const sx = this.currentFrame * this.FRAME_WIDTH;
    const s = this.hurtDrawScale;
    ctx.drawImage(
      this.hurtImage!,
      sx, 0, this.FRAME_WIDTH, this.FRAME_HEIGHT,
      -this.width * s / 2, this.y - this.height * (s - 1),
      this.width * s, this.height * s,
    );
  }

  private renderGrabbedSprite(ctx: CanvasRenderingContext2D): void {
    if (this.grabbedImage) {
      ctx.drawImage(this.grabbedImage, -this.width / 2, this.y, this.width, this.height);
    } else if (this.hurtImage) {
      const sx = HURT_FRAME_BY_REACTION.guardHead * this.FRAME_WIDTH;
      ctx.drawImage(
        this.hurtImage,
        sx, 0, this.FRAME_WIDTH, this.FRAME_HEIGHT,
        -this.width / 2, this.y, this.width, this.height,
      );
    }
  }

  private renderDownHitSprite(ctx: CanvasRenderingContext2D): void {
    const presentation = DOWN_HIT_PRESENTATION[this.currentDownHitReaction];
    this.drawGroundedSprite(
      ctx,
      this.downHitImage!,
      this.DOWN_HIT_SOURCE,
      this.DOWN_HIT_DRAW_WIDTH * presentation.drawScale,
      this.DOWN_HIT_DRAW_HEIGHT * presentation.drawScale,
      presentation.drawOffsetX,
      presentation.drawOffsetY,
    );
  }

  private renderDebugHitboxes(ctx: CanvasRenderingContext2D): void {
    if (!DebugFlags.showHitboxes) return;
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth = 1;
    const body = this.getBodyHitbox();
    ctx.strokeRect(body.x, body.y, body.w, body.h);

    ctx.strokeStyle = '#0ff';
    const hurt = this.getHurtHitbox();
    ctx.strokeRect(hurt.x, hurt.y, hurt.w, hurt.h);

    const atk = this.getAttackHitbox();
    if (atk) {
      ctx.strokeStyle = '#f80';
      ctx.lineWidth = 2;
      ctx.strokeRect(atk.x, atk.y, atk.w, atk.h);
    }
  }

  private drawGroundedSprite(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    source: { x: number; y: number; w: number; h: number },
    drawWidth: number,
    drawHeight: number,
    offsetX: number = 0,
    offsetY: number = 0,
  ): void {
    ctx.drawImage(
      image,
      source.x, source.y, source.w, source.h,
      -drawWidth / 2 + offsetX, this.y + this.height - drawHeight + offsetY,
      drawWidth, drawHeight,
    );
  }

  private drawShadow(ctx: CanvasRenderingContext2D): void {
    const groundY = this.y + this.height - 8;
    const isDown = this.state === 'down' || this.state === 'downhit';
    const shadowW = isDown ? 158 : 104;
    const shadowH = isDown ? 12 : 14;
    const alpha = this.state === 'jump' ? 0.08 : 0.16;

    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.beginPath();
    ctx.ellipse(this.x + this.width / 2, groundY, shadowW / 2, shadowH / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
