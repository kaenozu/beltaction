import { describe, it, expect, beforeEach } from 'vitest';
import { Enemy } from './Enemy';
import { Player } from './Player';

describe('Enemy', () => {
  let player: Player;
  let enemy: Enemy;

  beforeEach(() => {
    player = new Player(300, 288, 'Maki');
    player.setInput({
      up: false, down: false, left: false, right: false,
      attack: false, kick: false,
    });
    enemy = new Enemy(100, 288, () => player);
  });

  it('has correct initial values', () => {
    expect(enemy.health).toBe(30);
    expect(enemy.x).toBe(100);
    expect(enemy.active).toBe(true);
  });

  it('is not dead initially', () => {
    expect(enemy.isDead).toBe(false);
  });

  describe('takeDamage', () => {
    it('reduces health and enters hurt state', () => {
      enemy.takeDamage(10);
      expect(enemy.health).toBe(20);
      expect(enemy.state).toBe('hurt');
    });

    it('dies when health reaches 0', () => {
      enemy.takeDamage(30);
      expect(enemy.health).toBe(0);
      expect(enemy.state).toBe('death');
      expect(enemy.isDead).toBe(true);
    });
  });

  describe('AI behavior', () => {
    it('faces the player', () => {
      player.x = 50;
      enemy.update(0.016);
      expect(enemy.facing).toBe(-1);

      player.x = 200;
      enemy.update(0.016);
      expect(enemy.facing).toBe(1);
    });

    it('walks toward player when far away', () => {
      player.x = 500;
      enemy.update(0.016);
      expect(enemy.state).toBe('walk');
      expect(enemy.velocityX).toBeGreaterThan(0);
    });

    it('attacks downed player when canReceiveGroundHit is true', () => {
      // Down the player so they can receive ground hits
      player.tripDown(100);
      expect(player.isDowned).toBe(true);
      // After tripDown, canReceiveGroundHit should be true
      expect(player.canReceiveGroundHit).toBe(true);

      // Enemy should be in range to down attack
      enemy.x = player.x - 50;
      enemy.update(0.016);
      expect(enemy.state).toBe('downAttack');
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
