import { Game } from './engine/Game';
import { InputManager } from './engine/InputManager';
import { Player } from './entities/Player';
import { StageManager } from './stages/StageManager';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const hud = document.getElementById('hud')!;
const game = new Game(canvas);
const input = new InputManager();
const stage = new StageManager();

const player = new Player(100, 300, 'Maki');

const idleImg = new Image();
idleImg.src = '/assets/maki_idle.png';
idleImg.onload = () => {
  player.idleImage = idleImg;
};

const walkSheet = new Image();
walkSheet.src = '/assets/maki_spritesheet.png';
walkSheet.onload = () => {
  player.spriteImage = walkSheet;
};

const attackSheet = new Image();
attackSheet.src = '/assets/maki_attack.png';
attackSheet.onload = () => {
  player.attackImage = attackSheet;
};

const jumpImg = new Image();
jumpImg.src = '/assets/maki_jump.png';
jumpImg.onload = () => {
  player.jumpImage = jumpImg;
};

const hurtImg = new Image();
hurtImg.src = '/assets/maki_hurt.png';
hurtImg.onload = () => {
  player.hurtImage = hurtImg;
};

game.setBackground(stage);

game.addEntity(player);

function updateInputs(): void {
  player.setInput(input.getState('player1'));
  stage.setPosition(player.x);
  hud.textContent = `HP: ${player.health}`;
  requestAnimationFrame(updateInputs);
}
updateInputs();

game.start();

// Debug: Hキーで被弾
document.addEventListener('keydown', (e) => {
  if (e.key === 'h') player.hurt();
});