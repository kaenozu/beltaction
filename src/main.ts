import { Game } from './engine/Game';
import { InputManager } from './engine/InputManager';
import { Player } from './entities/Player';
import { StageManager } from './stages/StageManager';
import { SpawnSystem } from './systems/SpawnSystem';
import { DebugFlags } from './systems/DebugFlags';
import idleUrl from '/assets/maki_idle.png';
import walkUrl from '/assets/maki_spritesheet.png';
import attackUrl from '/assets/maki_attack.png';
import jumpUrl from '/assets/maki_jump.png';
import hurtUrl from '/assets/maki_hurt.png';
import downUrl from '/assets/maki_down.png';
import downHitUrl from '/assets/maki_downhit.png';
import gruntUrl from '/assets/grunt_spritesheet.png';
import gruntHurtUrl from '/assets/grunt_hurt.png';

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

game.setBackground(stage);

player.onDeath = () => {
  hud.textContent = 'GAME OVER - Refresh to restart';
};

game.addEntity(spawner);
game.addEntity(player);

function updateInputs(): void {
  player.setInput(input.getState('player1'));
  stage.setPosition(player.x);
  game.cameraX = stage.getScrollX();
  const enemies = spawner.getEnemies();
  const enemyHP = enemies.length > 0 ? ` Enemy:${enemies.length} HP:${enemies[0].health}` : '';
  const debugInfo = DebugFlags.showHitboxes ? ' [BOX]' : '';
  const postGameAttackInfo = DebugFlags.allowPostGameOverAttacks ? ' [POST-HIT]' : '';
  hud.textContent = player.isGameOver
    ? `GAME OVER - Refresh to restart${debugInfo}${postGameAttackInfo}`
    : `HP: ${player.health}${enemyHP}${debugInfo}${postGameAttackInfo}`;
  requestAnimationFrame(updateInputs);
}
updateInputs();

game.start();

// Debug
document.addEventListener('keydown', (e) => {
  if (e.key === 'h' || e.key === '1') player.hurt(undefined, 'light');
  if (e.key === '2') player.hurt(undefined, 'guardHead');
  if (e.key === 'b') DebugFlags.showHitboxes = !DebugFlags.showHitboxes;
  if (e.key === 'g') DebugFlags.allowPostGameOverAttacks = !DebugFlags.allowPostGameOverAttacks;
  if (e.key === 'e') spawner.spawnEnemy();
});
