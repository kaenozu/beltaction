import { Entity } from '../engine/Game';
import { InputState } from '../engine/InputManager';

export class Player extends Entity {
  private inputState!: InputState;
  public health: number = 100;
  public velocityX: number = 0;
  public velocityY: number = 0;
  private onGround: boolean = true;
  private facing: number = 1;
  state: 'idle' | 'walk' | 'jump' | 'attack' | 'hurt' = 'idle';
  private stateTimer: number = 0;
  private readonly GRAVITY = 1200;
  private readonly MOVE_SPEED = 220;
  private readonly JUMP_FORCE = -500;
  
  public spriteImage: HTMLImageElement | null = null;
  public idleImage: HTMLImageElement | null = null;
  public attackImage: HTMLImageElement | null = null;
  public jumpImage: HTMLImageElement | null = null;
  public hurtImage: HTMLImageElement | null = null;
  private readonly FRAME_WIDTH = 160;
  private readonly FRAME_HEIGHT = 192;
  currentFrame: number = 0;
  private animTimer: number = 0;
  private readonly WALK_FRAME_COUNT = 4;
  private readonly ANIM_SPEED = 0.15;
  private prevAttack: boolean = false;
  private rapidCount: number = 0;
  
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
    } else {
      this.currentFrame = 0;
      this.animTimer = 0;
    }
  }
  
  private handleInput(): void {
    if (this.state === 'hurt' || this.state === 'attack') return;
    
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
        }
        this.velocityX = 0;
        this.state = this.onGround ? 'idle' : 'jump';
      }
    }
  }
  
  public hurt(): void {
    if (this.state === 'hurt') return; // Invincible during hurt
    this.state = 'hurt';
    this.stateTimer = 0.15;
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
    } else if (this.state === 'hurt' && this.hurtImage) {
      ctx.drawImage(this.hurtImage, -this.width / 2, this.y, this.width, this.height);
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
  }
}