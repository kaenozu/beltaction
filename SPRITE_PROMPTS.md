# Sprite Generation Prompt Template

## Usage

1. Attach the concept art image(s) to ChatGPT first.
2. Paste the relevant prompt block below.
3. The attached concept art is the primary visual reference. Do not rely on memory or generic Final Fight sprites.
4. If the concept art conflicts with these notes, follow the concept art.

---

## Maki Idle Frame Prompt (First Step)

Attach the Maki concept art before using this prompt. Generate at high resolution so pixel-snapper can downscale cleanly.

```text
Create a pixel-art idle/standing frame for the player character Maki for a side-scrolling arcade beat-em-up game.

Use the attached concept art as the main visual reference for Maki's face, hair, outfit, colors, proportions, and silhouette. Do not invent a different design. Preserve the concept art's proportions and outfit details.

IMPORTANT: Generate at 5x scale for crisp downscaling. The final game uses 160x192 per frame. By generating at 5x, each game pixel becomes a 5x5 block, allowing perfect nearest-neighbor downscale with pixel-snapper.

Technical requirements:
- Single frame (not a strip).
- Frame size: 800x960 pixels (5x scale of 160x192).
- SOLID COLOR BACKGROUND: Use a uniform bright green (#00FF00) or bright pink (#FF00FF) background for easy chroma key removal. No gradients, no anti-aliased edges on the background.
- Side view, facing right.
- Feet aligned to the bottom of the frame.
- Character fills the full frame height (feet at bottom edge, head near top edge).
- Clean pixel art at this 5x scale — each "pixel" should be a crisp 5x5 block, no sub-pixel details, no blur, no gradients, no anti-aliased mush.
- No text, labels, borders, or UI.

Pose:
- Standing / idle pose — ready stance, fists up, slight knee bend, natural standing posture. This is the default pose that will be shown when the character is not moving.
```

---

## Maki Walk Sprite Strip Prompt

Attach the Maki concept art AND the idle frame result as references, so the walk frames match the established design.

```text
Create a pixel-art walk animation strip for the player character Maki for a side-scrolling arcade beat-em-up game.

Use the attached concept art AND the idle frame as the main visual references for Maki's face, hair, outfit, colors, proportions, and silhouette. The walk frames must exactly match the idle frame in style, proportions, color palette, and line thickness.

IMPORTANT: Generate at 5x scale for crisp downscaling. The final game uses 160x192 per frame. By generating at 5x, each game pixel becomes a 5x5 block, allowing perfect nearest-neighbor downscale with pixel-snapper.

Technical requirements:
- 4 frames arranged in a single horizontal row.
- Each frame: 800x960 pixels (5x scale of 160x192).
- Total image size: 3200x960 pixels.
- SOLID COLOR BACKGROUND: Use a uniform bright green (#00FF00). No gradients, no anti-aliased edges on the background.
- Side view, facing right, same perspective as the idle frame.
- Feet aligned to the bottom of each frame.
- Same head height as the idle frame across all 4 walk frames.
- Same body proportions, outfit, and colors as the idle frame.
- Character fills the full frame height (feet at bottom edge, head near top edge).
- Clean pixel art at this 5x scale — each "pixel" should be a crisp 5x5 block, no sub-pixel details, no blur, no gradients, no anti-aliased mush.
- No text, labels, borders, or UI.

Frame layout (left to right):
1. Walk frame 1 — left leg forward, right arm back, body slightly lowered
2. Walk frame 2 — passing pose, arms at sides, legs crossing
3. Walk frame 3 — right leg forward, left arm back, mirror of frame 1
4. Walk frame 4 — returning to neutral stride before looping

The 4 frames must form a seamless looping walk cycle. The head should bob slightly up and down (lower at passing frame 2, higher at extension frames 1 and 3). Keep all 4 frames in the exact same 800x960 bounding box with consistent character placement.
```

---

## Maki Attack Sprite Strip Prompt

Attach the Maki concept art AND the idle frame as references. The attack must match the established design.

```text
Create a pixel-art 3-frame attack animation strip for the player character Maki for a side-scrolling arcade beat-em-up game.

Use the attached concept art AND the idle frame as the main visual references. The attack frames must exactly match the idle/walk frames in style, proportions, color palette, and line thickness.

IMPORTANT: Generate at 5x scale for crisp downscaling. The final game uses 160x192 per frame. By generating at 5x, each game pixel becomes a 5x5 block, allowing perfect nearest-neighbor downscale with pixel-snapper.

Technical requirements:
- 3 frames arranged in a single horizontal row.
- Each frame: 800x960 pixels (5x scale of 160x192).
- Total image size: 2400x960 pixels.
- SOLID COLOR BACKGROUND: Use a uniform bright green (#00FF00). No gradients, no anti-aliased edges on the background.
- Side view, facing right, same perspective as the idle frame.
- Feet aligned to the bottom of each frame. Feet position must be identical across all 3 frames (no stepping).
- Same head height, body proportions, outfit, and colors as the idle frame.
- Character fills the full frame height (feet at bottom edge, head near top edge).
- Center of mass should be the same across all 3 frames and match the idle frame's center.
- Clean pixel art at this 5x scale — each "pixel" should be a crisp 5x5 block, no sub-pixel details, no blur, no gradients, no anti-aliased mush.
- No text, labels, borders, or UI.

Frame layout (left to right):
1. Attack frame 1 (wind-up) — quick jab start, pulling arm back, slight torso twist, feet planted
2. Attack frame 2 (strike) — full extension punch/kick, arm or leg fully extended forward
3. Attack frame 3 (recovery) — returning to neutral stance, arm coming back

The 3 frames should form a fast, snappy attack sequence. The punch/kick should extend to the right (facing direction). Keep the character's center of mass stable — do not lunge forward significantly.
```

---

## Maki Jump Frame Prompt

Attach the Maki concept art AND the idle frame as references. The jump frame must match the established design.

```text
Create a pixel-art jump/airborne frame for the player character Maki for a side-scrolling arcade beat-em-up game.

Use the attached concept art AND the idle frame as the main visual references. The jump frame must exactly match the idle/walk/attack frames in style, proportions, color palette, and line thickness.

IMPORTANT: Generate at 5x scale for crisp downscaling. The final game uses 160x192 per frame. By generating at 5x, each game pixel becomes a 5x5 block, allowing perfect nearest-neighbor downscale with pixel-snapper.

Technical requirements:
- Single frame (not a strip).
- Frame size: 800x960 pixels (5x scale of 160x192).
- SOLID COLOR BACKGROUND: Use a uniform bright green (#00FF00). No gradients, no anti-aliased edges on the background.
- Side view, facing right, same perspective as the idle frame.
- Feet and body floating above the bottom of the frame (character is airborne).
- Same body proportions, outfit, and colors as the idle frame.
- Clean pixel art at this 5x scale — each "pixel" should be a crisp 5x5 block, no sub-pixel details, no blur, no gradients, no anti-aliased mush.
- No text, labels, borders, or UI.

Pose:
- Mid-air tuck / knees-up pose. Arms spread slightly for balance, legs bent upward, body angled slightly forward for forward momentum. Looks like a jumping attack or jump kick.
```

---

## Maki Evade Sprite Strip Prompt

Attach the Maki concept art AND the idle frame as references.

```text
Create a pixel-art 2-frame evade/dodge animation strip for the player character Maki for a side-scrolling arcade beat-em-up game.

Use the attached concept art AND the idle frame as the main visual references. The evade frames must exactly match the idle/walk/attack frames in style, proportions, color palette, and line thickness.

IMPORTANT: Generate at 5x scale for crisp downscaling. The final game uses 160x192 per frame. By generating at 5x, each game pixel becomes a 5x5 block, allowing perfect nearest-neighbor downscale with pixel-snapper.

Technical requirements:
- 2 frames arranged in a single horizontal row.
- Each frame: 800x960 pixels (5x scale of 160x192).
- Total image size: 1600x960 pixels.
- SOLID COLOR BACKGROUND: Use a uniform bright green (#00FF00). No gradients, no anti-aliased edges on the background.
- Side view, facing right, same perspective as the idle frame.
- Feet aligned to the bottom of each frame.
- Same body proportions, outfit, and colors as the idle frame.
- Clean pixel art at this 5x scale — each "pixel" should be a crisp 5x5 block, no sub-pixel details, no blur, no gradients, no anti-aliased mush.
- No text, labels, borders, or UI.

Frame layout (left to right):
1. Evade frame 1 (dodge start) — quick crouch / duck, body lowering, arms tucked in
2. Evade frame 2 (roll recovery) — forward roll / recovery, coming out of roll back to standing

The 2 frames should form a fast dodge roll animation. The character should end the roll in the same standing pose position as frame 1's start.
```

---

## Maki Hurt Frame Prompt

Attach the Maki concept art AND the idle frame as references.

```text
Create a pixel-art hurt/knockback frame for the player character Maki for a side-scrolling arcade beat-em-up game.

Use the attached concept art AND the idle frame as the main visual references. The hurt frame must exactly match the idle/walk/attack frames in style, proportions, color palette, and line thickness.

IMPORTANT: Generate at 5x scale for crisp downscaling. The final game uses 160x192 per frame. By generating at 5x, each game pixel becomes a 5x5 block, allowing perfect nearest-neighbor downscale with pixel-snapper.

Technical requirements:
- Single frame (not a strip).
- Frame size: 800x960 pixels (5x scale of 160x192).
- SOLID COLOR BACKGROUND: Use a uniform bright green (#00FF00). No gradients, no anti-aliased edges on the background.
- Side view, facing right, same perspective as the idle frame.
- Feet aligned to the bottom of the frame.
- Same body proportions, outfit, and colors as the idle frame.
- Clean pixel art at this 5x scale — each "pixel" should be a crisp 5x5 block, no sub-pixel details, no blur, no gradients, no anti-aliased mush.
- No text, labels, borders, or UI.

Pose:
- Knocked back / recoil pose. Body leaning backward, arms flung back or up, one leg slightly lifted or staggered. Face showing shock/pain. This is the single-frame hit reaction.
```

---

## Global Rules for All Sprite Prompts

- Style: 16-bit arcade pixel art, side-scrolling beat-em-up feel, clean hard pixels, no blur, no AI mush.
- Background: transparent checkerboard/alpha background.
- View: side view, character faces right.
- Frame size: **160x192 pixels** per frame (attack poses fit entirely within this box).
- Character height: about 6 heads tall, visible body roughly 180px high inside the 192px frame.
- Keep the same head size, body proportions, color palette, and line thickness across every frame.
- Feet baseline must be consistent: character feet touch the bottom of the frame.
- No text labels, no UI, no watermarks, no extra characters unless requested.
- Export as a clean PNG sprite sheet.
- Use a regular grid with no gaps between frames.
- Sheet dimensions are exact (no extra padding around the grid).

---

## Maki Sprite Sheet Prompt

Attach the Maki concept art before using this prompt.

```text
Create a pixel-art sprite sheet for the player character Maki for a side-scrolling arcade beat-em-up game.

Use the attached concept art as the main visual reference for Maki's face, hair, outfit, colors, proportions, and silhouette. Do not invent a different design. Preserve the concept art's proportions and outfit details.

Technical requirements:
- 4 columns x 3 rows sprite sheet (12 frames total).
- Each frame: 160x192 pixels. Attack poses must fit entirely within this box.
- Total sheet size: 640x576 pixels.
- Transparent background.
- Side view, facing right.
- Feet aligned to the bottom of each frame.
- Consistent origin point at the center-bottom of each frame.
- Clean 16-bit pixel art, no blur, no gradients, no anti-aliased mush.
- No text, labels, borders, or UI.

Frame layout (left to right, top to bottom):

Row 1:
1. (idx 0) Idle — standing pose, ready stance
2. (idx 1) Walk 1 — left leg forward, right arm back
3. (idx 2) Walk 2 — passing pose, arms swinging
4. (idx 3) Walk 3 — right leg forward, left arm back

Row 2:
5. (idx 4) Walk 4 — returning to neutral stride
6. (idx 5) Attack 1 — quick jab / punch start
7. (idx 6) Attack 2 — full extension punch / kick
8. (idx 7) Attack 3 — recovery / follow-through

Row 3:
9. (idx 8) Jump — mid-air tuck / knees up
10. (idx 9) Evade 1 — crouch / dodge start
11. (idx 10) Evade 2 — roll / recovery
12. (idx 11) Hurt — knocked back / recoil
```

---

## Enemy: Basic Thug Sprite Sheet Prompt

Use this after the Maki sprite style is locked.

```text
Create a pixel-art sprite sheet for a basic street thug enemy in the same style as the Maki sprite sheet.

Technical requirements:
- 4 columns x 2 rows sprite sheet (8 cells, first 5 used, last 3 blank).
- Each frame: 160x192 pixels.
- Total sheet size: 640x384 pixels.
- Transparent background.
- Side view, facing left.
- Feet aligned to the bottom of each frame.
- Same visual scale, line thickness, shading as Maki.
- No text, labels, borders, or UI.

Frame layout (left to right, top to bottom):

Row 1:
1. (idx 0) Idle — standing, fists up
2. (idx 1) Walk 1 — left leg forward
3. (idx 2) Walk 2 — right leg forward
4. (idx 3) Attack 1 — wind-up punch

Row 2:
5. (idx 4) Attack 2 — extended punch / recovery
6. (blank) Leave empty with transparent background
7. (blank) Leave empty with transparent background
8. (blank) Leave empty with transparent background

Design direction:
- Generic arcade thug, not a copy of any existing game sprite.
- Slightly larger torso than Maki, but same frame size.
- Readable silhouette at 160x192 pixels.
```

---

## Enemy: Tough Guy Sprite Sheet Prompt

```text
Create a pixel-art sprite sheet for a tougher mid-sized enemy in the same style as the Maki sprite sheet.

Technical requirements:
- 4 columns x 2 rows sprite sheet (8 cells, first 6 used, last 2 blank).
- Each frame: 160x192 pixels.
- Total sheet size: 640x384 pixels.
- Transparent background.
- Side view, facing left.
- Feet aligned to the bottom of each frame.
- Same pixel-art style, palette logic, and shading as the Maki sprite.
- No text, labels, borders, or UI.

Frame layout (left to right, top to bottom):

Row 1:
1. (idx 0) Idle — heavy stance, arms crossed or lowered
2. (idx 1) Walk 1 — heavy step forward
3. (idx 2) Walk 2 — heavy step forward
4. (idx 3) Attack 1 — heavy wind-up

Row 2:
5. (idx 4) Attack 2 — extended heavy hit
6. (idx 5) Attack 3 — recovery
7. (blank) Leave empty with transparent background
8. (blank) Leave empty with transparent background

Design direction:
- Heavier build than the basic thug.
- Strong readable silhouette.
- Arcade beat-em-up proportions, not realistic anatomy.
```

---

## Enemy: Boss Sprite Sheet Prompt

```text
Create a pixel-art sprite sheet for a boss enemy in the same style as the Maki sprite sheet.

Technical requirements:
- 4 columns x 2 rows sprite sheet (8 cells, first 7 used, last 1 blank).
- Each frame: 160x192 pixels.
- Total sheet size: 640x384 pixels.
- Transparent background.
- Side view, facing left.
- Feet aligned to the bottom of each frame.
- Same pixel-art style, palette logic, and shading as the Maki sprite.
- No text, labels, borders, or UI.

Frame layout (left to right, top to bottom):

Row 1:
1. (idx 0) Idle — imposing pose
2. (idx 1) Walk 1 — slow heavy step
3. (idx 2) Walk 2 — slow heavy step
4. (idx 3) Attack 1 — wind-up

Row 2:
5. (idx 4) Attack 2 — strike
6. (idx 5) Attack 3 — follow-through
7. (idx 6) Attack 4 — recovery
8. (blank) Leave empty with transparent background

Design direction:
- Larger presence, fills the frame.
- Distinct silhouette from other enemies.
- Arcade boss scale and proportions.
```

---

## Background Prompt

Use the concept art as the visual direction if backgrounds are included in the attached images.

```text
Create a side-scrolling arcade beat-em-up background in the same visual direction as the attached concept art.

Technical requirements:
- 640x480 pixels.
- Side-scrolling horizontal stage background.
- No UI, no characters, no text.
- Pixel-art style matching the Maki sprite sheet.
- Keep the playable ground area readable.
- Leave the lower 96 pixels relatively open for character movement.

Design direction:
- Japanese urban street / arcade stage mood.
- Strong silhouette, readable foreground, midground, and background layers.
- Use parallax-friendly layers: far buildings, midground signs/structures, foreground street details.
```

---

## Negative Prompt

Add this to any image generation request:

```text
Avoid: blurry pixels, watercolor, 3D render, realistic photo, soft gradients, messy anatomy, extra limbs, extra faces, text labels, UI, watermark, non-transparent background, inconsistent character proportions, inconsistent outfit, inconsistent color palette, oversized head, tiny body, modern fashion unrelated to the concept art.
```
