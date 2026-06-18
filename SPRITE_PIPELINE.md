# Sprite Pipeline

This project can use Codex for the repeatable parts of the sprite workflow:

1. Generate or collect a pose image on a flat green or magenta chroma-key background.
2. Convert it to local pixel art with `tools/pixelize_sprite.py`.
3. Normalize single-frame poses with `tools/normalize_maki_sprite.py` when foot baseline matching matters.
4. Combine animation frames with `tools/combine_spritesheet.py`.
5. Tune hitboxes with `tools/hitbox-editor.html`.

## Recommended Commands

Create a pixel-art frame from a generated green-back image:

```powershell
python tools/pixelize_sprite.py input.png output.png --remove-bg --palette public/assets/maki_idle.png --outline
```

For Maki-sized in-game sprites, keep the high-detail default first. Use `--pixel-scale 2` only when a generated source looks too smooth and needs stronger pixelation. Avoid coarse values such as `--pixel-scale 3` for final character sprites because they lose too much detail compared with the current `public/assets/maki_idle.png`.

Create a normalized 160x192 single-frame sprite:

```powershell
python tools/normalize_maki_sprite.py output.png public/assets/maki_idle_v2.png --idle public/assets/maki_idle.png
```

Combine four walk frames into the in-game sheet:

```powershell
python tools/combine_spritesheet.py assets/maki/walk_1.png assets/maki/walk_2.png assets/maki/walk_3.png assets/maki/walk_4.png -o public/assets/maki_spritesheet.png
```

## Generation Prompt Template

Use the concept art in `assets/concept/` as the character reference.

```text
Create a full-body beat-em-up game sprite of Maki in the requested pose.
Use the provided concept art only as the character, outfit, color, and silhouette reference.
Pose: <idle | walk frame 1 | walk frame 2 | attack frame 1 | hurt | down>.
Style: clean anime game character, readable silhouette, high contrast clothing details.
Composition: single character, centered, full body, orthographic side-view, no perspective distortion.
Background: perfectly flat solid #00ff00 chroma-key background.
Constraints: no shadow, no floor, no text, no watermark, no extra characters, no cropped limbs.
Avoid: changing the outfit, changing hair color, props, motion blur, painterly background.
```

After generation, run the local tools above. This keeps the non-deterministic part limited to image generation while Codex owns the repeatable cleanup, pixelization, sizing, and sheet assembly.

## Walk Cycle Notes

For walk sprites, keep the arms natural. Do not ask for fists raised near the chest; that reads like an idle combat stance and looks stiff while walking. Prefer this wording:

```text
Frame layout: four separate full-body frames in a single horizontal row, evenly spaced, showing the same character walking to the right in a compact arcade beat-em-up walk cycle.
Frames: walk contact, passing, opposite contact, recovery.
Arm motion: arms relaxed and slightly bent, hanging lower than the idle stance, swinging naturally with the walk. Do not raise fists near the chest.
Keep body height, head size, outfit, colors, and silhouette consistent across all four frames.
Background: perfectly flat solid #00ff00 chroma-key background.
```

Current preferred local processing for generated walk frames:

```powershell
python tools/pixelize_sprite.py <frame.png> <out.png> --remove-bg --palette public/assets/maki_idle.png --content-scale 0.92 --fit-resample lanczos
python tools/combine_spritesheet.py <frame1.png> <frame2.png> <frame3.png> <frame4.png> -o public/assets/maki_spritesheet_generated.png
```
