import { Entity } from '../engine/Game';
import { Player } from './Player';

type EnemyState = 'idle' | 'walk' | 'attack' | 'hurt';

export class Enemy extends Entity {
  public health: number = 30;
  public damage: number = 5;
  private velocityX: number = 0;
  private velocityY: number = 0;
  private readonly GRAVITY = 800;
  private readonly MOVE_SPEED = 60;
  private readonly ATTACK_RANGE = 80;
  private readonly ATTACK_COOLDOWN = 1.5;
  private state: EnemyState = 'walk';
  private stateTimer: number = 0;
  private attackCooldown: number = 0;
  private behaviorTimer: number = 0.5;
  private attackHit: boolean = false;
  private readonly BEHAVIOR_WALK_DURATION = 1.5;
  private readonly BEHAVIOR_IDLE_DURATION = 0.8;
  private facing: number = -1;
  private currentFrame: number = 0;
  private animTimer: number = 0;
  private readonly ANIM_SPEED = 0.25;
  
  public spriteImage: HTMLImageElement | null = null;
  private readonly FRAME_WIDTH = 160;
  private readonly FRAME_HEIGHT = 192;
  
  constructor(x: number, y: number, private player: () => Player) {
    super(x, y);
    this.width = this.FRAME_WIDTH;
    this.height = this.FRAME_HEIGHT;
  }
  
  override update(dt: number): void {
    const player = this.player();
    const dx = player.x - this.x;
    this.facing = dx > 0 ? 1 : -1;
    
    this.attackCooldown -= dt;
    this.behaviorTimer -= dt;
    
    if (this.stateTimer > 0) {
      this.stateTimer -= dt;
      if (this.stateTimer <= 0 && this.state === 'hurt') {
        this.state = 'idle';
        this.velocityX = 0;
      }
    }
    
    if (this.state === 'hurt') {
      this.applyPhysics(dt);
      this.updateAnimation(dt);
      return;
    }
    
    const dist = Math.abs(dx);
    
    if (dist < this.ATTACK_RANGE && this.attackCooldown <= 0) {
      this.state = 'attack';
      this.stateTimer = 0.4;
      this.attackCooldown = this.ATTACK_COOLDOWN;
      this.velocityX = 0;
      this.behaviorTimer = 0;
      this.attackHit = false;
    } else if (this.state === 'attack' && this.currentFrame === 1 && !this.attackHit) {
      // Strike frame: deal damage to player
      this.attackHit = true;
      player.health -= this.damage;
      player.hurt();
    } else if (this.behaviorTimer <= 0) {
      // Toggle behavior: walk → idle → walk
      if (this.state === 'walk') {
        this.state = 'idle';
        this.velocityX = 0;
        this.behaviorTimer = this.BEHAVIOR_IDLE_DURATION + Math.random() * 0.5;
      } else {
        this.state = 'walk';
        this.velocityX = this.facing * this.MOVE_SPEED;
        this.behaviorTimer = this.BEHAVIOR_WALK_DURATION + Math.random() * 1.0;
      }
    } else if (this.state === 'walk') {
      this.velocityX = this.facing * this.MOVE_SPEED;
    }
    
    this.applyPhysics(dt);
    this.updateAnimation(dt);
  }
  
  private applyPhysics(dt: number): void {
    this.velocityY += this.GRAVITY * dt;
    this.x += this.velocityX * dt;
    this.y += this.velocityY * dt;
    
    if (this.y > 480 - this.height) {
      this.y = 480 - this.height;
      this.velocityY = 0;
    }
  }
  
  private updateAnimation(dt: number): void {
    if (this.state === 'walk' || this.state === 'attack') {
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
      this.active = false;
      return;
    }
    this.state = 'hurt';
    this.stateTimer = 0.2;
    this.velocityX = this.facing * -80;
  }
  
  override render(ctx: CanvasRenderingContext2D): void {
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
    
    // Map state to frame index
    let frameIdx = 0;
    if (this.state === 'idle') frameIdx = 0;
    else if (this.state === 'walk') frameIdx = 1 + this.currentFrame;
    else if (this.state === 'attack') frameIdx = 3 + this.currentFrame;
    else if (this.state === 'hurt') frameIdx = 0;
    
    // Flash effect during hurt state
    if (this.state === 'hurt') {
      ctx.globalAlpha = Math.floor(this.stateTimer * 60) % 2 === 0 ? 0.5 : 1;
    }
    
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
  }
}
