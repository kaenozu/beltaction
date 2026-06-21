import { describe, it, expect, beforeEach } from 'vitest';
import { ChainEnemy } from './ChainEnemy';
import { Player } from './Player';

describe('ChainEnemy', () => {
  let player: Player;
  let enemy: ChainEnemy;

  beforeEach(() => {
    player = new Player(300, 288);
    enemy = new ChainEnemy(100, 288, () => player);
  });

  it('has correct initial values', () => {
    expect(enemy.health).toBe(38);
    expect(enemy.x).toBe(100);
    expect(enemy.active).toBe(true);
  });

  it('is not dead initially', () => {
    expect(enemy.isDead).toBe(false);
  });

  describe('takeDamage', () => {
    it('reduces health and enters hurt state', () => {
      enemy.takeDamage(10);
      expect(enemy.health).toBe(28);
      expect(enemy.state).toBe('hurt');
    });

    it('dies when health reaches 0', () => {
      enemy.takeDamage(38);
      expect(enemy.health).toBe(0);
      expect(enemy.state).toBe('death');
      expect(enemy.isDead).toBe(true);
    });
  });

  describe('AI behavior', () => {
    it('walks toward player when far away', () => {
      player.x = 500;
      enemy.update(0.016);
      expect(enemy.state).toBe('walk');
      expect((enemy as unknown as { velocityX: number }).velocityX).toBeGreaterThan(0);
    });

    it('faces the player', () => {
      player.x = 50;
      enemy.update(0.016);
      expect(enemy.facing).toBe(-1);

      player.x = 200;
      enemy.update(0.016);
      expect(enemy.facing).toBe(1);
    });

    it('keeps pulling from long range instead of wrapping on a timer', () => {
      player.x = 360;
      enemy.x = 100;
      enemy.state = 'boundPull';
      enemy.facing = 1;
      (enemy as unknown as { stateTimer: number }).stateTimer = 6;
      player.startBound(enemy.x + enemy.width / 2, 6, 70, 0);

      enemy.update(0.2);

      expect(enemy.state).toBe('boundPull');
      expect(player.state).toBe('bound');
      expect(player.isChainWrapped).toBe(false);
      expect(player.x).toBeGreaterThan(300);
      expect(player.x).toBeLessThan(360);
    });

    it('grapples the player after pulling them all the way to the chain enemy', () => {
      player.x = 130;
      enemy.x = 100;
      enemy.state = 'boundPull';
      enemy.facing = 1;
      player.startBound(enemy.x + enemy.width / 2, 1, 165, 0);

      enemy.update(0.016);

      expect(enemy.state).toBe('chainBind');
      expect(player.state).toBe('bound');
      expect(player.isBound).toBe(true);
    });

    it('keeps the chain wrap without dealing follow-up body blow damage itself', () => {
      player.x = 130;
      enemy.x = 100;
      enemy.state = 'boundPull';
      enemy.facing = 1;
      player.startBound(enemy.x + enemy.width / 2, 1, 165, 0);

      enemy.update(0.016);
      const healthAfterWrap = player.health;
      enemy.update(0.7);

      expect(enemy.state).toBe('chainBind');
      expect(player.state).toBe('bound');
      expect(player.isBound).toBe(true);
      expect(player.health).toBe(healthAfterWrap);
    });

    it('keeps the chain wrap long enough for another enemy to follow up', () => {
      player.x = 130;
      enemy.x = 100;
      enemy.state = 'boundPull';
      enemy.facing = 1;
      player.startBound(enemy.x + enemy.width / 2, 1, 165, 0);

      enemy.update(0.016);
      enemy.update(2.1);

      expect(enemy.state).toBe('chainBind');
      expect(player.state).toBe('bound');
      expect(player.isBound).toBe(true);
    });

    it('releases the chain wrap when the bind timer expires', () => {
      player.x = 130;
      enemy.x = 100;
      enemy.state = 'boundPull';
      enemy.facing = 1;
      player.startBound(enemy.x + enemy.width / 2, 1, 165, 0);

      enemy.update(0.016);
      enemy.update(6);

      expect(enemy.state).toBe('idle');
      expect(player.state).toBe('idle');
      expect(player.isChainWrapped).toBe(false);
    });

    it('cancels the pull if the player is released by another state change', () => {
      player.x = 260;
      enemy.x = 100;
      enemy.state = 'boundPull';
      enemy.facing = 1;
      (enemy as unknown as { stateTimer: number }).stateTimer = 0.1;
      player.startBound(enemy.x + enemy.width / 2, 1, 165, 0);
      player.releaseBound();

      enemy.update(0.016);

      expect(enemy.state).toBe('idle');
      expect(enemy.isGrapplingPlayer).toBe(false);
      expect(player.state).toBe('idle');
      expect(player.isChainWrapped).toBe(false);
    });

    it('does not enter chain wrap when the pull timer expires after the player was released', () => {
      player.x = 260;
      enemy.x = 100;
      enemy.state = 'boundPull';
      enemy.facing = 1;
      player.startBound(enemy.x + enemy.width / 2, 1, 165, 0);
      player.releaseBound();

      enemy.update(1);

      expect(enemy.state).toBe('idle');
      expect(player.state).toBe('idle');
      expect(player.isChainWrapped).toBe(false);
    });
  });

  describe('hitbox getters', () => {
    it('returns body hitbox', () => {
      const body = enemy.getBodyHitbox();
      expect(body.w).toBeGreaterThan(0);
      expect(body.h).toBeGreaterThan(0);
    });

    it('returns hurt hitbox', () => {
      const hurt = enemy.getHurtHitbox();
      expect(hurt.w).toBeGreaterThan(0);
      expect(hurt.h).toBeGreaterThan(0);
    });
  });
});
