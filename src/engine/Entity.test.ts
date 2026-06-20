import { describe, it, expect } from 'vitest';
import { Entity } from './Entity';

describe('Entity', () => {
  it('creates with default values', () => {
    const e = new Entity();
    expect(e.x).toBe(0);
    expect(e.y).toBe(0);
    expect(e.width).toBe(32);
    expect(e.height).toBe(48);
    expect(e.active).toBe(true);
    expect(e.zIndex).toBe(0);
  });

  it('creates with initial position', () => {
    const e = new Entity(100, 200);
    expect(e.x).toBe(100);
    expect(e.y).toBe(200);
  });

  it('update is a no-op by default', () => {
    const e = new Entity();
    expect(() => e.update(0.016)).not.toThrow();
  });

  it('render is a no-op by default', () => {
    const e = new Entity();
    const ctx = {} as CanvasRenderingContext2D;
    expect(() => e.render(ctx)).not.toThrow();
  });

  it('can be deactivated', () => {
    const e = new Entity();
    e.active = false;
    expect(e.active).toBe(false);
  });
});
