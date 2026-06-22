import { describe, expect, it, vi } from 'vitest';
import { ChainEnemy } from '../entities/ChainEnemy';
import { MountingAttacker } from '../entities/MountingAttacker';
import { SpawnSystem } from './SpawnSystem';
import { Player } from '../entities/Player';

function imageStub(): HTMLImageElement {
  return {} as HTMLImageElement;
}

describe('SpawnSystem', () => {
  it('routes grunts toward chain-wrapped follow-up grapple positions', () => {
    const player = new Player(100, 300);
    const spawner = new SpawnSystem(() => player);
    spawner.spriteImage = imageStub();
    vi.spyOn(Math, 'random').mockReturnValue(0);

    player.startBound(260, 1.0, 165, 0);
    player.startChainWrapped(10.0);

    spawner.spawnEnemy('grunt');
    for (let i = 0; i < 220; i++) {
      spawner.update(1 / 60);
    }

    const [grunt] = spawner.getEnemies();
    expect(grunt).toBeDefined();
    expect(grunt.x).toBeLessThan(player.x + player.width * 2);
  });

  it('uses the dedicated chain sprite sheet for chain enemies when available', () => {
    const player = new Player(100, 300);
    const spawner = new SpawnSystem(() => player);
    const gruntImage = imageStub();
    const chainImage = imageStub();
    const chainHurtImage = imageStub();
    const chainDeathImage = imageStub();

    spawner.spriteImage = gruntImage;
    spawner.chainSpriteImage = chainImage;
    spawner.chainHurtImage = chainHurtImage;
    spawner.chainDeathImage = chainDeathImage;

    spawner.spawnChainEnemy();

    const [chainEnemy] = spawner.getEnemies();
    expect(chainEnemy).toBeDefined();
    expect(chainEnemy.spriteImage).toBe(chainImage);
    expect(chainEnemy.hurtImage).toBe(chainHurtImage);
    expect((chainEnemy as ChainEnemy).deathImage).toBe(chainDeathImage);
    expect((chainEnemy as ChainEnemy).useFallbackDetails).toBe(false);
  });

  it('can spawn a mounting attacker with shared grunt attack art', () => {
    const player = new Player(100, 300);
    const spawner = new SpawnSystem(() => player);
    const spriteImage = imageStub();
    const hurtImage = imageStub();
    const heavyAttackImage = imageStub();
    const bodyBlowImage = imageStub();
    const mountSpriteImage = imageStub();
    const mountHurtImage = imageStub();
    const mountSweepImage = imageStub();
    const mountAttackImage = imageStub();

    spawner.spriteImage = spriteImage;
    spawner.hurtImage = hurtImage;
    spawner.heavyAttackImage = heavyAttackImage;
    spawner.bodyBlowImage = bodyBlowImage;
    spawner.mountSpriteImage = mountSpriteImage;
    spawner.mountHurtImage = mountHurtImage;
    spawner.mountSweepImage = mountSweepImage;
    spawner.mountAttackImage = mountAttackImage;

    spawner.spawnEnemy('mount');

    const [mountingAttacker] = spawner.getEnemies();
    expect(mountingAttacker).toBeInstanceOf(MountingAttacker);
    expect(mountingAttacker.spriteImage).toBe(mountSpriteImage);
    expect(mountingAttacker.hurtImage).toBe(mountHurtImage);
    expect(mountingAttacker.heavyAttackImage).toBe(mountSweepImage);
    expect(mountingAttacker.bodyBlowImage).toBe(mountAttackImage);
  });
});
