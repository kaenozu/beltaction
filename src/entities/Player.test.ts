import { describe, it, expect, beforeEach } from 'vitest';
import { Player } from './Player';

describe('Player', () => {
  let player: Player;

  beforeEach(() => {
    player = new Player(100, 288, 'Maki');
    player.setInput({
      up: false, down: false, left: false, right: false,
      attack: false, kick: false,
    });
  });

  describe('initial state', () => {
    it('has correct initial values', () => {
      expect(player.x).toBe(100);
      expect(player.y).toBe(288);
      expect(player.health).toBe(100);
      expect(player.state).toBe('idle');
      expect(player.active).toBe(true);
    });

    it('is not defeated initially', () => {
      expect(player.isDefeated).toBe(false);
      expect(player.isGameOver).toBe(false);
    });

    it('is not downed initially', () => {
      expect(player.isDowned).toBe(false);
    });

    it('can be grabbed initially', () => {
      expect(player.canBeGrabbed).toBe(true);
    });
  });

  describe('getters', () => {
    it('isLowHealth returns true when health <= 30', () => {
      player.health = 30;
      expect(player.isLowHealth).toBe(true);
    });

    it('isLowHealth returns false when health > 30', () => {
      player.health = 31;
      expect(player.isLowHealth).toBe(false);
    });

    it('isLowHealth returns false when health is 0 (defeated)', () => {
      player.health = 0;
      expect(player.isLowHealth).toBe(false);
    });
  });

  describe('takeDamage', () => {
    it('reduces health and enters hurt state', () => {
      player.takeDamage(20, 50);
      expect(player.health).toBe(80);
      expect(player.state).toBe('hurt');
    });

    it('kills player when health reaches 0', () => {
      player.takeDamage(100, 50);
      expect(player.health).toBe(0);
      expect(player.state).toBe('death');
      expect(player.isDefeated).toBe(true);
    });

    it('does not apply damage when already defeated', () => {
      player.health = 0;
      player.takeDamage(10, 50);
      expect(player.health).toBe(0);
    });
  });

  describe('die', () => {
    it('enters death state with knockback', () => {
      player.die(200);
      expect(player.health).toBe(0);
      expect(player.state).toBe('death');
      expect(player.stateTimer).toBe(0.5);
      expect(player.isDefeated).toBe(true);
    });

    it('does nothing if already defeated', () => {
      player.die(200);
      player.die(200);
      expect(player.state).toBe('death');
    });
  });

  describe('hurt', () => {
    it('enters hurt state with correct stun duration', () => {
      player.hurt(50);
      expect(player.state).toBe('hurt');
      expect(player.stateTimer).toBeGreaterThan(0);
    });

    it('faces toward the attacker when attacker is to the right', () => {
      player.hurt(200);
      expect(player.facingDirection).toBe(1);
    });

    it('faces toward the attacker when attacker is to the left', () => {
      player.hurt(0);
      expect(player.facingDirection).toBe(-1);
    });
  });

  describe('state transitions', () => {
    it('enters attack state on attack input (first frame)', () => {
      player.setInput({
        up: false, down: false, left: false, right: false,
        attack: true, kick: false,
      });
      player.update(0.016);
      expect(player.state).toBe('attack');
    });

    it('enters walk state when moving left', () => {
      player.setInput({
        up: false, down: false, left: true, right: false,
        attack: false, kick: false,
      });
      player.update(0.016);
      expect(player.state).toBe('walk');
      expect(player.velocityX).toBeLessThan(0);
    });

    it('enters walk state when moving right', () => {
      player.setInput({
        up: false, down: false, left: false, right: true,
        attack: false, kick: false,
      });
      player.update(0.016);
      expect(player.state).toBe('walk');
      expect(player.velocityX).toBeGreaterThan(0);
    });

    it('reverts to idle when no movement input', () => {
      player.setInput({
        up: false, down: false, left: true, right: false,
        attack: false, kick: false,
      });
      player.update(0.016);
      expect(player.state).toBe('walk');

      player.setInput({
        up: false, down: false, left: false, right: false,
        attack: false, kick: false,
      });
      player.update(0.016);
      expect(player.state).toBe('idle');
    });
  });

  describe('physics', () => {
    it('gravity decelerates upward velocity each frame', () => {
      player.velocityY = -500; // Jumping upward
      player.update(0.016);
      // GRAVITY(1200) * dt(0.016) = 19.2 added to velocityY
      expect(player.velocityY).toBeCloseTo(-500 + 1200 * 0.016, 1);
    });

    it('is constrained to stage boundaries', () => {
      player.x = -10;
      player.update(0.016);
      expect(player.x).toBe(0);

      player.x = 3000;
      player.update(0.016);
      expect(player.x).toBeLessThanOrEqual(2000);
    });
  });

  describe('grabbed state', () => {
    it('can start grabbed state', () => {
      player.startGrabbed(200);
      expect(player.state).toBe('grabbed');
    });

    it('can release from grab', () => {
      player.startGrabbed(200);
      player.releaseGrab();
      expect(player.state).toBe('idle');
    });

    it('updates position when grabbed', () => {
      player.startGrabbed(200);
      player.updateGrabbedPosition(300);
      expect(player.x).toBe(258);
    });
  });
});
