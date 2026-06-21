/*
 * src/systems/SoundManager.ts
 * Web Audio API を使った効果音の物理生成
 * 外部オーディオファイル不要で打撃音・声を合成する
 * 関連: Player.ts（被弾時）, SpawnSystem.ts（攻撃ヒット時）
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof AudioContext === 'undefined') return null;
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function osc(
  type: OscillatorType,
  freq: number,
  freqEnd: number,
  duration: number,
  volume: number,
  decayStart = 0.02,
) {
  const c = getCtx();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, c.currentTime);
  o.frequency.linearRampToValueAtTime(freqEnd, c.currentTime + duration);
  g.gain.setValueAtTime(0, c.currentTime);
  g.gain.linearRampToValueAtTime(volume, c.currentTime + decayStart);
  g.gain.linearRampToValueAtTime(0, c.currentTime + duration);
  o.connect(g).connect(c.destination);
  o.start(c.currentTime);
  o.stop(c.currentTime + duration);
}

function noise(duration: number, volume: number) {
  const c = getCtx();
  if (!c) return;
  const bufferSize = c.sampleRate * duration;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.max(0, 1 - i / bufferSize);
  }
  const src = c.createBufferSource();
  src.buffer = buffer;
  const g = c.createGain();
  g.gain.setValueAtTime(volume, c.currentTime);
  g.gain.linearRampToValueAtTime(0, c.currentTime + duration);
  src.connect(g).connect(c.destination);
  src.start(c.currentTime);
}

// --- 打撃音 ---

export function playHitLight(): void {
  osc('square', 240, 160, 0.06, 0.10);
  noise(0.04, 0.06);
}

export function playHitHeavy(): void {
  osc('sawtooth', 160, 80, 0.10, 0.18);
  noise(0.08, 0.10);
}

export function playKick(): void {
  osc('sawtooth', 90, 40, 0.12, 0.22);
  osc('sine', 60, 30, 0.14, 0.15);
  noise(0.06, 0.08);
}

// --- 被弾音 + 声 ---

export function playHurtLight(): void {
  osc('sine', 450, 320, 0.10, 0.08);
  osc('triangle', 350, 280, 0.08, 0.05);
}

export function playHurtHeavy(): void {
  osc('sine', 520, 180, 0.18, 0.14);
  osc('sine', 480, 200, 0.15, 0.08);
  noise(0.06, 0.04);
}

export function playDeath(): void {
  osc('sine', 680, 60, 0.60, 0.18);
  osc('triangle', 550, 50, 0.50, 0.10);
}

// --- ダウン ---

export function playDownHit(): void {
  osc('triangle', 280, 80, 0.12, 0.12);
  noise(0.08, 0.10);
}

// --- 拘束 ---

export function playGrab(): void {
  osc('sawtooth', 110, 90, 0.20, 0.10);
}

export function playChainBind(): void {
  osc('square', 300, 200, 0.15, 0.06);
  osc('sine', 100, 80, 0.25, 0.08);
}
