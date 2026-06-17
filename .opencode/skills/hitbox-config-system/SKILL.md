---
name: hitbox-config-system
description: Use when editing hitbox configurations, using the hitbox editor tool, or debugging collision detection. Use when adding hitboxes to new entities or adjusting attack/hurt/body boxes.
---

# Hitbox Config System

## Overview

Hitboxes are data-driven via JSON files. `HitboxConfig` defines `body`, `hurt`, and `attack` rectangles relative to the entity's position. The hitbox editor (`tools/hitbox-editor.html`) provides visual editing.

### Data Model

```typescript
interface HitboxConfig {
  frameWidth: number;   // 160
  frameHeight: number;  // 192
  frames: number;       // total frames in spritesheet
  hitboxes: {
    body: HitboxRect;   // collision body (green debug)
    hurt: HitboxRect;   // hurt/damage reception (cyan debug)
    attack: HitboxRect; // attack strike zone (orange debug)
  };
}
```

### Coordinate System

Hitbox coordinates are relative to the entity's top-left corner. `resolveFacingHitbox()` converts them to world coordinates based on the entity's facing direction:

```typescript
// Facing right: x = entity.x + hitbox.x
// Facing left:  x = entity.x + entity.width - hitbox.x - hitbox.w
```

### Visual Debug

Press **B key** in-game to toggle hitbox visualization:
- **Green**: body hitbox
- **Cyan**: hurt hitbox (used for damage reception)
- **Orange**: attack hitbox (only shown on strike frames)

### Hitbox Editor

`tools/hitbox-editor.html` provides:
- Visual editing of hitboxes overlaid on sprite images
- JSON text editing + Apply button
- Load/save preset files from `tools/hitbox-presets/`
- Drag handles to resize hitbox rectangles

Workflow:
1. Open `tools/hitbox-editor.html` in browser
2. Load a preset JSON or edit via text
3. Visual preview shows hitboxes over sprite
4. Save JSON → commit to repo

### Strike Frame Logic

Attack hitboxes are only active on specific frames:
- **Player**: `state === 'attack' && currentFrame === 1` (frame 1 = strike)
- **Enemy**: `state === 'attack' && currentFrame === 1` (frame 1 = strike)

`getAttackHitbox()` returns `null` on non-strike frames → no collision check.

### Key Files

- `src/systems/HitboxConfig.ts` — types, `resolveFacingHitbox()`, presets
- `tools/hitbox-editor.html` — visual editor tool
- `tools/hitbox-presets/maki_attack.json` — Maki hitbox data
- `tools/hitbox-presets/grunt_attack.json` — Grunt hitbox data
