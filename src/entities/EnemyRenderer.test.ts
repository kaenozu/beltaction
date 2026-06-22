import { describe, expect, it, vi } from 'vitest';
import { Enemy } from './Enemy';
import { Player } from './Player';
import { EnemyRenderer } from './EnemyRenderer';

describe('EnemyRenderer', () => {
  it('flips the body blow sprite to match the regular enemy facing', () => {
    const player = new Player(300, 288);
    const enemy = new Enemy(100, 288, () => player);
    enemy.spriteImage = {} as HTMLImageElement;
    enemy.bodyBlowImage = {} as HTMLImageElement;
    enemy.state = 'bodyBlow';

    const scale = vi.fn();
    const ctx = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      ellipse: vi.fn(),
      fill: vi.fn(),
      translate: vi.fn(),
      scale,
      drawImage: vi.fn(),
      fillRect: vi.fn(),
      fillText: vi.fn(),
      strokeRect: vi.fn(),
      stroke: vi.fn(),
      set fillStyle(_value: string) {},
      set font(_value: string) {},
      set strokeStyle(_value: string) {},
      set lineWidth(_value: number) {},
    } as unknown as CanvasRenderingContext2D;

    new EnemyRenderer(enemy).render(ctx);

    expect(scale).toHaveBeenCalledTimes(2);
    expect(scale).toHaveBeenNthCalledWith(1, -enemy.facing, 1);
    expect(scale).toHaveBeenNthCalledWith(2, -1, 1);
  });

  it('hides grunt sprite during grab-followup (invisible)', () => {
    const player = new Player(300, 288);
    const enemy = new Enemy(100, 288, () => player);
    enemy.spriteImage = {} as HTMLImageElement;
    enemy.bodyBlowImage = {} as HTMLImageElement;
    enemy.state = 'grabFollowup';

    const scale = vi.fn();
    const drawImage = vi.fn();
    const ctx = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      ellipse: vi.fn(),
      fill: vi.fn(),
      translate: vi.fn(),
      scale,
      drawImage,
      fillRect: vi.fn(),
      fillText: vi.fn(),
      strokeRect: vi.fn(),
      stroke: vi.fn(),
      set fillStyle(_value: string) {},
      set font(_value: string) {},
      set strokeStyle(_value: string) {},
      set lineWidth(_value: number) {},
    } as unknown as CanvasRenderingContext2D;

    new EnemyRenderer(enemy).render(ctx);

    // Grunt is invisible during grabFollowup → scale only from setup, no draw
    expect(scale).toHaveBeenCalledTimes(1);
    expect(drawImage).not.toHaveBeenCalled();
  });

  it('hides grunt sprite during chain-grapple grab-followup (invisible)', () => {
    const player = new Player(300, 288);
    const enemy = new Enemy(100, 288, () => player);
    enemy.spriteImage = {} as HTMLImageElement;
    enemy.bodyBlowImage = {} as HTMLImageElement;
    enemy.state = 'grabFollowup';
    enemy.mirrorGrabFollowupBodyBlow = true;

    const scale = vi.fn();
    const drawImage = vi.fn();
    const ctx = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      ellipse: vi.fn(),
      fill: vi.fn(),
      translate: vi.fn(),
      scale,
      drawImage,
      fillRect: vi.fn(),
      fillText: vi.fn(),
      strokeRect: vi.fn(),
      stroke: vi.fn(),
      set fillStyle(_value: string) {},
      set font(_value: string) {},
      set strokeStyle(_value: string) {},
      set lineWidth(_value: number) {},
    } as unknown as CanvasRenderingContext2D;

    new EnemyRenderer(enemy).render(ctx);

    // Grunt is invisible during grabFollowup → scale only from setup, no draw
    expect(scale).toHaveBeenCalledTimes(1);
    expect(drawImage).not.toHaveBeenCalled();
  });
});
