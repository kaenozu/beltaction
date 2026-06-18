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
    const key = e.key;
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
    const key = e.key;
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
    if (key === bindings.up) state.up = value;
    if (key === bindings.down) state.down = value;
    if (key === bindings.left) state.left = value;
    if (key === bindings.right) state.right = value;
    if (key === bindings.attack) state.attack = value;
  }
  
  getState(playerId: string): InputState {
    return this.states.get(playerId) || this.createDefaultState();
  }
}