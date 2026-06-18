import { Entity } from '../engine/Game';
import { HitReactionType, Player } from './Player';
import { DebugFlags } from '../systems/DebugFlags';
import { HitboxConfig, HitboxRect, GRUNT_HITBOX, resolveFacingHitbox, rectsOverlap } from '../systems/HitboxConfig';

type EnemyState = 'idle' | 'walk' | 'attack' | 'hurt' | 'death';

export class Enemy extends Entity {
  public health: number = 30;
  public damage: number = 5;
  private velocityX: number = 0;
  private readonly MOVE_SPEED = 60;
  private readonly STOP_RANGE = 90;
  private readonly ATTACK_RANGE = 70;
  private readonly ATTACK_COOLDOWN = 1.5;
  private readonly RETREAT_RANGE = 130;
  private readonly RETREAT_SPEED = 45;
  private readonly TOO_CLOSE_RANGE = 24;
  private readonly FLANK_DISTANCE = 58;
  private readonly FLANK_SPEED = 105;
  private state: EnemyState = 'walk';
  private stateTimer: number = 0;
  private attackCooldown: number = 0;
  private behaviorTimer: number = 0.5;
  private attackHit: boolean = false;
  private attackPatternIndex: number = 0;
  private currentAttackReaction: HitReactionType = 'light';
  private flankTargetX: number | null = null;
  private readonly BEHAVIOR_WALK_DURATION = 1.5;
  private readonly BEHAVIOR_IDLE_DURATION = 0.8;
  private facing: number = -1;
  private currentFrame: number = 0;
  private animTimer: number = 0;
  private readonly ANIM_SPEED = 0.25;
  
  public spriteImage: HTMLImageElement | null = null;
  public hurtImage: HTMLImageElement | null = null;
  public onHit: ((x: number, y: number) => void) | null = null;
  public onHitStop: ((duration: number, shakeDuration?: number, shakeMagnitude?: number) => void) | null = null;
  public onDeath: ((x: number, y: number) => void) | null = null;
  get isDead(): boolean { return this.state === 'death'; }
  private targetX: number | null = null;
  private readonly FRAME_WIDTH = 160;
  private readonly FRAME_HEIGHT = 192;
  private hitboxConfig: HitboxConfig = GRUNT_HITBOX;
  
  constructor(x: number, y: number, private player: () => Player) {
    super(x, y);
    this.width = this.FRAME_WIDTH;
    this.height = this.FRAME_HEIGHT;
  }
  
  override update(dt: number): void {
    const player = this.player();
    const targetX = this.targetX ?? player.x;
    const dx = player.x - this.x;
    const dxToTarget = targetX - this.x;
    this.facing = dx > 0 ? 1 : -1;
    
    this.attackCooldown -= dt;
    this.behaviorTimer -= dt;
    
    if (this.stateTimer > 0) {
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        if (this.state === 'hurt') {
          this.state = 'idle';
          this.velocityX = 0;
        } else if (this.state === 'attack') {
          this.state = 'idle';
          this.velocityX = 0;
        } else if (this.state === 'death') {
          this.active = false;
        }
      }
    }
    
    if (this.state === 'hurt') {
      this.applyPhysics(dt);
      this.updateAnimation(dt);
      return;
    }

    if (this.state === 'death') {
      this.applyPhysics(dt);
      this.updateAnimation(dt);
      return;
    }

    if (player.isGameOver && !DebugFlags.allowPostGameOverAttacks) {
      this.flankTargetX = null;
      this.attackHit = false;
      if (Math.abs(dx) < this.RETREAT_RANGE) {
        this.state = 'walk';
        this.velocityX = -this.facing * this.RETREAT_SPEED;
      } else {
        this.state = 'idle';
        this.velocityX = 0;
      }
      this.applyPhysics(dt);
      this.updateAnimation(dt);
      return;
    }
    
    if (this.state === 'attack') {
      // Check hit on strike frame
      if (this.currentFrame === 1 && !this.attackHit) {
        const atk = this.getAttackHitbox();
        const hurt = player.getHurtHitbox();
        this.attackHit = true;
        if (atk && rectsOverlap(atk, hurt)) {
          if (player.canReceiveGroundHit || (DebugFlags.allowPostGameOverAttacks && player.canReceivePostGameHit)) {
            player.downHit(this.x, DebugFlags.allowPostGameOverAttacks);
          } else if (!player.isDefeated) {
            player.health -= this.damage;
            if (player.health <= 0) {
              player.die(this.x);
            } else {
              player.hurt(this.x, this.currentAttackReaction);
            }
          } else {
            return;
          }
          const left = Math.max(atk.x, hurt.x);
          const right = Math.min(atk.x + atk.w, hurt.x + hurt.w);
          const top = Math.max(atk.y, hurt.y);
          const bottom = Math.min(atk.y + atk.h, hurt.y + hurt.h);
          this.onHit?.((left + right) / 2, (top + bottom) / 2);
          const heavy = this.currentAttackReaction === 'guardHead';
          this.onHitStop?.(heavy ? 0.095 : 0.045, heavy ? 0.16 : 0.06, heavy ? 4 : 1.5);
        }
      }
      this.applyPhysics(dt);
      this.updateAnimation(dt);
      return;
    }
    
    const dist = Math.abs(dx);
    const targetDist = Math.abs(dxToTarget);
    if (dist < this.TOO_CLOSE_RANGE && this.flankTargetX === null) {
      const passDirection = this.x < player.x ? 1 : -1;
      this.flankTargetX = player.x + passDirection * this.FLANK_DISTANCE;
    }
    if (this.flankTargetX !== null && Math.abs(this.flankTargetX - this.x) < 8) {
      this.flankTargetX = null;
    }
    
    // Attack if within range and cooldown ready
    if (this.flankTargetX !== null) {
      this.state = 'walk';
      this.velocityX = Math.sign(this.flankTargetX - this.x) * this.FLANK_SPEED;
    } else if (dist < this.ATTACK_RANGE && this.attackCooldown <= 0) {
      this.state = 'attack';
      this.stateTimer = 0.4;
      this.animTimer = 0;
      this.currentFrame = 0;
      this.attackCooldown = this.ATTACK_COOLDOWN;
      this.velocityX = 0;
      this.attackHit = false;
      this.currentAttackReaction = this.nextAttackReaction();
    } else if (this.attackCooldown > 0 && dist < this.RETREAT_RANGE) {
      this.state = 'walk';
      this.velocityX = -this.facing * this.RETREAT_SPEED;
    } else if (dist < this.ATTACK_RANGE) {
      this.velocityX = 0;
      this.state = 'idle';
    } else if (targetDist < 12) {
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
    
    this.applyPhysics(dt);
    this.updateAnimation(dt);
  }

  setTargetX(targetX: number): void {
    this.targetX = targetX;
  }

  private nextAttackReaction(): HitReactionType {
    const pattern: HitReactionType[] = ['light', 'light', 'guardHead'];
    const reaction = pattern[this.attackPatternIndex % pattern.length];
    this.attackPatternIndex++;
    return reaction;
  }
  
  private applyPhysics(dt: number): void {
    this.x += this.velocityX * dt;
  }
  
  private updateAnimation(dt: number): void {
    if (this.state === 'hurt' || this.state === 'death') {
      this.currentFrame = 0;
      this.animTimer = 0;
    } else if (this.state === 'walk' || this.state === 'attack') {
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
    this.stateTimer = 0.2;
    this.velocityX = this.facing * -80;
  }
  
  /** Current attack hitbox in world coords, or null if not on strike frame */
  getAttackHitbox(): HitboxRect | null {
    if (this.state !== 'attack' || this.currentFrame !== 1) return null;
    return resolveFacingHitbox(this, this.hitboxConfig.hitboxes.attack, this.facing);
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
      ctx.fillStyle = '#777';
      ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      ctx.fillText(`HP:${this.health}`, this.x, this.y - 5);
      return;
    }
    
    ctx.save();
    ctx.translate(this.x + this.width / 2, 0);
    // Sprite faces left; flip scale based on direction
    ctx.scale(-this.facing, 1);
    
    if (this.state === 'death' && this.hurtImage) {
      const sx = this.currentFrame * this.FRAME_WIDTH;
      ctx.drawImage(
        this.hurtImage,
        sx, 0, this.FRAME_WIDTH, this.FRAME_HEIGHT,
        -this.width / 2, this.y, this.width, this.height,
      );
      ctx.restore();
      return;
    }

    if (this.state === 'hurt' && this.hurtImage) {
      const sx = this.currentFrame * this.FRAME_WIDTH;
      ctx.drawImage(
        this.hurtImage,
        sx, 0, this.FRAME_WIDTH, this.FRAME_HEIGHT,
        -this.width / 2, this.y, this.width, this.height,
      );
      ctx.restore();
      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      ctx.fillText(`HP:${this.health}`, this.x, this.y - 5);
      this.renderDebugHitboxes(ctx);
      return;
    }

    // Map state to frame index
    let frameIdx = 0;
    if (this.state === 'idle') frameIdx = 0;
    else if (this.state === 'walk') frameIdx = 1 + this.currentFrame;
    else if (this.state === 'attack') frameIdx = 3 + this.currentFrame;
    else if (this.state === 'hurt') frameIdx = 0;
    
    const sx = frameIdx * this.FRAME_WIDTH;
    ctx.drawImage(
      this.spriteImage,
      sx, 0, this.FRAME_WIDTH, this.FRAME_HEIGHT,
      -this.width / 2, this.y, this.width, this.height,
    );
    
    ctx.globalAlpha = 1;
    
    ctx.restore();
    
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.fillText(`HP:${this.health}`, this.x, this.y - 5);
    
    this.renderDebugHitboxes(ctx);
  }

  private renderDebugHitboxes(ctx: CanvasRenderingContext2D): void {
    if (DebugFlags.showHitboxes) {
      ctx.strokeStyle = '#f00';
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
  }

  private drawShadow(ctx: CanvasRenderingContext2D): void {
    const groundY = this.y + this.height - 8;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
    ctx.beginPath();
    ctx.ellipse(this.x + this.width / 2, groundY, 48, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
