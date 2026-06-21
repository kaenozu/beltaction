import { describe, expect, it, vi } from 'vitest';
import { ChainEnemy } from './ChainEnemy';
import { Player } from './Player';
import { ChainEnemyRenderer } from './ChainEnemyRenderer';

function createContext(): CanvasRenderingContext2D {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    ellipse: vi.fn(),
    fill: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
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
}

describe('ChainEnemyRenderer', () => {
  it('uses dedicated full-pose images for hurt and death', () => {
    const player = new Player(300, 288);
    const enemy = new ChainEnemy(100, 288, () => player);
    const spriteImage = { tag: 'sprite' } as unknown as HTMLImageElement;
    const hurtImage = { tag: 'hurt', naturalWidth: 220, naturalHeight: 192 } as unknown as HTMLImageElement;
    const deathImage = { tag: 'death', naturalWidth: 220, naturalHeight: 192 } as unknown as HTMLImageElement;
    enemy.spriteImage = spriteImage;
    enemy.hurtImage = hurtImage;
    enemy.deathImage = deathImage;
    const renderer = new ChainEnemyRenderer(enemy);
    const ctx = createContext();

    enemy.state = 'hurt';
    renderer.render(ctx);

    expect(ctx.drawImage).toHaveBeenCalledWith(
      hurtImage,
      0, 0,
      220, 192,
      expect.closeTo(-83.6), expect.closeTo(334.08),
      expect.closeTo(167.2), expect.closeTo(145.92),
    );

    (ctx.drawImage as unknown as { mockClear: () => void }).mockClear();
    enemy.takeDamage(enemy.health);
    enemy.update(0.26);
    renderer.render(ctx);

    expect(ctx.drawImage).toHaveBeenCalledWith(
      deathImage,
      0, 0,
      220, 192,
      expect.closeTo(-83.6), expect.closeTo(334.08),
      expect.closeTo(167.2), expect.closeTo(145.92),
    );
  });
});
