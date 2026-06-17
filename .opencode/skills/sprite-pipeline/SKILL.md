---
name: sprite-pipeline
description: Use when generating, processing, or integrating new sprite assets. Use when creating new character sprites, hurt/death/down animations, or fixing sprite sizing issues.
---

# Sprite Pipeline

## Overview

This project uses a specific pipeline to create game-ready sprites: AI generate → pixel-snapper (downscale + chroma key) → frame_to_canvas.py (place on 160x192 canvas) → integrate into game code.

### Pipeline Steps

1. **Generate at 5x scale** using SPRITE_PROMPTS.md templates
   - Always use 4-frame strips (3200x960) even if only 1 frame is used
   - Frames 2-4 should be solid green background (#00FF00)
   - The actual frame uses frame 1 (leftmost)
   
2. **Process through pixel-snapper** (downscale from 5x → 1x, remove green background)
   - Output is a tightly cropped PNG with transparency
   - File naming: `frame_1 (N)_clean-pixel-snapper.png`
   
3. **Place onto 160x192 canvas** using frame_to_canvas.py:
   ```
   python tools/frame_to_canvas.py "path/to/pixel-snapper-output.png" "public/assets/<character>_<state>.png"
   ```
   - Places the sprite at native size (no scaling) centered on canvas
   - Scans for non-transparent pixels to align feet to bottom of canvas
   
4. **Update code** to load and use the new sprite
   - Add the import in `src/main.ts`
   - Add the rendering in the entity's `render()` method
   - Add the state transition in the entity's `update()` / state machine

### Common Issues

| Problem | Cause | Fix |
|---|---|---|
| Sprite looks too small in frame | pixel-snapper cropped tightly → content is small | Either scale up in frame_to_canvas.py or regenerate with "fill frame" instruction |
| Feet not aligned to ground | Cropped image doesn't preserve original positioning | frame_to_canvas.py has auto feet-detection (scans bottommost non-transparent pixel) |
| Sprite flickers/disappears | hurtImage not loaded yet, fallback path may show wrong frame | Check loading order in main.ts, ensure hurtImage set before enemy spawns |
| Sprite quality loss after resize | Non-integer nearest-neighbor scaling | Use `Image.NEAREST` for pixel art, or regenerate at correct size |

### Key Files

- `tools/frame_to_canvas.py` — places cropped sprites onto 160x192 canvas
- `SPRITE_PROMPTS.md` — all generation templates
- `public/assets/` — game-ready sprite files
- `src/main.ts` — image loading and sprite assignment
