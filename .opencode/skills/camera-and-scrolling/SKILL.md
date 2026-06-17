---
name: camera-and-scrolling
description: Use when modifying camera behavior, scroll boundaries, parallax rendering, or viewport positioning. Use when the game world needs to scroll or follow the player.
---

# Camera and Scrolling

## Overview

The game world is 2000px wide with a 640px viewport. The camera follows the player using a scroll offset applied to entity rendering. Stage backgrounds use parallax layers at different scroll ratios.

### Architecture

```
main.ts (update loop)
  → stage.setPosition(player.x)     // computes scrollX from player center
  → game.cameraX = stage.getScrollX() // passes offset to Game

Game.ts (render)
  → backgroundEntity.render(ctx)     // no camera offset (handles its own parallax)
  → ctx.save()
  → ctx.translate(-cameraX, 0)       // apply camera offset
  → entities render in world space   // all entities shifted by -cameraX
  → ctx.restore()
```

### StageManager

- `STAGE_WIDTH = 2000` — world boundary
- `setPosition(centerX)` — computes scrollX clamped to `[0, STAGE_WIDTH - 640]`
- `render()` — draws 3 parallax layers:
  - Far (0.5x): sky + distant buildings
  - Mid (0.7x): tall buildings
  - Near (0.9x): street lamps
  - Foreground: ground (no scroll)
- `getScrollX()` — returns current camera offset

### Entity Boundaries

Entities are clamped to the stage boundaries:
- **Player**: `Math.max(0, Math.min(this.x, 2000 - this.width))`
- **Enemy spawn**: `Math.min(spawnX, 2000 - 160)`

### Adding a New Scrolling Feature

1. To scroll a UI element parallax: use `stage.getScrollX() * factor`
2. To change viewport size: update canvas width and `STAGE_WIDTH - canvas.width` bounds
3. To add stage layers: extend `StageManager.render()` with additional parallax layers
4. To add camera smoothing: interpolate `game.cameraX` toward target

### Key Files

- `src/engine/Game.ts` — camera offset applied in `render()`
- `src/stages/StageManager.ts` — parallax rendering, scroll computation
- `src/main.ts` — camera sync in `updateInputs()`
- `src/entities/Player.ts` — X boundary clamp
- `src/systems/SpawnSystem.ts` — spawn position clamp
