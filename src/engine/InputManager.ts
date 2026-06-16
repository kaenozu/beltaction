export interface KeyBindings {
  up: string;
  down: string;
  left: string;
  right: string;
  attack: string;
}

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  attack: boolean;
}

export class InputManager {
  private states: Map<string, InputState> = new Map();
  private bindings: Map<string, KeyBindings> = new Map();
  
  constructor() {
    this.bindings.set('player1', {
      up: ' ', down: 's', left: 'a', right: 'd',
      attack: 'j'
    });
    this.bindings.set('player2', {
      up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight',
      attack: 'o'
    });
    
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
  }
  
  private handleKeyDown(e: KeyboardEvent): void {
    const key = e.key.toLowerCase();
    for (const [playerId, bindings] of this.bindings) {
      if (Object.values(bindings).includes(key)) {
        if (key === ' ') e.preventDefault();
        const state = this.states.get(playerId) || this.createDefaultState();
        this.updateState(state, key, true, bindings);
        this.states.set(playerId, state);
      }
    }
  }
  
  private handleKeyUp(e: KeyboardEvent): void {
    const key = e.key.toLowerCase();
    for (const [playerId, bindings] of this.bindings) {
      if (Object.values(bindings).includes(key)) {
        const state = this.states.get(playerId) || this.createDefaultState();
        this.updateState(state, key, false, bindings);
        this.states.set(playerId, state);
      }
    }
  }
  
  private createDefaultState(): InputState {
    return { up: false, down: false, left: false, right: false, attack: false };
  }
  
  private updateState(state: InputState, key: string, value: boolean, bindings: KeyBindings): void {
    const lowerKey = key.toLowerCase();
    if (lowerKey === bindings.up.toLowerCase()) state.up = value;
    if (lowerKey === bindings.down.toLowerCase()) state.down = value;
    if (lowerKey === bindings.left.toLowerCase()) state.left = value;
    if (lowerKey === bindings.right.toLowerCase()) state.right = value;
    if (lowerKey === bindings.attack.toLowerCase()) state.attack = value;
  }
  
  getState(playerId: string): InputState {
    return this.states.get(playerId) || this.createDefaultState();
  }
}