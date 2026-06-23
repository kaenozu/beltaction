/*
 * src/entities/Player.ts
 * プレイヤーキャラクター（Maki）の状態管理・描画・当たり判定
 * アイドル/歩行/攻撃/被弾/ダウン/死亡などのステートマシン
 * 関連: Entity.ts, InputManager.ts（入力）, Enemy.ts（衝突）
 */

import { CANVAS_HEIGHT, STAGE_WIDTH } from '../engine/Constants';
import { Entity } from '../engine/Entity';
import { InputState } from '../engine/InputManager';
import { DebugFlags } from '../systems/DebugFlags';
import { playHurtLight, playHurtHeavy, playGrab, playDeath, playDownHit, playChainBind, playSwish, stopBind } from '../systems/SoundManager';

import { HitboxConfig, HitboxRect, MAKI_HITBOX, resolveFacingHitbox } from '../systems/HitboxConfig';
import {
  type HitReactionType,
  type DownHitReactionType,
  HURT_FRAME_BY_REACTION,
  HURT_STUN_BY_REACTION,
  LOW_HEALTH_HURT_STUN_BONUS,
  HURT_KNOCKBACK_BY_REACTION,
  HURT_DRAW_SCALE_BY_REACTION,
  HURT_HITSTOP_BY_REACTION,
  DOWN_HIT_PRESENTATION,
} from './PlayerTypes';
import { PlayerRenderer } from './PlayerRenderer';

export type { HitReactionType, DownHitReactionType };

export class Player extends Entity {
  private inputState!: InputState;
  public health: number = 100;
  public velocityX: number = 0;
  public velocityY: number = 0;
  private onGround: boolean = true;
  public facing: number = 1;
  state: 'idle' | 'walk' | 'jump' | 'attack' | 'kick' | 'hurt' | 'death' | 'down' | 'downhit' | 'getup' | 'grabbed' | 'bound' | 'reverseCrab' = 'idle';

  private setState(s: typeof this.state): void {
    this.state = s;
    this.zIndex = (s === 'down' || s === 'downhit' || s === 'getup' || s === 'reverseCrab') ? -1 : 0;
  }
  onDeath: (() => void) | null = null;
  requestHitStop: ((duration: number) => void) | null = null;
  requestSlowMotion: ((duration: number, factor: number) => void) | null = null;
  private stateTimer: number = 0;
  private recoveryTimer: number = 0;
  private postGameGroundHitCount: number = 0;
  private downGraceTimer: number = 0;
  private downPressureHitCount: number = 0;
  private forceGetupAfterDownHit: boolean = false;
  private wakeupInvincibleTimer: number = 0;
  private gameOverAnnounced: boolean = false;
  private mounted: boolean = false;
  private currentHitReaction: HitReactionType = 'light';
  public currentDownHitReaction: DownHitReactionType = 'body';
  private grabberX: number = 0;
  private grabOffsetX: number = 0;
  private followupGrabberX: number | null = null;
  private grabImpactTimer: number = 0;
  private grabImpactDirection: number = 0;
  private boundAnchorX: number = 0;
  private boundPullSpeed: number = 0;
  private boundEscapeProgress: number = 0;
  private prevBoundResist: boolean = false;
  private chainWrapped: boolean = false;
  private chainWrappedDuration: number = 0;
  private chainWrappedImpactTimer: number = 0;
  private boundBodyBlowHurtTimer: number = 0;
  private chainBodyBlowCount: number = 0;
  private boundGrabDirection: number = 1;
  private boundPullPhase: 'pull' | 'resist' = 'pull';
  private boundPullPhaseTimer: number = 0;
  public boundReadyForFollowup: boolean = false;
  private readonly BOUND_PULL_DURATION = 0.3;
  private readonly BOUND_RESIST_DURATION = 0.15;
  private readonly BOUND_RESIST_SHAKE_AMPLITUDE = 0.8;
  private readonly BOUND_RESIST_SHAKE_FREQUENCY = 30;
  private readonly CHAIN_BODY_BLOW_RELEASE_COUNT = 5;
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
  private readonly BOUND_BODY_BLOW_HURT_DURATION = 0.22;
  private readonly BOUND_ESCAPE_REQUIRED = 12;
  private readonly BOUND_ESCAPE_DECAY_PER_SECOND = 4;
  private readonly GRAVITY = 1200;
  private readonly MOVE_SPEED = 220;
  private readonly JUMP_FORCE = -500;

  /** 統一ダメージ処理: noPlayerHpDamageではHPだけ保護し、被弾リアクションは残す */
  takeDamage(amount: number, fromX: number, reaction: HitReactionType = 'light'): boolean {
    if (this.isDefeated || this.isWakeupInvincible) return false;
    if (this.state === 'bound') return this.takeBoundDamage(amount, fromX);
    if (!DebugFlags.noPlayerHpDamage) {
      this.health = Math.max(0, this.health - amount);
      if (this.health <= 0) {
        this.die(fromX);
        return true;
      }
    }
    this.hurt(fromX, reaction);
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
  public boundImage: HTMLImageElement | null = null;
  public deathImage: HTMLImageElement | null = null;
  public downImage: HTMLImageElement | null = null;
  public downHitImage: HTMLImageElement | null = null;
  public mountPunchImage: HTMLImageElement | null = null;
  public launchImage: HTMLImageElement | null = null;
  public reverseCrabImage: HTMLImageElement | null = null;
  public getupImage: HTMLImageElement | null = null;
  public readonly frameWidth = 240;
  public readonly frameHeight = 288;
  public kickFrameWidth = 220;
  currentFrame: number = 0;
  currentAttackKind: 'punch' | 'kick' | null = null;
  private animTimer: number = 0;
  private walkFrameCount = 4;
  private hurtFrameCount = 2;
  private getupFrameCount = 2;
  private readonly ANIM_SPEED = 0.15;
  private prevAttack: boolean = false;
  private prevKick: boolean = false;
  public rapidCount: number = 0;
  public hurtDrawScale: number = 1.1;
  private hitboxConfig: HitboxConfig = MAKI_HITBOX;
  private readonly KICK_HITBOX: HitboxRect = { x: 130, y: 62, w: 38, h: 34 };
  private readonly DOWNED_HURT_HITBOX: HitboxRect = { x: -24, y: 72, w: 208, h: 120 };
  public downSource = { x: 0, y: 237, w: 240, h: 51 };
  public downHitSource = { x: 0, y: 0, w: 228, h: 288 };
  public mountPunchSource = { x: 0, y: 211, w: 240, h: 77 };
  public launchSource = { x: 0, y: 0, w: 384, h: 288 };
  public readonly downDrawWidth = 240;
  public readonly downHitDrawWidth = 150;
  public readonly mountPunchDrawWidth = 240;
  public readonly launchDrawWidth = 240;
  public readonly downDrawHeight = 51;
  public readonly downHitDrawHeight = 189;
  public readonly mountPunchDrawHeight = 77;
  public readonly launchDrawHeight = 190;
  get isDefeated(): boolean { return this.health <= 0 && (this.state === 'death' || this.state === 'down' || this.state === 'downhit'); }
  get isGameOver(): boolean { return this.gameOverAnnounced; }
  get isLowHealth(): boolean { return this.health > 0 && this.health <= this.LOW_HEALTH_THRESHOLD; }
  get isDowned(): boolean { return this.state === 'down' || this.state === 'downhit' || this.state === 'getup'; }
  get isWakeupInvincible(): boolean { return this.wakeupInvincibleTimer > 0 || this.state === 'getup'; }
  get isGrabbed(): boolean { return this.state === 'grabbed'; }
  get isReverseCrabbed(): boolean { return this.state === 'reverseCrab'; }
  get isBound(): boolean { return this.state === 'bound'; }
  get isMounted(): boolean { return this.mounted; }
  get isChainWrapped(): boolean { return this.chainWrapped; }
  get chainWrappedProgress(): number {
    if (!this.chainWrapped || this.chainWrappedDuration <= 0) return 0;
    return Math.max(0, Math.min(1, 1 - this.stateTimer / this.chainWrappedDuration));
  }
  get chainWrappedImpactRatio(): number {
    return Math.max(0, Math.min(1, this.chainWrappedImpactTimer / this.GRAB_FOLLOWUP_IMPACT_DURATION));
  }
  get isBoundBodyBlowHurt(): boolean { return this.boundBodyBlowHurtTimer > 0; }
  get boundBodyBlowHurtRatio(): number {
    return Math.max(0, Math.min(1, this.boundBodyBlowHurtTimer / this.BOUND_BODY_BLOW_HURT_DURATION));
  }
  get isDoubleGrabbed(): boolean { return (this.state === 'grabbed' || this.isBound) && this.followupGrabberX !== null; }
  get boundEscapeRatio(): number { return Math.max(0, Math.min(1, this.boundEscapeProgress / this.BOUND_ESCAPE_REQUIRED)); }
  private get canBeInteractedWith(): boolean {
    return this.onGround && !this.isDefeated && !this.isDowned && !this.isGrabbed && !this.isReverseCrabbed && !this.isBound && !this.isWakeupInvincible;
  }
  get damageStage(): number {
    if (this.health > 70) return 0;
    if (this.health > 40) return 1;
    if (this.health > 15) return 2;
    return 3;
  }
  get canBeGrabbed(): boolean { return this.canBeInteractedWith; }
  get canBeBound(): boolean { return this.canBeInteractedWith; }
  get facingDirection(): number { return this.facing; }
  get grabberDirection(): number { return this.grabberX >= this.x ? 1 : -1; }
  get grabFollowupDirection(): number {
    if (this.state === 'bound') return -this.boundGrabDirection;
    return -this.grabberDirection;
  }
  get grabFollowupX(): number {
    return this.x + this.grabFollowupDirection * 68;
  }
  get grabFollowupHitX(): number { return this.x + this.width / 2 + this.grabFollowupDirection * 8; }
  get grabFollowupHitY(): number { return this.y + this.height * 0.54; }
  get canBeKnockedDownByFollowup(): boolean {
    return this.state === 'hurt' && (this.currentHitReaction === 'guardHead' || this.currentHitReaction === 'kneeBuckle');
  }
  get canReceiveGroundHit(): boolean {
    return (this.state === 'down' || this.state === 'downhit') && !this.gameOverAnnounced && !this.forceGetupAfterDownHit && !this.isWakeupInvincible;
  }
  get canReceivePostGameHit(): boolean {
    return this.health <= 0 && this.gameOverAnnounced && (this.state === 'down' || this.state === 'downhit');
  }
  
  constructor(x: number, y: number) {
    super(x, y);
    this.width = 160;
    this.height = 192;
  }
  private playerRenderer = new PlayerRenderer(this);

  applySpriteProfile(profile: {
    walkFrames: number;
    hurtFrames: number;
    getupFrames: number;
    kickFrameWidth: number;
    downSourceWidth: number;
    downHitSourceWidth: number;
    mountPunchSourceWidth: number;
  }): void {
    this.walkFrameCount = profile.walkFrames;
    this.hurtFrameCount = profile.hurtFrames;
    this.getupFrameCount = profile.getupFrames;
    this.kickFrameWidth = profile.kickFrameWidth;
    this.downSource = { ...this.downSource, w: profile.downSourceWidth };
    this.downHitSource = { ...this.downHitSource, w: profile.downHitSourceWidth };
    this.mountPunchSource = { ...this.mountPunchSource, w: profile.mountPunchSourceWidth };
  }

  restart(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.health = 100;
    this.velocityX = 0;
    this.velocityY = 0;
    this.onGround = true;
    this.setState('idle');
    this.stateTimer = 0;
    this.recoveryTimer = 0;
    this.downGraceTimer = 0;
    this.downPressureHitCount = 0;
    this.postGameGroundHitCount = 0;
    this.forceGetupAfterDownHit = false;
    this.wakeupInvincibleTimer = 0;
    this.gameOverAnnounced = false;
    this.animTimer = 0;
    this.currentFrame = 0;
    this.rapidCount = 0;
    this.currentAttackKind = null;
    this.grabImpactTimer = 0;
    this.followupGrabberX = null;
    this.chainWrapped = false;
    this.chainWrappedDuration = 0;
    this.chainWrappedImpactTimer = 0;
    this.boundBodyBlowHurtTimer = 0;
    this.boundEscapeProgress = 0;
    this.chainBodyBlowCount = 0;
    this.boundGrabDirection = 1;
    this.prevBoundResist = false;
    this.active = true;
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
    this.updateChainWrappedImpact(dt);
    this.updateBoundBodyBlowHurt(dt);
    this.updateBoundResistance(dt);
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

  private updateChainWrappedImpact(dt: number): void {
    if (this.chainWrappedImpactTimer <= 0) return;
    this.chainWrappedImpactTimer = Math.max(0, this.chainWrappedImpactTimer - dt);
  }

  private updateBoundBodyBlowHurt(dt: number): void {
    if (this.boundBodyBlowHurtTimer <= 0) return;
    this.boundBodyBlowHurtTimer = Math.max(0, this.boundBodyBlowHurtTimer - dt);
    if (this.boundBodyBlowHurtTimer <= 0) {
      this.currentFrame = HURT_FRAME_BY_REACTION.guardHead % this.hurtFrameCount;
      this.hurtDrawScale = 1;
    }
  }

  private updateBoundResistance(dt: number): void {
    if (this.state !== 'bound' && this.state !== 'grabbed' && this.state !== 'reverseCrab') {
      this.prevBoundResist = false;
      this.boundEscapeProgress = 0;
      return;
    }
    if (this.health <= 0) return;

    const resisting = this.inputState.left || this.inputState.right || this.inputState.attack || this.inputState.kick;
    if (resisting && !this.prevBoundResist) {
      this.boundEscapeProgress += this.state === 'reverseCrab' ? 4.5 : 3.5;
    } else if (resisting) {
      this.boundEscapeProgress += (this.state === 'reverseCrab' ? 28 : 28) * dt;
    } else {
      this.boundEscapeProgress = Math.max(0, this.boundEscapeProgress - this.BOUND_ESCAPE_DECAY_PER_SECOND * dt);
    }
    this.prevBoundResist = resisting;

    const escapeRequired = this.state === 'reverseCrab' ? 8 : this.BOUND_ESCAPE_REQUIRED;
    if (this.boundEscapeProgress >= escapeRequired) {
      if (this.state === 'grabbed') {
        this.releaseGrab();
      } else if (this.state === 'reverseCrab') {
        this.releaseReverseCrab();
      } else {
        this.releaseBound();
      }
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
        this.currentFrame = (this.currentFrame + 1) % this.walkFrameCount;
      }
    } else if (this.state === 'jump') {
      if (this.currentFrame < 2) {
        this.animTimer += dt;
        if (this.animTimer >= 0.12) {
          this.animTimer = 0;
          this.currentFrame++;
        }
      }
    } else if (this.state === 'attack' || this.state === 'kick') {
      this.animTimer += dt;
    } else if (this.state === 'getup') {
      const frameDuration = this.GETUP_DURATION / this.getupFrameCount;
      this.currentFrame = Math.min(this.getupFrameCount - 1, Math.floor(this.animTimer / frameDuration));
      this.animTimer += dt;
    } else if (this.state === 'hurt') {
      this.animTimer = 0;
    } else {
      this.currentFrame = 0;
      this.animTimer = 0;
    }
  }
  
  private handleInput(): void {
    if (this.state === 'hurt' || this.state === 'attack' || this.state === 'kick' || this.state === 'death' || this.state === 'down' || this.state === 'downhit' || this.state === 'getup' || this.state === 'grabbed' || this.state === 'reverseCrab' || this.state === 'bound') return;
    
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
    
    // Jump (uses jump key, with up as fallback)
    if ((this.inputState.jump || this.inputState.up) && this.onGround) {
      this.velocityY = this.JUMP_FORCE;
      this.onGround = false;
      this.currentFrame = 0;
      this.animTimer = 0;
      this.setState('jump');
    }
    
    // Attack (edge trigger: only on key down, not held)
    const attackDown = this.inputState.attack && !this.prevAttack;
    this.prevAttack = this.inputState.attack;
    if (attackDown && this.onGround) {
      this.setState('attack');
      this.currentAttackKind = 'punch';
      playSwish();
      this.animTimer = 0;
      this.rapidCount++;
      // Each rapid press makes attack faster (0.3 → 0.15 min)
      this.stateTimer = Math.max(0.12, 0.3 - this.rapidCount * 0.03);
      this.currentFrame = 1;
      this.velocityX = 0;
    }

    const kickDown = this.inputState.kick && !this.prevKick;
    this.prevKick = this.inputState.kick;
    if (kickDown && this.onGround) {
      this.setState('kick');
      this.currentAttackKind = 'kick';
      playSwish();
      this.animTimer = 0;
      this.stateTimer = 0.34;
      this.currentFrame = 1;
      this.velocityX = 0;
    }
    
    // Space for jump is handled via InputManager (up binding)
  }
  
  private updateStateTimer(dt: number): void {
    if (this.stateTimer > 0) {
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        if (this.state === 'attack' || this.state === 'kick') {
          this.rapidCount = Math.max(0, this.rapidCount - 1);
          this.currentAttackKind = null;
        } else if (this.state === 'death') {
          this.hurtDrawScale = 1;
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
        } else if (this.state === 'reverseCrab') {
          this.releaseReverseCrab();
          return;
        } else if (this.state === 'bound') {
          this.releaseBound();
          return;
        }
        this.currentAttackKind = null;
        this.velocityX = 0;
        this.setState(this.onGround ? 'idle' : 'jump');
      }
    }
  }

  private updateRecovery(dt: number): void {
    if (this.health <= 0 || this.state !== 'down' || this.recoveryTimer <= 0 || this.mounted) return;
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
    playDeath();
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
    this.currentFrame = HURT_FRAME_BY_REACTION.guardHead % this.hurtFrameCount;
    this.hurtDrawScale = 1.08;
    this.velocityX = fromX > this.x ? -120 : 120;
    this.velocityY = -250;
    this.facing = fromX > this.x ? 1 : -1;
    this.requestSlowMotion?.(0.5, 0.2);
    this.requestHitStop?.(0.1);
  }

  public downHit(fromX: number, force: boolean = false, damage: number = 0, reaction: DownHitReactionType = 'body', silent: boolean = false): void {
    if (!silent) playDownHit();
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
    playDownHit();
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
    if (reaction === 'light') playHurtLight(); else playHurtHeavy();
    this.setState('hurt');
    this.stateTimer = HURT_STUN_BY_REACTION[reaction] + (this.isLowHealth ? LOW_HEALTH_HURT_STUN_BONUS : 0);
    this.currentHitReaction = reaction;
    this.recoveryTimer = 0;
    this.animTimer = 0;
    this.currentFrame = HURT_FRAME_BY_REACTION[reaction] % this.hurtFrameCount;
    this.hurtDrawScale = HURT_DRAW_SCALE_BY_REACTION[reaction];
    if (fromX !== undefined) {
      this.facing = fromX > this.x ? 1 : -1;
      const knockback = HURT_KNOCKBACK_BY_REACTION[reaction];
      this.velocityX = fromX > this.x ? -knockback : knockback;
    } else {
      this.velocityX = 0;
    }
    this.requestHitStop?.(HURT_HITSTOP_BY_REACTION[reaction]);
  }

  public startPostGameGrabbed(grabberX: number): void {
    if (!this.canReceivePostGameHit) return;
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

  public startGrabbed(grabberX: number): void {
    if (!this.canBeGrabbed) return;
    playGrab();
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
    this.boundEscapeProgress = 0;
    this.prevBoundResist = false;
  }

  public startReverseCrab(grabberX: number): boolean {
    if (!this.isDowned || this.isWakeupInvincible) return false;
    playGrab();
    this.grabberX = grabberX;
    this.grabOffsetX = grabberX > this.x ? -36 : 36;
    this.facing = grabberX > this.x ? 1 : -1;
    this.setState('reverseCrab');
    this.stateTimer = 0;
    this.recoveryTimer = 0;
    this.velocityX = 0;
    this.velocityY = 0;
    this.animTimer = 0;
    this.currentFrame = 0;
    this.hurtDrawScale = 1;
    this.followupGrabberX = null;
    this.grabImpactTimer = 0;
    this.grabImpactDirection = 0;
    this.boundEscapeProgress = 0;
    this.prevBoundResist = false;
    return true;
  }

  public startBound(attackerX: number, duration: number, pullSpeed: number, damage: number, force: boolean = false): boolean {
    if (!force && !this.canBeBound) return false;
    playGrab();
    if (!DebugFlags.noPlayerHpDamage && damage > 0 && this.health > 0) {
      this.health = Math.max(0, this.health - damage);
      if (this.health <= 0) {
        this.die(attackerX);
        return false;
      }
    }
    this.boundAnchorX = attackerX;
    this.grabberX = attackerX;
    this.boundPullSpeed = pullSpeed;
    this.boundEscapeProgress = 0;
    this.prevBoundResist = false;
    this.chainWrapped = false;
    this.chainWrappedDuration = 0;
    this.chainWrappedImpactTimer = 0;
    this.boundBodyBlowHurtTimer = 0;
    this.facing = attackerX > this.x ? 1 : -1;
    this.boundGrabDirection = this.facing;
    this.boundPullPhase = 'pull';
    this.boundPullPhaseTimer = 0;
    this.boundReadyForFollowup = false;
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

  public startChainWrapped(duration: number): void {
    if (this.state !== 'bound') return;
    playChainBind();
    this.chainWrapped = true;
    this.chainWrappedDuration = duration;
    this.boundReadyForFollowup = true;
    this.stateTimer = duration;
    this.boundPullSpeed = 0;
    this.velocityX = 0;
    this.velocityY = 0;
  }

  public receiveBoundBodyBlow(fromX: number, damage: number): boolean {
    if (this.state !== 'bound' && this.state !== 'grabbed') return false;
    if (this.isDefeated && !DebugFlags.allowPostGameOverAttacks) return false;
    if (this.health > 0 && !DebugFlags.noPlayerHpDamage) {
      this.health = Math.max(0, this.health - damage);
      if (this.health <= 0) {
        this.die(fromX);
        return true;
      }
    }
    this.boundBodyBlowHurtTimer = this.BOUND_BODY_BLOW_HURT_DURATION;
    this.velocityX = 0;
    this.velocityY = -80;
    return true;
  }

  private takeBoundDamage(amount: number, fromX: number): boolean {
    if (this.health <= 0) return true;
    if (!DebugFlags.noPlayerHpDamage) {
      this.health = Math.max(0, this.health - amount);
      if (this.health <= 0) {
        this.die(fromX);
        return true;
      }
    }
    this.velocityX = 0;
    this.velocityY = -80;
    return true;
  }

  public pullBoundToward(anchorX: number, dt: number): void {
    if (this.state !== 'bound') return;
    this.boundAnchorX = anchorX;
    this.boundPullPhaseTimer += dt;
    const phaseDuration = this.boundPullPhase === 'pull' ? this.BOUND_PULL_DURATION : this.BOUND_RESIST_DURATION;
    if (this.boundPullPhaseTimer >= phaseDuration) {
      this.boundPullPhase = this.boundPullPhase === 'pull' ? 'resist' : 'pull';
      this.boundPullPhaseTimer = 0;
    }
    const center = this.x + this.width / 2;
    const distance = this.boundAnchorX - center;
    if (this.boundPullPhase === 'pull') {
      const maxStep = this.boundPullSpeed * dt;
      const step = Math.max(-maxStep, Math.min(maxStep, distance));
      this.x += step;
    } else {
      this.x += Math.sin(this.boundPullPhaseTimer * this.BOUND_RESIST_SHAKE_FREQUENCY * Math.PI * 2) * this.BOUND_RESIST_SHAKE_AMPLITUDE;
    }
    this.velocityX = 0;
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
    if ((this.state !== 'grabbed' && !this.isBound) || this.followupGrabberX !== null) return false;
    if (this.health <= 0 && !DebugFlags.allowPostGameOverAttacks) return false;
    this.followupGrabberX = grabberX;
    return true;
  }

  public updateGrabFollowupPosition(grabberX: number): void {
    if ((this.state !== 'grabbed' && !this.isBound) || this.followupGrabberX === null) return;
    this.followupGrabberX = grabberX;
  }

  public finishGrabFollowup(): void {
    this.followupGrabberX = null;
    stopBind();
  }

  public receiveGrabFollowupHit(fromX: number, damage: number): void {
    if (!this.isDoubleGrabbed) return;
    if (this.health <= 0 && !DebugFlags.allowPostGameOverAttacks) return;

    if (this.state === 'bound' || this.state === 'grabbed') {
      this.velocityX = 0;
      this.velocityY = -80;
      this.startBoundBodyBlowHurt();
      if (this.state === 'bound') playHurtHeavy();
      this.chainBodyBlowCount++;
      if (this.state === 'bound' && this.chainBodyBlowCount >= this.CHAIN_BODY_BLOW_RELEASE_COUNT) {
        this.finishGrabFollowup();
        this.releaseBound();
        this.tripDown(fromX, damage);
        return;
      }
      if (this.health > 0 && !DebugFlags.noPlayerHpDamage) {
        this.health = Math.max(0, this.health - damage);
        if (this.health <= 0) {
          this.die(fromX);
          return;
        }
      }
      return;
    }

    this.grabImpactDirection = fromX > this.x ? -1 : 1;
    this.grabImpactTimer = this.GRAB_FOLLOWUP_IMPACT_DURATION;
    if (this.health > 0 && !DebugFlags.noPlayerHpDamage) {
      this.health = Math.max(0, this.health - damage);
      if (this.health <= 0) {
        this.die(fromX);
        return;
      }
    }
  }

  public finishGrab(fromX: number): void {
    if (this.state !== 'grabbed') return;
    this.boundEscapeProgress = 0;
    this.prevBoundResist = false;
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
    stopBind();
    this.followupGrabberX = null;
    this.boundEscapeProgress = 0;
    this.prevBoundResist = false;
    this.wakeupInvincibleTimer = 0.3;
    this.velocityX = 0;
    this.velocityY = 0;
    this.setState('idle');
  }

  public releaseReverseCrab(): void {
    if (this.state !== 'reverseCrab') return;
    stopBind();
    this.followupGrabberX = null;
    this.boundEscapeProgress = 0;
    this.prevBoundResist = false;
    this.wakeupInvincibleTimer = 0.35;
    this.velocityX = 0;
    this.velocityY = 0;
    this.setState('down');
    this.recoveryTimer = this.getDownRecoveryDuration();
  }

  public releaseBound(): void {
    if (this.state !== 'bound') return;
    stopBind();
    this.boundPullSpeed = 0;
    this.followupGrabberX = null;
    this.chainWrapped = false;
    this.chainWrappedDuration = 0;
    this.chainWrappedImpactTimer = 0;
    this.boundBodyBlowHurtTimer = 0;
    this.boundEscapeProgress = 0;
    this.prevBoundResist = false;
    this.chainBodyBlowCount = 0;
    this.boundGrabDirection = 1;
    this.boundPullPhase = 'pull';
    this.boundPullPhaseTimer = 0;
    this.boundReadyForFollowup = false;
    this.velocityX = 0;
    this.velocityY = 0;
    this.wakeupInvincibleTimer = 0.3;
    this.setState('idle');
  }

  private startBoundBodyBlowHurt(): void {
    this.chainWrappedImpactTimer = this.GRAB_FOLLOWUP_IMPACT_DURATION;
    this.boundBodyBlowHurtTimer = this.BOUND_BODY_BLOW_HURT_DURATION;
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

  setMounted(mounted: boolean): void {
    this.mounted = mounted;
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
    if (this.state === 'down' || this.state === 'downhit' || this.state === 'reverseCrab') {
      return resolveFacingHitbox(this, this.DOWNED_HURT_HITBOX, this.facing);
    }
    return resolveFacingHitbox(this, this.hitboxConfig.hitboxes.hurt, this.facing);
  }
  
  private applyPhysics(dt: number): void {
    this.velocityY += this.GRAVITY * dt;
    this.x += this.velocityX * dt;
    this.y += this.velocityY * dt;
    
    // Ground collision
    if (this.y > CANVAS_HEIGHT - this.height) {
      this.y = CANVAS_HEIGHT - this.height;
      this.velocityY = 0;
      this.onGround = true;
    }

    // Stage boundary
    this.x = Math.max(0, Math.min(this.x, STAGE_WIDTH - this.width));
  }
  
  override render(ctx: CanvasRenderingContext2D): void {
    this.playerRenderer.render(ctx);
  }
}
