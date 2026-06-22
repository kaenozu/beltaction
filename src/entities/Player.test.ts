import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Player } from './Player';
import { DebugFlags } from '../systems/DebugFlags';

describe('Player', () => {
  let player: Player;

  beforeEach(() => {
    DebugFlags.noPlayerHpDamage = false;
    player = new Player(100, 288);
    player.setInput({
      up: false, down: false, left: false, right: false,
      attack: false, kick: false, jump: false,
    });
  });

  afterEach(() => {
    DebugFlags.noPlayerHpDamage = false;
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

    it('enters hurt state without losing health in no-damage debug mode', () => {
      DebugFlags.noPlayerHpDamage = true;

      const hit = player.takeDamage(20, 50);

      expect(hit).toBe(true);
      expect(player.health).toBe(100);
      expect(player.state).toBe('hurt');
    });
  });

  describe('sprite profile', () => {
    it('applies reduced frame counts for alternate Maki sprite sheets', () => {
      player.applySpriteProfile({
        walkFrames: 2,
        hurtFrames: 4,
        getupFrames: 2,
        kickFrameWidth: 160,
        downSourceWidth: 160,
        downHitSourceWidth: 160,
        mountPunchSourceWidth: 160,
      });

      expect(player.kickFrameWidth).toBe(160);
      expect(player.downSource.w).toBe(160);
      expect(player.downHitSource.w).toBe(160);
      expect(player.mountPunchSource.w).toBe(160);
    });

    it('uses the extended heavy hurt frames when the active profile provides them', () => {
      player.applySpriteProfile({
        walkFrames: 2,
        hurtFrames: 4,
        getupFrames: 2,
        kickFrameWidth: 160,
        downSourceWidth: 160,
        downHitSourceWidth: 160,
        mountPunchSourceWidth: 160,
      });

      player.hurt(50, 'kneeBuckle');

      expect(player.currentFrame).toBe(3);
    });
  });

  describe('die', () => {
    it('enters death state with knockback', () => {
      player.die(200);
      expect(player.health).toBe(0);
      expect(player.state).toBe('death');
      expect((player as unknown as { stateTimer: number }).stateTimer).toBe(0.5);
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
      expect((player as unknown as { stateTimer: number }).stateTimer).toBeGreaterThan(0);
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
        attack: true, kick: false, jump: false,
      });
      player.update(0.016);
      expect(player.state).toBe('attack');
    });

    it('enters walk state when moving left', () => {
      player.setInput({
        up: false, down: false, left: true, right: false,
        attack: false, kick: false, jump: false,
      });
      player.update(0.016);
      expect(player.state).toBe('walk');
      expect(player.velocityX).toBeLessThan(0);
    });

    it('enters walk state when moving right', () => {
      player.setInput({
        up: false, down: false, left: false, right: true,
        attack: false, kick: false, jump: false,
      });
      player.update(0.016);
      expect(player.state).toBe('walk');
      expect(player.velocityX).toBeGreaterThan(0);
    });

    it('reverts to idle when no movement input', () => {
      player.setInput({
        up: false, down: false, left: true, right: false,
        attack: false, kick: false, jump: false,
      });
      player.update(0.016);
      expect(player.state).toBe('walk');

      player.setInput({
        up: false, down: false, left: false, right: false,
        attack: false, kick: false, jump: false,
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

  describe('reverse crab state', () => {
    it('can start reverse crab from a downed state', () => {
      player.tripDown(200);
      player.startReverseCrab(220);
      expect(player.state).toBe('reverseCrab');
      expect(player.isReverseCrabbed).toBe(true);
      expect(player.canBeGrabbed).toBe(false);
    });

    it('escapes reverse crab through resistance input', () => {
      player.tripDown(200);
      player.startReverseCrab(220);
      player.setInput({
        up: false, down: false, left: true, right: false,
        attack: false, kick: false, jump: false,
      });

      for (let i = 0; i < 10; i++) {
        player.update(1 / 60);
      }

      expect(player.state).toBe('down');
      expect(player.isDowned).toBe(true);
    });
  });

  describe('bound state', () => {
    it('can enter a wrapped chain bind while remaining bound', () => {
      const started = player.startBound(300, 1, 165, 0);

      expect(started).toBe(true);
      player.startChainWrapped(0.58);

      expect(player.state).toBe('bound');
      expect(player.isBound).toBe(true);
      expect(player.isChainWrapped).toBe(true);
    });

    it('releases the chain wrap when its timer expires without resistance', () => {
      player.startBound(300, 1, 165, 0);
      player.startChainWrapped(0.1);

      player.update(0.12);

      expect(player.state).toBe('idle');
      expect(player.isChainWrapped).toBe(false);
    });

    it('can receive body blows while staying chain wrapped', () => {
      player.startBound(300, 1, 165, 0);
      player.startChainWrapped(1.5);

      const hit = player.receiveBoundBodyBlow(300, 7);

      expect(hit).toBe(true);
      expect(player.health).toBe(93);
      expect(player.state).toBe('bound');
      expect(player.isChainWrapped).toBe(true);
    });

    it('does not escape a chain pull without resistance input', () => {
      player.startBound(300, 6, 70, 0);

      for (let i = 0; i < 60; i++) {
        player.setInput({
          up: false, down: false, left: false, right: false,
          attack: false, kick: false, jump: false,
        });
        player.update(1 / 60);
      }

      expect(player.state).toBe('bound');
      expect(player.isBound).toBe(true);
    });

    it('can escape a chain pull by resisting with movement and attack inputs', () => {
      player.startBound(300, 6, 70, 0);

      for (let i = 0; i < 75; i++) {
        player.setInput({
          up: false,
          down: false,
          left: i % 2 === 0,
          right: i % 2 === 1,
          attack: i % 3 === 0,
          kick: i % 5 === 0,
          jump: false,
        });
        player.update(1 / 60);
        if (!player.isBound) break;
      }

      expect(player.state).toBe('idle');
      expect(player.isBound).toBe(false);
      expect(player.isChainWrapped).toBe(false);
    });

    it('takes damage while chain pulled without leaving bound or taking knockback', () => {
      player.startBound(300, 6, 70, 0);
      const xBefore = player.x;

      const hit = player.takeDamage(12, 40, 'guardHead');

      expect(hit).toBe(true);
      expect(player.health).toBe(88);
      expect(player.state).toBe('bound');
      expect(player.isBound).toBe(true);
      expect(player.isDowned).toBe(false);
      expect(player.x).toBe(xBefore);
      expect(player.velocityX).toBe(0);
      expect(player.velocityY).toBe(-80);
    });

    it('can accept a second grappler while chain wrapped', () => {
      player.startBound(300, 1, 165, 0);
      player.startChainWrapped(1.5);

      const joined = player.startGrabFollowup(40);

      expect(joined).toBe(true);
      expect(player.state).toBe('bound');
      expect(player.isChainWrapped).toBe(true);
      expect(player.isDoubleGrabbed).toBe(true);
    });

    it('uses the same opposite-side follow-up position while chain wrapped as while grabbed', () => {
      player.startBound(40, 1, 165, 0);
      player.startChainWrapped(1.5);

      player.startGrabFollowup(40);

      expect(player.grabFollowupX).toBe(player.x + 68);
      expect(player.grabFollowupHitX).toBe(player.x + player.width / 2 + 8);
    });

    it('mirrors the chain follow-up position when the chain holder is on the right', () => {
      player.startBound(260, 1, 165, 0);
      player.startChainWrapped(1.5);

      player.startGrabFollowup(260);

      expect(player.grabFollowupX).toBe(player.x - 68);
      expect(player.grabFollowupHitX).toBe(player.x + player.width / 2 - 8);
    });

    it('releases chain grapple and downs player on fifth follow-up body blow', () => {
      player.startBound(300, 1, 165, 0);
      player.startChainWrapped(1.5);
      player.startGrabFollowup(40);

      for (let i = 0; i < 4; i++) {
        player.receiveGrabFollowupHit(40, 5);
        expect(player.state).toBe('bound');
        expect(player.isChainWrapped).toBe(true);
      }

      player.receiveGrabFollowupHit(40, 5);
      expect(player.health).toBe(75);
      expect(player.state).toBe('downhit');
      expect(player.isChainWrapped).toBe(false);
      expect(player.isDoubleGrabbed).toBe(false);
      expect(player.isDowned).toBe(true);
    });

    it('shows bound body blow reaction without losing health in no-damage debug mode', () => {
      DebugFlags.noPlayerHpDamage = true;
      player.startBound(300, 1, 165, 0);
      player.startChainWrapped(1.5);

      const hit = player.receiveBoundBodyBlow(300, 7);

      expect(hit).toBe(true);
      expect(player.health).toBe(100);
      expect(player.state).toBe('bound');
      expect(player.isChainWrapped).toBe(true);
      expect(player.chainWrappedImpactRatio).toBe(0);
      expect(player.isBoundBodyBlowHurt).toBe(true);
    });
  });
});
