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
import chainEnemyUrl from '/assets/chain_enemy_spritesheet_generated.png';

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

const idleImg = new Image();
idleImg.src = idleUrl;
idleImg.onload = () => {
  player.idleImage = idleImg;
};

const pinchIdleImg = new Image();
pinchIdleImg.src = pinchIdleUrl;
pinchIdleImg.onload = () => {
  player.pinchIdleImage = pinchIdleImg;
};

const walkSheet = new Image();
walkSheet.src = walkUrl;
walkSheet.onload = () => {
  player.spriteImage = walkSheet;
};

const attackSheet = new Image();
attackSheet.src = attackUrl;
attackSheet.onload = () => {
  player.attackImage = attackSheet;
};

const kickSheet = new Image();
kickSheet.src = kickUrl;
kickSheet.onload = () => {
  player.kickImage = kickSheet;
};

const jumpImg = new Image();
jumpImg.src = jumpUrl;
jumpImg.onload = () => {
  player.jumpImage = jumpImg;
};

const hurtImg = new Image();
hurtImg.src = hurtUrl;
hurtImg.onload = () => {
  player.hurtImage = hurtImg;
};

const grabbedImg = new Image();
grabbedImg.src = grabbedUrl;
grabbedImg.onload = () => {
  player.grabbedImage = grabbedImg;
};

const deathImg = new Image();
deathImg.src = deathUrl;
deathImg.onload = () => {
  player.deathImage = deathImg;
};

const downImg = new Image();
downImg.src = downUrl;
downImg.onload = () => {
  player.downImage = downImg;
};

const downHitImg = new Image();
downHitImg.src = downHitUrl;
downHitImg.onload = () => {
  player.downHitImage = downHitImg;
};

const getupImg = new Image();
getupImg.src = getupUrl;
getupImg.onload = () => {
  player.getupImage = getupImg;
};

const gruntSheet = new Image();
gruntSheet.src = gruntUrl;
gruntSheet.onload = () => {
  spawner.spriteImage = gruntSheet;
};

const gruntHurtSheet = new Image();
gruntHurtSheet.src = gruntHurtUrl;
gruntHurtSheet.onload = () => {
  spawner.hurtImage = gruntHurtSheet;
};

const gruntHeavySheet = new Image();
gruntHeavySheet.src = gruntHeavyUrl;
gruntHeavySheet.onload = () => {
  spawner.heavyAttackImage = gruntHeavySheet;
};

const gruntBodyBlowSheet = new Image();
gruntBodyBlowSheet.src = gruntBodyBlowUrl;
gruntBodyBlowSheet.onload = () => {
  spawner.bodyBlowImage = gruntBodyBlowSheet;
};

const chainEnemySheet = new Image();
chainEnemySheet.src = chainEnemyUrl;
chainEnemySheet.onload = () => {
  spawner.chainSpriteImage = chainEnemySheet;
};

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
