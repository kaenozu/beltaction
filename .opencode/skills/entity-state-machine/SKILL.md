---
name: entity-state-machine
description: Use when adding new states to Player or Enemy, changing state transitions, or modifying entity behavior logic. Use for hurt/death/down/idle/walk/attack state changes.
---

# Entity State Machine

## Overview

Both Player and Enemy use a state machine pattern. States control: input handling, physics, animation, and rendering.

### Common States

| State | Description | Input Allowed | Physics |
|---|---|---|---|
| `idle` | Standing still | Yes | Stop |
| `walk` | Moving | Yes | Move speed |
| `attack` | Attacking | No (blocks input) | Stop |
| `hurt` | Taking damage | No | Knockback |
| `death` | Dying animation | No | Knockback + gravity |
| `down` | Lying on ground | No | Stop (grounded) |

### Pattern for Adding a New State

1. **Add to type union** (in `Player.ts` or `Enemy.ts`):
   ```typescript
   state: 'idle' | 'walk' | 'attack' | 'hurt' | 'death' = 'idle';
   ```

2. **Block input** in `handleInput()` (Player) or early-return in `update()` (Enemy):
   ```typescript
   if (this.state === 'death') return;
   ```

3. **Handle state timer expiry** in `updateStateTimer()` / state machine:
   ```typescript
   if (this.stateTimer <= 0 && this.state === 'death') {
     this.active = false;
   }
   ```

4. **Add rendering** in `render()`:
   ```typescript
   if (this.state === 'death' && this.deathImage) {
     // draw with effects
   }
   ```

5. **Wire up external callbacks** (hit effects, hit-stop, death effects):
   ```typescript
   this.onDeath?.(this.x, this.y);
   ```

### Player vs Enemy Differences

| Aspect | Player | Enemy |
|---|---|---|
| State type | `state` (public) | `state` (private, exposed via getter) |
| Input | Read from `InputManager` | AI-driven (distance to player) |
| Timer | `stateTimer` | `stateTimer` |
| Death trigger | Called from Enemy's attack hit | Called from SpawnSystem.checkPlayerAttack |
| Animation | Custom per-state in `updateAnimation()` | Same pattern |

### Key Files

- `src/entities/Player.ts` — player state machine
- `src/entities/Enemy.ts` — enemy state machine
- `src/engine/Game.ts` — entity base class, game loop
