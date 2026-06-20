import { describe, it, expect } from 'vitest';
import { rectsOverlap, resolveFacingHitbox, parseHitboxConfig } from './HitboxConfig';

describe('rectsOverlap', () => {
  const a = { x: 10, y: 10, w: 20, h: 20 };

  it('returns true when rectangles overlap', () => {
    expect(rectsOverlap(a, { x: 25, y: 15, w: 10, h: 10 })).toBe(true);
  });

  it('returns false when rectangles do not overlap', () => {
    expect(rectsOverlap(a, { x: 100, y: 100, w: 10, h: 10 })).toBe(false);
  });

  it('returns true when one rectangle contains another', () => {
    expect(rectsOverlap(a, { x: 15, y: 15, w: 5, h: 5 })).toBe(true);
  });

  it('returns false when rectangles touch edge-to-edge', () => {
    expect(rectsOverlap(a, { x: 30, y: 10, w: 10, h: 10 })).toBe(false);
  });

  it('returns true when rectangles share an edge (touching)', () => {
    expect(rectsOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 10, h: 10 })).toBe(false);
  });
});

describe('resolveFacingHitbox', () => {
  const entity = { x: 100, y: 50, width: 160 };

  it('returns hitbox in world coords when facing right', () => {
    const result = resolveFacingHitbox(entity, { x: 34, y: 10, w: 92, h: 176 }, 1);
    expect(result).toEqual({ x: 134, y: 60, w: 92, h: 176 });
  });

  it('mirrors hitbox when facing left', () => {
    const result = resolveFacingHitbox(entity, { x: 34, y: 10, w: 92, h: 176 }, -1);
    expect(result).toEqual({ x: 100 + 160 - 34 - 92, y: 60, w: 92, h: 176 });
  });

  it('handles non-centered hitbox correctly when facing left', () => {
    const result = resolveFacingHitbox(entity, { x: 112, y: 46, w: 34, h: 26 }, -1);
    expect(result).toEqual({ x: 100 + 160 - 112 - 34, y: 96, w: 34, h: 26 });
  });
});

describe('parseHitboxConfig', () => {
  it('parses valid JSON config', () => {
    const json = JSON.stringify({
      frameWidth: 160,
      frameHeight: 192,
      frames: 2,
      hitboxes: {
        body: { x: 30, y: 14, w: 100, h: 176 },
        hurt: { x: 24, y: 12, w: 112, h: 180 },
        attack: { x: 92, y: 42, w: 48, h: 84 },
      },
    });
    const config = parseHitboxConfig(json);
    expect(config).not.toBeNull();
    expect(config!.frameWidth).toBe(160);
    expect(config!.hitboxes.attack.w).toBe(48);
  });

  it('returns null for invalid JSON', () => {
    expect(parseHitboxConfig('not json')).toBeNull();
  });

  it('returns null when missing required fields', () => {
    const json = JSON.stringify({ frameWidth: 160 });
    expect(parseHitboxConfig(json)).toBeNull();
  });
});
