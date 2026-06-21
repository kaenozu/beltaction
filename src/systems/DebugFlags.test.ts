import { describe, it, expect } from 'vitest';
import { DebugFlags } from './DebugFlags';

describe('DebugFlags', () => {
  it('has correct default values', () => {
    expect(DebugFlags.showHitboxes).toBe(false);
    expect(DebugFlags.allowPostGameOverAttacks).toBe(true);
    expect(DebugFlags.noPlayerHpDamage).toBe(false);
  });

  it('allows toggling flags', () => {
    DebugFlags.showHitboxes = true;
    expect(DebugFlags.showHitboxes).toBe(true);
    DebugFlags.showHitboxes = false;
    expect(DebugFlags.showHitboxes).toBe(false);
  });
});
