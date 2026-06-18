import { Game } from './engine/Game';
import { InputManager } from './engine/InputManager';
import { Player } from './entities/Player';
import { StageManager } from './stages/StageManager';
import { SpawnSystem } from './systems/SpawnSystem';
import { DebugFlags } from './systems/DebugFlags';
import idleUrl from '/assets/maki_idle_generated_v2_despill.png';
import walkUrl from '/assets/maki_walk_hairsway_stabilized_despill.png';
import attackUrl from '/assets/maki_attack_generated_despill_hairfix.png';
import kickUrl from '/assets/maki_kick_generated_despill.png';
import jumpUrl from '/assets/maki_jump_generated_despill.png';
import hurtUrl from '/assets/maki_hurt_generated_despill.png';
import deathUrl from '/assets/maki_death_generated_despill.png';
import downUrl from '/assets/maki_down_generated_despill.png';
import downHitUrl from '/assets/maki_downhit_generated_despill.png';
import gruntUrl from '/assets/grunt_spritesheet_generated_despill.png';
import gruntHurtUrl from '/assets/grunt_hurt_generated_despill.png';
import gruntHeavyUrl from '/assets/grunt_heavy_generated_despill.png';

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
