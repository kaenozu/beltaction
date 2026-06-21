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
import idleUrl from '/assets/maki_idle_generated_v2_despill.png';
import pinchIdleUrl from '/assets/maki_pinch_idle_generated_despill.png';
import walkUrl from '/assets/maki_walk_hairsway_stabilized_despill.png';
import attackUrl from '/assets/maki_attack_generated_despill_hairfix.png';
import kickUrl from '/assets/maki_kick_generated_despill.png';
import jumpUrl from '/assets/maki_jump_generated_despill.png';
import hurtUrl from '/assets/maki_hurt_generated_despill.png';
import grabbedUrl from '/assets/maki_hagai_victim_generated_fit.png';
import deathUrl from '/assets/maki_death_generated_despill.png';
import downUrl from '/assets/maki_down_generated_despill.png';
import downHitUrl from '/assets/maki_downhit_generated_despill.png';
import getupUrl from '/assets/maki_getup_generated_despill.png';
import gruntUrl from '/assets/grunt_spritesheet_generated_despill.png';
import gruntHurtUrl from '/assets/grunt_hurt_generated_despill.png';
import gruntHeavyUrl from '/assets/grunt_heavy_generated_despill.png';
import gruntBodyBlowUrl from '/assets/grunt_bodyblow_generated_despill.png';
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
  idle: idleUrl,
  pinchIdle: pinchIdleUrl,
  walk: walkUrl,
  attack: attackUrl,
  kick: kickUrl,
  jump: jumpUrl,
  hurt: hurtUrl,
  grabbed: grabbedUrl,
  death: deathUrl,
  down: downUrl,
  downHit: downHitUrl,
  getup: getupUrl,
  grunt: gruntUrl,
  gruntHurt: gruntHurtUrl,
  gruntHeavy: gruntHeavyUrl,
  gruntBodyBlow: gruntBodyBlowUrl,
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
  player.getupImage = imgs.getup;
  spawner.spriteImage = imgs.grunt;
  spawner.hurtImage = imgs.gruntHurt;
  spawner.heavyAttackImage = imgs.gruntHeavy;
  spawner.bodyBlowImage = imgs.gruntBodyBlow;
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
  const barX = 10;
  const barY = 10;
  const barW = 180;
  const barH = 14;
  const hpRatio = Math.max(0, player.health / 100);

  ctx.fillStyle = '#333';
  ctx.fillRect(barX, barY, barW, barH);

  const hpColor = hpRatio > 0.5 ? '#e04040' : hpRatio > 0.25 ? '#e09020' : '#e02020';
  ctx.fillStyle = hpColor;
  ctx.fillRect(barX + 1, barY + 1, (barW - 2) * hpRatio, barH - 2);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px monospace';
  ctx.fillText(`HP ${player.health}`, barX + 6, barY + 11);

  const enemies = spawner.getEnemies();
  const enemyLabel = enemies.length > 0 ? `Enemies: ${enemies.length}` : '';
  ctx.fillStyle = '#ccc';
  ctx.font = '11px monospace';
  ctx.fillText(enemyLabel, barX, barY + 28);

  if (player.isGameOver) {
    ctx.fillStyle = '#f44';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('GAME OVER', barX, barY + 52);
  }
};

game.addEntity(spawner);
game.addEntity(player);

game.onFrame = () => {
  player.setInput(input.getState('player1'));
  stage.setPosition(player.x);
  game.cameraX = stage.getScrollX();
  const flags = buildHUDFlags();
  hud.textContent = flags;
};

game.start();

// Debug
document.addEventListener('keydown', (e) => {
  if (e.key === 'b') DebugFlags.showHitboxes = !DebugFlags.showHitboxes;
  if (e.key === 'g') DebugFlags.allowPostGameOverAttacks = !DebugFlags.allowPostGameOverAttacks;
  if (e.key === 'i') DebugFlags.noPlayerHpDamage = !DebugFlags.noPlayerHpDamage;
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
    };
    const kind = kinds[keyNum] ?? 'grunt';
    spawner.spawnEnemy(kind as any);
  }
});
