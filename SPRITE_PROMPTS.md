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

CRITICAL: This is a 4-frame strip, NOT a single image. Frame 1 contains the hurt pose; frames 2-4 are solid green background. The hurt frame must be the exact same size and placement as the idle frame — fill the full 160x192 frame, feet at bottom, head near top, body spanning the width.

Technical requirements:
- 4 frames arranged in a single horizontal row. Only frame 1 (leftmost) contains the hurt pose. Frames 2-4 are blank (solid green background).
- Frame size: 800x960 pixels per frame (5x scale of 160x192).
- Total image size: 3200x960 pixels.
- SOLID COLOR BACKGROUND: Use a uniform bright green (#00FF00). No gradients, no anti-aliased edges on the background. Frames 2-4 must be 100% green with NO content.
- Side view, facing right, same perspective as the idle frame.
- Feet aligned to the bottom of the frame.
- Same body proportions, outfit, and colors as the idle frame.
- Clean pixel art at this 5x scale — each "pixel" should be a crisp 5x5 block, no sub-pixel details, no blur, no gradients, no anti-aliased mush.
- No text, labels, borders, or UI.

Pose:
- Hit reaction / flinch pose. Only the upper body and face react — head snaps back slightly, arms flinch upward. The lower body (legs, hips, feet) must stay planted exactly as in the idle frame. No stepping back, no knee bending, no body leaning backward. Just the upper torso and head recoiling from the impact, like the Final Fight Maki hit animation.
```

---

## Maki Light Hurt Frame Prompt

Attach the current in-game Maki idle sprite as the PRIMARY reference. Attach the current in-game hurt sprite as a secondary reference only for general readability.

```text
Create a pixel-art light hurt reaction frame for the player character Maki for a side-scrolling arcade beat-em-up game.

Use the attached current in-game Maki idle sprite as the PRIMARY reference. Match its exact game sprite scale, body height, head size, limb thickness, line thickness, pixel density, shading style, outfit colors, hair volume, boot size, and feet baseline.

IMPORTANT: This is a LIGHT hit reaction, not a heavy knockback, not a head-hit guard, not a death pose, and not a knockdown pose. Maki stays standing on the ground and only reacts a little.

Technical requirements:
- Single full-body frame.
- Final game frame size is 160x192 pixels.
- Generate at 5x scale if possible: 800x960 pixels.
- Solid bright green background (#00FF00) or transparent background if supported cleanly.
- Side view, facing right.
- Feet stay on the same bottom baseline as the idle frame.
- Full body visible inside the frame.
- Same body proportions, costume, colors, and pixel density as the idle frame.
- Clean 16-bit arcade pixel art, crisp hard pixels, no blur, no anti-aliased mush.
- No text, labels, borders, UI, hit sparks, blood, impact effects, or motion lines.

Pose:
- Maki has been hit by a light attack.
- The reaction is small and quick, about half as dramatic as the current heavy-looking hurt frame.
- Upper body recoils only slightly.
- Head tilts back or to the side just a little, not a full snap.
- Shoulders tense, but do not hunch hard.
- One arm flinches slightly upward, the other stays near its normal fighting position.
- Torso twist is mild, not dramatic.
- Hips and legs stay almost exactly in the idle stance.
- Knees may bend just a little, but both feet remain firmly planted.
- Face shows a short sharp pain reaction, but not extreme agony.
- The silhouette should clearly read as "light hit / small stagger."

Avoid:
- Do not make this look like a strong knockback.
- Do not make this look like the head-guard hurt pose.
- Do not make the body bend deeply, fold over, or throw the arms wide.
- Do not change scale, body proportions, or stance width.
```

---

## Maki Alternate Hurt: Head Hit Prompt

Attach the Maki concept art, idle frame, and current hurt frame as references.

```text
Create a pixel-art alternate hurt reaction frame for the player character Maki for a side-scrolling arcade beat-em-up game.

Use the attached Maki concept art, idle frame, and current hurt frame as references. The new hurt frame must exactly match the established Maki sprite style, proportions, outfit, color palette, line thickness, and pixel density.

IMPORTANT: This is an alternate hurt pose, not a death pose and not a knockdown pose. Maki stays standing on the ground.

Technical requirements:
- Single full-body frame.
- Final game frame size is 160x192 pixels.
- Generate at 5x scale if possible: 800x960 pixels.
- Solid bright green background (#00FF00).
- Side view, facing right.
- Feet stay on the same ground baseline as the idle frame.
- Full body visible inside the frame.
- Clean 16-bit arcade pixel art, crisp hard pixels, no blur, no anti-aliased mush.
- No text, labels, borders, UI, hit sparks, blood, impact effects, or cartoon motion lines.

Pose:
- Maki is being struck downward on the head from above.
- Her head is forced down sharply, chin tucked toward the chest.
- Shoulders hunch upward defensively.
- Upper back rounds forward.
- One or both arms lift slightly toward the head as a reflexive guard.
- Knees bend a little from the impact, but both feet remain planted.
- Face shows pain: eyes squeezed shut, mouth open or clenched.
- The silhouette should read clearly as "hit on the head / stunned downward."
- Do not make her lean backward like the existing hurt frame.
- Do not make her fall, kneel, or leave the ground.
```

---

## Maki Alternate Hurt: Abdomen Hit Prompt

Attach the Maki concept art, idle frame, and current hurt frame as references.

```text
Create a pixel-art alternate hurt reaction frame for the player character Maki for a side-scrolling arcade beat-em-up game.

Use the attached Maki concept art, idle frame, and current hurt frame as references. The new hurt frame must exactly match the established Maki sprite style, proportions, outfit, color palette, line thickness, and pixel density.

IMPORTANT: This is an alternate hurt pose, not a death pose and not a knockdown pose. Maki stays standing on the ground.

Technical requirements:
- Single full-body frame.
- Final game frame size is 160x192 pixels.
- Generate at 5x scale if possible: 800x960 pixels.
- Solid bright green background (#00FF00).
- Side view, facing right.
- Feet stay on the same ground baseline as the idle frame.
- Full body visible inside the frame.
- Clean 16-bit arcade pixel art, crisp hard pixels, no blur, no anti-aliased mush.
- No text, labels, borders, UI, hit sparks, blood, impact effects, or cartoon motion lines.

Pose:
- Maki is being struck hard in the abdomen.
- Her torso folds forward around the stomach.
- One arm crosses or clutches the abdomen.
- The other arm hangs or flinches backward from the impact.
- Head dips forward, hair swinging slightly forward.
- Knees bend slightly, but both feet remain planted.
- Face shows pain: eyes squeezed shut, mouth open in a gasp or grimace.
- The silhouette should read clearly as "stomach hit / wind knocked out."
- Do not make her lean backward like the existing hurt frame.
- Do not make her fall, kneel, or leave the ground.
```

---

## Maki Death Frame Prompt

Attach the Maki concept art AND the idle frame as references.

```text
Create a pixel-art death/knockout frame for the player character Maki for a side-scrolling arcade beat-em-up game.

Use the attached concept art AND the idle frame as the main visual references. The death frame must exactly match the idle/walk/attack frames in style, proportions, color palette, and line thickness.

IMPORTANT: Generate at 5x scale for crisp downscaling. The final game uses 160x192 per frame. By generating at 5x, each game pixel becomes a 5x5 block, allowing perfect nearest-neighbor downscale with pixel-snapper.

CRITICAL: This is a 4-frame strip, NOT a single image. Frame 1 contains the death pose; frames 2-4 are solid green background. The death frame must be the exact same size and placement as the idle frame — fill the full 160x192 frame, feet at bottom, head near top, body spanning the width. Same visual scale — same head size, same body proportions, same line thickness, same height as idle.

Technical requirements:
- 4 frames in a single horizontal row. Only frame 1 (leftmost) contains the death pose. Frames 2-4 are blank (solid green background).
- Frame size: 800x960 pixels per frame (5x scale of 160x192).
- Total image size: 3200x960 pixels.
- SOLID COLOR BACKGROUND: Use a uniform bright green (#00FF00). No gradients, no anti-aliased edges on the background. Frames 2-4 must be 100% green with NO content.
- Side view, facing right, same perspective as the idle frame.
- Feet aligned to the bottom of the frame.
- Same body proportions, outfit, and colors as the idle frame.
- Clean pixel art at this 5x scale — each "pixel" should be a crisp 5x5 block, no sub-pixel details, no blur, no gradients, no anti-aliased mush.
- No text, labels, borders, or UI.

Pose:
- Dramatic knockout pose — whole body reacting to a fatal blow. Arms flung wide or up, head thrown back, back arched, legs slightly bent or one foot lifting off the ground. The character should look like they've been hit with massive force and are about to collapse. Dynamic, exaggerated pose that clearly reads as "defeated." Keep feet at the bottom of the frame — character is still on their feet but reeling from the final hit.
```

---

## Maki Down Frame Prompt

Attach the Maki concept art AND the idle frame as references.

```text
Create a pixel-art down/knocked-out frame for the player character Maki for a side-scrolling arcade beat-em-up game. IMPORTANT: Draw the character already lying horizontally on the ground. Do not draw a vertical pose for later rotation.

Use the attached concept art AND the idle frame as the main visual references. The down frame must exactly match the idle/walk/attack frames in style, proportions, color palette, and line thickness.

IMPORTANT: Generate at 5x scale for crisp downscaling. The final game uses 160x192 per frame. By generating at 5x, each game pixel becomes a 5x5 block, allowing perfect nearest-neighbor downscale with pixel-snapper.

CRITICAL: Generate this as a single down pose image. A 4-frame strip is not required for the current pipeline. Keep the full body visible so the game can crop the character from the transparent or green-backed image.

Technical requirements:
- Single full-body down pose.
- Use a solid bright green background (#00FF00) unless transparent background is explicitly requested.
- No gradients, shadows, texture, checkerboard, or anti-aliased edges on the background.
- Horizontal lying-down orientation — character is already on the ground, stretched across the frame width.
- Character aligned to the bottom of the frame, on the ground plane.
- Side view, facing right.
- Same body proportions, outfit, and colors as the idle frame.
- Clean 16-bit arcade pixel art, crisp hard pixels, no blur, no anti-aliased mush.
- No text, labels, borders, or UI.

Pose:
- Knocked down / lying on the ground. Character is sprawled out horizontally, arms and legs limp, head resting near the ground. The body should fill much of the frame width and stay positioned at the bottom edge of the frame.
- Avoid a flat paper-thin result. Keep the torso, hips, head, hair, arms, and legs visibly thick and readable, with the same body volume as the idle sprite. The result should look like a full body lying on the ground, not a compressed horizontal smear.
```

---

## Maki Down Hit Frame Prompt

Attach the Maki concept art AND the idle frame as references.

```text
Create a pixel-art down-hit/ground-hit frame for the player character Maki for a side-scrolling arcade beat-em-up game. This is the pose shown when the player is attacked while already knocked down on the ground. IMPORTANT: Draw the character already lying horizontally on the ground. Do not draw a vertical pose for later rotation.

Use the attached concept art AND the idle frame as the main visual references. The down hit frame must exactly match the down frame in style, proportions, color palette, and line thickness.

CRITICAL: Generate this as a single down-hit pose image. A 4-frame strip is not required for the current pipeline. Keep the full body visible so the game can crop the character from the transparent or green-backed image.

Technical requirements:
- Single full-body down-hit pose.
- Use a solid bright green background (#00FF00) unless transparent background is explicitly requested.
- No gradients, shadows, texture, checkerboard, or anti-aliased edges on the background.
- Horizontal lying-down orientation — same format as the Down frame.
- Character aligned to the bottom of the frame, on the ground plane.
- Side view, facing right.
- Same clothing, colors, and style as the Down frame.
- Clean 16-bit arcade pixel art, crisp hard pixels, no blur, no anti-aliased mush.
- No text, labels, borders, UI, hit marks, impact effects, or cartoon lines.

Pose:
- Getting hit while already lying limp/unconscious on the ground. The body shows impact reaction — arms and legs jerk, head snaps back, body bends at the waist from the force of the blow.
- Face shows strong pain and distress: eyes squeezed shut, eyebrows strained, mouth wide open as if screaming.
- Make the open mouth readable even at pixel-art scale, with a dark mouth shape and a clear expression change from the normal down frame.
- Still looks like the same knocked-down body, just reacting to a hit.
- Avoid a flat paper-thin result. Keep the torso, hips, head, hair, arms, and legs visibly thick and readable, with the same body volume as the idle sprite. The result should look like a full body lying on the ground, not a compressed horizontal smear.
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

## Enemy: Grunt Idle Frame Prompt

No concept art required. Use the detailed description below.

```text
Create a pixel-art 4-frame horizontal strip for a Grunt enemy. Only the first frame (leftmost) contains the idle/standing pose. Frames 2-4 are blank (solid green background). Match the attached Maki idle frame in style, proportions, color palette, and line thickness.

IMPORTANT: Generate at 5x scale for crisp downscaling. The final game uses 160x192 per frame. By generating at 5x, each game pixel becomes a 5x5 block, allowing perfect nearest-neighbor downscale with pixel-snapper.

Technical requirements:
- 4 frames in a single horizontal row. Only frame 1 contains the character. Frames 2-4 are solid green background.
- Frame size: 800x960 pixels per frame (5x scale of 160x192).
- Total image size: 3200x960 pixels.
- SOLID COLOR BACKGROUND: Use a uniform bright green (#00FF00). No gradients, no anti-aliased edges on the background. Frames 2-4 must be 100% green with NO content.
- Side view, facing LEFT (enemies face left, Maki faces right).
- Feet aligned to the bottom of the frame. Character fills the full frame — feet at bottom, head near top, body spanning most of the width.
- Same visual scale, line thickness, and shading style as Maki. The thug should be similar height to Maki, not smaller.
- Clean pixel art at this 5x scale — each "pixel" should be a crisp 5x5 block, no sub-pixel details, no blur, no gradients, no anti-aliased mush.
- No text, labels, borders, or UI.

Visual design (detailed description):
- Generic arcade beat-em-up thug, not a copy of any existing game character.
- Similar height to Maki, slightly broader build.
- Wears a sleeveless vest (green or gray), ripped jeans, and boots.
- Bald or shaved head, mean expression, thick eyebrows.
- Tattoos on arms or shoulders.
- Readable silhouette at game resolution.

Pose:
- Standing idle pose — fists up in an aggressive fighting stance, ready to fight.
```

---

## Enemy: Grunt Walk Strip Prompt

```text
Create a pixel-art 4-frame horizontal strip for a Grunt enemy. Only the first 2 frames contain the walk animation. Frames 3 and 4 are blank (solid green background). Match the attached idle frame in style, proportions, color palette, and line thickness.

IMPORTANT: Generate at 5x scale for crisp downscaling. The final game uses 160x192 per frame. By generating at 5x, each game pixel becomes a 5x5 block.

CRITICAL: The character in every walk frame must be the EXACT SAME SIZE as the attached idle frame. Same head size, same body proportions, same line thickness, same height. Do not enlarge or shrink the character when changing pose.

Technical requirements:
- 4 frames in a single horizontal row. Frames 1-2 contain the character, frames 3-4 are solid green background.
- Frame size: 800x960 pixels per frame (5x scale of 160x192). Character must fill the full frame — feet at bottom, head near top.
- Total image size: 3200x960 pixels.
- SOLID COLOR BACKGROUND: Use a uniform bright green (#00FF00). No gradients, no anti-aliased edges on the background. Frames 3-4 must be 100% green with NO content.
- Side view, facing LEFT. Both walk frames must face LEFT consistently.
- Feet aligned to the bottom of both frames, same baseline as idle frame.
- Same visual scale, line thickness, and shading style as the attached idle frame.
- Clean pixel art — each "pixel" should be a crisp 5x5 block, no blur, no gradients.
- No text, labels, borders, or UI.

Frame layout (left to right):
1. Walk frame 1 — left leg extended forward, right arm forward (stride pose)
2. Walk frame 2 — feet together, arms at sides (passing pose)
3. Blank — solid green background, no character
4. Blank — solid green background, no character

Both frames form a looping walk cycle: stride → passing → stride → passing. Keep the character's center of mass stable — do not shift horizontally between frames.
```

---

## Enemy: Grunt Attack Strip Prompt

```text
Create a pixel-art 4-frame horizontal strip for a Grunt enemy. Only the first 2 frames contain the attack animation. Frames 3 and 4 are blank (solid green background). Match the attached idle frame in style, proportions, color palette, and line thickness.

IMPORTANT: Generate at 5x scale for crisp downscaling. The final game uses 160x192 per frame. By generating at 5x, each game pixel becomes a 5x5 block.

CRITICAL: The character in every attack frame must be the EXACT SAME SIZE as the attached idle frame. Same head size, same body proportions, same line thickness, same height.

Technical requirements:
- 4 frames in a single horizontal row. Frames 1-2 contain the character, frames 3-4 are solid green background.
- Frame size: 800x960 pixels per frame (5x scale of 160x192). Character must fill the full frame — feet at bottom, head near top.
- Total image size: 3200x960 pixels.
- SOLID COLOR BACKGROUND: Use a uniform bright green (#00FF00). No gradients, no anti-aliased edges on the background. Frames 3-4 must be 100% green with NO content.
- Side view, facing LEFT. Both attack frames must face LEFT consistently.
- Feet aligned to the bottom of both frames, same baseline as idle frame.
- Same visual scale, line thickness, and shading style as the attached idle frame.
- Clean pixel art — each "pixel" should be a crisp 5x5 block, no blur, no gradients.
- No text, labels, borders, or UI.

Frame layout (left to right):
1. Attack frame 1 (wind-up) — arm pulled back, body coiled
2. Attack frame 2 (strike) — full extension punch, arm extended forward toward the right
3. Blank — solid green background, no character
4. Blank — solid green background, no character

Both frames form a fast punch sequence. Keep feet planted in both frames (no stepping forward).
```

---

## Enemy: Grunt Hurt Strip Prompt

Attach the Grunt idle frame as reference. Use the same visual design as the Grunt sprite sheet.

```text
Create a pixel-art 2-frame hurt/knockback animation strip for a Grunt enemy. Only the first 2 frames contain the hurt animation. Frames 3-4 are blank (solid green background). Match the attached idle frame in style, proportions, color palette, and line thickness.

IMPORTANT: Generate at 5x scale for crisp downscaling. The final game uses 160x192 per frame. By generating at 5x, each game pixel becomes a 5x5 block.

CRITICAL: The character must be the EXACT SAME SIZE as the attached idle frame. Same head size, same body proportions, same line thickness, same height.

CRITICAL: This is a 4-frame strip. Frame 1 contains the first hurt pose; frame 2 contains the second hurt pose; frames 3-4 are solid green background. The hurt frames must fill the full frame — feet at bottom, head near top, matching the idle frame's size and placement exactly.

Technical requirements:
- 4 frames in a single horizontal row. Frames 1-2 contain the character, frames 3-4 are solid green background.
- Frame size: 800x960 pixels per frame (5x scale of 160x192). Character must fill the full frame — feet at bottom, head near top.
- Total image size: 3200x960 pixels.
- SOLID COLOR BACKGROUND: Use a uniform bright green (#00FF00). No gradients, no anti-aliased edges on the background. Frames 3-4 must be 100% green with NO content.
- Side view, facing LEFT. Both hurt frames must face LEFT consistently.
- Feet aligned to the bottom of both frames, same baseline as idle frame.
- Same visual scale, line thickness, and shading style as the attached idle frame.
- Clean pixel art — each "pixel" should be a crisp 5x5 block, no blur, no gradients.
- No text, labels, borders, or UI.

Frame layout (left to right):
1. Hurt frame 1 — knocked back, upper body recoiling, head snapping back, arms flinching up, feet planted
2. Hurt frame 2 — recovering, body coming back to neutral, arms lowering
3. Blank — solid green background, no character
4. Blank — solid green background, no character

Both frames form a fast hit reaction sequence: impact → recovery. Keep feet planted in both frames.
```

---

## Enemy: Grunt Death Strip Prompt

Attach the Grunt idle frame as reference. Use the same visual design as the Grunt sprite sheet.

```text
Create a pixel-art death/knockout frame for a Grunt enemy. Only frame 1 contains the death pose. Frames 2-4 are blank (solid green background). Match the attached idle frame in style, proportions, color palette, and line thickness.

IMPORTANT: Generate at 5x scale for crisp downscaling. The final game uses 160x192 per frame. By generating at 5x, each game pixel becomes a 5x5 block.

CRITICAL: The character must be the EXACT SAME SIZE as the attached idle frame. Fill the full frame — feet at bottom, head near top.

Technical requirements:
- 4 frames in a single horizontal row. Only frame 1 contains the character, frames 2-4 are solid green background.
- Frame size: 800x960 pixels per frame (5x scale of 160x192). Character must fill the full frame — feet at bottom, head near top.
- Total image size: 3200x960 pixels.
- SOLID COLOR BACKGROUND: Use a uniform bright green (#00FF00). No gradients, no anti-aliased edges on the background. Frames 2-4 must be 100% green with NO content.
- Side view, facing LEFT.
- Feet aligned to the bottom of the frame.
- Same visual scale, line thickness, and shading style as the attached idle frame.
- Clean pixel art — each "pixel" should be a crisp 5x5 block, no blur, no gradients.
- No text, labels, borders, or UI.

Frame layout (left to right):
1. Death frame — dramatic knockout, arms flung, body recoiling, head thrown back
2. Blank — solid green background, no character
3. Blank — solid green background, no character
4. Blank — solid green background, no character
```

---

## Enemy: Grunt Down Strip Prompt

Attach the Grunt idle frame as reference.

```text
Create a pixel-art down/knocked-out frame for a Grunt enemy. Only frame 1 contains the down pose. Frames 2-4 are blank (solid green background). Match the attached idle frame in style, color palette, and line thickness.

IMPORTANT: Generate at 5x scale for crisp downscaling. The final game uses 160x192 per frame. By generating at 5x, each game pixel becomes a 5x5 block.

Technical requirements:
- 4 frames in a single horizontal row. Only frame 1 contains the character, frames 2-4 are solid green background.
- Frame size: 800x960 pixels per frame (5x scale of 160x192).
- Total image size: 3200x960 pixels.
- SOLID COLOR BACKGROUND: Use a uniform bright green (#00FF00). No gradients, no anti-aliased edges on the background. Frames 2-4 must be 100% green with NO content.
- Side view, character lying horizontally on the ground, facing LEFT.
- Character aligned to the bottom of the frame (ground plane at bottom edge).
- Same clothing, colors, and style as the Grunt idle frame.
- Clean pixel art — each "pixel" should be a crisp 5x5 block, no blur, no gradients.
- No text, labels, borders, or UI.

Pose:
- Knocked down / lying face-down or on back on the ground. Limbs sprawled, completely defeated. Body positioned at the bottom edge of the frame.
```

---

## Enemy: Grunt Sprite Sheet Prompt

No concept art required. Use the detailed description below.

```text
Create a pixel-art sprite sheet for a Grunt enemy in the same style as the Maki character (attached concept art reference if available, otherwise follow the detailed description).

IMPORTANT: Generate at 5x scale for crisp downscaling. The final game uses 160x192 per frame. By generating at 5x, each game pixel becomes a 5x5 block, allowing perfect nearest-neighbor downscale with pixel-snapper.

Technical requirements:
- 5 frames arranged in a single horizontal row.
- Frame size: 800x960 pixels per frame (5x scale of 160x192). Character must fill the full frame — feet at bottom, head near top, body spanning most of the width. Do not leave large empty space on left or right.
- Total image size: 4000x960 pixels.
- SOLID COLOR BACKGROUND: Use a uniform bright green (#00FF00). No gradients, no anti-aliased edges on the background.
- Side view, facing LEFT (enemies face left, Maki faces right). All 5 frames must consistently face LEFT — do not flip direction between frames. Feet aligned to the bottom of every frame.
- Same visual scale, line thickness, and shading style as Maki.
- Clean pixel art at this 5x scale — each "pixel" should be a crisp 5x5 block, no sub-pixel details, no blur, no gradients, no anti-aliased mush.
- No text, labels, borders, or UI.

Visual design (detailed description):
- Generic arcade beat-em-up thug, not a copy of any existing game character.
- Slightly taller and broader than Maki, but within the 160x192 frame.
- Wears a sleeveless vest (green or gray), ripped jeans, and boots.
- Bald or shaved head, mean expression, thick eyebrows.
- Tattoos on arms or shoulders.
- Readable silhouette at game resolution.

Frame layout (left to right, 5 frames):
1. (idx 0) Idle — standing, fists up, aggressive stance
2. (idx 1) Walk 1 — left leg extended forward, right arm forward, body slightly lowered
3. (idx 2) Walk 2 — right leg extended forward, left arm forward, mirror of frame 1
4. (idx 3) Attack 1 — wind-up, arm pulled back
5. (idx 4) Attack 2 — full extension punch, arm extended forward

Walk frames 1 and 2 must be clearly different leg positions that alternate to form a recognizable walk cycle. Both walk frames must face LEFT (do not flip to right). Feet must touch the bottom of the frame in all frames.
```

---

## Enemy: Tough Guy Sprite Sheet Prompt

```text
Create a pixel-art sprite sheet for a tougher mid-sized enemy in the same style as the Maki sprite sheet.

IMPORTANT: Generate at 5x scale for crisp downscaling. The final game uses 160x192 per frame. By generating at 5x, each game pixel becomes a 5x5 block, allowing perfect nearest-neighbor downscale with pixel-snapper.

Technical requirements:
- 8 frames arranged in a single horizontal row (not a grid).
- Frame size: 800x960 pixels per frame (5x scale of 160x192). Character must fill the full frame height (feet at bottom edge, head near top edge).
- Total image size: 6400x960 pixels.
- SOLID COLOR BACKGROUND: Use a uniform bright green (#00FF00). No gradients, no anti-aliased edges on the background.
- Side view, facing left, same perspective as the thug enemy.
- Feet aligned to the bottom of each frame.
- Same pixel-art style, palette logic, and shading as the Maki sprite.
- No text, labels, borders, or UI.

Frame layout (left to right, 8 frames total):
1. (idx 0) Idle — heavy stance, arms crossed or lowered
2. (idx 1) Walk 1 — heavy step forward
3. (idx 2) Walk 2 — heavy step forward
4. (idx 3) Attack 1 — heavy wind-up
5. (idx 4) Attack 2 — extended heavy hit
6. (idx 5) Attack 3 — recovery
7. (blank) Leave empty with green background
8. (blank) Leave empty with green background

Design direction:
- Heavier build than the basic thug.
- Strong readable silhouette.
- Arcade beat-em-up proportions, not realistic anatomy.
```

---

## Enemy: Boss Sprite Sheet Prompt

```text
Create a pixel-art sprite sheet for a boss enemy in the same style as the Maki sprite sheet.

IMPORTANT: Generate at 5x scale for crisp downscaling. The final game uses 160x192 per frame. By generating at 5x, each game pixel becomes a 5x5 block, allowing perfect nearest-neighbor downscale with pixel-snapper.

Technical requirements:
- 8 frames arranged in a single horizontal row (not a grid).
- Frame size: 800x960 pixels per frame (5x scale of 160x192). Character must fill the full frame height (feet at bottom edge, head near top edge).
- Total image size: 6400x960 pixels.
- SOLID COLOR BACKGROUND: Use a uniform bright green (#00FF00). No gradients, no anti-aliased edges on the background.
- Side view, facing left, same perspective as other enemies.
- Feet aligned to the bottom of each frame.
- Same pixel-art style, palette logic, and shading as the Maki sprite.
- No text, labels, borders, or UI.

Frame layout (left to right, 8 frames total):
1. (idx 0) Idle — imposing pose
2. (idx 1) Walk 1 — slow heavy step
3. (idx 2) Walk 2 — slow heavy step
4. (idx 3) Attack 1 — wind-up
5. (idx 4) Attack 2 — strike
6. (idx 5) Attack 3 — follow-through
7. (idx 6) Attack 4 — recovery
8. (blank) Leave empty with green background

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
