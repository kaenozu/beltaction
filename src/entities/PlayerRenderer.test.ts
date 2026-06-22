import { describe, expect, it, vi } from 'vitest';
import { Player } from './Player';
import { PlayerRenderer } from './PlayerRenderer';

function createMockContext(): CanvasRenderingContext2D & { transform: ReturnType<typeof vi.fn> } {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    transform: vi.fn(),
    drawImage: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    ellipse: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    set fillStyle(_value: string) {},
    set font(_value: string) {},
    set strokeStyle(_value: string) {},
    set lineWidth(_value: number) {},
    set globalAlpha(_value: number) {},
  } as unknown as CanvasRenderingContext2D & { transform: ReturnType<typeof vi.fn> };
}

describe('PlayerRenderer', () => {
  it('renders bound body blow hurt sprite without skew', () => {
    const player = new Player(100, 288);
    player.hurtImage = {} as HTMLImageElement;
    player.grabbedImage = null;
    player.startBound(300, 1, 165, 0);
    player.startChainWrapped(1.5);
    player.receiveBoundBodyBlow(300, 7);
    const ctx = createMockContext();

    new PlayerRenderer(player).render(ctx);

    expect(ctx.drawImage).toHaveBeenCalled();
  });

  it('renders wide grabbed composite sprites without squashing them to the player width', () => {
    const player = new Player(100, 288);
    // 480 = 2 logical frames at 240 source width
    const grabbedImage = { naturalWidth: 480, width: 480 } as HTMLImageElement;
    player.grabbedImage = grabbedImage;
    player.startGrabbed(60);
    const ctx = createMockContext();

    new PlayerRenderer(player).render(ctx);

    expect(ctx.drawImage).toHaveBeenCalledWith(
      grabbedImage,
      0,
      0,
      480,
      288,
      -160,
      player.y,
      320,
      192,
    );
  });

  it('renders the mount punch victim sprite for mount down-hit reactions', () => {
    const player = new Player(100, 288);
    const mountPunchImage = {} as HTMLImageElement;
    player.downHitImage = {} as HTMLImageElement;
    player.mountPunchImage = mountPunchImage;
    player.tripDown(220);
    player.downHit(220, false, 0, 'mount');
    const ctx = createMockContext();

    new PlayerRenderer(player).render(ctx);

    expect(ctx.drawImage).toHaveBeenCalledWith(
      mountPunchImage,
      0,
      0,
      320,
      192,
      -56,
      player.y + player.height - 135,
      112,
      135,
    );
  });
});
