/*
 * src/systems/SoundManager.ts
 * HTML5 Audio: 全ファイルをプリロード
 * 関連: Player.ts（被弾時）, SpawnSystem.ts（攻撃ヒット時）
 */

const soundCache = new Map<string, HTMLAudioElement>();

function preloadAll() {
  const names = ['ta.mp3', 'don.mp3', 'enemy_punch.mp3', 'player_punch.mp3', 'swish.mp3', 'rope.mp3', 'bind.mp3', 'uu_01.wav', 'uu_03.wav', 'kuu_02.wav', 'aah_01.wav'];
  for (const name of names) {
    try { soundCache.set(name, new Audio(`assets/voices/${name}`)); } catch { console.warn('SoundManager: failed to preload', name); }
  }
}
preloadAll();

// Unlock HTML5 Audio on user interaction (required for autoplay policy)
export function unlockAudio(): void {
  for (const audio of soundCache.values()) {
    try { audio.play(); audio.pause(); } catch { console.warn('SoundManager: playback failed'); }
  }
}

// --- 打撃音 ---
export function playHitHeavy(): void { playSfx('player_punch.mp3'); }
export function playKick(): void { playSfx('player_punch.mp3'); }
export function playHeavyImpact(): void { playSfx('don.mp3'); }
export function playSwish(): void { playSfx('swish.mp3', 0.4); }
export function playEnemyNormal(): void { playSfx('enemy_punch.mp3'); }

let ropeAudio: HTMLAudioElement | null = null;
export function playRope(): void {
  if (ropeAudio) return;
  const audio = soundCache.get('rope.mp3');
  if (!audio) return;
  ropeAudio = audio;
  audio.volume = 0.5;
  audio.loop = true;
  try { audio.play(); } catch { console.warn('SoundManager: playback failed'); }
}
export function stopRope(): void {
  if (ropeAudio) {
    try { ropeAudio.pause(); } catch { console.warn('SoundManager: playback failed'); }
    ropeAudio = null;
  }
}

// 拘束音（bind.mp3）
let bindAudio: HTMLAudioElement | null = null;
export function playBind(): void {
  stopBind(); // Stop any existing first
  const audio = soundCache.get('bind.mp3');
  if (!audio) return;
  bindAudio = audio;
  audio.volume = 0.7;
  audio.currentTime = 0;
  try { audio.play(); } catch { console.warn('SoundManager: playback failed'); }
}
export function stopBind(): void {
  if (bindAudio) {
    try { bindAudio.pause(); } catch { console.warn('SoundManager: playback failed'); }
    bindAudio = null;
  }
}

// --- ボイス ---
export function playHurtLight(): void { playSfx('uu_01.wav'); }
export function playHurtHeavy(): void { playSfx('uu_03.wav'); }
export function playGrab(): void { stopBind(); playSfx('kuu_02.wav'); playBind(); }
export function playDeath(): void { playSfx('aah_01.wav'); }
export function playDownHit(): void { playSfx('uu_01.wav'); }
export function playChainBind(): void { playSfx('kuu_02.wav'); }

// --- 内部ヘルパ ---
function playSfx(name: string, volume = 1.0) {
  const audio = soundCache.get(name);
  if (audio) {
    try { audio.volume = volume; audio.currentTime = 0; audio.play(); } catch { console.warn('SoundManager: playback failed'); }
  }
}