/*
 * src/engine/InputManager.ts
 * キーボード入力の管理（P1/P2のキーバインドと状態取得）
 * 入力フレーム毎のポーリング方式で、エッジ検出は各エンティティが行う
 * 関連: main.ts（生成）, Player.ts（セット/参照）
 */

export interface KeyBindings {
  up: string;
  down: string;
  left: string;
  right: string;
  attack: string;
  kick: string;
  jump: string;
}

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  attack: boolean;
  kick: boolean;
  jump: boolean;
}

export class InputManager {
  private states: Map<string, InputState> = new Map();
  private bindings: Map<string, KeyBindings> = new Map();
  private keyToPlayerId: Map<string, string> = new Map();
  
  constructor() {
    this.bindings.set('player1', {
      up: 'w', down: 's', left: 'a', right: 'd',
      attack: 'j', kick: 'k', jump: ' '
    });
    this.bindings.set('player2', {
      up: 'w', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight',
      attack: 'o', kick: 'p', jump: 'ArrowUp'
    });
    this.rebuildKeyMap();
    
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
  }
  
  private rebuildKeyMap(): void {
    this.keyToPlayerId.clear();
    for (const [playerId, bindings] of this.bindings) {
      for (const key of Object.values(bindings)) {
        this.keyToPlayerId.set(key, playerId);
      }
    }
  }
  
  private handleKeyDown(e: KeyboardEvent): void {
    const key = e.key;
    const playerId = this.keyToPlayerId.get(key);
    if (!playerId) return;
    if (key === ' ') e.preventDefault();
    const state = this.states.get(playerId) || this.createDefaultState();
    this.updateState(state, key, true, this.bindings.get(playerId)!);
    this.states.set(playerId, state);
  }
  
  private handleKeyUp(e: KeyboardEvent): void {
    const key = e.key;
    const playerId = this.keyToPlayerId.get(key);
    if (!playerId) return;
    const state = this.states.get(playerId) || this.createDefaultState();
    this.updateState(state, key, false, this.bindings.get(playerId)!);
    this.states.set(playerId, state);
  }

  private createDefaultState(): InputState {
    return { up: false, down: false, left: false, right: false, attack: false, kick: false, jump: false };
  }

  private updateState(state: InputState, key: string, value: boolean, bindings: KeyBindings): void {
    if (key === bindings.up) state.up = value;
    if (key === bindings.down) state.down = value;
    if (key === bindings.left) state.left = value;
    if (key === bindings.right) state.right = value;
    if (key === bindings.attack) state.attack = value;
    if (key === bindings.kick) state.kick = value;
    if (key === bindings.jump) state.jump = value;
  }
  
  getState(playerId: string): InputState {
    return this.states.get(playerId) || this.createDefaultState();
  }
}
