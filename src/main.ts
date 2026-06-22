/*
 * src/main.ts
 * ゲームのエントリポイント
 * アセット読み込み・各システム初期化・デバッグキー割り当て
 * 関連: Game.ts, Player.ts, SpawnSystem.ts, StageManager.ts
 */

import { loadImages } from './utils/loadImage';
import { Game } from './engine/Game';
import { InputManager } from './engine/InputManager';
import { Player } from './entities/Player';
import { StageManager } from './stages/StageManager';
import { SpawnSystem } from './systems/SpawnSystem';
import { DebugFlags } from './systems/DebugFlags';
import { unlockAudio } from './systems/SoundManager';
import { activeMakiSpriteProfile } from './assets/makiSpriteProfile';
import gruntUrl from '/assets/grunt_spritesheet_generated_despill.png';
import gruntHurtUrl from '/assets/grunt_hurt_generated_despill.png';
import gruntHeavyUrl from '/assets/enemy_20260622_grunt_heavy_attack.png';
import gruntBodyBlowUrl from '/assets/grunt_bodyblow_generated_despill.png';
import gruntDownAttackUrl from '/assets/enemy_20260622_grunt_down_attack.png';
import mountSpriteUrl from '/assets/mount_attacker_spritesheet_generated_despill.png';
import mountHurtUrl from '/assets/mount_attacker_hurt_generated_despill.png';
import mountSweepUrl from '/assets/mount_attacker_sweep_generated_despill.png';
import mountAttackUrl from '/assets/mount_attacker_mount_generated_despill.png';
import strongmanSpriteUrl from '/assets/mount_attacker_spritesheet_generated_despill.png';
import strongmanHurtUrl from '/assets/mount_attacker_hurt_generated_despill.png';
import strongmanSweepUrl from '/assets/mount_attacker_sweep_generated_despill.png';
import strongmanAttackUrl from '/assets/mount_attacker_mount_generated_despill.png';
import chainEnemyUrl from '/assets/chain_enemy_spritesheet_chainclear.png';
import chainHurtUrl from '/assets/chain_hurt_generated.png';
import chainDeathUrl from '/assets/chain_death_generated.png';
import chainProjectileUrl from '/assets/chain_projectile_generated.png';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const hud = document.getElementById('hud')!;
const game = new Game(canvas);
const input = new InputManager();
const stage = new StageManager();

const player = new Player(100, 300);
player.applySpriteProfile(activeMakiSpriteProfile.animation);
player.requestHitStop = (duration) => game.requestHitStop(duration);
player.requestSlowMotion = (duration, factor) => game.requestSlowMotion(duration, factor);
const spawner = new SpawnSystem(
  () => player,
  (duration = 0.06, shakeDuration = 0, shakeMagnitude = 0) => {
    game.requestHitStop(duration);
    if (shakeDuration > 0 && shakeMagnitude > 0) {
      game.requestScreenShake(shakeDuration, shakeMagnitude);
    }
  },
);

// 全スプライトを非同期で読み込み、完了後にゲーム開始
loadImages({
  ...activeMakiSpriteProfile.urls,
  grunt: gruntUrl,
  gruntHurt: gruntHurtUrl,
  gruntHeavy: gruntHeavyUrl,
  gruntBodyBlow: gruntBodyBlowUrl,
  gruntDownAttack: gruntDownAttackUrl,
  mountSprite: mountSpriteUrl,
  mountHurt: mountHurtUrl,
  mountSweep: mountSweepUrl,
  mountAttack: mountAttackUrl,
  strongmanSprite: strongmanSpriteUrl,
  strongmanHurt: strongmanHurtUrl,
  strongmanSweep: strongmanSweepUrl,
  strongmanAttack: strongmanAttackUrl,
  chainEnemy: chainEnemyUrl,
  chainHurt: chainHurtUrl,
  chainDeath: chainDeathUrl,
  chainProjectile: chainProjectileUrl,
}).then((imgs) => {
  player.idleImage = imgs.idle;
  player.pinchIdleImage = imgs.pinchIdle;
  player.spriteImage = imgs.walk;
  player.attackImage = imgs.attack;
  player.kickImage = imgs.kick;
  player.jumpImage = imgs.jump;
  player.hurtImage = imgs.hurt;
  player.grabbedImage = imgs.grabbed;
  player.deathImage = imgs.death;
  player.downImage = imgs.down;
  player.downHitImage = imgs.downHit;
  player.mountPunchImage = imgs.mountPunch;
  player.reverseCrabImage = imgs.reverseCrab;
  player.getupImage = imgs.getup;
  spawner.spriteImage = imgs.grunt;
  spawner.hurtImage = imgs.gruntHurt;
  spawner.heavyAttackImage = imgs.gruntHeavy;
  spawner.bodyBlowImage = imgs.gruntBodyBlow;
  spawner.downAttackImage = imgs.gruntDownAttack;
  spawner.mountSpriteImage = imgs.mountSprite;
  spawner.mountHurtImage = imgs.mountHurt;
  spawner.mountSweepImage = imgs.mountSweep;
  spawner.mountAttackImage = imgs.mountAttack;
  spawner.strongmanSpriteImage = imgs.strongmanSprite;
  spawner.strongmanHurtImage = imgs.strongmanHurt;
  spawner.strongmanHeavyAttackImage = imgs.strongmanSweep;
  spawner.strongmanBodyBlowImage = imgs.strongmanAttack;
  spawner.chainSpriteImage = imgs.chainEnemy;
  spawner.chainHurtImage = imgs.chainHurt;
  spawner.chainDeathImage = imgs.chainDeath;
  spawner.chainProjectileImage = imgs.chainProjectile;
});

game.setBackground(stage);

player.onDeath = () => {
  hud.textContent = 'GAME OVER — press R to restart';
};

function buildHUDFlags(): string {
  const flags: string[] = [];
  if (DebugFlags.showHitboxes) flags.push('BOX');
  if (DebugFlags.allowPostGameOverAttacks) flags.push('POST-HIT');
  if (DebugFlags.noPlayerHpDamage) flags.push('NO-DMG');
  return flags.length > 0 ? ` [${flags.join(' ')}]` : '';
}

game.drawUI = (ctx) => {
  const s = game.renderScale;
  ctx.save();
  ctx.scale(s, s);
  ctx.imageSmoothingEnabled = false;

  const barX = 12;
  const barY = 12;
  const barW = 220;
  const barH = 22;
  const hpRatio = Math.max(0, player.health / 100);

  ctx.fillStyle = '#000';
  ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
  ctx.fillStyle = '#333';
  ctx.fillRect(barX, barY, barW, barH);

  const hpColor = hpRatio > 0.5 ? '#e04040' : hpRatio > 0.25 ? '#e09020' : '#e02020';
  ctx.fillStyle = hpColor;
  ctx.fillRect(barX + 2, barY + 2, (barW - 4) * hpRatio, barH - 4);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px monospace';
  ctx.fillText(`HP ${player.health}`, barX + 8, barY + 16);

  const enemies = spawner.getEnemies();
  const enemyLabel = enemies.length > 0 ? `Enemies: ${enemies.length}` : '';
  ctx.fillStyle = '#ccc';
  ctx.font = '13px monospace';
  ctx.fillText(enemyLabel, barX, barY + 40);
  if (spawner.isWaveMode) {
    ctx.fillStyle = '#8cf';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('WAVE MODE [M]', barX, barY + 58);
  }

  if (player.isGameOver) {
    ctx.fillStyle = '#f44';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('GAME OVER', barX, barY + 70);
  }
  ctx.restore();
};

game.addEntity(spawner);
game.addEntity(player);

game.onFrame = () => {
  player.setInput(input.getState('player1'));
  stage.setPosition(player.x);
  game.cameraX = stage.getScrollX();
  const flags = buildHUDFlags();
  hud.textContent = (spawner.isWaveMode ? 'WAVE ' : '') + flags;
};

// Unlock audio on first user interaction (required for autoplay)
document.addEventListener('keydown', () => { unlockAudio(); }, { once: true });
document.addEventListener('mousedown', () => { unlockAudio(); }, { once: true });
document.addEventListener('touchstart', () => { unlockAudio(); }, { once: true });

game.start();

// Debug
document.addEventListener('keydown', (e) => {
  if (e.key === 'b') DebugFlags.showHitboxes = !DebugFlags.showHitboxes;
  if (e.key === 'g') DebugFlags.allowPostGameOverAttacks = !DebugFlags.allowPostGameOverAttacks;
  if (e.key === 'i') DebugFlags.noPlayerHpDamage = !DebugFlags.noPlayerHpDamage;
  if (e.key === 't') {
    player.tripDown(player.x - 1, 0);
  }
  if (e.key === 'm') {
    spawner.enableWaveMode(!spawner.isWaveMode);
  }
  if (e.key === 'r') {
    game.restart();
    player.restart(100, 300);
    spawner.restart();
    hud.textContent = '';
  }
  const keyNum = parseInt(e.key);
  if (!isNaN(keyNum) && keyNum >= 1 && keyNum <= 9) {
    const kinds: Record<number, string> = {
      1: 'grunt',
      2: 'chain',
      3: 'mount',
      4: 'strongman',
    };
    const kind = kinds[keyNum] ?? 'grunt';
    spawner.spawnEnemy(kind as any);
  }
});
