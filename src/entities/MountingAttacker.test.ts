import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DebugFlags } from '../systems/DebugFlags';
import { Player } from './Player';
import { MountingAttacker } from './MountingAttacker';

describe('MountingAttacker', () => {
  beforeEach(() => {
    DebugFlags.noPlayerHpDamage = false;
    DebugFlags.allowPostGameOverAttacks = true;
  });

  it('uses a sweep to knock down a standing player', () => {
    const player = new Player(100, 300);
    const attacker = new MountingAttacker(138, 300, () => player);
    const hitStop = vi.fn();
    attacker.onHitStop = hitStop;

    for (let i = 0; i < 180; i++) {
      attacker.update(1 / 60);
    }

    expect(player.isDowned).toBe(true);
    expect(hitStop).toHaveBeenCalled();
  });

  it('mounts a downed player and punches exactly three times', () => {
    const player = new Player(100, 300);
    player.tripDown(138);
    const startingHealth = player.health;
    const attacker = new MountingAttacker(136, 300, () => player);
    const hitStop = vi.fn();
    attacker.onHitStop = hitStop;

    for (let i = 0; i < 220; i++) {
      attacker.update(1 / 60);
    }

    expect(startingHealth - player.health).toBe(12);
    expect(player.currentDownHitReaction).toBe('mount');
    expect(hitStop).toHaveBeenCalledTimes(3);
    expect(attacker.state === 'mount').toBe(false);
  });
});
