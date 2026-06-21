import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Enemy } from './Enemy';
import { Player } from './Player';

describe('Enemy', () => {
  let player: Player;
  let enemy: Enemy;

  beforeEach(() => {
    player = new Player(300, 288);
    player.setInput({
      up: false, down: false, left: false, right: false,
      attack: false, kick: false, jump: false,
    });
    enemy = new Enemy(100, 288, () => player);
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
      expect((enemy as unknown as { velocityX: number }).velocityX).toBeGreaterThan(0);
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

    it('approaches chain-wrapped player to join the grapple', () => {
      player.x = 300;
      enemy.x = 180;
      player.startBound(100, 2, 0, 0);
      player.startChainWrapped(2);

      enemy.update(0.016);

      expect(enemy.state).toBe('walk');
      expect((enemy as unknown as { velocityX: number }).velocityX).toBeGreaterThan(0);
    });

    it('joins a grapple on chain-wrapped player instead of attacking immediately', () => {
      player.x = 300;
      enemy.x = 250;
      player.startBound(100, 2, 0, 0);
      player.startChainWrapped(2);

      enemy.update(0.016);

      expect(enemy.state).toBe('grabFollowup');
      expect(enemy.isBodyBlowGrappler).toBe(true);
      expect(enemy.isGrapplingPlayer).toBe(true);
      expect(player.state).toBe('bound');
      expect(player.isChainWrapped).toBe(true);
      expect(player.isDoubleGrabbed).toBe(true);
    });

    it('does not mirror the chain follow-up body blow when punching from the left side', () => {
      player.x = 300;
      player.startBound(500, 2, 0, 0);
      player.startChainWrapped(2);
      enemy.x = player.grabFollowupX;

      enemy.update(0.016);

      expect(enemy.state).toBe('grabFollowup');
      expect(enemy.x).toBeLessThan(player.x);
      expect(enemy.mirrorGrabFollowupBodyBlow).toBe(false);
    });

    it('mirrors the chain follow-up body blow when punching from the right side', () => {
      player.x = 300;
      player.startBound(100, 2, 0, 0);
      player.startChainWrapped(2);
      enemy.x = player.grabFollowupX;

      enemy.update(0.016);

      expect(enemy.state).toBe('grabFollowup');
      expect(enemy.x).toBeGreaterThan(player.x);
      expect(enemy.mirrorGrabFollowupBodyBlow).toBe(true);
    });

    it('body blows chain-wrapped player after joining the grapple', () => {
      player.x = 300;
      enemy.x = 250;
      player.startBound(100, 2, 0, 0);
      player.startChainWrapped(2);

      enemy.update(0.016);
      expect(enemy.state).toBe('grabFollowup');

      const healthBefore = player.health;
      for (let i = 0; i < 4; i++) {
        enemy.update(0.42);
        expect(player.state).toBe('bound');
        expect(player.isChainWrapped).toBe(true);
      }

      enemy.update(0.42);
      expect(player.health).toBeLessThan(healthBefore);
      expect(player.state).toBe('downhit');
      expect(player.isChainWrapped).toBe(false);
      expect(player.isDoubleGrabbed).toBe(false);
    });

    it('damages a chain-pulled player without knocking them out of the pull', () => {
      vi.spyOn(Math, 'random').mockReturnValue(1);
      player.x = 300;
      enemy.x = 245;
      player.startBound(100, 6, 70, 0);

      enemy.update(0.016);
      enemy.update(0.26);
      enemy.update(0.016);

      expect(player.health).toBeLessThan(100);
      expect(player.state).toBe('bound');
      expect(player.isBound).toBe(true);
      expect(player.isDowned).toBe(false);
      expect(player.velocityX).toBe(0);
    });

    it('does not use body blow as a regular standing attack', () => {
      vi.spyOn(Math, 'random').mockReturnValue(1);
      player.x = 300;
      enemy.x = 250;

      enemy.update(0.016);
      enemy.update(0.6);
      enemy.update(1.5);
      enemy.update(0.016);

      expect(enemy.state).not.toBe('bodyBlow');
      expect(enemy.isBodyBlowGrappler).toBe(false);
      expect(enemy.isGrapplingPlayer).toBe(false);
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
