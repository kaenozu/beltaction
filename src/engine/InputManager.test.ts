import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InputManager } from './InputManager';

describe('InputManager', () => {
  let input: InputManager;

  beforeEach(() => {
    input = new InputManager();
  });

  afterEach(() => {
    // Clean up event listeners added by InputManager constructor
  });

  it('returns default state for unknown player', () => {
    const state = input.getState('nonexistent');
    expect(state).toEqual({
      up: false, down: false, left: false, right: false,
      attack: false, kick: false, jump: false,
    });
  });

  it('returns default state for player1 before any input', () => {
    const state = input.getState('player1');
    expect(state).toEqual({
      up: false, down: false, left: false, right: false,
      attack: false, kick: false, jump: false,
    });
  });

  it('sets left/right on keydown', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    let state = input.getState('player1');
    expect(state.left).toBe(true);
    expect(state.right).toBe(false);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
    state = input.getState('player1');
    expect(state.left).toBe(true);
    expect(state.right).toBe(true);
  });

  it('clears left on keyup', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    expect(input.getState('player1').left).toBe(true);

    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));
    expect(input.getState('player1').left).toBe(false);
  });

  it('handles attack and kick keys', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'j' }));
    expect(input.getState('player1').attack).toBe(true);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));
    expect(input.getState('player1').kick).toBe(true);

    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'j' }));
    expect(input.getState('player1').attack).toBe(false);
    expect(input.getState('player1').kick).toBe(true);
  });

  it('handles space (jump) key for player1', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    expect(input.getState('player1').jump).toBe(true);

    window.dispatchEvent(new KeyboardEvent('keyup', { key: ' ' }));
    expect(input.getState('player1').jump).toBe(false);
  });

  it('handles player2 arrow keys', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(input.getState('player2').left).toBe(true);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(input.getState('player2').right).toBe(true);

    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowLeft' }));
    expect(input.getState('player2').left).toBe(false);
  });

  it('player2 uses o/p for attack/kick', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'o' }));
    expect(input.getState('player2').attack).toBe(true);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p' }));
    expect(input.getState('player2').kick).toBe(true);
  });

  it('ignores keys that are not bound', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z' }));
    const state = input.getState('player1');
    expect(state.attack).toBe(false);
    expect(state.kick).toBe(false);
    expect(state.left).toBe(false);
  });
});
