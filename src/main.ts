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
import chainProjectileUrl from '/assets/chain_projectile_generated.png';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const hud = document.getElementById('hud')!;
const game = new Game(canvas);
const input = new InputManager();
const stage = new StageManager();

const player = new Player(100, 300, 'Maki');
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
  spawner.chainProjectileImage = imgs.chainProjectile;
});

game.setBackground(stage);

player.onDeath = () => {
  hud.textContent = 'GAME OVER - Refresh to restart';
};

game.addEntity(spawner);
game.addEntity(player);

game.onFrame = () => {
  player.setInput(input.getState('player1'));
  stage.setPosition(player.x);
  game.cameraX = stage.getScrollX();
  const enemies = spawner.getEnemies();
  const enemyHP = enemies.length > 0 ? ` Enemy:${enemies.length} HP:${enemies[0].health}` : '';
  const debugInfo = DebugFlags.showHitboxes ? ' [BOX]' : '';
  const postGameAttackInfo = DebugFlags.allowPostGameOverAttacks ? ' [POST-HIT]' : '';
  const noDamageInfo = DebugFlags.noPlayerHpDamage ? ' [NO-DMG]' : '';
  const invincibleInfo = player.isWakeupInvincible ? ' [INV]' : '';
  const dangerInfo = player.isLowHealth ? ' DANGER' : '';
  hud.textContent = player.isGameOver
    ? `GAME OVER - Refresh to restart${debugInfo}${postGameAttackInfo}${noDamageInfo}`
    : `HP: ${player.health}${dangerInfo}${enemyHP}${invincibleInfo}${debugInfo}${postGameAttackInfo}${noDamageInfo}`;
};

game.start();

// Debug
document.addEventListener('keydown', (e) => {
  // (削除: 被弾テストは1/2/3からスポーンに変更)
  if (e.key === 'b') DebugFlags.showHitboxes = !DebugFlags.showHitboxes;
  if (e.key === 'g') DebugFlags.allowPostGameOverAttacks = !DebugFlags.allowPostGameOverAttacks;
  if (e.key === 'i') DebugFlags.noPlayerHpDamage = !DebugFlags.noPlayerHpDamage;
  const keyNum = parseInt(e.key);
  if (!isNaN(keyNum) && keyNum >= 1 && keyNum <= 9) {
    const kinds: Record<number, string> = {
      1: 'grunt',
      2: 'chain',
    };
    const kind = kinds[keyNum] ?? 'grunt'; // 3-9 は将来の敵タイプ用
    spawner.spawnEnemy(kind as any);
  }
});
