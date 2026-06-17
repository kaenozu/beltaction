import { Entity } from '../engine/Game';
import { InputState } from '../engine/InputManager';
import { DebugFlags } from '../systems/DebugFlags';
import { HitboxConfig, HitboxRect, MAKI_HITBOX, resolveFacingHitbox } from '../systems/HitboxConfig';

export class Player extends Entity {
  private inputState!: InputState;
  public health: number = 100;
  public velocityX: number = 0;
  public velocityY: number = 0;
  private onGround: boolean = true;
  private facing: number = 1;
  state: 'idle' | 'walk' | 'jump' | 'attack' | 'hurt' | 'death' | 'down' | 'downhit' = 'idle';
  onDeath: (() => void) | null = null;
  private stateTimer: number = 0;
  private groundHitCount: number = 0;
  private postGameGroundHitCount: number = 0;
  private downGraceTimer: number = 0;
  private gameOverAnnounced: boolean = false;
  private readonly MAX_GROUND_HITS = 1;
  private readonly POST_GAME_DEATH_REPLAY_HITS = 3;
  private readonly DOWN_GRACE_DURATION = 1.0;
  private readonly GRAVITY = 1200;
  private readonly MOVE_SPEED = 220;
  private readonly JUMP_FORCE = -500;
  
  public spriteImage: HTMLImageElement | null = null;
  public idleImage: HTMLImageElement | null = null;
  public attackImage: HTMLImageElement | null = null;
  public jumpImage: HTMLImageElement | null = null;
  public hurtImage: HTMLImageElement | null = null;
  public downImage: HTMLImageElement | null = null;
  public downHitImage: HTMLImageElement | null = null;
  private readonly FRAME_WIDTH = 160;
  private readonly FRAME_HEIGHT = 192;
  currentFrame: number = 0;
  private animTimer: number = 0;
  private readonly WALK_FRAME_COUNT = 4;
  private readonly HURT_FRAME_COUNT = 3;
  private readonly ANIM_SPEED = 0.15;
  private prevAttack: boolean = false;
  private rapidCount: number = 0;
  private nextHurtFrame: number = 0;
  private hitboxConfig: HitboxConfig = MAKI_HITBOX;
  private readonly DOWN_SOURCE = { x: 33, y: 622, w: 1542, h: 302 };
  private readonly DOWN_HIT_SOURCE = { x: 32, y: 275, w: 1706, h: 489 };
  private readonly DOWN_DRAW_WIDTH = 190;
  private readonly DOWN_HIT_DRAW_WIDTH = 190;
  private readonly DOWN_DRAW_HEIGHT = 52;
  private readonly DOWN_HIT_DRAW_HEIGHT = 56;
  get isDefeated(): boolean { return this.health <= 0 && (this.state === 'death' || this.state === 'down' || this.state === 'downhit'); }
  get isGameOver(): boolean { return this.gameOverAnnounced; }
  get canReceiveGroundHit(): boolean {
    return this.health <= 0 && this.state === 'down' && !this.gameOverAnnounced && this.groundHitCount < this.MAX_GROUND_HITS;
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
    this.updateDownGrace(dt);
    this.applyPhysics(dt);
    this.updateAnimation(dt);
  }
  
  private updateAnimation(dt: number): void {
    if (this.state === 'walk') {
      this.animTimer += dt;
      if (this.animTimer >= this.ANIM_SPEED) {
        this.animTimer = 0;
        this.currentFrame = (this.currentFrame + 1) % this.WALK_FRAME_COUNT;
      }
    } else if (this.state === 'attack') {
      // Fast 2-frame: wind-up then strike
      const frameDuration = this.stateTimer / 2;
      this.currentFrame = this.animTimer >= frameDuration ? 1 : 0;
      this.animTimer += dt;
    } else if (this.state === 'hurt') {
      this.animTimer = 0;
    } else {
      this.currentFrame = 0;
      this.animTimer = 0;
    }
  }
  
  private handleInput(): void {
    if (this.state === 'hurt' || this.state === 'attack' || this.state === 'death' || this.state === 'down' || this.state === 'downhit') return;
    
    // Horizontal movement
    if (this.inputState.left) {
      this.velocityX = -this.MOVE_SPEED;
      this.facing = -1;
      if (this.onGround) this.state = 'walk';
    } else if (this.inputState.right) {
      this.velocityX = this.MOVE_SPEED;
      this.facing = 1;
      if (this.onGround) this.state = 'walk';
    } else {
      this.velocityX = 0;
      if (this.onGround) this.state = 'idle';
    }
    
    // Jump
    if (this.inputState.up && this.onGround) {
      this.velocityY = this.JUMP_FORCE;
      this.onGround = false;
      this.state = 'jump';
    }
    
    // Attack (edge trigger: only on key down, not held)
    const attackDown = this.inputState.attack && !this.prevAttack;
    this.prevAttack = this.inputState.attack;
    if (attackDown && this.onGround) {
      this.state = 'attack';
      this.animTimer = 0;
      this.rapidCount++;
      // Each rapid press makes attack faster (0.3 → 0.15 min)
      this.stateTimer = Math.max(0.12, 0.3 - this.rapidCount * 0.03);
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
          this.state = 'down';
          this.velocityX = 0;
          this.velocityY = 0;
          this.downGraceTimer = this.DOWN_GRACE_DURATION;
          return;
        } else if (this.state === 'downhit') {
          this.state = 'down';
          this.velocityX = 0;
          this.announceGameOver();
          return;
        }
        this.velocityX = 0;
        this.state = this.onGround ? 'idle' : 'jump';
      }
    }
  }

  private updateDownGrace(dt: number): void {
    if (this.health > 0 || this.state !== 'down' || this.gameOverAnnounced) return;
    this.downGraceTimer = Math.max(0, this.downGraceTimer - dt);
    if (this.downGraceTimer <= 0) this.announceGameOver();
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
    this.state = 'death';
    this.stateTimer = 0.5;
    this.groundHitCount = 0;
    this.postGameGroundHitCount = 0;
    this.downGraceTimer = 0;
    this.gameOverAnnounced = false;
    this.animTimer = 0;
    this.currentFrame = 0;
    this.velocityX = fromX > this.x ? -120 : 120;
    this.velocityY = -250;
    this.facing = fromX > this.x ? 1 : -1;
  }

  public downHit(fromX: number, force: boolean = false): void {
    if (!force && !this.canReceiveGroundHit) return;
    if (force && !this.canReceivePostGameHit) return;
    if (force) {
      this.postGameGroundHitCount++;
      if (this.postGameGroundHitCount >= this.POST_GAME_DEATH_REPLAY_HITS) {
        this.replayDeathFromGround(fromX);
        return;
      }
    }
    this.state = 'downhit';
    this.stateTimer = 0.3;
    if (!force) this.groundHitCount++;
    this.animTimer = 0;
    this.currentFrame = 0;
    this.velocityX = fromX > this.x ? -60 : 60;
    this.facing = fromX > this.x ? 1 : -1;
  }

  private replayDeathFromGround(fromX: number): void {
    this.postGameGroundHitCount = 0;
    this.state = 'death';
    this.stateTimer = 0.45;
    this.animTimer = 0;
    this.currentFrame = 0;
    this.velocityX = fromX > this.x ? -140 : 140;
    this.velocityY = -230;
    this.facing = fromX > this.x ? 1 : -1;
  }

  public hurt(fromX?: number): void {
    this.state = 'hurt';
    this.stateTimer = 0.4;
    this.animTimer = 0;
    this.currentFrame = this.nextHurtFrame;
    this.nextHurtFrame = (this.nextHurtFrame + 1) % this.HURT_FRAME_COUNT;
    if (fromX !== undefined) {
      this.facing = fromX > this.x ? 1 : -1;
      this.velocityX = fromX > this.x ? -200 : 200;
    } else {
      this.velocityX = 0;
    }
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
    ctx.save();
    ctx.translate(this.x + this.width / 2, 0);
    ctx.scale(this.facing, 1);

    if (this.state === 'idle' && this.idleImage) {
      ctx.drawImage(this.idleImage, -this.width / 2, this.y, this.width, this.height);
    } else if (this.state === 'walk' && this.spriteImage) {
      const sx = this.currentFrame * this.FRAME_WIDTH;
      ctx.drawImage(
        this.spriteImage,
        sx, 0, this.FRAME_WIDTH, this.FRAME_HEIGHT,
        -this.width / 2, this.y, this.width, this.height,
      );
    } else if (this.state === 'attack' && this.attackImage) {
      const sx = this.currentFrame * this.FRAME_WIDTH;
      ctx.drawImage(
        this.attackImage,
        sx, 0, this.FRAME_WIDTH, this.FRAME_HEIGHT,
        -this.width / 2, this.y, this.width, this.height,
      );
    } else if (this.state === 'jump' && this.jumpImage) {
      ctx.drawImage(this.jumpImage, -this.width / 2, this.y, this.width, this.height);
    } else if ((this.state === 'hurt' || this.state === 'death') && this.hurtImage) {
      const sx = this.currentFrame * this.FRAME_WIDTH;
      const s = this.state === 'death' ? 1.2 : 1.15;
      ctx.drawImage(
        this.hurtImage,
        sx, 0, this.FRAME_WIDTH, this.FRAME_HEIGHT,
        -this.width * s / 2, this.y - this.height * (s - 1),
        this.width * s, this.height * s,
      );
    } else if (this.state === 'down' && this.downImage) {
      this.drawGroundedSprite(ctx, this.downImage, this.DOWN_SOURCE, this.DOWN_DRAW_WIDTH, this.DOWN_DRAW_HEIGHT);
    } else if (this.state === 'downhit' && this.downHitImage) {
      this.drawGroundedSprite(ctx, this.downHitImage, this.DOWN_HIT_SOURCE, this.DOWN_HIT_DRAW_WIDTH, this.DOWN_HIT_DRAW_HEIGHT);
    } else if (this.idleImage) {
      ctx.drawImage(this.idleImage, -this.width / 2, this.y, this.width, this.height);
    } else {
      ctx.fillStyle = this.name === 'Maki' ? '#ff6b6b' : '#4dabf7';
      ctx.fillRect(-this.width / 2, this.y, this.width, this.height);
    }
    ctx.restore();
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.fillText(`${this.state.toUpperCase()} [${this.currentFrame}] r=${this.rapidCount}`, this.x, this.y - 5);
    
    // Debug: collision box
    if (DebugFlags.showHitboxes) {
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
  }

  private drawGroundedSprite(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    source: { x: number; y: number; w: number; h: number },
    drawWidth: number,
    drawHeight: number,
  ): void {
    ctx.drawImage(
      image,
      source.x, source.y, source.w, source.h,
      -drawWidth / 2, this.y + this.height - drawHeight,
      drawWidth, drawHeight,
    );
  }
}
