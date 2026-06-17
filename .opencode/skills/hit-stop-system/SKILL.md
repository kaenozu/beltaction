---
name: hit-stop-system
description: Use when implementing, tuning, or debugging hit-stop (hit freeze / time stop on impact) mechanics. Use when adding hit-stop to new attack types or adjusting hit-stop duration.
---

# Hit Stop System

## Overview

Hit-stop freezes all entity updates for a brief duration when an attack connects, creating impact feel. The duration is extremely short (typically 0.06s ≈ 3-4 frames at 60fps).

### Architecture

```
Attack connects
  → onHitStop callback fires
  → game.requestHitStop(duration)     // sets hitStopTimer
  → Game.update() checks timer        // if > 0, skip all entity updates
  → render() still runs (no visual freeze)
```

### Game.ts

```typescript
private hitStopTimer: number = 0;

requestHitStop(duration: number): void {
  this.hitStopTimer = Math.max(this.hitStopTimer, duration);
}

private update(dt: number): void {
  if (this.hitStopTimer > 0) {
    this.hitStopTimer = Math.max(0, this.hitStopTimer - dt);
    return;  // skip all entity updates
  }
  // normal update
}
```

- `requestHitStop` uses `Math.max` so overlapping hits extend the timer rather than resetting it
- During hit-stop, `render()` still runs → screen doesn't freeze, just animation/positions pause
- Hit-stop duration doesn't compound with dt (timer subtracts dt directly)

### Wiring

Hit-stop is triggered from two places:

1. **Player hits enemy** — `SpawnSystem.checkPlayerAttack()` → calls `this.onHitStop()`
2. **Enemy hits player** — `Enemy.update()` (attack state) → calls `this.onHitStop?.()`

Both ultimately call `game.requestHitStop(0.06)` via the callback chain:
```
SpawnSystem constructor: (game.requestHitStop(0.06))
  → SpawnSystem.onHitStop = () => game.requestHitStop(0.06)
  → Enemy.onHitStop = SpawnSystem.onHitStop
```

### Tuning

- **0.06s** (current) — subtle, good for fast-paced combat
- **0.10s** — more noticeable, good for heavy hits
- **0.03s** — barely perceptible, good for rapid jabs
- Over 0.15s starts to feel sluggish

### Key Files

- `src/engine/Game.ts` — `hitStopTimer`, `requestHitStop()`, update skip
- `src/main.ts` — initial wiring `() => game.requestHitStop(0.06)`
- `src/systems/SpawnSystem.ts` — `onHitStop` constructor parameter, propagation
- `src/entities/Enemy.ts` — `onHitStop` callback in attack state
