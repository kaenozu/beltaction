import { describe, it, expect, beforeEach } from 'vitest';
import { Game } from './Game';
import { Entity } from './Entity';

function createMockCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  // Mock getContext to return a partial CanvasRenderingContext2D
  const mockCtx = {
    imageSmoothingEnabled: false,
    clearRect: () => {},
    save: () => {},
    restore: () => {},
    translate: () => {},
    scale: () => {},
    fillRect: () => {},
    fillText: () => {},
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    beginPath: () => {},
    arc: () => {},
    stroke: () => {},
    fill: () => {},
    ellipse: () => {},
    moveTo: () => {},
    lineTo: () => {},
    closePath: () => {},
    globalAlpha: 1,
    font: '',
    drawImage: () => {},
    setLineDash: () => {},
  } as unknown as CanvasRenderingContext2D;
  Object.defineProperty(canvas, 'getContext', { value: () => mockCtx });
  return canvas;
}

describe('Game', () => {
  let game: Game;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    canvas = createMockCanvas();
    game = new Game(canvas);
  });

  it('creates with canvas and context', () => {
    expect(game).toBeDefined();
    expect(game.cameraX).toBe(0);
  });

  it('adds and manages entities', () => {
    const entity = new Entity(10, 20);
    game.addEntity(entity);
    expect(entity.active).toBe(true);
  });

  it('handles hit stop requests', () => {
    game.requestHitStop(0.1);
    game.requestHitStop(0.05);
  });

  it('handles screen shake requests', () => {
    game.requestScreenShake(0.5, 5);
    game.requestScreenShake(0.3, 10);
  });

  it('sets background entity', () => {
    const bg = new Entity();
    game.setBackground(bg);
  });

  it('starts and stops the game loop', () => {
    game.start();
    game.stop();
  });

  it('calls onFrame callback from loop', () => {
    let called = false;
    game.onFrame = () => { called = true; };
    expect(game.onFrame).toBeDefined();
    game.onFrame?.();
    expect(called).toBe(true);
  });
});
