/*
 * src/entities/ChainEnemy.ts
 * チェーン敵（中ボス的な位置づけ）のAI・状態管理・描画
 * 鎖攻撃・縛り引き寄せ・スイープなど特殊行動を持つ
 * 関連: Entity.ts, Player.ts（ターゲット）, SpawnSystem.ts（生成）
 */

import { Entity } from '../engine/Entity';
import { Player } from './Player';
import { DebugFlags } from '../systems/DebugFlags';
import { GRUNT_HITBOX, HitboxConfig, HitboxRect, rectsOverlap, resolveFacingHitbox } from '../systems/HitboxConfig';

type ChainEnemyState = 'idle' | 'walk' | 'chainShot' | 'boundPull' | 'lowSweep' | 'downDrag' | 'hurt' | 'death';

export class ChainEnemy extends Entity {
  public health: number = 38;
  public spriteImage: HTMLImageElement | null = null;
  public hurtImage: HTMLImageElement | null = null;
  public heavyAttackImage: HTMLImageElement | null = null;
  public bodyBlowImage: HTMLImageElement | null = null;
  public chainImage: HTMLImageElement | null = null;
  public useFallbackDetails: boolean = false;
  public onHit: ((x: number, y: number, overlay?: boolean) => void) | null = null;
  public onHitStop: ((duration: number, shakeDuration?: number, shakeMagnitude?: number) => void) | null = null;
  public onDeath: ((x: number, y: number) => void) | null = null;

  private state: ChainEnemyState = 'walk';
  private stateTimer: number = 0;
  private velocityX: number = 0;
  private attackCooldown: number = 1.0;
  private chainCooldown: number = 1.4;
  private attackHit: boolean = false;
  private targetX: number | null = null;
  private facing: number = -1;
  private currentFrame: number = 0;
  private animTimer: number = 0;
  private attackDuration: number = 0;
  private chainTargetX: number = 0;
  private chainTargetY: number = 0;
  private readonly FRAME_WIDTH = 160;
  private readonly SPRITE_FRAME_WIDTH = 220;
  private readonly FRAME_HEIGHT = 192;
  private readonly MOVE_SPEED = 72;
  private readonly STOP_RANGE = 150;
  private readonly CHAIN_MIN_RANGE = 112;
  private readonly CHAIN_MAX_RANGE = 270;
  private readonly SWEEP_RANGE = 58;
  private readonly DOWN_DRAG_RANGE = 142;
  private readonly ATTACK_COOLDOWN = 1.35;
  private readonly CHAIN_COOLDOWN = 3.1;
  private readonly CHAIN_BIND_DURATION = 0.82;
  private readonly CHAIN_PULL_SPEED = 165;
  private readonly CHAIN_DAMAGE = 3;
  private readonly CHAIN_HITBOX_THICKNESS = 18;
  private readonly SWEEP_DAMAGE = 8;
  private readonly DOWN_DRAG_DAMAGE = 6;
  private readonly ANIM_SPEED = 0.24;
  private readonly SWEEP_HITBOX: HitboxRect = { x: 72, y: 120, w: 82, h: 36 };
  private hitboxConfig: HitboxConfig = GRUNT_HITBOX;

  get isDead(): boolean { return this.state === 'death'; }
  get isBodyBlowGrappler(): boolean { return false; }
  get isGrapplingPlayer(): boolean { return this.state === 'boundPull'; }

  constructor(x: number, y: number, private player: () => Player) {
    super(x, y);
    this.width = this.FRAME_WIDTH;
    this.height = this.FRAME_HEIGHT;
  }

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
      this.applyPhysics(dt);
      this.updateAnimation(dt);
      return;
    }

    if (this.state === 'boundPull') {
      this.velocityX = 0;
      player.pullBoundToward(this.x + this.width / 2, dt);
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

    if (player.canReceiveGroundHit && dist < this.DOWN_DRAG_RANGE && this.attackCooldown <= 0) {
      this.startAttack('downDrag', 0.52, this.ATTACK_COOLDOWN);
    } else if (player.canBeBound && dist >= this.CHAIN_MIN_RANGE && dist <= this.CHAIN_MAX_RANGE && this.chainCooldown <= 0) {
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

  takeDamage(amount: number): void {
    this.health -= amount;
    if (this.health <= 0) {
      this.state = 'death';
      this.stateTimer = 0.5;
      this.velocityX = this.facing * -120;
      this.attackHit = false;
      this.onDeath?.(this.x + this.width / 2, this.y + this.height / 3);
      return;
    }
    this.state = 'hurt';
    this.stateTimer = 0.22;
    this.velocityX = this.facing * -88;
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
    this.drawShadow(ctx);

    if (!this.spriteImage) {
      ctx.fillStyle = '#465842';
      ctx.fillRect(this.x, this.y, this.width, this.height);
      this.drawChain(ctx);
      this.renderLabels(ctx);
      return;
    }

    const image = this.state === 'hurt' && this.hurtImage ? this.hurtImage : this.spriteImage;
    const frameIdx = this.getFrameIndex();
    const sx = frameIdx * this.SPRITE_FRAME_WIDTH;

    ctx.save();
    ctx.translate(this.x + this.width / 2, 0);
    ctx.scale(-this.facing, 1);
    ctx.drawImage(
      image,
      sx, 0, this.SPRITE_FRAME_WIDTH, this.FRAME_HEIGHT,
      -this.SPRITE_FRAME_WIDTH / 2, this.y, this.SPRITE_FRAME_WIDTH, this.height,
    );
    ctx.restore();

    if (this.useFallbackDetails) this.drawSignatureDetails(ctx);
    this.drawChain(ctx);
    this.renderLabels(ctx);
    this.renderDebugHitboxes(ctx);
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
    this.stateTimer -= dt;
    if (this.stateTimer > 0) return;

    if (this.state === 'boundPull') {
      this.player().releaseBound();
      this.state = 'idle';
      this.attackCooldown = this.ATTACK_COOLDOWN;
      return;
    }
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
      if (player.startBound(this.x + this.width / 2, this.CHAIN_BIND_DURATION, this.CHAIN_PULL_SPEED, this.CHAIN_DAMAGE)) {
        this.state = 'boundPull';
        this.stateTimer = this.CHAIN_BIND_DURATION;
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
    if (this.state === 'hurt' || this.state === 'death') {
      this.currentFrame = this.state === 'death' ? 1 : 0;
      this.animTimer = 0;
      return;
    }
    if (this.state === 'idle') {
      this.currentFrame = 0;
      this.animTimer = 0;
      return;
    }
    this.animTimer += dt;
    if (this.animTimer >= this.ANIM_SPEED) {
      this.animTimer = 0;
      this.currentFrame = (this.currentFrame + 1) % 2;
    }
  }

  private getFrameIndex(): number {
    if (this.state === 'idle') return 0;
    if (this.state === 'walk') return 1 + this.currentFrame;
    if (this.state === 'hurt') return this.currentFrame;
    if (this.state === 'death') return 4;
    return 3 + this.currentFrame;
  }

  private applyPhysics(dt: number): void {
    this.x += this.velocityX * dt;
    this.x = Math.max(0, Math.min(this.x, 2000 - this.width));
  }

  private drawChain(ctx: CanvasRenderingContext2D): void {
    if (this.state !== 'chainShot' && this.state !== 'boundPull' && this.state !== 'downDrag') return;
    const anchor = this.getChainAnchor();
    const progress = this.getChainDrawProgress();
    if (progress <= 0) return;
    const startX = anchor.x;
    const startY = anchor.y;
    const endX = startX + (this.chainTargetX - startX) * progress;
    const endY = startY + (this.chainTargetY - startY) * progress;
    if (this.chainImage) {
      this.drawSpriteChain(ctx, startX, startY, endX, endY);
      return;
    }
    ctx.save();
    ctx.strokeStyle = '#b7c0aa';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 5]);
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = '#4b554a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(startX, startY + 4);
    ctx.lineTo(endX, endY + 4);
    ctx.stroke();
    ctx.restore();
  }

  private getChainAnchor(): { x: number; y: number } {
    if (this.state === 'chainShot' || this.state === 'boundPull') {
      const windup = this.state === 'chainShot' && this.currentFrame === 0;
      return {
        x: this.x + this.width / 2 + this.facing * 10,
        y: this.y + (windup ? 52 : 76),
      };
    }
    if (this.state === 'downDrag') {
      return {
        x: this.x + this.width / 2 + this.facing * 54,
        y: this.y + 128,
      };
    }
    return {
      x: this.x + this.width / 2 + this.facing * 66,
      y: this.y + 86,
    };
  }

  private getChainHitboxBase(): { x: number; y: number } {
    if (this.state === 'chainShot') {
      return {
        x: this.x + this.width / 2 + this.facing * 10,
        y: this.y + 76,
      };
    }
    return this.getChainAnchor();
  }

  private getChainDrawProgress(): number {
    if (this.state === 'boundPull') return 1;
    if (this.state === 'downDrag') return this.easeOut(Math.min(1, this.getAttackElapsedRatio() / 0.55));
    if (this.state !== 'chainShot') return 0;
    if (this.currentFrame === 0) return 0;
    return this.easeOut(Math.min(1, this.animTimer / (this.ANIM_SPEED * 0.65)));
  }

  private getAttackElapsedRatio(): number {
    if (this.attackDuration <= 0) return 1;
    return Math.max(0, Math.min(1, 1 - this.stateTimer / this.attackDuration));
  }

  private easeOut(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  private drawSpriteChain(ctx: CanvasRenderingContext2D, startX: number, startY: number, endX: number, endY: number): void {
    if (!this.chainImage) return;

    const dx = endX - startX;
    const dy = endY - startY;
    const length = Math.hypot(dx, dy);
    if (length < 12) return;

    const tileW = 32;
    const tipW = 48;
    const h = 18;
    const bodyLength = Math.max(0, length - tipW + 8);

    ctx.save();
    ctx.translate(startX, startY);
    ctx.rotate(Math.atan2(dy, dx));

    for (let x = 0; x < bodyLength; x += tileW) {
      const drawW = Math.min(tileW, bodyLength - x + 4);
      ctx.drawImage(this.chainImage, 0, 0, tileW, h, x, -h / 2, drawW, h);
    }

    ctx.drawImage(this.chainImage, tileW, 0, tipW, h, Math.max(0, length - tipW), -h / 2, tipW, h);
    ctx.restore();
  }

  private drawSignatureDetails(ctx: CanvasRenderingContext2D): void {
    const centerX = this.x + this.width / 2;
    const headY = this.y + 36;
    const torsoY = this.y + 82;
    const hipY = this.y + 126;
    const facingOffset = this.facing * 18;

    ctx.save();

    // Hood and mask: makes the chain enemy read differently from the base grunt sprite.
    ctx.fillStyle = '#1a3024';
    ctx.beginPath();
    ctx.ellipse(centerX, headY + 12, 31, 35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#101915';
    ctx.fillRect(centerX - 18, headY + 2, 36, 28);
    ctx.fillStyle = '#d8e9b8';
    ctx.fillRect(centerX + this.facing * 5 - 10, headY + 13, 7, 3);
    ctx.fillRect(centerX + this.facing * 5 + 6, headY + 13, 7, 3);

    // Rusted shoulder plates and a diagonal strap.
    ctx.fillStyle = '#6f684d';
    ctx.fillRect(centerX - 45, torsoY - 10, 28, 12);
    ctx.fillRect(centerX + 17, torsoY - 10, 28, 12);
    ctx.strokeStyle = '#2a1d16';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(centerX - 35, torsoY - 4);
    ctx.lineTo(centerX + 35, hipY + 10);
    ctx.stroke();

    // Coiled chain at the waist, visible even when idle/walking.
    ctx.strokeStyle = '#c8c2a5';
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.ellipse(centerX - 18 + i * 12, hipY, 8, 5, -0.2, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Chain hand/gauntlet. During attacks, it glints so the wind-up is easier to read.
    const handX = centerX + facingOffset + this.facing * 28;
    const handY = torsoY + 22;
    const attacking = this.state === 'chainShot' || this.state === 'boundPull' || this.state === 'downDrag';
    ctx.fillStyle = attacking ? '#e5d283' : '#8f8262';
    ctx.fillRect(handX - 8, handY - 7, 16, 14);
    ctx.strokeStyle = attacking ? '#fff0a5' : '#4b554a';
    ctx.lineWidth = attacking ? 3 : 2;
    ctx.beginPath();
    ctx.arc(handX + this.facing * 10, handY, 12, -0.8, 0.9);
    ctx.stroke();

    if (this.state === 'lowSweep') {
      ctx.strokeStyle = '#d0c58d';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(centerX + this.facing * 18, this.y + 150);
      ctx.lineTo(centerX + this.facing * 74, this.y + 162);
      ctx.stroke();
    }

    ctx.restore();
  }

  private renderLabels(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#d9f5d4';
    ctx.font = '10px monospace';
    ctx.fillText(`CHAIN HP:${this.health}`, this.x, this.y - 5);
  }

  private renderDebugHitboxes(ctx: CanvasRenderingContext2D): void {
    if (!DebugFlags.showHitboxes) return;
    ctx.strokeStyle = '#8f8';
    ctx.lineWidth = 1;
    const body = this.getBodyHitbox();
    ctx.strokeRect(body.x, body.y, body.w, body.h);
    ctx.strokeStyle = '#0ff';
    const hurt = this.getHurtHitbox();
    ctx.strokeRect(hurt.x, hurt.y, hurt.w, hurt.h);
    const atk = this.getAttackHitbox();
    if (atk) {
      ctx.strokeStyle = '#fd0';
      ctx.lineWidth = 2;
      ctx.strokeRect(atk.x, atk.y, atk.w, atk.h);
    }
  }

  private drawShadow(ctx: CanvasRenderingContext2D): void {
    const groundY = this.y + this.height - 8;
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
    ctx.beginPath();
    ctx.ellipse(this.x + this.width / 2, groundY, 50, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
